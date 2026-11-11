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
  assert.match(opening, /two men/, "the warm-up comes before Tian");
  assert.ok(opening.indexOf("two men") < opening.indexOf("Please welcome Tian"), "warm-up first, then Tian");
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
  // Two long-service awards, six Melvin Jones awards, and the Best Dress prize comes before the birthdays and the cake.
  assert.equal(LISTS.nepal.n, 6);
  assert.match(seg("20:20"), /10-Year Long Service Award/);
  assert.match(seg("20:20"), /20-Year Long Service Award/);
  assert.match(seg("20:20"), /President, Salli Hon, to receive the 10-Year/);
  assert.ok(seg("20:20").indexOf("Salli") < seg("20:20").indexOf("Bobo"), "Salli's ten years come before Bobo's twenty");
  assert.doesNotMatch(SEGMENTS.map(seg2).join("\n"), /Sally/, "the spelling is Salli");
  assert.match(seg("20:55"), /Best Dress/);
  assert.match(seg("21:05"), /November birthday/);
  assert.match(seg("21:05"), /十一月生日/);
  assert.match(seg("20:35"), /A Million Dreams/);
  // The two-man opener fills 6:50 to 7:00 with a suggested interactive show and hands over at 7:00 sharp.
  assert.equal(at("18:50").e, "19:00");
  assert.match(seg("18:50"), /Suggested format/);
  for (const r of ["Round 1", "Round 2", "Round 3", "Round 4"]) assert.match(seg("18:50"), new RegExp(r));
  assert.match(seg("18:50"), /7:00 sharp/);
  assert.match(seg("18:50"), /waiting at check-in/);
  // 13 Nov: the run sheet leaves 6:50 to 7:00 blank; the opener stays and says so.
  assert.match(seg("18:50"), /leaves 6:50 to 7:00 blank/);
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
  // 11 Nov meeting: Sheryl presents the six Melvin Jones awards, Gita the two Long Service Awards; Nepal's money is a cheque.
  assert.match(seg("20:20"), /Sheryl Li, presents six Melvin Jones Fellowships/);
  assert.equal((seg("20:20").match(/presented by Gita/g) || []).length, 1, "Gita presents Salli's and Bobo's awards together");
  assert.match(seg("20:20"), /\{chequeBy\}/);
  assert.doesNotMatch(seg("20:20"), /In just one week|短短一个星期/, "Salli's card says two weeks and she covers it");
  assert.equal(LISTS.nepal.n, 6);
  // Goddess has two reasons: Tian's song and an all-female club.
  assert.match(seg("19:00"), /Two reasons/);
  assert.match(seg("19:00"), /all-female club/);
  assert.match(seg("19:00"), /全女性会员/);
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
  assert.match(DEFAULTS.tianBioZh, /墨尔本[\s\S]*《中国好声音》澳洲赛区亚军[\s\S]*广州电视台春节晚会/);
  assert.doesNotMatch(DEFAULTS.tianBioEn, /[㐀-鿿]/, "the English introduction has no Chinese");
  assert.match(DEFAULTS.tianBioEn, /Melbourne[\s\S]*runner-up[\s\S]*The Voice of China[\s\S]*Guangzhou TV Spring Festival Gala/);
  assert.doesNotMatch(DEFAULTS.tianBioEn, /\b(she|her|he|his)\b/i, "the bio does not say which pronoun Tian uses");
  // Read right after the song, in the 7:06 segment: Chinese line, then English line.
  const items = SEGMENTS.find((s) => s.t === "19:06").items.filter((it) => /tianBio/.test(it[1]));
  assert.deepEqual(items.map((it) => [it[0], it[1]]), [["zh", "{tianBioZh}"], ["en", "{tianBioEn}"]]);
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
  assert.match(seg("21:11"), /from your seats/);
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
