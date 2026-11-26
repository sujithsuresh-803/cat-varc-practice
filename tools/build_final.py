"""Build data/final.js (Final Stretch mock papers) from tools/final_src/{qa,dilr,varc}.py.
Quant: every key is recomputed by the question's own `chk`. DILR: every question must give the same answer
under every arrangement the set's clues allow. VARC keys are hand-checked (explanations say why)."""
import json, random, re, sys
from fractions import Fraction as F
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT / "final_src"))
import qa, dilr, varc, varc2  # noqa: E402,F401

D = ROOT.parent / "data"
rng = random.Random(20261126)
DIFF = {"e": "easy", "m": "medium", "h": "hard"}
LET = "ABCD"
QA_TOPIC = {"arith": "qa-arith", "alg": "qa-alg", "geo": "qa-geo", "num": "qa-num", "mod": "qa-mod"}

def canon(x):
    if isinstance(x, F): return str(x.numerator) if x.denominator == 1 else f"{float(x):.6f}".rstrip("0").rstrip(".")
    if isinstance(x, float): return f"{x:.6f}".rstrip("0").rstrip(".")
    return str(x)

def remap(text, mapping):
    """Option letters (A) … in explanations are rare; we never refer to letters, so nothing to remap."""
    return text

def mcq(opts, ans):
    assert ans in opts, (ans, opts)
    assert len(set(opts)) == 4, opts
    order = list(range(4)); rng.shuffle(order)
    new = [opts[i] for i in order]
    if all(o.lstrip("-−").replace(".", "").isdigit() for o in opts):      # numbers in ascending order
        new = sorted(opts, key=lambda o: float(o.replace("−", "-")))
    elif all(len(o) == 1 and o in "ABCDEFGH" for o in opts):                # letters in alphabetical order
        new = sorted(opts)
    return [{"k": LET[j], "t": t} for j, t in enumerate(new)], LET[new.index(ans)]

questions, passages, papers = [], {}, []
errors = []

# ---------------- Quant ----------------
for pi, pq in enumerate(qa.P, 1):
    qids = []
    assert len(pq) == 22, (pi, len(pq))
    assert sum(1 for x in pq if x["o"] is None) == 8, ("QA TITA", pi)
    for qi, x in enumerate(pq, 1):
        got = canon(x["chk"]())
        if got != x["a"]: errors.append(f"QA P{pi} Q{qi}: key {x['a']!r} but check gives {got!r}")
        qid = f"fs-q{pi}-{qi}"
        base = {"id": qid, "topic": QA_TOPIC[x["t"]], "difficulty": DIFF[x["d"]], "src": "final", "stem": x["s"], "explanation": x["e"]}
        if x["o"] is None:
            questions.append({**base, "type": "tita", "answer": x["a"], "numeric": True})
        else:
            opts, ans = mcq(x["o"], x["a"])
            questions.append({**base, "type": "mcq", "options": opts, "answer": ans})
        qids.append(qid)
    papers.append({"id": f"fs-qa-{pi}", "sec": "qa", "title": f"Final Stretch · Quant paper {pi}", "minutes": 40, "qids": qids})

# ---------------- DILR ----------------
for pi, sets in enumerate(dilr.P, 1):
    qids = []; tita = 0
    sizes = sorted(len(s["qs"]) for s in sets)
    assert sizes == [4, 4, 4, 5, 5], (pi, sizes)
    for si, st in enumerate(sets, 1):
        sols = st["sols"]()
        if not sols: errors.append(f"DILR P{pi} S{si}: no arrangement satisfies the clues"); continue
        pid = f"fs-d{pi}-s{si}"
        passages[pid] = {"title": st["title"], "paras": st["intro"], "difficulty": DIFF[st["d"]], "kind": "set", "family": st["fam"]}
        for qi, (s, o, a, e, f) in enumerate(st["qs"], 1):
            vals = {f(x) for x in sols}
            if vals != {a}: errors.append(f"DILR P{pi} S{si} Q{qi}: key {a!r}, arrangements give {sorted(vals)} ({len(sols)} arrangements)")
            qid = f"fs-d{pi}-{si}-{qi}"
            base = {"id": qid, "topic": "dilr", "passage": pid, "difficulty": DIFF[st["d"]], "src": "final", "stem": s, "explanation": e}
            if o is None:
                tita += 1; questions.append({**base, "type": "tita", "answer": a, "numeric": True})
            else:
                opts, ans = mcq(o, a); questions.append({**base, "type": "mcq", "options": opts, "answer": ans})
            qids.append(qid)
    papers.append({"id": f"fs-dilr-{pi}", "sec": "dilr", "title": f"Final Stretch · DILR paper {pi}", "minutes": 40, "qids": qids, "tita": tita})

# ---------------- VARC ----------------
for pi, pv in enumerate(varc.P, 1):
    qids = []
    for bi, blk in enumerate(pv, 1):
        kind = blk["k"]
        if kind == "rc":
            pid = f"fs-v{pi}-p{bi}"
            passages[pid] = {"title": blk["title"], "paras": blk["paras"], "difficulty": DIFF[blk["d"]]}
            for qi, (s, o, a, e, *dq) in enumerate(blk["qs"], 1):
                opts, ans = mcq(o, a); qid = f"fs-v{pi}-{bi}-{qi}"
                questions.append({"id": qid, "topic": "rc", "type": "mcq", "passage": pid, "difficulty": DIFF[dq[0] if dq else blk["d"]],
                                  "src": "final", "stem": s, "options": opts, "answer": ans, "explanation": e})
                qids.append(qid)
            continue
        qid = f"fs-v{pi}-{bi}"
        base = {"id": qid, "difficulty": DIFF[blk["d"]], "src": "final"}
        if kind == "pj":
            c = blk["c"]; nn = len(c); order = list(range(nn))
            while order == sorted(order): rng.shuffle(order)
            pos = {cc: p + 1 for p, cc in enumerate(order)}
            expl = re.sub(r"\{(\d)\}", lambda m: f"({pos[int(m.group(1)) - 1]})", blk["e"])
            questions.append({**base, "topic": "pj", "type": "tita", "sentences": [c[k] for k in order],
                              "stem": "The sentences below, when properly sequenced, form a coherent paragraph. Type the correct order of the sentence numbers.",
                              "answer": "".join(str(pos[k]) for k in range(nn)), "explanation": expl})
        elif kind == "ooo":
            items = blk["c"] + [blk["x"]]; order = list(range(5)); rng.shuffle(order)
            pos = {cc: p + 1 for p, cc in enumerate(order)}
            num = {str(k + 1): pos[k] for k in range(4)}; num["x"] = pos[4]
            expl = re.sub(r"\{(\w)\}", lambda m: f"({num[m.group(1)]})", blk["e"])
            questions.append({**base, "topic": "ooo", "type": "tita", "sentences": [items[k] for k in order],
                              "stem": "Five sentences are given below. Four of them form a coherent paragraph. Type the number of the sentence that does not belong.",
                              "answer": str(pos[4]), "explanation": expl})
        elif kind == "ps":
            opts, ans = mcq(blk["o"], blk["a"])
            questions.append({**base, "topic": "ps", "type": "mcq", "stem": "Read the paragraph and choose the option that best captures its essence.\n\n" + blk["p"],
                              "options": opts, "answer": ans, "explanation": blk["e"]})
        elif kind == "sp":
            # blk["p"] has markers (1)…(4); answer is the option text "Option 2" style
            opts = ["Option 1", "Option 2", "Option 3", "Option 4"]
            questions.append({**base, "topic": "sp", "type": "mcq",
                              "stem": "There is a sentence that is missing in the paragraph below. Look at the paragraph and decide where (option 1, 2, 3 or 4) the sentence would best fit.\n\nSentence: " + blk["s"] + "\n\nParagraph: " + blk["p"],
                              "options": [{"k": LET[i], "t": t} for i, t in enumerate(opts)], "answer": LET[blk["a"] - 1], "explanation": blk["e"]})
        else:
            raise ValueError(kind)
        qids.append(qid)
    assert len(qids) == 24, (pi, len(qids))
    papers.append({"id": f"fs-varc-{pi}", "sec": "varc", "title": f"Final Stretch · VARC paper {pi}", "minutes": 40, "qids": qids})

if errors:
    print("\n".join(errors)); sys.exit(1)

out = {"version": 1, "papers": papers, "passages": passages, "questions": questions,
       "topics": [["sp", "Sentence Placement", "VARC"]]}
(D / "final.js").write_text("window.VARC_FINAL = " + json.dumps(out, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf8")
from collections import Counter
print(len(papers), "papers,", len(questions), "questions,", len(passages), "passages/sets")
for p in papers:
    qs = [q for q in questions if q["id"] in set(p["qids"])]
    print(p["id"], len(qs), "TITA", sum(q["type"] == "tita" for q in qs), dict(Counter(q["difficulty"] for q in qs)),
          "keys", dict(Counter(q["answer"] for q in qs if q["type"] == "mcq")))
