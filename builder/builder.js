import { TABS, SECTIONS, ACTIVITIES, STEPS, SOURCES, CHECKED } from "./data.js";
import {
  load, save, normalise, sectionsFor, progress, evidenceKey, activityGaps, projectCounts, coveredMonths, outsideWindow,
  newRef, refProgress, folderTree, folderPaths, macCommands, winCommands, plainList, NPROJECTS, ROOT,
} from "./model.js";

const $ = (q) => document.querySelector(q);
const S = load(localStorage);
const persist = () => save(localStorage, S);
const view = $("#view");
const collapsed = new Set();

const pad = (n) => String(n).padStart(2, "0");
const todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const fmtDate = (iso) => new Date(`${iso}T00:00:00`).toLocaleDateString("en-AU", { day: "numeric", month: "long" });
const currentTab = () => { const h = location.hash.slice(1); return TABS.some((t) => t.id === h) ? h : "list"; };

function el(tag, props = {}, kids = []) {
  const n = Object.assign(document.createElement(tag), props);
  for (const k of [].concat(kids)) if (k != null) n.append(k);
  return n;
}

// A section that remembers whether it was left open.
function section(id, titleNodes, count, body, extraClass = "") {
  const det = el("details", { className: `sec ${extraClass}`.trim(), open: !collapsed.has(id) });
  det.addEventListener("toggle", () => { det.open ? collapsed.delete(id) : collapsed.add(id); paintTools(); });
  det.append(el("summary", {}, [...[].concat(titleNodes), el("span", { className: "n", textContent: count })]), ...[].concat(body));
  return det;
}

// ---------- Checklist and Exam tabs ----------
function checklist(tab) {
  const nodes = [];
  if (tab === "exam") {
    nodes.push(el("div", { className: "card" }, [
      el("h2", { textContent: "How the exam works" }),
      el("p", { className: "small", textContent: "One proctored online exam replaced the interview and the plan exam. It is recorded, questions are randomised, and BPC has not published a syllabus or question bank." }),
      el("p", { className: "small", textContent: "Allowed: the exam's own Resources, Calculator and Notes tools, and online reference material. Not allowed: printed notes, phones, second screens, search engines, AI tools. Keep every question confidential, during and after." }),
    ]));
  }
  for (const sec of sectionsFor(SECTIONS, tab)) {
    const items = S.hideDone ? sec.items.filter((it) => !S.ticked[it.key]) : sec.items;
    const { done, total } = progress([sec], S.ticked);
    const ul = el("ul");
    for (const it of items) {
      const box = el("input", { type: "checkbox", checked: !!S.ticked[it.key] });
      box.addEventListener("change", () => { if (box.checked) S.ticked[it.key] = true; else delete S.ticked[it.key]; persist(); render(); });
      const text = el("span", { className: "t" }, [el("b", { textContent: it.text }), it.note ? el("span", { className: "note", textContent: it.note }) : null,
        it.confirm ? el("span", { className: "tag", textContent: "Confirm in portal" }) : null]);
      ul.append(el("li", { className: S.ticked[it.key] ? "done" : "" }, el("label", {}, [box, text])));
    }
    if (S.hideDone && total && !items.length) ul.append(el("li", { className: "empty", textContent: "All done ✓" }));
    nodes.push(section(sec.id, [el("span", { textContent: sec.icon }), el("span", { className: "st", textContent: sec.title })], `${done}/${total}`, ul, total && done === total ? "full" : ""));
  }
  return nodes;
}

// ---------- Projects tab ----------
const FIELDS = [
  ["addr", "Site address", "text", true], ["role", "Your role", "text", true, "Site supervisor or construction manager"],
  ["from", "Start", "month"], ["to", "Finish", "month"], ["hrs", "On-site hours a week", "number"], ["supNo", "Supervisor's registration no.", "text"],
  ["sup", "Supervising registered practitioner", "text", true],
];

function projects() {
  const nodes = [];
  const counts = projectCounts(ACTIVITIES, S.evidence);
  nodes.push(el("div", { className: "card" }, [
    el("h2", { textContent: "Your three projects" }),
    el("p", { className: "small muted", textContent: "BPC wants recent, paid, supervised experience across the technical, supervision and contractual sides. Fill these in from your own records. They stay on this device." }),
  ]));
  for (let i = 0; i < NPROJECTS; i++) {
    const p = S.projects[i];
    const grid = el("div", { className: "fields" });
    for (const [k, label, type, wide, ph] of FIELDS) {
      const input = el("input", { type, value: p[k], placeholder: ph || "", autocomplete: "off", ariaLabel: `Project ${i + 1}: ${label}` });
      if (type === "number") { input.min = "0"; input.max = "100"; input.inputMode = "numeric"; }
      input.addEventListener("input", () => { p[k] = input.value; persist(); paintHeader(); paintProjectFlags(i); });
      grid.append(el("label", { className: "fld" + (wide ? " wide" : "") }, [label, input]));
    }
    grid.append(el("div", { className: "flag", id: `flag${i}`, hidden: true }));
    const title = el("span", { className: "st", textContent: `Project ${i + 1}` });
    nodes.push(section(`p${i}`, [el("span", { textContent: "🏗️" }), title], `${counts[i]}/${ACTIVITIES.length}`, grid));
  }

  const ul = el("ul", { className: "acts" });
  for (const [id, label] of ACTIVITIES) {
    const btns = el("div", { className: "pbtns" });
    for (let i = 0; i < NPROJECTS; i++) {
      const on = !!S.evidence[evidenceKey(id, i)];
      const b = el("button", { type: "button", className: "pbtn", textContent: String(i + 1), ariaLabel: `${label}: evidenced on project ${i + 1}` });
      b.setAttribute("aria-pressed", String(on));
      b.addEventListener("click", () => { const k = evidenceKey(id, i); if (S.evidence[k]) delete S.evidence[k]; else S.evidence[k] = true; persist(); render(); });
      btns.append(b);
    }
    ul.append(el("li", { className: activityGaps([[id]], S.evidence).length ? "gap" : "" }, [el("span", { className: "what", textContent: label }), btns]));
  }
  const gaps = activityGaps(ACTIVITIES, S.evidence).length;
  nodes.push(section("matrix", [el("span", { textContent: "🧩" }), el("span", { className: "st", textContent: "Evidence by activity" })], `${ACTIVITIES.length - gaps}/${ACTIVITIES.length}`,
    [el("p", { className: "note small muted", style: "padding:0 14px 8px;margin:0", textContent: "Tap the project numbers that show you doing each activity. Amber means no project shows it yet." }), ul], gaps ? "" : "full"));
  queueMicrotask(() => S.projects.forEach((_, i) => paintProjectFlags(i)));
  return nodes;
}

function paintProjectFlags(i) {
  const p = S.projects[i], flag = $(`#flag${i}`);
  if (!flag) return;
  const notes = [];
  if (p.from && p.to && p.to < p.from) notes.push("Finish is before the start.");
  if (outsideWindow(p, todayISO())) notes.push("Finished more than 7 years ago. BPC counts only the last 7 years.");
  flag.textContent = notes.length ? `⚠ ${notes.join(" ")}` : "";
  flag.hidden = !notes.length;
}

// ---------- Referees tab ----------
function referees() {
  const nodes = [el("div", { className: "card" }, [
    el("h2", { textContent: "Technical referees" }),
    el("p", { className: "small", textContent: "A referee must be a registered Domestic Builder in the same class or higher, and must have directly supervised your work. You may need more than one." }),
    el("p", { className: "small muted", textContent: "BPC says reports moved online in June 2026, filed from the referee's own BPC account. Confirm in your application whether yours is online or a signed form." }),
  ])];
  S.refs.forEach((r, ri) => {
    const grid = el("div", { className: "fields" });
    for (const [k, label, wide, area] of [["name", "Name", true], ["regNo", "Registration number", false], ["company", "Company", false], ["note", "Notes: projects supervised, contact details", true, true]]) {
      const input = el(area ? "textarea" : "input", { value: r[k], autocomplete: "off", ariaLabel: `Referee ${ri + 1}: ${label}` });
      input.addEventListener("input", () => { r[k] = input.value; persist(); });
      grid.append(el("label", { className: "fld" + (wide ? " wide" : "") }, [label, input]));
    }
    const ul = el("ul", { className: "steps" });
    for (const [k, label] of STEPS) {
      const box = el("input", { type: "checkbox", checked: !!r.steps[k] });
      box.addEventListener("change", () => { if (box.checked) r.steps[k] = todayISO(); else delete r.steps[k]; persist(); render(); });
      ul.append(el("li", {}, el("label", {}, [box, label, r.steps[k] ? el("span", { className: "when", textContent: fmtDate(r.steps[k]) }) : null])));
    }
    const rm = el("button", { type: "button", className: "del", textContent: "Remove referee" });
    armed(rm, "Remove referee", "Tap again to remove", () => { S.refs.splice(ri, 1); persist(); render(); });
    nodes.push(section(r.id, [el("span", { textContent: "✍️" }), el("span", { className: "st", textContent: r.name.trim() || `Referee ${ri + 1}` })], `${refProgress(r, STEPS)}/${STEPS.length}`, [grid, ul, el("div", { className: "add" }, rm)]));
  });
  const form = el("form", { className: "card add-card", autocomplete: "off" });
  const name = el("input", { type: "text", name: "name", placeholder: "Referee's name", enterKeyHint: "done", ariaLabel: "New referee name" });
  form.append(el("div", { className: "add", style: "padding:0;border:0" }, [name, el("button", { type: "submit", textContent: "＋ Add referee" })]));
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const id = `r${Date.now().toString(36)}`;
    S.refs.push({ ...newRef(id), name: name.value.trim() });
    persist(); render();
  });
  nodes.push(form);
  return nodes;
}

// Two taps to confirm, so a stray touch can't delete anything.
function armed(btn, label, armedLabel, action) {
  let timer = 0;
  btn.addEventListener("click", () => {
    if (!timer) {
      btn.textContent = armedLabel; btn.classList.add("armed");
      timer = setTimeout(() => { timer = 0; btn.textContent = label; btn.classList.remove("armed"); }, 3000);
      return;
    }
    clearTimeout(timer); timer = 0; action();
  });
}

// ---------- Folders tab ----------
function treeList(nodes) {
  return el("ul", {}, nodes.map((n) => el("li", {}, [el("span", { className: "fn", textContent: n.name }), n.note ? el("span", { className: "fnote", textContent: n.note }) : null, n.kids ? treeList(n.kids) : null])));
}

async function copy(text, btn) {
  const was = btn.textContent;
  try { await navigator.clipboard.writeText(text); btn.textContent = "Copied ✓"; }
  catch {
    const ta = el("textarea", { value: text, style: "position:fixed;opacity:0" });
    document.body.append(ta); ta.select();
    let ok = false; try { ok = document.execCommand("copy"); } catch { /* fall through */ }
    ta.remove(); btn.textContent = ok ? "Copied ✓" : "Press and hold the text to copy";
  }
  setTimeout(() => { btn.textContent = was; }, 2200);
}

function folders() {
  const tree = folderTree(S.projects);
  const mac = macCommands(tree), win = winCommands(tree);
  const nodes = [];
  nodes.push(el("div", { className: "card" }, [
    el("h2", { textContent: "OneDrive structure" }),
    el("p", { className: "small muted", textContent: "Everything for the application in one folder, numbered in the order you will need it. Project folders take their names from the addresses on the Projects tab, so fill those in first." }),
  ]));
  const rootList = treeList(tree);
  rootList.className = "tree";
  nodes.push(el("div", { className: "card" }, [el("p", { className: "fn", style: "margin:0 0 6px", textContent: ROOT }), rootList]));

  const row = el("div", { className: "btnrow" });
  for (const [label, text] of [["Copy Mac commands", mac], ["Copy Windows commands", win], ["Copy plain list", plainList(tree)]]) {
    const b = el("button", { type: "button", className: "chip", textContent: label });
    b.addEventListener("click", () => copy(text, b));
    row.append(b);
  }
  nodes.push(el("div", { className: "card" }, [
    el("h2", { textContent: `Create the ${folderPaths(tree).length} folders in one go` }),
    el("p", { className: "small muted", textContent: "Paste into Terminal (Mac) or PowerShell (Windows) on a computer signed in to OneDrive. The commands only create empty folders. They never delete or move anything." }),
    row,
    el("details", {}, [el("summary", { className: "small", style: "margin-top:10px", textContent: "Show the Mac commands" }), el("pre", { className: "cmd", textContent: mac })]),
    el("details", {}, [el("summary", { className: "small", style: "margin-top:6px", textContent: "Show the Windows commands" }), el("pre", { className: "cmd", textContent: win })]),
  ]));

  const ul = el("ul");
  S.slots.forEach((s, i) => {
    const box = el("input", { type: "checkbox", checked: s.done });
    box.addEventListener("change", () => { s.done = box.checked; persist(); render(); });
    const del = el("button", { type: "button", className: "del", textContent: "✕", ariaLabel: `Remove ${s.text}` });
    del.addEventListener("click", () => { S.slots.splice(i, 1); persist(); render(); });
    ul.append(el("li", { className: s.done ? "done" : "" }, [el("label", {}, [box, el("span", { className: "t" }, el("b", { textContent: s.text }))]), del]));
  });
  if (!S.slots.length) ul.append(el("li", { className: "empty", textContent: "None yet. Add them as you meet them in the application." }));
  const form = el("form", { className: "add", autocomplete: "off" });
  const slot = el("input", { type: "text", name: "slot", placeholder: "Slot name, as the portal words it", enterKeyHint: "done", ariaLabel: "New document slot" });
  form.append(slot, el("button", { type: "submit", textContent: "＋ Add" }));
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = slot.value.trim();
    if (text) { S.slots.push({ id: `s${Date.now().toString(36)}`, text, done: false }); persist(); render(); }
  });
  nodes.push(el("div", { className: "card warn" }, [
    el("h2", { textContent: "What the portal asks for" }),
    el("p", { className: "small", textContent: "BPC cut DB-U attachments from about 40 to about 7 but does not name them on its public pages. Log in, open your application, and list each document slot here exactly as the portal words it. Tick them as you upload." }),
  ]));
  nodes.push(section("slots", [el("span", { textContent: "📎" }), el("span", { className: "st", textContent: "Portal document slots" })], `${S.slots.filter((s) => s.done).length}/${S.slots.length}`, [ul, form],
    S.slots.length && S.slots.every((s) => s.done) ? "full" : ""));
  return nodes;
}

// ---------- Shell ----------
function paintHeader() {
  const tab = currentTab(), prog = $(".prog");
  const plain = tab !== "list" && tab !== "exam";
  prog.classList.toggle("plain", plain);
  if (!plain) {
    const { done, total } = progress(sectionsFor(SECTIONS, tab), S.ticked);
    $("#bar").style.width = total ? `${(100 * done) / total}%` : "0";
    $("#count").textContent = `${done} / ${total} done`;
  } else if (tab === "projects") {
    const gaps = activityGaps(ACTIVITIES, S.evidence).length, months = coveredMonths(S.projects);
    const span = months ? `${Math.floor(months / 12)} y ${months % 12} m covered by these projects` : "Add start and finish dates";
    $("#count").textContent = `${gaps ? `${gaps} of ${ACTIVITIES.length} activities not evidenced` : "All activities evidenced ✓"} · ${span}`;
  } else if (tab === "refs") {
    $("#count").textContent = S.refs.length ? `${S.refs.length} referee${S.refs.length > 1 ? "s" : ""}` : "No referees yet";
  } else {
    $("#count").textContent = `${S.slots.filter((s) => s.done).length} of ${S.slots.length} portal slots uploaded`;
  }
}

const sectionEls = () => [...view.querySelectorAll(":scope > details")];
const allClosed = () => sectionEls().length > 0 && sectionEls().every((d) => !d.open);

function paintTools() {
  const tab = currentTab(), tools = $("#tools");
  tools.replaceChildren();
  if (tab !== "list" && tab !== "exam") return;
  const hide = el("input", { type: "checkbox", checked: S.hideDone });
  hide.addEventListener("change", () => { S.hideDone = hide.checked; persist(); render(); });
  const expand = el("button", { type: "button", className: "chip", textContent: allClosed() ? "Expand all" : "Collapse all" });
  expand.addEventListener("click", () => {
    if (allClosed()) collapsed.clear(); else for (const s of sectionsFor(SECTIONS, tab)) collapsed.add(s.id);
    render();
  });
  tools.append(el("label", { className: "chip" }, [hide, "Hide done"]), expand);
}

function render() {
  const tab = currentTab();
  $("#title").textContent = TABS.find((t) => t.id === tab).label;
  const build = { list: () => checklist("list"), exam: () => checklist("exam"), projects, refs: referees, folders }[tab];
  view.replaceChildren(...build());
  $("#tabbar").replaceChildren(...TABS.map((t) => {
    const a = el("a", { href: `#${t.id}` }, [el("span", { textContent: t.icon }), t.label]);
    a.querySelector("span").setAttribute("aria-hidden", "true");
    if (t.id === tab) a.setAttribute("aria-current", "page");
    return a;
  }));
  paintHeader(); paintTools();
}

window.addEventListener("hashchange", () => { render(); window.scrollTo(0, 0); });

// Footer: sources, backup, reset.
$("#sources").append(`Requirements checked against BPC pages on ${CHECKED}. Sources: `, ...SOURCES.flatMap(([label, href], i) => [i ? " · " : "", el("a", { href, textContent: label, target: "_blank", rel: "noopener" })]));

const reset = $("#reset");
armed(reset, "Reset ticks", "Tap again to clear", () => { S.ticked = {}; persist(); reset.textContent = "Reset ticks"; reset.classList.remove("armed"); render(); });

$("#export").addEventListener("click", () => {
  const url = URL.createObjectURL(new Blob([JSON.stringify(S, null, 2)], { type: "application/json" }));
  const a = el("a", { href: url, download: `builder-checklist-${todayISO()}.json` });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

$("#import").addEventListener("change", async (e) => {
  const file = e.target.files[0], lbl = $("#importLbl");
  e.target.value = "";
  if (!file) return;
  try {
    Object.assign(S, normalise(JSON.parse(await file.text())));
    persist(); render(); lbl.textContent = "Imported ✓";
  } catch { lbl.textContent = "Not a backup file"; }
  setTimeout(() => { lbl.textContent = "Import backup"; }, 2500);
});

render();

if ("serviceWorker" in navigator) navigator.serviceWorker.register("../sw.js").catch(() => {});
