import { test } from "node:test";
import assert from "node:assert/strict";
import { hasHangul, normLine, splitLyrics, uniqueHangulLines, parseSongList, songKey } from "../songs/model.js";
import { LYRICS } from "./fixtures/songs.js";

test("splitLyrics strips timestamps and section markers, keeps stanza breaks", () => {
  assert.deepEqual(splitLyrics(LYRICS), ["너를 볼 때마다 웃게 돼", "", "비가 와도 괜찮아", "", "너를 볼 때마다  웃게 돼", "Oh baby"]);
  assert.deepEqual(splitLyrics("(Verse 2)\r\n가"), ["", "가"]);
});

test("uniqueHangulLines dedupes repeats after normalising and drops non-Korean lines", () => {
  assert.deepEqual(uniqueHangulLines(splitLyrics(LYRICS)), ["너를 볼 때마다 웃게 돼", "비가 와도 괜찮아"]);
  assert.deepEqual(uniqueHangulLines(["Oh baby", "la la"]), []);
  assert.equal(normLine("  a \t b  "), "a b");
  assert.equal(hasHangul("Oh 가"), true);
  assert.equal(hasHangul("Oh baby"), false);
});

test("parseSongList reads pasted lines with any dash, title-only lines, and skips duplicates", () => {
  assert.deepEqual(parseSongList("밤 – 가수\n봄날 - 그룹\n제목만\n밤 — 가수\n\n"), [
    { title: "밤", artist: "가수" }, { title: "봄날", artist: "그룹" }, { title: "제목만", artist: "" },
  ]);
  assert.deepEqual(parseSongList("제목\t가수"), [{ title: "제목", artist: "가수" }]);
  assert.equal(songKey(" 밤 ", "가수"), songKey("밤", " 가수"));
});

test("parseSongList reads a Takeout-style CSV with BOM, CRLF and quoted commas", () => {
  assert.deepEqual(parseSongList("﻿Song Title,Album Title,Artist Names\r\n\"Love, Again\",X,가수\r\n"), [{ title: "Love, Again", artist: "가수" }]);
  assert.deepEqual(parseSongList('Title,Artist\n"Say ""Hi""",A\n'), [{ title: 'Say "Hi"', artist: "A" }]);
});

import { DEFAULT_MODEL, SONG_MODELS, buildRequest, parseAnalysis, estimateCost, actualCost } from "../songs/model.js";

const G = [{ id: "g-int-1", form: "-기 위해", en: "in order to" }];
const reply = (lines) => JSON.stringify({ lines });
const L = (n, extra = {}) => ({ n, zh: `中${n}`, en: `en${n}`, grammar: [], words: [], ...extra });

test("buildRequest numbers the lines, caches the system text and sends no fallbacks on Haiku", () => {
  const r = buildRequest({ model: DEFAULT_MODEL, lines: ["가", "나"], grammar: G });
  assert.equal(DEFAULT_MODEL, "claude-haiku-5-5");
  assert.equal(r.model, "claude-haiku-5-5");
  assert.equal(r.messages[0].content, "1. 가\n2. 나");
  assert.ok(r.system[0].text.includes("g-int-1 | -기 위해 | in order to"));
  assert.equal(r.system[0].cache_control.type, "ephemeral");
  assert.equal(r.output_config.format.type, "json_schema");
  assert.equal(r.max_tokens, 64000);
  assert.equal("fallbacks" in r, false);
  assert.equal("betas" in r, false);
});

test("buildRequest adds server-side fallbacks on Opus and Sonnet", () => {
  for (const m of ["claude-opus-5-5", "claude-sonnet-5-5"]) {
    const r = buildRequest({ model: m, lines: ["가"], grammar: G });
    assert.equal(r.fallbacks, "default");
    assert.deepEqual(r.betas, ["server-side-fallback-2026-07-01"]);
  }
  assert.deepEqual(Object.keys(SONG_MODELS).sort(), ["claude-haiku-5-5", "claude-opus-5-5", "claude-sonnet-5-5"]);
});

test("parseAnalysis orders lines by n and fills in the Korean", () => {
  const a = parseAnalysis(reply([L(2), L(1)]), ["가", "나"], new Set(["g-int-1"]));
  assert.deepEqual(a.lines.map((l) => [l.ko, l.zh]), [["가", "中1"], ["나", "中2"]]);
});

test("parseAnalysis rejects missing, duplicate or truncated replies and wrong types", () => {
  const lines = ["가", "나"], ids = new Set();
  assert.throws(() => parseAnalysis(reply([L(1)]), lines, ids), /invalid/);
  assert.throws(() => parseAnalysis(reply([L(1), L(1)]), lines, ids), /invalid/);
  assert.throws(() => parseAnalysis('{"lines":[{"n":1', lines, ids), /invalid/);
  assert.throws(() => parseAnalysis(reply([L(1, { zh: 5 }), L(2)]), lines, ids), /invalid/);
});

test("parseAnalysis drops unknown grammar ids, cuts long strings and keeps five words", () => {
  const g = (appId) => ({ form: "-기 위해", appId, en: "in order to", zh: "為了", note: "x".repeat(1000) });
  const w = { ko: "가", base: "가다", hanja: null, zh: "去", en: "go", pos: "v" };
  const a = parseAnalysis(reply([L(1, { grammar: [g("nope"), g("g-int-1")], words: Array(7).fill(w) })]), ["가"], new Set(["g-int-1"]));
  assert.equal(a.lines[0].grammar[0].appId, null);
  assert.equal(a.lines[0].grammar[1].appId, "g-int-1");
  assert.equal(a.lines[0].grammar[0].note.length, 400);
  assert.equal(a.lines[0].words.length, 5);
});

test("cost from usage and the estimate before sending", () => {
  const u = (i, o, r = 0, c = 0) => ({ input_tokens: i, output_tokens: o, cache_read_input_tokens: r, cache_creation_input_tokens: c });
  assert.ok(Math.abs(actualCost("claude-haiku-5-5", u(1e6, 1e6)) - 0.6) < 1e-9);
  assert.ok(Math.abs(actualCost("claude-opus-5-5", u(0, 0, 1e6)) - 0.4) < 1e-9);
  assert.ok(Math.abs(actualCost("claude-sonnet-5-5", u(0, 0, 0, 1e6)) - 2.5) < 1e-9);
  const e = estimateCost("claude-haiku-5-5", 600, 20);
  assert.ok(e > 0.002 && e < 0.005, `estimate ${e}`);
});

import { studyItem, inReviews } from "../songs/model.js";
import { validateItem } from "../lib/validate.js";

const SONG = { title: "빗소리", artist: "가수" };
const LINE = { ko: "비가 와도 괜찮아", zh: "下雨也沒關係", en: "It's okay even if it rains" };
const UNIT = { tier: "int", unit: 3 };
const GE = { form: "-아도/어도", appId: null, en: "even if", zh: "即使", note: "와도 = 오다 + -아도." };
const WE = { ko: "비가", base: "비", hanja: null, zh: "雨", en: "rain", pos: "n" };
const SEED = [{ id: "g-int-1", form: "-기 위해", tier: "int", unit: 2, en: "in order to", zh: "為了", ex: [{ ko: "가", zh: "去", en: "go" }] }];

test("studyItem makes valid new grammar and word cards carrying the song line", () => {
  const g = studyItem({ kind: "grammar", entry: GE, line: LINE, song: SONG, items: SEED, unit: UNIT, id: "u1" });
  assert.equal(g.id, "u1");
  assert.deepEqual(validateItem(g.item, "grammar"), []);
  assert.deepEqual(g.item.ex, [{ ko: LINE.ko, zh: LINE.zh, en: LINE.en }]);
  assert.ok(g.item.note.endsWith("♪ 빗소리 – 가수"));
  const w = studyItem({ kind: "word", entry: WE, line: LINE, song: SONG, items: SEED, unit: UNIT, id: "u2" });
  assert.deepEqual(validateItem(w.item, "vocab"), []);
  assert.equal(w.item.ko, "비");
  assert.equal(w.item.ex, LINE.ko);
  assert.equal(w.item.tier, "int"); assert.equal(w.item.unit, 3);
});

test("studyItem reuses the app's own grammar card when appId matches", () => {
  const r = studyItem({ kind: "grammar", entry: { ...GE, appId: "g-int-1" }, line: LINE, song: SONG, items: SEED, unit: UNIT, id: "u1" });
  assert.deepEqual(r, { id: "g-int-1", item: null });
});

test("a second tap returns the card made by the first tap instead of a duplicate", () => {
  for (const [kind, entry] of [["grammar", GE], ["word", WE]]) {
    const first = studyItem({ kind, entry, line: LINE, song: SONG, items: SEED, unit: UNIT, id: "u1" });
    const again = studyItem({ kind, entry, line: LINE, song: SONG, items: [...SEED, first.item], unit: UNIT, id: "u2" });
    assert.deepEqual(again, { id: "u1", item: null });
  }
});

test("studyItem refuses a card that would not pass validation", () => {
  assert.throws(() => studyItem({ kind: "word", entry: { ...WE, en: "" }, line: LINE, song: SONG, items: SEED, unit: UNIT, id: "u3" }), /invalid item/);
  assert.equal(inReviews("u1", { u1: { due: 1 } }), true);
  assert.equal(inReviews("u9", {}), false);
});

import { cleanSong, newSongId } from "../songs/model.js";

test("cleanSong keeps a valid record and strips anything else from a backup", () => {
  const good = { id: "s1", title: "밤", artist: "X", album: null, source: "lrclib", status: "done", error: null, lyrics: "가", addedAt: 5,
    analysis: { model: "claude-haiku-5-5", at: 6, usage: { in: 1, out: 2, cacheRead: 0 }, costUsd: 0.001,
      lines: [{ ko: "가", zh: "去", en: "go", grammar: [{ form: "-아", appId: null, en: "e", zh: "z", note: "n" }], words: [{ ko: "가", base: "가다", hanja: null, zh: "去", en: "go", pos: "v" }] }] } };
  assert.deepEqual(cleanSong(good), good);
  const bad = cleanSong({ ...good, "<script>": 1, title: 5 });
  assert.equal(bad, null);
  const extra = cleanSong({ ...good, evil: "<img onerror=x>", status: "weird" });
  assert.equal("evil" in extra, false);
  assert.equal(extra.status, "lyrics");
  assert.match(newSongId(), /^s[0-9a-z]+$/);
});

import { batchSongs } from "../songs/model.js";

test("batchSongs: ticked songs when any are ticked, otherwise every song still to translate", () => {
  const s = (id, status, extra = {}) => ({ id, title: id, status, lyrics: status === "queued" ? null : "가", ...extra });
  const songs = [s("a", "done"), s("b", "queued"), s("c", "lyrics"), s("d", "error", { error: "server" }),
    s("e", "error", { error: "noLyrics", lyrics: null }), s("f", "error", { error: "noLyrics", lyrics: "붙여 넣은 가사" })];
  // Nothing ticked (after reopening the app): all untranslated, except songs whose lyrics were never found.
  assert.deepEqual(batchSongs(songs, new Set()), { ticked: false, list: ["b", "c", "d", "f"].map((id) => songs.find((x) => x.id === id)) });
  // Ticked songs win, and a ticked song that is already done or gone is left out.
  assert.deepEqual(batchSongs(songs, new Set(["a", "c", "e", "zz"])), { ticked: true, list: [songs[2], songs[4]] });
});

import { findInSong, inFilter } from "../songs/model.js";

test("findInSong matches title, artist, a lyric line, a translation or a grammar form", () => {
  const song = { id: "s1", title: "비가 와도", artist: "Made-up Band", status: "done", lyrics: "[00:01.00]너를 볼 때마다 웃게 돼\n\n비가 와도 괜찮아",
    analysis: { lines: [
      { ko: "너를 볼 때마다 웃게 돼", zh: "每次看到你我都會笑", en: "Every time I see you, I end up smiling", grammar: [{ form: "-(으)ㄹ 때마다" }], words: [] },
      { ko: "비가 와도 괜찮아", zh: "下雨也沒關係", en: "It's fine even if it rains", grammar: [{ form: "-아/어도" }], words: [] } ] } };
  assert.deepEqual(findInSong(song, ""), { field: null, line: null });
  assert.deepEqual(findInSong(song, "  비가와도 "), { field: "title", line: null });          // spaces and case don't matter
  assert.deepEqual(findInSong(song, "made-UP"), { field: "artist", line: null });
  assert.deepEqual(findInSong(song, "볼때마다"), { field: "lyric", line: "너를 볼 때마다 웃게 돼" });
  assert.deepEqual(findInSong(song, "end up smiling"), { field: "translation", line: "너를 볼 때마다 웃게 돼" });
  assert.deepEqual(findInSong(song, "沒關係"), { field: "translation", line: "비가 와도 괜찮아" });
  assert.deepEqual(findInSong(song, "아/어도"), { field: "grammar", line: "비가 와도 괜찮아" });
  assert.equal(findInSong(song, "사랑"), null);
  // An imported song with no lyrics yet is still found by title.
  assert.deepEqual(findInSong({ id: "s2", title: "Love story", artist: "볼빨간사춘기", status: "queued", lyrics: null, analysis: null }, "love"), { field: "title", line: null });
});

test("inFilter sorts songs into translated, to translate and needs attention", () => {
  const s = (status) => ({ status });
  assert.deepEqual(["queued", "lyrics", "done", "error"].map((st) => ["all", "done", "todo", "error"].map((f) => inFilter(s(st), f))), [
    [true, false, true, false], [true, false, true, false], [true, true, false, false], [true, false, false, true]]);
});
