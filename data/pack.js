// The ko-zh pack: Korean target, Chinese (Traditional) + English support.
// A future reverse pack (e.g. yue-ko) would export the same shape.
import { vocab } from "./vocab.js";
import { grammar } from "./grammar.js";

export const pack = {
  id: "ko-zh",
  target: "ko",
  support: ["zh", "en"],
  fields: { front: "ko", script: "hanja", gloss: ["zh", "en"] },
  vocab,
  grammar,
};
