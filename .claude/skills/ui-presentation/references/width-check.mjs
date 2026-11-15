#!/usr/bin/env node
// Width sweep: no page wider than the phone (see ../SKILL.md, section 0). Portable: copy it into any repo.
//
//   node width-check.mjs <folder-or-url> [route ...] [--widths 320,375,390,430,768,1024,1280] [--themes light,dark]
//                        [--setup ./setup.mjs] [--shots <dir>] [--strict-taps] [--no-strict-breaks]
//
//   <folder-or-url>  a folder of static files (served on a free local port) or a running server (http://localhost:3000)
//   route ...        paths to visit (default "/"); a setup module may export `routes` instead
//   --setup          a module whose default export runs before each visit: async (page, { route, width, theme }) => {}
//                    (sign in, stub a JSON feed with page.route, set localStorage with page.addInitScript)
//   --shots          save a screenshot of each page, width and theme into that folder, for looking at by eye
//   --strict-taps    count tap targets under 44 px as faults (they are warnings otherwise)
//
// For each page, width and theme it opens every <details>, turns off line breaks inside paths, addresses and
// hyphenated words (iPhone's Safari doesn't break there; Chrome does, so a plain Chrome pass proves little), then reports:
//   WIDE       the page is wider than the screen
//   SPILL      an element leaves its parent's box (outside a box that scrolls or clips on purpose)
//   TEXT       an element's own text runs past its box
//   FIELD      a text field under 16 px at 760 px or narrower (iOS zooms the page and stays zoomed)
//   TAP        a control under 44 x 44 px at phone widths (warning unless --strict-taps)
// Exits 1 on any fault. Needs Playwright: installed globally, in the repo, or at PLAYWRIGHT_MODULE.
import { createServer } from "node:http";
import { readFile, stat, mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import { extname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const args = process.argv.slice(2);
const opt = (name, fallback) => { const i = args.indexOf(name); if (i < 0) return fallback; const v = args[i + 1]; args.splice(i, 2); return v; };
const flag = (name) => { const i = args.indexOf(name); if (i < 0) return false; args.splice(i, 1); return true; };
const widths = opt("--widths", "320,375,390,430,768,1024,1280").split(",").map(Number);
const themes = opt("--themes", "light,dark").split(",");
const setupPath = opt("--setup", null);
const shots = opt("--shots", null);
const strictTaps = flag("--strict-taps");
const strictBreaks = !flag("--no-strict-breaks");
const [target, ...routeArgs] = args;
if (!target) { console.error("usage: node width-check.mjs <folder-or-url> [route ...] [options]"); process.exit(2); }

async function playwright() {
  if (process.env.PLAYWRIGHT_MODULE) return import(pathToFileURL(resolve(process.env.PLAYWRIGHT_MODULE)).href);
  for (const from of [join(process.cwd(), "/"), import.meta.url]) { try { return createRequire(from)("playwright"); } catch { /* next */ } }
  throw new Error("Playwright not found: install it, or set PLAYWRIGHT_MODULE to its index.mjs");
}

const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".woff2": "font/woff2", ".ico": "image/x-icon" };
async function serve(folder) {
  const root = resolve(folder);
  const srv = createServer(async (req, res) => {
    let p = decodeURIComponent(req.url.split("?")[0]);
    if (p.endsWith("/")) p += "index.html";
    const file = join(root, p);
    if (!file.startsWith(root)) { res.writeHead(403); return res.end(); }
    try { const body = await readFile(file); res.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream" }); res.end(body); }
    catch { res.writeHead(404); res.end(); }
  });
  await new Promise((ok) => srv.listen(0, "127.0.0.1", ok));
  return { base: `http://127.0.0.1:${srv.address().port}`, close: () => srv.close() };
}

// Runs in the page. Returns { faults: [], warnings: [] }.
function measure({ width, strictBreaks, phone }) {
  if (strictBreaks) {
    // No break inside a path, address or hyphenated word: a word joiner on each side of - / . _ @ between non-spaces.
    const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (/^(SCRIPT|STYLE|TEXTAREA)$/.test(n.parentElement?.tagName || "") ? 2 : 1) });
    for (let n = walk.nextNode(); n; n = walk.nextNode()) if (/\S[-/._@]\S/.test(n.data)) n.data = n.data.replace(/(\S)([-/._@])(?=\S)/g, "$1⁠$2⁠");
  }
  const W = document.documentElement.clientWidth;
  const faults = [], warnings = [];
  const name = (el) => `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ""}${typeof el.className === "string" && el.className.trim() ? `.${el.className.trim().split(/\s+/).join(".")}` : ""}`;
  const said = (el) => ` "${(el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 40)}"`;
  const over = document.documentElement.scrollWidth - W;
  if (over > 0) faults.push(`WIDE page is ${document.documentElement.scrollWidth}px on a ${W}px screen (+${over})`);
  // A box that scrolls or clips sideways on purpose (a chip row, a table wrapper, a cropped picture) holds its children.
  const held = (el) => { for (let a = el.parentElement; a && a !== document.body && a !== document.documentElement; a = a.parentElement) {
    if (/^(auto|scroll|hidden|clip)$/.test(getComputedStyle(a).overflowX)) return true; } return false; };
  const reported = [];
  const inside = (el) => reported.some((r) => r.contains(el));
  for (const el of document.body.querySelectorAll("*")) {
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden" || /^(SCRIPT|STYLE|TEMPLATE|svg)$/i.test(el.tagName) || el.closest("svg")) continue;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height || inside(el) || held(el)) continue;
    const loose = cs.position === "fixed" || cs.position === "absolute";
    const p = el.parentElement, pr = p ? p.getBoundingClientRect() : { left: 0, right: W };
    const box = loose ? { left: 0, right: W } : pr;
    // Past the screen's edge is always a fault. Past the parent's edge is deliberate when a negative margin asks for
    // exactly that much (a bleed) or the element is rotated or scaled (its box grows with the turn).
    const offScreen = r.right > W + 1 || r.left < -1;
    const bleedL = Math.max(0, -parseFloat(cs.marginLeft) || 0), bleedR = Math.max(0, -parseFloat(cs.marginRight) || 0);
    const meant = cs.transform !== "none" || (box.left - r.left <= bleedL + 1 && r.right - box.right <= bleedR + 1);
    if (offScreen || (!meant && (r.right > box.right + 1 || r.left < box.left - 1))) {
      faults.push(`SPILL ${name(el)} ${Math.round(r.left)}..${Math.round(r.right)} in ${loose ? "the screen" : name(p)} ${Math.round(box.left)}..${Math.round(box.right)}${said(el)}`);
      reported.push(el); continue;
    }
    // Text that runs past its own box (a one-line label without truncation, say).
    if (cs.overflowX === "visible" && cs.display !== "inline" && el.scrollWidth > el.clientWidth + 1 && el.clientWidth > 0
      && [...el.childNodes].some((c) => c.nodeType === 3 && c.data.trim())) {
      faults.push(`TEXT ${name(el)} needs ${el.scrollWidth}px, has ${el.clientWidth}px${said(el)}`); reported.push(el); continue;
    }
    if (width <= 760 && el.matches("input:not([type=checkbox]):not([type=radio]):not([type=range]):not([type=color]):not([type=file]):not([type=hidden]):not([type=submit]):not([type=button]), select, textarea")
      && parseFloat(cs.fontSize) < 16) faults.push(`FIELD ${name(el)} is ${cs.fontSize} (16px or more, or iOS zooms)`);
    if (phone && el.matches("button, [role=button], summary, select, input[type=submit], input[type=button], a") && !(el.matches("a") && cs.display === "inline")
      && (r.width < 44 || r.height < 44) && !el.closest("[aria-hidden=true]")) warnings.push(`TAP ${name(el)} ${Math.round(r.width)}x${Math.round(r.height)}${said(el)}`);
  }
  return { faults, warnings };
}

const pw = await playwright();
const isUrl = /^https?:\/\//.test(target);
if (!isUrl && !(await stat(target).catch(() => null))?.isDirectory()) { console.error(`${target} is neither a URL nor a folder`); process.exit(2); }
const server = isUrl ? null : await serve(target);
const base = (isUrl ? target : server.base).replace(/\/$/, "");
const setup = setupPath ? await import(pathToFileURL(resolve(setupPath)).href) : {};
const routes = routeArgs.length ? routeArgs : setup.routes || ["/"];
if (shots) await mkdir(shots, { recursive: true });

const browser = await pw.chromium.launch();
let failed = 0, warned = 0;
for (const route of routes) for (const width of widths) for (const theme of themes) {
  const phone = width <= 480;
  const ctx = await browser.newContext({ viewport: { width, height: phone ? 844 : 900 }, colorScheme: theme, hasTouch: phone, serviceWorkers: "block" });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  try {
    if (setup.default) await setup.default(page, { route, width, theme, base });
    await page.goto(base + route, { waitUntil: "load", timeout: 20000 });
    await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});
    await page.evaluate(() => document.querySelectorAll("details").forEach((d) => { d.open = true; }));
    await page.waitForTimeout(300);
    const text = (await page.evaluate(() => document.body.innerText.trim().length));
    const { faults, warnings } = text < 40 ? { faults: ["NO CONTENT (an error or empty page proves nothing)"], warnings: [] } : await page.evaluate(measure, { width, strictBreaks, phone });
    for (const e of errors) faults.push(`ERROR ${e}`);
    const all = strictTaps ? [...faults, ...warnings] : faults;
    if (shots) await page.screenshot({ path: join(shots, `${route.replace(/[^\w]+/g, "_") || "root"}-${width}-${theme}.png`) });
    if (all.length) failed++;
    if (!strictTaps && warnings.length) warned++;
    console.log(`${all.length ? "FAIL" : "ok  "} ${String(width).padStart(4)} ${theme.padEnd(5)} ${route}`);
    for (const f of all.slice(0, 8)) console.log(`       ${f}`);
    if (all.length > 8) console.log(`       ... and ${all.length - 8} more`);
    if (!strictTaps && warnings.length) console.log(`       (${warnings.length} tap target${warnings.length > 1 ? "s" : ""} under 44 px, e.g. ${warnings[0].slice(4)})`);
  } catch (e) {
    failed++; console.log(`FAIL ${String(width).padStart(4)} ${theme.padEnd(5)} ${route}\n       could not open: ${e.message.split("\n")[0]}`);
  } finally { await ctx.close(); }
}
await browser.close();
server?.close();
console.log(`\n${failed ? `${failed} page-width${failed > 1 ? "s" : ""} failed` : "every page fits"}${warned ? `; ${warned} with small tap targets` : ""}.`);
process.exit(failed ? 1 : 0);
