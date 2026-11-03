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
