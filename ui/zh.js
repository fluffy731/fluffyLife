// Simplified Chinese UI strings for the Mongolian app (learner reads Mandarin). Same keys as ui/en.js,
// plus a few Mongolian-only ones.
const POS = { n: "名词", v: "动词", adj: "形容词", adv: "副词", pron: "代词", num: "数词", phrase: "常用语", q: "疑问词", post: "后置词", prt: "语气词", conj: "连词" };
const THEME = { auto: "自动", light: "浅色", dark: "深色" };

export const ui = {
  tabs: { home: "首页", learn: "学习", review: "复习", quiz: "测验", browse: "浏览", settings: "设置" },
  now: "现在", minutes: (n) => `${n} 分钟`, hours: (n) => `${n} 小时`, days: (n) => `${n} 天`,
  listen: "听", listenBtn: "🔊 听", edit: "编辑", resetProgress: "重置进度", tapToFlip: "点卡片看意思",
  dueNow: "待复习", ofSeen: (n) => `/ ${n} 已学`, unit: "单元", wordOfHour: "本小时单词", noItems: "没有内容",
  changesAt: (hh) => `${hh}:00 更换`, currentUnit: "当前单元", unitN: (n) => `第 ${n} 单元`,
  introduced: (a, b, g) => `已学 ${a}/${b} · 语法 ${g} 个`,
  learnNew: "学新内容", review: "复习", phrases: "常用语", noKindLeft: (k) => `本单元没有新的${k}了。`,
  hourlyTip: `<h2>iPhone 每小时提醒</h2>
    <div class="card tip">
      iOS 不允许网页应用自己设闹钟，"快捷指令"也没有"每小时重复"——所以要为每个想要的整点各建一个<b>每天</b>重复的自动化（例如 9:00、10:00 … 21:00）：
      <ol>
        <li>快捷指令 → 自动化 → + → <b>特定时间</b> → 重复<b>每天</b>，选择<b>立即运行</b>。</li>
        <li>操作：<b>打开 App</b> → 选择添加到主屏幕的这个应用（如果列表里有）。</li>
        <li>如果没有，就用<b>打开 URL</b> 填这个页面的地址。这样会打开 Safari，而 Safari 的进度是分开保存的，显示的单词可能和应用里不同。</li>
      </ol>
    `,
  unitDone: "本单元完成！", unitDoneHint: "本单元的内容都学过一遍了。在上面选下一个单元，或者去复习。",
  jumpedAhead: "上一个单元还没学完——跳着学也没关系。",
  leftInUnit: (n) => `本单元还剩 ${n} 个`, gotIt: "记住了", alreadyKnew: "早就会了", reviewIn: (x) => `${x}后复习`,
  showMeaning: "看意思", nothingDue: "没有要复习的", nextReview: (x) => `下次复习在 ${x}后。`, learnFirst: "先学一些新单词吧。",
  nDue: (n) => `待复习 ${n} 个`, again: "重来", hard: "难", good: "好", easy: "简单", showAnswer: "看答案",
  searchPlaceholder: "搜索 西里尔字母 · 拉丁转写 · 中文 · English", all: "全部", words: "单词", grammar: "语法", add: "+ 添加", anyLevel: "所有级别",
  nItems: (n) => `${n} 个`, statusNew: "新", statusDue: "待复习", statusIn: (x) => `${x}后`, showingFirst: "只显示前 200 个——请缩小搜索范围。",
  studyTrack: "学习单元", data: "数据", exportBackup: "导出备份", importBackup: "导入备份",
  theme: (x) => `外观：${THEME[x] ?? x}`, resetAll: "清除全部进度",
  progressNote: "进度只保存在这台设备的浏览器里。清除 Safari 数据或换手机之前请先导出备份。",
  packLine: (id, w, g) => `内容包：${id} · 单词 ${w} 个 · 语法 ${g} 个`,
  confirmWipe: "要清除这台设备上的全部进度吗？",
  confirmImport: "用备份文件覆盖这台设备上的进度吗？",
  noSpeech: "这个浏览器没有语音功能。",
  noVoice: "这台设备没有蒙古语语音。录音片段部署完成后，🔊 会直接播放录音（静音模式下也能听到）。",
  speechCheck: "语音检查", speechCheckBtn: "🔊 测试语音并显示详情",
  quizPractice: "练习测验", quizPracticeHint: "从学过的内容里出 10 题，先考最不熟的。不设及格线。",
  quizNeedSeen: "请先学至少 4 个。", quizUnits: "单元测验", quizNotReady: (n) => `还有 ${n} 个没学`,
  quizReady: "可以测验了", quizPassed: (b, n) => `🏅 已通过 · 最高 ${b}/${n}`, quizStart: "开始", quizNext: "下一题",
  quizQn: (i, n) => `第 ${i} 题 / 共 ${n} 题`, quizResult: (s, n) => `${s}/${n} · ${Math.round((s / n) * 100)}%`,
  quizPass: "通过！80% 以上 🏅", quizNotYet: "还差一点——80% 就通过。答错的词现在会出现在复习里。",
  quizMissed: "答错的题", quizRetake: "再考一次", quizBack: "测验列表", quizTestReady: (label) => `${label} —— 可以测验了`, quizReplay: "再听一遍",
  qMeaning: "是什么意思？", qReverse: "蒙古语怎么说？", qHanja: "怎么读？", qListen: "听到的是什么意思？",
  qGrammar: "这句话用了哪个语法？", qSound: "是什么意思？", qSay: "怎么说？", qTone: "第几声？", qGsound: "是什么意思？",
  // Mongolian-only strings
  qRead: "这个词怎么拼读（拉丁转写）？", qListenWord: "听到的是哪个词？",
  posName: (p) => POS[p] ?? p,
  grammarLabel: "语法",
  lettersTitle: "需要注意的字母",
  lettersHint: "灰色的拉丁字母只是读音提示。蒙古语非重读元音会弱化，请以 🔊 录音为准。",
  letterHints: ["圆唇的 e，像德语 ö", "像拼音 ü（绿）", "像拼音 h（喝），喉音更重", "像拼音 c（次）", "介于拼音 ch 和 q 之间", "像拼音 sh",
    "介于拼音 zh 和 j 之间", "像拼音 z（资），常读作 dz", "像拼音 ê（诶）", "像拼音 i（日），只在词中/词尾", "清边音：舌尖抵上颚，从两侧吹气（汉语没有）"],
};
