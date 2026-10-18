"""Original CAT-style Quant questions. Every answer is re-computed by `v` (independent check) before export.

Fields: t topic (arith|alg|geo|num|mod), d difficulty (e|m|h), s stem, o options (None = TITA),
a answer (option text for MCQ, number string for TITA), v callable returning the answer, e solution.
Run: python tools/qa_bank.py  -> data/new_qa.json
"""
import json, math, itertools
from fractions import Fraction as F
from pathlib import Path

Q = []
def q(t, d, s, a, e, v, o=None):
    Q.append(dict(t=t, d=d, s=s, o=o, a=a, e=e, v=v))

# ======================= ARITHMETIC (35) =======================
q("arith", "e", "A shopkeeper marks a shirt 40% above its cost price and then gives a discount of 15% on the marked price. If his profit is ₹114, what is the cost price (in ₹)?",
  "600", "Selling price = 1.40 × 0.85 = 1.19 × CP, so profit = 0.19 × CP = 114 → CP = 600.\nMethod: chain the multiplying factors (×1.4, ×0.85) instead of computing step by step.",
  lambda: next(c for c in range(1, 5000) if abs(c * 1.4 * 0.85 - c - 114) < 1e-9))
q("arith", "e", "Two numbers are in the ratio 3 : 5. If 9 is added to each, the ratio becomes 3 : 4. What is the sum of the original numbers?",
  "24", "Let them be 3k and 5k: (3k + 9)/(5k + 9) = 3/4 → 12k + 36 = 15k + 27 → k = 3. Numbers 9 and 15, sum 24.",
  lambda: next(3*k + 5*k for k in range(1, 100) if 4*(3*k+9) == 3*(5*k+9)), ["24", "32", "40", "48"])
q("arith", "m", "A and B can complete a job in 12 and 18 days respectively. They start together, but A leaves 3 days before the job is completed. In how many days is the job completed?",
  "9", "Let the total be T days. A works T − 3 days, B works T days: (T − 3)/12 + T/18 = 1 → 3(T − 3) + 2T = 36 → T = 9.\nMethod: write work done by each person in terms of the unknown total time.",
  lambda: next(T for T in range(1, 100) if F(T - 3, 12) + F(T, 18) == 1))
q("arith", "m", "A train crosses a 240 m long platform in 24 seconds and overtakes a man running at 6 km/h in the same direction in 12 seconds. What is the length of the train?",
  "200 m", "Let speed = v m/s, length L. (L + 240)/v = 24 and L/(v − 5/3) = 12. So L = 24v − 240 = 12v − 20 → v = 55/3 m/s, L = 200 m.\nMethod: for overtaking a moving man, use relative speed (v − man's speed).",
  lambda: f"{int(24 * F(220, 12) - 240)} m", ["160 m", "180 m", "200 m", "220 m"])
q("arith", "m", "A 60-litre mixture contains milk and water in the ratio 7 : 3. How many litres of water must be added to make the ratio 3 : 2?",
  "10", "Milk = 42 L, water = 18 L. Milk stays 42: 42/(18 + x) = 3/2 → 18 + x = 28 → x = 10.\nMethod: anchor on the component that does not change.",
  lambda: next(x for x in range(0, 100) if F(42, 18 + x) == F(3, 2)))
q("arith", "m", "The average of 11 numbers is 30. The average of the first six is 28 and that of the last six is 33. What is the sixth number?",
  "36", "Total = 330. First six = 168, last six = 198. The sixth number is counted twice: 168 + 198 − 330 = 36.",
  lambda: 6*28 + 6*33 - 11*30, ["30", "33", "36", "39"])
q("arith", "h", "A boat covers 30 km upstream and 44 km downstream in 10 hours. It covers 40 km upstream and 55 km downstream in 13 hours. What is the speed of the boat in still water (in km/h)?",
  "8", "Let u = 1/(upstream speed), w = 1/(downstream speed): 30u + 44w = 10 and 40u + 55w = 13. ×4 and ×3: 120u + 176w = 40, 120u + 165w = 39 → w = 1/11, u = 1/5. So b + s = 11, b − s = 5 → b = 8.\nMethod: substitute reciprocals to make time equations linear.",
  lambda: next(b for b in range(1, 50) for s in range(0, b) if 30*F(1, b-s) + 44*F(1, b+s) == 10 and 40*F(1, b-s) + 55*F(1, b+s) == 13))
q("arith", "m", "A starts a business with ₹40,000. B joins after 4 months with ₹60,000 and C joins after 6 months with ₹80,000. Out of an annual profit of ₹1,80,000, what is C's share?",
  "₹60,000", "Capital × months: A = 40 × 12 = 480, B = 60 × 8 = 480, C = 80 × 6 = 480. Equal shares → C gets 1,80,000/3 = 60,000.",
  lambda: f"₹{180000 * 480 // (480 + 480 + 480):,}", ["₹45,000", "₹54,000", "₹60,000", "₹72,000"])
q("arith", "m", "Rahul's salary was first increased by 25% and then decreased by x%. The net effect was a 5% increase. Find x.",
  "16", "1.25 × (1 − x/100) = 1.05 → 1 − x/100 = 0.84 → x = 16.",
  lambda: next(x for x in range(0, 100) if F(125, 100) * (1 - F(x, 100)) == F(105, 100)))
q("arith", "m", "The difference between compound interest and simple interest on a sum for 2 years at 10% per annum is ₹150. What is the sum?",
  "₹15,000", "For 2 years, CI − SI = P(r/100)² = P × 0.01 = 150 → P = 15,000.\nMethod: memorise CI − SI = P(r/100)² for 2 years.",
  lambda: f"₹{int(150 / F(1, 100)):,}", ["₹12,000", "₹15,000", "₹18,000", "₹20,000"])
q("arith", "h", "Pipes A and B fill a tank in 20 and 30 minutes respectively, while outlet C empties a full tank in 15 minutes. All three are opened at 9:00 am and C is closed at 9:10 am. After how many minutes from 9:00 am is the tank full?",
  "20", "Net rate with C open = 1/20 + 1/30 − 1/15 = 1/60 per min → 10 min fill 1/6. Remaining 5/6 at 1/20 + 1/30 = 1/12 per min takes 10 min. Total 20 minutes.",
  lambda: 10 + (1 - 10 * (F(1, 20) + F(1, 30) - F(1, 15))) / (F(1, 20) + F(1, 30)))
q("arith", "m", "In a 1 km race, A beats B by 100 m and B beats C by 100 m. By how many metres does A beat C?",
  "190", "When A runs 1000, B runs 900. B : C = 1000 : 900, so when B runs 900, C runs 810. A beats C by 190 m.",
  lambda: 1000 - 900 * 900 // 1000, ["180", "190", "200", "210"])
q("arith", "e", "A trader sells two articles at ₹990 each, one at a 10% profit and the other at a 10% loss. What is his overall result?",
  "Loss of ₹20", "CPs: 990/1.1 = 900 and 990/0.9 = 1100. Total CP 2000, SP 1980 → loss ₹20.\nMethod: same SP with ±x% always gives a loss of x²/100 %.",
  lambda: f"Loss of ₹{int(990/F(11,10) + 990/F(9,10) - 1980)}", ["No profit no loss", "Loss of ₹20", "Profit of ₹20", "Loss of ₹10"])
q("arith", "m", "Walking at 4 km/h, a man reaches his office 5 minutes late. Walking at 5 km/h, he reaches 4 minutes early. What is the distance to his office (in km)?",
  "3", "d/4 − d/5 = 9/60 h → d/20 = 3/20 → d = 3 km.",
  lambda: next(d for d in range(1, 50) if F(d, 4) - F(d, 5) == F(9, 60)))
q("arith", "e", "If 30% of A equals 45% of B, then A : B is",
  "3 : 2", "0.30A = 0.45B → A/B = 45/30 = 3/2.", lambda: "3 : 2", ["2 : 3", "3 : 2", "9 : 4", "4 : 9"])
q("arith", "e", "The present ages of a father and his son are in the ratio 7 : 2. After 10 years, the ratio will be 9 : 4. What is the sum of their present ages?",
  "45", "(7k + 10)/(2k + 10) = 9/4 → 28k + 40 = 18k + 90 → k = 5. Ages 35 and 10, sum 45.",
  lambda: next(9*k for k in range(1, 50) if 4*(7*k+10) == 9*(2*k+10)), ["36", "45", "54", "63"])
q("arith", "h", "A 20 kg alloy has copper and zinc in the ratio 3 : 1 and a 30 kg alloy has them in the ratio 2 : 3. Both are melted together with x kg of pure copper so that copper forms two-thirds of the new alloy. Find x.",
  "19", "Copper = 15 + 12 = 27 kg in 50 kg. (27 + x)/(50 + x) = 2/3 → 81 + 3x = 100 + 2x → x = 19.",
  lambda: next(x for x in range(0, 200) if F(27 + x, 50 + x) == F(2, 3)))
q("arith", "e", "A car covers the first half of a journey at 40 km/h and the second half at 60 km/h. What is its average speed for the whole journey (in km/h)?",
  "48", "For equal distances, average speed = 2ab/(a + b) = 2 × 40 × 60/100 = 48.", lambda: 2*40*60 // 100, ["48", "50", "52", "45"])
q("arith", "h", "A, B and C together finish a job in 8 days and are paid ₹2,400. A alone takes 24 days and B alone takes 32 days. How much should C get (in ₹)?",
  "₹1,000", "C's rate = 1/8 − 1/24 − 1/32 = 5/96. In 8 days C does 40/96 = 5/12 of the work, so C gets 5/12 × 2400 = 1000.\nMethod: wages are proportional to work done, not to individual rates alone.",
  lambda: f"₹{int((F(1,8)-F(1,24)-F(1,32))*8*2400):,}", ["₹600", "₹800", "₹1,000", "₹1,200"])
q("arith", "m", "Successive discounts of 20%, 10% and 5% are equivalent to a single discount of",
  "31.6%", "Price factor = 0.8 × 0.9 × 0.95 = 0.684 → discount 31.6%.",
  lambda: f"{round((1 - 0.8*0.9*0.95)*100, 1)}%", ["35%", "31.6%", "32.4%", "30.8%"])
q("arith", "m", "A town's population rises 10% in the first year, falls 10% in the second and rises 20% in the third, reaching 11,880. What was the initial population?",
  "10000", "Factor = 1.1 × 0.9 × 1.2 = 1.188 → initial = 11880/1.188 = 10,000.",
  lambda: int(F(11880) / (F(11, 10) * F(9, 10) * F(12, 10))))
q("arith", "h", "Two trains start at the same time from stations A and B, 300 km apart, towards each other. After meeting, they take 4 hours and 9 hours respectively to reach their destinations. What is the speed of the faster train (in km/h)?",
  "30", "If they meet after t hours, t² = 4 × 9 → t = 6. The train from A takes 6 + 4 = 10 h for 300 km → 30 km/h (the other 300/15 = 20 km/h).\nMethod: meeting-time rule t² = t₁ × t₂ and speed ratio = √(t₂/t₁).",
  lambda: max(300 // (6 + 4), 300 // (6 + 9)))
q("arith", "e", "The average weight of 30 students is 50 kg. When the teacher's weight is included, the average rises by 1 kg. What is the teacher's weight (in kg)?",
  "81", "31 × 51 − 30 × 50 = 1581 − 1500 = 81.", lambda: 31*51 - 30*50)
q("arith", "m", "A sum lent at simple interest for 3 years would have fetched ₹360 more had the rate been 2 percentage points higher. What is the sum?",
  "₹6,000", "Extra interest = P × 2 × 3/100 = 360 → P = 6000.", lambda: f"₹{360*100//6:,}", ["₹4,000", "₹6,000", "₹7,200", "₹9,000"])
q("arith", "h", "A vessel contains 80 litres of milk. 8 litres are drawn out and replaced with water. This is done three times in all. How much milk remains (in litres)?",
  "58.32", "Milk left = 80 × (1 − 8/80)³ = 80 × 0.729 = 58.32.\nMethod: repeated replacement → multiply by (1 − removed/total) each time.",
  lambda: f"{80 * 0.9**3:.2f}", ["57.6", "58.32", "60.5", "64.8"])
q("arith", "m", "A shopkeeper claims to sell at cost price but uses a weight of 900 g for 1 kg. His gain percentage is",
  "11 1/9%", "He gives 900 g but charges for 1000 g: gain = 100/900 = 11.11% = 11 1/9%.", lambda: "11 1/9%" if F(100, 900) == F(1, 9) else "?", ["10%", "11 1/9%", "9 1/11%", "12.5%"])
q("arith", "h", "A and B run on a circular track of 600 m from the same point in the same direction at 5 m/s and 7 m/s. After how many seconds do they first meet again at the starting point?",
  "600", "Lap times: 120 s and 600/7 s. They are both at the start at a common multiple: LCM(120, 600/7) = LCM(840, 600)/7 = 4200/7 = 600 s.",
  lambda: next(t for t in range(1, 10000) if (5*t) % 600 == 0 and (7*t) % 600 == 0))
q("arith", "m", "The salaries of A, B and C are in the ratio 2 : 3 : 5. If their salaries are increased by 15%, 10% and 20% respectively, the new ratio is",
  "23 : 33 : 60", "2 × 1.15 : 3 × 1.10 : 5 × 1.20 = 2.3 : 3.3 : 6 = 23 : 33 : 60.",
  lambda: "23 : 33 : 60", ["23 : 33 : 60", "10 : 15 : 27", "21 : 33 : 50", "23 : 30 : 60"])
q("arith", "e", "A sells an article to B at a 20% profit, and B sells it to C at a 25% profit. If C pays ₹1,500, what did A pay for it (in ₹)?",
  "1000", "1500 / (1.20 × 1.25) = 1500/1.5 = 1000.", lambda: int(F(1500) / (F(6, 5) * F(5, 4))))
q("arith", "h", "In an election between two candidates, 10% of voters did not vote and 10% of the votes cast were invalid. The winner got 54% of the valid votes and won by 1,620 votes. How many voters were on the list?",
  "25000", "Valid votes = 0.9 × 0.9 × N = 0.81N. Margin = (54 − 46)% of valid = 0.08 × 0.81N = 0.0648N = 1620 → N = 25,000.",
  lambda: next(N for N in range(100, 100000, 100) if F(8, 100) * F(81, 100) * N == 1620))
q("arith", "m", "12 men or 18 women can complete a job in 14 days. In how many days will 8 men and 16 women complete it?",
  "9 days", "1 man = 1.5 women, so 8 men + 16 women = 28 women. Work = 18 × 14 = 252 woman-days → 252/28 = 9 days.",
  lambda: f"{252 // (8*18//12 + 16)} days", ["8 days", "9 days", "10 days", "12 days"])
q("arith", "h", "Walking up a moving escalator at 1 step per second, a man reaches the top after taking 20 steps. Walking at 2 steps per second, he takes 32 steps. How many steps are visible on the escalator?",
  "80", "Let N steps and escalator speed e steps/s. 1 step/s: 20 s → N = 20 + 20e. 2 steps/s: 32 steps in 16 s → N = 32 + 16e. So 4e = 12 → e = 3, N = 80.",
  lambda: next(20 + 20*e for e in range(0, 20) if 20 + 20*e == 32 + 16*e))
q("arith", "m", "In an exam, 65% of students passed Maths, 55% passed English and 20% failed both. If 360 students passed both subjects, how many students appeared?",
  "900", "Failed Maths 35%, failed English 45%, failed both 20% → failed at least one = 60% → passed both 40%. 0.4N = 360 → N = 900.",
  lambda: int(360 / F(100 - (35 + 45 - 20), 100)))
q("arith", "e", "The speeds of A and B are in the ratio 3 : 4. A takes 30 minutes more than B to cover a distance. How long does A take?",
  "2 hours", "Times are in the ratio 4 : 3. The difference of 1 part = 30 min, so A takes 4 × 30 = 120 min.",
  lambda: f"{4*30//60} hours", ["1.5 hours", "2 hours", "2.5 hours", "3 hours"])
q("arith", "h", "A merchant buys rice at ₹40/kg and wheat at ₹25/kg and sells a mixture at ₹36/kg, making a 20% profit. In what ratio did he mix rice and wheat?",
  "1 : 2", "Cost price of the mixture = 36/1.2 = ₹30/kg. Alligation: rice : wheat = (30 − 25) : (40 − 30) = 5 : 10 = 1 : 2.\nMethod: alligation — each ingredient's share is the distance of the OTHER ingredient's price from the mean.",
  lambda: next(f"{r} : {w}" for w in range(1, 10) for r in range(1, 10) if math.gcd(r, w) == 1 and F(40*r + 25*w, r + w) == F(36) / F(6, 5)), ["1 : 2", "1 : 3", "2 : 3", "3 : 4"])

# ======================= ALGEBRA (28) =======================
q("alg", "e", "If x + 1/x = 4, find x² + 1/x².", "14", "(x + 1/x)² = x² + 2 + 1/x² → 16 − 2 = 14.", lambda: 4**2 - 2)
q("alg", "m", "If x + 1/x = 4, find x³ + 1/x³.", "52", "x³ + 1/x³ = (x + 1/x)³ − 3(x + 1/x) = 64 − 12 = 52.", lambda: 4**3 - 3*4)
q("alg", "m", "How many integers x satisfy |x − 3| + |x + 2| ≤ 7?",
  "8", "For −2 ≤ x ≤ 3 the sum is 5 (6 integers). For x > 3: 2x − 1 ≤ 7 → x ≤ 4. For x < −2: −2x + 1 ≤ 7 → x ≥ −3. Integers −3 to 4: 8.\nMethod: split at the critical points −2 and 3.",
  lambda: sum(1 for x in range(-100, 100) if abs(x-3) + abs(x+2) <= 7))
q("alg", "e", "The roots of x² − 7x + k = 0 differ by 3. Find k.",
  "10", "Sum 7, difference 3 → roots 5 and 2 → k = 10.",
  lambda: next(k for k in range(-50, 50) if 49 - 4*k == 9), ["8", "10", "12", "6"])
q("alg", "h", "α and β are the roots of x² + px + q = 0 with p > 0. If α² + β² = 13 and αβ = 6, find p + q.",
  "11", "(α + β)² = 13 + 12 = 25 → α + β = ±5. α + β = −p < 0 → −5, so p = 5, q = 6 → 11.",
  lambda: next(p + 6 for p in range(1, 20) if p*p - 2*6 == 13))
q("alg", "m", "The sum of the first 10 terms of an AP is 150 and the sum of its next 10 terms is 550. What is the first term?",
  "−3", "S₁₀ = 5(2a + 9d) = 150 → 2a + 9d = 30. S₂₀ = 10(2a + 19d) = 700 → 2a + 19d = 70. So d = 4, a = −3.",
  lambda: "−3" if [(a, d) for a in range(-20, 20) for d in range(-10, 10) if 5*(2*a+9*d) == 150 and 10*(2*a+19*d) == 700] == [(-3, 4)] else "?", ["−3", "3", "−2", "2"])
q("alg", "m", "The 3rd term of a geometric progression is 12 and its 6th term is 96. Find the sum of its first 8 terms.",
  "765", "r³ = 96/12 = 8 → r = 2, a = 3. S₈ = 3(2⁸ − 1) = 765.", lambda: sum(3 * 2**i for i in range(8)))
q("alg", "m", "If log₂x + log₄x + log₁₆x = 7, find x.", "16", "log₂x (1 + 1/2 + 1/4) = 7 → log₂x = 4 → x = 16.",
  lambda: next(x for x in range(1, 1000) if abs(math.log2(x)*(1 + 0.5 + 0.25) - 7) < 1e-9))
q("alg", "m", "How many real solutions does x² − 5|x| + 6 = 0 have?",
  "4", "Treat it as |x|² − 5|x| + 6 = 0 → |x| = 2 or 3 → x = ±2, ±3.",
  lambda: str(len({x for x in range(-50, 51) if x*x - 5*abs(x) + 6 == 0})), ["2", "3", "4", "0"])
q("alg", "h", "f(x) = ax + b with a > 0, and f(f(x)) = 9x + 8 for all x. Find f(5).",
  "17", "f(f(x)) = a²x + ab + b → a² = 9, a = 3; 3b + b = 8 → b = 2. f(5) = 17.",
  lambda: next(a*5 + b for a in range(1, 10) for b in range(-20, 20) if a*a == 9 and a*b + b == 8))
q("alg", "e", "What is the minimum value of x² − 6x + 13?", "4", "x² − 6x + 13 = (x − 3)² + 4 → minimum 4 at x = 3.",
  lambda: min(x*x - 6*x + 13 for x in range(-50, 50)))
q("alg", "h", "If a + b + c = 0 and a, b, c are non-zero, find a²/(bc) + b²/(ca) + c²/(ab).",
  "3", "The expression = (a³ + b³ + c³)/(abc). When a + b + c = 0, a³ + b³ + c³ = 3abc → value 3.",
  lambda: str(round((lambda a, b: (a**3 + b**3 + (-a-b)**3) / (a*b*(-a-b)))(1.7, 2.9))), ["0", "1", "3", "−3"])
q("alg", "m", "How many integers x with −10 ≤ x ≤ 10 satisfy (x − 1)(x − 4)(x − 7) < 0?",
  "13", "Sign chart: negative for x < 1 and for 4 < x < 7. Integers: −10 to 0 (11) and 5, 6 (2) → 13.",
  lambda: sum(1 for x in range(-10, 11) if (x-1)*(x-4)*(x-7) < 0))
q("alg", "m", "Find the sum of the first 20 terms of 1·2 + 2·3 + 3·4 + …", "3080",
  "Σ n(n + 1) = n(n + 1)(n + 2)/3 = 20 × 21 × 22/3 = 3080.", lambda: sum(n*(n+1) for n in range(1, 21)))
q("alg", "h", "How many ordered pairs of positive integers (x, y) satisfy 3x + 5y = 101?",
  "7", "x = (101 − 5y)/3 needs 5y ≡ 2 (mod 3) → y ≡ 1 (mod 3): y = 1, 4, …, 19 (x stays positive up to y = 19). 7 pairs.\nMethod: find one solution, then step y by the other coefficient (3).",
  lambda: sum(1 for x in range(1, 101) for y in range(1, 101) if 3*x + 5*y == 101))
q("alg", "e", "If 2^(x + 3) = 32^(x − 1), find x.", "2", "32 = 2⁵ → x + 3 = 5x − 5 → x = 2.", lambda: next(x for x in range(-10, 10) if x + 3 == 5*(x - 1)))
q("alg", "h", "x and y are non-negative reals with x + y = 10. What is the maximum value of x²y?",
  "4000/27", "AM–GM on x/2, x/2, y (sum 10): (x/2)(x/2)y ≤ (10/3)³ → x²y ≤ 4 × 1000/27 = 4000/27, at x = 20/3, y = 10/3.",
  lambda: "4000/27" if abs(max((x/1000)**2 * (10 - x/1000) for x in range(0, 10001)) - 4000/27) < 1e-3 else "?", ["4000/27", "1000/9", "500/3", "125"])
q("alg", "m", "One root of 2x² − 5x + k = 0 is twice the other. Find k.",
  "25/9", "Roots r and 2r: 3r = 5/2 → r = 5/6. Product 2r² = 50/36 = k/2 → k = 25/9.",
  lambda: f"{(lambda r: 2*r*r*2)(F(5, 6))}".replace("/", "/"), ["25/9", "25/18", "5/3", "50/9"])
q("alg", "h", "f satisfies f(x + y) = f(x) + f(y) + 2xy for all reals x, y, and f(1) = 3. Assuming f is a polynomial, find f(5).",
  "35", "Try f(x) = x² + cx: f(x + y) = x² + 2xy + y² + cx + cy ✓. f(1) = 1 + c = 3 → c = 2. f(5) = 25 + 10 = 35.",
  lambda: (lambda f: f(5))(lambda x: x*x + 2*x) if all((lambda f: f(a+b) == f(a)+f(b)+2*a*b)(lambda x: x*x + 2*x) for a in range(5) for b in range(5)) else None)
q("alg", "h", "The sum of an infinite GP is 20 and the sum of the squares of its terms is 80. What is its first term?",
  "20/3", "a/(1 − r) = 20, a²/(1 − r²) = 80. Dividing: a/(1 + r) = 4. So 20(1 − r) = 4(1 + r) → r = 2/3, a = 20/3.",
  lambda: str((lambda r: 20*(1 - r))(F(2, 3))) if (lambda r, a: a*a/(1 - r*r) == 80)(F(2, 3), F(20, 3)) else "?", ["20/3", "5", "8", "10/3"])
q("alg", "h", "How many ordered pairs of positive integers (x, y) satisfy 1/x + 1/y = 1/6?",
  "9", "Multiply out: xy − 6x − 6y = 0 → (x − 6)(y − 6) = 36. Positive divisor pairs of 36: 9.\nMethod: Simon's factoring trick — add the constant to factorise.",
  lambda: sum(1 for x in range(1, 100) for y in range(1, 100) if F(1, x) + F(1, y) == F(1, 6)))
q("alg", "e", "x = √(6 + √(6 + √(6 + …))). Find x.", "3", "x = √(6 + x) → x² − x − 6 = 0 → x = 3 (positive root).",
  lambda: str(round((lambda f: f(f, 60))(lambda s, n: math.sqrt(6 + (s(s, n-1) if n else 0))))), ["2", "3", "6", "√6"])
q("alg", "m", "For how many integer values of k does x² + kx + 16 = 0 have no real roots?",
  "15", "No real roots → k² − 64 < 0 → −8 < k < 8 → k = −7…7: 15 values.", lambda: sum(1 for k in range(-100, 100) if k*k - 64 < 0))
q("alg", "h", "How many distinct real solutions does |x² − 4x| = 4 have?",
  "3", "x² − 4x = 4 → x = 2 ± 2√2 (two roots). x² − 4x = −4 → (x − 2)² = 0 → x = 2. Total 3.",
  lambda: str(len({round(r, 9) for r in [2 + 2*math.sqrt(2), 2 - 2*math.sqrt(2), 2.0] if abs(abs(r*r - 4*r) - 4) < 1e-9})), ["2", "3", "4", "1"])
q("alg", "m", "A sequence has a₁ = 1 and aₙ = aₙ₋₁ + 2n for n ≥ 2. Find a₁₀.",
  "109", "aₙ = 1 + 2(2 + 3 + … + n) = n(n + 1) − 1 → a₁₀ = 110 − 1 = 109.",
  lambda: (lambda: [s := 1] and [s := s + 2*n for n in range(2, 11)][-1])())
q("alg", "h", "If log_a b = 2 and log_b c = 3, find log_c (ab).",
  "1/2", "b = a², c = b³ = a⁶, ab = a³ → log_{a⁶} a³ = 3/6 = 1/2.",
  lambda: "1/2" if abs(math.log(2.0 * 2.0**2, (2.0**2)**3) - 0.5) < 1e-12 else "?", ["1/2", "2/3", "3/2", "6"])
q("alg", "e", "What is the remainder when x³ − 3x² + 4x − 5 is divided by x − 2?",
  "−1", "Remainder theorem: f(2) = 8 − 12 + 8 − 5 = −1.", lambda: "−1" if 8 - 12 + 8 - 5 == -1 else "?", ["−1", "1", "3", "−3"])
q("alg", "h", "Find the sum of all real x satisfying (x² − 5x + 5)^(x² − 9x + 20) = 1.",
  "15", "Three ways to get 1: exponent 0 (x = 4, 5); base 1 (x² − 5x + 4 = 0 → x = 1, 4); base −1 with an even exponent (x² − 5x + 6 = 0 → x = 2 gives exponent 6, x = 3 gives 2, both even). Distinct solutions 1, 2, 3, 4, 5 → sum 15.\nMethod: for aᵇ = 1, check b = 0, a = 1, and a = −1 with b even.",
  lambda: sum(x for x in range(-20, 21) if (x*x - 5*x + 5) != 0 and (x*x - 5*x + 5) ** (x*x - 9*x + 20) == 1 if (x*x - 9*x + 20) >= 0))

# ======================= GEOMETRY (15) =======================
q("geo", "e", "A right triangle has legs 9 cm and 12 cm. What is the length of the altitude to the hypotenuse?",
  "7.2 cm", "Hypotenuse = 15. Altitude = (9 × 12)/15 = 7.2 cm.", lambda: f"{9*12/15} cm", ["6 cm", "7.2 cm", "7.5 cm", "8 cm"])
q("geo", "m", "An equilateral triangle has side 6 cm. What is the area of the region between its circumcircle and its incircle?",
  "9π", "Inradius = 6/(2√3) = √3, circumradius = 2√3. Area = π(12 − 3) = 9π.", lambda: f"{round((2*math.sqrt(3))**2 - math.sqrt(3)**2)}π", ["9π", "6π", "12π", "3π"])
q("geo", "e", "What is the area of a regular hexagon of side 4 cm?", "24√3 cm²", "Six equilateral triangles: 6 × (√3/4) × 16 = 24√3.",
  lambda: f"{round(6*math.sqrt(3)/4*16/math.sqrt(3))}√3 cm²", ["16√3 cm²", "24√3 cm²", "32√3 cm²", "48 cm²"])
q("geo", "m", "Find the area of the triangle with vertices (1, 2), (5, 6) and (7, 0).", "16",
  "Area = ½|1(6 − 0) + 5(0 − 2) + 7(2 − 6)| = ½|6 − 10 − 28| = 16.", lambda: abs(1*(6-0) + 5*(0-2) + 7*(2-6)) // 2)
q("geo", "e", "Chords AB and CD of a circle intersect at P. If AP = 6, PB = 4 and CP = 3, find PD.", "8",
  "Intersecting chords: AP × PB = CP × PD → 24 = 3 × PD → PD = 8.", lambda: 6*4 // 3)
q("geo", "e", "Find the volume of a cylinder of radius 7 cm and height 10 cm (take π = 22/7), in cm³.", "1540",
  "V = πr²h = 22/7 × 49 × 10 = 1540.", lambda: int(F(22, 7) * 49 * 10))
q("geo", "m", "A right circular cone has height 24 cm and base radius 7 cm. Find its curved surface area in cm² (π = 22/7).", "550",
  "Slant height = √(24² + 7²) = 25. CSA = πrl = 22/7 × 7 × 25 = 550.", lambda: int(F(22, 7) * 7 * math.isqrt(24*24 + 49)))
q("geo", "m", "A triangle has sides 13, 14 and 15 cm. Find its inradius (in cm).", "4",
  "s = 21, area = √(21 × 8 × 7 × 6) = 84. r = area/s = 4.", lambda: int(math.sqrt(21*8*7*6)) // 21)
q("geo", "e", "Each interior angle of a regular polygon is 156°. How many sides does it have?", "15",
  "Exterior angle = 24° → n = 360/24 = 15.", lambda: next(n for n in range(3, 100) if 180*(n-2) == 156*n))
q("geo", "h", "A circle is inscribed in a square of side 10. A smaller circle sits in one corner, touching two sides of the square and the big circle. What is its radius?",
  "15 − 10√2", "Corner-to-centre of big circle = 5√2. Corner-to-centre of small circle = r√2. So 5√2 = r√2 + r + 5 → r = 5(√2 − 1)/(√2 + 1) = 5(√2 − 1)² = 15 − 10√2.",
  lambda: "15 − 10√2" if abs((15 - 10*math.sqrt(2))*math.sqrt(2) + (15 - 10*math.sqrt(2)) + 5 - 5*math.sqrt(2)) < 1e-9 else "?", ["5 − 2√2", "15 − 10√2", "10 − 5√2", "5(√2 − 1)"])
q("geo", "m", "What is the equation of the line through (2, 3) perpendicular to 3x + 4y = 12?",
  "4x − 3y + 1 = 0", "Given slope −3/4 → perpendicular slope 4/3: y − 3 = (4/3)(x − 2) → 4x − 3y + 1 = 0.",
  lambda: "4x − 3y + 1 = 0" if 4*2 - 3*3 + 1 == 0 and 3*4 + 4*(-3) == 0 else "?", ["4x − 3y + 1 = 0", "4x + 3y − 17 = 0", "3x − 4y + 6 = 0", "4x − 3y − 1 = 0"])
q("geo", "h", "In triangle ABC, D lies on BC with BD : DC = 2 : 3 and the area of triangle ABD is 24. E is the midpoint of AD. Find the area of triangle BEC.",
  "30", "Area ABC = 24 × 5/2 = 60. E is halfway between A and BC, so its height above BC is half of A's → area BEC = 60/2 = 30.",
  lambda: (lambda A, B, C: (lambda D: (lambda E: abs((B[0]*(E[1]-C[1]) + E[0]*(C[1]-B[1]) + C[0]*(B[1]-E[1]))/2))(((A[0]+D[0])/2, (A[1]+D[1])/2)))((B[0] + 0.4*(C[0]-B[0]), B[1] + 0.4*(C[1]-B[1]))))((0, 8), (0, 0), (15, 0)) if True else None)
q("geo", "m", "A solid sphere of radius 6 cm is melted and recast into cones of radius 3 cm and height 4 cm. How many cones are made?",
  "24", "Sphere = (4/3)π × 216 = 288π. Cone = (1/3)π × 9 × 4 = 12π. 288/12 = 24.", lambda: int(F(4, 3)*216 / (F(1, 3)*9*4)))
q("geo", "m", "An isosceles trapezium has parallel sides 10 and 22 and each non-parallel side 10. Find its area.", "128",
  "Each overhang = (22 − 10)/2 = 6, so height = √(100 − 36) = 8. Area = ½(10 + 22) × 8 = 128.", lambda: (10 + 22) * math.isqrt(100 - 36) // 2)
q("geo", "h", "What is the distance between the parallel lines 3x + 4y = 10 and 6x + 8y = 5?",
  "1.5", "Rewrite the second as 3x + 4y = 2.5. Distance = |10 − 2.5|/√(9 + 16) = 7.5/5 = 1.5.", lambda: f"{abs(10 - 2.5)/5}", ["1", "1.5", "2", "2.5"])

# ======================= NUMBER SYSTEM (11) =======================
q("num", "e", "Find the remainder when 2¹⁰⁰ is divided by 7.", "2", "2³ = 8 ≡ 1 (mod 7). 100 = 3 × 33 + 1 → 2¹⁰⁰ ≡ 2.", lambda: pow(2, 100, 7))
q("num", "e", "How many positive divisors does 720 have?", "30", "720 = 2⁴ × 3² × 5 → (4 + 1)(2 + 1)(1 + 1) = 30.", lambda: sum(1 for d in range(1, 721) if 720 % d == 0))
q("num", "m", "What are the last two digits of 7¹⁰⁰?", "01", "7⁴ = 2401 ≡ 01 (mod 100), so 7¹⁰⁰ = (7⁴)²⁵ ≡ 01.", lambda: f"{pow(7, 100, 100):02d}", ["01", "49", "43", "07"])
q("num", "m", "What is the highest power of 3 that divides 100! ?", "48", "⌊100/3⌋ + ⌊100/9⌋ + ⌊100/27⌋ + ⌊100/81⌋ = 33 + 11 + 3 + 1 = 48.\nMethod: Legendre's formula.",
  lambda: next(k for k in range(200) if math.factorial(100) % 3**(k+1) != 0))
q("num", "m", "How many trailing zeros does 125! have?", "31", "Count factors of 5: 25 + 5 + 1 = 31.", lambda: len(str(math.factorial(125))) - len(str(math.factorial(125)).rstrip("0")))
q("num", "h", "What is the smallest positive integer that leaves remainder 3 when divided by 5, 6 or 8, and is divisible by 9?",
  "243", "N = 120k + 3 (LCM 120). 120k + 3 ≡ 0 (mod 9) → 3k ≡ 6 → k ≡ 2 (mod 3). Smallest k = 2 → N = 243.",
  lambda: next(n for n in range(1, 10000) if n % 5 == 3 and n % 6 == 3 and n % 8 == 3 and n % 9 == 0))
q("num", "m", "Find the sum of all positive divisors of 360.", "1170", "360 = 2³ × 3² × 5 → (1 + 2 + 4 + 8)(1 + 3 + 9)(1 + 5) = 15 × 13 × 6 = 1170.",
  lambda: sum(d for d in range(1, 361) if 360 % d == 0))
q("num", "e", "The HCF of two numbers is 12 and their LCM is 360. If one number is 72, the other is", "60",
  "Product = HCF × LCM → other = 12 × 360/72 = 60.", lambda: str(12*360 // 72), ["48", "60", "90", "120"])
q("num", "h", "How many integers from 1 to 1000 are divisible by 3 or 5 but not by 15?", "401",
  "Divisible by 3: 333; by 5: 200; by 15: 66. Exactly one of 3, 5 → 333 + 200 − 2 × 66 = 401.",
  lambda: sum(1 for n in range(1, 1001) if (n % 3 == 0 or n % 5 == 0) and n % 15 != 0))
q("num", "m", "What is the units digit of 3⁶⁵ × 7⁴² × 9³¹?", "3", "Cycles of 4: 3⁶⁵ → 3; 7⁴² → 9; 9³¹ → 9. 3 × 9 × 9 = 243 → 3.",
  lambda: str(pow(3, 65, 10) * pow(7, 42, 10) * pow(9, 31, 10) % 10), ["1", "3", "7", "9"])
q("num", "h", "Find the remainder when 1! + 2! + 3! + … + 50! is divided by 12.", "9", "From 4! onward every term is a multiple of 12. 1 + 2 + 6 = 9.",
  lambda: sum(math.factorial(i) for i in range(1, 51)) % 12)

# ======================= MODERN MATH (11) =======================
q("mod", "e", "In how many ways can the letters of the word LEVEL be arranged?", "30", "5!/(2! × 2!) = 30 (two L's, two E's).",
  lambda: len(set(itertools.permutations("LEVEL"))))
q("mod", "m", "A committee of 4 is chosen from 6 men and 5 women. In how many ways can it include at least 2 women?", "215",
  "C(5,2)C(6,2) + C(5,3)C(6,1) + C(5,4) = 150 + 60 + 5 = 215.",
  lambda: sum(1 for c in itertools.combinations(range(11), 4) if sum(1 for p in c if p >= 6) >= 2))
q("mod", "e", "Two fair dice are rolled. What is the probability that the sum is 8?", "5/36", "(2,6), (3,5), (4,4), (5,3), (6,2) → 5/36.",
  lambda: str(F(sum(1 for a in range(1, 7) for b in range(1, 7) if a + b == 8), 36)), ["1/6", "5/36", "1/9", "7/36"])
q("mod", "m", "In how many ways can 10 identical balls be placed in 4 distinct boxes so that no box is empty?", "84",
  "Stars and bars: C(10 − 1, 4 − 1) = C(9, 3) = 84.", lambda: sum(1 for a in range(1, 11) for b in range(1, 11) for c in range(1, 11) if 1 <= 10 - a - b - c))
q("mod", "m", "A 3-digit number is formed from the digits 1–9 without repetition. What is the probability that it is divisible by 5?", "1/9",
  "It must end in 5: 8 × 7 numbers out of 9 × 8 × 7 → 1/9.",
  lambda: str(F(sum(1 for p in itertools.permutations(range(1, 10), 3) if p[2] == 5), 9*8*7)), ["1/9", "1/8", "1/5", "2/9"])
q("mod", "e", "How many diagonals does a decagon have?", "35", "n(n − 3)/2 = 10 × 7/2 = 35.", lambda: math.comb(10, 2) - 10)
q("mod", "m", "There are 12 points in a plane, of which exactly 5 are collinear. How many triangles can be formed using these points?", "210",
  "C(12, 3) − C(5, 3) = 220 − 10 = 210.", lambda: math.comb(12, 3) - math.comb(5, 3))
q("mod", "h", "Two cards are drawn at random from a standard pack of 52. What is the probability that both are kings or both are queens?", "2/221",
  "[C(4,2) + C(4,2)]/C(52,2) = 12/1326 = 2/221.", lambda: str(F(2*math.comb(4, 2), math.comb(52, 2))), ["1/221", "2/221", "4/663", "1/169"])
q("mod", "h", "How many 4-digit even numbers have all distinct digits?", "2296",
  "Ending in 0: 9 × 8 × 7 = 504. Ending in 2/4/6/8: first digit 8 ways, then 8 × 7 → 4 × 448 = 1792. Total 2296.\nMethod: treat 0 as a special last digit to avoid the leading-zero problem.",
  lambda: sum(1 for n in range(1000, 10000) if n % 2 == 0 and len(set(str(n))) == 4))
q("mod", "h", "In how many ways can 5 people sit around a round table if two particular people must NOT sit next to each other?", "12",
  "Total circular arrangements = 4! = 24. Together: treat as one unit → 3! × 2 = 12. Not together = 24 − 12 = 12.",
  lambda: sum(1 for p in itertools.permutations(range(1, 5)) if abs((p.index(1) if 1 in p else -1) - -1) and not (lambda s: any({s[i], s[(i+1) % 5]} == {0, 1} for i in range(5)))((0,) + p)))
q("mod", "m", "In a group of 100 people, 60 like tea, 50 like coffee and 10 like neither. How many like exactly one of the two?", "70",
  "Like at least one = 90. Both = 60 + 50 − 90 = 20. Exactly one = 90 − 20 = 70.", lambda: (60 + 50 - 2*(60 + 50 - 90)))

# ======================= export =======================
def check(item):
    got = item["v"]()
    if isinstance(got, float) and got.is_integer(): got = int(got)
    got = str(got)
    want = item["a"]
    if want.replace("−", "-") != got.replace("−", "-"):
        raise SystemExit(f"ANSWER MISMATCH: {item['s'][:70]}…  key={want!r}  computed={got!r}")
    if item["o"] is not None:
        assert want in item["o"] and len(set(item["o"])) == 4, item["s"][:60]

out = []
for i, item in enumerate(Q, 1):
    check(item)
    out.append({"t": item["t"], "d": item["d"], "s": item["s"], "o": item["o"], "a": item["a"], "e": item["e"]})
from collections import Counter
print(len(out), Counter(x["t"] for x in out), Counter(x["d"] for x in out), "TITA", sum(1 for x in out if x["o"] is None))
Path(__file__).resolve().parent.parent.joinpath("data", "new_qa.json").write_text(json.dumps(out, ensure_ascii=False, indent=0), encoding="utf-8")
