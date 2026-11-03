// Bundles the official Anthropic SDK (version pinned in package.json) into one browser ES module for
// the Korean app's Songs tab, the way lib/vendor/ts-fsrs.js is vendored. Re-run after changing the pin:
//   npm install --no-save --ignore-scripts esbuild@0.25.12 @anthropic-ai/sdk@<version> && node scripts/vendor-sdk.mjs
import { build } from "esbuild";
import { readFile, writeFile } from "node:fs/promises";

const pkg = JSON.parse(await readFile("package.json", "utf8"));
const installed = JSON.parse(await readFile("node_modules/@anthropic-ai/sdk/package.json", "utf8")).version;
const pinned = pkg.dependencies["@anthropic-ai/sdk"];
if (installed !== pinned) throw new Error(`installed @anthropic-ai/sdk ${installed} but package.json pins ${pinned}`);

const out = await build({
  stdin: { contents: 'export { default } from "@anthropic-ai/sdk";', resolveDir: process.cwd(), loader: "js" },
  bundle: true, format: "esm", platform: "browser", minify: true, write: false, legalComments: "eof",
});
const banner = `// @anthropic-ai/sdk ${installed} (MIT), bundled by scripts/vendor-sdk.mjs. Do not edit by hand.\n`;
await writeFile("lib/vendor/anthropic-sdk.js", banner + out.outputFiles[0].text);
console.log(`lib/vendor/anthropic-sdk.js: @anthropic-ai/sdk ${installed}, ${out.outputFiles[0].text.length} bytes`);
