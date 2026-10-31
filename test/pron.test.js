import { test } from "node:test";
import assert from "node:assert/strict";
import { pronounce, romanize } from "../lib/pron.js";

test("no change when no rule applies", () => {
  assert.equal(pronounce("경제"), "경제");
  assert.equal(pronounce("사회"), "사회");
});

test("liaison: final consonant moves to next vowel-initial syllable", () => {
  assert.equal(pronounce("음악"), "으막");
  assert.equal(pronounce("일어나다"), "이러나다");
  assert.equal(pronounce("읽어요"), "일거요");
});

test("nasalisation before ㄴ/ㅁ", () => {
  assert.equal(pronounce("학문"), "항문");
  assert.equal(pronounce("입니다"), "임니다");
  assert.equal(pronounce("국민"), "궁민");
  assert.equal(pronounce("작년"), "장년");
});

test("ㄹ assimilation", () => {
  assert.equal(pronounce("신라"), "실라");
  assert.equal(pronounce("설날"), "설랄");
});

test("palatalisation of ㄷ/ㅌ before 이", () => {
  assert.equal(pronounce("같이"), "가치");
  assert.equal(pronounce("굳이"), "구지");
});

test("aspiration with ㅎ", () => {
  assert.equal(pronounce("축하"), "추카");
  assert.equal(pronounce("좋다"), "조타");
  assert.equal(pronounce("입학"), "이팍");
});

test("ㅎ drops before a vowel", () => {
  assert.equal(pronounce("좋아요"), "조아요");
});

test("tensification after obstruent final", () => {
  assert.equal(pronounce("학교"), "학꾜");
  assert.equal(pronounce("식당"), "식땅");
});

test("ㄹ + ㄷ/ㅅ/ㅈ tensifies only in Sino-Korean words", () => {
  assert.equal(pronounce("발달", { sino: true }), "발딸");
  assert.equal(pronounce("알지"), "알지");
});

test("double finals", () => {
  assert.equal(pronounce("없어요"), "업써요");
  assert.equal(pronounce("많다"), "만타");
  assert.equal(pronounce("싫어"), "시러");
  assert.equal(pronounce("닭"), "닥");
  assert.equal(pronounce("넓다"), "널따");
  assert.equal(pronounce("앉다"), "안따");
  assert.equal(pronounce("삶다"), "삼따");
});

test("final consonant neutralisation", () => {
  assert.equal(pronounce("꽃"), "꼳");
  assert.equal(pronounce("옷"), "옫");
  assert.equal(pronounce("부엌"), "부억");
});

test("romanize follows Revised Romanization of the pronounced form", () => {
  assert.equal(romanize("한국"), "hanguk");
  assert.equal(romanize("학문"), "hangmun");
  assert.equal(romanize("경제"), "gyeongje");
  assert.equal(romanize("같이"), "gachi");
  assert.equal(romanize("서울"), "seoul");
  assert.equal(romanize("빚"), "bit");
  assert.equal(romanize("-더니"), "-deoni");
  assert.equal(romanize("발이 넓다"), "bari neolda");
});

test("밟- keeps ㅂ before a consonant; 넓- only in 넓죽·넓둥·넓적 (표준발음법 제10항 다만)", () => {
  assert.equal(pronounce("밟다"), "밥따");
  assert.equal(pronounce("밟고"), "밥꼬");
  assert.equal(pronounce("밟는"), "밤는");
  assert.equal(pronounce("밟아"), "발바");
  assert.equal(pronounce("짓밟다"), "짇빱따");
  assert.equal(pronounce("넓죽하다"), "넙쭈카다");
  assert.equal(pronounce("넓적하다"), "넙쩌카다");
  assert.equal(pronounce("넓다"), "널따");
  assert.equal(pronounce("여덟"), "여덜");
});

// Checked against es-hangul 2.4.0 (October 2026). It disagreed on these, and the standard dictionary
// sides with us: no ㄴ-insertion inside a single Sino-Korean word (생일 is 생일, not 생닐), and
// ㄹ + ㄷ/ㅅ/ㅈ tensifies in Sino-Korean words (제26항). Kept here so a "fix" towards it gets caught.
test("cases where an outside implementation (es-hangul) gets the standard wrong", () => {
  const sino = { 참여: "차며", 생일: "생일", 중요: "중요", 필요: "피료", 월요일: "워료일", 외국인: "외구긴", 통일: "통일",
    공연: "공연", 할인: "하린", 절약: "저략", 번역: "버녁", 인용: "이뇽", 운율: "우뉼", 환율: "화뉼", 근육: "그뉵", 면역: "며녁",
    재활용: "재화룡", 인연: "이년", 필연: "피련", 선입견: "서닙껸", 결정: "결쩡", 출장: "출짱", 멸종: "멸쫑", 발전: "발쩐",
    월세: "월쎄", 일상: "일쌍", 갈등: "갈뜽", 철저: "철쩌", 설득: "설뜩", 저출산: "저출싼" };
  for (const [w, said] of Object.entries(sino)) assert.equal(pronounce(w, { sino: true }), said, w);
  assert.equal(pronounce("번거롭다"), "번거롭따");
  assert.equal(pronounce("을씨년스럽다"), "을씨년스럽따");
});
