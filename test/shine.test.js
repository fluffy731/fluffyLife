import { test } from "node:test";
import assert from "node:assert/strict";
import { FIELDS, LISTS, GROUPS, SEGMENTS, RUNSHEET, ENTRANCE, SPEAKER, DEFAULTS, NOTES } from "../shine/data.js";

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
  // Organiser's run sheet of 13 Nov: guests to seats 6:45, entrance 7:02, President and VP 7:07, Samsam 7:17, Gita 7:20, oath 7:25,
  // Sheryl 7:50, videos 7:54, Eric 8:00 and 8:50, sales 8:07, draws 8:15 and 8:42, awards 8:20, Victoria 8:30, Tian 8:35,
  // Best Dress 8:55, birthdays 9:05, cake 9:11, total and live band 9:15.
  assert.match(at("18:45").zh, /入座/);
  assert.match(at("19:02").zh, /女神入场/);
  assert.equal(at("19:06").e, "19:17", "the President and VP keep their 10 minutes after Tian is thanked");
  assert.match(at("19:17").zh, /Samantha/);
  assert.match(at("19:20").zh, /Gita/);
  assert.match(at("19:50").zh, /Sheryl/);
  assert.match(at("20:00").zh, /Eric/);
  assert.match(at("20:07").zh, /义卖/);
  assert.match(at("20:15").zh, /抽奖/);
  assert.match(at("20:20").zh, /Melvin Jones/);
  assert.match(at("20:30").zh, /Victoria/);
  assert.match(at("20:35").zh, /Tian/);
  assert.match(at("20:40").zh, /抽奖/);
  assert.equal(at("20:40").e, "20:50", "the second draw finishes by 8:50");
  assert.match(at("20:50").zh, /Eric/);
  assert.match(at("20:55").zh, /Best Dress/);
  assert.match(at("21:05").zh, /生日/);
  assert.match(at("21:11").zh, /蛋糕/);
  assert.match(at("21:15").zh, /筹款总额/);
  assert.match(at("21:15").en, /Live band/);
  const opening = at("19:00").items.map((it) => it[1]).join(" ");
  assert.match(opening, /8 点 15 分第一轮/);
  assert.match(opening, /the first at about 8:15/);
  assert.match(opening, /只限购买了抽奖券/, "the opening must say the draw is for ticket holders only");
  assert.match(opening, /very first She Rises event/, "the warm-up comes before Tian");
  assert.ok(opening.indexOf("very first She Rises event") < opening.indexOf("Please welcome Tian"), "warm-up first, then Tian");
  assert.doesNotMatch(opening, /two men/, "the two-man opener already makes the backup joke; the 7:00 opening does not repeat it");
  // Walk-in starts on the line Mireille chose, President first, then VP, committee and charter members.
  assert.match(ENTRANCE[1][0] + ENTRANCE[1][1], /Mireille 选定.*会长/);
  assert.match(ENTRANCE[2][1], /副会长.*理事.*charter members/);
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
    // A line's speaker is its { who } override if it has one, otherwise the MC who speaks its language; "SW" is both.
    const speakers = new Set(s.items.filter((it) => ["zh", "en", "SW"].includes(it[0])).flatMap((it) => (it[0] === "SW" ? ["S", "W"] : [it[2]?.who || SPEAKER[it[0]]])));
    const spoken = s.items.some((it) => ["zh", "en", "SW"].includes(it[0]));
    if (spoken) assert.ok(speakers.has("S") && speakers.has("W"), `${s.t} ${s.zh}: both MCs should speak`);
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
  assert.match(seg("20:07"), /buy two for \$40/);
  assert.match(seg("20:07"), /买两只共 40 澳元/);
  // Calico replaces the band-name placeholder and is introduced at about 6:45.
  assert.match(seg("18:30"), /Zayne Guo[\s\S]*Fujia Luo[\s\S]*Yolanda Li/);
  assert.doesNotMatch(flat, /\{band\}/);
  // The three District leaders by name.
  for (const n of ["Sheryl Li", "Samantha Wu", "Gita Khatri"]) assert.match(flat, new RegExp(n));
  assert.match(seg("19:20"), /Ziggy and Dewey/);
  // The 7:15 entrée and 7:50 main course are venue items: the MCs never say them out loud. Three or four overseas clips follow Sheryl.
  const spoken = SEGMENTS.flatMap((s) => s.items).filter((it) => ["zh", "en", "SW"].includes(it[0])).map((it) => it[1]).join("\n");
  assert.doesNotMatch(spoken, /entrée|main course|前菜|主菜/i);
  assert.match(at("19:54").zh, /视频/);
  assert.match(seg("19:54"), /Lions club presidents overseas/);
  assert.match(seg("19:54"), /Three or four clips/);
  assert.doesNotMatch(flat, /five short videos|五条|5 条/, "the run sheet now has 3–4 clips");
  // Two long-service awards, seven Melvin Jones awards, and the Best Dress prize comes before the birthdays and the cake.
  assert.equal(LISTS.nepal.n, 7);
  assert.match(seg("20:20"), /10-Year Long Service Award/);
  assert.match(seg("20:20"), /20-Year Long Service Award/);
  assert.match(seg("20:20"), /President, Salli Hon, to receive the 10-Year/);
  assert.ok(seg("20:20").indexOf("Salli") < seg("20:20").indexOf("Bobo"), "Salli's ten years come before Bobo's twenty");
  assert.doesNotMatch(SEGMENTS.map(seg2).join("\n"), /Sally/, "the spelling is Salli");
  assert.match(seg("20:55"), /Best Dress/);
  assert.match(seg("21:05"), /November birthday/);
  assert.match(seg("21:05"), /十一月生日/);
  assert.match(seg("20:35"), /\{tianEn\}/, "Tian's English song comes from the TBC field");
  // The two-man opener fills 6:50 to 7:00 and runs straight into the 7:00 opening. 12 Nov: it is Solomon's three-act banter.
  assert.equal(at("18:50").e, "19:00");
  assert.match(seg("18:50"), /leaves 6:50 to 7:00 blank/, "the run sheet leaves 6:50 to 7:00 blank and the cue says so");
  assert.match(seg("18:50"), /straight into the (7:00|formal) opening/);
  assert.doesNotMatch(seg("18:50") + seg("19:00"), /Backup Crew Audition|后援团大考/, "the audition format is replaced by the banter");
});

test("10 Nov answers: Salli Hon is President, Gita speaks and runs the oath, Melvin Jones, two reasons for Goddess", () => {
  const flat = SEGMENTS.flatMap((s) => s.items.flatMap((it) => it.slice(1).filter((x) => typeof x === "string"))).join("\n");
  const at = (t) => SEGMENTS.find((s) => s.t === t);
  const seg = (t) => [at(t).zh, at(t).en, ...at(t).items.flatMap((it) => it.slice(1).filter((x) => typeof x === "string"))].join("\n");
  assert.match(seg("19:06"), /President, Salli Hon/);
  // 7:20 Gita's speech; 7:25 Gita calls every name on the committee list and each answers "I do". Sheryl speaks later, at 7:50.
  assert.match(seg("19:20"), /Gita, the floor is yours/);
  assert.match(seg("19:25"), /calls them one by one/);
  assert.match(seg("19:25"), /I do/);
  assert.match(seg("19:25"), /Gita, over to you/);
  assert.doesNotMatch(seg("19:25"), /Sheryl/, "Sheryl no longer speaks after the oath");
  assert.match(seg("19:50"), /Sheryl Li/);
  assert.match(seg("19:50"), /3 minutes/);
  assert.doesNotMatch(flat, /Sherry|Sheri\b|李慈/, "the spelling is Sheryl");
  // 11 Nov meeting: Sheryl presents the seven Melvin Jones awards, Gita the two Long Service Awards; Nepal's money is a cheque.
  assert.match(seg("20:20"), /Sheryl Li, presents seven Melvin Jones Fellowships/);
  assert.equal((seg("20:20").match(/presented by Gita/g) || []).length, 1, "Gita presents Salli's and Bobo's awards together");
  assert.match(seg("20:20"), /\{chequeBy\}/);
  assert.doesNotMatch(seg("20:20"), /In just one week|短短一个星期/, "Salli's card says two weeks and she covers it");
  assert.equal(LISTS.nepal.n, 7);
  // Goddess has two reasons: Tian's song and a women's growth club (13 Nov: no longer "all-female").
  assert.match(seg("19:00"), /Two reasons/);
  assert.match(seg("19:00"), /women's growth club/);
  assert.doesNotMatch(seg("19:00"), /all-female/i);
  assert.match(seg("19:00"), /女性成长的狮子会/);
  assert.doesNotMatch(seg("19:00"), /全女性/);
  // Best Dress is now judged by applause: no winner field, cash 100 / 50 / 20, two bottles of wine, three women and two men.
  assert.match(seg("20:55"), /judged by applause/);
  assert.match(seg("20:55"), /\$100 \/ \$50 \/ \$20/);
  assert.match(seg("20:55"), /bottle of wine/);
  assert.match(seg("20:55"), /three women and two men/);
  assert.match(seg("20:55"), /not eligible/);
  // Resolved questions are no longer fields.
  const keys = FIELDS.map((f) => f[0]);
  for (const k of ["pres", "oathBy", "oathLang", "act", "sallyName", "distName", "band", "nepalBy", "boboBy", "bestDress", "cakeBy", "photoSpot"]) assert.ok(!keys.includes(k), `${k} should be gone`);
});

test("10 Nov documents: defaults come from the sponsor slide, name pins and Operation Bear flyer", () => {
  for (const k of Object.keys(DEFAULTS)) assert.ok(keys.has(k), `default for unknown field ${k}`);
  assert.equal(DEFAULTS.vp, "Mireille Leong");
  assert.equal(DEFAULTS.bearCharity, "Operation Teddy Bear");
  assert.equal(DEFAULTS.sponsors.split(", ").length, 10, "ten sponsors on the thank-you slide");
  // 11 Nov: the whole committee (the nine names on the committee list) takes the oath and Gita calls every name.
  const board = Array.from({ length: LISTS.board.n }, (_, j) => DEFAULTS["board" + (j + 1)]);
  assert.equal(LISTS.board.n, 9);
  assert.deepEqual(board, ["Salli Hon", "Mireille Leong", "Cindy Tai", "Milly Chen", "Bobo Law", "Monique Chen", "Felicia Seah", "Michelle Chen", "Connie Long"]);
  assert.match(SEGMENTS.find((s) => s.t === "19:25").items.flatMap((it) => it.slice(1)).filter((x) => typeof x === "string").join("\n"), /whole committee/);
  const flat = SEGMENTS.flatMap((s) => s.items.flatMap((it) => it.slice(1).filter((x) => typeof x === "string"))).join("\n");
  assert.doesNotMatch(flat, /Bobo, \{boboName\}|Bobo（\{boboName\}）/, "Bobo's full name is used on its own");
  assert.match(flat, /Teddy bears are \$20 each/);
  assert.doesNotMatch(flat, /recover after accidents/);
  assert.equal(DEFAULTS.raffleClose, "8:42 pm", "raffle sales close at 8:42 on the 13 Nov run sheet");
});

test("11 Nov: Tian's introduction is filled in, in simplified Chinese and in English", () => {
  const TRAD = /[來華導獲賽區軍國聲亞擔視廣躍樂體領現儀]/;
  assert.doesNotMatch(DEFAULTS.tianBioZh, TRAD, "the Chinese introduction must use simplified characters");
  // 13 Nov: Tian's own English bio (Tian Tsui), with the Chinese translated from it.
  assert.match(DEFAULTS.tianBioZh, /Tian Tsui[\s\S]*墨尔本[\s\S]*2007[\s\S]*冠军[\s\S]*2015[\s\S]*《中国好声音》澳洲赛区亚军[\s\S]*2017[\s\S]*广州电视台春节晚会/);
  assert.doesNotMatch(DEFAULTS.tianBioEn, /[㐀-鿿]/, "the English introduction has no Chinese");
  assert.match(DEFAULTS.tianBioEn, /^Tian Tsui is a Melbourne-based multilingual singer and performer, crowned 2007 TVB Global Chinese New Talent Singing Awards Melbourne Champion and 2015 The Voice of China Australia Runner-Up\. She was also a guest performer at Guangzhou Television's 2017 Spring Festival Gala\./);
  assert.match(DEFAULTS.tianBioEn, /English, Cantonese and Mandarin/);
  // Read right after the song, in the 7:06 segment: English line, then Chinese line.
  const items = SEGMENTS.find((s) => s.t === "19:06").items.filter((it) => /tianBio/.test(it[1]));
  assert.deepEqual(items.map((it) => [it[0], it[1]]), [["en", "{tianBioEn}"], ["zh", "{tianBioZh}"]]);
});

test("11 Nov: the bear announcement is two sentences in Chinese and two in English, from the Operation Teddy Bear speech", () => {
  const lines = SEGMENTS.find((s) => s.t === "20:07").items.filter((it) => typeof it[1] === "string" && it[1].includes("{bearCharity}"));
  assert.deepEqual(lines.map((it) => it[0]), ["en", "zh"], "one English line and one Chinese line");
  const [en, zh] = [lines[0][1], lines[1][1]];
  assert.equal(en.split(/(?<=[.!?])\s+/).length, 2, "two English sentences");
  assert.equal((zh.match(/。/g) || []).length, 2, "two Chinese sentences");
  for (const x of [en, zh]) assert.match(x, /53,000/);
  assert.match(en, /police, paramedics, firefighters, the SES, the CFA and hospitals/);
  assert.match(en, /Every bear you support tonight/);
  assert.match(zh, /今晚每支持一只熊仔/);
  assert.match(en, /one little bear, one big hug, one act of kindness/);
  assert.match(zh, /一只小熊，一个大拥抱，一份善意/);
  assert.doesNotMatch(zh, /[們個這來說會長為與對時間謝歡請頒發獎樂隊誕禮員臺義賣聖點鐘閃華開關門車書東無經認領隨當後從麼還進邊過運動電話題頭體護驚擁]/, "simplified characters only");
});

test("12 Nov: the MC hand-off after Salli and Mireille's bell, then Samantha, Gita, the oath, Sheryl and the videos in the run sheet's order", () => {
  const at = (t) => SEGMENTS.find((s) => s.t === t);
  const seg = (t) => seg2(at(t));
  const order = SEGMENTS.map((s) => s.t);
  // The hand-off segment follows the President and VP, and Samantha is introduced in it.
  assert.equal(order[order.indexOf("19:17") - 1], "19:06");
  assert.match(seg("19:06"), /Let's start the party now/, "the cue names the bell line that ends their speech");
  const handoff = at("19:17").items.filter((it) => ["zh", "en"].includes(it[0])).map((it) => it[1]).join("\n");
  assert.match(handoff, /That bell means it's official/);
  assert.match(handoff, /钟声响了，晚会正式开始/);
  assert.match(handoff, /handsome emcees/);
  assert.match(handoff, /帅气的主持人/);
  assert.match(handoff, /Best Dress cash prize is real/);
  assert.match(handoff, /Past District Governor who encouraged She Rises to begin: Samantha Wu/);
  assert.match(handoff, /前区域总监 Samantha Wu/);
  assert.ok(handoff.indexOf("bell") < handoff.indexOf("Samantha Wu"), "thank them first, then Samantha");
  // Nothing from Salli and Mireille's cards is repeated by the MCs: the crit lists what they already covered.
  assert.match(at("19:17").items.find((it) => it[0] === "crit")[2], /Do not repeat any of it/);
  assert.doesNotMatch(handoff, /Karen|Guiding Lions|2027|15,000|fifteen thousand/);
  // Run-sheet order from 7:17 to 8:00: Samantha, Gita, oath, photo, Sheryl, videos, Eric.
  assert.deepEqual(order.slice(order.indexOf("19:17"), order.indexOf("20:00") + 1), ["19:17", "19:20", "19:25", "19:45", "19:50", "19:54", "20:00"]);
  // 7:20: the committee waits at the side of the stage; the oath runs one at a time, President first.
  assert.match(seg("19:20"), /whole committee \(all 9\) must already be at the side/);
  assert.match(seg("19:25"), /one at a time, President Salli first/);
  assert.match(seg("19:25"), /Queenie and Nina/);
  // Draws: Mireille at 8:15, Salli after the 8:42 close, Michelle records both.
  assert.match(seg("20:15"), /Mireille draws/);
  assert.match(seg("20:15"), /Michelle keeping the record/);
  assert.match(seg("20:40"), /Salli Hon, to draw the numbers/);
  assert.ok(seg("20:40").indexOf("Do not start drawing until sales close at 8:42") < seg("20:40").indexOf("Sales are now closed"));
  // Birthdays, then the cake, then the total, then the band; the group photo is taken from the seats.
  assert.deepEqual(order.slice(order.indexOf("20:55")), ["20:55", "21:05", "21:11", "21:15", "21:30"]);
  assert.match(seg("21:11"), /from the seats/);
  assert.match(seg("21:11"), /Connie and Cindy/);
  assert.match(seg("21:15"), /\{fundTotal\}/);
  assert.match(seg("21:05"), /Connie|Felicia/);
  assert.match(seg("21:30"), /Guiding Lions Ivan Luo and Franky Tang/);
});

test("12 Nov: the run sheet table is the 13 Nov version, with the 11 Nov details the script now follows", () => {
  assert.equal(RUNSHEET.length, 36);
  assert.equal(RUNSHEET[0][0], "16:00");
  assert.equal(RUNSHEET.at(-1)[0], "22:00");
  const row = (t, re) => RUNSHEET.find(([x, zh, en]) => x === t && re.test(zh + en));
  assert.ok(row("19:17", /Samsam/), "Samsam speaks at 7:17");
  assert.ok(row("19:50", /Sheryl/), "Sheryl speaks at 7:50");
  assert.ok(row("19:54", /视频/), "3–4 clips at 7:54");
  assert.ok(row("20:55", /Best Dress/), "Best Dress at 8:55");
  assert.ok(row("21:15", /筹款总额/), "the total is announced at 9:15");
  for (const r of RUNSHEET) assert.ok(!/[㐀-鿿]/.test(r[4]), `${r[0]}: the English note has no Chinese`);
  // Every segment start time sits inside the run sheet's day.
  for (const s of SEGMENTS) assert.ok(mins(s.t) >= mins("18:30") && mins(s.t) < mins("22:00"));
});

test("12 Nov: the two-man opener is Solomon's three-act banter, Solomon as A and Wade as B, both in Chinese", () => {
  const s = SEGMENTS.find((x) => x.t === "18:50");
  const lines = s.items.filter((it) => it[0] === "zh");
  const A = lines.filter((it) => it[2]?.who === "S"), B = lines.filter((it) => !it[2]?.who);
  assert.equal(lines.length, 44, "16 + 23 + 5 spoken lines across the three acts");
  assert.equal(A.length + B.length, 44);
  assert.equal(lines.filter((it) => it[2] && it[2].who !== "S").length, 0, "only Solomon's lines carry an override; Wade's are the default Mandarin speaker");
  assert.ok(A.length >= 20 && B.length >= 20, "both MCs carry the banter");
  // Alternating A/B in the opening exchange, as written.
  assert.deepEqual(lines.slice(0, 6).map((it) => it[2]?.who || "W"), ["S", "W", "S", "W", "S", "W"]);
  // Three act cues, in order, and the first and last lines as written.
  const acts = s.items.filter((it) => it[0] === "cue" && /^第[一二三]幕/.test(it[1])).map((it) => it[1].slice(0, 3));
  assert.deepEqual(acts, ["第一幕", "第二幕", "第三幕"]);
  assert.match(lines[0][1], /欢迎大家出席今晚的圣诞晚宴/);
  assert.equal(lines[0][2].who, "S");
  assert.match(lines.at(-1)[1], /各位男士，请继续努力跟上/);
  assert.equal(lines.at(-1)[2].who, "S");
  // Wade is called Wade 哥, Solomon is named in the phone gag, and the typos in the source are fixed.
  const text = lines.map((it) => it[1]).join("\n");
  assert.match(text, /Wade 哥/);
  assert.match(text, /问 Solomon 是哪个 app/);
  assert.doesNotMatch(text, /soloman/i);
  assert.match(text, /吓？你现在才跟我说/);
  // The 7:00 opening still gives the English welcome and names the MCs, and it follows the banter directly.
  assert.equal(SEGMENTS[SEGMENTS.indexOf(s) + 1].t, "19:00");
  assert.match(seg2(SEGMENTS.find((x) => x.t === "19:00")), /I'm Solomon/);
  // Speaker overrides are only used where an MC speaks the other language: the banter, nowhere else.
  const overridden = SEGMENTS.filter((x) => x.items.some((it) => it[2]?.who));
  assert.deepEqual(overridden.map((x) => x.t), ["18:50"]);
});

test("12 Nov: English comes first in every English and Mandarin pair, and Humanitix is gone", () => {
  const spoken = (s) => s.items.filter((it) => ["zh", "en", "SW"].includes(it[0]));
  // Every segment that speaks starts in English, except the Chinese-only banter, which starts with Solomon's Chinese line.
  for (const s of SEGMENTS.filter((x) => spoken(x).length && x.t !== "18:50")) assert.equal(spoken(s)[0][0], "en", `${s.t}: the first spoken line is English`);
  // Pairs are read left to right: an English line followed by a Chinese line is a pair; a Chinese line followed by an English line never is.
  for (const s of SEGMENTS.filter((x) => x.t !== "18:50")) {
    const seq = s.items;
    for (let i = 0; i < seq.length; i++) {
      if (seq[i][0] === "en" && seq[i + 1]?.[0] === "zh") { i++; continue; }
      if (seq[i][0] === "zh" && seq[i + 1]?.[0] === "en") assert.fail(`${s.t}: a Chinese line comes before its English line: "${seq[i][1].slice(0, 30)}"`);
    }
  }
  assert.match(SEGMENTS.find((s) => s.t === "19:00").items.find((it) => it[0] === "SW")[1], /^Please welcome Tian! 有请 Tian！$/);
  // The Chinese for the thank-yous follows the English, as in every other pair.
  const end = spoken(SEGMENTS.find((s) => s.t === "21:30")).map((it) => it[0]).join("");
  assert.equal(end, "enenzhenzh", "an English lead-in, then English and Chinese pairs");
  // Humanitix is a crew note on the run sheet: it is not announced and not on the run sheet tab either.
  assert.doesNotMatch(JSON.stringify([SEGMENTS, RUNSHEET, NOTES, DEFAULTS, FIELDS]), /humanitix/i);
  assert.match(SEGMENTS.find((s) => s.t === "18:30").items.flatMap((it) => it.slice(1)).filter((x) => typeof x === "string").join(" "), /check in at the front desk/, "the check-in prompt stays, as an ad-lib");
});

test("12 Nov: coordination phrases are ad-lib cues, not lines to read", () => {
  const at = (t) => SEGMENTS.find((s) => s.t === t);
  const lines = (s) => s.items.filter((it) => ["zh", "en", "SW"].includes(it[0])).map((it) => it[1]).join("\n");
  const cues = (s) => s.items.filter((it) => it[0] === "cue" || it[0] === "crit").map((it) => it[1] + " " + it[2]).join("\n");
  const adlib = (s) => s.items.filter((it) => (it[0] === "cue" || it[0] === "crit") && /^(临场发挥|Ad-lib)/.test(it[1]) && /^(Ad-lib)/.test(it[2]));
  // Seating and line-up at 6:45 and the photo at 7:45 are entirely ad-lib: no spoken lines at all.
  assert.equal(lines(at("18:45")), "");
  assert.equal(adlib(at("18:45")).length, 1);
  assert.equal(lines(at("19:45")), "");
  assert.match(cues(at("19:45")), /Ad-lib: ask all members to come up/);
  // Cues cover the rest; none of the logistics wording is left in a spoken line.
  const script = SEGMENTS.map(lines).join("\n");
  for (const gone of [/take your seats/, /return to your seats/, /stand in one row/, /stay on stage for a group photo/, /Connie and Cindy will slice/, /group photo, right from your seats/, /coming to your tables/, /Please check in at the front desk/, /请回到座位/, /回座/, /站成一排，我们来决定/, /小天使现在就到各桌/]) assert.doesNotMatch(script, gone);
  assert.equal(adlib(at("18:30")).length, 1);
  assert.equal(adlib(at("19:50")).length, 1);
  assert.equal(adlib(at("20:07")).length, 1);
  assert.match(cues(at("20:07")), /payment by \{pay\}/, "the pay field is still used, in the cue");
  assert.equal(adlib(at("20:20")).length, 1);
  assert.equal(adlib(at("20:55")).length, 1);
  assert.equal(adlib(at("21:11")).length, 1);
  // The announcements that carry real content stay as lines: Sheryl's introduction, the prices, the results and the farewell.
  assert.match(lines(at("19:50")), /Sheryl Li/);
  assert.match(lines(at("20:07")), /Teddy bears are \$20 each/);
  assert.match(lines(at("20:55")), /first place, \$100/);
  assert.match(lines(at("21:11")), /three, two, one/);
});

test("12 Nov: timed reminders in the Notes tab carry a clock time", () => {
  const timed = NOTES.crit.filter((r) => r[2]);
  const times = timed.map((r) => r[2]);
  assert.ok(timed.length >= 8, "the arrival, seating, opening, committee, draw, cash, birthday and total reminders are timed");
  for (const t of times) {
    assert.match(t, /^\d{2}:\d{2}$/, `${t} is HH:MM`);
    assert.ok(t >= "17:00" && t <= "22:00", `${t} falls on the night`);
  }
  assert.equal(new Set(times).size, times.length, "a time is the tick-box key, so each is unique");
  // The cash and the birthday lists have separate deadlines (8:45 and 9:00), so each is its own tickable reminder.
  const by = (t) => timed.find((r) => r[2] === t);
  assert.match(by("20:45")[1], /Best Dress/);
  assert.doesNotMatch(by("20:45")[1], /birthday/);
  assert.match(by("21:00")[1], /birthday lists/);
  // The Chinese side stays simplified, and no reminder is empty.
  const TRAD = /[們個這來說會長為與對時間謝歡請頒發獎樂隊誕禮員臺義賣聖點鐘閃華開關門車書東無經認領隨當後從麼還進邊過運動電話題頭體]/;
  for (const [zh, en] of NOTES.crit) { assert.ok(zh && en); assert.doesNotMatch(zh, TRAD); }
});

test("13 Nov: the seven names on the Melvin Jones medals are filled in, in list order", () => {
  const names = ["Guan Cheng Gong", "Say Hue Tan", "Xiao Pingguo", "DY", "See Wai Seong", "Felica Seah", "Cindy Tai"];
  assert.equal(LISTS.nepal.n, names.length);
  names.forEach((n, i) => {
    assert.equal(DEFAULTS["winner" + (i + 1)], n);
    assert.equal(DEFAULTS["award" + (i + 1)], "Melvin Jones Fellowship");
  });
  const seg = SEGMENTS.find((s) => s.t === "20:20");
  assert.ok(seg.items.some((it) => it[0] === "list" && it[1] === "nepal"), "the recipients list is in the awards segment");
  const spoken = seg.items.filter((it) => ["zh", "en"].includes(it[0])).map((it) => it[1]).join(" ");
  assert.match(spoken, /seven Melvin Jones Fellowships/);
  assert.match(spoken, /共 7 位得奖者/);
  assert.doesNotMatch(spoken, /\bsix\b|共 6 位/, "the spoken count matches the seven names");
  assert.match(JSON.stringify(NOTES.check), /Felica.*Felicia Seah/, "the open question flags the Felica spelling");
});

test("13 Nov: Eric's introduction and both songs are filled in, and Tian's English song comes from a field", () => {
  const TRAD = /[來華導獲賽區軍國聲亞擔視廣躍樂體領現儀謝錄製評憶廳館會]/;
  for (const k of ["ericBioZh", "eric1", "eric2"]) assert.doesNotMatch(DEFAULTS[k], TRAD, `${k} must use simplified characters`);
  assert.match(DEFAULTS.ericBioZh, /谢昉益[\s\S]*8PM[\s\S]*TVB[\s\S]*广州广播电视台[\s\S]*评委[\s\S]*《星梦传奇》《中国好声音》/);
  assert.doesNotMatch(DEFAULTS.ericBioEn, /[㐀-鿿]/, "the English introduction has no Chinese");
  assert.match(DEFAULTS.ericBioEn, /Eric Tse[\s\S]*lead vocalist of the band 8PM[\s\S]*TVB[\s\S]*judged[\s\S]*The Voice of China Australia/);
  assert.equal(DEFAULTS.eric1, "爱在记忆中找你");
  assert.equal(DEFAULTS.eric2, "大会堂演奏厅");
  assert.equal(DEFAULTS.tianEn, "I Have Nothing");
  // The introduction is read before the song at 8:00, English line first.
  const seg = SEGMENTS.find((s) => s.t === "20:00");
  const spoken = seg.items.filter((it) => ["en", "zh"].includes(it[0])).map((it) => [it[0], it[1]]);
  assert.deepEqual(spoken.slice(0, 2), [["en", "{ericBioEn}"], ["zh", "{ericBioZh}"]]);
  assert.match(spoken[2][1], /\{eric1\}/);
  assert.match(JSON.stringify(SEGMENTS.find((s) => s.t === "20:50").items), /\{eric2\}/);
  // The old placeholder song is gone, and the two open questions are on the Notes tab.
  assert.doesNotMatch(JSON.stringify(SEGMENTS), /A Million Dreams/);
  assert.match(JSON.stringify(NOTES.check), /I Have Nothing[\s\S]*It's All Coming Back To Me Now/);
  assert.doesNotMatch(JSON.stringify(NOTES.check), /Still missing: Eric's two songs|official English name of the Global Chinese/);
});

test("13 Nov: after the President and Vice President are welcomed, asking the other members to sit is an ad-lib cue", () => {
  const items = SEGMENTS.find((s) => s.t === "19:06").items;
  const i = items.findIndex((it) => it[0] === "zh" && /有请她慧狮子会会长/.test(it[1]));
  assert.ok(i > 0, "the welcome line is in the 7:06 segment");
  assert.deepEqual(items[i + 1], ["cue", "临场发挥：请其他会员坐下", "Ad-lib: ask the other members to sit down"]);
  const spoken = items.filter((it) => ["en", "zh"].includes(it[0])).map((it) => it[1]).join(" ");
  assert.doesNotMatch(spoken, /sit down|请.*坐下/, "the seating request is not a line to read");
});
