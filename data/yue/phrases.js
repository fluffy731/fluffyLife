// Cantonese set phrases, grouped by unit like vocab-a0/a1/a2.js (same row shape, pos "phrase"):
//   [zh, jp, ko, en, "phrase", exZh, exJp, exKo, check?]
// They are spread through each unit's words by data/yue/vocab.js.
export const PHRASES = {
  // Unit 1 — 소리와 성조: phrases for when you don't catch the sounds
  1: [
    ["我唔明", "ngo5 m4 ming4", "이해가 안 돼요", "I don't understand", "phrase", "對唔住，我唔明。", "deoi3 m4 zyu6, ngo5 m4 ming4.", "죄송해요, 이해가 안 돼요."],
    ["你講咩話", "nei5 gong2 me1 waa2", "뭐라고 하셨어요? (못 알아들었을 때)", "what did you say?", "phrase", "唔好意思，你講咩話？", "m4 hou2 ji3 si1, nei5 gong2 me1 waa2?", "죄송해요, 뭐라고 하셨어요?", 1],
    ["講慢啲得唔得", "gong2 maan6 di1 dak1 m4 dak1", "좀 천천히 말해 주실 수 있어요?", "could you speak more slowly?", "phrase", "唔該，講慢啲得唔得？", "m4 goi1, gong2 maan6 di1 dak1 m4 dak1?", "저기요, 좀 천천히 말해 주실 수 있어요?"],
    ["再講一次", "zoi3 gong2 jat1 ci3", "한 번 더 말해 주세요", "say it again, please", "phrase", "唔該你再講一次。", "m4 goi1 nei5 zoi3 gong2 jat1 ci3.", "한 번 더 말해 주세요."],
    ["廣東話點講", "gwong2 dung1 waa2 dim2 gong2", "광둥어로 뭐라고 해요?", "how do you say it in Cantonese?", "phrase", "呢樣嘢廣東話點講？", "ni1 joeng6 je5 gwong2 dung1 waa2 dim2 gong2?", "이건 광둥어로 뭐라고 해요?"],
    ["我識少少廣東話", "ngo5 sik1 siu2 siu2 gwong2 dung1 waa2", "광둥어를 조금 할 줄 알아요", "I speak a little Cantonese", "phrase", "我識少少廣東話，講慢啲啦。", "ngo5 sik1 siu2 siu2 gwong2 dung1 waa2, gong2 maan6 di1 laa1.", "광둥어를 조금 할 줄 알아요, 천천히 말해 주세요."],
  ],

  // Unit 2 — 인사와 예의
  2: [
    ["唔使客氣", "m4 sai2 haak3 hei3", "천만에요, 별말씀을요 (감사 인사에 대한 대답)", "you're welcome", "phrase", "唔使客氣，小事啫。", "m4 sai2 haak3 hei3, siu2 si6 ze1.", "천만에요, 별거 아니에요."],
    ["唔該晒", "m4 goi1 saai3", "정말 고마워요 (唔該보다 더 강하게)", "thanks a lot", "phrase", "唔該晒你幫我。", "m4 goi1 saai3 nei5 bong1 ngo5.", "도와줘서 정말 고마워요."],
    ["你叫咩名", "nei5 giu3 me1 meng2", "이름이 뭐예요?", "what's your name?", "phrase", "你好，你叫咩名呀？", "nei5 hou2, nei5 giu3 me1 meng2 aa3?", "안녕하세요, 이름이 뭐예요?"],
    ["好高興認識你", "hou2 gou1 hing3 jing6 sik1 nei5", "만나서 반가워요", "nice to meet you", "phrase", "我叫敏俊，好高興認識你。", "ngo5 giu3 man5 zeon3, hou2 gou1 hing3 jing6 sik1 nei5.", "저는 민준이에요, 만나서 반가워요."],
    ["走先喇", "zau2 sin1 laa3", "먼저 갈게요 (자리를 뜰 때)", "I'm off now", "phrase", "夜喇，我走先喇。", "je6 laa3, ngo5 zau2 sin1 laa3.", "늦었네요, 저 먼저 갈게요."],
    ["慢慢行", "maan6 maan6 haang4", "조심히 가세요 (떠나는 사람에게)", "take care (to someone leaving)", "phrase", "再見，慢慢行呀。", "zoi3 gin3, maan6 maan6 haang4 aa3.", "안녕히 가세요, 조심히 가요."],
  ],

  // Unit 3 — 숫자·돈·시간
  3: [
    ["等陣先", "dang2 zan6 sin1", "잠깐만요 (조금만 기다려요)", "hold on a moment", "phrase", "等陣先，我搵吓銀包。", "dang2 zan6 sin1, ngo5 wan2 haa5 ngan4 baau1.", "잠깐만요, 지갑 좀 찾을게요."],
    ["而家幾點", "ji4 gaa1 gei2 dim2", "지금 몇 시예요?", "what time is it now?", "phrase", "唔該，而家幾點呀？", "m4 goi1, ji4 gaa1 gei2 dim2 aa3?", "저기요, 지금 몇 시예요?"],
    ["一陣見", "jat1 zan6 gin3", "이따 봐요", "see you in a bit", "phrase", "我去買嘢，一陣見。", "ngo5 heoi3 maai5 je5, jat1 zan6 gin3.", "물건 사러 갈게요, 이따 봐요."],
    ["要幾耐", "jiu3 gei2 noi6", "얼마나 걸려요?", "how long does it take?", "phrase", "去機場要幾耐？", "heoi3 gei1 coeng4 jiu3 gei2 noi6?", "공항까지 얼마나 걸려요?"],
    ["唔使找", "m4 sai2 zaau2", "거스름돈은 됐어요", "keep the change", "phrase", "一百蚊，唔使找喇。", "jat1 baak3 man1, m4 sai2 zaau2 laa3.", "100달러예요, 거스름돈은 됐어요."],
  ],

  // Unit 4 — 음식과 주문
  4: [
    ["唔該埋單", "m4 goi1 maai4 daan1", "계산해 주세요 (식당에서 손을 들고)", "the bill, please", "phrase", "食飽喇，唔該埋單！", "sik6 baau2 laa3, m4 goi1 maai4 daan1!", "잘 먹었어요, 계산해 주세요!"],
    ["幾位", "gei2 wai2", "몇 분이세요? (식당 직원이 묻는 말)", "how many people? (table for…)", "phrase", "歡迎光臨，幾位呀？", "fun1 jing4 gwong1 lam4, gei2 wai2 aa3?", "어서 오세요, 몇 분이세요?"],
    ["走冰", "zau2 bing1", "얼음 빼 주세요", "no ice", "phrase", "凍檸茶，走冰，唔該。", "dung3 ning2 caa4, zau2 bing1, m4 goi1.", "아이스 레몬티, 얼음 빼고 주세요."],
    ["少甜", "siu2 tim4", "덜 달게 해 주세요", "less sweet", "phrase", "奶茶少甜，唔該。", "naai5 caa4 siu2 tim4, m4 goi1.", "밀크티 덜 달게 해 주세요."],
    ["慢慢食", "maan6 maan6 sik6", "맛있게 드세요 (천천히 드세요)", "enjoy your meal", "phrase", "你哋慢慢食。", "nei5 dei6 maan6 maan6 sik6.", "맛있게 드세요."],
    ["飲杯", "jam2 bui1", "건배!", "cheers!", "phrase", "嚟，大家飲杯！", "lai4, daai6 gaa1 jam2 bui1!", "자, 다 같이 건배!"],
  ],

  // Unit 5 — 대중교통
  5: [
    ["唔該借借", "m4 goi1 ze3 ze3", "좀 지나갈게요 (붐비는 차 안에서)", "excuse me, let me through", "phrase", "唔該借借，我要落車。", "m4 goi1 ze3 ze3, ngo5 jiu3 lok6 ce1.", "좀 지나갈게요, 저 내려야 해요."],
    ["前面有落", "cin4 min6 jau5 lok6", "앞에서 내릴게요 (미니버스 기사에게 외치는 말)", "getting off just ahead (minibus)", "phrase", "司機，前面有落，唔該！", "si1 gei1, cin4 min6 jau5 lok6, m4 goi1!", "기사님, 앞에서 내릴게요!"],
    ["唔該去呢度", "m4 goi1 heoi3 ni1 dou6", "여기로 가 주세요 (택시에서 주소를 보여 주며)", "please take me here (showing an address)", "phrase", "唔該去呢度，我唔識講地址。", "m4 goi1 heoi3 ni1 dou6, ngo5 m4 sik1 gong2 dei6 zi2.", "여기로 가 주세요, 주소를 말할 줄 몰라서요."],
    ["搭錯車", "daap3 co3 ce1", "차를 잘못 탔어요", "took the wrong bus or train", "phrase", "弊喇，我搭錯車！", "bai6 laa3, ngo5 daap3 co3 ce1!", "큰일 났다, 차를 잘못 탔어요!"],
    ["坐過站", "co5 gwo3 zaam6", "내릴 역을 지나쳤어요", "missed my stop", "phrase", "我瞓著咗，坐過站。", "ngo5 fan3 zoek6 zo2, co5 gwo3 zaam6.", "잠들어서 내릴 역을 지나쳤어요."],
  ],

  // Unit 6 — 쇼핑
  6: [
    ["我想要呢個", "ngo5 soeng2 jiu3 ni1 go3", "이걸로 할게요", "I'd like this one", "phrase", "我想要呢個，紅色嘅。", "ngo5 soeng2 jiu3 ni1 go3, hung4 sik1 ge3.", "이걸로 할게요, 빨간색으로요."],
    ["平啲得唔得", "peng4 di1 dak1 m4 dak1", "좀 싸게 해 주실 수 있어요? (흥정할 때)", "can you make it cheaper?", "phrase", "老闆，平啲得唔得？", "lou5 baan2, peng4 di1 dak1 m4 dak1?", "사장님, 좀 싸게 안 될까요?"],
    ["我睇吓先", "ngo5 tai2 haa5 sin1", "그냥 좀 볼게요 (점원이 말을 걸 때)", "I'm just looking", "phrase", "唔使喇，我睇吓先。", "m4 sai2 laa3, ngo5 tai2 haa5 sin1.", "괜찮아요, 우선 좀 볼게요."],
    ["有冇大啲", "jau5 mou5 daai6 di1", "더 큰 거 있어요?", "do you have a bigger one?", "phrase", "呢件衫有冇大啲？", "ni1 gin6 saam1 jau5 mou5 daai6 di1?", "이 옷 더 큰 거 있어요?"],
    ["碌卡得唔得", "luk1 kaat1 dak1 m4 dak1", "카드 돼요?", "can I pay by card?", "phrase", "我冇現金，碌卡得唔得？", "ngo5 mou5 jin6 gam1, luk1 kaat1 dak1 m4 dak1?", "현금이 없는데, 카드 돼요?"],
  ],

  // Unit 7 — 사람과 가족
  7: [
    ["你幾多歲", "nei5 gei2 do1 seoi3", "몇 살이에요?", "how old are you?", "phrase", "你個仔今年幾多歲？", "nei5 go3 zai2 gam1 nin4 gei2 do1 seoi3?", "아드님은 올해 몇 살이에요?"],
    ["你做咩工", "nei5 zou6 me1 gung1", "무슨 일 하세요?", "what do you do for work?", "phrase", "你做咩工㗎？", "nei5 zou6 me1 gung1 gaa3?", "무슨 일 하세요?"],
    ["你係邊度人", "nei5 hai6 bin1 dou6 jan4", "어디 사람이에요?", "where are you from?", "phrase", "你係邊度人呀？我係韓國人。", "nei5 hai6 bin1 dou6 jan4 aa3? ngo5 hai6 hon4 gwok3 jan4.", "어디 사람이에요? 저는 한국 사람이에요."],
    ["有冇兄弟姊妹", "jau5 mou5 hing1 dai6 zi2 mui6", "형제자매 있어요?", "do you have siblings?", "phrase", "你有冇兄弟姊妹呀？", "nei5 jau5 mou5 hing1 dai6 zi2 mui6 aa3?", "형제자매 있어요?"],
    ["我結咗婚", "ngo5 git3 zo2 fan1", "저는 결혼했어요", "I'm married", "phrase", "我結咗婚，有兩個仔。", "ngo5 git3 zo2 fan1, jau5 loeng5 go3 zai2.", "저는 결혼했고, 아들이 둘 있어요."],
  ],

  // Unit 8 — 일상 동사
  8: [
    ["搞掂", "gaau2 dim6", "다 됐어요, 해결했어요", "done, sorted", "phrase", "功課搞掂喇！", "gung1 fo3 gaau2 dim6 laa3!", "숙제 다 했어요!"],
    ["唔記得咗", "m4 gei3 dak1 zo2", "깜빡했어요", "I forgot", "phrase", "對唔住，我唔記得咗。", "deoi3 m4 zyu6, ngo5 m4 gei3 dak1 zo2.", "죄송해요, 깜빡했어요."],
    ["等我嚟", "dang2 ngo5 lai4", "제가 할게요", "let me do it", "phrase", "唔使，等我嚟。", "m4 sai2, dang2 ngo5 lai4.", "괜찮아요, 제가 할게요."],
    ["一齊去", "jat1 cai4 heoi3", "같이 가요", "let's go together", "phrase", "我哋一齊去食飯啦。", "ngo5 dei6 jat1 cai4 heoi3 sik6 faan6 laa1.", "우리 같이 밥 먹으러 가요."],
    ["我返嚟喇", "ngo5 faan1 lai4 laa3", "다녀왔습니다 (집에 돌아왔을 때)", "I'm home", "phrase", "媽媽，我返嚟喇！", "maa4 maa1, ngo5 faan1 lai4 laa3!", "엄마, 다녀왔어요!"],
  ],

  // Unit 9 — 형용사
  9: [
    ["好嘢", "hou2 je5", "아싸! 좋았어!", "yay! great!", "phrase", "好嘢！今日放假！", "hou2 je5! gam1 jat6 fong3 gaa3!", "아싸! 오늘 쉬는 날이다!"],
    ["好正", "hou2 zeng3", "끝내줘요, 최고예요", "awesome", "phrase", "呢度啲嘢食好正！", "ni1 dou6 di1 je5 sik6 hou2 zeng3!", "여기 음식 끝내줘요!"],
    ["麻麻哋", "maa4 maa2 dei2", "그저 그래요", "so-so", "phrase", "味道麻麻哋。", "mei6 dou6 maa4 maa2 dei2.", "맛은 그저 그래요.", 1],
    ["唔錯", "m4 co3", "괜찮네요, 나쁘지 않아요", "not bad", "phrase", "呢間餐廳唔錯。", "ni1 gaan1 caan1 teng1 m4 co3.", "이 식당 괜찮네요."],
    ["太貴喇", "taai3 gwai3 laa3", "너무 비싸요", "too expensive", "phrase", "三百蚊？太貴喇！", "saam1 baak3 man1? taai3 gwai3 laa3!", "300달러요? 너무 비싸요!"],
  ],

  // Unit 10 — 장소와 길 찾기
  10: [
    ["我哋去邊度", "ngo5 dei6 heoi3 bin1 dou6", "우리 어디 가요?", "where are we going?", "phrase", "今晚我哋去邊度食飯？", "gam1 maan5 ngo5 dei6 heoi3 bin1 dou6 sik6 faan6?", "오늘 저녁 우리 어디서 밥 먹어요?"],
    ["點樣去", "dim2 joeng2 heoi3", "어떻게 가요?", "how do I get there?", "phrase", "請問去地鐵站點樣去？", "ceng2 man6 heoi3 dei6 tit3 zaam6 dim2 joeng2 heoi3?", "실례지만 지하철역은 어떻게 가요?"],
    ["一直行", "jat1 zik6 haang4", "쭉 가세요", "go straight on", "phrase", "一直行，就到喇。", "jat1 zik6 haang4, zau6 dou3 laa3.", "쭉 가면 바로 나와요."],
    ["轉左", "zyun3 zo2", "왼쪽으로 도세요", "turn left", "phrase", "過咗馬路就轉左。", "gwo3 zo2 maa5 lou6 zau6 zyun3 zo2.", "길을 건너서 왼쪽으로 도세요."],
    ["轉右", "zyun3 jau6", "오른쪽으로 도세요", "turn right", "phrase", "喺銀行嗰度轉右。", "hai2 ngan4 hong4 go2 dou6 zyun3 jau6.", "은행 있는 데서 오른쪽으로 도세요."],
  ],

  // Unit 11 — 건강과 약국
  11: [
    ["小心啲", "siu2 sam1 di1", "조심하세요", "be careful", "phrase", "落雨，小心啲呀。", "lok6 jyu5, siu2 sam1 di1 aa3.", "비 와요, 조심하세요."],
    ["早啲休息", "zou2 di1 jau1 sik1", "일찍 쉬세요", "get some rest early", "phrase", "你病咗，早啲休息啦。", "nei5 beng6 zo2, zou2 di1 jau1 sik1 laa1.", "아프니까 일찍 쉬어요."],
    ["你有冇事", "nei5 jau5 mou5 si6", "괜찮아요? (다쳤거나 아파 보일 때)", "are you OK?", "phrase", "你有冇事呀？要唔要睇醫生？", "nei5 jau5 mou5 si6 aa3? jiu3 m4 jiu3 tai2 ji1 sang1?", "괜찮아요? 병원에 가야 해요?"],
    ["救命", "gau3 meng6", "살려 주세요! (위급할 때)", "help!", "phrase", "救命呀！有人暈咗！", "gau3 meng6 aa3! jau5 jan4 wan4 zo2!", "살려 주세요! 누가 쓰러졌어요!"],
    ["一日三次", "jat1 jat6 saam1 ci3", "하루 세 번 (약 먹는 횟수)", "three times a day", "phrase", "一日三次，飯後食。", "jat1 jat6 saam1 ci3, faan6 hau6 sik6.", "하루 세 번, 식후에 드세요."],
  ],

  // Unit 12 — 광동어다운 말투
  12: [
    ["唔係掛", "m4 hai6 gwaa3", "설마! 말도 안 돼", "no way! you're kidding", "phrase", "佢辭咗職？唔係掛！", "keoi5 ci4 zo2 zik1? m4 hai6 gwaa3!", "그 사람이 회사를 그만뒀다고요? 설마!", 1],
    ["冇所謂", "mou5 so2 wai6", "상관없어요, 아무거나 좋아요", "I don't mind, whatever", "phrase", "食咩都冇所謂。", "sik6 me1 dou1 mou5 so2 wai6.", "뭘 먹든 상관없어요."],
    ["頂唔順", "ding2 m4 seon6", "못 참겠어요, 못 견디겠어요", "I can't stand it", "phrase", "好熱呀，頂唔順喇！", "hou2 jit6 aa3, ding2 m4 seon6 laa3!", "너무 더워요, 못 참겠어요!"],
    ["慢慢嚟", "maan6 maan6 lai4", "천천히 하세요, 서두르지 마요", "take your time", "phrase", "唔使急，慢慢嚟。", "m4 sai2 gap1, maan6 maan6 lai4.", "급할 거 없어요, 천천히 하세요."],
    ["一於咁話", "jat1 jyu1 gam2 waa6", "그렇게 하기로 해요, 콜!", "it's a deal", "phrase", "聽日七點，一於咁話！", "ting1 jat6 cat1 dim2, jat1 jyu1 gam2 waa6!", "내일 일곱 시, 그렇게 해요!", 1],
    ["係咁先", "hai6 gam2 sin1", "그럼 이만 (전화를 끊거나 헤어질 때)", "that's all for now, bye", "phrase", "好，係咁先喇。", "hou2, hai6 gam2 sin1 laa3.", "네, 그럼 이만 끊을게요."],
  ],
};
