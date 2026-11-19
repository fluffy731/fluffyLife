import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { DEFAULT } from "../lions/data.js";
import { parseTime, fmt12, longDate, effTimes, nowState, normalise, encode, decode, PREFIX, PLAIN, LEGACY, keysIn, parts, leftOf, rowDone, toParts, pickMaster, MAX_PARTS, CHUNK, MAX_UNZIPPED } from "../lions/model.js";
import { gzipSync } from "node:zlib";
import { META } from "../lions/meta.js";

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const COLS = ["d", "s", "l", "v"];

test("the schedule has the committee's 16 rows, in time order, with unique ids", () => {
  const rows = DEFAULT.rows;
  assert.equal(rows.length, 16);
  assert.equal(new Set(rows.map((r) => r.id)).size, rows.length, "row ids must be unique");
  for (const r of rows) assert.match(r.time, /^(\d{2}:\d{2})?$/, `${r.id}: bad time ${r.time}`);
  const eff = effTimes(rows);
  assert.equal(eff[0], "16:00", "the first cue is Preparation at 4:00 pm");
  assert.equal(eff.at(-1), "23:30", "the last cue is the RACV sign-off at 11:30 pm");
  for (let i = 1; i < eff.length; i++) assert.ok(eff[i] >= eff[i - 1], `${rows[i].id}: ${eff[i]} runs before ${eff[i - 1]}`);
  for (const r of rows) assert.ok(r.seg || COLS.some((c) => r[c]), `${r.id}: an empty row`);
});

test("rows with no time of their own take the time above, as in the original sheet", () => {
  const eff = effTimes(DEFAULT.rows);
  const at = (id) => eff[DEFAULT.rows.findIndex((r) => r.id === id)];
  assert.equal(at("r2"), "16:00", "the ball chair's list sits under Preparation");
  assert.equal(at("r7"), "19:30", "Live concert 1st session runs with Entrée service");
});

test("the three evening times the sheet stored as morning times are pm", () => {
  const at = (seg) => DEFAULT.rows.find((r) => r.seg === seg).time;
  assert.equal(at("Auction songs"), "21:50");
  assert.equal(at("3rd Session Songs"), "22:10");
  assert.equal(at("Programme close"), "22:45");
  const times = DEFAULT.fixes.filter((f) => f.kind === "Time");
  assert.equal(times.length, 3, "each time correction is logged");
});

test("every correction is logged, and a typo no longer survives in the cues", () => {
  const all = DEFAULT.rows.flatMap((r) => COLS.map((c) => r[c])).join("\n");
  for (const typo of ["Lactern", "lactern", "Connecterd", "viedoe", "Wirelsss", "Spotlihgt", "HXEA", "participtants", "slient", "converage"]) assert.ok(!all.includes(typo), `${typo} is still in the cues`);
  for (const f of DEFAULT.fixes.filter((x) => x.kind === "Spelling")) assert.ok(f.was && f.now && f.where, `${f.id}: incomplete log entry`);
  assert.ok(DEFAULT.fixes.length >= 20);
});

test("times: forgiving input, 12-hour output", () => {
  assert.equal(parseTime("7pm"), "19:00");
  assert.equal(parseTime("7:30 pm"), "19:30");
  assert.equal(parseTime("6.45pm"), "18:45");
  assert.equal(parseTime("19:30"), "19:30");
  assert.equal(parseTime("1930"), "19:30");
  assert.equal(parseTime("7"), "19:00", "a bare hour in an evening schedule is pm");
  assert.equal(parseTime("12am"), "00:00");
  assert.equal(parseTime("12pm"), "12:00");
  assert.equal(parseTime(""), "");
  for (const bad of ["banana", "25:00", "13pm", "7:75", "0pm"]) assert.equal(parseTime(bad), null, bad);
  assert.equal(fmt12("19:05"), "7:05 pm");
  assert.equal(fmt12("00:30"), "12:30 am");
  assert.equal(fmt12(""), "");
  assert.equal(longDate(DEFAULT.event.date), "Saturday 21 November 2026");
});

test("the live bar: before, early, live (with the next cue), and after", () => {
  const rows = DEFAULT.rows, date = DEFAULT.event.date;
  const b = nowState(rows, date, { date: "2026-11-19", min: 600 });
  assert.equal(b.phase, "before");
  assert.equal(b.days, 2);
  assert.equal(nowState(rows, date, { date, min: 8 * 60 }).phase, "early");
  const live = nowState(rows, date, { date, min: 19 * 60 + 12 });
  assert.equal(live.phase, "live");
  assert.equal(live.cur, 19 * 60, "Formal opening is running at 7:12 pm");
  assert.equal(live.nxt, 19 * 60 + 30, "Entrée service is next");
  const both = nowState(rows, date, { date, min: 19 * 60 + 40 });
  assert.equal(rows.filter((r, i) => both.mins[i] === both.cur).length, 2, "Entrée and the live concert are both running at 7:40 pm");
  assert.equal(nowState(rows, date, { date, min: 23 * 60 + 45 }).nxt, null, "nothing after the sign-off");
  assert.equal(nowState(rows, date, { date: "2026-11-22", min: 60 }).phase, "after");
  assert.equal(nowState(rows, "", { date, min: 60 }).phase, "none");
});

test("the share code round-trips the whole sheet, however it arrives", async () => {
  const edited = structuredClone(DEFAULT);
  edited.rows[4].s = "Lions song 5% \u2014 fade for the MCs. \u4f60\u597d";
  edited.lists[0].items[0].done = true;
  edited.notes = "Bring a spare lectern mic";
  const code = await encode(edited);
  assert.ok(code.startsWith(PREFIX) && code.endsWith("."), "gzipped, with an end marker");
  assert.match(code, /^LIONS3\.[A-Za-z0-9_-]+\.$/, "only link-safe characters");
  assert.ok(code.length < 25000, `a full sheet should stay small: ${code.length}`);
  const want = normalise(edited, DEFAULT);
  assert.deepEqual(await decode(`Here you go:\n${code}\nthanks`, DEFAULT), want, "survives text around it");
  assert.deepEqual(await decode(code.replace(PREFIX, `${PREFIX}\n`).replace(/(.{40})/g, "$1\n"), DEFAULT), want, "survives chat line wrapping");
  assert.equal(await decode(code.slice(0, -1), DEFAULT), null, "a copy that lost its end is refused, not half-loaded");
  assert.equal(await decode(code.slice(0, 200), DEFAULT), null, "a cut-off copy is refused");
  // a link carries the code after # and needs no full stop (chat apps tend to drop one at the end of a link)
  const link = `https://example.test/fluffyLife/lions/#${await encode(edited, { end: false })}`;
  assert.ok(!link.endsWith("."));
  assert.deepEqual(await decode(link, DEFAULT), want, "a link opens");
  assert.deepEqual(await decode(`Open this: ${link} thanks!`, DEFAULT), want, "a link with words after it opens");
  assert.deepEqual(await decode(`${link}.`, DEFAULT), want, "a link whose full stop survived opens too");
  // older formats still open
  const json = JSON.stringify(edited);
  assert.deepEqual(await decode(`${PLAIN}${Buffer.from(json).toString("base64url")}.`, DEFAULT), want, "LIONS2: plain, no compression");
  assert.deepEqual(await decode(`${LEGACY}${Buffer.from(json).toString("base64")}.`, DEFAULT), want, "LIONS1: the first release");
});

test("anything from outside is rebuilt field by field", async () => {
  assert.equal(await decode("nothing here"), null);
  assert.equal(await decode(`${PREFIX}!!!not base64!!!.`), null);
  assert.equal(await decode(`${PREFIX}${gzipSync("{\"rows\":1}").toString("base64url")}.`), null, "valid gzip, wrong shape");
  assert.equal(await decode(`${PLAIN}${Buffer.from("{\"rows\":1}").toString("base64url")}.`), null, "plain, wrong shape");
  const bomb = gzipSync(Buffer.alloc(MAX_UNZIPPED + 1000, 32));
  assert.ok(bomb.length < 20000, "a small code that unzips to far more than any sheet");
  assert.equal(await decode(`${PREFIX}${bomb.toString("base64url")}.`), null, "refused instead of unzipped");
  const hostile = normalise({
    event: { title: "<img src=x onerror=alert(1)>", date: { x: 1 }, __proto__: { polluted: true } },
    rows: [{ id: 5, time: "25:99", seg: "ok", d: { a: 1 }, extra: "drop me" }, "not a row", null],
    lists: [{ title: "L", items: [{ text: "x", done: "yes" }, 7] }],
    fixes: [{ kind: "", where: 1 }],
    notes: 42,
  });
  assert.equal(hostile.event.title, "<img src=x onerror=alert(1)>", "kept as plain text; the page escapes it when drawing");
  assert.equal(hostile.event.date, "");
  assert.equal(hostile.rows.length, 1);
  assert.equal(hostile.rows[0].time, "", "a bad time is dropped");
  assert.equal(hostile.rows[0].d, "");
  assert.ok(!("extra" in hostile.rows[0]));
  assert.equal(hostile.lists[0].items.length, 1);
  assert.equal(hostile.lists[0].items[0].done, false, "only a real true ticks an item");
  assert.equal(hostile.fixes[0].kind, "Note");
  assert.equal(hostile.notes, "");
  assert.ok(!({}).polluted);
});

test("the page is wired up: unlisted, offline-cached, with a manifest and icons", () => {
  const html = read("lions/index.html");
  assert.match(html, /<meta name="robots" content="noindex, nofollow">/, "the page asks search engines not to index it");
  assert.match(html, /<link rel="manifest" href="\.\/manifest\.json">/);
  const manifest = JSON.parse(read("lions/manifest.json"));
  for (const i of manifest.icons) assert.ok(existsSync(new URL(`../lions/${i.src}`, import.meta.url)), `${i.src} is missing`);
  const sw = read("sw.js");
  const wanted = ["lions/", "lions/index.html", "lions/app.js", "lions/model.js", "lions/meta.js", "lions/data.js", "lions/lions.css", "lions/manifest.json", "icons/lions.svg", "icons/lions-180.png", "icons/lions-192.png", "icons/lions-512.png"];
  for (const f of wanted) {
    assert.ok(sw.includes(`"./${f}"`), `sw.js does not cache ${f}`);
    assert.ok(existsSync(new URL(`../${f}`, import.meta.url)), `${f} does not exist`);
  }
  assert.ok(sw.includes('"./lions/index.html"') && sw.includes('path.includes("/lions/")'), "the offline fallback knows /lions/");
  assert.ok(!read("index.html").includes("/lions/"), "unlisted: left off the home page");
  assert.ok(!/claude\.use|window\.claude/.test(read("lions/app.js")), "the Pages build has no Artifact runtime calls");
});

// ---------- the MC script ----------
const SEGS = DEFAULT.script;
const lines = (g, who) => g.items.filter((i) => i.k === "line" && i.who === who);
const CJK = /[㐀-鿿]/;
const TRAD = /[們個說這來還為與會長園團體廣風開關門問題點時間應該實際謝學國務員內動發經對當進樣麼從總]/;
const textOf = (it) => it.text || "";
const fieldKeys = new Set(META.fields.map((f) => f[0]));

test("the script follows the rundown: 13 segments whose times match the run sheet", () => {
  assert.equal(SEGS.length, 13);
  assert.equal(new Set(SEGS.map((g) => g.id)).size, SEGS.length, "segment ids must be unique");
  const runTimes = new Set(effTimes(DEFAULT.rows));
  let last = "";
  for (const g of SEGS) {
    assert.match(g.time, /^\d{2}:\d{2}$/);
    assert.ok(g.time > last, `${g.id} runs before ${last}`);
    assert.ok(runTimes.has(g.time), `${g.seg} at ${g.time} is not a run sheet time`);
    last = g.time;
  }
  const at = (t) => SEGS.find((g) => g.time === t).seg;
  assert.match(at("19:00"), /Formal opening/);
  assert.match(at("19:30"), /concert/i);
  assert.match(at("20:15"), /Sponsor speeches/);
  assert.match(at("21:20"), /auction/i);
  assert.match(at("21:50"), /Auction songs/);
  assert.match(at("22:45"), /close/i);
  const opening = SEGS.find((g) => g.time === "19:00").items.map((i) => i.text || "").join("\n");
  const order = ["Acknowledgment of Country", "Special thanks to our sponsors", "Samantha Wu", "Kori Lo", "Choi Gor and Althea"].map((k) => opening.indexOf(k));
  assert.ok(order.every((n) => n >= 0) && order.every((n, i) => !i || n > order[i - 1]), "the opening follows the run sheet order: Country, sponsors, PDG, President, Ball Chairs");
});

test("every spoken segment has both MCs, and every English line has a Chinese partner", () => {
  for (const g of SEGS) {
    const p = lines(g, "P"), s = lines(g, "S");
    assert.equal(p.length, s.length, `${g.seg}: ${p.length} Paul lines but ${s.length} Salli lines`);
    if (!p.length) assert.ok(g.items.every((i) => i.k !== "line"), `${g.seg}: no spoken lines`);
    p.forEach((line, i) => {
      assert.ok(!CJK.test(textOf(line)), `${g.seg}: Paul's line has Chinese: ${textOf(line)}`);
      assert.ok(CJK.test(textOf(s[i])), `${g.seg}: Salli's line has no Chinese: ${textOf(s[i])}`);
      assert.equal(!!line.when, !!s[i].when, `${g.seg}: line ${i + 1} is conditional in one language only`);
      assert.equal(!!line.tpl, !!s[i].tpl, `${g.seg}: line ${i + 1} is a pattern in one language only`);
      // The same blanks in both languages (the Chinese welcome names the club and the charity in Chinese).
      const norm = (ks) => ks.map((k) => (k === "charityZh" ? "charity" : k)).filter((k) => k !== "clubZh").sort().join(",");
      assert.equal(norm(keysIn(textOf(line))), norm(keysIn(textOf(s[i]))), `${g.seg}: blanks differ between Paul and Salli in line ${i + 1}`);
    });
  }
  assert.ok(SEGS.flatMap((g) => g.items).filter((i) => i.k === "line").length >= 100, "a real script, not an outline");
});

test("the Chinese is simplified, and the English has no leftover template braces", () => {
  for (const g of SEGS) for (const it of g.items) {
    assert.ok(!TRAD.test(textOf(it)), `${g.seg}: traditional characters in ${textOf(it)}`);
    if (it.tpl) assert.ok(!/\{\w+\}/.test(it.text), `${g.seg}: a pattern line must use 〔 〕, not {braces}`);
  }
});

test("every {blank} is a field, every list is a roster, and nothing is invented", () => {
  const rosterKeys = new Set(META.rosters.map((r) => r.key));
  const used = new Set();
  for (const g of SEGS) for (const it of g.items) {
    for (const k of keysIn(textOf(it))) { assert.ok(fieldKeys.has(k), `${g.seg}: {${k}} is not in meta.js`); used.add(k); }
    if (it.when) assert.ok(fieldKeys.has(it.when), `${g.seg}: when:${it.when} is not a field`);
    if (it.k === "list") assert.ok(rosterKeys.has(it.list), `${g.seg}: unknown list ${it.list}`);
  }
  for (const k of fieldKeys) assert.ok(used.has(k), `field ${k} is never used in the script`);
  for (const r of META.rosters) assert.ok(SEGS.some((g) => g.items.some((i) => i.list === r.key)), `roster ${r.key} is never shown in the script`);
  for (const r of META.rosters) assert.equal((DEFAULT.rosters[r.key] || []).length, r.n, `${r.key}: wrong number of blank rows`);
  assert.deepEqual(Object.keys(DEFAULT.fields).sort(), ["crown", "hexa", "rongqiao"], "only facts from the rundown are pre-filled");
  assert.ok(Object.values(DEFAULT.rosters).flat().every((row) => Object.values(row).every((v) => v === "")), "no invented songs, prizes or auction items");
});

test("the script uses the rundown's names and cues", () => {
  const all = SEGS.flatMap((g) => g.items).map(textOf).join("\n");
  for (const name of ["Paul Lai", "Kori Lo", "Choi Gor", "Althea", "Samantha Wu", "Laura", "Ivan", "Eric", "David", "KoChen", "Paul Gor", "Frankie", "Tong", "Kent", "RACV", "St Vincent Institute", "Lion Roar", "Drum", "Everyone is a Superstar"]) assert.ok(all.includes(name), `${name} is missing from the script`);
  assert.equal(DEFAULT.fields.crown, "Crown Melbourne", "the Diamond sponsor from the rundown is pre-filled");
  assert.ok(all.includes("狮子吼") && all.includes("击鼓"), "both games are in Chinese too");
  assert.ok(all.includes("Code of Ethics") && !/industrious application/i.test(all), "the Code of Ethics is cued but not reproduced from memory");
  assert.equal(DEFAULT.lists[1].items.length >= 13, true, "the To confirm list carries the new questions");
});

test("blanks: filled ones show their value, empty ones become TBC chips, and the count is honest", () => {
  const f = { a: "  Sam  ", b: "" };
  assert.deepEqual(parts("Hi {a}, from {b}.", f), [{ t: "text", v: "Hi " }, { t: "val", k: "a", v: "Sam" }, { t: "text", v: ", from " }, { t: "tbc", k: "b" }, { t: "text", v: "." }]);
  assert.deepEqual(keysIn("{x} and {y} and {x}"), ["x", "y"]);
  const left = leftOf(DEFAULT, META);
  const required = META.fields.filter((f2) => !f2[4]).length;
  assert.equal(left.fields.length, required - 3, "the three pre-filled sponsors are not left");
  assert.equal(left.rosters.length, META.rosters.length);
  const filled = structuredClone(DEFAULT);
  filled.rosters.songs1[0] = { singer: "Eric", song: "Song", note: "" };
  filled.fields.charity = "A charity";
  const after = leftOf(filled, META);
  assert.equal(after.total, left.total - 2);
  assert.ok(rowDone(META.rosters[0].cols, filled.rosters.songs1[0]), "the optional intro is not required");
});

test("a copy saved before the script existed picks the script up, and hostile script data is only text", () => {
  const old = structuredClone(DEFAULT);
  delete old.script; delete old.fields; delete old.rosters;
  const n = normalise(old, DEFAULT);
  assert.equal(n.script.length, 13);
  assert.equal(n.fields.crown, "Crown Melbourne");
  assert.equal(Object.keys(n.rosters).length, META.rosters.length);
  assert.equal(normalise(old).script.length, 0, "with no base there is nothing to fall back on");
  const bad = normalise({ rows: [], lists: [], fixes: [], script: [{ id: 1, time: "99:99", items: [{ k: "evil", who: "X", text: { a: 1 }, list: "../x", frm: -5 }, null, "x"] }, 7],
    fields: { ok: "yes", "__proto__": "no", bad: { a: 1 }, "1x": "no" }, rosters: { songs1: [{ singer: "S", __x: "no", n: 5 }, "row"], "../bad": [] } }, DEFAULT);
  assert.equal(bad.script.length, 1);
  assert.equal(bad.script[0].time, "");
  assert.equal(bad.script[0].items.length, 1);
  assert.deepEqual([bad.script[0].items[0].k, bad.script[0].items[0].who, bad.script[0].items[0].text, bad.script[0].items[0].list, bad.script[0].items[0].frm], ["cue", "P", "", "", null]);
  assert.deepEqual(bad.fields, { ok: "yes" });
  assert.deepEqual(Object.keys(bad.rosters), ["songs1"]);
  assert.deepEqual(bad.rosters.songs1, [{ singer: "S" }]);
  assert.ok(!({}).polluted);
});

test("the share code carries the script and the answers", async () => {
  const edited = structuredClone(DEFAULT);
  edited.script[3].items[1].text = "Good evening, everyone. I am Paul.";
  edited.fields.charity = "Children's health";
  edited.rosters.prizes[0] = { prize: "Dinner for two", donor: "A sponsor" };
  const back = await decode(`Updated script:\n${await encode(edited)}\nthanks`, DEFAULT);
  assert.equal(back.script[3].items[1].text, "Good evening, everyone. I am Paul.");
  assert.equal(back.fields.charity, "Children's health");
  assert.equal(back.rosters.prizes[0].prize, "Dinner for two");
  assert.deepEqual(back, normalise(edited, DEFAULT));
});

test("the opening starts with the Acknowledgment of Country, in the words given, before any welcome", () => {
  const g = SEGS.find((x) => x.time === "19:00");
  const spoken = g.items.filter((i) => i.k === "line");
  const ack = "Before we begin tonight’s festivities, I would like to acknowledge the Traditional Custodians of the land on which we gather this evening, the Wurundjeri Woi-wurrung people of the Kulin Nation. We pay our respects to their Elders past and present, and extend that respect to all Aboriginal and Torres Strait Islander peoples here tonight.";
  assert.equal(spoken[0].who, "P");
  assert.equal(spoken[0].text, ack, "Paul's first line is the acknowledgment, word for word");
  assert.equal(spoken[1].who, "S");
  assert.match(spoken[1].text, /库林民族.*Wurundjeri Woi-wurrung/, "Salli's Chinese version names the same people");
  const welcome = g.items.findIndex((i) => /Good evening, ladies and gentlemen/.test(i.text || ""));
  assert.ok(welcome > g.items.indexOf(spoken[1]), "the welcome comes after the acknowledgment");
  assert.ok(!keysIn(ack).length, "no blanks left in the acknowledgment");
  assert.ok(!fieldKeys.has("country"), "the Nation is stated, so the old blank is gone");
  assert.equal(SEGS.flatMap((x) => x.items).filter((i) => /acknowledge the Traditional Custodians/.test(i.text || "")).length, 1, "said once, not twice");
});

// ---------- one-tap sync through the relay ----------
const ev = (message, time) => ({ event: "message", message, time });

test("a big version goes up as parts and comes back as one, only once every part has arrived", async () => {
  const code = await encode(DEFAULT);
  const ps = toParts(code, "abc");
  assert.ok(ps.length > 1 && ps.length <= MAX_PARTS, `${ps.length} parts`);
  assert.ok(ps.every((x) => x.length <= CHUNK + 40), "each part fits the relay's message size");
  assert.equal(pickMaster(ps.map((m, i) => ev(m, 100 + i))).message, code, "in order");
  assert.equal(pickMaster([...ps].reverse().map((m, i) => ev(m, 100 + i))).message, code, "out of order");
  assert.equal(pickMaster(ps.slice(1).map((m, i) => ev(m, 100 + i))), null, "one part missing: not used");
  assert.deepEqual(await decode(pickMaster(ps.map((m) => ev(m, 5))).message, DEFAULT), normalise(DEFAULT, DEFAULT));
  assert.throws(() => toParts("x".repeat(CHUNK * MAX_PARTS + 1), "z"), /too big/);
});

test("the relay picks the newest complete version and ignores everything else", async () => {
  const old = await encode({ ...DEFAULT, notes: "old" }), now = await encode({ ...DEFAULT, notes: "newest" });
  const partsOf = toParts(now, "n1");
  const events = [
    ev(old, 100), ev("hello from someone", 150), { event: "open", time: 160 }, null, { event: "message", message: 42, time: 170 },
    ev(partsOf[0], 200), ev("LIONSC.bad.9.2.xx", 205), ...partsOf.slice(1).map((m, i) => ev(m, 201 + i)),
  ];
  assert.equal(pickMaster(events).message, now, "the newer version wins");
  assert.equal(pickMaster([ev(now, 100), ev(old, 300)]).message, old, "newest by time, not by order");
  assert.equal(pickMaster([ev("hello", 1), { event: "keepalive" }]), null, "nothing published yet");
  const incomplete = pickMaster([ev(old, 100), ev(partsOf[0], 500)]);
  assert.equal(incomplete.message, old, "a half-finished newer upload does not replace a complete older one");
});

test("the Lions page offers sharing like Night to Shine: publish, sync, a link, a banner, Undo", () => {
  const app = read("lions/app.js");
  for (const id of ["sendMaster", "getMaster", "copyLink", "pasteGo", "undoImport", "resetAll", "doImport", "skipImport"]) assert.ok(app.includes(`'${id}'`) || app.includes(`id="${id}"`), `${id} is missing`);
  assert.match(app, /const RELAY = 'https:\/\/ntfy\.sh\/', ROOM = 'lions-2026-11-21-[0-9a-f]{16}'/, "its own room, not Night to Shine's");
  assert.ok(!app.includes("shine-2026"), "the Shine room is not reused");
  assert.match(app, /\^#LIONS/, "opens a link that carries a version");
});
