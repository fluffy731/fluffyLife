// MC script for 25 Oct: fill-in names, contestant call cards, a "now" marker from the clock.
// Everything typed here stays in this browser's localStorage only.
const KEY = "mc-2026-10-25";
const N = 16;

const FIELDS = [
  ["上午", [
    ["chair", "商会会长", "郭子宁"],
    ["cllr", "政府要员姓名", "廖婵娥"],
    ["cllrTitle", "政府要员职衔", "墨尔本市议员"],
    ["mayor", "白马市市长", "Andrew Davenport"],
    ["vmes", "维省多元文化教育协会代表"],
    ["spk1", "特邀嘉宾①", "Deanna 施丹挺"],
    ["spk1Org", "嘉宾①机构", "东莞英凯教育"],
    ["sponsors", "赞助商上台名单"],
    ["captain", "匹克球队长"],
    ["pbTime", "匹克球训练时间地点"],
    ["unveil", "揭牌嘉宾（会长以外）"],
    ["foodArea", "取餐区位置"],
  ]],
  ["下午", [
    ["contestChair", "大赛主席"],
    ["advisors", "顾问团 / 组委会 / 赞助商名单"],
    ["presenter", "颁奖嘉宾"],
    ["youth1", "青少年组代表 1"],
    ["youth2", "青少年组代表 2"],
    ["seniors", "乐龄组代表"],
    ["judgeRep", "评委代表"],
  ]],
  ["获奖名单（当场填）", [
    ["merit", "优异奖"],
    ["third", "季军"],
    ["second", "亚军"],
    ["champ", "冠军"],
  ]],
];
// 成年组出场顺序表 as given; [name, song, reading hint for the MC].
const LINEUP = [
  ["区烽乐", "櫻花樹下", "区 读「欧」au1"], ["摇滚麦克", "餓狼傳說"], ["韦祎 Cici", "Where Did You Go", "祎 读「衣」ji1"],
  ["顾惠佳 Mia", "月半小夜曲"], ["Issy Voon", "情誡"], ["Vincent Mok", "用背脊唱情歌"],
  ["吴可贞 Ko Chen", "今宵多珍重"], ["李兆祥 Charlie", "一生中最愛"], ["Kin Yiu", "浮誇"],
  ["高麗雅 Gloria", "這麼近那麼遠"], ["林靖杰 JJ Lin", "用背脊唱情歌"], ["David Ho", "愛是永恆"],
  ["Alex Ng", "狌小子"], ["冯建强 Feng Sam", "情深說話未曾講"], ["司徒大叔 Danny Situ", "數字人生"], ["Yolanda Li", "搜神記"],
];
const LABEL = {}, DEFAULT = {};
for (const [, rows] of FIELDS) for (const [k, label, d] of rows) { LABEL[k] = label; if (d) DEFAULT[k] = d; }

const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } };
let S = load();
S.f ||= {}; S.r ||= [];
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch {} };
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const val = (k) => (S.f[k] ?? DEFAULT[k] ?? "").trim();
const mark = (v, ph) => (v ? `<b>${esc(v)}</b>` : `<b class="todo">[${esc(ph)}]</b>`);

function paintFills() {
  for (const el of $$("[data-k]")) {
    const v = val(el.dataset.k);
    el.textContent = v || `[${LABEL[el.dataset.k]}]`;
    el.classList.toggle("todo", !v);
  }
}

function paintRoster() {
  const who = (i) => (S.r[i]?.n ?? LINEUP[i]?.[0] ?? "").trim();
  const html = [];
  for (let i = 0; i < N; i++) {
    const no = `${i + 1}号选手`, name = who(i), song = (S.r[i]?.s ?? LINEUP[i]?.[1] ?? "").trim(), hint = LINEUP[i]?.[2];
    const next = i + 1 < N ? `下一位，${i + 2}号选手${who(i + 1) ? " " + mark(who(i + 1)) : ""}，请准备。` : "十六位选手全部唱完！";
    html.push(`<div class="call">
      <div class="call-h"><span class="no">${i + 1}</span>${name ? esc(name) : `<span class="todo">[${no}]</span>`}${song ? ` · 《${esc(song)}》` : ""}${hint ? `<span class="py">${esc(hint)}</span>` : ""}<span class="dur">3:00</span></div>
      <p class="say yue">有请 ${no}${name ? "，" + mark(name) : ""}${song ? `，为大家带嚟《${esc(song)}》` : ""}！掌声欢迎！</p>
      <p class="say yue">多谢${name ? " " + mark(name) : " " + no}！${next}</p>
      ${i + 2 < N ? `<p class="cue">后台叫号：${i + 3}号准备。</p>` : ""}
    </div>`);
  }
  $("#roster").innerHTML = html.join("");
}

function buildForms() {
  $("#fields").innerHTML = FIELDS.map(([group, rows]) => `<h3>${group}</h3>` + rows.map(([k, label, d]) =>
    `<label class="field"><span>${label}</span><input data-f="${k}" value="${esc(S.f[k] ?? d ?? "")}" placeholder="${esc(label)}"></label>`).join("")).join("");
  $("#rosterForm").innerHTML = Array.from({ length: N }, (_, i) =>
    `<div class="rrow"><span class="no">${i + 1}</span><input data-r="${i}" data-p="n" value="${esc(S.r[i]?.n ?? LINEUP[i][0])}" placeholder="姓名"><input data-r="${i}" data-p="s" value="${esc(S.r[i]?.s ?? LINEUP[i][1])}" placeholder="歌名"></div>`).join("");
}

document.addEventListener("input", (e) => {
  const t = e.target;
  if (t.dataset.f) { S.f[t.dataset.f] = t.value; paintFills(); }
  else if (t.dataset.r) { const i = +t.dataset.r; S.r[i] = { ...S.r[i], [t.dataset.p]: t.value }; paintRoster(); }
  else return;
  save();
});
$("#reset").addEventListener("click", () => {
  if (!confirm("清除全部填写？")) return;
  S = { ...S, f: {}, r: [] }; save(); buildForms(); paintFills(); paintRoster();
});

// Tabs
const tabs = $$("#tabs button");
function show(tab) {
  for (const b of tabs) b.classList.toggle("on", b.dataset.tab === tab);
  for (const p of $$(".panel")) p.hidden = p.id !== tab;
  S.tab = tab; save();
}
for (const b of tabs) b.addEventListener("click", () => { show(b.dataset.tab); scrollTo(0, 0); });

// Contents chips per panel
const mins = (hm) => { const [h, m] = hm.split(":").map(Number); return h * 60 + m; };
const segs = $$(".seg").map((el) => { const [a, b] = el.dataset.t.split("-"); return { el, a: mins(a), b: mins(b), name: el.dataset.name }; });
segs.forEach((s, i) => { s.el.id = `s${i}`; });
const hm12 = (m) => `${((Math.floor(m / 60) + 11) % 12) + 1}:${String(m % 60).padStart(2, "0")}`;
for (const panel of $$(".panel")) {
  const toc = $(".toc", panel);
  if (!toc) continue;
  toc.innerHTML = segs.filter((s) => panel.contains(s.el)).map((s) => `<a href="#${s.el.id}" data-seg="${s.el.id}"><time>${hm12(s.a)}</time>${esc(s.name)}</a>`).join("");
}

// Now marker
function tick() {
  const d = new Date(), m = d.getHours() * 60 + d.getMinutes();
  $("#clock").textContent = `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
  const cur = segs.find((s) => m >= s.a && m < s.b);
  for (const s of segs) s.el.classList.toggle("now", s === cur);
  for (const a of $$(".toc a")) a.classList.toggle("now", cur && a.dataset.seg === cur.el.id);
  $("#nowtxt").textContent = cur ? `现在：${cur.name} · 剩 ${cur.b - m} 分钟` : m < segs[0].a ? `${hm12(segs[0].a)} 开始 · 跳到第一段` : "活动已结束";
  return cur;
}
$("#nowbar").addEventListener("click", () => {
  const cur = tick() || (new Date().getHours() < 12 ? segs[0] : null);
  if (!cur) return;
  show(cur.el.closest(".panel").id);
  cur.el.scrollIntoView({ behavior: "smooth", block: "start" });
});

// Font size and theme
const root = document.documentElement;
const setFs = (px) => { S.fs = Math.max(15, Math.min(32, px)); root.style.setProperty("--fs", S.fs + "px"); save(); };
$("#smaller").addEventListener("click", () => setFs((S.fs || 19) - 2));
$("#bigger").addEventListener("click", () => setFs((S.fs || 19) + 2));
const setTheme = (t) => { if (t) root.dataset.theme = t; else delete root.dataset.theme; S.theme = t; save(); };
$("#theme").addEventListener("click", () => {
  const dark = S.theme ? S.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  setTheme(dark ? "light" : "dark");
});

if (S.fs) root.style.setProperty("--fs", S.fs + "px");
if (S.theme) root.dataset.theme = S.theme;
buildForms(); paintFills(); paintRoster();
const now = tick();
show(now ? now.el.closest(".panel").id : S.tab || "am");
setInterval(tick, 20000);

if ("serviceWorker" in navigator) navigator.serviceWorker.register("../sw.js").catch(() => {});
