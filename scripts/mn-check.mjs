// Behavioural checks for the Mongolian app (/mongolian/). Needs Playwright (PLAYWRIGHT_MODULE).
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
import { createServer } from "node:http"; import { readFile } from "node:fs/promises"; import { extname, join } from "node:path";
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png" };
const srv = createServer(async (req, res) => {
  let p = req.url.split("?")[0]; if (p.endsWith("/")) p += "index.html";
  try { const body = await readFile(join(process.cwd(), decodeURIComponent(p))); res.writeHead(200, { "content-type": types[extname(p)] || "text/plain" }); res.end(body); }
  catch { res.writeHead(404); res.end(); }
}).listen(0);
const base = `http://localhost:${srv.address().port}/`;
const b = await chromium.launch();
const out = []; const ok = (name, cond) => out.push(`${cond ? "PASS" : "FAIL"} ${name}`);

// 1. renders in Chinese with the letter key, a Cyrillic card with its Latin line, and the Learn chips
{
  const page = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  await page.goto(base + "mongolian/", { waitUntil: "networkidle" });
  ok("title and Chinese tabs", (await page.title()).includes("蒙古语") && (await page.locator("#tabs button").allTextContents()).join("|") === "⌂首页|✎学习|↻复习|✓测验|☰浏览|⚙设置");
  ok("home shows the letter key", (await page.locator(".letters .lt").count()) === 11);
  await page.click('[data-tab="learn"]');
  const front = await page.textContent("#card .front");
  ok("Learn card: Cyrillic with a Latin reading line", /[А-Яа-яӨөҮү]/.test(front) && /^[A-Za-zÖöÜü' ,.?!-]+$/.test((await page.textContent("#card .mnlat")).trim()));
  await page.click('[data-lkind="phrase"]');
  ok("Learn 常用语 chip shows a phrase", (await page.textContent("#card .pos")).includes("常用语"));
  await page.click('[data-lkind="grammar"]');
  ok("Learn 语法 chip shows a grammar point", (await page.locator("#card .front.grammar").count()) === 1);
  await page.click('[data-lkind="all"]');
  ok("no horizontal scroll", (await page.evaluate(() => document.documentElement.scrollWidth)) <= 390);
  ok("no page errors", errs.length === 0);
  await page.close();
}

// 2. unit test: all-correct answers pass
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "block" });
  const page = await ctx.newPage();
  await page.addInitScript(() => { globalThis.__QUIZ_TEST__ = true; globalThis.__QUIZ_SEED__ = 1; });
  await page.goto(base + "mongolian/", { waitUntil: "networkidle" });
  await page.evaluate(async () => {
    const { buildUnits } = await import("/lib/track.js"); const { mnPack: p } = await import("/packs/mn.js");
    const u = buildUnits(p.vocab, p.grammar, p.tiers.map((x) => x.key)).find((x) => x.key === "a0-1");
    localStorage.setItem("mn.v1", JSON.stringify({ progress: Object.fromEntries(u.items.map((i) => [i.id, { ease: 2.5, interval: 6, reps: 2, due: Date.now() + 9e9 }])), custom: [], settings: {} }));
  });
  await page.reload({ waitUntil: "networkidle" });
  await page.click('[data-tab="quiz"]'); await page.click('[data-qstart="a0-1"]');
  let n = 0;
  while (await page.locator("[data-qopt]").count()) {
    await page.click(`[data-qopt="${await page.evaluate(() => window.__quizAnswer())}"]`, { position: { x: 12, y: 12 } }); await page.click("[data-qnext]"); n++;
  }
  ok(`unit test passes with all-correct answers (${n} questions)`, n === 15 && (await page.textContent(".qverdict")).includes("通过"));
  await ctx.close();
}

// 3. offline after one visit
{
  const ctx = await b.newContext();
  const page = await ctx.newPage();
  await page.goto(base + "mongolian/", { waitUntil: "networkidle" });
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload({ waitUntil: "networkidle" });
  await ctx.setOffline(true);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForSelector("#view .stat", { timeout: 5000 }).catch(() => {});
  ok("renders offline", (await page.locator("#view .stat").count()) === 3 && (await page.title()).includes("蒙古语"));
  await ctx.close();
}
await b.close(); srv.close();
console.log(out.join("\n"));
if (out.some((l) => l.startsWith("FAIL"))) process.exit(1);
