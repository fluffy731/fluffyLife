// Grammar points. Rows: [form, tier, unit, en, zh, note, [[ko, zh, en], ...]]
// Ids are assigned by position within each tier.
const ROWS = [
// ---------- Intermediate (TOPIK 3–4) ----------
["-(으)ㄹ 뿐만 아니라","int",1,"not only … but also","不僅…而且…","Attaches to verb/adjective stems; N뿐만 아니라 for nouns. Near-identical to 不僅…還.",[
 ["물가가 오를 뿐만 아니라 월급도 안 오른다.","不僅物價上漲，薪水也不漲。","Not only are prices rising, wages aren't either."],
 ["그는 똑똑할 뿐만 아니라 성실하다.","他不僅聰明，而且踏實。","He is not only smart but also diligent."]]],
["-에 따라(서)","int",1,"according to, depending on","根據、依照","N에 따라. Also -에 따르면 'according to (source)'.",[
 ["정책에 따라 결과가 달라진다.","根據政策，結果會不同。","Results differ depending on the policy."],
 ["보고서에 따르면 실업률이 늘었다.","根據報告，失業率上升了。","According to the report, unemployment rose."]]],
["-(으)로 인해(서)","int",1,"due to, because of","由於、因為","Formal, written register. N(으)로 인해. Cause of a usually negative result.",[
 ["고령화로 인해 복지 비용이 늘었다.","由於高齡化，福利費用增加了。","Welfare costs rose due to ageing."]]],
["-기 위해(서)","int",2,"in order to","為了","V-기 위해; N을/를 위해. Purpose. Compare -(으)려고 (spoken).",[
 ["취업하기 위해 자격증을 땄다.","為了就業考了證照。","I got a licence in order to get a job."],
 ["가족을 위해 열심히 일한다.","為了家人努力工作。","I work hard for my family."]]],
["-는 바람에","int",2,"because of (unexpected, negative)","因為…（意外、負面）","Only with verbs, past result. Speaker wasn't in control.",[
 ["야근하는 바람에 약속을 못 지켰다.","因為加班，沒能守約。","I couldn't keep the appointment because of overtime."]]],
["-(으)ㄴ/는 반면(에)","int",2,"whereas, on the other hand","相反地、而","Contrast between two facts.",[
 ["월급은 적은 반면 일은 많다.","薪水少，相反地工作卻很多。","The pay is low, whereas the work is heavy."]]],
["-(으)ㄹ수록","int",3,"the more … the more","越…越…","Often -(으)면 -(으)ㄹ수록 for emphasis.",[
 ["복습할수록 실력이 는다.","越複習實力越進步。","The more you revise, the more your skill grows."],
 ["노력하면 할수록 결과가 좋아진다.","越努力結果越好。","The harder you try, the better the result."]]],
["-(으)ㄹ 만하다","int",3,"worth doing; can be done","值得…、可以…","V-(으)ㄹ 만하다. Also 'about the right level to'.",[
 ["이 책은 읽을 만하다.","這本書值得一讀。","This book is worth reading."]]],
["-기 마련이다","int",3,"bound to, naturally","必然會…、難免","General truth; what tends to happen.",[
 ["노력하면 성공하기 마련이다.","努力的話必然會成功。","If you work hard, success is bound to follow."]]],
["-(으)ㄹ 정도로","int",4,"to the extent that","到…的程度","Degree. Also -(으)ㄹ 정도이다 at sentence end.",[
 ["걷기 힘들 정도로 피로가 쌓였다.","疲勞累積到走路都困難的程度。","Fatigue built up to the point I could barely walk."]]],
["-(으)ㄹ 수밖에 없다","int",4,"have no choice but to","只能、不得不","N밖에 + negative pattern extended to verbs.",[
 ["증상이 심해서 수술할 수밖에 없었다.","症狀嚴重，只能手術。","The symptoms were severe so surgery was the only option."]]],
["-도록","int",4,"so that; until; (instruct) to","以便、直到、讓","Three uses: purpose, extent/time, and reported instruction (-도록 하다).",[
 ["면역력이 떨어지지 않도록 잘 쉬세요.","為了不讓免疫力下降，請好好休息。","Rest well so your immunity doesn't drop."],
 ["밤새도록 공부했다.","讀書讀了一整夜。","I studied all night long."]]],
["-(으)ㄴ/는 척하다","int",5,"to pretend to","假裝","Also -(으)ㄴ/는 체하다.",[
 ["괜찮은 척했지만 서운했다.","雖然裝作沒事，但很失落。","I pretended to be fine but felt let down."]]],
["-아/어서 그런지","int",5,"maybe because","或許是因為","Speaker guesses a cause.",[
 ["불안해서 그런지 잠이 안 온다.","或許是因為不安，睡不著。","Maybe because I'm anxious, I can't sleep."]]],
["-(으)ㄹ까 봐(서)","int",5,"for fear that, worried that","怕…、擔心…","Followed by a precaution.",[
 ["실망할까 봐 말을 못 했다.","怕他失望所以沒說。","I didn't say it for fear they'd be disappointed."]]],
["-(으)ㄴ/는 데다(가)","int",6,"in addition to, on top of","再加上","Adds a second fact in the same direction.",[
 ["미세먼지가 심한 데다가 바람까지 분다.","細懸浮微粒很嚴重，再加上還颳風。","The fine dust is bad and on top of that it's windy."]]],
["-(으)므로","int",6,"because, therefore (formal)","因為、由於（書面）","Written/formal reason. Not used with commands.",[
 ["자원이 한정되어 있으므로 아껴 써야 한다.","由於資源有限，必須節約使用。","Because resources are limited, we must use them sparingly."]]],
["-게 되다","int",6,"to come to, end up","變成、變得","Change of state not by speaker's will.",[
 ["환경 문제에 관심을 갖게 되었다.","變得對環境問題感興趣了。","I came to take an interest in environmental issues."]]],
["-(으)ㄴ/는지 알다/모르다","int",7,"know whether/what","知道/不知道…是否","Indirect question.",[
 ["앱을 어떻게 설치하는지 모르겠다.","不知道該怎麼安裝應用程式。","I don't know how to install the app."]]],
["-다 보니(까)","int",7,"as a result of doing (realised)","做著做著就…","Discovery through repeated action. Compare -다 보면 (future).",[
 ["매일 검색하다 보니 익숙해졌다.","每天搜尋，不知不覺就熟悉了。","Having searched every day, I got used to it."]]],
["-다 보면","int",7,"if you keep doing","只要持續做…就會","Hypothetical result of continued action.",[
 ["꾸준히 쓰다 보면 편리함을 느낄 것이다.","持續使用的話，就會感受到方便。","If you keep using it, you'll find it convenient."]]],
["-곤 하다","int",8,"used to, tend to","常常、經常會","Habitual, often past -곤 했다.",[
 ["명절마다 한복을 입곤 했다.","每逢節日常會穿韓服。","We used to wear hanbok every holiday."]]],
["-(으)ㄴ/는 셈이다","int",8,"it amounts to, practically","算是、等於","Approximate evaluation.",[
 ["이 정도면 전통을 잘 지킨 셈이다.","這樣算是守住傳統了。","At this level, we've practically kept the tradition."]]],
["-(이)야말로","int",8,"indeed, precisely (emphasis)","才是、正是","N(이)야말로. Emphasises the noun as the real one.",[
 ["한복이야말로 한국의 상징이다.","韓服才是韓國的象徵。","Hanbok is the very symbol of Korea."]]],
["-(으)ㄹ 겸","int",9,"doing A and also B","順便、兼","Two purposes at once. Also -(으)ㄹ 겸 해서.",[
 ["운동도 할 겸 걸어서 출근한다.","順便運動，走路上班。","I walk to work, partly for exercise."]]],
["-아/어 놓다","int",9,"do and leave (state)","…好放著（維持狀態）","Result kept; compare -아/어 두다.",[
 ["이사 전에 짐을 싸 놓았다.","搬家前先把行李打包好了。","I packed before the move."]]],
["-(으)ㄴ 채(로)","int",9,"while in the state of","…著（狀態下）","Unexpected or unchanged state.",[
 ["불을 켠 채로 잠들었다.","開著燈睡著了。","I fell asleep with the light on."]]],
["-더라도","int",10,"even if","即使","Stronger than -아/어도; hypothetical.",[
 ["오해가 있더라도 대화로 풀자.","即使有誤會，也用對話解開吧。","Even if there's a misunderstanding, let's talk it out."]]],
["-(으)ㄹ 테니(까)","int",10,"since (I) will; (it) will probably","我會…所以；大概會…","Speaker's intention or supposition as reason.",[
 ["내가 연락할 테니 걱정하지 마.","我會聯絡的，別擔心。","I'll be in touch, so don't worry."]]],
["-느니 차라리","int",10,"rather than A, B","與其…不如","Choose the lesser evil.",[
 ["싸우느니 차라리 양보하겠다.","與其吵架不如讓步。","I'd rather give in than fight."]]],
["-자마자","int",11,"as soon as","一…就","V-자마자. No tense on the verb.",[
 ["도착하자마자 전화했다.","一到就打了電話。","I called as soon as I arrived."]]],
["-(으)ㄹ 뻔하다","int",11,"almost (nearly happened)","差點…","Always past: -(으)ㄹ 뻔했다.",[
 ["환승역을 놓칠 뻔했다.","差點錯過轉乘站。","I nearly missed the transfer station."]]],
["-(으)ㄴ/는 김에","int",11,"while (you're) at it","順便、趁…的機會","Taking advantage of an occasion.",[
 ["부산에 간 김에 바다도 봤다.","趁去釜山的機會也看了海。","While I was in Busan I saw the sea too."]]],
["-에 의해(서)","int",12,"by (agent, passive)","被、由","Formal passive agent.",[
 ["법안이 국회에 의해 통과되었다.","法案由國會通過了。","The bill was passed by the Assembly."]]],
["-(으)ㄴ/는 한","int",12,"as long as","只要…就","Condition that must hold.",[
 ["법을 지키는 한 문제없다.","只要守法就沒問題。","As long as you obey the law, there's no problem."]]],
["-(으)ㄹ 리가 없다","int",12,"there's no way that","不可能","Strong disbelief.",[
 ["증거 없이 처벌할 리가 없다.","不可能沒有證據就處罰。","There's no way they'd punish without evidence."]]],
["-(으)ㄴ/는 대로","int",13,"as, according to; as soon as","按照；一…就","V-는 대로 'as you do'; V-는 대로 after a future verb 'as soon as'.",[
 ["설명한 대로 해결했다.","按照說明解決了。","I solved it as explained."],
 ["결정하는 대로 알려 줄게.","一決定就告訴你。","I'll tell you as soon as I decide."]]],
["-(으)ㄴ/는 데 반해","int",13,"in contrast to","與…相反","Formal contrast; compare -(으)ㄴ/는 반면.",[
 ["수입이 증가한 데 반해 지출은 감소했다.","收入增加，相反地支出減少了。","In contrast to rising income, spending fell."]]],
["-(으)ㄴ/는 만큼","int",13,"as much as; since","像…一樣；既然","Degree or reason.",[
 ["노력한 만큼 성과가 있었다.","付出多少努力就有多少成果。","The results matched the effort."]]],
["-던","int",14,"that (one) used to / was doing","過去曾…的","Retrospective modifier; -았/었던 for completed.",[
 ["자주 가던 식당이 문을 닫았다.","以前常去的餐廳關門了。","The restaurant I used to go to has closed."]]],
["-더니","int",14,"(I observed) and then","（看到）…然後就","Past observation leading to a result; subject usually not 'I'.",[
 ["그렇게 미루더니 결국 못 끝냈다.","那樣拖拖拉拉，最後沒完成。","He kept putting it off, and in the end didn't finish."]]],
["-았/었더니","int",14,"when I did, (then)","我做了…之後，結果","Subject is 'I'; result discovered.",[
 ["살펴봤더니 문제가 많았다.","仔細一看，發現問題很多。","When I looked closely, there were many problems."]]],
["-(이)라도","int",15,"even, at least","哪怕、至少","Second-best option.",[
 ["차라리 물이라도 마셔.","至少喝點水吧。","At least drink some water."]]],
["-기는커녕","int",15,"far from, let alone","別說…了，連…都","Negation of a lesser expectation.",[
 ["칭찬받기는커녕 오히려 혼났다.","別說受到稱讚了，反而挨罵。","Far from being praised, I got scolded."]]],
["-(으)ㄴ/는 모양이다","int",15,"it seems that (from evidence)","看樣子、似乎","Inference from what the speaker observes; compare -(으)ㄴ/는 것 같다 (any guess).",[
 ["설마 벌써 떠난 모양이다.","看樣子他已經離開了。","It seems he has already left."],
 ["아마 바쁜 모양이에요.","看樣子大概很忙。","It looks like they're busy."]]],
// ---------- Advanced (TOPIK 5–6) ----------
["-(으)ㄹ 따름이다","adv",1,"merely, simply","只是、僅僅","Formal; speaker's limited stance.",[
 ["제 의견을 말씀드릴 따름입니다.","我只是陳述我的意見。","I am merely stating my opinion."]]],
["-(으)ㄴ/는 바","adv",1,"as (has been stated)","正如…所","Formal, written: 앞서 말한 바와 같이.",[
 ["앞서 언급한 바와 같이 개념이 중요하다.","正如前述，概念很重要。","As mentioned earlier, the concept matters."]]],
["-기에","adv",1,"because (formal reason)","因為（書面）","Written reason; also -기에 is 'for doing' in -기에 충분하다.",[
 ["근거가 부족하기에 결론을 보류했다.","因為根據不足，結論保留。","Because the evidence was lacking, the conclusion was withheld."]]],
["-(으)ㅁ에 따라","adv",2,"as, in step with","隨著","Nominalised cause; formal.",[
 ["금리가 오름에 따라 투자가 줄었다.","隨著利率上升，投資減少了。","As rates rose, investment fell."]]],
["-(으)ㄹ뿐더러","adv",2,"not only … but also (formal)","不僅…還","Formal variant of -(으)ㄹ 뿐만 아니라.",[
 ["손실이 클뿐더러 신뢰도 잃었다.","不僅損失大，還失去了信賴。","Not only was the loss large, trust was lost too."]]],
["-(으)ㄴ/는 가운데","adv",2,"amid, while","在…之中","Background situation, news style.",[
 ["불황이 계속되는 가운데 수출은 늘었다.","在不景氣持續的情況下，出口卻增加了。","Amid the ongoing recession, exports rose."]]],
["-(으)ㄴ/는 데(에) 있다","adv",3,"lies in","在於","Locates the point or cause.",[
 ["문제는 협상 태도를 바꾸지 않는 데 있다.","問題在於不改變談判態度。","The problem lies in not changing the negotiating attitude."]]],
["-(으)ㄹ 지경이다","adv",3,"to the point of","到了…的地步","Extreme state, usually negative.",[
 ["긴장이 전쟁 직전일 지경이다.","緊張到了戰爭邊緣的地步。","Tensions are at the brink of war."]]],
["-(으)로 말미암아","adv",3,"owing to (literary)","由於（文言）","Literary cause; compare -(으)로 인해.",[
 ["분쟁으로 말미암아 난민이 발생했다.","由於紛爭，產生了難民。","Refugees arose owing to the dispute."]]],
["-(으)ㄴ/는 이상","adv",4,"now that, since","既然","Given the fact; follows with obligation.",[
 ["가설을 세운 이상 검증해야 한다.","既然建立了假說，就必須驗證。","Now that we've set a hypothesis, we must test it."]]],
["-(으)ㅁ으로써","adv",4,"by means of","藉由","Means; nominalised verb.",[
 ["변수를 통제함으로써 오차를 줄였다.","藉由控制變數減少了誤差。","By controlling variables we reduced error."]]],
["-(으)ㄹ 법하다","adv",4,"likely, plausible","有可能、說得通","Reasonable expectation.",[
 ["그럴 법한 가설이다.","是個說得通的假說。","It's a plausible hypothesis."]]],
["-(으)ㄴ/는 양","adv",5,"as if","好像…似的","Literary 'as if'; also -(으)ㄴ/는 듯이.",[
 ["아무것도 모르는 양 행동했다.","好像什麼都不知道似的行動。","He acted as if he knew nothing."]]],
["-(으)ㄹ 바에야","adv",5,"if it comes to that, would rather","與其…還不如","Rejects option A for B.",[
 ["편견에 사로잡힐 바에야 침묵하겠다.","與其被偏見束縛，不如沉默。","Rather than be captured by prejudice, I'd stay silent."]]],
["-기 나름이다","adv",5,"depends on how","取決於怎麼…","Outcome depends on manner.",[
 ["좌절도 생각하기 나름이다.","挫折也取決於怎麼想。","Even setbacks depend on how you see them."]]],
["-(으)ㄴ/는 한편","adv",6,"while, at the same time","一方面…另一方面","Two parallel actions, formal.",[
 ["규제를 완화하는 한편 감독을 강화했다.","一方面放寬規制，另一方面強化監督。","While easing regulation, they tightened oversight."]]],
["-에 즈음하여","adv",6,"on the occasion of","值此…之際","Very formal, speeches.",[
 ["창립 10주년에 즈음하여 감사드립니다.","值此創立十週年之際，謹致謝忱。","On the occasion of our 10th anniversary, we thank you."]]],
["-(으)ㄹ 요량으로","adv",6,"with the intention of","打算…","Intention, slightly literary.",[
 ["직접 해결할 요량으로 나섰다.","打算親自解決而出面。","He stepped in intending to solve it himself."]]],
["-(으)ㄴ/는 듯이","adv",7,"as if, like","彷彿","Simile. Also -(으)ㄴ/는 듯하다 'seems'.",[
 ["비가 쏟아지는 듯이 눈물이 흘렀다.","眼淚如雨般流下。","Tears flowed as if rain were pouring."]]],
["-(으)ㄹ망정","adv",7,"even though (concessive)","即使…也","Concession, often with 'but'.",[
 ["가난할망정 양심은 팔지 않는다.","即使貧窮，也不出賣良心。","Though poor, I won't sell my conscience."]]],
["-건마는/-건만","adv",7,"although, and yet","雖然…卻","Literary contrast.",[
 ["노력했건만 결과는 좋지 않았다.","雖然努力了，結果卻不好。","I tried, and yet the result was poor."]]],
["-(으)ㄹ지언정","adv",8,"even if, though (strong)","即使…也絕不","Strong concession with refusal.",[
 ["굶을지언정 부정은 안 한다.","即使挨餓也不做壞事。","Even if I starve, I won't do wrong."]]],
["-(으)ㄴ/는 탓에","adv",8,"because of (blame)","都怪、由於（負面）","Negative cause with blame.",[
 ["편향된 보도 탓에 여론이 왜곡됐다.","由於報導偏頗，輿論被扭曲了。","Public opinion was distorted because of biased coverage."]]],
["-(으)ㄹ 턱이 없다","adv",8,"no way, no reason that","沒道理會…","Colloquial strong disbelief.",[
 ["그가 그런 말을 할 턱이 없다.","他沒道理會說那種話。","There's no way he'd say that."]]],
["-(으)ㄴ들","adv",9,"even if (one did)","即使…又如何","Rhetorical concession.",[
 ["후회한들 무슨 소용인가.","即使後悔又有什麼用。","What use is it, even if you regret?"]]],
["-(으)랴","adv",9,"could it be? (rhetorical)","豈會…？","Literary rhetorical question.",[
 ["어찌 잊으랴.","豈能忘記。","How could I forget?"]]],
["-기 그지없다","adv",9,"extremely, beyond words","…之極","Formal intensifier.",[
 ["감사하기 그지없다.","感激之至。","I am grateful beyond words."]]],
["-(으)ㄴ/는 마당에","adv",10,"at a point when, given that","在…的情況下","Situation already reached.",[
 ["다 끝난 마당에 굳이 따질 필요 없다.","都結束了，沒必要再計較。","Now that it's over, there's no need to argue."]]],
["-(으)ㄹ 나위 없다","adv",10,"needless to say, could not be more","無庸置疑、再…不過","Set phrase 더할 나위 없이.",[
 ["더할 나위 없이 좋았다.","好得不能再好。","It couldn't have been better."]]],
["-(으)되","adv",10,"but, provided that (formal)","但、惟","Formal condition or contrast.",[
 ["참여하되 책임은 각자 진다.","可參與，但責任各自負擔。","Participate, but each bears their own responsibility."]]],
// ---------- Beginner (TOPIK 1–2) ----------
["-(으)ㄹ 거예요","beg",1,"will; probably","會…、大概","Future / guess. 비가 올 거예요.",[
 ["내년에 한국에 갈 거예요.","明年會去韓國。","I'll go to Korea next year."]]],
["-(으)ㄴ 지 (시간) 되다","beg",1,"it has been (time) since","自從…已經（時間）","Elapsed time.",[
 ["한국어를 배운 지 일 년 됐어요.","學韓語已經一年了。","It's been a year since I started Korean."]]],
["-(으)로 가다/오다","beg",2,"go/come to (direction)","往…去/來","Direction particle; -에 marks destination.",[
 ["이쪽으로 오세요.","請往這邊來。","Come this way."]]],
["-에서 -까지","beg",2,"from … to (place)","從…到…","Time uses -부터 -까지.",[
 ["집에서 학교까지 멀어요.","從家到學校很遠。","It's far from home to school."]]],
["-(이)세요 / -(으)세요","beg",3,"honorific ending / polite request","尊敬語尾/請…","Subject honorific and polite imperative.",[
 ["선생님은 한국 분이세요.","老師是韓國人。","The teacher is Korean."],
 ["여기 앉으세요.","請坐這裡。","Please sit here."]]],
["-보다 (더)","beg",3,"than (comparison)","比","N보다 더.",[
 ["동생이 저보다 키가 커요.","弟弟比我高。","My younger brother is taller than me."]]],
["-고 싶다","beg",4,"want to","想…","V-고 싶어요; 3rd person -고 싶어하다.",[
 ["한국 요리를 배우고 싶어요.","想學韓國料理。","I want to learn Korean cooking."]]],
["-아/어 주다","beg",4,"do for someone","幫…做","Benefactive; -아/어 주세요 request.",[
 ["천천히 설명해 주세요.","請慢慢說明。","Please explain slowly."]]],
["-지만","beg",5,"but","但是","Contrast connector.",[
 ["복잡하지만 재미있어요.","雖然複雜但有趣。","It's complicated but fun."]]],
["-(으)ㄹ 수 있다/없다","beg",5,"can / cannot","能/不能","Ability or possibility.",[
 ["한국어로 말할 수 있어요.","會說韓語。","I can speak Korean."]]],
];

const counters = { int: 0, adv: 0, beg: 0 };
export const grammar = ROWS.map((r) => {
  const n = ++counters[r[1]];
  return {
    id: `g-${r[1]}-${String(n).padStart(3, "0")}`,
    form: r[0], tier: r[1], unit: r[2], en: r[3], zh: r[4], note: r[5],
    ex: r[6].map(([ko, zh, en]) => ({ ko, zh, en })),
  };
});
