// The one Claude call: the user's own API key (kept on the phone), the official Anthropic SDK
// (vendored by scripts/vendor-sdk.mjs and loaded only when translating), structured JSON back.
import { buildRequest, parseAnalysis, actualCost } from "./model.js";

export class SongError extends Error {
  constructor(code, detail = "") { super(code); this.code = code; this.detail = detail; }
}

const loadVendored = () => import("../lib/vendor/anthropic-sdk.js");

export async function translateSong({ apiKey, model, lines, grammar }, { loadSdk = loadVendored } = {}) {
  apiKey = String(apiKey ?? "").trim();
  if (!apiKey) throw new SongError("noKey");
  let Anthropic;
  try { ({ default: Anthropic } = await loadSdk()); } catch { throw new SongError("offline"); }
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true, maxRetries: 2 });
  let msg;
  try {
    msg = await client.beta.messages.stream(buildRequest({ model, lines, grammar })).finalMessage();
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError || e instanceof Anthropic.PermissionDeniedError) throw new SongError("badKey");
    if (e instanceof Anthropic.RateLimitError) throw new SongError("rateLimit");
    if (e instanceof Anthropic.APIConnectionError) throw new SongError("offline");
    if (e instanceof Anthropic.APIError && e.status >= 500) throw new SongError("server");
    // Any other 4xx (no credit left, a model the account can't use): retrying won't help, so pass on the API's reason.
    if (e instanceof Anthropic.APIError && e.status >= 400) throw new SongError("rejected", String(e.error?.error?.message || e.message || ""));
    throw new SongError("invalid");
  }
  if (msg.stop_reason === "refusal") throw new SongError("refusal");
  if (msg.stop_reason === "max_tokens") throw new SongError("tooLong");
  const text = msg.content?.find((b) => b.type === "text")?.text;
  let analysis;
  try { analysis = parseAnalysis(text ?? "", lines, new Set(grammar.map((g) => g.id))); } catch { throw new SongError("invalid"); }
  return { analysis, usage: msg.usage, costUsd: actualCost(model, msg.usage), model: msg.model || model };
}
