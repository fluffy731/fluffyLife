// The Cantonese app's Songs profile (see songs/view.js), for a native Korean speaker who is a beginner and
// can't read Chinese characters yet: Korean UI, lyric lines in Chinese characters, a request that returns each
// line's Jyutping and Korean meaning, and Cantonese study cards. Claude supplies the Jyutping and the app turns
// it into 한글, so nothing is hand-spelt; a line, grammar point or word whose Jyutping is malformed, doesn't
// match its characters one to one, or isn't a reading the app's dictionary lists for a character is marked ?.
// Spec: docs/superpowers/specs/2026-11-15-cantonese-songs-design.md
import { requestBuilder, parseLines, str, arr, knownId, normLine } from "./model.js";
import { syllables, hangul } from "../lib/jyutping.js";
import { validateYue } from "../lib/validate-yue.js";
import { sylHTML, bridgeHTML } from "../cards/yue.js";

const HAN = /\p{Script=Han}/u;
// Kana, not the middle dot ・ that Chinese text also uses in foreign names.
const KANA = /[\u3041-\u30fa\u30fc-\u30ff]/;
// Credit lines that Chinese lyric files carry (作詞：…, 作曲 : …, 编曲：…).
const CREDIT = /^\s*(作[詞词曲]|[編编]曲|填[詞词]|[監监]製|[監监]制|製作|制作|主唱|原唱|[詞词曲])\s*[:：]/;
// A lyric line has Chinese characters; Japanese (kana) lines and credit lines don't count.
export const isLyric = (line) => { const l = String(line ?? ""); return HAN.test(l) && !KANA.test(l) && !CREDIT.test(l); };

// ---------- the Claude request ----------
const RULES = `You help a native Korean speaker study Cantopop lyrics. She is a beginner in Cantonese and can't read Chinese characters yet, so every explanation is for her: write ko and note in natural, plain Korean.
For each numbered line (Chinese characters, sung in Cantonese):
jp: Jyutping for the Chinese characters only, one syllable per character in order, each with its tone digit 1-6 (我愛你 → ngo5 oi3 nei5). Leave out English words, digits and punctuation. Give the reading as sung in Cantonese.
ko: a natural Korean translation of the line, not word for word. en: a natural English translation.
grammar: what a beginner needs in that line: sentence-final particles (呀 啦 喎 囉 嘛), aspect markers (咗 緊 過 住), negation (唔 冇 未), and colloquial Cantonese words that differ from written Chinese (係 嘅 喺 佢 睇 唔該). For each: form = the Chinese characters of the pattern as used in the line (咗, 唔…得), formJp = their Jyutping, ko and en = short meanings, note = one or two sentences in Korean on how it works in this line. Set appId only if the line truly uses that point from the GRAMMAR LIST, else null.
words: up to 5 content words worth learning: zh = the word's characters as in the line, jp = its Jyutping (one syllable per character, tone digits), ko = its Korean meaning, en = its English meaning, pos (n, v, adj, adv, phrase).
Return n = the line number you were given for every line, once each.`;

export const systemText = (grammar) =>
  `${RULES}\n\nGRAMMAR LIST (id | form | meaning)\n${grammar.map((g) => `${g.id} | ${g.form} | ${g.en}`).join("\n")}`;

const S = { type: "string" };
const obj = (props) => ({ type: "object", additionalProperties: false, required: Object.keys(props), properties: props });
export const YUE_SCHEMA = obj({
  lines: { type: "array", items: obj({
    n: { type: "integer" }, jp: S, ko: S, en: S,
    grammar: { type: "array", items: obj({ form: S, formJp: S, appId: { anyOf: [S, { type: "null" }] }, ko: S, en: S, note: S }) },
    words: { type: "array", items: obj({ zh: S, jp: S, ko: S, en: S, pos: S }) },
  }) },
});

export const buildRequest = requestBuilder(systemText, YUE_SCHEMA);

export const parseAnalysis = (text, lines, grammarIds) => parseLines(text, lines, grammarIds, (l, zh) => ({
  zh, jp: str(l.jp), ko: str(l.ko), en: str(l.en),
  grammar: arr(l.grammar).map((g) => ({ form: str(g?.form), formJp: str(g.formJp), appId: knownId(g.appId, grammarIds), ko: str(g.ko), en: str(g.en), note: str(g.note) })),
  words: arr(l.words).slice(0, 5).map((w) => ({ zh: str(w?.zh), jp: str(w.jp), ko: str(w.ko), en: str(w.en), pos: str(w.pos) })),
}));

// ---------- the Jyutping check ----------
// Each character's readings, from dictionary rows [characters, jyutping, …] whose syllables pair one to one.
export function charReadings(rows) {
  const m = new Map();
  for (const [zh, jp] of rows) {
    const chars = [...zh].filter((ch) => HAN.test(ch));
    const syl = syllables(jp).filter((x) => !x.punct);
    if (!chars.length || chars.length !== syl.length) continue;
    chars.forEach((ch, i) => { if (!m.has(ch)) m.set(ch, new Set()); m.get(ch).add(syl[i].jp.toLowerCase()); });
  }
  return m;
}

// True when the Jyutping can't be trusted for these characters. A character the dictionary doesn't know is
// not held against the line; with no dictionary (readings null) only the form and the count are checked.
export function jyutpingUnsure(zh, jp, readings) {
  const chars = [...String(zh ?? "")].filter((ch) => HAN.test(ch));
  const syl = syllables(String(jp ?? "")).filter((x) => !x.punct);
  if (!syl.length || chars.length !== syl.length) return true;
  return syl.some((x, i) => !x.ok || x.tone === null || (readings?.get(chars[i]) && !readings.get(chars[i]).has(x.jp.toLowerCase())));
}

const mark = (o, zh, jp, readings) => (jyutpingUnsure(zh, jp, readings) ? { ...o, unsure: true } : o);
export const checkLines = (lines, readings) => lines.map((l) => ({
  ...mark(l, l.zh, l.jp, readings),
  grammar: l.grammar.map((g) => mark(g, g.form, g.formJp, readings)),
  words: l.words.map((w) => mark(w, w.zh, w.jp, readings)),
}));

// The dictionary is built at deploy (dict/yue.json) and cached by the service worker after Browse first loads
// it. Loaded once per session, starting when translating starts (L.prefetch) so it downloads alongside the
// Claude call. If it can't be fetched, or isn't ready a few seconds after the reply, the translation is
// checked without it and saved at once: the paid reply is never held up waiting for it.
let readingsLoad = null;
const loadReadings = () => (readingsLoad ??= fetch(new URL("../dict/yue.json", import.meta.url))
  .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
  .then((j) => charReadings(j.rows))
  .catch(() => { readingsLoad = null; return null; }));
const WAIT_MS = 4000;
const readingsSoon = () => Promise.race([loadReadings(), new Promise((ok) => setTimeout(() => ok(null), WAIT_MS))]);

// ---------- study cards ----------
const sameJp = (a, b) => normLine(a).toLowerCase() === normLine(b).toLowerCase();
// The id of a card the app already has for this grammar point or word, or null. A word matches on its
// characters and reading, so 好 hou3 (like) from a song is not taken for the app's 好 hou2 (good). A word
// marked ? matches on its characters alone: the app's checked card beats a suspect reading.
export function findStudyId({ kind, entry, items }) {
  if (kind === "grammar") {
    if (entry.appId && items.some((i) => i.id === entry.appId)) return entry.appId;
    return items.find((i) => i.form && normLine(i.form) === normLine(entry.form))?.id ?? null;
  }
  const words = items.filter((i) => !i.form && i.zh === entry.zh);
  return (words.find((i) => sameJp(i.jp, entry.jp)) ?? (entry.unsure ? words[0] : null))?.id ?? null;
}

export function studyItem({ kind, entry, line, song, items, unit, id }) {
  const existing = findStudyId({ kind, entry, items });
  if (existing) return { id: existing, item: null };
  const tag = `♪ ${song.title}${song.artist ? ` – ${song.artist}` : ""}`;
  // A ? on the point or its line stays with the card: the vocab card shows the app's ? badge (check), and a
  // grammar card, which has no badge, says so in its note.
  const unsure = !!(entry.unsure || line.unsure);
  const item = kind === "grammar"
    ? { id, kind: "grammar", tier: unit.tier, unit: unit.unit, form: entry.form, formJp: entry.formJp, ko: entry.ko, en: entry.en,
      note: [entry.note, tag, unsure ? `? ${T.unsure}` : ""].filter(Boolean).join(" · "), ex: [{ zh: line.zh, jp: line.jp, ko: line.ko }] }
    : { id, kind: "vocab", tier: unit.tier, unit: unit.unit, zh: entry.zh, jp: entry.jp, ko: entry.ko, en: entry.en, pos: entry.pos || "n",
      exZh: line.zh, exJp: line.jp, exKo: line.ko, note: tag, check: unsure };
  if (validateYue(item, kind === "word" ? "vocab" : "grammar").length) throw new Error("invalid item");
  return { id, item };
}

// ---------- the profile ----------
const T = {
  msg: {
    noKey: "먼저 설정에서 Claude API 키를 넣어 주세요.",
    badKey: "API 키가 거부됐어요. 설정에서 키를 확인해 주세요.",
    offline: "오프라인이에요. 인터넷에 연결되면 다시 해 주세요.",
    rateLimit: "지금 요청이 너무 많아요. 1분쯤 기다렸다가 다시 해 주세요.",
    server: "Claude 서버에 문제가 생겼어요. 잠시 후 다시 해 주세요.",
    refusal: "모델이 이 노래를 처리하지 않았어요. 설정에서 Sonnet 5.5로 바꿔 보세요.",
    tooLong: "답이 중간에 끊겼어요. 긴 노래는 Sonnet 5.5로 해 보세요.",
    invalid: "답을 읽을 수 없었어요. 다시 해 주세요.",
    rejected: "Claude가 요청을 거절했어요. Anthropic 계정(잔액, 모델 사용 권한)을 확인해 주세요.",
    noLyrics: "LRCLIB에서 가사를 찾지 못했어요. 노래를 열고 가사를 붙여 넣어 주세요.",
    noChinese: "한자 가사가 없는 결과만 찾았어요. 영어 버전이거나 영어로 부른 노래일 수 있어요. ‘다른 가사 찾기’에서 다른 버전을 고르거나, 광동어 가사를 붙여 넣어 주세요.",
    lrclib: "가사 검색이 응답하지 않아요. 나중에 다시 하거나 가사를 붙여 넣어 주세요.",
    nostorage: "이 기기에는 노래를 저장할 수 없어요.",
  },
  status: { queued: "번역 전", lyrics: "가사만 있음", done: "번역 완료", error: "오류", missing: "한자 가사 없음", noLyrics: "가사 못 찾음" },
  openSettings: "설정 열기",
  noStoreTitle: "이 기기에는 노래를 저장할 수 없어요",
  noStoreBody: "이 브라우저가 저장 공간을 막아 두었어요 (개인 정보 보호 창이거나 웹사이트 데이터가 꺼져 있어요). 앱의 다른 기능은 그대로 쓸 수 있어요.",
  loading: "불러오는 중…",
  addSong: "노래 추가", importList: "목록 가져오기",
  emptyTitle: "아직 노래가 없어요", emptyBody: "즐겨 듣는 광동어 노래를 추가하거나 목록을 가져오세요.",
  batchLabel: (n, ticked) => (ticked ? `${n}곡 번역하기` : n > 1 ? `번역 안 된 ${n}곡 모두 번역하기` : "번역 안 된 1곡 번역하기"),
  about: (usd) => `(약 ${usd})`,
  keepOpen: "끝날 때까지 이 화면을 켜 두세요. 화면이 잠기거나 다른 앱으로 가면 아이폰이 앱을 멈춰요. 한 곡이 끝날 때마다 바로 저장돼요.",
  stop: "이 곡까지만 하고 멈추기", stopping: "이 곡이 끝나면 멈춰요…",
  filters: { all: "전체", done: "번역 완료", todo: "번역 전", error: "확인 필요" },
  findPlaceholder: "찾기: 제목, 가수, 가사 한 줄이나 뜻",
  countOf: (a, b) => `${b}곡 중 ${a}곡`,
  count: (n) => `${n}곡`,
  noMatch: (q) => (q ? `“${q}”에 맞는 노래가 없어요.` : "이 필터에 맞는 노래가 없어요."),
  tickLabel: "번역할 노래로 선택",
  points: (n) => `문법 ${n}개`,
  hitLines: (n) => `한자 가사 · ${n}줄`, hitWrong: "한자 가사 없음", hitNoLyrics: "가사 없음",
  instrumental: "연주곡", noLyricsShort: "가사 없음",
  useLyrics: "이 가사 쓰기",
  noOtherVersions: "LRCLIB에 다른 버전이 없어요. 아래에 가사를 붙여 넣어 주세요.",
  otherLyrics: "다른 가사", changeRemoves: "가사를 바꾸면 이 노래의 번역이 지워져요.",
  orPaste: "직접 붙여 넣기", pastePlaceholder: "광동어 가사(한자)를 여기에 붙여 넣으세요",
  saveLyrics: "가사 저장", cancel: "취소",
  back: "노래", addTitle: "노래 추가", titlePh: "제목", artistPh: "가수 (선택)", searchLyrics: "가사 검색",
  lyrics: "가사", lyricsPh: "검색 결과를 고르거나 가사를 여기에 붙여 넣으세요", saveSong: "노래 저장",
  lyricsStay: "가사는 이 폰에만 저장돼요. 번역할 때 Claude에 보내는 것 말고는 어디에도 올라가지 않아요.",
  listPh: "한 줄에 한 곡씩: 제목 – 가수",
  csvNote: "또는 CSV 파일 (예: Google Takeout의 YouTube Music 내보내기):",
  importGo: "가져오기",
  importNote: "가져온 노래는 선택된 상태라서, 번역하기를 한 번 누르면 가사를 찾아 모두 번역해요.",
  inReviews: "복습에 있음", addToStudy: "학습에 추가",
  deleteSong: "노래 삭제", findOther: "다른 가사 찾기", seeAll: "검색 결과 모두 보기",
  notFetched: "아직 가사를 가져오지 않았어요.", findLyrics: "가사 찾기", orPastePh: "…또는 가사를 여기에 붙여 넣으세요",
  noLines: "이 가사에는 한자로 된 줄이 없어서 번역할 게 없어요. 영어 버전이거나 영어로 부른 노래일 수 있어요.",
  retry: "다시 시도", translate: "번역과 설명",
  tapLine: "줄을 누르면 문법과 단어가 나와요.",
  confirmTranslate: (model, usd) => `${model} 모델로 번역할까요? 약 ${usd}`,
  rejectedDetail: (d) => `Claude가 요청을 거절했어요: ${d}`,
  batchBusy: (i, n, title) => `${n}곡 중 ${i}번째 번역 중: ${title}…`,
  batchDone: (stopped, done, n, failed) => `${stopped ? "멈춤: " : ""}${n}곡 중 ${done}곡을 번역했어요.${failed ? ` ${failed}곡은 확인이 필요해요. 열어서 이유를 보세요.` : ""}`,
  noCard: "이건 카드로 만들 수 없어요 (빈 칸이 있거나 Jyutping이 올바르지 않아요).",
  needTitle: "먼저 제목을 입력하세요.", searching: "찾는 중…",
  noMatchLrclib: "LRCLIB에 맞는 노래가 없어요. 아래에 가사를 붙여 넣어 주세요.",
  resultNoLyrics: "이 결과에는 가사가 없어요. 다른 걸 고르거나 붙여 넣어 주세요.",
  needTitleLyrics: "노래에는 제목과 가사가 필요해요.",
  pasteFirst: "먼저 가사를 붙여 넣어 주세요.",
  confirmSaveLyrics: "이 가사를 저장할까요? 이 노래의 번역은 지워져요.",
  confirmUseLyrics: "이 가사를 쓸까요? 이 노래의 번역은 지워져요.",
  translating: "번역 중…",
  confirmDelete: (title) => `“${title}” 노래를 삭제할까요?`,
  imported: (n, skipped) => `${n}곡을 가져왔어요.${skipped ? ` (${skipped}곡은 이미 목록에 있어요)` : ""}`,
  settingsTitle: "노래", keyPh: "Claude API 키 (sk-ant-…)", saveKey: "키 저장", clearKey: "지우기",
  keySaved: (k) => `저장됨: ${k}.`, noKeySaved: "저장된 키가 없어요.",
  keyNote: "키는 이 폰에만 저장되고 백업에는 들어가지 않아요. Anthropic Console에서 이 키에 월 사용 한도를 정해 두세요.",
  costNote: "한 곡당 대략적인 비용이에요. Haiku가 가장 싸고, Sonnet과 Opus는 설명이 더 풍부해요.",
  unsure: "Jyutping이 사전과 다를 수 있어요",
  unsureNote: "? 표시는 Jyutping이 사전과 맞지 않을 수 있다는 뜻이에요. 🔊 버튼으로 실제 발음을 들어 보세요.",
};

const flag = (o, esc) => (o.unsure ? `<span class="check" title="${esc(T.unsure)}">?</span>` : "");
// A line's 한글 spelling for the find box, worked out once per line rather than on every keystroke.
const spelt = new WeakMap();
const hangulOf = (l) => { if (!spelt.has(l)) spelt.set(l, l.jp ? hangul(l.jp) : ""); return spelt.get(l); };

export const yueSongs = {
  isLyric, missing: "noChinese", lineKey: (l) => l.zh,
  searchText: (l) => [l.ko, l.en, l.jp, hangulOf(l)],
  keyName: "yue.songs.apiKey",
  dbName: "fluffy-songs-yue",
  systemText, buildRequest, parseAnalysis, findStudyId, studyItem,
  prefetch: () => { loadReadings(); },
  afterTranslate: async (lines) => checkLines(lines, await readingsSoon()),

  // Sound first: tone-coloured 한글, then Jyutping, the characters and the Korean meaning.
  // A backup from elsewhere can lack Jyutping: those spots stay empty rather than break the page.
  lineHTML: (zh, e, { esc, say }) => `<div class="k hg">${sylHTML(e.jp ?? "", esc)} ${say(zh)}</div>
      <div class="rr">${esc(e.jp)}${flag(e, esc)}</div>
      <div class="zh" lang="zh-Hant">${esc(zh)}</div>
      <div class="en">${esc(e.ko)}</div>`,
  grammarHTML: (g, { esc }) => `<b class="hg">${sylHTML(g.formJp ?? "", esc)}</b> <span lang="zh-Hant">${esc(g.form)}</span> · ${esc(g.ko)}${flag(g, esc)}<div class="muted">${esc(g.note)}</div>`,
  wordHTML: (w, view) => {
    const { esc, say, t } = view;
    return `<b class="hg">${sylHTML(w.jp ?? "", esc)}</b> <span class="hj" lang="zh-Hant">${esc(w.zh)}</span> ${say(w.zh)} · ${esc(w.ko)} <span class="muted small">${esc(t.posName(w.pos))}</span>${flag(w, esc)}${bridgeHTML(w.zh ?? "", w.jp ?? "", view)}`;
  },
  chipHTML: (g, { esc }) => `${esc(hangul(g.formJp ?? ""))} <span lang="zh-Hant">${esc(g.form)}</span>`,
  sumNote: (a, { esc }) => (a.lines.some((l) => l.unsure || l.grammar.some((g) => g.unsure) || l.words.some((w) => w.unsure)) ? `<div class="muted">${esc(T.unsureNote)}</div>` : ""),

  t: T,
};
