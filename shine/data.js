// A Night to Shine · 13 November 2026 · MC script data.
// Solomon (S) speaks Mandarin in simplified Chinese; Wade (W) speaks English. "SW" is said together.
// {key} is a TBC field from FIELDS or LISTS: blank ones show highlighted in the script until filled in.
// Timings follow the organiser's run sheet updated 4 Nov: walk-in from the chorus 「我是女神」, President first;
// Eric at 8:00 and 8:50; fundraising sales and the lucky draw from 8:10 to 8:50; cake and group photo at 9:00.

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
  ["sales", "义卖、蛋糕与合照", "Sales, cake & photo"],
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
  ["eric2", "Eric 第二首（8:50）", "Eric's song 2 (8:50)", "show", "歌名 · title"],
  ["tianEn", "Tian 英文歌", "Tian's English song", "show", "歌名 · title"],
  ["raffleClose", "抽奖券截止时间", "Raffle sales close", "draw", "如 7:30 pm（流程写至 7:00）"],
  ["unclaimed", "无人认领规则", "Unclaimed prize rule", "draw", "如 30 秒无人上台即重抽"],
  ["nepalBy", "尼泊尔奖杯颁奖人", "Nepal trophies presented by", "awards", "姓名 · name"],
  ["boboName", "Bobo 全名", "Bobo's full name", "awards", "姓名 · name"],
  ["boboBy", "Bobo 奖颁奖人", "Bobo's award presented by", "awards", "姓名 · name"],
  ["boboZh", "Bobo 一句话介绍（中文）", "Bobo citation, Chinese", "awards", "可留空 · optional", true],
  ["boboEn", "Bobo 一句话介绍（英文）", "Bobo citation, English", "awards", "optional", true],
  ["bearPrice", "小熊价格", "Bear price", "sales", "如 $25"],
  ["sponsorPrice", "赞助商品价格", "Sponsor product prices", "sales", "如 见标价 · as marked"],
  ["pay", "付款方式", "Payment methods", "sales", "如 现金、刷卡 · cash or card"],
  ["fundsFor", "义卖款项用途", "Funds raised go to", "sales", "如 尼泊尔项目 · the Nepal project"],
  ["cakeBy", "切蛋糕嘉宾", "Cake cut by", "sales", "如 会长、副会长和理事 · names"],
  ["photoSpot", "大合照位置", "Group photo spot", "sales", "如 舞台前 · the front of the stage"],
];

// Repeating rows. Field keys are col + row number (board1 … board8, prize1, prizeBy1 …).
export const LISTS = {
  board: { group: "club", zh: "宣誓理事（8 位）", en: "Board members taking the oath (8)", n: 8, need: "all",
    cols: [["board", "姓名", "Name"]] },
  prizes: { group: "draw", zh: "奖品（1–5 第一轮 8:10，6–10 第二轮 8:40）", en: "Prizes (1–5 at 8:10, 6–10 at 8:40)", n: 10, need: "all",
    cols: [["prize", "奖品", "Prize"], ["prizeBy", "提供者", "Donated by"]] },
  nepal: { group: "awards", zh: "尼泊尔筹款奖项", en: "Nepal fundraising awards", n: 8, need: "one",
    cols: [["award", "奖项", "Award"], ["winner", "得奖者", "Recipient"]] },
};

// Goddess Entrance cue sheet (run sheet 4 Nov): walk-in starts on the chorus 「我是女神」; the number follows the list.
export const ENTRANCE = [
  ["前奏 · 主歌", "全体在入口排好队等候", "Intro and verse: everyone waits in line at the entrance"],
  ["副歌「我是女神」", "会长起步入场（带最热烈的掌声）", "Chorus \"wǒ shì nǚshén\": the President starts walking (biggest applause)"],
  ["随后", "副会长 → 理事 → 会员，依次跟上", "Then the VP → board → members, in turn"],
  ["到位", "走到靠舞台的预留桌入座", "Everyone sits at the reserved tables near the stage"],
];

// Script segments. t/e = start/end (24 h). items:
//   ["S"|"W"|"SW", text, opts?]  spoken line; opts.if = only when that field is filled; opts.tpl = pattern to adapt
//   ["cue", zh, en]  stage direction, not read out      ["crit", zh, en]  must-not-miss direction
//   ["list", name, opts?]  board / prizes (opts.from–opts.to) / nepal     ["table", "entrance"]
const PRIZE_PATTERN = [
  ["cue", "每份：Solomon 报奖品 → Wade 抽号 → 号码逐位读，中英各一次", "Each prize: Solomon names it, Wade draws, then read the number digit by digit in both languages"],
  ["S", "第 N 份奖品：〔奖品〕，由〔提供者〕提供。中奖号码是……", { tpl: true }],
  ["W", "Prize N: 〔prize〕, from 〔sponsor〕. The winning number is…", { tpl: true }],
];

export const SEGMENTS = [
  { t: "18:30", e: "18:50", zh: "背景广播", en: "Doors & check-in", at: ["后台麦，不上台", "Off-stage mic"], items: [
    ["cue", "6:30 和 6:45 各广播一次", "Announce at 6:30 and again at 6:45"],
    ["S", "各位来宾晚上好，欢迎来到她慧狮子会的 A Night to Shine！请先到签到台签到。小天使正在各桌售卖抽奖券，5 澳元一张；徽章 15 澳元一个。"],
    ["W", "Good evening, and welcome to A Night to Shine. Please check in at the front desk. Our Little Angels are coming round with raffle tickets at $5 each, and pins at $15."],
  ] },
  { t: "18:50", e: "19:00", zh: "入场排队 · 准备", en: "Line-up & standby", at: ["两位 MC 到台侧", "Both MCs to the side of the stage"], items: [
    ["crit", "入场人员（人数以名单为准）离座到入口排队：会长、副会长在最前，理事其后，会员最后", "Everyone in the entrance (number as per the list) lines up at the entrance: President and VP at the front, then board, then members"],
    ["cue", "试麦；确认 Tian 和《女神》伴奏就位", "Mic check; Tian and the 《女神》 track ready"],
    ["cue", "走道清空；靠舞台预留 2 桌给入场者", "Aisle clear; 2 tables near the stage reserved for those walking in"],
  ] },
  { t: "19:00", e: "19:02", key: true, zh: "主持人开场 · 暖场", en: "Opening & warm-up", at: ["两位 MC 台中", "Both MCs centre stage"], items: [
    ["crit", "只有 2 分钟：暖场要轻快，7:02 起歌", "2 minutes only: keep the warm-up brisk; the song starts at 7:02"],
    ["cue", "乐队渐停", "Band fades out"],
    ["W", "Ladies and gentlemen, good evening, and welcome to A Night to Shine, a black-tie Christmas celebration. I'm Wade."],
    ["S", "各位来宾，大家晚上好！我是 Solomon。欢迎来到 She Rises 她慧狮子会的第一个圣诞晚会。"],
    ["W", "You may have noticed something. She Rises is all about women rising, and tonight they've handed the microphone to two men."],
    ["S", "没错，一个专注女性成长的狮子会，请了两位男士来主持。所以今晚：女士们负责闪耀，我们两位负责鼓掌！说实话，台下这么多女神，压力不小。"],
    ["W", "Hands up if this is your very first She Rises event!"],
    ["S", "第一次来参加她慧狮子会活动的朋友，请举手！欢迎欢迎！"],
    ["S", "今晚的着装是银色、香槟色和金色。穿金色的朋友，欢呼一下！香槟色的！银色的！"],
    ["W", "Make some noise if you're wearing gold! Champagne! Silver!"],
    ["cue", "每个颜色停一下，等欢呼", "Pause after each colour for the cheer"],
    ["W", "Tonight we're honoured to welcome {distTitleEn} {distName}, and our sponsors, {sponsors}. Thank you for your support."],
    ["S", "热烈欢迎 {distTitleZh} {distName}，以及各位赞助商：{sponsors}。谢谢你们的支持！"],
    ["S", "同时欢迎今晚的贵宾：{vips}。", { if: "vips" }],
    ["W", "We also welcome {vips}.", { if: "vips" }],
    ["S", "提醒大家：幸运抽奖只限购买了抽奖券的来宾参加。抽奖券 5 澳元一张，{raffleClose}前向小天使购买。8 点 10 分开始抽奖，共 10 份奖品。"],
    ["W", "A note on the lucky draw: it's for raffle ticket holders only. Tickets are $5 from our Little Angels until {raffleClose}. We start drawing ten prizes at 8:10."],
    ["crit", "音乐开始前讲完所有介绍", "Finish every introduction before the music starts"],
    ["W", "And now, a special welcome. Singer Tian will bring in the women of She Rises with the song Nǚshén, \"Goddess\", led by our President, then our Vice President, our board, and our members."],
    ["cue", "Nǚshén 读作 nyoo-shun", "Nǚshén sounds like \"nyoo-shun\""],
    ["S", "今晚，歌手 Tian 将以一首《女神》，迎接她慧狮子会的女神们：由会长带领，然后是副会长、理事团队，最后是会员们。请大家用最热烈的掌声欢迎她们！"],
    ["SW", "有请 Tian！ Please welcome Tian!"],
  ] },
  { t: "19:02", e: "19:05", key: true, zh: "女神入场 · Tian《女神》", en: "Goddess Entrance · Tian sings 《女神》", at: ["MC 台侧，不说话", "MCs at the side, silent"], items: [
    ["crit", "MC 全程不说话，只带掌声。副歌「我是女神」响起、会长起步时，带最热烈的掌声", "MCs stay silent and lead the applause. Biggest applause when the chorus \"wǒ shì nǚshén\" starts and the President sets off"],
    ["table", "entrance"],
    ["cue", "Tian 唱完整首后，MC 再上台", "MCs go back up once Tian finishes the song"],
  ] },
  { t: "19:05", e: "19:15", zh: "会长 + 副会长致辞", en: "President & Vice President", at: ["MC 台中，致辞时台侧", "Centre, then the side for the speeches"], items: [
    ["cue", "歌曲结束，带掌声", "Song ends; lead the applause"],
    ["S", "谢谢 Tian！刚才由会长带领入场的，就是她慧狮子会的理事团队和会员们，再次掌声送给她们！"],
    ["W", "Thank you, Tian! Ladies and gentlemen, led by our President, the board and members of She Rises. One more round of applause!"],
    ["S", "现在，有请她慧狮子会会长 {pres} 和副会长 {vp} 上台！"],
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
  { t: "20:00", e: "20:10", zh: "Eric 演唱", en: "Eric performs", at: ["MC 台中，演唱时台侧", "Centre, then the side"], items: [
    ["S", "希望大家吃得开心！接下来，有请 Eric 为我们演唱《{eric1}》。掌声有请 Eric！"],
    ["W", "Please welcome Eric, singing {eric1}. Eric!"],
    ["cue", "一首，约 3 分钟。抽奖助理带票根和奖品到侧台", "One song, about 3 minutes. Draw assistant brings the stubs and prizes to the side of the stage"],
  ] },
  { t: "20:10", e: "20:20", key: true, zh: "义卖开始 + 幸运抽奖（第一轮）", en: "Fundraising sales + lucky draw, round 1", at: ["两位 MC 台中，赞助商品在台上", "Both MCs centre stage, sponsor products on display"], items: [
    ["W", "Thank you, Eric! It's fundraising time. Teddy bears at {bearPrice}, pins at $15, and the sponsor products here on stage, {sponsorPrice}. Funds raised go to {fundsFor}."],
    ["S", "谢谢 Eric！义卖时间到！今晚的义卖品有：小熊公仔 {bearPrice}，徽章 15 澳元，还有台上的赞助商品 {sponsorPrice}。义卖所得将用于 {fundsFor}。"],
    ["S", "小天使现在就到各桌，可用 {pay} 付款。"],
    ["W", "Our Little Angels are coming to your tables now. You can pay by {pay}."],
    ["cue", "同时开始抽奖", "Start the draw while they sell"],
    ["W", "And while they do, let's start the lucky draw! Raffle tickets out, please. Who's feeling lucky tonight? Hands up!"],
    ["S", "同时，幸运抽奖开始！请拿出抽奖券。觉得自己今晚手气好的，举手！感谢各位赞助商提供奖品。10 份奖品分两轮抽，现在先抽前 5 份。"],
    ...PRIZE_PATTERN,
    ["list", "prizes", { from: 1, to: 5 }],
    ["cue", "无人认领：{unclaimed}", "Unclaimed: {unclaimed}"],
    ["S", "恭喜各位！剩下 5 份奖品，8 点 40 分左右再抽，抽奖券请收好！"],
    ["W", "Congratulations! Five more prizes at about 8:40, so hold on to your tickets."],
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
    ["W", "Our next award honours twenty years of service. Please welcome Bobo, {boboName}, to receive the 20-Year Long Service Award, presented by {boboBy}."],
    ["S", "下一个奖项，表彰二十年的付出。有请 Bobo（{boboName}）上台，领取 20 年长期服务奖，由 {boboBy} 颁发！"],
    ["S", "{boboZh}", { if: "boboZh" }],
    ["W", "{boboEn}", { if: "boboEn" }],
    ["S", "二十年，谢谢您，Bobo！"],
    ["W", "Twenty years. Thank you, Bobo!"],
  ] },
  { t: "20:30", e: "20:35", zh: "会员分享（Victoria）", en: "Member sharing (Victoria)", at: ["MC 台中，分享时台侧", "Centre, then the side"], items: [
    ["S", "恭喜 Bobo！接下来，有请会员 Victoria，分享她这一年参加她慧狮子会活动的感受。"],
    ["W", "Next, Victoria will share what this year with She Rises has meant to her. Please welcome Victoria."],
    ["cue", "约 3 分钟", "About 3 minutes"],
  ] },
  { t: "20:35", e: "20:40", zh: "Tian 演唱英文歌", en: "Tian's English song", at: ["MC 台中，演唱时台侧", "Centre, then the side"], items: [
    ["W", "Thank you, Victoria. Tian is back, with an English song: {tianEn}. Please welcome Tian!"],
    ["S", "谢谢 Victoria 的分享！Tian 再次登场，为我们演唱英文歌《{tianEn}》，掌声有请！"],
    ["cue", "约 5 分钟。唱完接第二轮抽奖", "About 5 minutes. The second draw round follows"],
  ] },
  { t: "20:40", e: "20:50", key: true, zh: "幸运抽奖（第二轮）", en: "Lucky draw, round 2", at: ["两位 MC 台中", "Both MCs centre stage"], items: [
    ["W", "Thank you, Tian! Time for the second round of the lucky draw: five more prizes. Tickets out!"],
    ["S", "谢谢 Tian！幸运抽奖第二轮，还有 5 份奖品，请拿出抽奖券！"],
    ...PRIZE_PATTERN,
    ["list", "prizes", { from: 6, to: 10 }],
    ["cue", "无人认领：{unclaimed}", "Unclaimed: {unclaimed}"],
    ["W", "Congratulations to all our winners!"],
    ["S", "恭喜所有中奖的来宾！"],
    ["crit", "8:50 前抽完，接 Eric", "Finish by 8:50; Eric is next"],
  ] },
  { t: "20:50", e: "21:00", zh: "Eric 再次演唱", en: "Eric performs again", at: ["MC 台中，演唱时台侧", "Centre, then the side"], items: [
    ["S", "接下来，Eric 再次登场，为我们带来《{eric2}》！掌声有请！"],
    ["W", "And Eric is back with one more: {eric2}. Please welcome Eric!"],
    ["cue", "一首，约 3 分钟。准备蛋糕和刀，摄影就位", "One song, about 3 minutes. Cake and knife ready; photographer in place"],
  ] },
  { t: "21:00", e: "21:10", key: true, zh: "切蛋糕 · 大合照", en: "Cake cutting & group photo", at: ["MC 台中，蛋糕在台上", "Centre stage, cake on stage"], items: [
    ["W", "Thank you, Eric! It's She Rises' first Christmas, and that calls for cake. Please welcome {cakeBy} to cut the cake!"],
    ["S", "谢谢 Eric！今晚是她慧狮子会的第一个圣诞，当然要切蛋糕！有请 {cakeBy} 上台！"],
    ["cue", "带全场倒数：三、二、一！切蛋糕时带掌声", "Lead a countdown, three, two, one, and applause for the cut"],
    ["S", "切完蛋糕，请全场来宾到 {photoSpot}，一起大合照！甜品也已经上桌了。"],
    ["W", "Now let's get everyone in one photo. Please join us at {photoSpot}. Dessert is being served."],
    ["cue", "9:10 前拍完", "Finish by 9:10"],
  ] },
  { t: "21:10", e: "21:30", zh: "Live band", en: "Live band", at: ["MC 台中，之后自由", "Centre, then free"], items: [
    ["S", "谢谢大家！接下来是 Live band 时间，请尽情享受音乐、自由交流。小天使还在各桌义卖徽章和小熊，到 9 点 15 分。"],
    ["W", "Thank you! It's live band time with {band}. Enjoy the music and the night. Our Little Angels are still selling pins and bears until 9:15."],
    ["cue", "第二轮不再卖抽奖券", "No more raffle tickets"],
  ] },
  { t: "21:30", e: "22:00", zh: "致谢 · 送客", en: "Thank-yous & farewell", at: ["两位 MC 台中", "Both MCs centre stage"], items: [
    ["W", "Ladies and gentlemen, that brings us to the end of A Night to Shine. A few thank-yous."],
    ["S", "感谢各位赞助商、各位来宾、{distName}、Tian、Eric 和乐队、她慧狮子会理事团队、所有义工和小天使，还有 Rombe Rooftop。"],
    ["W", "Thank you to our sponsors, our guests, {distName}, Tian, Eric and {band}, the She Rises board, our volunteers and Little Angels, and Rombe Rooftop."],
    ["S", "离开前别忘了带走伴手礼。祝大家圣诞快乐，晚安！"],
    ["W", "Don't forget your gift bag on the way out. Merry Christmas, and good night!"],
  ] },
];

// Organiser's run sheet, updated 4 Nov. [time, zh, en, zh notes, en notes, shaded as changed in that update?]
export const RUNSHEET = [
  ["17:00", "工作人员到场布置", "Crew arrive and set up", "乐队、Eric 与 Tian 试音", "Band, Eric and Tian sound checks"],
  ["18:00", "海报开始时间", "Poster start time", "签到台就位；乐队暖场（纯音乐）", "Check-in desk ready; band warm-up (instrumental)"],
  ["18:30", "迎宾、宾客入场、签到", "Welcome, arrival, check-in", "小天使到各桌售卖抽奖券 + 徽章（至 7:00）", "Little Angels sell raffle tickets + pins at each table (until 7:00)"],
  ["18:50", "女神入场集合", "Goddess Entrance line-up", "入场人员到入口排队（人数以名单为准）", "Everyone entering lines up at the entrance (number as per the list)"],
  ["19:00", "主持人开场", "MC opening", "欢迎、介绍贵宾、说明抽奖规则；介绍 Tian 与女神入场", "Welcome, VIPs, raffle rules; introduce Tian and the Goddess Entrance"],
  ["19:02", "女神入场｜Tian 演唱《女神》", "Goddess Entrance / Tian sings 《女神》", "副歌「我是女神」开始时起步入场；顺序：会长 → 副会长 → 理事 → 会员", "Walk-in starts when the chorus \"我是女神\" begins; order: President → VP → board → members"],
  ["19:05", "会长 + 副会长致辞", "President + VP speech", "10 分钟；普通话 + 英语", "10 minutes; Mandarin + English"],
  ["19:15", "前菜", "Entrée", "乐队配乐；8 位理事到侧台准备", "Band plays; 8 board members ready at the side of the stage"],
  ["19:20", "District 代表致辞", "District representative's speech", "5 分钟；致辞后留步", "5 minutes; stays on stage afterwards"],
  ["19:25", "理事宣誓仪式", "Board oath ceremony", "20 分钟；District 代表监誓", "20 minutes; administered by the District representative"],
  ["19:45", "宣誓合照", "Oath group photo", "5 分钟；之后理事和会员下台", "5 minutes; then board and members return to seats"],
  ["19:50", "主菜", "Main course", "乐队配乐", "Band plays"],
  ["20:00", "Eric 演唱", "Eric performs", "1 首歌曲（约 3 分钟）", "1 song (about 3 minutes)", true],
  ["20:10", "义卖开始 + 幸运抽奖", "Fundraising sales begin + lucky draw", "MC 介绍义卖：小熊、徽章、赞助商品；小天使到各桌义卖；幸运抽奖 10 份奖品，穿插进行（至 8:50）", "MC introduces bears, pins, sponsor products; Little Angels sell at tables; lucky draw (10 prizes) runs alongside (until 8:50)", true],
  ["20:20", "尼泊尔筹款颁奖 + Bobo 20 年长期服务奖", "Nepal awards + Bobo 20-Year Long Service Award", "筹款 $15,000：颁奖杯、得奖者合照；颁发 Bobo 奖；约 10 分钟", "$15,000 raised: trophies and recipients' photo; Bobo's award; about 10 minutes"],
  ["20:30", "会员分享（Victoria）", "Member sharing (Victoria)", "3 分钟", "3 minutes"],
  ["20:35", "Tian 演唱英文歌", "Tian sings an English song", "独唱约 5 分钟", "Solo, about 5 minutes"],
  ["20:50", "Eric 再次演唱", "Eric performs again", "1 首歌曲（约 3 分钟）", "1 song (about 3 minutes)", true],
  ["21:00", "切蛋糕、大合照", "Cake cutting and group photo", "甜品上桌", "Dessert served", true],
  ["21:10", "Live band（有歌手演唱）", "Live band (with vocals)", "小天使第二轮义卖徽章 + 小熊（至 9:15）", "Little Angels' second round: pins + bears (until 9:15)"],
  ["21:30", "乐队结束", "Band finishes", "致谢、送客", "Thank-yous, farewell guests"],
  ["22:00", "清场", "Venue cleared", "收回所有物品、义卖款项", "Collect all items and fundraising money"],
];

export const RUNSHEET_NOTE = [
  "时间调整（11 月 4 日版）：义卖与幸运抽奖于 8:10 一同开始（至 8:50）；Eric 于 8:50 再次演唱；9:00 切蛋糕大合照并上甜品，Live band 顺延至 9:10。金线标出为本次更新项目。MC 稿把 10 份奖品分两轮：8:10 抽 1–5，8:40（Tian 之后）抽 6–10。",
  "Timing (4 November version): fundraising sales and the lucky draw start together at 8:10 (until 8:50); Eric sings again at 8:50; cake cutting, group photo and dessert at 9:00, with the live band at 9:10. Gold-edged rows changed in this update. The MC script splits the 10 prizes into two rounds: 1–5 at 8:10, 6–10 at 8:40 after Tian.",
];

// Notes tab. crit = must-not-miss items; check = open questions to settle before the night.
export const NOTES = {
  crit: [
    ["幸运抽奖只限购买抽奖券的来宾。海报写过「包含幸运抽奖」，开场必须讲清楚", "The lucky draw is for raffle ticket holders only. The poster mentioned a lucky draw, so say this clearly at the opening"],
    ["音乐开始前讲完全部介绍；Tian 唱歌时 MC 不说话，只带掌声。入场者的介绍留到歌后", "Finish all introductions before the music. While Tian sings, MCs stay silent and only lead applause. Introduce those who walked in after the song"],
    ["6:50 入场人员（人数以名单为准）离座到入口排队：会长、副会长在最前，理事其后，会员最后", "At 6:50 everyone in the entrance (number as per the list) lines up: President and VP in front, board behind, members last"],
    ["副歌「我是女神」响起时才起步，会长先走", "Nobody walks until the chorus \"wǒ shì nǚshén\" begins; the President goes first"],
    ["预留 2 桌靠近舞台给入场者，大家走到同一区域入座", "2 tables near the stage are reserved for those walking in, so everyone sits in one area"],
    ["District 代表致辞时，8 位理事已在侧台；7:15 前菜时集合", "The 8 board members are waiting at the side of the stage during the District speech; they gather at 7:15"],
    ["抽奖分两轮：8:10 抽 1–5，8:40 抽 6–10，8:50 前抽完；8:20 准时颁奖", "The draw runs in two rounds: 1–5 at 8:10, 6–10 at 8:40, done by 8:50. Awards start at 8:20 sharp"],
  ],
  check: [
    ["开场仍只有 2 分钟（7:00–7:02），加了暖场后实际约 3 分钟。请统筹确认入场可顺延约 1 分钟，或暖场再缩短", "The opening is still 2 minutes (7:00–7:02), but with the warm-up it runs about 3. Ask the event lead whether the entrance can slip a minute, or shorten the warm-up"],
    ["抽奖分两轮（1–5 在 8:10，6–10 在 8:40）是 MC 稿的安排，流程只写「穿插进行」。请与抽奖助理确认", "Splitting the draw into two rounds (1–5 at 8:10, 6–10 at 8:40) is the script's plan; the run sheet only says \"interspersed\". Confirm with the draw assistant"],
    ["义卖 8:10 开始，但 9:10 一行仍写「小天使第二轮义卖至 9:15」。确认义卖几点结束", "Sales now start at 8:10, but the 9:10 row still says the second round runs until 9:15. Confirm when sales stop"],
    ["切蛋糕：确认由谁切、蛋糕放哪里、刀和盘子、谁拍照", "Cake: confirm who cuts it, where it sits, the knife and plates, and who photographs it"],
    ["Tian《女神》：确认副歌「我是女神」在第几秒开始，带位员据此放行；伴奏和能否拉长前奏", "Tian's 《女神》: confirm when the chorus \"我是女神\" starts so the ushers can cue it; backing track, and whether the intro can be extended"],
    ["抽奖券截止：流程写 6:30–7:00 售卖，但 7:00 开场才讲规则，听完规则的来宾已买不到。建议延长到开场后（填在「待填」）", "Raffle sales close at 7:00 in the run sheet, but the rules are announced at 7:00, so guests who hear them can't buy. Extend sales past the opening (set it in TBC)"],
    ["宣誓 8 位理事：确认名单。入场人数以名单为准", "Confirm the names of the 8 board members taking the oath. The entrance number follows the list"],
    ["宣誓语言拟用英文，需与 District 确认誓词和流程", "The oath will likely be in English; confirm the wording and procedure with the District"],
    ["尼泊尔筹款颁奖：确认奖项名称、奖杯数量和上台顺序，提前交给 MC", "Nepal awards: confirm award names, trophy count and order, and give them to the MCs in advance"],
    ["小熊和赞助商品价格、付款方式（现金 / 刷卡 / 转账）、抽奖方式", "Bear and sponsor product prices, payment methods (cash / card / transfer), how the draw is run"],
  ],
  link: ["串场三步：收尾上一环节 → 预告下一环节 → 邀请下一位上台", "Every link: wrap up the last segment → say what's next → invite the next person up"],
};
