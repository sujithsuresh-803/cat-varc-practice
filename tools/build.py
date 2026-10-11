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
        passages[pid] = {"title": p["title"], "paras": p["paras"]}
        for j, q in enumerate(p["qs"], 1):
            opts, ans, expl = shuffled_mcq(q["o"], q["a"], q["e"])
            questions.append({"id": f"rc-n{pi}-{j}", "topic": "rc", "type": "mcq", "passage": pid,
                              "difficulty": DIFF[q.get("d", p["d"])], "stem": q["s"], "options": opts,
                              "answer": ans, "explanation": expl, "src": "new"})

topics = [["rc", "Reading Comprehension"], ["pj", "Para Jumbles"], ["ps", "Para Summary"],
          ["ooo", "Odd Sentence Out"], ["pc", "Para Completion"], ["vocab", "Vocabulary"], ["grammar", "Grammar"]]
out = {"topics": topics, "passages": passages, "questions": questions}
(D / "questions.js").write_text("window.VARC = " + json.dumps(out, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf8")

from collections import Counter
print(len(questions), "questions,", len(passages), "passages")
for t, _ in topics:
    print(t, dict(Counter(q["difficulty"] for q in questions if q["topic"] == t)),
          "answers:", dict(Counter(q["answer"] for q in questions if q["topic"] == t and q["type"] == "mcq" and q["src"] == "new")))
