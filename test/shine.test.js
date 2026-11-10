import { test } from "node:test";
import assert from "node:assert/strict";
import { FIELDS, LISTS, GROUPS, SEGMENTS, RUNSHEET, ENTRANCE, SPEAKER, DEFAULTS } from "../shine/data.js";

const keys = new Set(FIELDS.map((f) => f[0]));
for (const L of Object.values(LISTS)) for (let i = 1; i <= L.n; i++) for (const [c] of L.cols) keys.add(c + i);
const seg2 = (s) => [s.zh, s.en, ...s.items.flatMap((it) => it.slice(1).filter((x) => typeof x === "string"))].join("\n");
const mins = (hm) => { const [h, m] = hm.split(":").map(Number); return h * 60 + m; };
const texts = (it) => (["zh", "en", "SW"].includes(it[0]) ? [it[1]] : ["cue", "crit"].includes(it[0]) ? [it[1], it[2]] : []);

test("every {placeholder} in the script is a TBC field, and every field belongs to a group", () => {
  const groups = new Set(GROUPS.map((g) => g[0]));
  for (const f of FIELDS) assert.ok(groups.has(f[3]), `${f[0]}: unknown group ${f[3]}`);
  for (const [n, L] of Object.entries(LISTS)) assert.ok(groups.has(L.group), `${n}: unknown group`);
  for (const s of SEGMENTS) for (const it of s.items) {
    for (const t of texts(it)) for (const [, k] of t.matchAll(/\{(\w+)\}/g)) assert.ok(keys.has(k), `${s.t} ${s.zh}: {${k}} is not a field`);
    if (it[2]?.if) assert.ok(keys.has(it[2].if), `${s.t}: if:${it[2].if} is not a field`);
    if (it[0] === "list") assert.ok(LISTS[it[1]], `${s.t}: unknown list ${it[1]}`);
  }
  const used = new Set(SEGMENTS.flatMap((s) => s.items.flatMap((it) => texts(it).flatMap((t) => [...t.matchAll(/\{(\w+)\}/g)].map((m) => m[1])))));
  for (const f of FIELDS) assert.ok(used.has(f[0]), `${f[0]} is never used in the script`);
});

test("segments run back to back from 6:30 to 10:00 and follow the updated run sheet", () => {
  for (let i = 0; i < SEGMENTS.length; i++) {
    const s = SEGMENTS[i];
    assert.ok(mins(s.e) > mins(s.t), `${s.t}: ends before it starts`);
    if (i) assert.equal(s.t, SEGMENTS[i - 1].e, `${s.t} ${s.zh} should start when the last segment ends`);
  }
  assert.equal(SEGMENTS[0].t, "18:30");
  assert.equal(SEGMENTS.at(-1).e, "22:00");
  const at = (t) => SEGMENTS.find((s) => s.t === t);
  // Organiser's run sheet of 4 Nov: entrance 7:02, Eric 8:00 and 8:50, sales + draw 8:10–8:50 (two rounds in the script),
  // awards 8:20, Victoria 8:30, Tian 8:35, cake and group photo 9:00, live band 9:10.
  assert.match(at("19:02").zh, /女神入场/);
  assert.equal(at("19:05").e, "19:15", "the President and VP keep their 10 minutes");
  assert.match(at("20:00").zh, /Eric/);
  assert.match(at("20:10").zh, /义卖.*抽奖/);
  assert.match(at("20:20").zh, /尼泊尔/);
  assert.match(at("20:30").zh, /Victoria/);
  assert.match(at("20:35").zh, /Tian/);
  assert.match(at("20:40").zh, /抽奖/);
  assert.equal(at("20:40").e, "20:50", "the draw finishes by 8:50");
  assert.match(at("20:50").zh, /Eric/);
  assert.match(at("21:00").zh, /蛋糕/);
  assert.match(at("21:10").en, /Live band/);
  const opening = at("19:00").items.map((it) => it[1]).join(" ");
  assert.match(opening, /8 点 10 分开始抽奖/);
  assert.match(opening, /at 8:10/);
  assert.match(opening, /只限购买了抽奖券/, "the opening must say the draw is for ticket holders only");
  assert.match(opening, /two men/, "the warm-up comes before Tian");
  assert.ok(opening.indexOf("two men") < opening.indexOf("Please welcome Tian"), "warm-up first, then Tian");
  // Walk-in starts on the chorus 「我是女神」, President first, members last.
  assert.match(ENTRANCE[1][0] + ENTRANCE[1][1], /我是女神.*会长/);
  assert.match(ENTRANCE[2][1], /副会长.*理事.*会员/);
  // The two draw rounds cover prizes 1–10 exactly once.
  const drawn = SEGMENTS.flatMap((s) => s.items).filter((it) => it[0] === "list" && it[1] === "prizes")
    .flatMap(([, , o]) => Array.from({ length: o.to - o.from + 1 }, (_, j) => o.from + j));
  assert.deepEqual(drawn, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  for (const [t] of RUNSHEET) assert.match(t, /^\d{2}:\d{2}$/);
  const shared = RUNSHEET.filter(([t]) => SEGMENTS.some((s) => s.t === t)).length;
  assert.ok(shared >= 15, `script and run sheet share only ${shared} start times`);
});

test("Chinese lines are simplified characters and English lines have no Chinese", () => {
  const TRAD = /[們個這來說會長為與對時間謝歡請頒發獎樂隊誕禮員臺義賣聖點鐘閃華開關門車書東無經認領隨當後從麼還進邊過運動電話題頭體]/;
  for (const s of SEGMENTS) {
    assert.doesNotMatch(s.zh + s.at[0], TRAD, `${s.t}: traditional character in the heading`);
    for (const it of s.items) {
      if (it[0] === "zh" || it[0] === "SW") assert.doesNotMatch(it[1], TRAD, `${s.t}: traditional character in "${it[1]}"`);
      if (it[0] === "cue" || it[0] === "crit") assert.doesNotMatch(it[1], TRAD, `${s.t}: traditional character in cue "${it[1]}"`);
      if (it[0] === "en") assert.doesNotMatch(it[1].replace(/《女神》/g, ""), /[㐀-鿿]/, `${s.t}: Chinese in an English line "${it[1]}"`);
      if (it[0] === "zh") assert.match(it[1], /[㐀-鿿]|^\{\w+\}$/, `${s.t}: a Chinese line has no Chinese "${it[1]}"`);
    }
  }
});

test("10 Nov: Solomon speaks English and Wade speaks Mandarin, and that is the only place it is decided", () => {
  assert.deepEqual(SPEAKER, { zh: "W", en: "S" });
  assert.deepEqual(Object.values(SPEAKER).sort(), ["S", "W"], "each MC speaks exactly one language");
  for (const it of SEGMENTS.flatMap((s) => s.items)) assert.ok(!["S", "W"].includes(it[0]), `line tags are languages now, found "${it[0]}"`);
});

test("every segment has both languages, and both MCs speak in every spoken segment", () => {
  for (const s of SEGMENTS) {
    assert.ok(s.zh && s.en && s.at?.length === 2, `${s.t}: needs zh, en and at`);
    const langs = new Set(s.items.map((it) => it[0]).filter((l) => l === "zh" || l === "en"));
    const spoken = s.items.some((it) => ["zh", "en", "SW"].includes(it[0]));
    if (spoken) assert.ok(langs.has("zh") && langs.has("en"), `${s.t} ${s.zh}: both MCs should speak`);
  }
  assert.ok(ENTRANCE.every((r) => r.length === 3 && r.every(Boolean)), "entrance cue rows need a cue, zh and en");
});

test("10 Nov updates: prices, Calico, District leaders, videos, Salli, Best Dress and November birthdays", () => {
  const flat = SEGMENTS.flatMap((s) => [s.zh, s.en, ...s.items.flatMap((it) => it.slice(1).filter((x) => typeof x === "string"))]).join("\n");
  const at = (t) => SEGMENTS.find((s) => s.t === t);
  const seg = (t) => [at(t).zh, at(t).en, ...at(t).items.flatMap((it) => it.slice(1).filter((x) => typeof x === "string"))].join("\n");
  // Prices: raffle $5, pins $20, bears $20 (one donated; two for $40, one taken home).
  assert.doesNotMatch(flat, /15 澳元|pins at \$15/, "pins are $20, not $15");
  assert.match(flat, /徽章 20 澳元/);
  assert.match(flat, /pins at \$20/);
  assert.match(seg("20:10"), /buy two for \$40/);
  assert.match(seg("20:10"), /买两只共 40 澳元/);
  // Calico replaces the band-name placeholder and is introduced at about 6:45.
  assert.match(seg("18:30"), /Zayne Guo[\s\S]*Fujia Luo[\s\S]*Yolanda Li/);
  assert.doesNotMatch(flat, /\{band\}/);
  // The three District leaders by name.
  for (const n of ["Sheryl Li", "Samantha Wu", "Gita Khatri"]) assert.match(flat, new RegExp(n));
  assert.match(seg("19:20"), /Ziggy and Dewey/);
  // 7:15 and 7:50 were crossed out on the run sheet: no food announcements, a band interlude and five videos instead.
  assert.doesNotMatch(flat, /Entrée|Main course|前菜|主菜/);
  assert.match(at("19:15").en, /Band interlude/);
  assert.match(at("19:50").zh, /视频/);
  assert.match(seg("19:50"), /five short videos/);
  // Two long-service awards, Nepal awards are six, and the Best Dress prize comes before the cake.
  assert.equal(LISTS.nepal.n, 6);
  assert.match(seg("20:20"), /10-Year Long Service Award/);
  assert.match(seg("20:20"), /20-Year Long Service Award/);
  assert.match(seg("20:20"), /President, Salli Hon, to receive the 10-Year/);
  assert.ok(seg("20:20").indexOf("Salli") < seg("20:20").indexOf("Bobo"), "Salli's ten years come before Bobo's twenty");
  assert.doesNotMatch(SEGMENTS.map(seg2).join("\n"), /Sally/, "the spelling is Salli");
  assert.match(seg("20:50"), /Best Dress/);
  assert.match(seg("21:00"), /November birthday/);
  assert.match(seg("21:00"), /十一月生日/);
  assert.match(seg("20:35"), /A Million Dreams/);
  // The two-man opener fills 6:50 to 7:00 with a suggested interactive show and hands over at 7:00 sharp.
  assert.equal(at("18:50").e, "19:00");
  assert.match(seg("18:50"), /Suggested format/);
  for (const r of ["Round 1", "Round 2", "Round 3", "Round 4"]) assert.match(seg("18:50"), new RegExp(r));
  assert.match(seg("18:50"), /7:00 sharp/);
  assert.match(seg("18:50"), /other end of the (venue|room)/);
});

test("10 Nov answers: Salli Hon is President, Gita speaks and runs the oath, Melvin Jones, two reasons for Goddess", () => {
  const flat = SEGMENTS.flatMap((s) => s.items.flatMap((it) => it.slice(1).filter((x) => typeof x === "string"))).join("\n");
  const at = (t) => SEGMENTS.find((s) => s.t === t);
  const seg = (t) => [at(t).zh, at(t).en, ...at(t).items.flatMap((it) => it.slice(1).filter((x) => typeof x === "string"))].join("\n");
  assert.match(seg("19:05"), /President, Salli Hon/);
  // 7:20 Gita's speech; 7:25 Gita calls the eight names and each answers "I do".
  assert.match(seg("19:20"), /Gita, the floor is yours/);
  assert.match(seg("19:25"), /Gita calls them one by one/);
  assert.match(seg("19:25"), /I do/);
  assert.match(seg("19:25"), /Gita, over to you/);
  assert.match(seg("19:25"), /Sheryl Li/);
  assert.doesNotMatch(flat, /Sherry|Sheri\b|李慈/, "the spelling is Sheryl");
  // Six Nepal awards are Melvin Jones Fellowships.
  assert.match(seg("20:20"), /Melvin Jones Fellowships, presented by Vice District Governor Gita Khatri/);
  assert.match(seg("20:20"), /landslide/);
  assert.match(seg("20:20"), /山体滑坡/);
  assert.equal((seg("20:20").match(/presented by Gita/g) || []).length, 2, "Gita also presents Salli's and Bobo's awards");
  assert.equal(LISTS.nepal.n, 6);
  // Goddess has two reasons: Tian's song and an all-female club.
  assert.match(seg("19:00"), /Two reasons/);
  assert.match(seg("19:00"), /all-female club/);
  assert.match(seg("19:00"), /全女性会员/);
  // Best Dress is judged by the President, Salli.
  assert.match(seg("20:50"), /judged by our President, Salli/);
  assert.match(seg("20:50"), /会长 Salli 亲自评选/);
  // Resolved questions are no longer fields.
  const keys = FIELDS.map((f) => f[0]);
  for (const k of ["pres", "oathBy", "oathLang", "act", "sallyName", "distName", "band", "nepalBy", "boboBy"]) assert.ok(!keys.includes(k), `${k} should be gone`);
});

test("10 Nov documents: defaults come from the sponsor slide, name pins and Operation Bear flyer", () => {
  for (const k of Object.keys(DEFAULTS)) assert.ok(keys.has(k), `default for unknown field ${k}`);
  assert.equal(DEFAULTS.vp, "Mireille Leong");
  assert.equal(DEFAULTS.bearCharity, "Operation Bear");
  assert.equal(DEFAULTS.sponsors.split(", ").length, 10, "ten sponsors on the thank-you slide");
  // Eight oath-takers are the ten officers without the President and Vice President; the Communications Chairman's name is left blank.
  const board = Array.from({ length: LISTS.board.n }, (_, j) => DEFAULTS["board" + (j + 1)]);
  assert.equal(LISTS.board.n, 8);
  assert.deepEqual(board.map((b) => !!b), [true, true, true, true, false, true, true, true]);
  assert.ok(!Object.values(DEFAULTS).some((v) => /Salli Hon/.test(v)), "the President speaks separately and is not in the oath list");
  const flat = SEGMENTS.flatMap((s) => s.items.flatMap((it) => it.slice(1).filter((x) => typeof x === "string"))).join("\n");
  assert.doesNotMatch(flat, /Bobo, \{boboName\}|Bobo（\{boboName\}）/, "Bobo's full name is used on its own");
  assert.match(flat, /Operation Bear teddy bears at \$20/);
  assert.match(flat, /Victoria Police, Ambulance Victoria, the CFA, the SES and hospitals/);
  assert.doesNotMatch(flat, /recover after accidents/);
});
