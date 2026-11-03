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
