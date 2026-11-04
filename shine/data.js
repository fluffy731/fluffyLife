// A Night to Shine · 13 November 2026 · MC script data.
// Solomon (S) speaks Mandarin in simplified Chinese; Wade (W) speaks English. "SW" is said together.
// {key} is a TBC field from FIELDS or LISTS: blank ones show highlighted in the script until filled in.
// Timings follow the 13 Nov run sheet with the 4 Nov feedback: the President leads the Goddess Entrance,
// a warm-up opens the night, Eric sings at 8:00 and again after Tian, fundraising items follow the draw.

export const EVENT = {
  date: [2026, 11, 13],
  title: "A Night to Shine",
  zh: "她慧狮子会 She Rises · 黑领结圣诞晚会",
  en: "A Black Tie Christmas Celebration",
  venue: "Rombe Rooftop, Burwood Brickworks",
  dress: "Silver · Champagne · Gold",
};

export const GROUPS = [
  ["guests", "嘉宾", "Guests"],
  ["club", "她慧狮子会", "She Rises"],
  ["show", "表演", "Performers"],
  ["draw", "幸运抽奖", "Lucky draw"],
  ["awards", "颁奖", "Awards"],
  ["sales", "义卖与合照", "Sales & photo"],
];

// [key, zh label, en label, group, example, optional?]
export const FIELDS = [
  ["distName", "District 代表姓名", "District rep's name", "guests", "如 Jane Citizen"],
  ["distTitleZh", "代表职衔（中文）", "Rep's title, Chinese", "guests", "如 区总监"],
  ["distTitleEn", "代表职衔（英文）", "Rep's title, English", "guests", "e.g. District Governor"],
  ["sponsors", "赞助商", "Sponsors", "guests", "用逗号分隔 · comma-separated"],
  ["vips", "其他贵宾", "Other VIPs", "guests", "没有就留空 · leave blank if none", true],
  ["pres", "会长", "President", "club", "姓名 · name"],
  ["vp", "副会长", "Vice President", "club", "姓名 · name"],
  ["oathLang", "宣誓语言", "Oath language", "club", "拟用 English，需与 District 确认"],
  ["band", "乐队名称", "Band name", "show", "the band"],
  ["eric1", "Eric 第一首（8:00）", "Eric's song 1 (8:00)", "show", "歌名 · title"],
  ["eric2", "Eric 第二首（8:40，Tian 之后）", "Eric's song 2 (8:40, after Tian)", "show", "歌名 · title"],
  ["tianEn", "Tian 英文歌", "Tian's English song", "show", "歌名 · title"],
  ["raffleClose", "抽奖券截止时间", "Raffle sales close", "draw", "如 7:30 pm（流程写至 7:00）"],
  ["unclaimed", "无人认领规则", "Unclaimed prize rule", "draw", "如 30 秒无人上台即重抽"],
  ["nepalBy", "尼泊尔奖杯颁奖人", "Nepal trophies presented by", "awards", "姓名 · name"],
  ["boboName", "Bobo 全名", "Bobo's full name", "awards", "姓名 · name"],
  ["boboBy", "Bobo 奖颁奖人", "Bobo's award presented by", "awards", "姓名 · name"],
  ["boboZh", "Bobo 一句话介绍（中文）", "Bobo citation, Chinese", "awards", "可留空 · optional", true],
  ["boboEn", "Bobo 一句话介绍（英文）", "Bobo citation, English", "awards", "optional", true],
  ["sharer", "分享会员", "Member sharing", "sales", "姓名 · name"],
  ["bearPrice", "小熊价格", "Bear price", "sales", "如 $25"],
  ["sponsorPrice", "赞助商品价格", "Sponsor product prices", "sales", "如 见标价 · as marked"],
  ["pay", "付款方式", "Payment methods", "sales", "如 现金、刷卡 · cash or card"],
  ["fundsFor", "义卖款项用途", "Funds raised go to", "sales", "如 尼泊尔项目 · the Nepal project"],
  ["photoSpot", "大合照位置", "Group photo spot", "sales", "如 舞台前 · the front of the stage"],
];

// Repeating rows. Field keys are col + row number (board1 … board8, prize1, prizeBy1 …).
export const LISTS = {
  board: { group: "club", zh: "宣誓理事（8 位）", en: "Board members taking the oath (8)", n: 8, need: "all",
    cols: [["board", "姓名", "Name"]] },
  prizes: { group: "draw", zh: "奖品（按抽奖顺序）", en: "Prizes, in draw order", n: 10, need: "all",
    cols: [["prize", "奖品", "Prize"], ["prizeBy", "提供者", "Donated by"]] },
  nepal: { group: "awards", zh: "尼泊尔筹款奖项", en: "Nepal fundraising awards", n: 8, need: "one",
    cols: [["award", "奖项", "Award"], ["winner", "得奖者", "Recipient"]] },
};

// Goddess Entrance cue sheet: lyric lines → who walks in. 21 people: President, VP, 7 board, 12 members.
// New order (4 Nov): the President leads, members last. Line numbers are re-derived: confirm with the ushers.
export const ENTRANCE = [
  ["1", "会长带领入场", "The President leads in"],
  ["2", "副会长", "Vice President"],
  ["3–6", "理事 7 位，每句 2 位，第 6 句最后 1 位", "7 board members, 2 per line; the last one on line 6"],
  ["7–12", "会员 12 位，每句 2 位（6 组）", "12 members, 2 per line (6 pairs)"],
  ["13–14", "最后一组会员走到预留桌", "The last members walk to the reserved tables"],
  ["15–16", "全体挥手，入座", "Everyone waves, then sits"],
];

// Script segments. t/e = start/end (24 h). items:
//   ["S"|"W"|"SW", text, opts?]  spoken line; opts.if = only when that field is filled; opts.tpl = pattern to adapt
//   ["cue", zh, en]  stage direction, not read out      ["crit", zh, en]  must-not-miss direction
//   ["list", name]  board / prizes / nepal               ["table", "entrance"]
export const SEGMENTS = [
  { t: "18:30", e: "18:50", zh: "背景广播", en: "Doors & check-in", at: ["后台麦，不上台", "Off-stage mic"], items: [
    ["cue", "6:30 和 6:45 各广播一次", "Announce at 6:30 and again at 6:45"],
    ["S", "各位来宾晚上好，欢迎来到她慧狮子会的 A Night to Shine！请先到签到台签到。小天使正在各桌售卖抽奖券，5 澳元一张；徽章 15 澳元一个。"],
    ["W", "Good evening, and welcome to A Night to Shine. Please check in at the front desk. Our Little Angels are coming round with raffle tickets at $5 each, and pins at $15."],
  ] },
  { t: "18:50", e: "19:00", zh: "入场排队 · 准备", en: "Line-up & standby", at: ["两位 MC 到台侧", "Both MCs to the side of the stage"], items: [
    ["crit", "21 位入场者离座到入口排队：会长、副会长在最前，理事 7 位其后，会员 12 位最后", "The 21 leave their seats and line up at the entrance: President and VP at the front, then 7 board, then 12 members"],
    ["cue", "试麦；确认 Tian 和《女神》伴奏就位", "Mic check; Tian and the 《女神》 track ready"],
    ["cue", "走道清空；靠舞台预留 2 桌给入场者", "Aisle clear; 2 tables near the stage reserved for the 21"],
  ] },
  { t: "19:00", e: "19:04", key: true, zh: "主持人开场 · 暖场", en: "Opening & warm-up", at: ["两位 MC 台中", "Both MCs centre stage"], items: [
    ["cue", "乐队渐停", "Band fades out"],
    ["W", "Ladies and gentlemen, good evening, and welcome to A Night to Shine, a black-tie Christmas celebration. I'm Wade."],
    ["S", "各位来宾，大家晚上好！我是 Solomon。欢迎来到 She Rises 她慧狮子会的第一个圣诞晚会。"],
    ["cue", "暖场：轻松说，不赶", "Warm-up: keep it light, no rush"],
    ["W", "Now, you may have noticed something. She Rises is all about women rising. And tonight, they've handed the microphone to two men."],
    ["S", "没错，一个专注女性成长的狮子会，今晚请了两位男士来主持。我们也问过为什么。"],
    ["W", "The answer was simple: tonight the women of She Rises do the shining. Our job is to hold the mic and lead the applause."],
    ["S", "所以今晚，女士们负责闪耀，我们两位负责鼓掌！说实话，很荣幸，也有点紧张，台下这么多女神，压力不小。"],
    ["W", "Quick show of hands: who's at a She Rises event for the very first time tonight?"],
    ["S", "第一次来参加她慧狮子会活动的朋友，请举手！欢迎欢迎！"],
    ["cue", "看举手人数，即兴回应一句", "React to the hands in one line"],
    ["S", "今晚的着装是银色、香槟色和金色。穿金色的朋友，欢呼一下！香槟色的！银色的！"],
    ["W", "Make some noise if you're wearing gold! Champagne! Silver!"],
    ["cue", "每个颜色停一下，等欢呼", "Pause after each colour for the cheer"],
    ["W", "Tonight we're honoured to welcome {distTitleEn} {distName}, and our sponsors, {sponsors}. Thank you for your support."],
    ["S", "热烈欢迎 {distTitleZh} {distName}，以及各位赞助商：{sponsors}。谢谢你们的支持！"],
    ["S", "同时欢迎今晚的贵宾：{vips}。", { if: "vips" }],
    ["W", "We also welcome {vips}.", { if: "vips" }],
    ["S", "提醒大家：幸运抽奖只限购买了抽奖券的来宾参加。抽奖券 5 澳元一张，{raffleClose}前向小天使购买。8 点 05 分左右开奖，共 10 份奖品。"],
    ["W", "A note on the lucky draw: it's for raffle ticket holders only. Tickets are $5 from our Little Angels until {raffleClose}. We draw ten prizes at about 8:05."],
    ["crit", "音乐开始前讲完所有介绍", "Finish every introduction before the music starts"],
    ["W", "And now, a special welcome. Singer Tian will bring in the women of She Rises with the song Nǚshén, \"Goddess\", led by our President, then our Vice President, our board, and our members."],
    ["cue", "Nǚshén 读作 nyoo-shun", "Nǚshén sounds like \"nyoo-shun\""],
    ["S", "今晚，歌手 Tian 将以一首《女神》，迎接她慧狮子会的女神们：由会长带领，然后是副会长、理事团队，最后是会员们。请大家用最热烈的掌声欢迎她们！"],
    ["SW", "有请 Tian！ Please welcome Tian!"],
  ] },
  { t: "19:04", e: "19:07", key: true, zh: "女神入场 · Tian《女神》", en: "Goddess Entrance · Tian sings 《女神》", at: ["MC 台侧，不说话", "MCs at the side, silent"], items: [
    ["crit", "MC 全程不说话，只带掌声。第 1 句会长入场，带最热烈的掌声", "MCs stay silent and lead the applause. Biggest applause on line 1, as the President leads in"],
    ["table", "entrance"],
    ["cue", "第一段副歌结束前全部入座，之后是 Tian 的完整演出", "Everyone is seated by the end of the first chorus; Tian then sings the rest"],
  ] },
  { t: "19:07", e: "19:17", zh: "会长 + 副会长致辞", en: "President & Vice President", at: ["MC 台中，致辞时台侧", "Centre, then the side for the speeches"], items: [
    ["cue", "歌曲结束，带掌声", "Song ends; lead the applause"],
    ["S", "谢谢 Tian！刚才由会长带领入场的，就是她慧狮子会的理事团队和会员们，再次掌声送给她们！"],
    ["W", "Thank you, Tian! Ladies and gentlemen, led by our President, the board and members of She Rises. One more round of applause!"],
    ["S", "现在，有请她慧狮子会会长 {pres} 和副会长 {vp} 上台！"],
    ["W", "Please welcome our President, {pres}, and Vice President, {vp}!"],
    ["cue", "两人一起致辞约 10 分钟，一人普通话、一人英语；MC 不翻译", "They speak together for about 10 minutes, one in Mandarin, one in English. No MC translation"],
  ] },
  { t: "19:17", e: "19:20", zh: "前菜", en: "Entrée", at: ["MC 台中", "Centre stage"], items: [
    ["crit", "舞台监督现在带 8 位理事到侧台", "Stage manager takes the 8 board members to the side of the stage now"],
    ["W", "Thank you, {pres} and {vp}. Entrée is now being served. Please enjoy, with music from {band}."],
    ["S", "谢谢会长和副会长！现在请大家享用前菜，乐队为大家演奏。"],
  ] },
  { t: "19:20", e: "19:25", zh: "District 代表致辞", en: "District representative", at: ["MC 台中，致辞时台侧", "Centre, then the side"], items: [
    ["S", "各位来宾，接下来，我们荣幸邀请 {distTitleZh} {distName} 为大家致辞。"],
    ["W", "It's our honour to invite {distTitleEn} {distName} to the stage. Please welcome {distName}."],
    ["cue", "约 5 分钟。致辞后请代表留在台上", "About 5 minutes. Afterwards, ask the representative to stay on stage"],
  ] },
  { t: "19:25", e: "19:45", key: true, zh: "理事宣誓仪式", en: "Board oath ceremony", at: ["MC 台侧", "MCs at the side"], items: [
    ["W", "Thank you, {distName}. Please stay with us: you'll be administering tonight's oath."],
    ["S", "谢谢 {distName}，请您留步。"],
    ["S", "宣誓，是理事们对会员和社区的承诺。现在，有请她慧狮子会的 8 位理事上台！"],
    ["W", "An oath is a promise to our members and our community. Please welcome the eight board members of She Rises!"],
    ["cue", "逐一念名，每位上台带掌声，两位 MC 轮流念", "Read each name as they walk up, taking turns"],
    ["list", "board"],
    ["cue", "宣誓语言：{oathLang}。交给 District 代表主持", "Oath in {oathLang}, administered by the representative"],
    ["W", "{distName}, over to you."],
    ["cue", "宣誓结束", "After the oath"],
    ["S", "恭喜她慧狮子会理事团队！掌声送给她们！"],
    ["W", "Congratulations to the board of She Rises!"],
  ] },
  { t: "19:45", e: "19:50", zh: "宣誓合照", en: "Oath photo", at: ["MC 台侧", "MCs at the side"], items: [
    ["W", "Could all our members please join the board and {distName} on stage for a photo."],
    ["S", "请所有会员上台，和理事团队、{distName}一起合照！"],
    ["cue", "摄影就位，约 5 分钟", "Photographer ready; about 5 minutes"],
  ] },
  { t: "19:50", e: "20:00", zh: "主菜", en: "Main course", at: ["MC 台中", "Centre stage"], items: [
    ["S", "谢谢大家，请理事和会员们回座。主菜马上上桌，请慢用。"],
    ["W", "Thank you, everyone. Please return to your seats. Main course is on its way. Enjoy!"],
    ["cue", "8:00 前确认 Eric 就位", "Confirm Eric is ready before 8:00"],
  ] },
  { t: "20:00", e: "20:05", zh: "Eric 演唱（第一首）", en: "Eric performs (song 1)", at: ["MC 台中，演唱时台侧", "Centre, then the side"], items: [
    ["S", "希望大家吃得开心！接下来，有请 Eric 为我们演唱《{eric1}》。掌声有请 Eric！"],
    ["W", "Please welcome Eric, singing {eric1}. Eric!"],
    ["cue", "一首，约 5 分钟。抽奖助理带票根和奖品到侧台", "One song, about 5 minutes. Draw assistant brings the stubs and prizes to the side of the stage"],
  ] },
  { t: "20:05", e: "20:15", key: true, zh: "幸运抽奖", en: "Lucky draw", at: ["两位 MC 台中", "Both MCs centre stage"], items: [
    ["crit", "只有 10 分钟：每份约 1 分钟", "10 minutes only: about a minute a prize"],
    ["W", "Thank you, Eric! It's lucky draw time. Who's feeling lucky tonight? Hands up!"],
    ["S", "谢谢 Eric！幸运抽奖时间到！觉得自己今晚手气好的，举手！请大家拿出抽奖券。感谢各位赞助商提供的奖品！"],
    ["cue", "每份：Solomon 报奖品 → Wade 抽号 → 号码逐位读，中英各一次", "Each prize: Solomon names it, Wade draws, then read the number digit by digit in both languages"],
    ["S", "第 N 份奖品：〔奖品〕，由〔提供者〕提供。中奖号码是……", { tpl: true }],
    ["W", "Prize N: 〔prize〕, from 〔sponsor〕. The winning number is…", { tpl: true }],
    ["list", "prizes"],
    ["cue", "无人认领：{unclaimed}", "Unclaimed: {unclaimed}"],
    ["W", "Congratulations to all our winners!"],
    ["S", "恭喜所有中奖的来宾！"],
  ] },
  { t: "20:15", e: "20:20", zh: "义卖介绍", en: "Fundraising items", at: ["MC 台中，赞助商品在台上", "Centre stage, sponsor products on display"], items: [
    ["S", "没抽中的朋友也别失望，今晚还有义卖品：小熊公仔 {bearPrice}，徽章 15 澳元，还有台上的赞助商品 {sponsorPrice}。义卖所得将用于 {fundsFor}。"],
    ["W", "No luck in the draw? You can still take something home: teddy bears at {bearPrice}, pins at $15, and the sponsor products here on stage, {sponsorPrice}. Funds raised go to {fundsFor}."],
    ["S", "8 点 50 分起，小天使会到各桌，可用 {pay} 付款。"],
    ["W", "From 8:50, our Little Angels will come to your table. You can pay by {pay}."],
    ["crit", "8:20 准时颁奖", "Awards start at 8:20 sharp"],
  ] },
  { t: "20:20", e: "20:30", key: true, zh: "尼泊尔筹款颁奖 + Bobo 20 年长期服务奖", en: "Nepal awards + Bobo's 20-Year Long Service Award", at: ["两位 MC 台中", "Both MCs centre stage"], items: [
    ["S", "今年，她慧狮子会为尼泊尔筹得一万五千澳元！感谢每一位支持者。"],
    ["W", "This year, She Rises raised fifteen thousand dollars for Nepal. Thank you to everyone who gave."],
    ["S", "下面颁发尼泊尔筹款奖杯，由 {nepalBy} 颁发。念到名字的得奖者，请上台领奖。"],
    ["W", "Our trophies will be presented by {nepalBy}. When we call your name, please come up."],
    ["list", "nepal"],
    ["S", "请所有得奖者留在台上，一起合照！"],
    ["W", "Recipients, please stay on stage for a group photo."],
    ["cue", "合照后得奖者回座", "After the photo, recipients return to their seats"],
    ["W", "Our last award tonight honours twenty years of service. Please welcome Bobo, {boboName}, to receive the 20-Year Long Service Award, presented by {boboBy}."],
    ["S", "最后一个奖项，表彰二十年的付出。有请 Bobo（{boboName}）上台，领取 20 年长期服务奖，由 {boboBy} 颁发！"],
    ["S", "{boboZh}", { if: "boboZh" }],
    ["W", "{boboEn}", { if: "boboEn" }],
    ["S", "二十年，谢谢您，Bobo！"],
    ["W", "Twenty years. Thank you, Bobo!"],
  ] },
  { t: "20:30", e: "20:35", zh: "会员分享", en: "Member sharing", at: ["MC 台中，分享时台侧", "Centre, then the side"], items: [
    ["S", "恭喜 Bobo！接下来，有请会员 {sharer}，分享她这一年参加她慧狮子会活动的感受。"],
    ["W", "Next, {sharer} will share what this year with She Rises has meant to her. Please welcome {sharer}."],
    ["cue", "约 5 分钟", "About 5 minutes"],
  ] },
  { t: "20:35", e: "20:40", zh: "Tian 演唱英文歌", en: "Tian's English song", at: ["MC 台中，演唱时台侧", "Centre, then the side"], items: [
    ["W", "Thank you, {sharer}. Tian is back, with an English song: {tianEn}. Please welcome Tian!"],
    ["S", "谢谢 {sharer} 的分享！Tian 再次登场，为我们演唱英文歌《{tianEn}》，掌声有请！"],
    ["cue", "Tian 唱完直接接 Eric，请 Eric 在侧台准备", "Eric follows straight after Tian: have him ready at the side of the stage"],
  ] },
  { t: "20:40", e: "20:45", zh: "Eric 演唱（第二首）", en: "Eric performs (song 2)", at: ["MC 台中，演唱时台侧", "Centre, then the side"], items: [
    ["S", "谢谢 Tian！Eric 再次登场，为我们带来今晚的第二首歌《{eric2}》，掌声有请！"],
    ["W", "Thank you, Tian! And Eric is back with one more: {eric2}. Please welcome Eric!"],
    ["cue", "约 5 分钟", "About 5 minutes"],
  ] },
  { t: "20:45", e: "20:50", zh: "大合照", en: "Group photo", at: ["MC 台前", "In front of the stage"], items: [
    ["W", "Thank you, Eric! Dessert is on its way. Before you dig in, let's get everyone in one photo. Please join us at {photoSpot}."],
    ["S", "谢谢 Eric！甜品已经上桌！请全场来宾到 {photoSpot}，一起大合照！"],
    ["cue", "8:50 前拍完", "Finish by 8:50"],
  ] },
  { t: "20:50", e: "21:30", zh: "Live band", en: "Live band", at: ["MC 台中，之后自由", "Centre, then free"], items: [
    ["S", "谢谢大家！接下来是 Live band 时间，请尽情享受音乐、自由交流。小天使会再到各桌义卖徽章和小熊，到 9 点 15 分。"],
    ["W", "Thank you! It's live band time with {band}. Enjoy the music and the night. Our Little Angels are coming round with pins and bears until 9:15."],
    ["cue", "第二轮不再卖抽奖券", "No raffle tickets in the second round"],
  ] },
  { t: "21:30", e: "22:00", zh: "致谢 · 送客", en: "Thank-yous & farewell", at: ["两位 MC 台中", "Both MCs centre stage"], items: [
    ["W", "Ladies and gentlemen, that brings us to the end of A Night to Shine. A few thank-yous."],
    ["S", "感谢各位赞助商、各位来宾、{distName}、Tian、Eric 和乐队、她慧狮子会理事团队、所有义工和小天使，还有 Rombe Rooftop。"],
    ["W", "Thank you to our sponsors, our guests, {distName}, Tian, Eric and {band}, the She Rises board, our volunteers and Little Angels, and Rombe Rooftop."],
    ["S", "离开前别忘了带走伴手礼。祝大家圣诞快乐，晚安！"],
    ["W", "Don't forget your gift bag on the way out. Merry Christmas, and good night!"],
  ] },
];

// Run sheet: the 13 Nov sheet with the 4 Nov feedback. [time, zh, en, zh notes, en notes, changed by the feedback?]
export const RUNSHEET = [
  ["17:00", "工作人员到场布置", "Crew arrive and set up", "乐队、Eric 与 Tian 试音", "Band, Eric and Tian sound checks"],
  ["18:00", "海报开始时间", "Poster start time", "签到台就位；乐队暖场（纯音乐）", "Check-in desk ready; band warm-up (instrumental)"],
  ["18:30", "迎宾、宾客入场、签到", "Welcome, arrival, check-in", "小天使到各桌售卖抽奖券 + 徽章（至 7:00）", "Little Angels sell raffle tickets + pins at each table (until 7:00)"],
  ["18:50", "女神入场集合", "Goddess Entrance line-up", "入场的 21 人到入口排队：会长在前，会员最后", "The 21 line up at the entrance: President in front, members last", true],
  ["19:00", "主持人开场 + 暖场互动", "MC opening + warm-up", "暖场、观众互动；介绍贵宾、说明抽奖规则；介绍 Tian 与女神入场", "Warm-up and audience interaction; VIPs, raffle rules; introduce Tian and the Goddess Entrance", true],
  ["19:04", "女神入场｜Tian 演唱《女神》", "Goddess Entrance / Tian sings 《女神》", "会长带领 → 副会长 → 理事 → 会员；第一段副歌结束前入座", "President leads → VP → board → members; seated by the end of the first chorus", true],
  ["19:07", "会长 + 副会长致辞", "President + VP speech", "10 分钟；普通话 + 英语", "10 minutes; Mandarin + English", true],
  ["19:17", "前菜", "Entrée", "乐队配乐；8 位理事到侧台准备", "Band plays; 8 board members ready at the side of the stage", true],
  ["19:20", "District 代表致辞", "District representative's speech", "5 分钟；致辞后留步", "5 minutes; stays on stage afterwards"],
  ["19:25", "理事宣誓仪式", "Board oath ceremony", "20 分钟；District 代表监誓", "20 minutes; administered by the District representative"],
  ["19:45", "宣誓合照", "Oath group photo", "5 分钟；之后理事和会员下台", "5 minutes; then board and members return to seats"],
  ["19:50", "主菜", "Main course", "乐队配乐", "Band plays"],
  ["20:00", "Eric 演唱（第一首）", "Eric performs (song 1)", "1 首歌（约 5 分钟）", "1 song (about 5 minutes)", true],
  ["20:05", "幸运抽奖", "Lucky draw", "10 份奖品；10 分钟，流程需紧凑", "10 prizes; 10 minutes, keep it moving", true],
  ["20:15", "MC 介绍义卖", "MC introduces fundraising items", "小熊、徽章、赞助商品", "Bears, pins, sponsor products", true],
  ["20:20", "尼泊尔筹款颁奖 + Bobo 20 年长期服务奖", "Nepal awards + Bobo 20-Year Long Service Award", "筹款 $15,000：颁奖杯、得奖者合照；颁发 Bobo 奖；约 10 分钟", "$15,000 raised: trophies and recipients' photo; Bobo's award; about 10 minutes"],
  ["20:30", "会员分享", "Member sharing", "5 分钟", "5 minutes"],
  ["20:35", "Tian 演唱英文歌", "Tian sings an English song", "独唱约 5 分钟", "Solo, about 5 minutes"],
  ["20:40", "Eric 演唱（第二首）", "Eric performs (song 2)", "1 首歌（约 5 分钟）", "1 song (about 5 minutes)", true],
  ["20:45", "大合照", "Group photo", "甜品上桌", "Dessert served"],
  ["20:50", "Live band（有歌手演唱）", "Live band (with vocals)", "小天使第二轮义卖徽章 + 小熊（至 9:15）", "Little Angels' second round: pins + bears (until 9:15)"],
  ["21:30", "乐队结束", "Band finishes", "致谢、送客", "Thank-yous, farewell guests"],
  ["22:00", "清场", "Venue cleared", "收回所有物品、义卖款项", "Collect all items and fundraising money"],
];

export const RUNSHEET_NOTE = [
  "按 11 月 4 日反馈调整（需与统筹确认）：女神入场改为会长带领、会员最后；开场加暖场互动，入场改到 7:04，前菜环节缩为 3 分钟，致辞仍有 10 分钟；Eric 改为 8:00 一首、Tian 之后 8:40 一首；义卖介绍移到抽奖之后（8:15），抽奖提前到 8:05。8:20 颁奖及 8:50 Live band 不变。",
  "Changed after feedback on 4 November (confirm with the event lead): the President leads the Goddess Entrance and members go last; a warm-up opens the night, so the entrance moves to 7:04 and the entrée link shrinks to 3 minutes, keeping 10 minutes for the speeches; Eric sings one song at 8:00 and the other at 8:40 after Tian; fundraising items move to straight after the draw (8:15), so the draw starts at 8:05. The 8:20 awards and 8:50 live band are unchanged.",
];

// Notes tab. crit = must-not-miss items; check = open questions to settle before the night.
export const NOTES = {
  crit: [
    ["幸运抽奖只限购买抽奖券的来宾。海报写过「包含幸运抽奖」，开场必须讲清楚", "The lucky draw is for raffle ticket holders only. The poster mentioned a lucky draw, so say this clearly at the opening"],
    ["音乐开始前讲完全部介绍；Tian 唱歌时 MC 不说话，只带掌声。入场者的介绍留到歌后", "Finish all introductions before the music. While Tian sings, MCs stay silent and only lead applause. Introduce the 21 after the song"],
    ["6:50 入场的 21 人离座到入口排队：会长、副会长在最前，理事其后，会员最后", "At 6:50 the 21 leave their seats and line up: President and VP in front, board behind, members last"],
    ["预留 2 桌靠近舞台给入场者，大家走到同一区域入座", "2 tables near the stage are reserved for the 21, so everyone sits in one area"],
    ["District 代表致辞时，8 位理事已在侧台；前菜时（约 7:17）集合", "The 8 board members are waiting at the side of the stage during the District speech; they gather during the entrée (about 7:17)"],
    ["抽奖 8:05–8:15，之后马上介绍义卖，8:20 准时颁奖", "Draw 8:05–8:15, fundraising items straight after, awards at 8:20 sharp"],
  ],
  check: [
    ["新顺序：会长带领入场、会员最后。歌词句号是按新顺序重新推算的，请与带位员和 Tian 确认", "New order: the President leads and members go last. The lyric-line cues are re-derived for this order; confirm them with the ushers and Tian"],
    ["开场加了暖场（约 2 分钟），女神入场改到约 7:04。请提前告知 Tian、带位员和舞台监督", "The warm-up adds about 2 minutes, so the entrance starts about 7:04. Tell Tian, the ushers and the stage manager"],
    ["Eric 两首歌分开：8:00 一首，8:40（Tian 之后）一首。请告知 Eric 和乐队", "Eric's two songs are split: one at 8:00, one at 8:40 after Tian. Tell Eric and the band"],
    ["抽奖改为 8:05–8:15，义卖介绍 8:15。海报、PPT、工作人员表要一致", "The draw is now 8:05–8:15 with fundraising items at 8:15. Make slides and crew sheets match"],
    ["抽奖券截止：流程写 6:30–7:00 售卖，但 7:00 开场才讲规则，听完规则的来宾已买不到。建议延长到开场后（填在「待填」）", "Raffle sales close at 7:00 in the run sheet, but the rules are announced at 7:00, so guests who hear them can't buy. Extend sales past the opening (set it in TBC)"],
    ["宣誓 8 位理事，但女神入场只有 7 位理事。确认 8 人名单", "8 board members take the oath, but only 7 walk in at the Goddess Entrance. Confirm the 8 names"],
    ["宣誓语言拟用英文，需与 District 确认誓词和流程", "The oath will likely be in English; confirm the wording and procedure with the District"],
    ["Tian《女神》：确认歌名、长度、伴奏，以及能否拉长前奏配合入场", "Tian's 《女神》: confirm title, length, backing track, and whether the intro can be extended for the entrance"],
    ["尼泊尔筹款颁奖：确认奖项名称、奖杯数量和上台顺序，提前交给 MC", "Nepal awards: confirm award names, trophy count and order, and give them to the MCs in advance"],
    ["小熊和赞助商品价格、付款方式（现金 / 刷卡 / 转账）、抽奖方式", "Bear and sponsor product prices, payment methods (cash / card / transfer), how the draw is run"],
  ],
  link: ["串场三步：收尾上一环节 → 预告下一环节 → 邀请下一位上台", "Every link: wrap up the last segment → say what's next → invite the next person up"],
};
