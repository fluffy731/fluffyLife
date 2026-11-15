// Static guard for the ui-presentation rules (portable template: copy into the repo's tests and set CSS_FILES).
// What a phone does with a stylesheet can't run in a unit test, so this pins the rules that stop the commonest fault:
//   - no bare fr grid track: a bare 1fr can't shrink below its longest unbreakable line (minmax(0, 1fr) can), which is
//     how a long path or venue name made iOS zoom whole pages out (Monnie Intake, Oct 2026; Spots, 15 Nov 2026);
//   - stylesheets listed in SAFETY_NET end with body { overflow-x: clip; } and never put overflow-x: hidden on html or body.
// The width sweep (width-check.mjs) is the browser half of the check. Run with: node --test
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// Edit for the repo: every stylesheet to guard, and those that carry the safety net (see safety-net.css).
const CSS_FILES = (process.env.UI_GUARD_CSS || "src/styles.css").split(",").filter(Boolean);
const SAFETY_NET = (process.env.UI_GUARD_SAFETY_NET || "").split(",").filter(Boolean);

const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, " "));

// Removes every minmax(...) (nested parentheses included): a track inside minmax has a floor the author chose.
export function withoutMinmax(value) {
  let out = "", i = 0;
  while (i < value.length) {
    if (value.startsWith("minmax(", i)) {
      let depth = 0, j = i + 6;
      for (; j < value.length; j++) { if (value[j] === "(") depth++; else if (value[j] === ")" && --depth === 0) break; }
      i = j + 1; out += "MINMAX";
    } else out += value[i++];
  }
  return out;
}
export const isBareFr = (value) => /(^|[\s,(])\d*\.?\d+fr\b/.test(withoutMinmax(value));

// The column part of every grid-template-columns, grid-template (after the /) and grid-auto-columns, with its line.
export function gridColumns(css) {
  const found = [], text = stripComments(css);
  const pattern = /(grid-template-columns|grid-template|grid-auto-columns)\s*:\s*([^;}]+)/g;
  for (let m = pattern.exec(text); m; m = pattern.exec(text)) {
    const value = m[1] === "grid-template" ? (m[2].split("/")[1] || "") : m[2];
    found.push({ line: text.slice(0, m.index).split("\n").length, prop: m[1], value: value.trim() });
  }
  return found;
}

test("the guard recognises bare tracks, and leaves tracks with a floor alone", () => {
  assert.deepEqual(["1fr", "repeat(3, 1fr)", "auto 1fr", "1.6fr 1fr 1fr", "1fr 20px"].map(isBareFr), [true, true, true, true, true]);
  assert.deepEqual(["minmax(0, 1fr)", "repeat(3, minmax(0, 1fr))", "auto minmax(0, 1fr)", "minmax(280px,1fr) auto",
    "repeat(auto-fill, minmax(min(156px, 100%), 1fr))", "40px minmax(0,1fr) auto"].map(isBareFr), [false, false, false, false, false, false]);
});

for (const file of CSS_FILES) {
  test(`${file}: no bare fr grid track (use minmax(0, 1fr))`, () => {
    const bare = gridColumns(readFileSync(file, "utf8")).filter((g) => isBareFr(g.value));
    assert.deepEqual(bare.map((g) => `${file}:${g.line} ${g.prop}: ${g.value}`), []);
  });
}

for (const file of SAFETY_NET) {
  test(`${file}: ends with the sideways safety net, and never hides overflow on html or body`, () => {
    const css = readFileSync(file, "utf8");
    assert.ok(stripComments(css).trim().endsWith("body { overflow-x: clip; }"), "the last rule should be body { overflow-x: clip; }");
    assert.doesNotMatch(css, /(^|[\s,}])(html|body)\s*\{[^}]*overflow-x:\s*hidden/);
  });
}
