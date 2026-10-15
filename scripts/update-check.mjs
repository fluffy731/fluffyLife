// Does a new deploy reach an installed app on the next open? GitHub Pages serves files with
// Cache-Control: max-age=600, so a service worker that fetches through the HTTP cache can serve a
// stale app for up to 10 minutes. This server mimics that header and changes one file between opens.
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
import { createServer } from "node:http"; import { readFile } from "node:fs/promises"; import { extname, join } from "node:path";
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png" };
let deployed = 1;
const srv = createServer(async (req, res) => {
  let p = req.url.split("?")[0]; if (p.endsWith("/")) p += "index.html";
  try {
    let body = await readFile(join(process.cwd(), p));
    if (deployed === 2 && p === "/ui/ko.js") body = Buffer.from(String(body).replace('home: "홈"', 'home: "홈 v2"'));
    res.writeHead(200, { "content-type": types[extname(p)] || "text/plain", "cache-control": "max-age=600" });
    res.end(body);
  } catch { res.writeHead(404); res.end(); }
}).listen(0);
const base = `http://localhost:${srv.address().port}/yue/`;
const b = await chromium.launch(); const ctx = await b.newContext(); const page = await ctx.newPage();
await page.goto(base, { waitUntil: "networkidle" });
await page.evaluate(() => navigator.serviceWorker.ready);
await page.reload({ waitUntil: "networkidle" });                 // now controlled by the worker
deployed = 2;                                                       // a new version is deployed
await page.close();                                                 // user swipes the app closed…
const again = await ctx.newPage();                                  // …and opens it again (fresh page, same install)
await again.goto(base, { waitUntil: "networkidle" });
const label = (await again.textContent('[data-tab="home"]')).trim();
await b.close(); srv.close();
const ok = label.endsWith("홈 v2");
console.log(`${ok ? "PASS" : "FAIL"} reopening after a deploy shows the new version (tab label: "${label}")`);
if (!ok) process.exit(1);
