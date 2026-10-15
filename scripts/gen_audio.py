"""Generate the recorded clips listed in audio-jobs.json with Microsoft's neural voices (edge-tts),
then write audio/<pack>/index.json listing the clips that exist.

Files already present (restored from the CI cache) are skipped, so only new or changed texts are
generated on later deploys. A clip that fails after retries is left out of the index; the app then
uses the device voice for that text. Set FAKE_TTS=1 to test without network access.
"""
import asyncio, json, os, sys
from pathlib import Path

RATE = "-10%"          # a little slower than normal, for learners
CONCURRENCY = 6
RETRIES = 3


async def synth(text, voice, path):
    if os.environ.get("FAKE_TTS"):
        if "FAIL" in text:
            raise RuntimeError("fake failure")
        path.write_bytes(b"ID3fake " + text.encode())
        return
    import edge_tts
    await edge_tts.Communicate(text, voice, rate=RATE).save(str(path))


async def one(job, sem, stats):
    path = Path(job["file"])
    if path.exists() and path.stat().st_size > 0:
        stats["cached"] += 1
        return
    path.parent.mkdir(parents=True, exist_ok=True)
    async with sem:
        for attempt in range(1, RETRIES + 1):
            tmp = path.with_suffix(".part")
            try:
                await synth(job["text"], job["voice"], tmp)
                if tmp.stat().st_size == 0:
                    raise RuntimeError("empty audio")
                tmp.replace(path)
                stats["made"] += 1
                return
            except Exception as e:  # network hiccups, throttling
                tmp.unlink(missing_ok=True)
                if attempt == RETRIES:
                    stats["failed"] += 1
                    print(f"FAILED {job['file']} ({job['text'][:30]}): {e}", file=sys.stderr)
                else:
                    await asyncio.sleep(2 * attempt)


async def main(jobs_file):
    jobs = json.loads(Path(jobs_file).read_text())
    stats = {"made": 0, "cached": 0, "failed": 0}
    sem = asyncio.Semaphore(CONCURRENCY)
    await asyncio.gather(*(one(j, sem, stats) for j in jobs))
    by_dir = {}
    for j in jobs:
        p = Path(j["file"])
        if p.exists() and p.stat().st_size > 0:
            by_dir.setdefault(p.parent, []).append(p.stem)
    for d in {Path(j["file"]).parent for j in jobs}:
        d.mkdir(parents=True, exist_ok=True)
        (d / "index.json").write_text(json.dumps({"clips": sorted(by_dir.get(d, []))}))
    print(f"clips: {stats['made']} generated, {stats['cached']} cached, {stats['failed']} failed; "
          + ", ".join(f"{d}: {len(v)}" for d, v in sorted(by_dir.items())))


if __name__ == "__main__":
    asyncio.run(main(sys.argv[1] if len(sys.argv) > 1 else "audio-jobs.json"))
