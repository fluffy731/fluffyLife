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
// ---------- Intermediate: extra points for units 1–15 ----------
["-(으)ㄴ/는 탓에","int",1,"because of (blame)","都怪、由於（負面）","Negative cause; the speaker assigns blame. Compare -덕분에 (positive).",[
 ["물가 상승 탓에 소비가 줄었다.","由於物價上漲，消費減少了。","Consumption fell because of rising prices."]]],
["-(으)ㄴ/는 덕분에","int",2,"thanks to","多虧、託…的福","Positive cause. N 덕분에.",[
 ["동료 덕분에 보고서를 끝냈다.","多虧同事，報告完成了。","Thanks to my colleague I finished the report."]]],
["-(으)ㄹ 겨를이 없다","int",3,"no time to","沒空、來不及","Set phrase with 겨를.",[
 ["복습할 겨를이 없었다.","沒空複習。","There was no time to revise."]]],
["-아/어야","int",4,"only if, must … to","只有…才","Necessary condition; stronger than -(으)면.",[
 ["푹 쉬어야 회복된다.","只有好好休息才能恢復。","You recover only if you rest properly."]]],
["-(으)ㄹ 지경이다","int",5,"to the point of","到了…的地步","Extreme (usually bad) state.",[
 ["너무 불안해서 잠을 못 잘 지경이다.","不安到睡不著的地步。","I'm so anxious I can't even sleep."]]],
["-(으)ㄴ/는 바람에","int",6,"because of (unexpected)","因為…（突發）","Reinforced here with an environmental example; see unit 2.",[
 ["태풍이 오는 바람에 비행기가 취소됐다.","因為颱風來了，班機被取消。","The typhoon caused the flight to be cancelled."]]],
["-(으)ㄴ/는 반면","int",7,"whereas","相反地","Contrast; see also -(으)ㄴ/는 데 반해.",[
 ["기술은 발전한 반면 개인정보는 위험해졌다.","技術發展了，相反地個資卻變得危險。","Technology advanced, whereas personal data became exposed."]]],
["-(이)란","int",8,"as for … (defining)","所謂…","Topic for definitions: N(이)란 … 이다.",[
 ["전통이란 지켜야 할 가치다.","所謂傳統，是應該守護的價值。","Tradition is a value to be preserved."]]],
["-아/어 두다","int",9,"do in advance (and keep)","事先…好","Preparation kept for later; near -아/어 놓다.",[
 ["관리비를 미리 내 두었다.","事先繳好了管理費。","I paid the maintenance fee in advance."]]],
["-(으)ㄹ 겸","int",10,"partly to, as well as","順便、兼","Two purposes; see unit 9.",[
 ["화해도 할 겸 저녁을 같이 먹었다.","順便和解，一起吃了晚餐。","We had dinner together, partly to make up."]]],
["-느라고","int",11,"because (busy doing)","因為忙著…","Reason that occupied the subject; result often negative.",[
 ["짐을 싸느라고 늦었다.","因為忙著打包所以遲到了。","I was late because I was packing."]]],
["-(으)ㄴ/는 이상","int",12,"now that, since","既然","Given the fact; obligation follows.",[
 ["법을 어긴 이상 처벌을 받아야 한다.","既然違了法，就該受罰。","Now that the law has been broken, punishment must follow."]]],
["-(으)ㄴ/는 가운데","int",13,"amid, while","在…之中","News-style background.",[
 ["논란이 계속되는 가운데 정부가 결정을 내렸다.","在爭議持續之中，政府做出了決定。","Amid ongoing controversy, the government decided."]]],
["-아/어 버리다","int",14,"do completely (relief or regret)","…掉了（徹底）","Completion with feeling.",[
 ["참다못해 말해 버렸다.","忍不住說出來了。","I couldn't hold it in and just said it."]]],
["-(으)ㄴ/는 데다가","int",15,"on top of","再加上","Additive; see unit 6.",[
 ["게다가 비까지 오는 데다가 춥다.","再加上還下雨，又冷。","On top of that it's raining, and cold."]]],
// ---------- Intermediate: new units 16–20 ----------
["-아/어 내다","int",16,"manage to (do through to the end)","…出來、堅持做到","Achievement after effort.",[
 ["끝까지 버텨 냈다.","撐到了最後。","I held out to the end."],
 ["어려운 문제를 풀어 냈다.","解出了難題。","I managed to solve the hard problem."]]],
["-고 말다","int",16,"end up (regrettably)","終究…了","Unintended completion.",[
 ["커피를 쏟고 말았다.","最後還是把咖啡灑了。","I ended up spilling the coffee."]]],
["-(으)ㄹ 뻔하다","int",16,"almost did","差點","Near miss; always past.",[
 ["휴대폰을 떨어뜨릴 뻔했다.","差點把手機摔了。","I nearly dropped my phone."]]],
["-아/어 하다","int",17,"(3rd person) feels …","（他人）感到…","Turns a feeling adjective into a 3rd-person verb: 그리워하다, 안타까워하다.",[
 ["그는 고향을 그리워한다.","他想念故鄉。","He misses his hometown."],
 ["아이가 무서워해요.","孩子很害怕。","The child is scared."]]],
["-(으)ㄴ/는 척하다","int",17,"pretend to","假裝","See unit 5; here with speech verbs.",[
 ["모르는 척 시치미를 뗐다.","裝作不知道。","He played dumb."]]],
["-지 그래(요)?","int",17,"why don't you …?","你怎麼不…呢？","Gentle suggestion.",[
 ["고민을 털어놓지 그래?","你怎麼不說出來呢？","Why don't you open up about it?"]]],
["-아/어 보이다","int",18,"to look (adjective)","看起來…","Appearance from an adjective.",[
 ["오늘 뿌듯해 보여요.","今天看起來很有成就感。","You look pleased today."],
 ["방이 널찍해 보인다.","房間看起來很寬敞。","The room looks spacious."]]],
["-(으)ㄴ 나머지","int",18,"as a result of being so …","因為太…以致","Excess leading to result.",[
 ["긴장한 나머지 말을 더듬었다.","因為太緊張而結巴。","I was so nervous I stammered."]]],
["-기 짝이 없다","int",18,"extremely","…之極","Formal intensifier for adjectives.",[
 ["민망하기 짝이 없다.","難為情至極。","It's embarrassing beyond words."]]],
["-(으)ㄹ 만하다","int",19,"worth; manageable","值得","With nouns of worth: 보람.",[
 ["보람을 느낄 만한 일이다.","是值得有成就感的工作。","It's work worth feeling proud of."]]],
["-에 불과하다","int",19,"nothing more than","不過是","Minimising.",[
 ["핑계에 불과하다.","不過是藉口。","It's nothing but an excuse."]]],
["-(으)ㄴ/는 셈 치다","int",19,"consider it as","就當作","Treat as if; concession.",[
 ["빚 갚은 셈 치자.","就當還了債吧。","Let's just call the debt settled."]]],
["-다가는","int",20,"if (you keep) …, then (bad)","再這樣…的話","Warning of consequences.",[
 ["자꾸 미루다가는 못 끝낸다.","再這樣拖下去會做不完。","Keep putting it off and you won't finish."]]],
["-(으)ㄹ 리 만무하다","int",20,"no way that (formal)","絕無可能","Formal version of -(으)ㄹ 리가 없다.",[
 ["도무지 알 리 만무하다.","絕無可能知道。","There is no way they could know."]]],
["-(으)ㄴ/는지 모르다 (감탄)","int",20,"so … (exclamation)","不知有多…","Exclamatory with 얼마나/어찌나.",[
 ["어찌나 기쁜지 몰라요.","不知有多開心。","You can't imagine how happy I am."]]],
// ---------- Advanced: extra points for units 1–10 ----------
["-(으)ㄴ/는 데(에) 반해","adv",1,"in contrast to","與…相反","Formal contrast.",[
 ["추상적인 설명인 데 반해 예시는 구체적이다.","說明抽象，相反地例子很具體。","The explanation is abstract, whereas the examples are concrete."]]],
["-(으)ㅁ에도 불구하고","adv",2,"despite","儘管","Formal concession, nominalised.",[
 ["금리 인상에도 불구하고 투자가 늘었다.","儘管利率上升，投資仍增加。","Despite the rate rise, investment grew."]]],
["-(으)ㄹ 뿐","adv",3,"only, merely","只是","Sentence-final -(으)ㄹ 뿐이다.",[
 ["협상은 시작일 뿐이다.","談判只是開始。","The negotiation is only the beginning."]]],
["-(으)ㄴ/는 한편","adv",4,"while also","一方面…另一方面","Parallel action.",[
 ["가설을 세우는 한편 자료를 모았다.","一方面建立假說，一方面收集資料。","While forming the hypothesis, we gathered data."]]],
["-(으)ㄹ 법도 하다","adv",5,"it would be natural to","也難怪會…","Reasonable expectation that didn't happen.",[
 ["좌절할 법도 한데 웃었다.","照理說會受挫，他卻笑了。","You'd expect him to be crushed, but he smiled."]]],
["-(으)ㅁ으로 인해","adv",6,"due to (nominalised)","由於","Formal cause with -(으)ㅁ.",[
 ["규제를 완화함으로 인해 경쟁이 늘었다.","由於放寬規制，競爭增加了。","Due to deregulation, competition increased."]]],
["-(으)ㄴ/는 양 (하다)","adv",7,"as if (pretending)","好像…似的","Literary; near 척하다.",[
 ["다 아는 양 말했다.","好像什麼都懂似的說。","He spoke as if he knew it all."]]],
["-(으)ㄹ 겨를도 없이","adv",8,"without even a moment to","連…的時間都沒有","Rapid succession.",[
 ["대응할 겨를도 없이 파업이 시작됐다.","連應對的時間都沒有，罷工就開始了。","The strike began before anyone could respond."]]],
["-(으)ㄹ진대","adv",9,"given that (archaic)","既然…","Archaic concessive-causal; speeches and literature.",[
 ["어른도 힘들진대 아이는 오죽하랴.","大人都辛苦，更何況孩子。","Even adults struggle; how much more a child."]]],
["-(으)ㄹ 따름","adv",10,"merely","只是","See unit 1; adverbial use.",[
 ["최선을 다했을 따름이다.","只是盡了全力。","I merely did my best."]]],
// ---------- Advanced: new units 11–14 ----------
["-(으)ㄹ 나위도 없이","adv",11,"needless to say","無庸置疑","Formal.",[
 ["말할 나위도 없이 빼어난 작품이다.","無庸置疑是出眾的作品。","Needless to say, it's an outstanding work."]]],
["-(으)로 말미암아","adv",11,"owing to","由於（文言）","Literary cause; verbs of this unit often follow.",[
 ["오해로 말미암아 갈등이 빚어졌다.","由於誤會而釀成了衝突。","Conflict arose owing to misunderstanding."]]],
["-건대","adv",11,"(I) assert/hope that","（我）敢說/但願","With 바라건대, 단언하건대.",[
 ["바라건대 부디 맞서 주기를.","但願你能勇敢對抗。","I only hope you will stand up to it."]]],
["-기 이를 데 없다","adv",12,"extremely (formal)","…無以復加","High register intensifier.",[
 ["경치가 빼어나기 이를 데 없다.","景色美得無以復加。","The scenery is beyond beautiful."]]],
["-(으)ㄴ/는 듯 만 듯","adv",12,"barely, as if (not)","似…非…","Ambiguous degree.",[
 ["들릴 듯 말 듯 속삭였다.","似聽得見又聽不見地耳語。","She whispered almost inaudibly."]]],
["-기 일쑤이다","adv",12,"habitually (bad)","動不動就","Bad habit.",[
 ["쌀쌀맞게 대답하기 일쑤다.","動不動就冷淡地回答。","He habitually answers curtly."]]],
["-(으)ㄹ 턱이 없다","adv",13,"no reason it would","沒道理","Colloquial disbelief; see unit 8.",[
 ["실마리가 그냥 나올 턱이 없다.","線索沒道理憑空出現。","There's no way a lead just appears."]]],
["-(으)ㄹ 따름이거니와","adv",13,"not only merely … but","不僅僅…而且","Stacked formal connector.",[
 ["발판이 될 따름이거니와 밑천도 된다.","不僅是跳板，還是本錢。","It's not merely a stepping stone, it's capital too."]]],
["-(으)ㄴ즉","adv",13,"as for, in that","就…而言、既然","Archaic 'as for'.",[
 ["사정인즉 밑천이 부족하다.","就情況而言，本錢不足。","The situation is that capital is lacking."]]],
["-기는 하다","adv",14,"it's true that … (but)","是…沒錯（但）","Partial concession, often before idioms.",[
 ["발이 넓기는 하지만 믿을 만하진 않다.","人脈廣是廣，但不太可靠。","He's well-connected, true, but not reliable."]]],
["-(으)ㄴ/는 체하다","adv",14,"pretend","裝作","Pairs with 시치미를 떼다.",[
 ["모르는 체 시치미를 뗐다.","裝作不知道。","He feigned ignorance."]]],
["-아/어 죽겠다","adv",14,"… to death (colloquial)","…死了","Colloquial intensifier.",[
 ["어깨가 무거워 죽겠다.","責任重得要死。","The responsibility is killing me."]]],
// ---------- Beginner: extra points for units 1–5 ----------
["-부터 -까지","beg",1,"from … to (time)","從…到…","Time range.",[
 ["아홉 시부터 다섯 시까지 일해요.","從九點工作到五點。","I work from nine to five."]]],
["-에 있다/없다","beg",2,"there is/isn't at","在…有/沒有","Location of existence.",[
 ["근처에 은행이 있어요.","附近有銀行。","There's a bank nearby."]]],
["-하고 / -(이)랑","beg",3,"and; with (spoken)","和（口語）","Casual 'and/with'.",[
 ["친구하고 영화를 봤어요.","和朋友看了電影。","I watched a film with a friend."]]],
["-(으)ㄹ래요?","beg",4,"would you like to?","要不要…？","Offer or suggestion.",[
 ["같이 산책할래요?","要一起散步嗎？","Would you like to take a walk together?"]]],
["-아/어서 (이유)","beg",5,"because, so","因為…所以","Reason; no tense marker before 서.",[
 ["복잡해서 길을 잃었어요.","因為很複雜所以迷路了。","It was complicated so I got lost."]]],
// ---------- Beginner: new units 6–8 ----------
["-고 있다","beg",6,"be doing (progressive)","正在…","Ongoing action.",[
 ["밥을 먹고 있어요.","正在吃飯。","I'm eating."]]],
["-(으)세요 (명령)","beg",6,"please do","請…","Polite imperative; 듣다 → 들으세요.",[
 ["여기 앉으세요.","請坐這裡。","Please sit here."]]],
["-지 않다","beg",7,"not (long negation)","不…","Long-form negative, any register.",[
 ["오늘은 바쁘지 않아요.","今天不忙。","I'm not busy today."]]],
["-(으)ㄴ + 명사","beg",7,"adjective modifier","…的（形容詞修飾名詞）","Adjective before a noun: 크다 → 큰 집.",[
 ["큰 집에 살아요.","住在大房子裡。","I live in a big house."],
 ["맛있는 음식을 먹었어요.","吃了好吃的食物。","I ate delicious food."]]],
["-이/가 있다/없다","beg",8,"to have / not have","有/沒有","Possession.",[
 ["돈이 없어요.","沒有錢。","I have no money."]]],
["-에서 (장소)","beg",8,"at/in (action location)","在（動作地點）","Place where an action happens.",[
 ["집에서 책을 읽어요.","在家看書。","I read at home."]]],
// ---------- Added later: rows go at the end so existing ids stay put ----------
// ---------- Intermediate, units 21–28 (everyday concrete words) ----------
["-아/어 있다","int",21,"be in a state (the result of an action)","（動作結果）…著","Intransitive and passive verbs only: 앉아 있다, 열려 있다. Contrast -고 있다 (action in progress): 옷을 입고 있다.",[
 ["창문이 열려 있어서 방이 춥다.","窗戶開著，所以房間很冷。","The window is open, so the room is cold."],
 ["아이가 의자에 앉아 있다.","孩子坐在椅子上。","The child is sitting on the chair."]]],
["-다가","int",21,"while doing … (then something else)","…著…著；做…的途中","Same subject. The first action is interrupted or switched. -았/었다가 = after finishing it.",[
 ["칼질을 하다가 손가락을 베었다.","切菜切到一半割到了手指。","I cut my finger while chopping."],
 ["집에 가다가 친구를 만났다.","回家的路上遇到了朋友。","I ran into a friend on my way home."]]],
["피동 -이/히/리/기-","int",22,"passive verbs","被動詞（被…）","보다→보이다, 닫다→닫히다, 열다→열리다, 안다→안기다. The doer is often left out; 에게/에 marks it.",[
 ["바람 때문에 문이 저절로 닫혔다.","因為風，門自己關上了。","The door shut by itself because of the wind."],
 ["아기가 엄마 품에 안겨 잠들었다.","寶寶被媽媽抱在懷裡睡著了。","The baby fell asleep in its mother's arms."]]],
["-아/어지다","int",22,"become …; get done (passive)","變得…；被…","With adjectives: a change of state (추워지다). With verbs: passive for verbs with no passive form (깨지다, 찢어지다).",[
 ["떨어뜨린 컵이 깨졌다.","掉下去的杯子破了。","The cup I dropped broke."],
 ["날씨가 점점 추워진다.","天氣漸漸變冷。","The weather is getting colder."]]],
["사동 -이/히/리/기/우-","int",23,"causative verbs (make or help someone do)","使動詞（讓…、使…）","먹다→먹이다, 입다→입히다, 울다→울리다, 씻다→씻기다, 자다→재우다. Often doing it for someone in your care.",[
 ["엄마가 아기에게 우유를 먹였다.","媽媽餵寶寶喝牛奶。","The mother fed the baby milk."],
 ["아이를 씻기고 재웠다.","幫孩子洗完澡，哄他睡了。","I bathed the child and put them to bed."]]],
["-게 하다","int",23,"make or let someone do","讓…、使…","Works with any verb, unlike the fixed causative forms, and is less hands-on: 먹게 하다 (got them to eat) vs 먹이다 (fed them).",[
 ["의사가 나를 일주일 동안 쉬게 했다.","醫生讓我休息了一個星期。","The doctor had me rest for a week."],
 ["창문을 열어서 바람이 들어오게 했다.","打開窗戶讓風吹進來。","I opened the window to let the breeze in."]]],
["-는 동안(에)","int",24,"while, during","在…期間","V-는 동안; N 동안 (방학 동안). Both things run over the same stretch of time.",[
 ["빨래가 마르는 동안 청소를 했다.","在衣服晾乾的時候打掃了。","I cleaned while the washing dried."],
 ["방학 동안 요리를 배웠다.","放假期間學了做菜。","I learnt to cook during the holidays."]]],
["-(으)ㄹ 때까지","int",24,"until","直到…為止","The action carries on up to a point: 익을 때까지, 마를 때까지.",[
 ["고기가 다 익을 때까지 기다렸다.","一直等到肉完全熟了。","I waited until the meat was cooked through."],
 ["물이 끓을 때까지 불을 세게 해 주세요.","在水燒開之前請開大火。","Keep the heat high until the water boils."]]],
["-(으)면서","int",25,"while (two things at once)","一邊…一邊…","Same subject, both at the same time. Also 'although': 알면서 모른 척하다.",[
 ["음악을 들으면서 설거지를 했다.","一邊聽音樂一邊洗碗。","I did the dishes while listening to music."],
 ["그는 웃으면서 고개를 끄덕였다.","他一邊笑一邊點頭。","He nodded with a smile."]]],
["-지 말고","int",25,"don't …, (do …) instead","別…，（而是）…","V-지 말고 V-(으)세요. Replaces one action with another.",[
 ["손으로 만지지 말고 집게를 쓰세요.","別用手摸，用夾子吧。","Don't touch it with your hands — use the tongs."],
 ["그냥 버리지 말고 분리수거하세요.","別直接丟，請分類回收。","Don't just throw it out — sort it for recycling."]]],
["-아/어 가지고","int",26,"and then (keeping the result); because (spoken)","…了之後（再）；因為（口語）","Spoken form of -아/어서. In sequence the result carries over: 사과를 깎아 가지고 먹었다.",[
 ["감자를 삶아 가지고 으깼다.","把馬鈴薯煮好後壓成泥。","I boiled the potatoes and then mashed them."],
 ["너무 피곤해 가지고 일찍 잤어.","太累了，所以早早就睡了。","I was so tired I went to bed early."]]],
["-(으)ㄴ/는 대신(에)","int",26,"instead of; in return","代替…；相對地","N 대신에 / V-는 대신에. Also a trade-off: 비싼 대신 튼튼하다.",[
 ["설탕 대신 꿀을 넣었다.","用蜂蜜代替了糖。","I used honey instead of sugar."],
 ["이 의자는 비싼 대신 아주 튼튼하다.","這張椅子雖然貴，但相對地非常堅固。","This chair is expensive, but it's very sturdy."]]],
["-기 쉽다/어렵다","int",27,"easy / hard to …","容易…／很難…","Also -기 편하다, -기 좋다. 쉽다 can mean 'likely to': 넘어지기 쉽다.",[
 ["바닥이 젖어 있으면 미끄러지기 쉽다.","地板濕的話很容易滑倒。","It's easy to slip if the floor is wet."],
 ["이 병은 뚜껑이 작아서 열기 어렵다.","這個瓶子的蓋子很小，很難打開。","The lid on this bottle is small, so it's hard to open."]]],
["-(으)ㄴ/는 편이다","int",27,"tend to be, fairly","算是…、比較…","Softens a judgement. Adjective -(으)ㄴ 편이다; verb -는 편이다 (a habit).",[
 ["우리 집은 시내에서 가까운 편이다.","我家算是離市區比較近。","Our place is fairly close to the city centre."],
 ["나는 아침을 잘 안 먹는 편이다.","我不太吃早餐。","I tend not to eat breakfast."]]],
["-(으)ㄹ 줄 알다/모르다","int",28,"know / not know how to","會…／不會…","A skill learnt by practice. Compare -(으)ㄹ 수 있다 (possible, allowed).",[
 ["나는 김치를 담글 줄 안다.","我會醃泡菜。","I know how to make kimchi."],
 ["동생은 아직 신발 끈을 묶을 줄 모른다.","弟弟還不會綁鞋帶。","My little brother can't tie his shoelaces yet."]]],
["-았/었다가","int",28,"did … and then undid or changed it","…了又…","The first action is finished, then reversed or followed by a change: 입었다가 벗었다.",[
 ["코트를 입었다가 더워서 벗었다.","穿上大衣後覺得熱又脫掉了。","I put my coat on, then took it off because it was hot."],
 ["창문을 열었다가 시끄러워서 다시 닫았다.","打開窗戶後太吵又關上了。","I opened the window but shut it again because of the noise."]]],
// ---------- Beginner, units 9–12 (everyday basics) ----------
["-았/었어요","beg",9,"past tense (polite)","過去式（…了）","Stem + 았 (after ㅏ/ㅗ) / 었 (others) / 했 (하다): 갔어요, 먹었어요, 공부했어요.",[
 ["어제 친구하고 영화를 봤어요.","昨天和朋友看了電影。","I saw a film with a friend yesterday."],
 ["아침에 빵을 먹었어요.","早上吃了麵包。","I ate bread this morning."]]],
["-(으)러 가다/오다","beg",9,"go / come to do","去／來（做）…","Only with 가다, 오다, 다니다: 밥 먹으러 가요.",[
 ["점심 먹으러 식당에 가요.","去餐廳吃午餐。","I'm going to a restaurant for lunch."],
 ["책을 빌리러 도서관에 왔어요.","來圖書館借書。","I came to the library to borrow a book."]]],
["-(으)면","beg",10,"if, when","如果…就…","After a consonant -으면 (먹으면); after a vowel or ㄹ -면 (가면, 살면).",[
 ["배가 고프면 이거 드세요.","肚子餓的話吃這個吧。","Have this if you're hungry."],
 ["비가 오면 집에 있을 거예요.","下雨的話我會待在家。","If it rains, I'll stay home."]]],
["-기 전에","beg",10,"before doing","在…之前","V-기 전에; N 전에 (식사 전에).",[
 ["자기 전에 이를 닦아요.","睡覺前刷牙。","I brush my teeth before bed."],
 ["밥 먹기 전에 손을 씻으세요.","吃飯前請洗手。","Wash your hands before you eat."]]],
["-(으)ㄴ 후에","beg",11,"after doing","…之後","Same as -(으)ㄴ 다음에; N 후에 (수업 후에).",[
 ["밥을 먹은 후에 산책해요.","吃完飯後散步。","I go for a walk after eating."],
 ["수업이 끝난 후에 만나요.","下課後見吧。","Let's meet after class."]]],
["-지 마세요","beg",11,"please don't","請不要…","Polite prohibition. Casual: -지 마.",[
 ["여기에서 사진을 찍지 마세요.","請不要在這裡拍照。","Please don't take photos here."],
 ["걱정하지 마세요.","請不要擔心。","Don't worry."]]],
["-아/어도 되다","beg",12,"may; it's all right to","可以…","Permission. As a question it asks for permission: 앉아도 돼요?",[
 ["여기 앉아도 돼요?","可以坐這裡嗎？","May I sit here?"],
 ["창문을 열어도 돼요.","可以開窗戶。","You can open the window."]]],
["-(으)ㄹ 때","beg",12,"when, at the time","…的時候","V/A-(으)ㄹ 때; N 때 (방학 때). Past: -았/었을 때.",[
 ["심심할 때 음악을 들어요.","無聊的時候聽音樂。","I listen to music when I'm bored."],
 ["어렸을 때 부산에 살았어요.","小時候住在釜山。","I lived in Busan when I was little."]]],
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
