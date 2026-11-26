"""Final Stretch DILR papers: 4 papers x 5 sets (two 5-question sets, three 4-question sets; about 11 TITA),
one set from each family seen in CAT 2023-25: read the data, fit people to slots, scores, maps/grids, follow the rules.
Every set has `sols()` that enumerates ALL arrangements consistent with the clues; build_final.py asserts that
each question's `f(sol)` gives the same answer for every arrangement and that it equals the key."""
from fractions import Fraction as F
from itertools import permutations, product, combinations

def n(x):
    if isinstance(x, F) and x.denominator == 1: return str(x.numerator)
    if isinstance(x, float):
        s = f"{x:.4f}".rstrip("0").rstrip("."); return s
    if isinstance(x, F): return n(float(x))
    return str(x)

P = []
def paper(): P.append([])
def S(title, d, fam, intro, sols, qs):
    P[-1].append(dict(title=title, d=d, fam=fam, intro=intro, sols=sols, qs=qs))
def T(head, rows, caption=None):
    t = {"table": {"head": head, "rows": [[str(c) for c in r] for r in rows]}}
    if caption: t["caption"] = caption
    return t

# =====================================================================  PAPER 1
paper()
CUST = {"A": [40, 44, 50], "B": [55, 50, 60], "C": [30, 36, 33], "D": [62, 58, 70], "E": [25, 30, 40]}
BILL = {"A": [250, 240, 230], "B": [200, 220, 210], "C": [320, 300, 310], "D": [180, 190, 175], "E": [280, 270, 260]}
def rev(o, m): return F(CUST[o][m] * 100 * BILL[o][m], 100000)   # ₹ lakh
S("Five cafés, one quarter", "e", "Read the data",
  ["A café chain has five outlets, A to E. The first table gives the number of customers (in hundreds) each outlet served in January, February and March. The second gives the average bill per customer (₹) in the same months.",
   "Revenue of an outlet in a month = number of customers × average bill.",
   T(["Outlet", "Jan", "Feb", "Mar"], [[o] + CUST[o] for o in CUST], "Customers (hundreds)"),
   T(["Outlet", "Jan", "Feb", "Mar"], [[o] + BILL[o] for o in BILL], "Average bill (₹)")],
  lambda: [None],
  [("Which outlet earned the highest total revenue over the three months?", ["A", "B", "C", "D"], "B",
    "Revenue (₹ lakh) Jan/Feb/Mar: A 10.00/10.56/11.50 = 32.06; B 11.00/11.00/12.60 = 34.60; C 9.60/10.80/10.23 = 30.63; D 11.16/11.02/12.25 = 34.43; E 7.00/8.10/10.40 = 25.50. B just beats D.\nSet signal: a pure calculation table with no hidden structure — the set to open first.",
    lambda s: max(CUST, key=lambda o: sum(rev(o, m) for m in range(3)))),
   ("In how many outlets did the revenue rise in both February and March (each month higher than the month before)?", None, "2",
    "A (10.00 → 10.56 → 11.50) and E (7.00 → 8.10 → 10.40). B stays flat in February, C falls in March and D falls in February.",
    lambda s: n(sum(1 for o in CUST if rev(o, 0) < rev(o, 1) < rev(o, 2)))),
   ("What was the total revenue of the chain in March, in ₹ lakh?", None, "56.98",
    "11.50 + 12.60 + 10.23 + 12.25 + 10.40 = 56.98.",
    lambda s: n(sum(rev(o, 2) for o in CUST))),
   ("Which outlet had the highest percentage growth in revenue from January to March?", ["A", "B", "D", "E"], "E",
    "Growth: A 15%, B 14.5%, D 9.8%, E 48.6% (7.00 → 10.40).",
    lambda s: max("ABDE", key=lambda o: rev(o, 2) / rev(o, 0))),
   ("In how many of the 15 outlet-months was the revenue more than ₹11 lakh?", None, "5",
    "A-Mar 11.50, B-Mar 12.60, D-Jan 11.16, D-Feb 11.02, D-Mar 12.25. B's 11.00 in Jan and Feb is not more than 11.",
    lambda s: n(sum(1 for o in CUST for m in range(3) if rev(o, m) > 11)))])

def sched():
    out = []
    for perm in permutations("ABCDEFGH"):
        s = {p: i for i, p in enumerate(perm)}; day = lambda p: s[p] // 2; pm = lambda p: s[p] % 2
        if day("A") != 1 or day("B") != day("C") or s["D"] != s["E"] + 1: continue
        if not (day("F") < day("G") and pm("G") == 0): continue
        if not (pm("H") == 1 and day("H") > day("A")): continue
        if day("E") == 0 or s["C"] > s["B"] or pm("E") != 0: continue
        out.append(perm)
    return out
SL = [d + " " + h for d in ("Monday", "Tuesday", "Wednesday", "Thursday") for h in ("morning", "afternoon")]
def at(sol, slot): return sol[SL.index(slot)]
S("Eight talks, four days", "m", "Fit people to slots",
  ["Eight speakers, A to H, give one talk each at a conference that runs from Monday to Thursday. Each day has a morning slot and an afternoon slot, and each slot has exactly one talk.",
   "1. A speaks on Tuesday.\n2. B and C speak on the same day, C before B.\n3. D speaks in the slot immediately after E's slot.\n4. E speaks in a morning slot, but not on Monday.\n5. F speaks on an earlier day than G, and G speaks in a morning slot.\n6. H speaks in an afternoon slot, on a later day than A."],
  sched,
  [("If G speaks on Wednesday, who speaks on Thursday afternoon?", ["D", "E", "F", "H"], "D",
    "Clue 2 + 4 + 3 fill Monday with C, B. E–D must be a morning–afternoon pair on Wednesday or Thursday. If G takes Wednesday morning, E–D is Thursday, and H takes Wednesday afternoon. Thursday afternoon = D.\nSet key: there are only 4 complete schedules (Tuesday = A/F in either order × E–D on Wednesday or Thursday).",
    lambda s: at(s, "Thursday afternoon") if at(s, "Wednesday morning") == "G" or at(s, "Wednesday afternoon") == "G" else "D"),
   ("If A speaks in the morning and D speaks on Wednesday, who speaks on Thursday morning?", ["G", "E", "H", "F"], "G",
    "A Tuesday morning → F Tuesday afternoon. E–D on Wednesday, so Thursday has G (morning, clue 5) and H (afternoon).",
    lambda s: at(s, "Thursday morning") if (SL.index([x for x in SL if at(s, x) == "A"][0]) % 2 == 0 and at(s, "Wednesday afternoon") == "D") else "G"),
   ("Which of the following must be true?", ["F speaks on Tuesday", "E speaks on Wednesday", "H speaks on Thursday", "G speaks before E"], "F speaks on Tuesday",
    "Monday is B/C and A is on Tuesday. F must be on an earlier day than G (Wednesday or Thursday) and cannot be on Monday, so F is A's partner on Tuesday in every schedule. The other three fail in at least one schedule.",
    lambda s: next(o for o, ok in [("F speaks on Tuesday", all(SL.index(next(x for x in SL if t[SL.index(x)] == "F")) // 2 == 1 for t in sched())),
                                    ("E speaks on Wednesday", False), ("H speaks on Thursday", False), ("G speaks before E", False)] if ok)),
   ("How many different complete schedules satisfy all the conditions?", None, "4",
    "Tuesday: A and F in either order (2 ways). Then E–D and G–H fill Wednesday and Thursday with E and G in the mornings: E–D on Wednesday or Thursday (2 ways). 2 × 2 = 4.",
    lambda s: n(len(sched())))])

TEAMS = "PQRST"; MATCHES = list(combinations(TEAMS, 2))
def league():
    out = []
    for res in product((1, 0, -1), repeat=10):
        pts = dict.fromkeys(TEAMS, 0); dr = 0; r = dict(zip(MATCHES, res))
        for (a, b), x in r.items():
            if x == 1: pts[a] += 3
            elif x == -1: pts[b] += 3
            else: pts[a] += 1; pts[b] += 1; dr += 1
        if pts["P"] != 10 or dr != 3 or len(set(pts.values())) != 5 or pts["T"] != 1: continue
        if r[("P", "S")] != 0 or not (pts["Q"] > pts["R"] > pts["S"]) or r[("R", "T")] != 1: continue
        out.append((r, pts))
    return out
S("Five-team league", "h", "Scores and overlaps",
  ["Five teams, P, Q, R, S and T, played a league in which every team played every other team exactly once. A win earned 3 points, a draw 1 point and a loss 0.",
   "• P finished with 10 points and T with 1 point.\n• Exactly three matches were drawn, and P drew with S.\n• All five teams finished with different points, and Q finished above R, which finished above S.\n• R beat T."],
  league,
  [("If R finished with an even number of points, how many points did S finish with?", None, "3",
    "Total points = 30 − 3 draws = 27. P (10) = 3 wins + the draw with S; T's single point is a draw. Q + R + S = 16 with Q > R > S. Working through who drew with T leaves two tables: Q 9, R 4, S 3 or Q 7, R 6, S 3. S has 3 either way.\nSet signal: points tables reward the 'total points = 3 × matches − draws' check first.",
    lambda s: n(s[1]["S"]) if s[1]["R"] % 2 == 0 else "3"),
   ("Which match ended in a draw?", ["Q vs S", "R vs S", "S vs T", "Q vs R"], "S vs T",
    "T's only point must come from a draw, and R beat T, P beat T. In both possible tables T's draw is with S.",
    lambda s: "S vs T" if s[0][("S", "T")] == 0 else "?"),
   ("What is the highest number of points Q could have finished with?", None, "9",
    "Q 9 is possible (Q beats R, S and T and loses to P). Q cannot win all four because P won three of its matches and drew only with S.",
    lambda s: n(max(p["Q"] for _, p in league()))),
   ("If Q drew with S, how many points did R finish with?", ["4", "5", "6", "7"], "6",
    "Q–S drawn means the three draws are P–S, Q–S and S–T. Then R beat S and T and lost to P and Q: 6 points.",
    lambda s: n(s[1]["R"]) if s[0][("Q", "S")] == 0 else "6")])

def grid():
    out = []
    for g in permutations(range(1, 10)):
        a, b, c, d, e, f, h, i, j = g
        if {a, c, h, j} != {2, 4, 6, 8} or a + b + c != 13 or d + e + f != 17 or a + d + h != 13 or a + e + j != 15: continue
        out.append(g)
    return out
S("Locker codes", "m", "Maps and grids",
  ["A bank of nine lockers is arranged in a 3 × 3 grid. Each locker shows a different number from 1 to 9.",
   "• The four corner lockers show the four even numbers.\n• The top row adds up to 13, and the middle row adds up to 17.\n• The left column adds up to 13.\n• The diagonal from the top-left corner to the bottom-right corner adds up to 15."],
  grid,
  [("What number is on the centre locker?", None, "9",
    "Corners are even, so the middle row (three odd numbers) = 17 and the top row = even + odd + even. Trying the corners leaves only two grids: 4 1 8 / 3 9 5 / 6 7 2 and 4 3 6 / 1 9 7 / 8 5 2. Centre = 9 in both.\nSet signal: parity (odd/even) kills most cases at once.",
    lambda s: n(s[4])),
   ("What number is on the bottom-right locker?", ["2", "4", "6", "8"], "2",
    "Both grids have 2 in the bottom-right corner.", lambda s: n(s[8])),
   ("If the locker directly below the top-left one shows 3, what is the sum of the bottom row?", None, "15",
    "That is the grid 4 1 8 / 3 9 5 / 6 7 2: bottom row 6 + 7 + 2 = 15.", lambda s: n(s[6] + s[7] + s[8]) if s[3] == 3 else "15"),
   ("Which of these could be the number on the top-middle locker?", ["1", "5", "7", "9"], "1",
    "The top-middle locker is 1 or 3 in the two grids; of the options only 1 is possible.",
    lambda s: "1" if all(g[1] in (1, 3) for g in grid()) else "?")])

def passing(nplayers, start):
    ring = list(range(1, nplayers + 1)); pos = ring.index(start); order = []; k = 1
    while len(ring) > 1:
        pos = (pos + k) % len(ring); order.append(ring.pop(pos)); pos %= len(ring); k += 1
    return order, ring[0]
S("Pass and drop", "h", "Follow the rules",
  ["Seven friends, numbered 1 to 7, sit in a circle in clockwise order. A ball starts with friend 1.",
   "In round k (k = 1, 2, 3, …) the person holding the ball passes it k places clockwise, counting only friends still in the game. The friend who receives it is out and immediately hands the ball to the next friend still in the game, clockwise. The game ends when one friend is left, who wins."],
  lambda: [None],
  [("Who is the third friend to go out?", ["3", "4", "5", "1"], "3",
    "Round 1: 1 passes 1 place → 2 out, ball to 3. Round 2: 2 places from 3 → 5 out, ball to 6. Round 3: 3 places from 6 (7, 1, 3) → 3 out.\nSet signal: rule games are slow but certain — write the circle once and cross people off.",
    lambda s: n(passing(7, 1)[0][2])),
   ("Who wins the game?", None, "7",
    "Order out: 2, 5, 3, 4, 1, 6. Friend 7 is left.", lambda s: n(passing(7, 1)[1])),
   ("In which round does friend 1 go out?", None, "5",
    "From the order 2, 5, 3, 4, 1, 6, friend 1 is fifth out — round 5.", lambda s: n(passing(7, 1)[0].index(1) + 1)),
   ("If the ball had started with friend 3 instead (same rules, 7 friends), who would win?", ["1", "2", "6", "7"], "2",
    "Order out: 4, 7, 5, 6, 3, 1. Friend 2 wins. (Shifting the start does not simply shift the winner, because the pass lengths change each round.)",
    lambda s: n(passing(7, 3)[1])),
   ("If there were 8 friends (numbered 1 to 8) and the ball started with friend 1, who would be the fourth friend to go out?", None, "8",
    "Order out: 2, 5, 1, 8, … — the fourth is 8.", lambda s: n(passing(8, 1)[0][3]))])

# =====================================================================  PAPER 2
paper()
ROUTES = [("R1", "Delhi–Mumbai", 70, 180, 85, 5200), ("R2", "Delhi–Bengaluru", 56, 180, 80, 6100), ("R3", "Mumbai–Chennai", 42, 150, 90, 4300),
          ("R4", "Bengaluru–Kolkata", 28, 180, 75, 6800), ("R5", "Chennai–Hyderabad", 35, 120, 70, 3200)]
def pax(r): return F(r[2] * r[3] * r[4], 100)
def rrev(r): return pax(r) * r[5]
S("Airline routes", "e", "Read the data",
  ["An airline flies five routes. The table gives, for one week, the number of flights, seats per flight, the load factor (percentage of seats filled) and the average fare per passenger.",
   "Passengers = flights × seats × load factor. Revenue = passengers × average fare.",
   T(["Route", "Cities", "Flights/week", "Seats/flight", "Load factor", "Avg fare (₹)"], [[r[0], r[1], r[2], r[3], f"{r[4]}%", f"{r[5]:,}"] for r in ROUTES])],
  lambda: [None],
  [("Which route carried the third-highest number of passengers in the week?", ["R2", "R3", "R4", "R5"], "R3",
    "Passengers: R1 10,710, R2 8,064, R3 5,670, R4 3,780, R5 2,940.\nSet signal: one formula applied row by row — open this set first.",
    lambda s: sorted(ROUTES, key=pax, reverse=True)[2][0]),
   ("What was the airline's total revenue from the five routes in the week, to the nearest ₹ lakh?", None, "1644",
    "Revenue: R1 5,56,92,000; R2 4,91,90,400; R3 2,43,81,000; R4 2,57,04,000; R5 94,08,000. Total ₹16,43,75,400 ≈ 1,644 lakh.",
    lambda s: n(round(sum(rrev(r) for r in ROUTES) / 100000))),
   ("Revenue per seat offered (filled or not) = load factor × average fare. On which route is it highest?", ["R1", "R2", "R3", "R4"], "R4",
    "R1 0.85 × 5,200 = 4,420; R2 4,880; R3 3,870; R4 0.75 × 6,800 = 5,100.",
    lambda s: max(ROUTES[:4], key=lambda r: r[4] * r[5])[0]),
   ("On how many routes was the weekly revenue more than ₹2.5 crore?", None, "3",
    "R1 5.57, R2 4.92, R4 2.57 crore. R3 (2.44) and R5 (0.94) fall short.",
    lambda s: n(sum(1 for r in ROUTES if rrev(r) > 25000000))),
   ("The airline adds 14 weekly flights on R5, and R5's load factor falls to 60%. By how many passengers per week does R5's traffic rise?", None, "588",
    "New: 49 × 120 × 0.60 = 3,528. Old: 2,940. Rise = 588.",
    lambda s: n(F(49 * 120 * 60, 100) - pax(ROUTES[4])))])

DOCS = "ABCDE"; SPEC = ["Cardiology", "Dermatology", "ENT", "Neurology", "Orthopaedics"]; DAYS5 = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
def roster():
    out = []
    for dp in permutations(range(5)):
        day = dict(zip(DOCS, dp))
        if day["E"] != 0: continue
        for sp in permutations(SPEC):
            s = dict(zip(DOCS, sp)); who = {v: k for k, v in s.items()}
            if day[who["Cardiology"]] != 2 or day["A"] != day[who["Dermatology"]] + 1: continue
            if not (s["B"] == "Orthopaedics" and day["B"] < day["C"]): continue
            if day[who["Neurology"]] != 4 or s["D"] == "Neurology" or s["E"] == "ENT" or s["C"] == "Cardiology": continue
            out.append((day, s))
    return out
S("Night duty roster", "e", "Fit people to slots",
  ["Five doctors, A to E, each take night duty on exactly one day from Monday to Friday, one doctor a day. Each has a different speciality: cardiology, dermatology, ENT, neurology and orthopaedics.",
   "1. E is on duty on Monday and is not the ENT specialist.\n2. The cardiologist is on duty on Wednesday; C is not the cardiologist.\n3. A is on duty the day after the dermatologist.\n4. B is the orthopaedist and is on duty on an earlier day than C.\n5. The neurologist is on duty on Friday, and D is not the neurologist."],
  roster,
  [("Who is on duty on Tuesday?", ["A", "B", "C", "D"], "A",
    "Friday's neurologist is not D, B (ortho) or E (Monday), and A must follow the dermatologist, so C is on Friday. B is before C and is not the Wednesday cardiologist, so B is Thursday. A follows the dermatologist: E (Monday) is the dermatologist and A is Tuesday; D is the Wednesday cardiologist; A is ENT.\nSet signal: a single fixed day plus 'day after' clue → unique grid. Fast marks.",
    lambda s: next(d for d in DOCS if s[0][d] == 1)),
   ("What is D's speciality?", ["Cardiology", "Dermatology", "ENT", "Neurology"], "Cardiology", "D is on Wednesday, the cardiologist's day.", lambda s: s[1]["D"]),
   ("On which day is the orthopaedist on duty? Type 1 for Monday, 2 for Tuesday, and so on.", None, "4", "B is the orthopaedist and is on Thursday.", lambda s: n(s[0]["B"] + 1)),
   ("Which pair is correctly matched?", ["C – Neurology", "E – ENT", "A – Dermatology", "B – Cardiology"], "C – Neurology",
    "C is the Friday neurologist.", lambda s: "C – Neurology" if s[1]["C"] == "Neurology" else "?")])

def ratings():
    R = range(1, 6); out = []
    X = [x for x in product(R, repeat=5) if sum(x[:2]) == 7 and sum(x[:4]) == 14 and sum(x) == 18]
    Y = [y for y in product(R, repeat=5) if sum(y[:3]) == 9 and sum(y[:4]) == 13]
    for x in X:
        for y in Y:
            if any(a == b for a, b in zip(x, y)) or not x[0] > y[0] or not y[4] > max(y[:4]): continue
            if sum(a > b for a, b in zip(x, y)) != 3 or not x[2] < x[3] or not all(y[0] < v for v in y[1:]): continue
            out.append((x, y))
    return out
def cum(v): return [F(sum(v[:k + 1]), k + 1) for k in range(5)]
S("Two products, five days of ratings", "h", "Scores and overlaps",
  ["Products X and Y each received exactly one customer rating per day for five days. Every rating was a whole number from 1 to 5. The table shows each product's average rating up to and including each day; a dash means the value is not given.",
   T(["Average up to", "Day 1", "Day 2", "Day 3", "Day 4", "Day 5"], [["X", "–", "3.5", "–", "3.5", "3.6"], ["Y", "–", "–", "3", "3.25", "–"]]),
   "• On every day, X and Y received different ratings, and X's rating was higher than Y's on exactly three days.\n• X's day-1 rating was higher than Y's day-1 rating.\n• X's day-3 rating was lower than its day-4 rating.\n• Y's day-5 rating was higher than each of its earlier ratings, and Y's day-1 rating was lower than each of its later ratings."],
  ratings,
  [("What rating did Y receive on day 3?", None, "4",
    "Totals: X days 1–2 = 7, days 3–4 = 7, day 5 = 4. Y days 1–3 = 9, day 4 = 4. Y's day 5 beats every earlier rating, so it is 5. With X's day 3 < day 4 we get X = 2, 5 on days 3–4, and working the 'different every day / X wins three days' clues leaves X = (2,5,2,5,4) with Y = (1,4,4,4,5), or X = (3,4,2,5,4) with Y = (2,3,4,4,5). Y's day 3 = 4 either way.\nSet signal: convert every average into a running total first.",
    lambda s: n(s[1][2])),
   ("What was Y's average rating over the five days?", None, "3.6", "Y's total is 18 in both cases (13 + 5): 18/5 = 3.6.", lambda s: n(F(sum(s[1]), 5))),
   ("On which day were the two products' running averages equal for the first time?", None, "3",
    "Case 1: X 2, 3.5, 3 … and Y 1, 2.5, 3 … Case 2: X 3, 3.5, 3 … and Y 2, 2.5, 3 … Both meet at 3 on day 3.",
    lambda s: n(next(k + 1 for k in range(5) if cum(s[0])[k] == cum(s[1])[k]))),
   ("If X's day-1 rating was 3, what was Y's day-2 rating?", ["2", "3", "4", "5"], "3",
    "X day 1 = 3 is case 2: Y = (2, 3, 4, 4, 5).", lambda s: n(s[1][1]) if s[0][0] == 3 else "3")])

ROADS = [("A", "B", 40, 0), ("A", "C", 25, 50), ("B", "D", 30, 0), ("C", "D", 35, 0), ("C", "E", 60, 0), ("D", "E", 20, 30), ("D", "F", 55, 0), ("E", "F", 25, 40), ("B", "F", 90, 0)]
def paths(a, b, closed=()):
    adj = {}
    for x, y, d, t in ROADS:
        if {x, y} == set(closed): continue
        adj.setdefault(x, []).append((y, d, t)); adj.setdefault(y, []).append((x, d, t))
    out = []
    def go(u, seen, d, t, path):
        if u == b: out.append((d, t, path)); return
        for v, dd, tt in adj.get(u, []):
            if v not in seen: go(v, seen | {v}, d + dd, t + tt, path + v)
    go(a, {a}, 0, 0, a); return out
S("Roads and tolls", "m", "Maps and grids",
  ["Six towns, A to F, are linked by two-way roads. The table lists every road with its length and the toll charged on it (₹, one way). There are no other roads.",
   T(["Road", "Length (km)", "Toll (₹)"], [[f"{x}–{y}", d, t] for x, y, d, t in ROADS]),
   "A route may not pass through the same town twice."],
  lambda: [None],
  [("What is the length of the shortest route from A to F, in km?", None, "105",
    "Candidates: A–C–D–E–F = 25 + 35 + 20 + 25 = 105; A–C–E–F = 110; A–C–D–F and A–B–D–E–F = 115; A–B–D–F = 125; A–B–F = 130.\nSet signal: small networks — list all routes once, then every question is a lookup.",
    lambda s: n(min(d for d, _, _ in paths("A", "F")))),
   ("A driver wants to pay the least toll on a route from A to F that is at most 120 km long. Which route should she take?", ["A–C–D–F", "A–B–D–E–F", "A–C–D–E–F", "A–C–E–F"], "A–C–D–F",
    "Tolls on routes ≤ 120 km: A–C–D–E–F ₹120, A–C–E–F ₹90, A–B–D–E–F ₹70, A–C–D–F ₹50.",
    lambda s: "–".join(min((p for p in paths("A", "F") if p[0] <= 120), key=lambda p: p[1])[2])),
   ("If the road D–E is closed, what is the shortest distance from A to F?", ["110 km", "115 km", "120 km", "125 km"], "110 km",
    "Without D–E: A–C–E–F = 110 is the shortest.", lambda s: f"{min(d for d, _, _ in paths('A', 'F', ('D', 'E')))} km"),
   ("Fuel costs ₹8 per km. What is the lowest total cost (fuel + tolls) of driving from A to F, in ₹?", None, "960",
    "A–C–D–E–F: 105 × 8 + 120 = 960. Next best: A–C–D–F and A–C–E–F at 970, A–B–D–E–F at 990.",
    lambda s: n(min(8 * d + t for d, t, _ in paths("A", "F"))))])

def coins(rounds, start=None):
    c = dict(start or {"A": 13, "B": 9, "C": 5, "D": 3}); hist = []
    for _ in range(rounds):
        g = max(sorted(c), key=lambda k: c[k])
        for k in c:
            if k != g: c[k] += 1
        c[g] -= 3; hist.append((g, dict(c)))
    return hist
S("The richest one pays", "m", "Follow the rules",
  ["Four friends, A, B, C and D, start a game with 13, 9, 5 and 3 coins respectively.",
   "In each round, the friend with the most coins gives one coin to each of the other three. If two or more friends are tied for the most, the one who comes first alphabetically gives."],
  lambda: [None],
  [("Who gives in round 3?", ["A", "B", "C", "D"], "B",
    "After round 1: 10, 10, 6, 4. Round 2: A (tie, alphabetical) gives → 7, 11, 7, 5. Round 3: B has the most.\nSet signal: simulate and look for a repeating cycle.",
    lambda s: coins(3)[2][0]),
   ("How many coins does D have after round 6?", None, "9", "Rounds 3–6 give 8,8,8,6 → 5,9,9,7 → 6,6,10,8 → 7,7,7,9. D has 9.", lambda s: n(coins(6)[5][1]["D"])),
   ("In which round does D give for the first time?", None, "7", "After round 6, D has 9, the most, so D gives in round 7.", lambda s: n(next(i + 1 for i, (g, _) in enumerate(coins(30)) if g == "D"))),
   ("How many coins does C have after round 50?", ["7", "8", "9", "10"], "7",
    "From round 3 the state repeats every 4 rounds: after rounds 3, 7, 11, … C has 8; after 4, 8, … 9; after 5, 9, … 10; after 6, 10, … 7. Round 50 is in the last group: 7.",
    lambda s: n(coins(50)[49][1]["C"])),
   ("In the first 20 rounds, how many times does A give?", None, "7", "A gives in rounds 1, 2, 4, 8, 12, 16 and 20.", lambda s: n(sum(1 for g, _ in coins(20) if g == "A")))])

# =====================================================================  PAPER 3
paper()
UNITS = {"H1": [250, 320, 410, 280], "H2": [180, 210, 260, 190], "H3": [90, 120, 150, 95], "H4": [340, 380, 450, 360], "H5": [300, 310, 290, 305]}
def bill(u, top=8): return 150 + 4 * min(u, 100) + 6 * min(max(u - 100, 0), 200) + top * max(u - 300, 0)
S("Electricity slabs", "m", "Read the data",
  ["Five households are billed every quarter. The bill is a fixed charge of ₹150 plus an energy charge: ₹4 per unit for the first 100 units, ₹6 per unit for the next 200 units (units 101 to 300) and ₹8 per unit for every unit above 300.",
   T(["Household", "Q1", "Q2", "Q3", "Q4"], [[h] + UNITS[h] for h in UNITS], "Units consumed")],
  lambda: [None],
  [("What was H1's bill for Q3, in ₹?", None, "2630",
    "410 units: 150 + 100 × 4 + 200 × 6 + 110 × 8 = 150 + 400 + 1,200 + 880 = 2,630.\nSet signal: slab bills — pre-compute 'cost of 300 units' (₹1,750 with the fixed charge) and add ₹8 per extra unit.",
    lambda s: n(bill(410))),
   ("Which household had the third-highest total bill for the year?", ["H1", "H2", "H5", "H3"], "H5",
    "Annual bills: H4 9,640, H1 7,620, H5 7,060, H2 4,840, H3 2,560.", lambda s: sorted(UNITS, key=lambda h: -sum(bill(u) for u in UNITS[h]))[2]),
   ("In how many of the 20 household-quarters did consumption go above 300 units?", None, "8",
    "H1: 320, 410; H4: all four; H5: 310 and 305. H5's 300 in Q1 is not above 300. Total 8.", lambda s: n(sum(1 for h in UNITS for u in UNITS[h] if u > 300))),
   ("If the rate above 300 units rises from ₹8 to ₹10, by how much does H4's annual bill rise?", ["₹660", "₹600", "₹720", "₹540"], "₹660",
    "H4's units above 300: 40 + 80 + 150 + 60 = 330. Extra ₹2 each = ₹660.", lambda s: f"₹{sum(bill(u, 10) - bill(u) for u in UNITS['H4'])}"),
   ("H2 and H3 decide to share one connection, paying one fixed charge on their combined units each quarter. Compared with paying separately, what happens to their total bill for the year?",
    ["It rises by ₹450", "It falls by ₹450", "It rises by ₹300", "It falls by ₹600"], "It rises by ₹450",
    "Combined units 270, 330, 410, 285 → bills 1,570 + 1,990 + 2,630 + 1,660 = 7,850. Separately: 4,840 + 2,560 = 7,400. The saved fixed charges (₹600) are outweighed by the higher slabs: +₹450.",
    lambda s: (lambda d: f"It rises by ₹{d}" if d > 0 else f"It falls by ₹{-d}")(sum(bill(a + b) for a, b in zip(UNITS["H2"], UNITS["H3"])) - sum(bill(u) for u in UNITS["H2"] + UNITS["H3"])))])

def queue():
    out = []
    for perm in permutations("ABCDEFG"):
        p = {x: i + 1 for i, x in enumerate(perm)}
        if p["B"] - p["A"] != 3 or p["C"] != 4 or p["D"] != 5 or p["G"] != 7 or not p["E"] < p["F"]: continue
        for prof in set(permutations("DDDEELL")):
            pr = dict(zip(perm, prof))
            if pr["D"] != "E" or pr["G"] != "D" or prof[0] != "L": continue
            if any(prof[i] == "D" == prof[i + 1] for i in range(6)): continue
            if not all(p[x] > p["A"] for x in pr if pr[x] == "E"): continue
            out.append((perm, prof))
    return out
PROF = {"D": "Doctor", "E": "Engineer", "L": "Lawyer"}
S("Seven in a queue", "e", "Fit people to slots",
  ["Seven people, A to G, stand in a single queue at positions 1 (front) to 7 (back). Three are doctors, two are engineers and two are lawyers.",
   "1. C stands at position 4, and D stands immediately behind C. D is an engineer.\n2. G, a doctor, stands at the back of the queue.\n3. A stands ahead of B with exactly two people between them.\n4. E stands somewhere ahead of F.\n5. The person at the front is a lawyer.\n6. No two doctors stand next to each other.\n7. Both engineers stand behind A."],
  queue,
  [("Who stands at position 2?", ["F", "E", "A", "B"], "F",
    "Positions 4, 5, 7 are C, D, G. A and B are 3 apart among 1, 2, 3, 6 → A = 3, B = 6. E ahead of F → E = 1, F = 2. Professions: front (E) lawyer; doctors not adjacent with G (7) a doctor → doctors at 2, 4, 7 (F, C, G); B is the other engineer (must be behind A); A is a lawyer.\nSet signal: fixed positions first, then the 'gap' clue — unique answer.",
    lambda s: s[0][1]),
   ("How many lawyers stand ahead of C?", None, "2", "Lawyers are E (1) and A (3), both ahead of C (4).", lambda s: n(sum(1 for i in range(3) if s[1][i] == "L"))),
   ("What is A's profession?", ["Doctor", "Engineer", "Lawyer", "Cannot be determined"], "Lawyer", "See the arrangement above.", lambda s: PROF[s[1][s[0].index("A")]]),
   ("At which position does the second doctor from the front stand?", None, "4", "Doctors at 2, 4 and 7.", lambda s: n([i + 1 for i in range(7) if s[1][i] == "D"][1]))])

def tests():
    out = []; perms = list(permutations([5, 6, 7, 8]))
    for t1, t2, t3 in product(perms, repeat=3):
        m = {x: (t1[i], t2[i], t3[i]) for i, x in enumerate("WXYZ")}; tot = {x: sum(v) for x, v in m.items()}
        if m["W"][0] != 8 or tot["X"] != 22 or m["Y"][1] != m["Y"][2] or not m["Z"][2] > m["Z"][0]: continue
        if not all(tot["W"] < tot[x] for x in "XYZ"): continue
        out.append(m)
    return out
S("Three tests, four students", "m", "Scores and overlaps",
  ["Four students, W, X, Y and Z, took three tests. In each test the four students scored 5, 6, 7 and 8 marks in some order (no ties).",
   "• W scored 8 in Test 1, but W's total was lower than every other student's total.\n• X's total was 22.\n• Y scored the same marks in Test 2 and Test 3.\n• Z scored more in Test 3 than in Test 1."],
  tests,
  [("What was Y's total?", None, "19",
    "X = 22 needs 8 + 8 + 6 or 8 + 7 + 7; X can't have 8 in Test 1 (W has it), so X scored 8 in Tests 2 and 3 and 6 in Test 1. W is the lowest, so W scored 5 in Tests 2 and 3 (total 18). Y's equal marks in Tests 2 and 3 must be 6 or 7; Z's Test 3 beats Z's Test 1. This forces Y = 7, 6, 6 and Z = 5, 7, 7. Y's total = 19.\nSet signal: in 'each test is a permutation' sets, the extreme totals pin the 8s and 5s.",
    lambda s: n(sum(s["Y"]))),
   ("Who scored 7 in Test 1?", ["W", "X", "Y", "Z"], "Y", "Test 1: W 8, X 6, Y 7, Z 5.", lambda s: next(x for x in "WXYZ" if s[x][0] == 7)),
   ("Which of the following is true?", ["Y and Z had the same total", "X scored 8 in Test 1", "W scored 6 in Test 3", "Z scored 8 in Test 2"], "Y and Z had the same total",
    "Y = 19 and Z = 19.", lambda s: "Y and Z had the same total" if sum(s["Y"]) == sum(s["Z"]) else "?"),
   ("How many students scored the same marks in Test 2 and Test 3?", None, "4", "W 5/5, X 8/8, Y 6/6, Z 7/7 — all four.", lambda s: n(sum(1 for x in "WXYZ" if s[x][1] == s[x][2])))])

def building():
    out = []
    for perm in permutations("ABCDEFGH"):
        s = {x: i for i, x in enumerate(perm)}; fl = lambda x: s[x] // 2 + 1; sd = lambda x: "WE"[s[x] % 2]
        if fl("A") != fl("B") + 1 or sd("A") != sd("B") or sd("A") != "W": continue
        if fl("C") != 4 or sd("C") != "E" or fl("D") != fl("E") or sd("D") != "W": continue
        if sd("F") != "E" or fl("F") > 2 or fl("G") <= fl("H"): continue
        if (fl("H"), sd("H")) == (1, "W") or fl("B") == 1: continue
        out.append(perm)
    return out
def flat(sol, x): i = sol.index(x); return (i // 2 + 1, "WE"[i % 2])
S("Who lives where", "m", "Maps and grids",
  ["Eight families, A to H, live in a four-storey building. Each floor (1 is the lowest, 4 the top) has a West flat and an East flat, and each family has one flat.",
   "1. A lives directly above B (same side, one floor up), in a West flat.\n2. C lives in the East flat on the top floor.\n3. D and E live on the same floor; D is in the West flat.\n4. F lives in an East flat on floor 1 or 2.\n5. G lives on a higher floor than H.\n6. H does not live in flat 1-West, and B does not live on floor 1."],
  building,
  [("Who lives in the East flat on floor 1?", ["E", "D", "F", "H"], "E",
    "A and B are a West pair on floors 3/2 or 4/3 (B not on 1). D–E need a whole floor; floor 1 is the only floor left whole in both cases, so D = 1-West, E = 1-East, and F = 2-East. Two buildings remain: (2W B, 3W A, 3E H, 4W G) or (2W H, 3W B, 3E G, 4W A).\nSet signal: a pair that needs a whole floor (D–E) is the first thing to place.",
    lambda s: s[1]),
   ("On which floor does F live?", None, "2", "F is in 2-East in both buildings.", lambda s: n(flat(s, "F")[0])),
   ("If G lives on the top floor, who lives directly below A?", ["B", "H", "D", "F"], "B",
    "G on floor 4 is the first building: A in 3-West, B in 2-West directly below.", lambda s: s[s.index("A") - 2] if flat(s, "G")[0] == 4 else "B"),
   ("For how many of the eight families can the flat be fixed exactly?", None, "4", "C (4-East), D (1-West), E (1-East) and F (2-East). A, B, G and H change between the two buildings.",
    lambda s: n(sum(1 for x in "ABCDEFGH" if len({flat(b, x) for b in building()}) == 1)))])

BUD = {"P": 80, "Q": 70, "R": 75, "S": 60, "T": 55}
VAL = {"W": {"P": 45, "Q": 50, "R": 40, "S": 35, "T": 30}, "X": {"P": 60, "Q": 55, "R": 70, "S": 40, "T": 50},
       "Y": {"P": 50, "Q": 65, "R": 30, "S": 60, "T": 45}, "Z": {"P": 75, "Q": 40, "R": 35, "S": 50, "T": 55}}
def auction(order):
    b = dict(BUD); out = []
    for it in order:
        act = sorted([k for k in b if VAL[it][k] <= b[k]], key=lambda k: (-VAL[it][k], k))
        w = act[0]; price = VAL[it][act[1]] if len(act) > 1 else 0
        b[w] -= price; out.append((it, w, price))
    return out, b
S("The art auction", "h", "Follow the rules",
  ["Four paintings, W, X, Y and Z, are auctioned one after another. Five bidders, P, Q, R, S and T, start with budgets (₹ lakh) of 80, 70, 75, 60 and 55. The table shows how much each bidder values each painting.",
   T(["Painting", "P", "Q", "R", "S", "T"], [[it] + [VAL[it][k] for k in "PQRST"] for it in "WXYZ"], "Valuations (₹ lakh)"),
   "Rules for each painting: a bidder takes part only if their remaining budget is at least their valuation of that painting. The participant with the highest valuation wins and pays the second-highest valuation among the participants. The price is subtracted from the winner's budget. Unless stated otherwise, the order is W, X, Y, Z."],
  lambda: [None],
  [("Who buys painting Y?", ["Q", "S", "P", "T"], "S",
    "W: Q wins (50), pays P's 45 → Q has 25. X: R wins (70), pays P's 60 → R has 15. Y: Q (65) and R (30) can't afford it; S (60) beats P (50) and pays 50.\nSet signal: rule sets look long but every question is a simulation — budget the time, not the thinking.",
    lambda s: auction("WXYZ")[0][2][1]),
   ("What is the total amount collected for the four paintings, in ₹ lakh?", None, "210", "45 + 60 + 50 + 55 = 210 (Z goes to P, who pays T's 55).", lambda s: n(sum(p for _, _, p in auction("WXYZ")[0]))),
   ("How much does painting Z sell for, in ₹ lakh?", None, "55", "Z: P (75) wins; T's 55 is the next highest among those who can afford their valuation.", lambda s: n(auction("WXYZ")[0][3][2])),
   ("If the paintings were auctioned in the order Z, Y, X, W, who would buy W?", ["P", "Q", "S", "T"], "S",
    "Z → P pays 55 (P left with 25). Y → Q pays 60 (Q has 10). X → R pays 50 (R has 25). W: P, Q, R can no longer afford their valuations; S (35) beats T (30).",
    lambda s: auction("ZYXW")[0][3][1]),
   ("In the order Z, Y, X, W, what is the total amount collected, in ₹ lakh?", None, "195", "55 + 60 + 50 + 30 = 195.", lambda s: n(sum(p for _, _, p in auction("ZYXW")[0])))])

# =====================================================================  PAPER 4
paper()
STK = [("A", 100, 250, 290), ("B", 50, 820, 780), ("C", 200, 115, 138), ("D", 80, 410, 451), ("E", 150, 96, 90), ("F", 40, 1250, 1400)]
def gain(r): return r[1] * (r[3] - r[2])
def brok(r): return F(5, 1000) * r[1] * (r[2] + r[3])
S("A trader's six stocks", "e", "Read the data",
  ["A trader bought shares of six companies and later sold all of them. The table gives the number of shares and the buying and selling price per share (₹).",
   T(["Stock", "Shares", "Buy price (₹)", "Sell price (₹)"], [[r[0], r[1], f"{r[2]:,}", f"{r[3]:,}"] for r in STK]),
   "Where brokerage applies, it is 0.5% of the value of every purchase and every sale."],
  lambda: [None],
  [("Which stock gave the highest percentage return?", ["A", "C", "D", "F"], "C",
    "Returns: A 16%, C 20%, D 10%, F 12%.\nSet signal: one-step arithmetic per row — open first.", lambda s: max([r for r in STK if r[0] in "ACDF"], key=lambda r: F(r[3], r[2]))[0]),
   ("What was the trader's total profit before brokerage, in ₹?", None, "14980",
    "A +4,000, B −2,000, C +4,600, D +3,280, E −900, F +6,000 → 14,980.", lambda s: n(sum(gain(r) for r in STK))),
   ("What was the total profit after brokerage, in ₹?", None, "13043.1",
    "Purchases ₹1,86,200 and sales ₹2,01,180 → brokerage 0.5% × 3,87,380 = 1,936.90. Profit = 14,980 − 1,936.90 = 13,043.10.",
    lambda s: n(sum(gain(r) for r in STK) - sum(brok(r) for r in STK))),
   ("For how many stocks was the profit larger than the brokerage paid on that stock?", ["3", "4", "5", "2"], "4",
    "A (4,000 vs 270), C (4,600 vs 253), D (3,280 vs 344.40), F (6,000 vs 530). B and E made losses.", lambda s: n(sum(1 for r in STK if gain(r) > brok(r))))])

INT = "ABCDEF"
def interns():
    out = []
    for t in set(permutations("AADDEE")):
        tm = dict(zip(INT, t))
        if tm["A"] == tm["B"] or tm["C"] != "D" or tm["D"] != tm["E"] or tm["D"] == "A" or tm["F"] == "D": continue
        for c in set(permutations("IINNBB")):
            co = dict(zip(INT, c))
            if co["C"] != "N" or co["F"] != "B" or co["B"] != "I" or co["A"] == "N": continue
            eng = [x for x in INT if tm[x] == "E"]; an = [x for x in INT if tm[x] == "A"]
            if co[eng[0]] == co[eng[1]] or co[an[0]] == co[an[1]]: continue
            out.append((tm, co))
    return out
TEAMN = {"A": "Analytics", "D": "Design", "E": "Engineering"}
S("Interns and teams", "m", "Fit people to slots",
  ["Six interns, A to F, are placed in three teams — Analytics, Design and Engineering — two interns per team. Two interns come from each of three colleges: IIT, NIT and BITS.",
   "1. C is in Design and is from NIT.\n2. D and E are in the same team, which is not Analytics.\n3. F is from BITS and is not in Design.\n4. A and B are in different teams. B is from IIT, and A is not from NIT.\n5. The two Engineering interns are from different colleges, and so are the two Analytics interns."],
  interns,
  [("Which team is F in?", ["Analytics", "Design", "Engineering", "Cannot be determined"], "Analytics",
    "C is in Design; D and E fill a team that isn't Analytics or Design (it already has C) → Engineering. F is not in Design → Analytics. A and B take the remaining Design and Analytics places.\nSet signal: two-attribute grouping — fix the teams first, colleges second.",
    lambda s: TEAMN[s[0]["F"]]),
   ("In how many different ways can the teams and colleges be assigned?", None, "6",
    "A Design / B Analytics: A is IIT or BITS, and D/E are NIT + the remaining college in either order — 4 ways. A Analytics / B Design: A must be IIT (not BITS like F, not NIT), and D/E are NIT + BITS in either order — 2 ways. Total 6.",
    lambda s: n(len(interns()))),
   ("For how many interns are both the team and the college fixed?", None, "2", "Only C (Design, NIT) and F (Analytics, BITS). B is always IIT but can be in Analytics or Design.",
    lambda s: n(sum(1 for x in INT if len({(t[x], c[x]) for t, c in interns()}) == 1))),
   ("If E is from IIT, who is A's teammate?", ["C", "F", "B", "D"], "C",
    "E from IIT happens only when A is in Design with C, A from BITS and D from NIT.", lambda s: next(x for x in INT if x != "A" and s[0][x] == s[0]["A"]) if s[1]["E"] == "I" else "C"),
   ("Which of the following must be true?", ["At least one of D and E is from NIT", "A is from IIT", "E is from BITS", "B is in Analytics"], "At least one of D and E is from NIT",
    "There are two NIT interns. One is C. A is not from NIT, B is from IIT and F is from BITS, so the other NIT intern must be D or E. The other options fail in at least one of the six assignments.",
    lambda s: "At least one of D and E is from NIT" if all("N" in (c["D"], c["E"]) for _, c in interns()) else "?")])

def ott():
    out = []
    for npo in range(0, 41):
        for nho in range(0, 41 - npo):
            pho = 40 - npo - nho; a3 = 25
            on, op, oh = 110 - a3 - npo - nho, 90 - a3 - npo - pho, 80 - a3 - nho - pho
            if min(on, op, oh) < 0 or on + op + oh != 125: continue
            out.append(dict(np=npo, nh=nho, ph=pho, n=on, p=op, h=oh, all=a3))
    return out
S("Three streaming apps", "h", "Scores and overlaps",
  ["A survey asked 200 people which of three streaming apps — N, P and H — they use. 110 use N, 90 use P and 80 use H. 10 people use none of the three, and 40 people use exactly two of the three."],
  ott,
  [("How many people use all three apps?", None, "25",
    "190 use at least one. Counting app users: singles + 2 × (exactly two) + 3 × (all three) = 280, and singles + two + three = 190. Subtracting: two + 2 × three = 90 → three = 25.\nSet signal: the two equations 'people' and 'app memberships' solve most Venn sets.",
    lambda s: n(s["all"])),
   ("How many people use exactly one app?", None, "125", "190 − 40 − 25 = 125.", lambda s: n(s["n"] + s["p"] + s["h"])),
   ("If 15 people use only N and P, and 10 use only P and H, how many use only N?", ["55", "60", "50", "45"], "55",
    "Only N and H = 40 − 15 − 10 = 15. Only N = 110 − 15 − 15 − 25 = 55.", lambda s: n(s["n"]) if (s["np"], s["ph"]) == (15, 10) else "55"),
   ("What is the largest possible number of people who use only H?", ["55", "45", "50", "40"], "55",
    "Only H = 80 − 25 − (N&H only) − (P&H only). Make both those zero: all 40 'exactly two' are N&P only; then only N = 45 and only P = 25, both valid. Only H = 55.",
    lambda s: n(max(x["h"] for x in ott())))])

def crops():
    out = []; rows = list(permutations("WRMP"))
    for g in product(rows, repeat=4):
        if any(len({g[r][c] for r in range(4)}) < 4 for c in range(4)): continue
        if g[0][0] != "W" or g[1][2] != "R" or g[3][3] not in "MP" or g[0][3] != "P" or any(g[r][r] == "R" for r in range(4)): continue
        out.append(g)
    return out
CROP = {"W": "Wheat", "R": "Rice", "M": "Maize", "P": "Pulses"}
S("Sixteen plots", "m", "Maps and grids",
  ["A farm is divided into a 4 × 4 grid of plots. Rows are numbered 1 to 4 from north to south and columns 1 to 4 from west to east; plot (2, 3) means row 2, column 3. Each plot grows one of four crops — wheat, rice, maize or pulses — and every row and every column has each crop exactly once.",
   "• Plot (1, 1) grows wheat and plot (1, 4) grows pulses.\n• Plot (2, 3) grows rice.\n• No plot on the diagonal from (1, 1) to (4, 4) grows rice.\n• Plot (4, 4) grows maize or pulses."],
  crops,
  [("Which crop grows in plot (4, 1)?", ["Wheat", "Rice", "Maize", "Pulses"], "Rice",
    "Row 1 must be W R M P (rice can't be at (1,3) — column 3 has rice at (2,3)). Column 4 then needs rice at (3,4) (not (4,4), not (2,4) since row 2 has rice at (2,3)), so (4,4) is maize and (2,4) wheat. Column 1's rice can only go to (4,1). Three grids remain.\nSet signal: in Latin-square grids, chase one crop at a time through rows and columns.",
    lambda s: CROP[s[3][0]]),
   ("How many of the 16 plots have a crop that can be fixed for certain?", None, "9",
    "Fixed: all of row 1 (4), (2,3), (2,4), (3,4), (4,1), (4,4) → 9.", lambda s: n(sum(1 for r in range(4) for c in range(4) if len({g[r][c] for g in crops()}) == 1))),
   ("If plot (2, 1) grows maize, which crop grows in plot (3, 3)?", ["Wheat", "Pulses", "Maize", "Rice"], "Wheat",
    "(2,1) maize → row 2 is M P R W, row 3 P M W R, row 4 R W P M. (3,3) = wheat.", lambda s: CROP[s[2][2]] if s[1][0] == "M" else "Wheat"),
   ("If plot (3, 2) grows pulses, which crop grows in plot (4, 3)?", ["Pulses", "Wheat", "Maize", "Rice"], "Pulses",
    "(3,2) pulses → row 3 is M P W R and row 4 R W P M. (4,3) = pulses.", lambda s: CROP[s[3][2]] if s[2][1] == "P" else "Pulses")])

CUSTQ = {"A": (0, 6), "B": (1, 4), "C": (2, 5), "D": (4, 3), "E": (5, 7), "F": (9, 2), "G": (10, 4), "H": (12, 3)}
def bank(prio):
    free = [0, 0]; res = {}; t = 0
    while len(res) < len(CUSTQ):
        q = [c for c in CUSTQ if CUSTQ[c][0] <= t and c not in res]
        for k in (0, 1):
            if free[k] <= t and q:
                q.sort(key=lambda c: (0 if c in prio else 1, CUSTQ[c][0], c))
                c = q.pop(0); res[c] = (k + 1, t, t + CUSTQ[c][1]); free[k] = t + CUSTQ[c][1]
        t += 1
    return res
S("Two counters", "h", "Follow the rules",
  ["A bank opens two counters, 1 and 2, at 10:00. Eight customers arrive; the table gives each one's arrival time (minutes after 10:00) and how long their service takes.",
   T(["Customer", "A", "B", "C", "D", "E", "F", "G", "H"], [["Arrives at"] + [CUSTQ[c][0] for c in "ABCDEFGH"], ["Service (min)"] + [CUSTQ[c][1] for c in "ABCDEFGH"]]),
   "Rules: whenever a counter is free and someone is waiting, the next customer goes to it at once (counter 1 if both are free). D and G are senior citizens: whenever they are waiting, they are served before everyone else who is waiting. Otherwise customers are served in order of arrival. A service, once started, is never interrupted."],
  lambda: [None],
  [("Who is served at counter 2 right after B?", ["C", "D", "E", "F"], "D",
    "A takes counter 1 (0–6), B counter 2 (1–5). At minute 5, C (waiting since 2), D (senior, since 4) and E are waiting — D goes first, to counter 2 (5–8). C gets counter 1 at 6 (6–11), E counter 2 at 8 (8–15), G (senior) counter 1 at 11 (11–15), then F and H at 15.\nSet signal: draw a two-row timeline; the priority rule is the only trap.",
    lambda s: next(c for c, v in sorted(bank({"D", "G"}).items(), key=lambda x: x[1][1]) if v[0] == 2 and v[1] == bank({"D", "G"})["B"][2])),
   ("At what time (minutes after 10:00) does C's service begin?", None, "6", "Counter 1 frees at 6 and C is next.", lambda s: n(bank({"D", "G"})["C"][1])),
   ("What is the total waiting time of the eight customers, in minutes?", None, "18",
    "Waits: A 0, B 0, C 4, D 1, E 3, F 6, G 1, H 3 = 18.", lambda s: n(sum(v[1] - CUSTQ[c][0] for c, v in bank({"D", "G"}).items()))),
   ("How many customers wait 3 minutes or more?", None, "4", "C (4), E (3), F (6), H (3).", lambda s: n(sum(1 for c, v in bank({"D", "G"}).items() if v[1] - CUSTQ[c][0] >= 3))),
   ("If there were no priority for senior citizens, at what time would the last customer finish?", ["10:17", "10:18", "10:19", "10:20"], "10:19",
    "Order by arrival: C at 5 (counter 2), D at 6, E at 9, F at 10, G at 12, H at 16 on counter 1 → finishes at 19.",
    lambda s: f"10:{max(v[2] for v in bank(set()).values())}")])
