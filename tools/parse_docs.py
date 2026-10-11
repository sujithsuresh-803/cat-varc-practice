"""Parse the VARC .txt extracts (from the source .docx files) into data/base.json."""
import json, re, sys, html
from pathlib import Path

src = Path(sys.argv[1]); out = Path(sys.argv[2])

TOPICS = {
    "01": ("vocab", "Vocabulary"), "02": ("grammar", "Grammar"),
    "03": ("pj", "Para Jumbles"), "04": ("pc", "Para Completion"),
    "05": ("ps", "Para Summary"), "06": ("ooo", "Odd Sentence Out"),
}
OPT_RE = re.compile(r"\s*\(([A-E])\)\s*")

def clean(s): return html.unescape(s).strip()

def cluster_diff(i):  # clusters progress in difficulty in the source docs
    return "easy" if i <= 3 else "medium" if i <= 7 else "hard"

def split_opts(body):
    parts = OPT_RE.split(body)
    stem, opts = parts[0], {}
    for k in range(1, len(parts) - 1, 2):
        opts[parts[k]] = parts[k + 1].strip()
    return stem.strip(), opts

qs = []
for num, (tid, tname) in TOPICS.items():
    f = next(src.glob(f"VARC_{num}_*.txt"))
    cluster, cname = 0, ""
    for line in f.read_text(encoding="utf8").splitlines():
        line = clean(line)
        m = re.match(r"Cluster (\d+) — (.*)", line)
        if m: cluster, cname = int(m.group(1)), m.group(2); continue
        m = re.match(r"(\d+)\. (.*?) Answer: (.*)$", line)
        if not m or not cluster: continue
        n, body, ans = int(m.group(1)), m.group(2), m.group(3)
        q = {"id": f"{tid}-{n}", "topic": tid, "difficulty": cluster_diff(cluster),
             "cluster": cname, "src": "doc"}
        if tid in ("pj", "ooo"):
            sents = re.split(r"(?:^|\s)(\d)\.\s", body)
            q["sentences"] = [s.strip() for s in sents[2::2]]
            q["type"] = "tita"
            if tid == "pj":
                am = re.match(r"([\d-]+)\.?\s*(.*)", ans)
                q["answer"] = am.group(1).replace("-", ""); q["explanation"] = am.group(2)
                q["stem"] = "Arrange the sentences into a logical paragraph. Type the correct order of the sentence numbers."
            else:
                am = re.match(r"Sentence (\d)\.?\s*(.*)", ans)
                q["answer"] = am.group(1); q["explanation"] = am.group(2)
                q["stem"] = "Four of the five sentences form a coherent paragraph. Type the number of the sentence that does not fit."
        else:
            stem, opts = split_opts(body)
            am = re.match(r"\(([A-E])\)\.?\s*(.*)", ans)
            if not am or len(opts) < 4: print("SKIP", tid, n, line[:80]); continue
            q["type"] = "mcq"; q["answer"] = am.group(1); q["explanation"] = am.group(2)
            if tid == "grammar":
                # options are underlined segments inside the sentence
                q["segments"] = [opts[k].rstrip(" /") for k in "ABCD"]
                q["stem"] = "Identify the part of the sentence that contains an error."
                q["options"] = {**{k: opts[k].rstrip(" /") for k in "ABCD"}, "E": "No Error"}
                lead = stem
                if lead: q["segments"][0] = lead + " " + q["segments"][0]
            else:
                # drop any leading word glued onto the answer letter in explanations
                q["stem"], q["options"] = stem, opts
        qs.append(q)

# ---- Reading comprehension ----
f = next(src.glob("VARC_07_*.txt"))
passages, cur = [], None
def rc_diff(stem):
    s = stem.lower()
    if any(k in s for k in ("most nearly means", "according to the passage", "as used in", "identifies", "indicates", "refers")): return "easy"
    if any(k in s for k in ("infer", "suggest", "if true", "challenged", "strengthen", "weaken", "except", "most likely", "assum", "characteriz", "unresolved")): return "hard"
    return "medium"
for line in f.read_text(encoding="utf8").splitlines():
    line = clean(line)
    m = re.match(r"Passage (\d+) — (.*)", line)
    if m:
        cur = {"id": f"rc-p{m.group(1)}", "title": m.group(2), "paras": [], "src": "doc"}
        passages.append(cur); continue
    if line.startswith("Section ") or cur is None: continue
    m = re.match(r"(\d+)\. (.*?) Answer: \(([A-D])\)\.?\s*(.*)$", line)
    if m:
        stem, opts = split_opts(m.group(2))
        qs.append({"id": f"rc-{m.group(1)}", "topic": "rc", "type": "mcq", "passage": cur["id"],
                   "difficulty": rc_diff(stem), "stem": stem, "options": opts,
                   "answer": m.group(3), "explanation": m.group(4), "src": "doc"})
    elif line.startswith("End of Document"):
        cur = None
    elif len(line) > 150:
        cur["paras"].append(line)

json.dump({"questions": qs, "passages": passages}, out.open("w", encoding="utf8"), ensure_ascii=False, indent=1)
from collections import Counter
print(len(qs), "questions,", len(passages), "passages")
print(Counter((q["topic"], q["difficulty"]) for q in qs))
