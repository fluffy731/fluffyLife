const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
import { createServer } from "node:http"; import { readFile } from "node:fs/promises"; import { extname, join } from "node:path";
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png" };
const srv = createServer(async (req, res) => {
  let p = req.url.split("?")[0]; if (p.endsWith("/")) p += "index.html";
  try { const body = await readFile(join(process.cwd(), p)); res.writeHead(200, { "content-type": types[extname(p)] || "text/plain" }); res.end(body); }
  catch { res.writeHead(404); res.end(); }
}).listen(0);
const base = `http://localhost:${srv.address().port}/`;
// Learn, Quiz, Browse and Settings can sit in the More sheet (Korean: Learn, Quiz, Settings; Cantonese and
// English: Browse, Settings): tap the tab when it is on the bottom bar, otherwise open More and tap its tile.
const tabTo = async (p, name) => {
  if (await p.locator(`#tabs [data-tab="${name}"]`).count()) return p.click(`#tabs [data-tab="${name}"]`);
  await p.click("#tabs [data-more]");
  await p.click(`#more [data-tab="${name}"]`);
  await p.waitForFunction(() => !document.querySelector("#more").open);   // the page behind is inert until the sheet has slid away
};
const b = await chromium.launch(); const page = await b.newPage({ viewport: { width: 390, height: 844 } });
const out = []; const ok = (name, cond) => out.push(`${cond ? "PASS" : "FAIL"} ${name}`);
page.on("dialog", (d) => d.accept());
// The old address (/) forwards to the app at /korean/.
await page.goto(base + "?from=old", { waitUntil: "networkidle" });
ok("old address forwards to /korean/", new URL(page.url()).pathname === "/korean/" && new URL(page.url()).search === "?from=old");
// Browse: input element survives typing
await tabTo(page, "browse");
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
await tabTo(page, "learn");
let n = 0; while ((await page.inputValue("#unit-pick")) === "int-1" && await page.locator("[data-flip]").count() && n < 60) { await page.click("[data-flip]"); await page.click('[data-grade="good"]'); n++; }
ok(`unit 1 learned (${n} items) → current unit 2`, n >= 20 && (await page.evaluate(() => { const s = JSON.parse(localStorage.getItem("korean.v1")); return Object.keys(s.progress).length; })) === n);
await page.evaluate(() => { const s = JSON.parse(localStorage.getItem("korean.v1")); for (const k in s.progress) s.progress[k].due = 0; localStorage.setItem("korean.v1", JSON.stringify(s)); });
await page.reload({ waitUntil: "networkidle" });
const unitBefore = await page.textContent(".route-stats b");
await tabTo(page, "review"); await page.click("[data-flip]"); await page.click('[data-grade="again"]');
ok("after Again still all due", (await page.textContent("#due-badge")) === `${n} due`);
await tabTo(page, "home");
ok(`unit unchanged after Again (${unitBefore})`, (await page.textContent(".route-stats b")) === unitBefore && unitBefore.startsWith("2/"));
// Add defaults to current unit
await tabTo(page, "browse"); await page.click("[data-add]");
ok("add defaults to unit 2", (await page.inputValue('input[name="unit"]')) === "2");
// Learn switch: Phrases / Grammar chips filter what Learn shows.
await page.keyboard.press("Escape"); // close the Add dialog left open above
await tabTo(page, "learn");
await page.click('[data-lkind="phrase"]');
ok("Learn Phrases chip shows a phrase", (await page.textContent("#card .pos")).trim() === "phrase");
await page.click('[data-lkind="grammar"]');
ok("Learn Grammar chip shows a grammar point", (await page.locator("#card .front.grammar").count()) === 1);
await page.click('[data-lkind="all"]');
// Dictionary: Browse search shows dictionary hits under your own items; "+ Add to study" saves one.
{
  // Service worker blocked: it claims the page and would fetch the dictionary itself, past this mock.
  const dctx = await b.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "block" });
  const d = await dctx.newPage();
  const rows = [["經", "經", "字", "지날 경", "to pass through", "", ""], ["실험실", "實驗室", "n", "", "laboratory; lab", "실험실에서 일해요.", "I work in a lab."]];
  await d.route("**/dict/ko.json", (r) => r.fulfill({ contentType: "application/json", body: JSON.stringify({ source: "test", rows }) }));
  d.on("dialog", (x) => x.accept());
  await d.goto(base + "korean/", { waitUntil: "networkidle" });
  await tabTo(d, "browse");
  await d.fill("#q", "실험실");
  await d.waitForSelector(".item.dict");
  ok("dictionary hit shows hanja and meaning", (await d.textContent(".item.dict")).includes("實驗室") && (await d.textContent(".item.dict")).includes("laboratory"));
  await d.fill("#q", "經");
  await d.waitForSelector(".item.dict");
  ok("hanja search finds the character with its 훈음", (await d.textContent(".item.dict")).includes("지날 경"));
  await d.fill("#q", "실험실");
  await d.click(".item.dict"); await d.click("[data-dictadd]");
  ok("+ Add to study opens the editor prefilled", (await d.inputValue('input[name="ko"]')) === "실험실" && (await d.inputValue('input[name="hanja"]')) === "實驗室" && (await d.inputValue('input[name="en"]')) === "laboratory");
  await d.click('#edit button[value="save"]');
  const saved = await d.evaluate(() => JSON.parse(localStorage.getItem("korean.v1")).custom.find((c) => c.ko === "실험실"));
  ok("added word is saved as a custom card", !!saved && saved.hanja === "實驗室" && saved.ex === "실험실에서 일해요.");
  await d.fill("#q", "실험실");
  ok("once added it appears in your list, not twice", (await d.locator(".item:not(.dict)").count()) === 1 && (await d.locator(".item.dict").count()) === 0);
  await dctx.close();
}
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
    await tabTo(q, "quiz"); await q.click('[data-qstart="int-1"]');
    while (await q.locator("[data-qopt]").count()) {
      const a = await q.evaluate(() => window.__quizAnswer());
      const pick = right ? a : (a + 1) % (await q.locator("[data-qopt]").count());
      await q.click(`[data-qopt="${pick}"]`, { position: { x: 12, y: 12 } }); await q.click("[data-qnext]");
    }
  };
  await runTest(true);
  const s1 = await saved();
  await tabTo(q, "learn");
  ok("unit test passes with all-correct answers", (await q.textContent(".qresult").catch(() => "")) !== null && typeof s1.quiz.units["int-1"].passedAt === "number" && s1.quiz.units["int-1"].best === 15
    && (await q.locator('#unit-pick option[value="int-1"]').textContent()).includes(" · passed"));
  await runTest(false);
  const s2 = await saved(), missed = Object.values(s2.progress).filter((p) => p.due <= Date.now()).length;
  ok("wrong answers bring items due; pass kept", missed === 15 && s2.quiz.units["int-1"].passedAt === s1.quiz.units["int-1"].passedAt && s2.quiz.units["int-1"].attempts.length === 2
    && (await q.textContent(".qverdict")).includes("Not yet"));
  await q.click('[data-qstart="int-1"]').catch(() => {}); await q.click("[data-qback]"); await q.click('[data-qstart="int-1"]');
  await q.click('[data-qopt="0"]', { position: { x: 12, y: 12 } }); await tabTo(q, "home"); await tabTo(q, "quiz");
  ok("leaving mid-test records nothing", (await q.locator("[data-qopt]").count()) === 0 && (await q.locator(".qunit").count()) > 0 && (await saved()).quiz.units["int-1"].attempts.length === 2);
  ok("no horizontal scroll on the Quiz tab", (await q.evaluate(() => document.documentElement.scrollWidth)) <= 390);
  await q.close();
}
// More sheet: four destinations on the bar, the rest one tap away in a sheet that slides up.
{
  const m = await b.newPage({ viewport: { width: 390, height: 844 } });
  await m.goto(base + "korean/", { waitUntil: "networkidle" });
  ok("bottom bar holds Home, Review, Songs, Browse and More", (await m.locator("#tabs button").allTextContents()).map((x) => x.trim()).join("|") === "Home|Review|Songs|Browse|More");
  await m.click("#tabs [data-more]");
  const sheetOpen = () => m.evaluate(() => document.querySelector("#more").open);
  ok("More opens the sheet", await sheetOpen());
  const tiles = await m.locator("#more .tile").allTextContents();
  ok("the sheet lists Learn, Quiz and Settings, each with a hint", tiles.length === 3 && tiles[0].includes("Learn") && tiles[0].includes("New words") && tiles[1].includes("Quiz") && tiles[2].includes("Settings"));
  await m.click('#more [data-tab="quiz"]');
  await m.waitForFunction(() => !document.querySelector("#more").open);
  ok("a tile opens its page and closes the sheet", (await m.locator(".qunit").count()) > 0 && (await m.textContent("#view")).includes("Practice quiz"));
  ok("More is marked active while one of its pages is open", await m.evaluate(() => document.querySelector("#tabs [data-more]").classList.contains("active")));
  await m.click("#tabs [data-more]");
  ok("the open page's tile is marked", await m.evaluate(() => document.querySelector('#more [data-tab="quiz"]').classList.contains("on")));
  await m.keyboard.press("Escape");
  await m.waitForFunction(() => !document.querySelector("#more").open);
  ok("Escape closes the sheet", !(await sheetOpen()));
  await m.click("#tabs [data-more]");
  await m.mouse.click(195, 60);   // above the sheet: the backdrop
  await m.waitForFunction(() => !document.querySelector("#more").open);
  ok("tapping above the sheet closes it", !(await sheetOpen()));
  await m.click("#tabs [data-more]");
  await m.click("#more .tiles");   // the gap between tiles, inside the sheet
  await m.waitForTimeout(300);
  ok("tapping inside the sheet keeps it open", await sheetOpen());
  await m.keyboard.press("Escape");
  await m.click('#tabs [data-tab="home"]');
  ok("a bar tab clears the More marker", !(await m.evaluate(() => document.querySelector("#tabs [data-more]").classList.contains("active"))));
  await m.close();
}
await b.close(); srv.close(); console.log(out.join("\n"));
if (out.some((l) => l.startsWith("FAIL"))) process.exit(1);
