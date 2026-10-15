// Korean UI strings for the Cantonese app (learner is a Korean speaker). Same keys as ui/en.js,
// plus a few Cantonese-only ones. Copy written by Claude; please have the learner skim it.
const POS = { n: "명사", v: "동사", adj: "형용사", adv: "부사", pron: "대명사", num: "수사", phrase: "표현", cl: "양사", prt: "어기조사", prep: "전치사", conj: "접속사", q: "의문사" };
const THEME = { auto: "자동", light: "밝게", dark: "어둡게" };

export const ui = {
  tabs: { home: "홈", learn: "학습", review: "복습", browse: "찾아보기", settings: "설정" },
  now: "지금", minutes: (n) => `${n}분`, hours: (n) => `${n}시간`, days: (n) => `${n}일`,
  listen: "듣기", listenBtn: "🔊 듣기", edit: "수정", resetProgress: "진도 초기화", tapToFlip: "카드를 눌러서 뜻을 확인하세요",
  dueNow: "복습할 것", ofSeen: (n) => `/ ${n}개 학습`, unit: "단원", wordOfHour: "지금 이 시간의 단어", noItems: "항목이 없어요",
  changesAt: (hh) => `${hh}:00에 바뀌어요`, currentUnit: "현재 단원", unitN: (n) => `${n}단원`,
  introduced: (a, b, g) => `${b}개 중 ${a}개 학습 · 문법 ${g}개`,
  learnNew: "새로 배우기", review: "복습",
  hourlyTip: `<h2>매시간 알림 (아이폰)</h2>
    <div class="card tip">
      아이폰은 웹앱이 스스로 알람을 울리게 해 주지 않고, 단축어(Shortcuts)에는 "매시간 반복"도 없어요. 그래서 원하는 시각마다 <b>매일</b> 반복 자동화를 하나씩 만들어야 해요 (예: 9:00, 10:00 … 21:00):
      <ol>
        <li>단축어 → 자동화 → + → <b>시간</b>(Time of Day) → <b>매일</b> 반복 → <b>즉시 실행</b>을 선택해요.</li>
        <li>동작: <b>앱 열기</b> → 홈 화면에 추가한 이 앱 (목록에 보이면).</li>
        <li>목록에 없으면 <b>URL 열기</b>에 이 페이지 주소를 넣어요. 이 경우 사파리가 열리고, 사파리는 진도를 따로 저장해서 앱과 단어가 다를 수 있어요.</li>
      </ol>
      <p class="small muted">(메뉴 이름은 iOS 버전에 따라 조금 다를 수 있어요.)</p>
    `,
  unitDone: "단원 끝!", unitDoneHint: "이 단원의 모든 항목을 한 번씩 봤어요. 위에서 다음 단원을 고르거나 복습하러 가세요.",
  jumpedAhead: "앞 단원이 아직 안 끝났어요. 건너뛰어도 괜찮아요.",
  leftInUnit: (n) => `이 단원에 ${n}개 남았어요`, gotIt: "알겠어요", alreadyKnew: "이미 알아요", reviewIn: (x) => `${x} 뒤 복습`,
  showMeaning: "뜻 보기", nothingDue: "복습할 게 없어요", nextReview: (x) => `다음 복습은 ${x} 뒤예요.`, learnFirst: "먼저 새 단어를 배워 보세요.",
  nDue: (n) => `복습 ${n}개`, again: "다시", hard: "어려움", good: "좋음", easy: "쉬움", showAnswer: "정답 보기",
  searchPlaceholder: "한글 · Jyutping · 中文 · 뜻으로 검색", all: "전체", words: "단어", grammar: "문법", add: "+ 추가", anyLevel: "모든 단계",
  nItems: (n) => `${n}개`, statusNew: "새 항목", statusDue: "복습 차례", statusIn: (x) => `${x} 뒤`, showingFirst: "처음 200개만 보여요. 검색어를 좁혀 주세요.",
  studyTrack: "학습 단원", data: "데이터", exportBackup: "백업 내보내기", importBackup: "백업 불러오기",
  theme: (x) => `화면: ${THEME[x] ?? x}`, resetAll: "진도 모두 초기화",
  progressNote: "진도는 이 기기의 브라우저에만 저장돼요. 사파리 데이터를 지우거나 폰을 바꾸기 전에 백업을 내보내세요.",
  packLine: (id, w, g, c) => `팩: ${id} · 단어 ${w}개 · 문법 ${g}개`,
  confirmWipe: "이 기기의 진도를 모두 지울까요?",
  confirmImport: "백업 파일로 이 기기의 진도를 덮어쓸까요?",
  noSpeech: "이 브라우저에는 음성 기능이 없어요.",
  noVoice: "광둥어(홍콩) 음성이 설치되어 있지 않아요. 표준중국어 음성으로 읽으면 소리가 틀려서 읽지 않았어요. 설정 → 손쉬운 사용 → 말하기 콘텐츠 → 음성 → 중국어 → 광둥어에서 내려받아 주세요. (메뉴 이름은 iOS 버전에 따라 조금 달라요.)",
  // Cantonese-only strings
  posName: (p) => POS[p] ?? p,
  cantoneseOnly: "광동어에만 있는 글자",
  loanword: "음역 외래어 — 글자는 소리만 빌렸어요",
  toneTitle: "성조 읽는 법",
  toneHint: "한글 위의 숫자와 색이 성조예요. 같은 '시'도 성조가 다르면 다른 단어예요. 눌러서 들어 보세요.",
  directionTitle: "복습 방향",
  dirSound: "소리 → 뜻",
  dirMeaning: "뜻 → 소리",
  dirHint: "뜻 → 소리는 말하기 연습이에요. 한국어 뜻을 보고 광동어로 소리 내어 말해 본 다음 카드를 뒤집어요. 학습 탭은 항상 소리부터 보여 줘요.",
  sayIt: "광동어로 어떻게 말할까요?",
  bridgeTitle: "한국 한자음과 연결",
  grammarLabel: "문법",
  toneKey: ["1성 · 높고 평평", "2성 · 올라감", "3성 · 중간 평평", "4성 · 낮게 내려감", "5성 · 낮게 올라감", "6성 · 낮고 평평"],
};
