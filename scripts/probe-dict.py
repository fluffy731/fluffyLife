"""One-off CI probe: Cantonese and English dictionary sources (links, sizes, formats)."""
import json, urllib.request, re, gzip, io

H = {"User-Agent": "Mozilla/5.0 fluffyLife-dict-probe"}
def open_(url): return urllib.request.urlopen(urllib.request.Request(url, headers=H), timeout=120)

# 1. CC-CEDICT
try:
    r = open_("https://www.mdbg.net/chinese/export/cedict/cedict_1_0_ts_utf-8_mdbg.txt.gz"); data = r.read()
    txt = gzip.decompress(data).decode("utf-8"); lines = [l for l in txt.splitlines() if l and not l.startswith("#")]
    print("CEDICT", r.status, len(data), "bytes", len(lines), "lines"); print("CEDICT sample", [l for l in lines if l.startswith("經濟 ") or l.startswith("唔該 ")][:3])
except Exception as e: print("CEDICT ERR", e)

# 2. cantonese.org download page links
for url in ["https://cantonese.org/download.html", "https://www.cantonese.org/download.html"]:
    try:
        r = open_(url); html = r.read().decode("utf-8", "replace")
        print("CANTO", url, r.status, sorted(set(re.findall(r'href="([^"]+\.(?:zip|gz|txt|u8))"', html))))
        break
    except Exception as e: print("CANTO", url, "ERR", e)

# 3. kaikki English: size and first entries with Korean translations (stream, stop early)
url = "https://kaikki.org/dictionary/English/kaikki.org-dictionary-English.jsonl"
try:
    r = open_(url); print("KAIKKI-EN", r.status, r.headers.get("content-length"))
    n = 0; found = 0
    for raw in r:
        n += 1
        e = json.loads(raw)
        tr = [t for t in (e.get("translations") or []) if t.get("lang_code") == "ko"]
        tr += [t for s in e.get("senses", []) for t in (s.get("translations") or []) if t.get("lang_code") == "ko"]
        if tr and found < 3:
            found += 1
            print("EN-SAMPLE", json.dumps({"word": e.get("word"), "pos": e.get("pos"), "ipa": [s.get("ipa") for s in e.get("sounds", []) if s.get("ipa")][:2], "gloss": [s.get("glosses", [""])[0] for s in e.get("senses", [])][:2], "ko": tr[:4]}, ensure_ascii=False)[:1200])
        if n >= 40000: break
    print("EN scanned", n, "found-with-ko in first", n, ":", found)
except Exception as e: print("KAIKKI-EN ERR", e)

# 4. kaikki Chinese (for Cantonese readings) — size only
try:
    r = open_("https://kaikki.org/dictionary/Chinese/kaikki.org-dictionary-Chinese.jsonl"); print("KAIKKI-ZH", r.status, r.headers.get("content-length"))
    first = json.loads(next(iter(r))); print("ZH-KEYS", sorted(first.keys())[:30])
except Exception as e: print("KAIKKI-ZH ERR", e)
