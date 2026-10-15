// Hangul syllable composition helpers shared by pron.js and jyutping.js.
export const CHO = [..."ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ"];
export const JUNG = [..."ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ"];
export const JONG = ["", ..."ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ"];

export const isHangul = (ch) => ch >= "가" && ch <= "힣";

export function split(ch) {
  const n = ch.charCodeAt(0) - 0xac00;
  return { c: CHO[Math.floor(n / 588)], v: JUNG[Math.floor((n % 588) / 28)], j: JONG[n % 28] };
}

export function join({ c, v, j = "" }) {
  return String.fromCharCode(0xac00 + (CHO.indexOf(c) * 21 + JUNG.indexOf(v)) * 28 + JONG.indexOf(j));
}
