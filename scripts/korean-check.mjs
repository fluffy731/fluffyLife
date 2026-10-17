const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
import { createServer } from "node:http"; import { readFile } from "node:fs/promises"; import { extname, join } from "node:path";
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png" };
const srv = createServer(async (req, res) => {
  let p = req.url.split("?")[0]; if (p.endsWith("/")) p += "index.html";
  try { const body = await readFile(join(process.cwd(), p)); res.writeHead(200, { "content-type": types[extname(p)] || "text/plain" }); res.end(body); }
  catch { res.writeHead(404); res.end(); }
}).listen(0);
const base = `http://localhost:${srv.address().port}/`;
const b = await chromium.launch(); const page = await b.newPage({ viewport: { width: 390, height: 844 } });
const out = []; const ok = (name, cond) => out.push(`${cond ? "PASS" : "FAIL"} ${name}`);
page.on("dialog", (d) => d.accept());
// The old address (/) forwards to the app at /korean/.
await page.goto(base + "?from=old", { waitUntil: "networkidle" });
ok("old address forwards to /korean/", new URL(page.url()).pathname === "/korean/" && new URL(page.url()).search === "?from=old");
// Browse: input element survives typing
await page.click('[data-tab="browse"]');
const before = await page.evaluate(() => { window.__q = document.querySelector("#q"); return true; });
await page.type("#q", "경제");
ok("search input not replaced while typing", await page.evaluate(() => window.__q === document.querySelector("#q")));
ok("list filtered", (await page.locator(".item").count()) === 1);
// Dialog: cancel on empty form closes
await page.click("[data-add]"); await page.click('#edit button[value="cancel"]');
ok("cancel closes empty dialog", !(await page.evaluate(() => document.querySelector("#dlg").open)));
// Dialog: save with missing fields stays open and keeps text
await page.click("[data-add]"); await page.fill('input[name="ko"]', "테스트"); await page.click('#edit button[value="save"]');
ok("invalid save keeps dialog open", await page.evaluate(() => document.querySelector("#dlg").open));
ok("typed text kept", (await page.inputValue('input[name="ko"]')) === "테스트");
await page.keyboard.press("Escape");
// Review: Again keeps item due; unit stays learned
await page.evaluate(() => { const s = { progress: {}, custom: [], settings: {} }; localStorage.setItem("korean.v1", JSON.stringify(s)); });
await page.reload({ waitUntil: "networkidle" });
await page.click('[data-tab="learn"]');
let n = 0; while ((await page.inputValue("#unit-pick")) === "int-1" && await page.locator("[data-flip]").count() && n < 60) { await page.click("[data-flip]"); await page.click('[data-grade="good"]'); n++; }
ok(`unit 1 learned (${n} items) → current unit 2`, n >= 20 && (await page.evaluate(() => { const s = JSON.parse(localStorage.getItem("korean.v1")); return Object.keys(s.progress).length; })) === n);
await page.evaluate(() => { const s = JSON.parse(localStorage.getItem("korean.v1")); for (const k in s.progress) s.progress[k].due = 0; localStorage.setItem("korean.v1", JSON.stringify(s)); });
await page.reload({ waitUntil: "networkidle" });
const unitBefore = await page.textContent(".stat:nth-child(3) b");
await page.click('[data-tab="review"]'); await page.click("[data-flip]"); await page.click('[data-grade="again"]');
ok("after Again still all due", (await page.textContent("#due-badge")) === String(n));
await page.click('[data-tab="home"]');
ok(`unit unchanged after Again (${unitBefore})`, (await page.textContent(".stat:nth-child(3) b")) === unitBefore && unitBefore.startsWith("2/"));
// Add defaults to current unit
await page.click('[data-tab="browse"]'); await page.click("[data-add]");
ok("add defaults to unit 2", (await page.inputValue('input[name="unit"]')) === "2");
// Learn switch: Phrases / Grammar chips filter what Learn shows.
await page.keyboard.press("Escape"); // close the Add dialog left open above
await page.click('[data-tab="learn"]');
await page.click('[data-lkind="phrase"]');
ok("Learn Phrases chip shows a phrase", (await page.textContent("#card .pos")).trim() === "phrase");
await page.click('[data-lkind="grammar"]');
ok("Learn Grammar chip shows a grammar point", (await page.locator("#card .front.grammar").count()) === 1);
await page.click('[data-lkind="all"]');
// Quiz: unit test pass/fail, misses due now, leaving mid-test records nothing.
{
  const q = await b.newPage({ viewport: { width: 390, height: 844 } });
  await q.addInitScript(() => { globalThis.__QUIZ_TEST__ = true; globalThis.__QUIZ_SEED__ = 1; });
  await q.goto(base + "korean/", { waitUntil: "networkidle" });
  await q.evaluate(async () => {
    const { buildUnits } = await import("/lib/track.js"); const { koPack: p } = await import("/packs/ko.js");
    const u = buildUnits(p.vocab, p.grammar, p.tiers.map((x) => x.key)).find((x) => x.key === "int-1");
    localStorage.setItem("korean.v1", JSON.stringify({ progress: Object.fromEntries(u.items.map((i) => [i.id, { ease: 2.5, interval: 6, reps: 2, due: Date.now() + 9e9 }])), custom: [], settings: {} }));
  });
  await q.reload({ waitUntil: "networkidle" });
  const saved = () => q.evaluate(() => JSON.parse(localStorage.getItem("korean.v1")));
  const runTest = async (right) => {
    await q.click('[data-tab="quiz"]'); await q.click('[data-qstart="int-1"]');
    while (await q.locator("[data-qopt]").count()) {
      const a = await q.evaluate(() => window.__quizAnswer());
      const pick = right ? a : (a + 1) % (await q.locator("[data-qopt]").count());
      await q.click(`[data-qopt="${pick}"]`, { position: { x: 12, y: 12 } }); await q.click("[data-qnext]");
    }
  };
  await runTest(true);
  const s1 = await saved();
  await q.click('[data-tab="learn"]');
  ok("unit test passes with all-correct answers", (await q.textContent(".qresult").catch(() => "")) !== null && typeof s1.quiz.units["int-1"].passedAt === "number" && s1.quiz.units["int-1"].best === 15
    && (await q.locator('#unit-pick option[value="int-1"]').textContent()).includes("🏅"));
  await runTest(false);
  const s2 = await saved(), missed = Object.values(s2.progress).filter((p) => p.due <= Date.now()).length;
  ok("wrong answers bring items due; pass kept", missed === 15 && s2.quiz.units["int-1"].passedAt === s1.quiz.units["int-1"].passedAt && s2.quiz.units["int-1"].attempts.length === 2
    && (await q.textContent(".qverdict")).includes("Not yet"));
  await q.click('[data-qstart="int-1"]').catch(() => {}); await q.click("[data-qback]"); await q.click('[data-qstart="int-1"]');
  await q.click('[data-qopt="0"]', { position: { x: 12, y: 12 } }); await q.click('[data-tab="home"]'); await q.click('[data-tab="quiz"]');
  ok("leaving mid-test records nothing", (await q.locator("[data-qopt]").count()) === 0 && (await q.locator(".qunit").count()) > 0 && (await saved()).quiz.units["int-1"].attempts.length === 2);
  ok("no horizontal scroll on the Quiz tab", (await q.evaluate(() => document.documentElement.scrollWidth)) <= 390);
  await q.close();
}
await b.close(); srv.close(); console.log(out.join("\n"));
if (out.some((l) => l.startsWith("FAIL"))) process.exit(1);
