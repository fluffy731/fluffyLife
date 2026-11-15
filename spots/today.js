// Today: ideas for this moment, what's on, and labels. Pure logic (tested in test/spots-today.test.js):
// no DOM, no network. The feed is spots/feed.json, built by scripts/build-spots.mjs.

// ---------- dates (the phone's local time, which is Melbourne's) ----------
export const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const addDays = (day, n) => { const [y, m, d] = day.split("-").map(Number); return iso(new Date(y, m - 1, d + n)); };
const dateOf = (day) => { const [y, m, d] = day.split("-").map(Number); return new Date(y, m - 1, d); };
const between = (a, b) => Math.round((dateOf(b) - dateOf(a)) / 864e5);
const WEEKDAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const weekdayOf = (day) => WEEKDAY[dateOf(day).getDay()];
const short = (day, year) => { const d = dateOf(day); return `${WEEKDAY[d.getDay()]} ${d.getDate()} ${MONTH[d.getMonth()]}${year ? ` ${d.getFullYear()}` : ""}`; };

// "19:30" -> "7:30 pm", "11:00" -> "11 am"
export function clock(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return `${h % 12 || 12}${m ? `:${String(m).padStart(2, "0")}` : ""} ${h < 12 ? "am" : "pm"}`;
}

// ---------- the moment ----------
export const holidayOn = (feed, day) => (feed && Array.isArray(feed.holidays) ? feed.holidays.find((h) => h.date === day)?.name || null : null);
export const weatherOn = (feed, day) => (feed && Array.isArray(feed.weather) ? feed.weather.find((w) => w.date === day) || null : null);

// A public holiday counts as a Sunday.
export function dayType(at, feed) {
  if (holidayOn(feed, iso(at))) return "sunday";
  return ["sunday", "weekday", "weekday", "weekday", "weekday", "friday", "saturday"][at.getDay()];
}
export function partOf(at) {
  const h = at.getHours();
  return h < 5 ? "late" : h < 8 ? "early" : h < 11 ? "morning" : h < 14 ? "lunch" : h < 17 ? "afternoon" : h < 21 ? "evening" : "late";
}
export const PART_NAME = { early: "early morning", morning: "morning", lunch: "lunchtime", afternoon: "afternoon", evening: "evening", late: "night" };

// ---------- events ----------
export const CAT = {
  market: ["🛍️", "Market"], comedy: ["🎤", "Comedy"], music: ["🎵", "Music"], film: ["🎬", "Film"], theatre: ["🎭", "Theatre"],
  festival: ["🎉", "Festival"], arts: ["🖼️", "Art"], food: ["🍷", "Food and drink"], family: ["🧸", "Family"],
  talk: ["💬", "Talks and workshops"], sport: ["🏟️", "Sport"], outdoors: ["🌳", "Outdoors"], other: ["📅", "Event"],
};
export const catOf = (e) => CAT[e.cat] || CAT.other;
// The stamp's kind when you check in at an event.
export const kindForCat = (cat) => (cat === "food" || cat === "market" ? "eat" : cat === "arts" ? "sights" : "activities");

const span = (e) => (e.from && e.to ? between(e.from, e.to) : 0);
const days = (e) => (Array.isArray(e.days) ? e.days : []);
// Listed for that day by a source, or a short event (three days or less) whose dates cover it.
export const isOnDay = (e, day) => days(e).includes(day) || (!!e.from && !!e.to && e.from <= day && day <= e.to && span(e) <= 3);
export const startOn = (e, day) => (e.next && e.next.startsWith(day) ? e.next.slice(11, 16) : null);
const toMin = (hhmm) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; };

// Most listings run for months, so one-offs and short runs come first, then last chances, then just opened,
// then timed sessions, then the long runs. Free first among equals; outdoor last when rain is likely.
function group(e, day) {
  if (span(e) <= 3) return 0;
  if (e.to && between(day, e.to) <= 3) return 1;
  if (e.from && between(e.from, day) <= 7) return 2;
  if (startOn(e, day)) return 3;
  return 4;
}
export function rank(list, day, { rain = null } = {}) {
  const wet = rain != null && rain >= 60;
  const key = (e) => [group(e, day), wet && e.outdoor ? 1 : 0, e.free ? 0 : 1, startOn(e, day) ? toMin(startOn(e, day)) : 9999];
  return [...list].sort((a, b) => {
    const ka = key(a), kb = key(b);
    for (let i = 0; i < ka.length; i++) if (ka[i] !== kb[i]) return ka[i] - kb[i];
    return a.title.localeCompare(b.title);
  });
}

const EVENING = new Set(["music", "comedy", "theatre", "film", "festival", "food"]);
const NIGHTY = /\b(nights?|twilight|evening|after dark|late|sunset|dinner|moonlight)\b/i;
export const isTonight = (at) => at.getHours() >= 17;

// Still worth showing at this time: a session that hasn't started (or started within the hour, before 5 pm);
// from 5 pm, untimed things only if they're evening kinds.
export function stillOn(e, day, at) {
  const t = startOn(e, day), now = at.getHours() * 60 + at.getMinutes();
  if (t) return toMin(t) >= now - (isTonight(at) ? 15 : 60);
  if (isTonight(at)) return EVENING.has(e.cat) || NIGHTY.test(`${e.title} ${e.blurb || ""}`);
  return true;
}

const matches = (e, filter) => !filter || (filter === "free" ? !!e.free : e.cat === filter);

export function onToday(feed, at, { filter = null } = {}) {
  const day = iso(at);
  const list = (feed && Array.isArray(feed.events) ? feed.events : []).filter((e) => isOnDay(e, day) && stillOn(e, day, at) && matches(e, filter));
  return rank(list, day, { rain: weatherOn(feed, day)?.rain ?? null });
}

// Monday to Friday: this weekend. Saturday and Sunday: tomorrow.
export function nextList(feed, at) {
  const day = iso(at), w = at.getDay(), all = feed && Array.isArray(feed.events) ? feed.events : [];
  if (w === 6 || w === 0) {
    const tmr = addDays(day, 1);
    return { title: "Tomorrow", day: tmr, events: rank(all.filter((e) => isOnDay(e, tmr)), tmr, { rain: weatherOn(feed, tmr)?.rain ?? null }) };
  }
  const sat = addDays(day, 6 - w), sun = addDays(sat, 1);
  const rain = Math.max(weatherOn(feed, sat)?.rain ?? 0, weatherOn(feed, sun)?.rain ?? 0);
  const list = all.filter((e) => (!e.to || e.to >= sat) && (e.weekend === sat || isOnDay(e, sat) || isOnDay(e, sun)));
  return { title: "This weekend", day: sat, events: rank(list, sat, { rain }) };
}

// The short line under an event's title. withDay names the day (for the weekend and tomorrow lists).
export function whenLabel(e, day, { withDay = false } = {}) {
  const pre = withDay ? `${weekdayOf(day)} ` : "";
  const t = startOn(e, day);
  if (!t && withDay && e.next && e.next >= day && between(day, e.next.slice(0, 10)) <= 1) return `${weekdayOf(e.next.slice(0, 10))} ${clock(e.next.slice(11, 16))}`;
  if (t) return pre + clock(t);
  if (e.from === e.to && e.from) return withDay ? `${weekdayOf(e.from)} only` : "Today only";
  if (e.to === day) return withDay ? `Until ${weekdayOf(day)}` : "Last day";
  if (e.from === day) return withDay ? `Opens ${weekdayOf(day)}` : "Opens today";
  if (e.to && between(day, e.to) <= 6) return `Until ${weekdayOf(e.to)}`;
  return e.to ? `Until ${short(e.to, e.to.slice(0, 4) !== day.slice(0, 4)).replace(/^\w+ /, "")}` : "";
}

// "Sun 15 Nov", "Mon 9 Nov – Tue 17 Nov", "Fri 6 Mar – Fri 18 Dec 2026" (the year when it isn't this year).
export function dateRange(e, today) {
  if (!e.from) return "";
  const yr = (d) => d.slice(0, 4) !== today.slice(0, 4);
  if (!e.to || e.to === e.from) return short(e.from, yr(e.from));
  return `${short(e.from, yr(e.from) && e.from.slice(0, 4) !== e.to.slice(0, 4))} – ${short(e.to, yr(e.to))}`;
}

// ---------- ideas for the moment ----------
const P = (mode, extra) => ({ mode, ...extra });
export const IDEAS = {
  breakfast: { emoji: "☕", label: "Quick breakfast", sub: "Open now · 1 h", preset: P("now", { kinds: ["coffee"], minutes: 60 }) },
  coffee: { emoji: "☕", label: "Coffee nearby", sub: "Open now · 1 h", preset: P("now", { kinds: ["coffee"], minutes: 60 }) },
  brunch: { emoji: "🥞", label: "Brunch", sub: "Open now · 2 h", preset: P("now", { kinds: ["coffee", "eat"], minutes: 120 }) },
  lunch: { emoji: "🍜", label: "Quick lunch", sub: "Open now · 1 h", preset: P("now", { kinds: ["eat"], minutes: 60 }) },
  longLunch: { emoji: "🍝", label: "Long lunch", sub: "Open now · 3 h", preset: P("now", { kinds: ["eat", "drink"], minutes: 180 }) },
  museum: { emoji: "🏛️", label: "Gallery or museum", sub: "Indoors · 3 h", preset: P("now", { kinds: ["sights"], minutes: 180 }) },
  fun: { emoji: "🎳", label: "Something fun indoors", sub: "Open now · 3 h", preset: P("now", { kinds: ["activities"], minutes: 180 }) },
  outAbout: { emoji: "🌳", label: "Out and about", sub: "Sights and activities · half day", preset: P("now", { kinds: ["sights", "activities"], minutes: 240 }) },
  dessert: { emoji: "🍨", label: "Dessert run", sub: "Open now · 1 h", preset: P("now", { kinds: ["dessert"], minutes: 60 }) },
  drinks: { emoji: "🍸", label: "After-work drinks", sub: "Open now · 2 h", preset: P("now", { kinds: ["drink"], minutes: 120 }) },
  dinner: { emoji: "🍽️", label: "Dinner nearby", sub: "Open now · 2 h", preset: P("now", { kinds: ["eat"], minutes: 120 }) },
  dinnerDrinks: { emoji: "🥂", label: "Dinner and drinks", sub: "Open now · 3 h", preset: P("now", { kinds: ["eat", "drink"], minutes: 180 }) },
  lateEats: { emoji: "🌙", label: "Late-night eats", sub: "Still open · 30 min drive", preset: P("late", { lateKinds: ["eat", "dessert"], late: 30 }) },
  lateBar: { emoji: "🍸", label: "Bar still open", sub: "Still open · 30 min drive", preset: P("late", { lateKinds: ["drink"], late: 30 }) },
  tomorrow: { emoji: "🗺️", label: "Plan tomorrow", sub: "A day trip somewhere new", preset: P("tomorrow", { where: "surprise", pace: "relaxed", start: "09:00" }) },
};
const EV = { market: "Markets", festival: "Festivals", comedy: "Comedy", music: "Live music", free: "Free things" };
const EV_EMOJI = { market: "🛍️", festival: "🎉", comedy: "🎤", music: "🎵", free: "🆓" };

const MORNING = ["coffee", "ev:free", "museum"];
const TABLE = {
  weekday: { early: ["breakfast", "coffee"], morning: MORNING, lunch: ["lunch", "coffee", "ev:free"], afternoon: ["coffee", "dessert", "museum"],
    evening: ["dinner", "drinks", "ev:comedy", "ev:music"], late: ["lateEats", "lateBar"] },
  friday: { early: ["breakfast", "coffee"], morning: MORNING, lunch: ["lunch", "coffee", "ev:free"], afternoon: ["drinks", "coffee", "dessert"],
    evening: ["dinnerDrinks", "ev:music", "ev:comedy", "tomorrow"], late: ["lateBar", "lateEats"] },
  saturday: { early: ["breakfast", "coffee"], morning: ["brunch", "ev:market", "outAbout"], lunch: ["longLunch", "ev:market", "ev:festival", "outAbout"],
    afternoon: ["outAbout", "ev:festival", "dessert"], evening: ["dinnerDrinks", "ev:music", "ev:comedy", "tomorrow"], late: ["lateBar", "lateEats"] },
  sunday: { early: ["breakfast", "coffee"], morning: ["brunch", "ev:market", "outAbout"], lunch: ["longLunch", "ev:market", "outAbout"],
    afternoon: ["outAbout", "dessert", "ev:festival"], evening: ["dinner", "ev:comedy", "ev:music", "tomorrow"], late: ["lateEats", "lateBar"] },
};

// Up to three ideas for this moment. Rain (60% or more) swaps outdoor ideas for indoor ones; 30° or hotter puts
// gelato first; an events idea shows only when the feed has some on; Plan tomorrow only before a weekend or holiday day.
export function ideasFor(at, feed, { max = 3 } = {}) {
  const day = iso(at), tmr = addDays(day, 1), part = partOf(at), type = dayType(at, feed);
  const wx = weatherOn(feed, day), wxT = weatherOn(feed, tmr);
  const wet = (wx?.rain ?? 0) >= 60, hot = (wx?.max ?? 0) >= 30;
  const tmrFree = [0, 6].includes(dateOf(tmr).getDay()) || !!holidayOn(feed, tmr);
  let ids = [...TABLE[type][part]];
  if (wet) ids = ids.flatMap((id) => (id === "outAbout" ? ["museum", "fun"] : [id]));
  if (hot && ["lunch", "afternoon", "evening"].includes(part)) ids = ["dessert", ...ids.filter((id) => id !== "dessert")];
  if (tmrFree && part === "evening" && !ids.includes("tomorrow")) ids.push("tomorrow");
  if (!tmrFree) ids = ids.filter((id) => id !== "tomorrow");

  const today = onToday(feed, at);
  const out = [];
  for (const id of [...new Set(ids)]) {
    if (out.length >= max) break;
    if (id.startsWith("ev:")) {
      const f = id.slice(3), n = today.filter((e) => matches(e, f)).length;
      if (n) out.push({ id, emoji: EV_EMOJI[f], label: `${EV[f]} ${isTonight(at) ? "tonight" : "on today"}`, sub: `${n} on the list below`, filter: f, count: n });
      continue;
    }
    const idea = { id, ...IDEAS[id], preset: { ...IDEAS[id].preset } };
    if (id === "dessert" && hot) { idea.label = "Gelato weather"; idea.sub = `${wx.max}° today · open now`; }
    if (id === "drinks" && type === "friday") idea.label = "Friday drinks";
    if (id === "tomorrow" && (wxT?.rain ?? 0) >= 60) { idea.preset.where = "town"; idea.sub = `Around town · ${wxT.rain}% rain tomorrow`; }
    if (id === "tomorrow" && holidayOn(feed, tmr)) idea.sub = `${holidayOn(feed, tmr)} · ${idea.preset.where === "town" ? "around town" : "a day trip"}`;
    out.push(idea);
  }
  return out;
}

// The line under the date: "Sunday morning · 🌧 92% · 17°", with the holiday's name when there is one.
export function momentLine(at, feed) {
  const day = iso(at), wx = weatherOn(feed, day), hol = holidayOn(feed, day);
  const name = at.toLocaleDateString("en-AU", { weekday: "long" });
  const bits = [hol ? `${hol} · ${PART_NAME[partOf(at)]}` : `${name} ${PART_NAME[partOf(at)]}`];
  if (wx) bits.push(`${wx.rain >= 60 ? "🌧" : wx.rain >= 30 ? "🌦" : wx.max >= 30 ? "🔥" : "☀️"} ${wx.rain ?? "?"}% rain · ${wx.max ?? "?"}°`);
  return bits.join(" · ");
}
