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
    ["captain", "匹克球队长"],
    ["pbTime", "匹克球训练时间地点"],
    ["unveil", "揭牌嘉宾（会长以外）"],
    ["foodArea", "取餐区位置", "后方"],
  ]],
  ["下午", [
    ["contestChair", "大赛主席"],
    ["consul", "领事姓名", "王晓庆"],
    ["advisors", "顾问团 / 组委会 / 赞助商名单"],
    ["presenter", "颁奖嘉宾"],
    ["youth1", "少年组表演 1", "Luciana Liu"],
    ["youth2", "少年组表演 2", "Chloe Pang"],
    ["seniors1", "乐龄组表演 1", "Chang Soo Far / Wilson Chang"],
    ["seniors2", "乐龄组表演 2", "何金华 Ivan Ho"],
    ["judgeRep", "评委代表"],
  ]],
  ["获奖名单（当场填）", [
    ["merit", "优异奖"],
    ["third", "季军"],
    ["second", "亚军"],
    ["champ", "冠军"],
  ]],
];
// 决赛节目单 (adult group): [name, song, reading hint, original singer, singer unconfirmed?].
// Song titles follow the official releases where the programme sheet has a typo (see 提醒 tab).
const LINEUP = [
  ["区焕乐 Blake Ou", "櫻花樹下", "区 读「欧」au1", "张敬轩"], ["摇滚麦克", "餓狼傳說", "", "张学友"],
  ["韦梓 Cici", "Where Did U Go", "梓 读「子」zi2", "邓紫棋"], ["顾惠佳 Mia", "月半小夜曲", "", "李克勤"],
  ["Issy Voon", "情誡", "", "王菲", true], ["Vincent Mok 莫晓锋", "用背脊唱情歌", "", "汤令山 Gareth.T"],
  ["吴可真 Ko Chen", "今宵多珍重", "", "陈百强"], ["李兆祥 Charlie", "一生中最愛", "", "谭咏麟"],
  ["Yiu Kin Cheung", "浮誇", "", "陈奕迅"], ["高麗雅 Gloria", "這麼近那麼遠", "", "容祖儿"],
  ["林靖杰 JJ Lin", "用背脊唱情歌", "", "汤令山 Gareth.T"], ["David Ho 何德伟", "愛是永恆", "", "张学友"],
  ["Alex Ng", "狂小子", "", "刘德华", true], ["冯建强 Sam Feng", "情深說話未曾講", "", "黎明"],
  ["司徒大叔 Danny Situ", "數字人生", "", "林子祥"], ["Yolanda Li", "搜神記", "", "容祖儿"],
];
const SPONSORS = [
  "HUB-M Cafe", "DY·5", "榕熙堂 Vitalis Sanctum", "海底捞 The Glen", "M记茶室 Mkee Tea House", "AUMINA 会所", "Apapaya",
  "澳富资本 AOFU Capital", "STONEBRIDGE 世通地产集团", "EIGHT PTY LTD", "MAQ Finance", "StayAU", "Warmy Nest",
  "TRIO LAWYERS 方元律师", "LOULOU CREATIVE", "Fishing Season Catch & Cook 蒸汽石锅鱼", "澳洲讯报 Asian Multimedia",
  "CACB 中澳通讯社", "Australia365d", "MSJ Media 禾子传媒", "史宾威中华公学 Springvale Chinese Ethnic School",
  "澳洲墨尔本箐华狮子会", "澳大利亚维州粤商会", "Cantonese Student Association 墨大廣東学生会", "东方演艺学校",
];
// Pinyin shown beside Chinese names (looked up by each run of Chinese characters in a name).
const PY = {
  郭子宁: "Guō Zǐníng", 廖婵娥: "Liào Chán'é", 施丹挺: "Shī Dāntǐng", 张超: "Zhāng Chāo", 王鑫: "Wáng Xīn", 王晓庆: "Wáng Xiǎoqìng",
  东莞英凯教育: "Dōngguǎn Yīngkǎi Jiàoyù", 何金华: "Hé Jīnhuá",
  区焕乐: "Ōu Huànlè", 摇滚麦克: "Yáogǔn Màikè", 韦梓: "Wéi Zǐ", 顾惠佳: "Gù Huìjiā", 莫晓锋: "Mò Xiǎofēng", 吴可真: "Wú Kězhēn",
  李兆祥: "Lǐ Zhàoxiáng", 高麗雅: "Gāo Lìyǎ", 林靖杰: "Lín Jìngjié", 何德伟: "Hé Déwěi", 冯建强: "Féng Jiànqiáng", 司徒大叔: "Sītú Dàshū",
  张敬轩: "Zhāng Jìngxuān", 张学友: "Zhāng Xuéyǒu", 邓紫棋: "Dèng Zǐqí", 李克勤: "Lǐ Kèqín", 王菲: "Wáng Fēi", 汤令山: "Tāng Lìngshān",
  陈百强: "Chén Bǎiqiáng", 谭咏麟: "Tán Yǒnglín", 陈奕迅: "Chén Yìxùn", 容祖儿: "Róng Zǔ'ér", 刘德华: "Liú Déhuá", 黎明: "Lí Míng",
  林子祥: "Lín Zǐxiáng", 张国荣: "Zhāng Guóróng",
  榕熙堂: "Róngxī Táng", 海底捞: "Hǎidǐlāo", M记茶室: "M Jì Cháshì", 会所: "Huìsuǒ", 澳富资本: "Àofù Zīběn", 世通地产集团: "Shìtōng Dìchǎn Jítuán",
  方元律师: "Fāngyuán Lǜshī", 蒸汽石锅鱼: "Zhēngqì Shíguō Yú", 澳洲讯报: "Àozhōu Xùnbào", 中澳通讯社: "Zhōng-Ào Tōngxùnshè",
  禾子传媒: "Hézǐ Chuánméi", 史宾威中华公学: "Shǐbīnwēi Zhōnghuá Gōngxué", 澳洲墨尔本箐华狮子会: "Àozhōu Mò'ěrběn Jīnghuá Shīzǐhuì",
  澳大利亚维州粤商会: "Àodàlìyà Wéizhōu Yuè Shānghuì", 墨大廣東学生会: "Mòdà Guǎngdōng Xuéshēnghuì", 东方演艺学校: "Dōngfāng Yǎnyì Xuéxiào",
};
const pyOf = (name) => (String(name).match(/M记茶室|[\u3400-\u9fff]+/g) || []).map((w) => PY[w]).filter(Boolean).join(" · ");
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
const pyTag = (name) => { const p = pyOf(name); return p ? ` <span class="py">${esc(p)}</span>` : ""; };

function paintFills() {
  for (const el of $$("[data-k]")) {
    const v = val(el.dataset.k);
    el.textContent = v || `[${LABEL[el.dataset.k]}]`;
    if (v && !el.closest("h2, .crew, .cue, .toc")) el.insertAdjacentHTML("beforeend", pyTag(v));
    el.classList.toggle("todo", !v);
  }
}

function paintRoster() {
  const who = (i) => (S.r[i]?.n ?? LINEUP[i]?.[0] ?? "").trim();
  const html = [];
  for (let i = 0; i < N; i++) {
    const no = `${i + 1}号选手`, name = who(i), song = (S.r[i]?.s ?? LINEUP[i]?.[1] ?? "").trim(), [, dsong, hint, singer, unsure] = LINEUP[i] || [];
    const orig = singer && song === dsong ? singer : "";
    const by = orig && !unsure ? `${esc(orig)}嘅` : "";
    const next = i + 1 < N ? `下一位，${i + 2}号选手${who(i + 1) ? " " + mark(who(i + 1)) : ""}，请准备。` : "十六位选手全部唱完！";
    html.push(`<div class="call">
      <div class="call-h"><span class="no">${i + 1}</span>${name ? esc(name) : `<span class="todo">[${no}]</span>`}${song ? ` · 《${esc(song)}》` : ""}${hint ? `<span class="py">${esc(hint)}</span>` : ""}<span class="dur">3:00</span></div>
      ${orig ? `<p class="orig">原唱：${esc(orig)}${pyTag(orig)}${unsure ? "（待核实，先唔好讲出口）" : ""}</p>` : ""}
      <p class="say yue">有请 ${no}${name ? "，" + mark(name) + pyTag(name) : ""}${song ? `，为大家带嚟${by}《${esc(song)}》` : ""}！掌声欢迎！</p>
      <p class="say yue">多谢${name ? " " + mark(name) : " " + no}！${next}</p>
      ${i + 2 < N ? `<p class="cue">后台叫号：${i + 3}号准备。</p>` : ""}
    </div>`);
  }
  $("#roster").innerHTML = html.join("");
}

function paintSponsors() {
  for (const ul of $$(".sponsors")) ul.innerHTML = SPONSORS.map((n) => `<li>${esc(n)}${pyTag(n)}</li>`).join("");
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
buildForms(); paintFills(); paintRoster(); paintSponsors();
const now = tick();
show(now ? now.el.closest(".panel").id : S.tab || "am");
setInterval(tick, 20000);

// Bottom pager: steps through segments and, inside the adult final, each contestant card.
const mast = $(".mast"), pager = $("#pager");
const stops = () => $$(".panel:not([hidden]) .seg, .panel:not([hidden]) .call");
const stopName = (el) => (el.classList.contains("seg") ? `${$("time", el)?.textContent.split("–")[0].trim()} ${el.dataset.name}` : `第 ${$(".no", el).textContent} 位 · ${$(".call-h", el).childNodes[1]?.textContent || ""}`);
const panelOrder = ["am", "pm"];
function where() {
  const list = stops(), top = mast.getBoundingClientRect().bottom + 24;
  let i = -1;
  list.forEach((el, j) => { if (el.getBoundingClientRect().top <= top) i = j; });
  return { list, i };
}
function goTo(el) {
  window.scrollTo({ top: el.getBoundingClientRect().top + scrollY - mast.getBoundingClientRect().bottom - 8, behavior: "smooth" });
}
function crossTo(tab, last) {
  show(tab);
  const list = stops();
  const el = last ? list[list.length - 1] : list[0];
  if (el) { scrollTo(0, 0); goTo(el); }
}
function step(d) {
  const { list, i } = where(), p = panelOrder.indexOf(S.tab);
  if (d > 0) {
    if (i + 1 < list.length) goTo(list[i + 1]);
    else if (p >= 0 && p + 1 < panelOrder.length) crossTo(panelOrder[p + 1], false);
  } else {
    const cur = list[i], headBottom = mast.getBoundingClientRect().bottom;
    if (cur && cur.getBoundingClientRect().top < headBottom - 40) goTo(cur);
    else if (i - 1 >= 0) goTo(list[i - 1]);
    else if (p > 0) crossTo(panelOrder[p - 1], true);
  }
}
function paintPager() {
  pager.hidden = !panelOrder.includes(S.tab);
  if (pager.hidden) return;
  const { list, i } = where(), p = panelOrder.indexOf(S.tab);
  const next = list[i + 1], prev = list[i - 1];
  $("#nextName").textContent = next ? stopName(next) : p + 1 < panelOrder.length ? "下午 · 粤语" : "—";
  $("#prevName").textContent = prev ? stopName(prev) : p > 0 ? "上午 · 普/EN" : "—";
}
$("#next").addEventListener("click", () => step(1));
$("#prev").addEventListener("click", () => step(-1));
// Bluetooth page-turners send arrow or Page keys.
document.addEventListener("keydown", (e) => {
  if (e.target.closest?.("input")) return;
  if (["ArrowRight", "ArrowDown", "PageDown"].includes(e.key)) { e.preventDefault(); step(1); }
  else if (["ArrowLeft", "ArrowUp", "PageUp"].includes(e.key)) { e.preventDefault(); step(-1); }
});
let raf = 0;
addEventListener("scroll", () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(paintPager); }, { passive: true });
for (const b of tabs) b.addEventListener("click", paintPager);
paintPager();

if ("serviceWorker" in navigator) navigator.serviceWorker.register("../sw.js").catch(() => {});
