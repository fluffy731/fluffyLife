// Pure state helpers for the builder checklist (tested in test/builder.test.js).
export const KEY = "builder.v1";
export const NPROJECTS = 3;
export const ROOT = "DB-U registration";

const blankProject = () => ({ addr: "", role: "", from: "", to: "", hrs: "", sup: "", supNo: "" });
export const blank = () => ({
  ticked: {},
  projects: Array.from({ length: NPROJECTS }, blankProject),
  evidence: {},
  refs: [],
  slots: [],
  hideDone: false,
});

const str = (v) => (typeof v === "string" ? v : "");
const flags = (o) => Object.fromEntries(Object.entries(o && typeof o === "object" && !Array.isArray(o) ? o : {}).filter(([, v]) => v === true));

// Accepts anything (old saves, imported files, corrupted storage) and returns a well-formed state.
export function normalise(raw) {
  const s = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  const projects = Array.from({ length: NPROJECTS }, (_, i) => {
    const p = Array.isArray(s.projects) && s.projects[i] && typeof s.projects[i] === "object" ? s.projects[i] : {};
    return Object.fromEntries(Object.keys(blankProject()).map((k) => [k, str(p[k])]));
  });
  const refs = (Array.isArray(s.refs) ? s.refs : []).filter((r) => r && typeof r === "object").map((r, i) => ({
    id: str(r.id) || `r${i + 1}`,
    name: str(r.name), regNo: str(r.regNo), company: str(r.company), note: str(r.note),
    steps: Object.fromEntries(Object.entries(r.steps && typeof r.steps === "object" ? r.steps : {}).filter(([, v]) => /^\d{4}-\d{2}-\d{2}$/.test(v))),
  }));
  const slots = (Array.isArray(s.slots) ? s.slots : []).filter((x) => x && typeof x.text === "string" && x.text.trim())
    .map((x, i) => ({ id: str(x.id) || `s${i + 1}`, text: x.text.trim(), done: x.done === true }));
  return { ticked: flags(s.ticked), projects, evidence: flags(s.evidence), refs, slots, hideDone: s.hideDone === true };
}

export function load(ls) {
  try { return normalise(JSON.parse(ls.getItem(KEY) || "{}")); } catch { return blank(); }
}

export function save(ls, s) {
  try { ls.setItem(KEY, JSON.stringify(s)); } catch { /* private mode or storage full: progress just won't persist */ }
}

export const sectionsFor = (sections, tab) => sections.filter((s) => s.tab === tab);

export function progress(sections, ticked) {
  let done = 0, total = 0;
  for (const s of sections) for (const it of s.items) { total++; if (ticked[it.key]) done++; }
  return { done, total };
}

// ---- Projects: which BPC activities are evidenced on which project ----
export const evidenceKey = (activity, i) => `${activity}:${i}`;

export const activityGaps = (activities, evidence) =>
  activities.filter(([id]) => !Array.from({ length: NPROJECTS }, (_, i) => evidence[evidenceKey(id, i)]).some(Boolean)).map(([id]) => id);

export const projectCounts = (activities, evidence) =>
  Array.from({ length: NPROJECTS }, (_, i) => activities.filter(([id]) => evidence[evidenceKey(id, i)]).length);

const monthIndex = (ym) => { const m = /^(\d{4})-(\d{2})$/.exec(ym || ""); return m ? Number(m[1]) * 12 + Number(m[2]) - 1 : null; };

// Months covered by the projects, counting overlaps once. A guide only: all of your experience counts, not just these projects.
export function coveredMonths(projects) {
  const spans = projects.map((p) => [monthIndex(p.from), monthIndex(p.to)]).filter(([a, b]) => a !== null && b !== null && b >= a).sort((x, y) => x[0] - y[0]);
  let total = 0, end = -Infinity;
  for (const [a, b] of spans) {
    if (b > end) { total += b - Math.max(a, end + 1) + 1; end = b; }
  }
  return total;
}

// BPC counts experience gained in the last seven years. A project that finished before that is outside the window.
export function outsideWindow(p, today) {
  const end = monthIndex(p.to), now = monthIndex(today.slice(0, 7));
  return end !== null && now !== null && end < now - 7 * 12;
}

// ---- Referees ----
export const newRef = (id) => ({ id, name: "", regNo: "", company: "", note: "", steps: {} });
export const refProgress = (r, steps) => steps.filter(([k]) => r.steps[k]).length;

// ---- OneDrive folders ----
// File names can't hold these on Windows, and $ ` ' would break the copy-and-paste shell commands.
export const cleanName = (s) => String(s).replace(/[<>:"/\\|?*$`'\u0000-\u001f]/g, " ").replace(/\s+/g, " ").trim().slice(0, 40).trim().replace(/[. ]+$/, "");

export function projectFolder(i, addr) {
  const a = cleanName(addr);
  return a ? `Project ${i + 1} - ${a}` : `Project ${i + 1}`;
}

const PROJECT_SUB = [
  { name: "01 Contract and scope", note: "Major domestic building contract, scope, quotes and estimates." },
  { name: "02 Permit and certification", note: "Building permit, inspection records, final certificates." },
  { name: "03 Site safety", note: "Site safety plan and induction records." },
  { name: "04 Subcontractors", note: "Who you engaged, and their registration or licence." },
  { name: "05 Proof of paid work", note: "Payslips, invoices, ABN records." },
  { name: "06 Photos and records", note: "Progress photos, site diary, correspondence." },
];

export const folderTree = (projects) => [
  { name: "00 Admin", note: "Application receipts, BPC emails, portal screenshots. No passwords." },
  { name: "01 Identity and probity", note: "ID, police check receipt, declarations." },
  { name: "02 Qualification", note: "CPC50220 certificate and transcript, plus the Cert IV if held." },
  {
    name: "03 Experience", note: "One folder per project, plus a timeline.",
    kids: [
      ...projects.map((p, i) => ({ name: projectFolder(i, p.addr), note: i === 0 ? "Folder name follows the address on the Projects tab." : "", kids: PROJECT_SUB })),
      { name: "Work history timeline", note: "One page: every role, employer, dates and supervisor." },
    ],
  },
  { name: "04 Referees", note: "Per referee: contact details, request sent, project list sent, confirmation.", kids: [{ name: "Referee 1", note: "" }, { name: "Referee 2", note: "BPC may ask for more than one." }] },
  { name: "05 Exam", note: "Study notes, Standards access receipt, system-check results.", kids: [{ name: "Study notes", note: "" }, { name: "Standards access", note: "" }, { name: "System check", note: "" }] },
  { name: "06 Insurance and registration", note: "Insurance quote and certificate, registration certificate and card." },
];

export function folderPaths(tree, prefix = "") {
  return tree.flatMap((n) => {
    const p = prefix ? `${prefix}/${n.name}` : n.name;
    return n.kids ? [p, ...folderPaths(n.kids, p)] : [p];
  });
}

// Only leaf folders are listed: mkdir -p and New-Item -Force create the parents.
const leaves = (tree, prefix = "") => tree.flatMap((n) => {
  const p = prefix ? `${prefix}/${n.name}` : n.name;
  return n.kids ? leaves(n.kids, p) : [p];
});

export function macCommands(tree) {
  const lines = leaves(tree).map((p) => `  "${ROOT}/${p}"`).join(" \\\n");
  return `cd "$(ls -d ~/Library/CloudStorage/OneDrive* | head -1)" && mkdir -p \\\n${lines}`;
}

export function winCommands(tree) {
  const lines = leaves(tree).map((p) => `  "${p}"`).join(",\n");
  return `# Work OneDrive: use $env:OneDriveCommercial instead of $env:OneDrive\n$root = Join-Path $env:OneDrive "${ROOT}"\n@(\n${lines}\n) | ForEach-Object { New-Item -ItemType Directory -Force -Path (Join-Path $root $_) | Out-Null }`;
}

export const plainList = (tree) => `${ROOT}\n${folderPaths(tree).map((p) => `${ROOT}/${p}`).join("\n")}`;
