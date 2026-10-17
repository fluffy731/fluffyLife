// Mongolian Cyrillic → Latin reading aid (close to the MNS 5217:2012 transliteration). It spells the
// letters, not the exact sounds: unstressed vowels are reduced in speech, so the 🔊 clip is the reference.
const MAP = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "ye", ё: "yo", ж: "j", з: "z", и: "i", й: "i", к: "k", л: "l", м: "m",
  н: "n", о: "o", ө: "ö", п: "p", р: "r", с: "s", т: "t", у: "u", ү: "ü", ф: "f", х: "kh", ц: "ts", ч: "ch", ш: "sh",
  щ: "shch", ъ: "", ы: "y", ь: "i", э: "e", ю: "yu", я: "ya",
};

export function latin(text) {
  let out = "";
  for (const ch of String(text)) {
    const lower = ch.toLowerCase();
    const m = MAP[lower];
    if (m === undefined) { out += ch; continue; }
    out += ch !== lower && m ? m[0].toUpperCase() + m.slice(1) : m;
  }
  return out;
}

export const CYRILLIC = /^[А-ЯЁӨҮа-яёөү\s\-–—.,!?;:()«»"'…/]+$/u;
