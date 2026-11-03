import { test } from "node:test";
import assert from "node:assert/strict";
import { translateSong, SongError } from "../songs/claude.js";

// A stand-in for the SDK's default export: same error class names, and a stream() whose finalMessage()
// resolves to a canned message, or throws the error `outcome(classes)` builds from this fake's own classes.
function fakeSdk(outcome) {
  class APIError extends Error { constructor(status, body) { super(`${status} ${JSON.stringify(body ?? {})}`); this.status = status; this.error = body; } }
  class AuthenticationError extends APIError {}
  class PermissionDeniedError extends APIError {}
  class RateLimitError extends APIError {}
  class APIConnectionError extends APIError {}
  const classes = { APIError, AuthenticationError, PermissionDeniedError, RateLimitError, APIConnectionError };
  const seen = {};
  class Anthropic {
    constructor(opts) {
      seen.opts = opts;
      this.beta = { messages: { stream: (req) => { seen.req = req; return { finalMessage: async () => {
        if (typeof outcome === "function") throw outcome(classes);
        return outcome;
      } }; } } };
    }
  }
  Object.assign(Anthropic, classes);
  return { loadSdk: async () => ({ default: Anthropic }), seen };
}
const msg = (text, stop = "end_turn") => ({ stop_reason: stop, content: [{ type: "text", text }], usage: { input_tokens: 3000, output_tokens: 1000, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 } });
const OK = JSON.stringify({ lines: [{ n: 1, zh: "去", en: "go", grammar: [], words: [] }] });
const ARGS = { apiKey: "sk-ant-test", model: "claude-haiku-5-5", lines: ["가"], grammar: [] };
const code = async (p) => { try { await p; } catch (e) { assert.ok(e instanceof SongError, String(e)); return e.code; } assert.fail("did not throw"); };

test("a good reply gives the analysis and its cost, sent with the browser flag and no fallbacks on Haiku", async () => {
  const f = fakeSdk(msg(OK));
  const r = await translateSong(ARGS, f);
  assert.equal(r.analysis.lines[0].zh, "去");
  assert.ok(r.costUsd > 0);
  assert.equal(r.model, "claude-haiku-5-5");
  assert.equal(f.seen.opts.dangerouslyAllowBrowser, true);
  assert.equal(f.seen.req.model, "claude-haiku-5-5");
  assert.equal("fallbacks" in f.seen.req, false);
});

test("stop reasons and bad replies become plain error codes", async () => {
  assert.equal(await code(translateSong(ARGS, fakeSdk(msg(OK, "max_tokens")))), "tooLong");
  assert.equal(await code(translateSong(ARGS, fakeSdk(msg(OK, "refusal")))), "refusal");
  assert.equal(await code(translateSong(ARGS, fakeSdk(msg("{")))), "invalid");
});

test("SDK errors map to codes, most specific first", async () => {
  const cases = [[(C) => new C.AuthenticationError(401), "badKey"], [(C) => new C.PermissionDeniedError(403), "badKey"],
    [(C) => new C.RateLimitError(429), "rateLimit"], [(C) => new C.APIConnectionError(0), "offline"],
    [(C) => new C.APIError(529), "server"], [(C) => new C.APIError(400), "rejected"], [(C) => new C.APIError(404), "rejected"], [() => new TypeError("boom"), "invalid"]];
  for (const [make, want] of cases) assert.equal(await code(translateSong(ARGS, fakeSdk(make))), want, String(make));
});

test("a missing key fails before loading the SDK", async () => {
  let loaded = false;
  assert.equal(await code(translateSong({ ...ARGS, apiKey: " " }, { loadSdk: async () => { loaded = true; } })), "noKey");
  assert.equal(loaded, false);
});

test("a request Claude rejects (no credit, unknown model) carries the API's own reason", async () => {
  const body = { type: "error", error: { type: "invalid_request_error", message: "Your credit balance is too low to access the Anthropic API." } };
  try { await translateSong(ARGS, fakeSdk((C) => new C.APIError(400, body))); assert.fail("did not throw"); }
  catch (e) { assert.equal(e.code, "rejected"); assert.equal(e.detail, "Your credit balance is too low to access the Anthropic API."); }
});
