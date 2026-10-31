// Cross-checks every hanja in the Korean deck against libhangul's hanja list (BSD-3-Clause,
// https://github.com/libhangul/libhangul). Prints words whose hanja libhangul spells differently.
//   node scripts/hanja-check.mjs            (downloads the list, about 3 MB)
//   node scripts/hanja-check.mjs hanja.txt  (uses a local copy)
// The deck writes hanja in Korean standard forms (生産, 强, 畵, 晩), as libhangul does; the zh field
// is Taiwan Traditional Chinese (生產, 強, 畫, 晚). A difference is a prompt to look, not proof:
// libhangul has errors too, so confirmed ones go in KNOWN below.
import { readFileSync } from "node:fs";
import { vocab } from "../data/vocab.js";

const URL_ = "https://raw.githubusercontent.com/libhangul/libhangul/main/data/hanja/hanja.txt";
// Checked by hand: ours is right. 시행착오 is 試行錯誤 in the standard dictionary; 한편 is native 한 + 便.
const KNOWN = new Set(["시행착오", "한편"]);

const text = process.argv[2] ? readFileSync(process.argv[2], "utf8") : await (await fetch(URL_)).text();
const dict = new Map();
for (const l of text.split("\n")) {
  if (!l || l.startsWith("#")) continue;
  const [k, h] = l.split(":");
  if (!k || !h || [...k].length < 2) continue;
  if (!dict.has(k)) dict.set(k, new Set());
  dict.get(k).add(h);
}
let checked = 0;
const diff = [], missing = [];
for (const v of vocab.filter((x) => x.hanja && !KNOWN.has(x.ko))) {
  const h = v.hanja.replace(/—$/, "");
  let k = v.ko.replace(/하다$/, "").replace(/스럽다$/, "");
  if ([...k].length !== [...h].length) k = [...v.ko].slice(0, [...h].length).join("");
  const set = dict.get(k);
  if (!set) { missing.push(v.ko); continue; }
  checked++;
  if (!set.has(h)) diff.push(`${v.id}\t${v.ko}\tours ${h}\tlibhangul ${[...set].join(", ")}`);
}
console.log(`${checked} checked, ${diff.length} differ, ${missing.length} not in libhangul`);
if (diff.length) console.log(diff.join("\n"));
process.exit(diff.length ? 1 : 0);
