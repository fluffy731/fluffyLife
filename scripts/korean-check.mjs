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
await b.close(); srv.close(); console.log(out.join("\n"));
