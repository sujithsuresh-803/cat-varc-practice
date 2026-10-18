"""Merge data/base.json (parsed from the docs) with the new question files into data/questions.js."""
import json, random, re
from pathlib import Path

D = Path(__file__).resolve().parent.parent / "data"
rng = random.Random(2026)
DIFF = {"m": "medium", "h": "hard", "e": "easy"}
LET = "ABCD"
ARTICLE_NEXT = {"third-conditional", "sentence", "completion", "tempting", "causal", "palliative",
                "panacea", "laconic", "cipher", "Pyrrhic", "locked", "rule", "ship"}

def remap_letters(text, mapping):
    def sub(m):
        nxt = m.group(2) or ""
        if m.group(1) == "A" and nxt in ARTICLE_NEXT: return m.group(0)
        return "\x00" + mapping[m.group(1)] + m.group(0)[1:]
    out = re.sub(r"(?<![\w'’{])([A-D])\b(?![’'\w-])(?:\s+([\w-]+))?", sub, text)
    return out.replace("\x00", "")

def shuffled_mcq(opts, ans, expl):
    order = list(range(len(opts))); rng.shuffle(order)
    new_opts = [opts[i] for i in order]                      # new position j holds old option order[j]
    mapping = {LET[old]: LET[new] for new, old in enumerate(order)}
    return [{"k": LET[j], "t": t} for j, t in enumerate(new_opts)], mapping[ans], remap_letters(expl, mapping)

def fill(expl, num):  # num: placeholder -> displayed sentence number
    return re.sub(r"\{(\w+)\}", lambda m: f"({num[m.group(1)]})", expl)

base = json.loads((D / "base.json").read_text(encoding="utf8"))
questions, passages = [], {p["id"]: {"title": p["title"], "paras": p["paras"]} for p in base["passages"]}

# doc passages: difficulty from the average of their questions (easy=1, medium=2, hard=3)
LV = {"easy": 1, "medium": 2, "hard": 3}
for pid in passages:
    lv = [LV[q["difficulty"]] for q in base["questions"] if q.get("passage") == pid]
    avg = sum(lv) / len(lv)
    passages[pid]["difficulty"] = "easy" if avg < 1.7 else "medium" if avg < 1.95 else "hard"

for q in base["questions"]:
    if "options" in q:
        q["options"] = [{"k": k, "t": v} for k, v in q["options"].items()]
    questions.append(q)

def add(topic, i, q, **extra):
    questions.append({"id": f"{topic}-n{i}", "topic": topic, "difficulty": DIFF[q["d"]], "src": "new", **extra})

for topic in ("vocab", "pc", "ps", "grammar"):
    for i, q in enumerate(json.loads((D / f"new_{topic}.json").read_text(encoding="utf8")), 1):
        if "g" in q:  # error-spotting: segments stay in place
            add(topic, i, q, type="mcq", stem="Identify the part of the sentence that contains an error.",
                segments=q["g"], options=[{"k": k, "t": t} for k, t in zip("ABCDE", q["g"] + ["No Error"])],
                answer=q["a"], explanation=q["e"])
        else:
            opts, ans, expl = shuffled_mcq(q["o"], q["a"], q["e"])
            add(topic, i, q, type="mcq", stem=q["s"], options=opts, answer=ans, explanation=expl)

for i, q in enumerate(json.loads((D / "new_pj.json").read_text(encoding="utf8")), 1):
    n = len(q["c"]); order = list(range(n))
    while order == sorted(order): rng.shuffle(order)       # displayed position p shows correct sentence order[p]
    pos = {c: p + 1 for p, c in enumerate(order)}
    add("pj", i, q, type="tita", stem="Arrange the sentences into a logical paragraph. Type the correct order of the sentence numbers.",
        sentences=[q["c"][c] for c in order], answer="".join(str(pos[k]) for k in range(n)),
        explanation=fill(q["e"], {str(k + 1): pos[k] for k in range(n)}))

for i, q in enumerate(json.loads((D / "new_ooo.json").read_text(encoding="utf8")), 1):
    items = q["c"] + [q["x"]]; order = list(range(5)); rng.shuffle(order)
    pos = {c: p + 1 for p, c in enumerate(order)}
    num = {str(k + 1): pos[k] for k in range(4)}; num["x"] = pos[4]
    add("ooo", i, q, type="tita", stem="Four of the five sentences form a coherent paragraph. Type the number of the sentence that does not fit.",
        sentences=[items[c] for c in order], answer=str(pos[4]), explanation=fill(q["e"], num))

pi = 0
for f in ("new_rc_medium.json", "new_rc_hard.json"):
    for p in json.loads((D / f).read_text(encoding="utf8")):
        pi += 1; pid = f"rc-np{pi}"
        passages[pid] = {"title": p["title"], "paras": p["paras"], "difficulty": DIFF[p["d"]]}
        for j, q in enumerate(p["qs"], 1):
            opts, ans, expl = shuffled_mcq(q["o"], q["a"], q["e"])
            questions.append({"id": f"rc-n{pi}-{j}", "topic": "rc", "type": "mcq", "passage": pid,
                              "difficulty": DIFF[q.get("d", p["d"])], "stem": q["s"], "options": opts,
                              "answer": ans, "explanation": expl, "src": "new"})

# ---- Quant (tools/qa_bank.py) ----
QA_TOPIC = {"arith": "qa-arith", "alg": "qa-alg", "geo": "qa-geo", "num": "qa-num", "mod": "qa-mod"}
def distractors(n):
    k = max(1, round(abs(n) * 0.1)); cands = [n + k, n - k, n + 2 * k, n + 3 * k, n - 2 * k]
    return [c for c in cands if c >= 0 and c != n][:3]
tita_seen = 0
for i, q in enumerate(json.loads((D / "new_qa.json").read_text(encoding="utf8")), 1):
    opts, ans, expl = None, q["a"], q["e"]
    if q["o"] is None and re.fullmatch(r"\d+", q["a"]):
        tita_seen += 1
        if tita_seen % 3 == 0:          # recent CATs have ~1/3 TITA in Quant: turn some into MCQs
            q["o"] = [q["a"]] + [str(x) for x in distractors(int(q["a"]))]
            q["a"] = q["a"]
    if q["o"] is not None:
        order = list(range(4)); rng.shuffle(order)
        new_opts = [q["o"][j] for j in order]
        opts = [{"k": LET[j], "t": t} for j, t in enumerate(new_opts)]
        ans = LET[new_opts.index(q["a"])]
        add(QA_TOPIC[q["t"]], i, q, type="mcq", stem=q["s"], options=opts, answer=ans, explanation=expl)
    else:
        add(QA_TOPIC[q["t"]], i, q, type="tita", stem=q["s"], answer=q["a"], explanation=expl, numeric=True)

# ---- DILR sets (tools/dilr_bank.py) ----
for si, st in enumerate(json.loads((D / "new_dilr.json").read_text(encoding="utf8")), 1):
    pid = f"dilr-p{si}"
    passages[pid] = {"title": st["title"], "paras": st["intro"], "difficulty": DIFF[st["d"]], "kind": "set"}
    for j, q in enumerate(st["qs"], 1):
        base_q = {"id": f"dilr-{si}-{j}", "topic": "dilr", "passage": pid, "difficulty": DIFF[st["d"]], "src": "new", "stem": q["s"], "explanation": q["e"]}
        if q["o"] is None:
            questions.append({**base_q, "type": "tita", "answer": q["a"], "numeric": True})
        else:
            order = list(range(4)); rng.shuffle(order)
            new_opts = [q["o"][k] for k in order]
            questions.append({**base_q, "type": "mcq", "options": [{"k": LET[k], "t": t} for k, t in enumerate(new_opts)], "answer": LET[new_opts.index(q["a"])]})

topics = [["rc", "Reading Comprehension", "VARC"], ["pj", "Para Jumbles", "VARC"], ["ps", "Para Summary", "VARC"],
          ["ooo", "Odd Sentence Out", "VARC"], ["pc", "Para Completion", "VARC"], ["vocab", "Vocabulary", "VARC"], ["grammar", "Grammar", "VARC"],
          ["dilr", "DILR sets", "DILR"],
          ["qa-arith", "Arithmetic", "Quant"], ["qa-alg", "Algebra", "Quant"], ["qa-geo", "Geometry & Mensuration", "Quant"],
          ["qa-num", "Number System", "Quant"], ["qa-mod", "Modern Math (P&C, Probability)", "Quant"]]
out = {"topics": topics, "passages": passages, "questions": questions}
(D / "questions.js").write_text("window.VARC = " + json.dumps(out, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf8")

from collections import Counter
print(len(questions), "questions,", len(passages), "passages", dict(Counter(p["difficulty"] for p in passages.values())))
for t, *_ in topics:
    print(t, dict(Counter(q["difficulty"] for q in questions if q["topic"] == t)),
          "answers:", dict(Counter(q["answer"] for q in questions if q["topic"] == t and q["type"] == "mcq" and q["src"] == "new")))
