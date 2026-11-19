import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { DEFAULT } from "../lions/data.js";
import { parseTime, fmt12, longDate, effTimes, nowState, normalise, encode, decode, PREFIX } from "../lions/model.js";

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const COLS = ["d", "s", "l", "v"];

test("the schedule has the committee's 16 rows, in time order, with unique ids", () => {
  const rows = DEFAULT.rows;
  assert.equal(rows.length, 16);
  assert.equal(new Set(rows.map((r) => r.id)).size, rows.length, "row ids must be unique");
  for (const r of rows) assert.match(r.time, /^(\d{2}:\d{2})?$/, `${r.id}: bad time ${r.time}`);
  const eff = effTimes(rows);
  assert.equal(eff[0], "16:00", "the first cue is Preparation at 4:00 pm");
  assert.equal(eff.at(-1), "23:30", "the last cue is the RACV sign-off at 11:30 pm");
  for (let i = 1; i < eff.length; i++) assert.ok(eff[i] >= eff[i - 1], `${rows[i].id}: ${eff[i]} runs before ${eff[i - 1]}`);
  for (const r of rows) assert.ok(r.seg || COLS.some((c) => r[c]), `${r.id}: an empty row`);
});

test("rows with no time of their own take the time above, as in the original sheet", () => {
  const eff = effTimes(DEFAULT.rows);
  const at = (id) => eff[DEFAULT.rows.findIndex((r) => r.id === id)];
  assert.equal(at("r2"), "16:00", "the ball chair's list sits under Preparation");
  assert.equal(at("r7"), "19:30", "Live concert 1st session runs with Entrée service");
});

test("the three evening times the sheet stored as morning times are pm", () => {
  const at = (seg) => DEFAULT.rows.find((r) => r.seg === seg).time;
  assert.equal(at("Auction songs"), "21:50");
  assert.equal(at("3rd Session Songs"), "22:10");
  assert.equal(at("Programme close"), "22:45");
  const times = DEFAULT.fixes.filter((f) => f.kind === "Time");
  assert.equal(times.length, 3, "each time correction is logged");
});

test("every correction is logged, and a typo no longer survives in the cues", () => {
  const all = DEFAULT.rows.flatMap((r) => COLS.map((c) => r[c])).join("\n");
  for (const typo of ["Lactern", "lactern", "Connecterd", "viedoe", "Wirelsss", "Spotlihgt", "HXEA", "participtants", "slient", "converage"]) assert.ok(!all.includes(typo), `${typo} is still in the cues`);
  for (const f of DEFAULT.fixes.filter((x) => x.kind === "Spelling")) assert.ok(f.was && f.now && f.where, `${f.id}: incomplete log entry`);
  assert.ok(DEFAULT.fixes.length >= 20);
});

test("times: forgiving input, 12-hour output", () => {
  assert.equal(parseTime("7pm"), "19:00");
  assert.equal(parseTime("7:30 pm"), "19:30");
  assert.equal(parseTime("6.45pm"), "18:45");
  assert.equal(parseTime("19:30"), "19:30");
  assert.equal(parseTime("1930"), "19:30");
  assert.equal(parseTime("7"), "19:00", "a bare hour in an evening schedule is pm");
  assert.equal(parseTime("12am"), "00:00");
  assert.equal(parseTime("12pm"), "12:00");
  assert.equal(parseTime(""), "");
  for (const bad of ["banana", "25:00", "13pm", "7:75", "0pm"]) assert.equal(parseTime(bad), null, bad);
  assert.equal(fmt12("19:05"), "7:05 pm");
  assert.equal(fmt12("00:30"), "12:30 am");
  assert.equal(fmt12(""), "");
  assert.equal(longDate(DEFAULT.event.date), "Saturday 21 November 2026");
});

test("the live bar: before, early, live (with the next cue), and after", () => {
  const rows = DEFAULT.rows, date = DEFAULT.event.date;
  const b = nowState(rows, date, { date: "2026-11-19", min: 600 });
  assert.equal(b.phase, "before");
  assert.equal(b.days, 2);
  assert.equal(nowState(rows, date, { date, min: 8 * 60 }).phase, "early");
  const live = nowState(rows, date, { date, min: 19 * 60 + 12 });
  assert.equal(live.phase, "live");
  assert.equal(live.cur, 19 * 60, "Formal opening is running at 7:12 pm");
  assert.equal(live.nxt, 19 * 60 + 30, "Entrée service is next");
  const both = nowState(rows, date, { date, min: 19 * 60 + 40 });
  assert.equal(rows.filter((r, i) => both.mins[i] === both.cur).length, 2, "Entrée and the live concert are both running at 7:40 pm");
  assert.equal(nowState(rows, date, { date, min: 23 * 60 + 45 }).nxt, null, "nothing after the sign-off");
  assert.equal(nowState(rows, date, { date: "2026-11-22", min: 60 }).phase, "after");
  assert.equal(nowState(rows, "", { date, min: 60 }).phase, "none");
});

test("the share code round-trips the whole sheet", () => {
  const edited = structuredClone(DEFAULT);
  edited.rows[4].s = "Lions song 5% — fade for the MCs. 你好";
  edited.lists[0].items[0].done = true;
  edited.notes = "Bring a spare lectern mic";
  const code = encode(edited);
  assert.ok(code.startsWith(PREFIX));
  assert.deepEqual(decode(`Here you go:\n${code}\nthanks`), normalise(edited), "survives text around it");
  assert.deepEqual(decode(code.replace(PREFIX, `${PREFIX}\n`).replace(/(.{40})/g, "$1\n")), normalise(edited), "survives chat line wrapping");
  assert.equal(decode(code.slice(0, -1)), null, "a copy that lost its end is refused, not half-loaded");
  assert.equal(decode(code.slice(0, 200)), null, "a cut-off copy is refused");
});

test("anything from outside is rebuilt field by field", () => {
  assert.equal(decode("nothing here"), null);
  assert.equal(decode(`${PREFIX}!!!not base64!!!`), null);
  assert.equal(decode(`${PREFIX}${Buffer.from("{\"rows\":1}").toString("base64")}`), null);
  const hostile = normalise({
    event: { title: "<img src=x onerror=alert(1)>", date: { x: 1 }, __proto__: { polluted: true } },
    rows: [{ id: 5, time: "25:99", seg: "ok", d: { a: 1 }, extra: "drop me" }, "not a row", null],
    lists: [{ title: "L", items: [{ text: "x", done: "yes" }, 7] }],
    fixes: [{ kind: "", where: 1 }],
    notes: 42,
  });
  assert.equal(hostile.event.title, "<img src=x onerror=alert(1)>", "kept as plain text; the page escapes it when drawing");
  assert.equal(hostile.event.date, "");
  assert.equal(hostile.rows.length, 1);
  assert.equal(hostile.rows[0].time, "", "a bad time is dropped");
  assert.equal(hostile.rows[0].d, "");
  assert.ok(!("extra" in hostile.rows[0]));
  assert.equal(hostile.lists[0].items.length, 1);
  assert.equal(hostile.lists[0].items[0].done, false, "only a real true ticks an item");
  assert.equal(hostile.fixes[0].kind, "Note");
  assert.equal(hostile.notes, "");
  assert.ok(!({}).polluted);
});

test("the page is wired up: unlisted, offline-cached, with a manifest and icons", () => {
  const html = read("lions/index.html");
  assert.match(html, /<meta name="robots" content="noindex, nofollow">/, "the page asks search engines not to index it");
  assert.match(html, /<link rel="manifest" href="\.\/manifest\.json">/);
  const manifest = JSON.parse(read("lions/manifest.json"));
  for (const i of manifest.icons) assert.ok(existsSync(new URL(`../lions/${i.src}`, import.meta.url)), `${i.src} is missing`);
  const sw = read("sw.js");
  const wanted = ["lions/", "lions/index.html", "lions/app.js", "lions/model.js", "lions/data.js", "lions/lions.css", "lions/manifest.json", "icons/lions.svg", "icons/lions-180.png", "icons/lions-192.png", "icons/lions-512.png"];
  for (const f of wanted) {
    assert.ok(sw.includes(`"./${f}"`), `sw.js does not cache ${f}`);
    assert.ok(existsSync(new URL(`../${f}`, import.meta.url)), `${f} does not exist`);
  }
  assert.ok(sw.includes('"./lions/index.html"') && sw.includes('path.includes("/lions/")'), "the offline fallback knows /lions/");
  assert.ok(!read("index.html").includes("/lions/"), "unlisted: left off the home page");
  assert.ok(!/claude\.use|window\.claude/.test(read("lions/app.js")), "the Pages build has no Artifact runtime calls");
});
