"""Original CAT-style DILR sets. Puzzle sets are brute-forced: every question's answer must be identical
across ALL arrangements that satisfy the clues (i.e. the answer is forced). DI answers are computed from the data.
Run: python tools/dilr_bank.py -> data/new_dilr.json
"""
import itertools, json
from fractions import Fraction as F
from pathlib import Path

SETS = []
def table(head, rows, caption=None):
    t = {"table": {"head": head, "rows": [[str(c) for c in r] for r in rows]}}
    if caption: t["caption"] = caption
    return t

def forced(solutions, fn, label):
    vals = {fn(s) for s in solutions}
    if not solutions: raise SystemExit(f"{label}: NO solutions")
    if len(vals) != 1: raise SystemExit(f"{label}: answer not forced, possible = {vals} over {len(solutions)} solutions")
    return vals.pop()

def mcq(s, opts, a, e):
    assert a in opts and len(set(opts)) == 4, (s, a, opts)
    return {"s": s, "o": opts, "a": a, "e": e}
def around(v, fmt, offs=(-1.3, 0.9, 2.1)):
    """Correct value plus three distractors at fixed offsets, all formatted the same way."""
    return [fmt(v)] + [fmt(v + o) for o in offs]
def tita(s, a, e): return {"s": s, "o": None, "a": str(a), "e": e}
pc = lambda x: f"{x:.1f}%"

# ---------------------------------------------------------------- S1 sales (easy DI)
sales = {"P": [120, 135, 150, 165], "Q": [200, 180, 170, 190], "R": [90, 110, 140, 160], "S": [100, 150, 160, 140], "T": [60, 75, 90, 120]}
growth = {k: (v[3] - v[0]) / v[0] * 100 for k, v in sales.items()}
best = max(growth, key=growth.get)
totals = [sum(v[i] for v in sales.values()) for i in range(4)]
q_share = sales["Q"][3] / sum(sales["Q"]) * 100
above = [k for k, v in sales.items() if v[2] > sum(v) / 4]
SETS.append({"title": "Quarterly sales of five products", "d": "e", "intro": [
    "The table shows the sales (in ₹ lakh) of five products of a company in the four quarters of a year.",
    table(["Product", "Q1", "Q2", "Q3", "Q4"], [[k] + v for k, v in sales.items()])],
  "qs": [
    mcq("Which product recorded the highest percentage growth in sales from Q1 to Q4?", ["P", "R", "S", "T"], best,
        "Growth Q1→Q4: " + ", ".join(f"{k} {growth[k]:.1f}%" for k in sales) + f". Highest: {best}."),
    tita("In how many quarters did the total sales of the five products exceed ₹650 lakh?", sum(t > 650 for t in totals),
         "Quarterly totals: " + ", ".join(f"Q{i+1} {t}" for i, t in enumerate(totals)) + f" → {sum(t > 650 for t in totals)} quarters above 650."),
    mcq("What percentage of product Q's annual sales came in Q4 (approximately)?", ["22.4%", "25.7%", "27.1%", "24.3%"], pc(q_share).replace(".7%", ".7%"),
        f"Annual sales of Q = {sum(sales['Q'])}. Q4 share = 190/{sum(sales['Q'])} = {q_share:.1f}%."),
    tita("For how many products were Q3 sales higher than that product's average quarterly sales?", len(above),
         "Averages: " + ", ".join(f"{k} {sum(v)/4:g}" for k, v in sales.items()) + f". Q3 above average: {', '.join(above)} → {len(above)}."),
  ]})

# ---------------------------------------------------------------- S2 exports and margins (medium DI)
exp = {"Europe": [420, 460, 510], "USA": [380, 400, 450], "Asia": [250, 310, 340], "Africa": [90, 120, 160]}
mar = {"Europe": [12, 11, 10], "USA": [15, 16, 14], "Asia": [8, 10, 12], "Africa": [5, 6, 9]}
prof = {r: [exp[r][i] * mar[r][i] / 100 for i in range(3)] for r in exp}
tot_prof = [sum(prof[r][i] for r in exp) for i in range(3)]
max23 = max(exp, key=lambda r: prof[r][2])
afr_share = [exp["Africa"][i] / sum(exp[r][i] for r in exp) * 100 for i in range(3)]
cagr_like = {r: exp[r][2] / exp[r][0] for r in exp}
SETS.append({"title": "Exports and profit margins", "d": "m", "intro": [
    "A company exports to four regions. The first table gives export revenue (₹ crore); the second gives the profit margin (profit as a % of revenue) earned in each region.",
    table(["Region", "2021", "2022", "2023"], [[r] + v for r, v in exp.items()], "Export revenue (₹ crore)"),
    table(["Region", "2021", "2022", "2023"], [[r] + [f"{m}%" for m in v] for r, v in mar.items()], "Profit margin")],
  "qs": [
    mcq("In 2023, which region generated the highest profit?", list(exp), max23,
        "2023 profit = revenue × margin: " + ", ".join(f"{r} {prof[r][2]:.1f}" for r in exp) + f" → {max23}."),
    tita("What was the company's total export profit in 2022 (in ₹ crore, to one decimal place)?", f"{tot_prof[1]:.1f}",
         "2022: " + " + ".join(f"{exp[r][1]}×{mar[r][1]}%" for r in exp) + " = " + " + ".join(f"{prof[r][1]:.1f}" for r in exp) + f" = {tot_prof[1]:.1f}."),
    mcq("Africa's share of total export revenue rose from 2021 to 2023 by approximately how many percentage points?", around(afr_share[2]-afr_share[0], lambda x: f"{x:.1f}"),
        f"{afr_share[2]-afr_share[0]:.1f}", f"Africa's share: 2021 = 90/1140 = {afr_share[0]:.1f}%, 2023 = 160/1460 = {afr_share[2]:.1f}% → rise of {afr_share[2]-afr_share[0]:.1f} points."),
    tita("In how many regions did profit grow by more than 50% from 2021 to 2023?", sum(prof[r][2] > 1.5 * prof[r][0] for r in exp),
         "Profit 2021 → 2023: " + ", ".join(f"{r} {prof[r][0]:.1f}→{prof[r][2]:.1f}" for r in exp) + f". Above +50%: {', '.join(r for r in exp if prof[r][2] > 1.5*prof[r][0])}."),
  ]})

# ---------------------------------------------------------------- S3 rainfall (easy DI)
months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"]
rain = {"Pune": [2, 1, 4, 12, 30, 140], "Chennai": [25, 8, 4, 15, 45, 50]}
diff = [abs(a - b) for a, b in zip(rain["Pune"], rain["Chennai"])]
SETS.append({"title": "Monthly rainfall in two cities", "d": "e", "intro": [
    "The table gives the rainfall (in mm) recorded in Pune and Chennai from January to June.",
    table(["City"] + months, [[c] + v for c, v in rain.items()])],
  "qs": [
    tita("In how many months did Chennai receive more rainfall than Pune?", sum(c > p for p, c in zip(*rain.values())),
         "Chennai > Pune in " + ", ".join(m for m, p, c in zip(months, *rain.values()) if c > p) + "."),
    mcq("In which month was the difference in rainfall between the two cities the largest?", ["Jan", "May", "Jun", "Apr"], months[diff.index(max(diff))],
        "Differences: " + ", ".join(f"{m} {d}" for m, d in zip(months, diff)) + "."),
    tita("What fraction of Pune's January–June rainfall fell in June? Give the answer as a percentage rounded to the nearest integer.",
         round(rain["Pune"][5] / sum(rain["Pune"]) * 100), f"Pune total = {sum(rain['Pune'])}; June = 140 → {140/sum(rain['Pune'])*100:.1f}% ≈ {round(140/sum(rain['Pune'])*100)}%."),
    mcq("What was the average monthly rainfall in Chennai over these six months?", ["22.5 mm", "24.5 mm", "26.0 mm", "21.0 mm"], f"{sum(rain['Chennai'])/6:.1f} mm",
        f"Total = {sum(rain['Chennai'])} mm over 6 months → {sum(rain['Chennai'])/6:.1f} mm."),
  ]})

# ---------------------------------------------------------------- S4 tournament (hard puzzle)
T5 = "ABCDE"; M5 = list(itertools.combinations(T5, 2))
def outcome(r, x, y):  # 'W' x won, 'D', 'L' x lost
    if (x, y) in r: return "WDL"[r[(x, y)]]
    return "LDW"[r[(y, x)]]
tour = []
for res in itertools.product((0, 1, 2), repeat=10):
    r = dict(zip(M5, res)); pts = dict.fromkeys(T5, 0)
    for (x, y), o in r.items():
        if o == 0: pts[x] += 3
        elif o == 2: pts[y] += 3
        else: pts[x] += 1; pts[y] += 1
    if [pts[t] for t in "ABCDE"] != [8, 8, 6, 1, 4]: continue
    if any(outcome(r, t, u) == "L" for t in "AB" for u in T5 if u != t): continue          # A and B unbeaten
    if outcome(r, "D", "B") != "D": continue                                                # D's only point vs B
    tour.append(r)
draws = lambda r: sum(o == 1 for o in r.values())
SETS.append({"title": "A five-team football league", "d": "h", "intro": [
    "Five teams A, B, C, D and E played a round-robin league: every team played every other team exactly once. A win earned 3 points, a draw 1 point and a loss 0.",
    table(["Team", "A", "B", "C", "D", "E"], [["Final points", 8, 8, 6, 1, 4]]),
    "It is also known that A and B did not lose any match, and D's only point came from its match against B."],
  "qs": [
    tita("How many matches ended in a draw?", forced(tour, draws, "S4q1"),
         "Total points = 8 + 8 + 6 + 1 + 4 = 27. A decisive match gives 3 points in total and a draw 2. With 10 matches: 3W + 2D = 27 and W + D = 10 → D = 3."),
    mcq("What was the result of the match between A and E?", ["A won", "E won", "Draw", "Cannot be determined"],
        forced(tour, lambda r: {"W": "A won", "L": "E won", "D": "Draw"}[outcome(r, "A", "E")], "S4q2"),
        "Unbeaten with 8 points means 2 wins + 2 draws, for both A and B, and A–B must be a draw. D's only point is the draw with B, so D lost to A, C and E, and B beat C and E. A's other draw is with C or E. If A drew with C, C (beaten by B, winner over D) would need 2 more points from its match with E — impossible. So A beat C and drew with E."),
    tita("How many matches did C win?", forced(tour, lambda r: sum(outcome(r, "C", t) == "W" for t in T5 if t != "C"), "S4q3"),
         "C's 6 points with no draw available against A or B (they beat C) means two wins: over D and E."),
    mcq("Which team did E defeat?", ["A", "C", "D", "No team"], forced(tour, lambda r: next((t for t in T5 if t != "E" and outcome(r, "E", t) == "W"), "No team"), "S4q4"),
        "E's 4 points = a draw with A + a win. E lost to B and C, so the win must be over D."),
  ]})

# ---------------------------------------------------------------- S5 seating (medium)
P6 = "PQRSTU"
seat = []
for p in itertools.permutations(P6):
    pos = {x: i + 1 for i, x in enumerate(p)}
    if pos["P"] not in (1, 6) or pos["Q"] != pos["R"] + 1 or abs(pos["S"] - pos["P"]) == 1: continue
    if pos["T"] not in (3, 4) or pos["S"] - pos["U"] != 2 or pos["R"] < pos["T"]: continue
    seat.append(pos)
S5_WHY = ("T is in seat 3 or 4, and R–Q (adjacent, Q on the right) sit to the right of T. "
          "If P were in seat 6, R–Q would need seats 4–5 with T in 3, leaving seats 1–2 for U and S — but they need exactly one seat between them. "
          "So P is in seat 1. If T were in 4, R–Q take 5–6 and U, S get seats 2–3, again no gap. "
          "Hence T is in 3, R–Q in 5–6, and U, S in seats 2 and 4. Final order: P, U, T, S, R, Q.")
SETS.append({"title": "Six friends in a row", "d": "m", "intro": [
    "Six friends P, Q, R, S, T and U sit in a row of six seats numbered 1 to 6 from left to right, all facing the same direction.",
    "1. P sits at one of the two ends.\n2. Q sits immediately to the right of R.\n3. S does not sit next to P.\n4. T sits in seat 3 or seat 4.\n5. U sits to the left of S with exactly one person between them.\n6. R sits to the right of T."],
  "qs": [
    mcq("Who sits in seat 1?", ["P", "R", "Q", "U"], forced(seat, lambda s: next(k for k, v in s.items() if v == 1), "S5q1"), S5_WHY),
    mcq("Who sits immediately to the left of S?", ["T", "U", "Q", "R"], forced(seat, lambda s: next(k for k, v in s.items() if v == s["S"] - 1), "S5q2"), S5_WHY),
    tita("In which seat does T sit?", forced(seat, lambda s: s["T"], "S5q3"), S5_WHY),
    mcq("How many people sit between P and U?", ["0", "1", "2", "3"], str(forced(seat, lambda s: abs(s["P"] - s["U"]) - 1, "S5q4")), S5_WHY),
  ]})

# ---------------------------------------------------------------- S6 scheduling (medium)
subjects = ["Maths", "Physics", "Chemistry", "Biology", "English"]; profs = ["Iyer", "Jain", "Kapoor", "Lal", "Menon"]
DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
sched = []
for sp in itertools.permutations(subjects):
    d = dict(zip(sp, range(5)))
    if d["Maths"] != 2 or d["Physics"] != d["Chemistry"] + 1: continue
    for pp in itertools.permutations(profs):
        pd = dict(zip(pp, range(5))); subj_of = {p: sp[pd[p]] for p in profs}
        if pd["Iyer"] != 0 or subj_of["Iyer"] == "English" or subj_of["Kapoor"] != "Biology": continue
        if pd["Lal"] >= pd["Kapoor"] or pd["Menon"] != 4 or subj_of["Jain"] == "Maths": continue
        sched.append((sp, pp))
S6_WHY = ("Wednesday is Maths, so Chemistry–Physics fall on Mon–Tue or Thu–Fri. Kapoor (Biology) cannot be on Monday (Iyer), Wednesday (Maths) or Friday (Menon). "
          "If Kapoor were on Tuesday, Lal would have to lecture on Monday — Iyer's day. So Kapoor lectures Biology on Thursday, which pushes Chemistry–Physics to Monday–Tuesday and leaves English for Friday. "
          "Iyer (Monday) takes Chemistry. Jain and Lal share Tuesday and Wednesday; Jain can't take Maths, so Jain has Tuesday (Physics) and Lal Wednesday (Maths).")
SETS.append({"title": "A week of guest lectures", "d": "m", "intro": [
    "Five professors — Iyer, Jain, Kapoor, Lal and Menon — each deliver one lecture, on five different subjects (Maths, Physics, Chemistry, Biology, English), one lecture per day from Monday to Friday.",
    "1. Maths is on Wednesday.\n2. Physics is on the day immediately after Chemistry.\n3. Iyer lectures on Monday, but not on English.\n4. Kapoor lectures on Biology.\n5. Lal lectures earlier in the week than Kapoor.\n6. Menon lectures on Friday.\n7. Jain does not lecture on Maths."],
  "qs": [
    mcq("On which day is the Biology lecture?", ["Monday", "Tuesday", "Thursday", "Friday"], forced(sched, lambda x: DAYS[x[0].index("Biology")], "S6q1"), S6_WHY),
    mcq("Who lectures on Maths?", ["Jain", "Lal", "Menon", "Iyer"], forced(sched, lambda x: x[1][x[0].index("Maths")], "S6q2"), S6_WHY),
    mcq("Which subject does Iyer lecture on?", ["English", "Chemistry", "Physics", "Biology"], forced(sched, lambda x: x[0][0], "S6q3"), S6_WHY),
    mcq("On which day does Jain lecture?", ["Tuesday", "Wednesday", "Thursday", "Monday"], forced(sched, lambda x: DAYS[x[1].index("Jain")], "S6q4"), S6_WHY),
  ]})

# ---------------------------------------------------------------- S7 chocolates (medium)
choc = []
for w, x, y, z in itertools.product(range(3, 31), repeat=4):
    if w + x + y + z == 30 and len({w, x, y, z}) == 4 and x == 2 * w and y == z + 4 and z > w and y > x:
        choc.append({"W": w, "X": x, "Y": y, "Z": z})
S7_WHY = ("Write W = w, X = 2w, Z = z, Y = z + 4. Then w + 2w + z + z + 4 = 30 → 3w + 2z = 26, so w is even. "
          "w = 4 gives z = 7 (and z > w ✓); w = 6 gives z = 4 (fails z > w); w ≥ 8 makes z too small. "
          "So W = 4, X = 8, Z = 7, Y = 11 — and Y > X holds.")
SETS.append({"title": "Sharing 30 chocolates", "d": "m", "intro": [
    "Thirty chocolates were distributed among four children W, X, Y and Z. Each child got at least 3 chocolates and no two children got the same number.",
    "1. X got twice as many chocolates as W.\n2. Y got 4 more chocolates than Z.\n3. Z got more chocolates than W.\n4. Y got more chocolates than X."],
  "qs": [
    tita("How many chocolates did W get?", forced(choc, lambda c: c["W"], "S7q1"), S7_WHY),
    tita("How many chocolates did Y get?", forced(choc, lambda c: c["Y"], "S7q2"), S7_WHY),
    mcq("Who got the second-highest number of chocolates?", ["W", "X", "Y", "Z"], forced(choc, lambda c: sorted(c, key=c.get)[-2], "S7q3"), S7_WHY),
    tita("What is the difference between the largest and the smallest share?", forced(choc, lambda c: max(c.values()) - min(c.values()), "S7q4"), S7_WHY),
  ]})

# ---------------------------------------------------------------- S8 language survey (medium, Venn)
venn = []
for HET in range(0, 60):
    HE, HT, ET = 25 - HET, 17 - HET, 13 - HET
    H, E, Tn = 107 - HE - HT - HET, 88 - HE - ET - HET, 55 - HT - ET - HET
    if min(HE, HT, ET, H, E, Tn) < 0: continue
    if 220 - (H + E + Tn + HE + HT + ET + HET) == 20:
        venn.append(dict(H=H, E=E, T=Tn, HE=HE, HT=HT, ET=ET, HET=HET))
S8_WHY = ("At least one language = 220 − 20 = 200. Inclusion–exclusion: 200 = 107 + 88 + 55 − 25 − 17 − 13 + x → x = 5 speak all three. "
          "Exactly two: Hindi–English only 25 − 5 = 20, Hindi–Tamil only 17 − 5 = 12, English–Tamil only 13 − 5 = 8. "
          "Only Hindi = 107 − 20 − 12 − 5 = 70, only English = 88 − 20 − 8 − 5 = 55, only Tamil = 55 − 12 − 8 − 5 = 30.")
SETS.append({"title": "Languages spoken by 220 employees", "d": "m", "intro": [
    "In an office of 220 employees, each employee speaks some of Hindi, English and Tamil, or none of them.",
    "• 107 speak Hindi, 88 speak English and 55 speak Tamil.\n• 25 speak both Hindi and English, 17 speak both Hindi and Tamil and 13 speak both English and Tamil (these counts include those who speak all three).\n• 20 employees speak none of the three languages."],
  "qs": [
    tita("How many employees speak all three languages?", forced(venn, lambda v: v["HET"], "S8q1"), S8_WHY),
    tita("How many employees speak exactly one language?", forced(venn, lambda v: v["H"] + v["E"] + v["T"], "S8q2"), S8_WHY),
    tita("How many employees speak Hindi and English but not Tamil?", forced(venn, lambda v: v["HE"], "S8q3"), S8_WHY),
    tita("How many employees speak exactly two languages?", forced(venn, lambda v: v["HE"] + v["HT"] + v["ET"], "S8q4"), S8_WHY),
  ]})

# ---------------------------------------------------------------- S9 three races (hard)
R5 = "VWXYZ"; perms = list(itertools.permutations(R5)); PTS = [5, 4, 3, 2, 1]
races = []
for r1 in perms:
    if r1[0] != "V" or r1.index("Y") > r1.index("X"): continue
    for r2 in perms:
        if r2.index("V") != 4 or r2[0] in "VZ" or r2[1] != "X": continue
        for r3 in perms:
            if r3[0] != "Z" or r3[1] != "X" or r3[4] != "Y" or r3.index("W") > r3.index("V"): continue
            tot = {p: sum(PTS[r.index(p)] for r in (r1, r2, r3)) for p in R5}
            if tot["W"] == 11 and tot["X"] == 10 and sorted(tot.values(), reverse=True) == [11, 10, 9, 8, 7]:
                races.append((r1, r2, r3, tot))
S9_WHY = ("X was 2nd in races 2 and 3 (4 + 4) and scored 10 in all, so X was 4th in race 1. In race 3: Z 1st, X 2nd, Y 5th, and W ahead of V → W 3rd, V 4th. "
          "W scored 11, so W got 8 from races 1 and 2. Race 2's winner is not V or Z (three different winners). If Y won race 2, W would be at most 3rd there and would need 5+ points in race 1 — impossible, as V won it. "
          "So W won race 2 and was 3rd in race 1. Race 1: V, then Y ahead of X → Y 2nd, Z 5th. "
          "V = 5 + 1 + 2 = 8. Totals 9 and 7 remain for Y and Z: Y = 4 + (race 2) + 1, Z = 1 + (race 2) + 5, with race-2 points 3 and 2 between them → Y = 7, Z = 9 (Z 3rd, Y 4th in race 2).")
SETS.append({"title": "Three races, five runners", "d": "h", "intro": [
    "Five runners V, W, X, Y and Z ran three races. In each race the finishing positions 1st to 5th earned 5, 4, 3, 2 and 1 points respectively; there were no ties.",
    "1. V won the first race but finished last in the second.\n2. The three races had three different winners; Z won the third race.\n3. X finished second in both the second and the third race.\n4. Y finished last in the third race, in which W finished ahead of V.\n5. In the first race, Y finished ahead of X.\n6. The final totals were 11, 10, 9, 8 and 7 points; W scored 11 and X scored 10."],
  "qs": [
    tita("What was V's total score?", forced(races, lambda s: s[3]["V"], "S9q1"), S9_WHY),
    mcq("Who won the second race?", ["W", "X", "Y", "Z"], forced(races, lambda s: s[1][0], "S9q2"), S9_WHY),
    tita("How many points did Z score in total?", forced(races, lambda s: s[3]["Z"], "S9q3"), S9_WHY),
    mcq("What was Y's position in the second race?", ["2nd", "3rd", "4th", "5th"], forced(races, lambda s: ["1st", "2nd", "3rd", "4th", "5th"][s[1].index("Y")], "S9q4"), S9_WHY),
  ]})

# ---------------------------------------------------------------- S10 flights (medium, network)
cities = ["Delhi", "Mumbai", "Kolkata", "Chennai", "Bengaluru"]
INF = None
fare = {("Delhi", "Mumbai"): 6, ("Delhi", "Kolkata"): 7, ("Delhi", "Chennai"): 12, ("Mumbai", "Bengaluru"): 4,
        ("Mumbai", "Chennai"): 6, ("Kolkata", "Chennai"): 5, ("Chennai", "Bengaluru"): 2, ("Kolkata", "Bengaluru"): 9}
def cheapest(a, b, avoid=()):
    best = None
    for k in range(0, 4):
        for mid in itertools.permutations([c for c in cities if c not in (a, b) and c not in avoid], k):
            path = (a,) + mid + (b,); cost = 0
            for u, v in zip(path, path[1:]):
                f = fare.get((u, v)) or fare.get((v, u))
                if f is None: cost = None; break
                cost += f
            if cost is not None and (best is None or cost < best[0]): best = (cost, path)
    return best
c1 = cheapest("Delhi", "Bengaluru"); c2 = cheapest("Kolkata", "Mumbai"); c3 = cheapest("Delhi", "Chennai"); c4 = cheapest("Delhi", "Bengaluru", avoid=("Mumbai",))
SETS.append({"title": "Airfares between five cities", "d": "m", "intro": [
    "The table lists the fares (in ₹ thousand) of all direct flights between five cities; fares are the same in both directions. A blank means there is no direct flight. A traveller may change flights any number of times and pays the sum of the fares.",
    table(["From \\ To"] + cities, [[a] + [("—" if a == b else (fare.get((a, b)) or fare.get((b, a)) or "")) for b in cities] for a in cities])],
  "qs": [
    tita("What is the cheapest fare (₹ thousand) from Delhi to Bengaluru?", c1[0], f"Cheapest route: {' → '.join(c1[1])} = {c1[0]}."),
    tita("What is the cheapest fare (₹ thousand) from Kolkata to Mumbai?", c2[0], f"Cheapest route: {' → '.join(c2[1])} = {c2[0]}."),
    mcq("The direct Delhi–Chennai flight costs 12. How much does the cheapest Delhi–Chennai journey save compared with it?", ["0", "1", "2", "3"], str(12 - c3[0]),
        f"Cheapest Delhi→Chennai: {' → '.join(c3[1])} = {c3[0]} → saving {12 - c3[0]}."),
    tita("If Mumbai airport is closed, what is the cheapest fare (₹ thousand) from Delhi to Bengaluru?", c4[0], f"Avoiding Mumbai: {' → '.join(c4[1])} = {c4[0]}."),
  ]})

# ---------------------------------------------------------------- S11 ages (hard)
names = ["Anu", "Bala", "Chitra", "Dev", "Esha", "Farhan"]
ages = []
for p in itertools.permutations(range(21, 27)):
    a = dict(zip(names, p))
    if a["Anu"] + a["Bala"] != a["Chitra"] + a["Dev"] or a["Esha"] != a["Farhan"] + 3 or a["Anu"] <= a["Esha"]: continue
    if a["Dev"] % 2 or a["Chitra"] >= a["Dev"] or min(a.values()) == a["Farhan"]: continue
    ages.append(a)
S11_WHY = ("Esha = Farhan + 3 and Anu is older than Esha, so (Farhan, Esha) is (21, 24) or (22, 25) — (23, 26) leaves no older age for Anu. "
           "Farhan is not the youngest, so Farhan = 22, Esha = 25 and Anu = 26. Bala, Chitra and Dev share 21, 23 and 24; Dev is even → 24. "
           "Clue 1: 26 + Bala = Chitra + 24 → Chitra = Bala + 2 → Bala = 21, Chitra = 23 (and Chitra < Dev ✓).")
SETS.append({"title": "Ages of six classmates", "d": "h", "intro": [
    "Six classmates — Anu, Bala, Chitra, Dev, Esha and Farhan — have six different ages, which are the integers from 21 to 26.",
    "1. Anu's age plus Bala's age equals Chitra's age plus Dev's age.\n2. Esha is exactly 3 years older than Farhan.\n3. Anu is older than Esha.\n4. Dev's age is an even number.\n5. Chitra is younger than Dev.\n6. Farhan is not the youngest."],
  "qs": [
    tita("What is Anu's age?", forced(ages, lambda a: a["Anu"], "S11q1"), S11_WHY),
    mcq("Who is the youngest?", ["Farhan", "Dev", "Bala", "Chitra"], forced(ages, lambda a: min(a, key=a.get), "S11q2"), S11_WHY),
    tita("What is the sum of Bala's and Chitra's ages?", forced(ages, lambda a: a["Bala"] + a["Chitra"], "S11q3"), S11_WHY),
    mcq("How many classmates are older than Chitra?", ["0", "1", "2", "3"], str(forced(ages, lambda a: sum(v > a["Chitra"] for v in a.values()), "S11q4")), S11_WHY),
  ]})

# ---------------------------------------------------------------- S12 company financials (medium DI)
co = {"Alpha": (480, 420, 1200), "Beta": (650, 560, 2600), "Gamma": (300, 240, 600), "Delta": (900, 810, 4500), "Epsilon": (520, 430, 1300)}
pm = {k: (r - c) / r * 100 for k, (r, c, e) in co.items()}
rpe = {k: r * 1e7 / e / 1e5 for k, (r, c, e) in co.items()}  # ₹ lakh per employee
SETS.append({"title": "Five IT companies", "d": "m", "intro": [
    "The table gives the revenue and total cost (₹ crore) and the number of employees of five companies in a year. Profit = revenue − cost.",
    table(["Company", "Revenue", "Cost", "Employees"], [[k, r, c, e] for k, (r, c, e) in co.items()])],
  "qs": [
    mcq("Which company has the highest profit margin (profit as a % of revenue)?", ["Alpha", "Gamma", "Epsilon", "Beta"], max(pm, key=pm.get),
        "Margins: " + ", ".join(f"{k} {v:.1f}%" for k, v in pm.items()) + "."),
    mcq("Which company has the lowest revenue per employee?", ["Beta", "Delta", "Alpha", "Gamma"], min(rpe, key=rpe.get),
        "Revenue per employee (₹ lakh): " + ", ".join(f"{k} {v:.1f}" for k, v in rpe.items()) + "."),
    tita("What is the total profit of all five companies (₹ crore)?", sum(r - c for r, c, e in co.values()),
         "Profits: " + ", ".join(f"{k} {r - c}" for k, (r, c, e) in co.items()) + f" → {sum(r - c for r, c, e in co.values())}."),
    tita("Profit per employee of Gamma is how many times that of Delta? (Answer to one decimal place.)",
         f"{((300-240)/600)/((900-810)/4500):.1f}", f"Gamma: 60/600 = 0.1 crore; Delta: 90/4500 = 0.02 crore → {((300-240)/600)/((900-810)/4500):.1f} times."),
  ]})

# ---------------------------------------------------------------- S13 grid (hard)
grid = []
for p in itertools.permutations(range(1, 10)):
    g = [p[0:3], p[3:6], p[6:9]]
    if any(sum(r) != 15 for r in g) or any(g[0][c] + g[1][c] + g[2][c] != 15 for c in range(3)): continue
    if g[0][0] + g[1][1] + g[2][2] != 15 or g[0][2] + g[1][1] + g[2][0] != 15: continue
    if g[0][0] == 2 and g[0][1] > g[0][2] and g[2][1] > 2: grid.append(g)
S13_WHY = ("All digits add to 45, so every line adds to 15. The four lines through the centre add to 4 × 15 = 60 = 45 + 3 × centre → centre = 5. "
           "Diagonal: 2 + 5 + (row 3, col 3) = 15 → 8. Row 1: 2 + a + b = 15 with a > b → (a, b) = (9, 4) or (7, 6). "
           "Column 2: a + 5 + c = 15 → c = 10 − a, and c > 2 → a = 7, b = 6, c = 3. The rest follows: rows (2, 7, 6), (9, 5, 1), (4, 3, 8).")
SETS.append({"title": "A 3 × 3 number grid", "d": "h", "intro": [
    "The digits 1 to 9 are placed in a 3 × 3 grid, one digit per cell, so that every row, every column and both main diagonals add up to the same total.",
    "Rows are numbered 1–3 from top to bottom and columns 1–3 from left to right.\n1. The digit in row 1, column 1 is 2.\n2. In row 1, the middle digit is larger than the right-hand digit.\n3. The digit in row 3, column 2 is greater than 2."],
  "qs": [
    tita("What digit is in the centre of the grid?", forced(grid, lambda g: g[1][1], "S13q1"), S13_WHY),
    tita("What digit is in row 3, column 3?", forced(grid, lambda g: g[2][2], "S13q2"), S13_WHY),
    mcq("What digit is in row 1, column 2?", ["7", "9", "6", "4"], str(forced(grid, lambda g: g[0][1], "S13q3")), S13_WHY),
    tita("What is the digit in row 2, column 1?", forced(grid, lambda g: g[1][0], "S13q4"), S13_WHY),
  ]})

# ---------------------------------------------------------------- S14 election with transfers (hard DI)
first = {"Kiran": 3600, "Leela": 3100, "Mohan": 2200, "Nikhil": 1100}
trans_n = {"Kiran": 400, "Leela": 300, "Mohan": 300, "exhausted": 100}
after1 = {k: first[k] + trans_n.get(k, 0) for k in ("Kiran", "Leela", "Mohan")}
trans_m = {"Kiran": 0.45, "Leela": 0.40}
mohan_votes = after1["Mohan"]
assert all(mohan_votes * int(trans_m[k] * 100) % 100 == 0 for k in trans_m), "fractional transfer"
after2 = {k: after1[k] + mohan_votes * int(trans_m[k] * 100) // 100 for k in ("Kiran", "Leela")}
valid = sum(first.values())
SETS.append({"title": "Counting rounds in an election", "d": "h", "intro": [
    "Four candidates contested an election with transferable votes. After the first count the last-placed candidate is eliminated and his votes are transferred according to voters' next preferences; the process repeats until two candidates remain.",
    table(["Candidate", "First-count votes"], [[k, v] for k, v in first.items()]),
    f"Nikhil's 1,100 votes were transferred as follows: Kiran 400, Leela 300, Mohan 300, and 100 exhausted (no further preference). In the next round, Mohan was eliminated; 45% of all his votes at that point went to Kiran, 40% to Leela and the rest were exhausted."],
  "qs": [
    tita("How many votes did Mohan have when he was eliminated?", mohan_votes, f"2,200 + 300 = {mohan_votes}."),
    mcq("Who won, and by how many votes?", [f"Kiran by {after2['Kiran']-after2['Leela']}", f"Leela by {after2['Kiran']-after2['Leela']}", f"Kiran by {after2['Kiran']-after2['Leela']+100}", f"Kiran by {after2['Kiran']-after2['Leela']-100}"],
        f"Kiran by {after2['Kiran']-after2['Leela']}", f"Kiran: 3,600 + 400 + 45% of {mohan_votes} = {after2['Kiran']}. Leela: 3,100 + 300 + 40% of {mohan_votes} = {after2['Leela']}. Margin {after2['Kiran']-after2['Leela']}."),
    tita("How many votes in total were exhausted by the end?", 100 + mohan_votes * 15 // 100,
         f"100 from Nikhil + 15% of {mohan_votes} = {100 + mohan_votes * 15 // 100}."),
    mcq("Leela's final tally was what percentage of the first-count valid votes (approximately)?", around(after2['Leela']/valid*100, lambda x: f"{x:.1f}%"), f"{after2['Leela']/valid*100:.1f}%",
        f"{after2['Leela']}/{valid} = {after2['Leela']/valid*100:.1f}%."),
  ]})

# ---------------------------------------------------------------- S15 investments (hard DI)
funds = {"Equity": (200000, [12, -8, 20]), "Debt": (300000, [7, 7, 6]), "Gold": (100000, [-5, 15, 10])}
def grow(p, rs):
    for r in rs: p = p * (100 + r) / 100
    return p
final = {k: grow(p, rs) for k, (p, rs) in funds.items()}
tot0 = sum(p for p, _ in funds.values()); tot3 = sum(final.values())
y2 = {k: grow(p, rs[:2]) for k, (p, rs) in funds.items()}
SETS.append({"title": "A three-fund portfolio", "d": "h", "intro": [
    "An investor put ₹6,00,000 into three funds at the start of Year 1 and did not withdraw or add money for three years. The table gives each fund's amount invested and its annual return (%).",
    table(["Fund", "Invested (₹)", "Year 1", "Year 2", "Year 3"], [[k, f"{p:,}", *[f"{r}%" for r in rs]] for k, (p, rs) in funds.items()])],
  "qs": [
    mcq("Which fund had the highest value at the end of Year 3 relative to the amount invested in it?", ["Equity", "Debt", "Gold", "Equity and Gold equally"],
        max(final, key=lambda k: final[k] / funds[k][0]), "Growth factors: " + ", ".join(f"{k} {final[k]/funds[k][0]:.4f}" for k in funds) + "."),
    tita("What was the total portfolio value at the end of Year 3, in ₹ (rounded to the nearest rupee)?", round(tot3),
         " + ".join(f"{k} {final[k]:,.0f}" for k in funds) + f" = {tot3:,.0f}."),
    mcq("At the end of Year 2, what share of the portfolio was in Equity (approximately)?", around(y2['Equity']/sum(y2.values())*100, lambda x: f"{x:.1f}%", (-2.4, 1.5, 3.7)), f"{y2['Equity']/sum(y2.values())*100:.1f}%",
        f"End of Year 2: Equity {y2['Equity']:,.0f}, Debt {y2['Debt']:,.0f}, Gold {y2['Gold']:,.0f} → Equity share {y2['Equity']/sum(y2.values())*100:.1f}%."),
    tita("What was the portfolio's overall return over the three years, in % (to one decimal place)?", f"{(tot3/tot0-1)*100:.1f}",
         f"{tot3:,.0f}/6,00,000 − 1 = {(tot3/tot0-1)*100:.1f}%."),
  ]})

# ---------------------------------------------------------------- export
for st in SETS:
    for qq in st["qs"]:
        if qq["o"] is not None: assert qq["a"] in qq["o"], (st["title"], qq["s"], qq["a"], qq["o"])
print("solutions per puzzle:", {"S4": len(tour), "S5": len(seat), "S6": len(sched), "S7": len(choc), "S8": len(venn), "S9": len(races), "S11": len(ages), "S13": len(grid)})
for st in SETS: print(st["d"], st["title"], [qq["a"] for qq in st["qs"]])
Path(__file__).resolve().parent.parent.joinpath("data", "new_dilr.json").write_text(json.dumps(SETS, ensure_ascii=False, indent=0), encoding="utf-8")
