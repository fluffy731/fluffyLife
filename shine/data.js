// A Night to Shine · 13 November 2026 · MC script data.
// Solomon (S) speaks Mandarin in simplified Chinese; Wade (W) speaks English. "SW" is said together.
// {key} is a TBC field from FIELDS or LISTS: blank ones show highlighted in the script until filled in.
// Timings follow the updated run sheet (lucky draw 8:10–8:20, Eric 8:00, Tian's English song 8:35).

export const EVENT = {
  date: [2026, 11, 13],
  title: "A Night to Shine",
  zh: "She Rises 黑领结圣诞晚会",
  en: "A Black Tie Christmas Celebration",
  venue: "Rombe Rooftop, Burwood Brickworks",
  dress: "Silver · Champagne · Gold",
};

export const GROUPS = [
  ["guests", "嘉宾", "Guests"],
  ["club", "She Rises", "She Rises"],
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
  ["eric1", "Eric 第一首", "Eric's song 1", "show", "歌名 · title"],
  ["eric2", "Eric 第二首", "Eric's song 2", "show", "歌名 · title"],
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

// Goddess Entrance cue sheet: lyric lines → who walks in. 21 people: 12 members, 7 board, VP, President.
export const ENTRANCE = [
  ["1–6", "会员 12 位，每句 2 位", "12 members, 2 per line (6 pairs)"],
  ["7–9", "理事 6 位，每句 2 位", "6 board members, 2 per line (3 pairs)"],
  ["10", "最后 1 位理事；副会长、会长准备", "Last board member; VP and President get ready"],
  ["11", "副会长入场，会长随后（带最大掌声）", "VP enters, then the President (biggest applause)"],
  ["12–14", "副会长、会长走到预留桌", "VP and President walk to the reserved tables"],
  ["15–16", "全体挥手，入座", "Everyone waves, then sits"],
];

// Script segments. t/e = start/end (24 h). items:
//   ["S"|"W"|"SW", text, opts?]  spoken line; opts.if = only when that field is filled; opts.tpl = pattern to adapt
//   ["cue", zh, en]  stage direction, not read out      ["crit", zh, en]  must-not-miss direction
//   ["list", name]  board / prizes / nepal               ["table", "entrance"]
export const SEGMENTS = [
  { t: "18:30", e: "18:50", zh: "背景广播", en: "Doors & check-in", at: ["后台麦，不上台", "Off-stage mic"], items: [
    ["cue", "6:30 和 6:45 各广播一次", "Announce at 6:30 and again at 6:45"],
    ["S", "各位来宾晚上好，欢迎来到 A Night to Shine！请先到签到台签到。小天使正在各桌售卖抽奖券，5 澳元一张；徽章 15 澳元一个。"],
    ["W", "Good evening, and welcome to A Night to Shine. Please check in at the front desk. Our Little Angels are coming round with raffle tickets at $5 each, and pins at $15."],
  ] },
  { t: "18:50", e: "19:00", zh: "入场排队 · 准备", en: "Line-up & standby", at: ["两位 MC 到台侧", "Both MCs to the side of the stage"], items: [
    ["crit", "21 位入场者离座到入口排队：会员 12 位在前，理事 7 位在后，副会长、会长最后", "The 21 leave their seats and line up at the entrance: 12 members, then 7 board, then the VP and President"],
    ["cue", "试麦；确认 Tian 和《女神》伴奏就位", "Mic check; Tian and the 《女神》 track ready"],
    ["cue", "走道清空；靠舞台预留 2 桌给入场者", "Aisle clear; 2 tables near the stage reserved for the 21"],
  ] },
  { t: "19:00", e: "19:02", key: true, zh: "主持人开场", en: "Opening", at: ["两位 MC 台中", "Both MCs centre stage"], items: [
    ["cue", "乐队渐停", "Band fades out"],
    ["W", "Ladies and gentlemen, good evening, and welcome to A Night to Shine, a black-tie Christmas celebration. I'm Wade."],
    ["S", "各位来宾，大家晚上好！我是 Solomon。欢迎来到 She Rises 的第一个圣诞晚会。"],
    ["W", "Tonight we're honoured to welcome {distTitleEn} {distName}, and our sponsors, {sponsors}. Thank you for your support."],
    ["S", "热烈欢迎 {distTitleZh} {distName}，以及各位赞助商：{sponsors}。谢谢你们的支持！"],
    ["S", "同时欢迎今晚的贵宾：{vips}。", { if: "vips" }],
    ["W", "We also welcome {vips}.", { if: "vips" }],
    ["S", "提醒大家：幸运抽奖只限购买了抽奖券的来宾参加。抽奖券 5 澳元一张，{raffleClose}前向小天使购买。8 点 10 分开奖，共 10 份奖品。"],
    ["W", "A note on the lucky draw: it's for raffle ticket holders only. Tickets are $5 from our Little Angels until {raffleClose}. We draw ten prizes at 8:10."],
    ["crit", "音乐开始前讲完所有介绍", "Finish every introduction before the music starts"],
    ["W", "And now, a special welcome. Singer Tian will bring in the women of She Rises with the song Nǚshén, \"Goddess\": first our members, then our board, and finally our Vice President and President."],
    ["cue", "Nǚshén 读作 nyoo-shun", "Nǚshén sounds like \"nyoo-shun\""],
    ["S", "今晚，歌手 Tian 将以一首《女神》，迎接 She Rises 的女神们：先是会员，然后是理事团队，最后是副会长和会长。请大家用最热烈的掌声欢迎她们！"],
    ["SW", "有请 Tian！ Please welcome Tian!"],
  ] },
  { t: "19:02", e: "19:05", key: true, zh: "女神入场 · Tian《女神》", en: "Goddess Entrance · Tian sings 《女神》", at: ["MC 台侧，不说话", "MCs at the side, silent"], items: [
    ["crit", "MC 全程不说话，只带掌声", "MCs stay silent and lead the applause"],
    ["table", "entrance"],
    ["cue", "第一段副歌结束前全部入座，之后是 Tian 的完整演出", "Everyone is seated by the end of the first chorus; Tian then sings the rest"],
  ] },
  { t: "19:05", e: "19:15", zh: "会长 + 副会长致辞", en: "President & Vice President", at: ["MC 台中，致辞时台侧", "Centre, then the side for the speeches"], items: [
    ["cue", "歌曲结束，带掌声", "Song ends; lead the applause"],
    ["S", "谢谢 Tian！刚才入场的，就是 She Rises 的会员和理事团队，再次掌声送给她们！"],
    ["W", "Thank you, Tian! Ladies and gentlemen, the members and board of She Rises. One more round of applause!"],
    ["W", "Tonight's dress code is silver, champagne and gold, and this room is shining. Give yourselves a hand!"],
    ["S", "今晚的着装是银色、香槟色和金色，大家都闪闪发光！也给自己一点掌声！"],
    ["S", "现在，有请 She Rises 会长 {pres} 和副会长 {vp} 上台！"],
    ["W", "Please welcome our President, {pres}, and Vice President, {vp}!"],
    ["cue", "两人一起致辞约 10 分钟，一人普通话、一人英语；MC 不翻译", "They speak together for about 10 minutes, one in Mandarin, one in English. No MC translation"],
  ] },
  { t: "19:15", e: "19:20", zh: "前菜", en: "Entrée", at: ["MC 台中", "Centre stage"], items: [
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
    ["S", "宣誓，是理事们对会员和社区的承诺。现在，有请 She Rises 的 8 位理事上台！"],
    ["W", "An oath is a promise to our members and our community. Please welcome the eight board members of She Rises!"],
    ["cue", "逐一念名，每位上台带掌声，两位 MC 轮流念", "Read each name as they walk up, taking turns"],
    ["list", "board"],
    ["cue", "宣誓语言：{oathLang}。交给 District 代表主持", "Oath in {oathLang}, administered by the representative"],
    ["W", "{distName}, over to you."],
    ["cue", "宣誓结束", "After the oath"],
    ["S", "恭喜 She Rises 理事团队！掌声送给她们！"],
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
  { t: "20:00", e: "20:10", zh: "Eric 演唱", en: "Eric performs", at: ["MC 台中，演唱时台侧", "Centre, then the side"], items: [
    ["S", "希望大家吃得开心！接下来，有请 Eric 为我们演唱两首歌：《{eric1}》和《{eric2}》。掌声有请 Eric！"],
    ["W", "Please welcome Eric, with two songs for us tonight: {eric1} and {eric2}. Eric!"],
    ["cue", "两首歌约 10 分钟。抽奖助理带票根和奖品到侧台", "Two songs, about 10 minutes. Draw assistant brings the stubs and prizes to the side of the stage"],
  ] },
  { t: "20:10", e: "20:20", key: true, zh: "幸运抽奖", en: "Lucky draw", at: ["两位 MC 台中", "Both MCs centre stage"], items: [
    ["crit", "只有 10 分钟：每份约 1 分钟，8:20 准时颁奖", "10 minutes only: about a minute a prize. Awards start at 8:20 sharp"],
    ["W", "Thank you, Eric! It's lucky draw time. Raffle tickets out, please!"],
    ["S", "谢谢 Eric！幸运抽奖时间到！请大家拿出抽奖券。感谢各位赞助商提供的奖品！"],
    ["cue", "每份：Solomon 报奖品 → Wade 抽号 → 号码逐位读，中英各一次", "Each prize: Solomon names it, Wade draws, then read the number digit by digit in both languages"],
    ["S", "第 N 份奖品：〔奖品〕，由〔提供者〕提供。中奖号码是……", { tpl: true }],
    ["W", "Prize N: 〔prize〕, from 〔sponsor〕. The winning number is…", { tpl: true }],
    ["list", "prizes"],
    ["cue", "无人认领：{unclaimed}", "Unclaimed: {unclaimed}"],
    ["W", "Congratulations to all our winners!"],
    ["S", "恭喜所有中奖的来宾！"],
  ] },
  { t: "20:20", e: "20:30", key: true, zh: "尼泊尔筹款颁奖 + Bobo 20 年长期服务奖", en: "Nepal awards + Bobo's 20-Year Long Service Award", at: ["两位 MC 台中", "Both MCs centre stage"], items: [
    ["S", "今年，She Rises 为尼泊尔筹得一万五千澳元！感谢每一位支持者。"],
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
    ["S", "恭喜 Bobo！接下来，有请会员 {sharer}，分享她这一年参加 She Rises 的感受。"],
    ["W", "Next, {sharer} will share what this year with She Rises has meant to her. Please welcome {sharer}."],
    ["cue", "约 5 分钟", "About 5 minutes"],
  ] },
  { t: "20:35", e: "20:40", zh: "Tian 演唱英文歌", en: "Tian's English song", at: ["MC 台中，演唱时台侧", "Centre, then the side"], items: [
    ["W", "Thank you, {sharer}. Tian is back, with an English song: {tianEn}. Please welcome Tian!"],
    ["S", "谢谢 {sharer} 的分享！Tian 再次登场，为我们演唱英文歌《{tianEn}》，掌声有请！"],
  ] },
  { t: "20:40", e: "20:45", zh: "义卖介绍", en: "Fundraising items", at: ["MC 台中，赞助商品在台上", "Centre stage, sponsor products on display"], items: [
    ["S", "谢谢 Tian！今晚的义卖品有：小熊公仔 {bearPrice}，徽章 15 澳元，还有台上的赞助商品 {sponsorPrice}。义卖所得将用于 {fundsFor}。"],
    ["W", "Tonight's fundraising items: teddy bears at {bearPrice}, pins at $15, and the sponsor products here on stage, {sponsorPrice}. Funds raised go to {fundsFor}."],
    ["S", "小天使稍后会到各桌，可用 {pay} 付款。"],
    ["W", "Our Little Angels will come to your table shortly. You can pay by {pay}."],
  ] },
  { t: "20:45", e: "20:50", zh: "大合照", en: "Group photo", at: ["MC 台前", "In front of the stage"], items: [
    ["W", "Dessert is on its way! Before you dig in, let's get everyone in one photo. Please join us at {photoSpot}."],
    ["S", "甜品已经上桌！请全场来宾到 {photoSpot}，一起大合照！"],
    ["cue", "8:50 前拍完", "Finish by 8:50"],
  ] },
  { t: "20:50", e: "21:30", zh: "Live band", en: "Live band", at: ["MC 台中，之后自由", "Centre, then free"], items: [
    ["S", "谢谢大家！接下来是 Live band 时间，请尽情享受音乐、自由交流。小天使会再到各桌义卖徽章和小熊，到 9 点 15 分。"],
    ["W", "Thank you! It's live band time with {band}. Enjoy the music and the night. Our Little Angels are coming round with pins and bears until 9:15."],
    ["cue", "第二轮不再卖抽奖券", "No raffle tickets in the second round"],
  ] },
  { t: "21:30", e: "22:00", zh: "致谢 · 送客", en: "Thank-yous & farewell", at: ["两位 MC 台中", "Both MCs centre stage"], items: [
    ["W", "Ladies and gentlemen, that brings us to the end of A Night to Shine. A few thank-yous."],
    ["S", "感谢各位赞助商、各位来宾、{distName}、Tian、Eric 和乐队、She Rises 理事团队、所有义工和小天使，还有 Rombe Rooftop。"],
    ["W", "Thank you to our sponsors, our guests, {distName}, Tian, Eric and {band}, the She Rises board, our volunteers and Little Angels, and Rombe Rooftop."],
    ["S", "离开前别忘了带走伴手礼。祝大家圣诞快乐，晚安！"],
    ["W", "Don't forget your gift bag on the way out. Merry Christmas, and good night!"],
  ] },
];

// Updated run sheet (13 Nov). [time, zh, en, zh notes, en notes, changed in this update?]
export const RUNSHEET = [
  ["17:00", "工作人员到场布置", "Crew arrive and set up", "乐队、Eric 与 Tian 试音", "Band, Eric and Tian sound checks"],
  ["18:00", "海报开始时间", "Poster start time", "签到台就位；乐队暖场（纯音乐）", "Check-in desk ready; band warm-up (instrumental)"],
  ["18:30", "迎宾、宾客入场、签到", "Welcome, arrival, check-in", "小天使到各桌售卖抽奖券 + 徽章（至 7:00）", "Little Angels sell raffle tickets + pins at each table (until 7:00)"],
  ["18:50", "女神入场集合", "Goddess Entrance line-up", "入场的 21 人到入口排队", "The 21 entering line up at the entrance"],
  ["19:00", "主持人开场", "MC opening", "欢迎、介绍贵宾、说明抽奖规则；介绍 Tian 与女神入场", "Welcome, VIPs, raffle rules; introduce Tian and the Goddess Entrance"],
  ["19:02", "女神入场｜Tian 演唱《女神》", "Goddess Entrance / Tian sings 《女神》", "会员 → 理事 → 副会长、会长；第一段副歌结束前入座", "Members → board → VP, President; seated by the end of the first chorus"],
  ["19:05", "会长 + 副会长致辞", "President + VP speech", "10 分钟；普通话 + 英语", "10 minutes; Mandarin + English"],
  ["19:15", "前菜", "Entrée", "乐队配乐；8 位理事到侧台准备", "Band plays; 8 board members ready at the side of the stage"],
  ["19:20", "District 代表致辞", "District representative's speech", "5 分钟；致辞后留步", "5 minutes; stays on stage afterwards"],
  ["19:25", "理事宣誓仪式", "Board oath ceremony", "20 分钟；District 代表监誓", "20 minutes; administered by the District representative"],
  ["19:45", "宣誓合照", "Oath group photo", "5 分钟；之后理事和会员下台", "5 minutes; then board and members return to seats"],
  ["19:50", "主菜", "Main course", "乐队配乐", "Band plays"],
  ["20:00", "Eric 演唱", "Eric performs", "2 首歌曲（预留约 10 分钟）", "2 songs (allow about 10 minutes)", true],
  ["20:10", "幸运抽奖", "Lucky draw", "10 份奖品；10 分钟，流程需紧凑", "10 prizes; 10 minutes, keep it moving"],
  ["20:20", "尼泊尔筹款颁奖 + Bobo 20 年长期服务奖", "Nepal awards + Bobo 20-Year Long Service Award", "筹款 $15,000：颁奖杯、得奖者合照；颁发 Bobo 奖；约 10 分钟", "$15,000 raised: trophies and recipients' photo; Bobo's award; about 10 minutes", true],
  ["20:30", "会员分享", "Member sharing", "5 分钟", "5 minutes"],
  ["20:35", "Tian 演唱英文歌", "Tian sings an English song", "独唱约 5 分钟", "Solo, about 5 minutes", true],
  ["20:40", "MC 介绍义卖", "MC introduces fundraising items", "小熊、徽章、赞助商品", "Bears, pins, sponsor products"],
  ["20:45", "大合照", "Group photo", "甜品上桌", "Dessert served"],
  ["20:50", "Live band（有歌手演唱）", "Live band (with vocals)", "小天使第二轮义卖徽章 + 小熊（至 9:15）", "Little Angels' second round: pins + bears (until 9:15)"],
  ["21:30", "乐队结束", "Band finishes", "致谢、送客", "Thank-yous, farewell guests"],
  ["22:00", "清场", "Venue cleared", "收回所有物品、义卖款项", "Collect all items and fundraising money"],
];

export const RUNSHEET_NOTE = [
  "时间协调：为安排 Eric 两首歌并保留 8:20 颁奖，抽奖改为 8:10–8:20（10 分钟）；义卖介绍、大合照及 Live band 顺延 5 分钟。",
  "Timing: the lucky draw is now 8:10–8:20 (10 minutes) to fit Eric's two songs and keep the 8:20 awards. Fundraising items, group photo and live band move 5 minutes later.",
];

// Notes tab. crit = from the event file's red items; check = open questions to settle before the night.
export const NOTES = {
  crit: [
    ["幸运抽奖只限购买抽奖券的来宾。海报写过「包含幸运抽奖」，开场必须讲清楚", "The lucky draw is for raffle ticket holders only. The poster mentioned a lucky draw, so say this clearly at the opening"],
    ["音乐开始前讲完全部介绍；Tian 唱歌时 MC 不说话，只带掌声。入场者的介绍留到歌后", "Finish all introductions before the music. While Tian sings, MCs stay silent and only lead applause. Introduce the 21 after the song"],
    ["6:50 入场的 21 人离座到入口排队：会员在前，理事在后，副会长、会长最后", "At 6:50 the 21 leave their seats and line up: members first, board behind, VP and President last"],
    ["预留 2 桌靠近舞台给入场者，大家走到同一区域入座", "2 tables near the stage are reserved for the 21, so everyone sits in one area"],
    ["District 代表致辞时，8 位理事已在侧台；7:15 前菜时集合", "The 8 board members are waiting at the side of the stage during the District speech; they gather at 7:15"],
    ["抽奖只有 8:10–8:20，8:20 准时颁奖", "The draw has 8:10–8:20 only; awards start at 8:20 sharp"],
  ],
  check: [
    ["抽奖券截止：流程写 6:30–7:00 售卖，但 7:00 开场才讲规则，听完规则的来宾已买不到。建议延长到开场后（填在「待填」）", "Raffle sales close at 7:00 in the run sheet, but the rules are announced at 7:00, so guests who hear them can't buy. Extend sales past the opening (set it in TBC)"],
    ["宣誓 8 位理事，但女神入场只有 7 位理事。确认 8 人名单", "8 board members take the oath, but only 7 walk in at the Goddess Entrance. Confirm the 8 names"],
    ["宣誓语言拟用英文，需与 District 确认誓词和流程", "The oath will likely be in English; confirm the wording and procedure with the District"],
    ["Tian《女神》：确认歌名、长度、伴奏，以及能否拉长前奏配合入场", "Tian's 《女神》: confirm title, length, backing track, and whether the intro can be extended for the entrance"],
    ["尼泊尔筹款颁奖：确认奖项名称、奖杯数量和上台顺序，提前交给 MC", "Nepal awards: confirm award names, trophy count and order, and give them to the MCs in advance"],
    ["小熊和赞助商品价格、付款方式（现金 / 刷卡 / 转账）、抽奖方式", "Bear and sponsor product prices, payment methods (cash / card / transfer), how the draw is run"],
    ["旧版档案写 8:05 抽奖，新版流程为 8:10。海报、PPT、工作人员表要一致", "The earlier file says the draw is at 8:05; the updated run sheet says 8:10. Make slides and crew sheets match"],
  ],
  link: ["串场三步：收尾上一环节 → 预告下一环节 → 邀请下一位上台", "Every link: wrap up the last segment → say what's next → invite the next person up"],
};
