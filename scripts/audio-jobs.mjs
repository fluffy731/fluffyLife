// Writes audio-jobs.json: every clip the apps can play (voice, text, file). Used by the deploy workflow.
import { writeFile } from "node:fs/promises";
import { buildJobs } from "../lib/audio-jobs.js";
import { koPack } from "../packs/ko.js";
import { yuePack } from "../packs/yue.js";
import { mnPack } from "../packs/mn.js";

const jobs = [...buildJobs(koPack), ...buildJobs(yuePack), ...buildJobs(mnPack)];
await writeFile("audio-jobs.json", JSON.stringify(jobs, null, 1));
console.log(`audio-jobs.json: ${jobs.length} clips`);
