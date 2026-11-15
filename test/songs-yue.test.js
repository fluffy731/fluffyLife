import { test } from "node:test";
import assert from "node:assert/strict";
import {
  isLyric, systemText, buildRequest, parseAnalysis, YUE_SCHEMA, charReadings, jyutpingUnsure, checkLines,
  findStudyId, studyItem, yueSongs,
} from "../songs/yue.js";
import { koSongs } from "../songs/ko.js";
import { lyricLines, pickLyrics, waitingForLyrics, batchSongs, findInSong, cleanSong } from "../songs/model.js";
import { translateSong } from "../songs/claude.js";
import { validateYue } from "../lib/validate-yue.js";
import { YUE_LYRICS } from "./fixtures/songs.js";

const GRAMMAR = [{ id: "g-zo2", form: "동사 + 咗", en: "completed action" }];
const IDS = new Set(GRAMMAR.map((g) => g.id));
const line = (n, extra = {}) => ({ n, jp: "nei5 hou2 maa3", ko: "잘 지내?", en: "How are you?",
  grammar: [{ form: "嗎", formJp: "maa3", appId: null, ko: "~니?", en: "question particle", note: "문장 끝에 붙어 질문이 돼요." }],
  words: [{ zh: "你", jp: "nei5", ko: "너", en: "you", pos: "n" }], ...extra });

test("lyric lines are lines with Chinese characters; Korean, English and Japanese lines are not", () => {
  assert.equal(isLyric("我好掛住你"), true);
  assert.equal(isLyric("Baby 我愛你"), true);
  assert.equal(isLyric("너를 볼 때마다"), false);
  assert.equal(isLyric("Oh baby"), false);
  assert.equal(isLyric("君の名は"), false);
  assert.deepEqual(lyricLines(YUE_LYRICS, isLyric), ["你好嗎", "我好掛住你"]);
});

test("a search that finds only English lyrics waits for Chinese ones, with its own reason", () => {
  const english = { lyrics: "Oh baby\nla la", instrumental: false };
  assert.deepEqual(pickLyrics([english], yueSongs), { hit: null, reason: "noChinese" });
  const chinese = { lyrics: YUE_LYRICS, instrumental: false };
  assert.equal(pickLyrics([english, chinese], yueSongs).hit, chinese);
  const waiting = { id: "a", status: "error", error: "noChinese", lyrics: null };
  assert.equal(waitingForLyrics(waiting, yueSongs), true);
  assert.deepEqual(batchSongs([waiting], new Set(["a"]), yueSongs).list, []);
  // The Korean app's rules are untouched: Korean lyrics, noKorean.
  assert.equal(pickLyrics([{ lyrics: YUE_LYRICS }]).reason, "noKorean");
});

test("the request is for a Korean beginner, numbers the lines and asks for Jyutping and Korean meanings", () => {
  const req = buildRequest({ model: "claude-haiku-5-5", lines: ["你好嗎", "我好掛住你"], grammar: GRAMMAR });
  assert.match(req.system[0].text, /native Korean speaker/);
  assert.match(req.system[0].text, /can't read Chinese characters/);
  assert.match(req.system[0].text, /g-zo2 \| 동사 \+ 咗 \| completed action/);
  assert.equal(req.system[0].text, systemText(GRAMMAR));
  assert.equal(req.messages[0].content, "1. 你好嗎\n2. 我好掛住你");
  assert.equal(req.output_config.format.schema, YUE_SCHEMA);
  assert.deepEqual(YUE_SCHEMA.properties.lines.items.required, ["n", "jp", "ko", "en", "grammar", "words"]);
  assert.equal("fallbacks" in req, false);
  assert.equal(buildRequest({ model: "claude-sonnet-5-5", lines: ["你"], grammar: [] }).fallbacks, "default");
});

test("the reply keeps the lyric line, drops an unknown grammar id, caps words at 5 and rejects a missing line", () => {
  const words = Array.from({ length: 7 }, (_, i) => ({ zh: "你", jp: "nei5", ko: `너${i}`, en: "you", pos: "n" }));
  const a = parseAnalysis(JSON.stringify({ lines: [line(1, { words }), line(2, { grammar: [{ form: "咗", formJp: "zo2", appId: "g-zo2", ko: "~했다", en: "done", note: "n" }, { form: "嗎", formJp: "maa3", appId: "made-up", ko: "k", en: "e", note: "n" }] })] }), ["你好嗎", "我好掛住你"], IDS);
  assert.equal(a.lines[0].zh, "你好嗎");
  assert.equal(a.lines[0].jp, "nei5 hou2 maa3");
  assert.equal(a.lines[0].ko, "잘 지내?");
  assert.equal(a.lines[0].words.length, 5);
  assert.equal(a.lines[1].grammar[0].appId, "g-zo2");
  assert.equal(a.lines[1].grammar[1].appId, null);
  assert.throws(() => parseAnalysis(JSON.stringify({ lines: [line(1)] }), ["你好嗎", "我好掛住你"], IDS), /invalid/);
  assert.throws(() => parseAnalysis(JSON.stringify({ lines: [line(1, { jp: 5 })] }), ["你好嗎"], IDS), /invalid/);
  assert.throws(() => parseAnalysis("not json", ["你"], IDS), /invalid/);
});

const ROWS = [["你好", "nei5 hou2", "hello", ""], ["好", "hou3", "to like", ""], ["掛住", "gwaa3 zyu6", "to miss", ""], ["我", "ngo5", "I", ""],
  ["嗎", "maa3", "question particle", ""], ["卡拉OK", "kaa1 laa1 ou1 kei1", "karaoke", ""]];

test("each character's readings come from dictionary rows whose syllables pair one to one", () => {
  const r = charReadings(ROWS);
  assert.deepEqual([...r.get("好")].sort(), ["hou2", "hou3"]);
  assert.deepEqual([...r.get("掛")], ["gwaa3"]);
  assert.equal(r.has("卡"), false);   // 3 characters, 4 syllables: not paired
});

test("Jyutping is marked unsure when it is malformed, miscounted or not a dictionary reading", () => {
  const r = charReadings(ROWS);
  assert.equal(jyutpingUnsure("我好掛住你", "ngo5 hou2 gwaa3 zyu6 nei5", r), false);
  assert.equal(jyutpingUnsure("你好嗎？", "nei5 hou2 maa3?", r), false);            // punctuation ignored
  assert.equal(jyutpingUnsure("Baby 我好掛住你", "ngo5 hou2 gwaa3 zyu6 nei5", r), false);  // English left out
  assert.equal(jyutpingUnsure("我好掛住你", "ngo5 hou2 gwaa2 zyu6 nei5", r), true);   // 掛 is gwaa3, not gwaa2
  assert.equal(jyutpingUnsure("我好掛住你", "ngo5 hou2 gwaa3 nei5", r), true);         // a syllable short
  assert.equal(jyutpingUnsure("我好", "ngo5 hou", r), true);                            // no tone
  assert.equal(jyutpingUnsure("我好", "ngo5 xyz2", r), true);                           // not Jyutping
  assert.equal(jyutpingUnsure("我好", "ngo5hou2", r), true);                            // run together
  assert.equal(jyutpingUnsure("我", "", r), true);
  assert.equal(jyutpingUnsure("我嘞", "ngo5 laak3", r), false);                         // 嘞 not in the dictionary: not held against it
  assert.equal(jyutpingUnsure("我好掛住你", "ngo5 hou2 gwaa2 zyu6 nei5", null), false);  // no dictionary: form and count only
});

test("checkLines marks the line, a grammar point and a word separately", () => {
  const r = charReadings(ROWS);
  const lines = parseAnalysis(JSON.stringify({ lines: [line(1, { jp: "nei5 hou2 maa1", words: [{ zh: "你好", jp: "nei5 hou2", ko: "안녕", en: "hi", pos: "phrase" }, { zh: "好", jp: "hou1", ko: "좋다", en: "good", pos: "adj" }] })] }), ["你好嗎"], IDS).lines;
  const [l] = checkLines(lines, r);
  assert.equal(l.unsure, true);
  assert.equal(l.grammar[0].unsure, undefined);
  assert.equal(l.words[0].unsure, undefined);
  assert.equal(l.words[1].unsure, true);
});

const ITEMS = [
  { id: "g-zo2", kind: "grammar", form: "동사 + 咗", formJp: "zo2" },
  { id: "v-hou2", kind: "vocab", zh: "好", jp: "hou2", ko: "좋다" },
];
const SONG = { title: "노래", artist: "가수" };
const LINE = { zh: "我好掛住你", jp: "ngo5 hou2 gwaa3 zyu6 nei5", ko: "네가 너무 보고 싶어", en: "I miss you so much", grammar: [], words: [] };

test("study ids: the app's grammar card by id or form, a word by its characters and reading", () => {
  assert.equal(findStudyId({ kind: "grammar", entry: { form: "咗", appId: "g-zo2" }, items: ITEMS }), "g-zo2");
  assert.equal(findStudyId({ kind: "grammar", entry: { form: "동사 + 咗", appId: null }, items: ITEMS }), "g-zo2");
  assert.equal(findStudyId({ kind: "word", entry: { zh: "好", jp: "hou2" }, items: ITEMS }), "v-hou2");
  assert.equal(findStudyId({ kind: "word", entry: { zh: "好", jp: "hou3" }, items: ITEMS }), null);
});

test("a word becomes a valid Cantonese vocab card with the line as its example; grammar a valid grammar card", () => {
  const unit = { tier: "a1", unit: 4 };
  const w = studyItem({ kind: "word", entry: { zh: "掛住", jp: "gwaa3 zyu6", ko: "보고 싶다", en: "to miss", pos: "v" }, line: LINE, song: SONG, items: ITEMS, unit, id: "u1" });
  assert.deepEqual(validateYue(w.item, "vocab"), []);
  assert.equal(w.item.exZh, LINE.zh); assert.equal(w.item.exJp, LINE.jp); assert.equal(w.item.exKo, LINE.ko);
  assert.equal(w.item.tier, "a1"); assert.equal(w.item.unit, 4);
  assert.match(w.item.note, /♪ 노래 – 가수/);
  const g = studyItem({ kind: "grammar", entry: { form: "好", formJp: "hou2", appId: null, ko: "아주", en: "very", note: "형용사 앞에서 '아주'라는 뜻이에요." }, line: LINE, song: SONG, items: ITEMS, unit, id: "u2" });
  assert.deepEqual(validateYue(g.item, "grammar"), []);
  assert.deepEqual(g.item.ex, [{ zh: LINE.zh, jp: LINE.jp, ko: LINE.ko }]);
  assert.deepEqual(studyItem({ kind: "grammar", entry: { form: "咗", appId: "g-zo2" }, line: LINE, song: SONG, items: ITEMS, unit, id: "u3" }), { id: "g-zo2", item: null });
  assert.throws(() => studyItem({ kind: "word", entry: { zh: "掛住", jp: "gwaa3zyu6", ko: "보고 싶다", en: "to miss", pos: "v" }, line: LINE, song: SONG, items: ITEMS, unit, id: "u4" }), /invalid item/);
});

test("a Cantonese song survives a backup with its Jyutping, Korean meanings and ? marks", () => {
  const l = { ...LINE, unsure: true, grammar: [{ form: "好", formJp: "hou2", appId: null, ko: "아주", en: "very", note: "n", unsure: true }], words: [{ zh: "掛住", jp: "gwaa3 zyu6", ko: "보고 싶다", en: "to miss", pos: "v", unsure: true }] };
  const back = cleanSong(JSON.parse(JSON.stringify({ id: "s1", title: "노래", status: "done", lyrics: "我好掛住你", analysis: { model: "claude-haiku-5-5", lines: [l] } })));
  const [b] = back.analysis.lines;
  assert.equal(b.zh, LINE.zh); assert.equal(b.jp, LINE.jp); assert.equal(b.ko, LINE.ko); assert.equal(b.unsure, true);
  assert.equal(b.grammar[0].formJp, "hou2"); assert.equal(b.grammar[0].ko, "아주"); assert.equal(b.grammar[0].unsure, true);
  assert.equal(b.words[0].jp, "gwaa3 zyu6"); assert.equal(b.words[0].unsure, true);
  assert.equal(cleanSong({ id: "s2", title: "t", analysis: { lines: [{ unsure: "yes" }] } }).analysis.lines[0].unsure, undefined);
});

test("find a Cantonese song by a lyric, its Korean meaning or its 한글 spelling", () => {
  const song = { title: "노래", artist: "가수", lyrics: "我好掛住你", analysis: { lines: [{ ...LINE }] } };
  assert.deepEqual(findInSong(song, "掛住", yueSongs), { field: "lyric", line: "我好掛住你" });
  assert.deepEqual(findInSong(song, "보고싶어", yueSongs), { field: "translation", line: "我好掛住你" });
  assert.deepEqual(findInSong(song, "오 호우 꽈", yueSongs), { field: "translation", line: "我好掛住你" });
  assert.equal(findInSong(song, "없는말", yueSongs), null);
});

test("the Cantonese and Korean profiles have the same strings and parts", () => {
  assert.deepEqual(Object.keys(yueSongs.t).filter((k) => !["unsure", "unsureNote"].includes(k)).sort(), Object.keys(koSongs.t).sort());
  assert.deepEqual(Object.keys(yueSongs.t.msg).map((k) => (k === "noChinese" ? "noKorean" : k)).sort(), Object.keys(koSongs.t.msg).sort());
  assert.ok(yueSongs.missing in yueSongs.t.msg && koSongs.missing in koSongs.t.msg);
  assert.deepEqual(Object.keys(yueSongs.t.status).sort(), Object.keys(koSongs.t.status).sort());
  for (const k of ["isLyric", "lineKey", "searchText", "systemText", "buildRequest", "parseAnalysis", "findStudyId", "studyItem", "lineHTML", "grammarHTML", "wordHTML", "chipHTML"]) {
    assert.equal(typeof yueSongs[k], "function", `yue ${k}`); assert.equal(typeof koSongs[k], "function", `ko ${k}`);
  }
  assert.notEqual(yueSongs.keyName, koSongs.keyName);
  assert.notEqual(yueSongs.dbName, koSongs.dbName);
});

test("translateSong sends the Cantonese request and reads the Cantonese reply when given the profile", async () => {
  const seen = {};
  class Anthropic { constructor() { this.beta = { messages: { stream: (req) => { seen.req = req; return { finalMessage: async () => ({
    stop_reason: "end_turn", content: [{ type: "text", text: JSON.stringify({ lines: [line(1)] }) }], usage: { input_tokens: 10, output_tokens: 10 } }) }; } } }; } }
  const r = await translateSong({ apiKey: "sk-ant-test", model: "claude-haiku-5-5", lines: ["你好嗎"], grammar: GRAMMAR, lang: yueSongs }, { loadSdk: async () => ({ default: Anthropic }) });
  assert.match(seen.req.system[0].text, /native Korean speaker/);
  assert.equal(r.analysis.lines[0].zh, "你好嗎");
  assert.equal(r.analysis.lines[0].jp, "nei5 hou2 maa3");
});

test("line display leads with tone-coloured 한글 and shows ? on an unsure line", () => {
  const esc = (s) => String(s ?? "");
  const html = yueSongs.lineHTML("你好嗎", { jp: "nei5 hou2 maa3", ko: "잘 지내?", unsure: true }, { esc, say: () => "🔊" });
  assert.match(html, /class="syl t5">네이<sup>5<\/sup>/);
  assert.match(html, /class="check"/);
  assert.match(html, /잘 지내\?/);
  assert.doesNotMatch(yueSongs.lineHTML("你", { jp: "nei5", ko: "너" }, { esc, say: () => "" }), /class="check"/);
});

test("a ? stays with the card: a flagged word or line makes a vocab card with the ? badge, and a grammar note says so", () => {
  const unit = { tier: "a1", unit: 4 };
  const word = { zh: "掛住", jp: "gwaa3 zyu6", ko: "보고 싶다", en: "to miss", pos: "v" };
  assert.equal(studyItem({ kind: "word", entry: word, line: LINE, song: SONG, items: ITEMS, unit, id: "u1" }).item.check, false);
  assert.equal(studyItem({ kind: "word", entry: { ...word, unsure: true }, line: LINE, song: SONG, items: ITEMS, unit, id: "u2" }).item.check, true);
  assert.equal(studyItem({ kind: "word", entry: word, line: { ...LINE, unsure: true }, song: SONG, items: ITEMS, unit, id: "u3" }).item.check, true);
  const g = studyItem({ kind: "grammar", entry: { form: "好", formJp: "hou2", appId: null, ko: "아주", en: "very", note: "n", unsure: true }, line: LINE, song: SONG, items: ITEMS, unit, id: "u4" });
  assert.match(g.item.note, /^n · ♪ 노래 – 가수 · \? Jyutping이 사전과 다를 수 있어요$/);
  assert.deepEqual(validateYue(g.item, "grammar"), []);
});

test("a flagged word the app already teaches schedules the app's checked card, not a copy with the suspect reading", () => {
  const entry = { zh: "好", jp: "hou1", ko: "좋다", en: "good", pos: "adj", unsure: true };
  assert.equal(findStudyId({ kind: "word", entry, items: ITEMS }), "v-hou2");
  assert.deepEqual(studyItem({ kind: "word", entry, line: LINE, song: SONG, items: ITEMS, unit: { tier: "a1", unit: 4 }, id: "u5" }), { id: "v-hou2", item: null });
  assert.equal(findStudyId({ kind: "word", entry: { ...entry, unsure: false }, items: ITEMS }), null);   // unflagged: its own reading
});

test("credit lines are not lyrics; the middle dot in a foreign name doesn't make a line Japanese", () => {
  for (const l of ["作詞：某人", "作曲 : 某人", "编曲：某人", "填詞: 某人", "監製：某人", "词：某人"]) assert.equal(isLyric(l), false, l);
  assert.equal(isLyric("我作曲俾你聽"), true);
  assert.equal(isLyric("約翰・史密斯"), true);
  assert.equal(pickLyrics([{ lyrics: "作詞：某人\nOh baby", instrumental: false }], yueSongs).reason, "noChinese");
});

test("renderers draw a line with no Jyutping (a backup from elsewhere) instead of throwing", () => {
  const view = { esc: (s) => String(s ?? ""), say: () => "", t: { posName: (p) => p, bridgeTitle: "", cantoneseOnly: "", loanword: "" } };
  assert.doesNotThrow(() => yueSongs.lineHTML("你好", { ko: "안녕" }, view));
  assert.doesNotThrow(() => yueSongs.grammarHTML({ form: "嗎", ko: "", note: "" }, view));
  assert.doesNotThrow(() => yueSongs.wordHTML({ zh: "你", ko: "너", pos: "n" }, view));
  assert.doesNotThrow(() => yueSongs.chipHTML({ form: "嗎" }, view));
  assert.deepEqual(yueSongs.searchText({ ko: "안녕", en: "hi" }), ["안녕", "hi", undefined, ""]);
});

test("the batch button doesn't say 모두 for one song", () => {
  assert.equal(yueSongs.t.batchLabel(1, false), "번역 안 된 1곡 번역하기");
  assert.equal(yueSongs.t.batchLabel(3, false), "번역 안 된 3곡 모두 번역하기");
  assert.equal(yueSongs.t.batchLabel(2, true), "2곡 번역하기");
});
