"""One-off probe run on GitHub Actions: which dictionary sources download, and what the data looks like."""
import json, urllib.request, collections, sys

def get(url, limit=None):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 fluffyLife-dict-probe"})
    with urllib.request.urlopen(req, timeout=120) as r:
        return r.status, r.headers.get("content-type"), (r.read(limit) if limit else r.read())

for url in ["https://krdict.korean.go.kr/download/downloadPopup", "https://krdict.korean.go.kr/openApi/openApiInfo", "https://krdict.korean.go.kr/dicMarinerSearch/search"]:
    try:
        st, ct, body = get(url, 3000)
        print("KRDICT", url, st, ct); print(body.decode("utf-8", "replace")[:1500].replace("\n", " "))
    except Exception as e:
        print("KRDICT", url, "ERR", e)

url = "https://kaikki.org/dictionary/Korean/kaikki.org-dictionary-Korean.jsonl"
try:
    st, ct, body = get(url)
    lines = body.decode("utf-8").splitlines()
    print("KAIKKI", st, ct, len(body), "bytes", len(lines), "entries")
    pos = collections.Counter(); hanja = 0; keys = collections.Counter(); ipa = 0
    want = {"경제", "사과", "먹다", "고진감래", "눈치", "학교", "그러게요"}
    for ln in lines:
        e = json.loads(ln); pos[e.get("pos")] += 1; keys.update(e.keys())
        forms = e.get("forms", [])
        if any("hanja" in (f.get("tags") or []) for f in forms): hanja += 1
        if any(s.get("ipa") for s in e.get("sounds", [])): ipa += 1
        if e.get("word") in want:
            want.discard(e["word"])
            print("SAMPLE", json.dumps({k: e.get(k) for k in ("word", "pos", "forms", "sounds", "senses", "head_templates")}, ensure_ascii=False)[:1800])
    print("POS", pos.most_common(15)); print("KEYS", keys.most_common(30)); print("WITH_HANJA", hanja, "WITH_IPA", ipa)
except Exception as e:
    print("KAIKKI ERR", e)
