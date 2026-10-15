import { test } from "node:test";
import assert from "node:assert/strict";
import { clipName } from "../lib/audio.js";
import { buildJobs } from "../lib/audio-jobs.js";
import { koPack } from "../packs/ko.js";
import { yuePack } from "../packs/yue.js";

test("clip names: 16 hex chars, deterministic, depend on voice and text", () => {
  const a = clipName("zh-HK-HiuGaaiNeural", "你好");
  assert.match(a, /^[0-9a-f]{16}$/);
  assert.equal(a, clipName("zh-HK-HiuGaaiNeural", "你好"));
  assert.notEqual(a, clipName("ko-KR-SunHiNeural", "你好"));
  assert.notEqual(a, clipName("zh-HK-HiuGaaiNeural", "你好嗎"));
});

test("Cantonese jobs cover every word, example, grammar form and example (exactly what 🔊 speaks)", () => {
  const jobs = buildJobs(yuePack);
  const texts = new Set(jobs.map((j) => j.text));
  for (const v of yuePack.vocab) { assert.ok(texts.has(yuePack.speechClean(v.zh)), v.zh); assert.ok(texts.has(yuePack.speechClean(v.exZh)), v.exZh); }
  for (const g of yuePack.grammar) { assert.ok(texts.has(yuePack.speechClean(g.form)), g.form); for (const e of g.ex) assert.ok(texts.has(yuePack.speechClean(e.zh)), e.zh); }
  assert.ok(texts.has("你好"));
  for (const j of jobs) { assert.equal(j.voice, "zh-HK-HiuGaaiNeural"); assert.equal(j.file, `audio/yue/${clipName(j.voice, j.text)}.mp3`); assert.ok(j.text.length > 0); }
  assert.equal(new Set(jobs.map((j) => j.file)).size, jobs.length);
});

test("Korean jobs cover every word and example", () => {
  const jobs = buildJobs(koPack);
  const texts = new Set(jobs.map((j) => j.text));
  for (const v of koPack.vocab) { assert.ok(texts.has(koPack.speechClean(v.ko)), v.ko); assert.ok(texts.has(koPack.speechClean(v.ex)), v.ex); }
  for (const g of koPack.grammar) for (const e of g.ex) assert.ok(texts.has(koPack.speechClean(e.ko)), e.ko);
  for (const j of jobs) assert.ok(j.file.startsWith("audio/ko/") && j.voice === "ko-KR-SunHiNeural");
});
