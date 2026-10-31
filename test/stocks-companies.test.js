import { test } from "node:test";
import assert from "node:assert/strict";
import { COMPANIES } from "../stocks/companies.js";
import { UNIVERSE } from "../stocks/universe.js";

test("every stock and fund in the list says what the company does, and nothing is described that isn't listed", () => {
  for (const s of UNIVERSE) {
    const c = COMPANIES[s.t];
    assert.ok(c, `${s.t} has no description`);
    assert.ok(c[0].length > 2 && c[1].length > 30, `${s.t}: sector and a full line`);
    assert.equal(c[0] === "Index fund", s.kind === "fund", `${s.t}: index funds and only they are in the "Index fund" sector`);
  }
  assert.deepEqual(Object.keys(COMPANIES).filter((t) => !UNIVERSE.some((s) => s.t === t)), []);
});
