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
