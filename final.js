/* Final Stretch: 12 original mock papers (4 per section) + a game plan for the last days before CAT.
   Papers come from data/final.js (window.VARC_FINAL) and run in the main quiz engine with a countdown. */
(() => {
  "use strict";
  const F = window.VARC_FINAL, A = window.VARCApp;
  if (!F || !A) return;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = A.esc;
  const view = () => $("#view-final");
  const QI = Object.fromEntries(F.questions.map(q => [q.id, q]));
  const SEC = { varc: "VARC", dilr: "DILR", qa: "Quant" };
  const LINE99 = { varc: [40, 40, 44], dilr: [27, 38, 30], qa: [25, 33, 27] };   // 99th-percentile sectional marks, 2023/24/25
  const TARGET = { varc: 42, dilr: 32, qa: 31 };
  let tab = "papers";
  try { tab = localStorage.getItem("fs.tab") || "papers"; } catch { /* storage unavailable */ }

  const attempts = id => A.history().filter(h => h.paper === id);
  const score = rec => rec.results.reduce((s, r) => s + r.marks, 0);

  function paperMeta(p) {
    const qs = p.qids.map(id => QI[id]);
    const tita = qs.filter(q => q.type === "tita").length;
    const d = { easy: 0, medium: 0, hard: 0 }; qs.forEach(q => d[q.difficulty]++);
    let shape = "";
    if (p.sec === "varc") shape = "4 RC passages + 8 VA (2 PJ, 2 odd-one-out, 2 summary, 2 placement)";
    if (p.sec === "dilr") {
      const sets = [...new Set(qs.map(q => q.passage))].map(pid => F.passages[pid]);
      shape = sets.map(s => s.family).join(" · ");
    }
    if (p.sec === "qa") {
      const c = t => qs.filter(q => q.topic === t).length;
      shape = `${c("qa-arith")} arithmetic · ${c("qa-alg")} algebra · ${c("qa-geo")} geometry · ${c("qa-num")} number system · ${c("qa-mod")} modern math`;
    }
    return { n: qs.length, tita, d, shape };
  }

  function paperCard(p) {
    const m = paperMeta(p), at = attempts(p.id), best = at.length ? Math.max(...at.map(score)) : null, last = at[0];
    const line = LINE99[p.sec], tgt = TARGET[p.sec];
    const verdict = best == null ? "" : best >= tgt ? `<span class="fs-ok">on target (≥ ${tgt})</span>` : best >= Math.min(...line) ? `<span class="fs-mid">99%ile range</span>` : `<span class="fs-low">below the 99%ile line</span>`;
    return `<div class="fs-paper">
      <div class="fs-ph"><b>${esc(p.title.replace("Final Stretch · ", ""))}</b><span class="muted small">${m.n} Qs · ${m.tita} TITA · 40 min</span></div>
      <p class="small muted fs-shape">${esc(m.shape)}</p>
      <div class="fs-dmix"><span class="badge easy">${m.d.easy} easy</span><span class="badge medium">${m.d.medium} medium</span><span class="badge hard">${m.d.hard} hard</span></div>
      ${best != null ? `<p class="small">Best: <b>${best}</b> / ${m.n * 3} · ${verdict}${last ? ` · <a href="#report/${last.id}">last report</a>` : ""}</p>` : `<p class="small muted">Not attempted yet</p>`}
      <div class="row gap"><button class="btn primary" data-start="${p.id}">Start · 40 min</button><button class="btn ghost" data-untimed="${p.id}">Untimed</button></div>
    </div>`;
  }

  function renderPapers() {
    const groups = ["varc", "dilr", "qa"].map(sec => `<div class="card"><div class="row between"><h2>${SEC[sec]} papers</h2>
        <span class="muted small">99th-percentile line: ${LINE99[sec].join(" / ")} marks (2023 / 24 / 25) · target ${TARGET[sec]}</span></div>
        <div class="fs-grid">${F.papers.filter(p => p.sec === sec).map(paperCard).join("")}</div></div>`).join("");
    const full = [1, 2, 3, 4].map(n => `<button class="btn" data-full="${n}">Full mock ${n} · 120 min</button>`).join("");
    return `<div class="card fs-how"><h2>How to use these today</h2>
        <ol class="small"><li>Take one paper of each section back to back, timed (VARC → DILR → Quant, like the real order). Or press <b>Full mock</b> for all 68 questions on one 120-minute clock.</li>
        <li>Difficulty tags are hidden while you solve. The report shows each question's tag. Check whether you <b>skipped the hard ones and took the easy ones</b>; that is the skill to train now.</li>
        <li>Every explanation ends with a <b>signal</b> line: how you could have told the question or set was easy or hard in the first 30 seconds.</li>
        <li>Papers 1–3 are the realistic ones. Paper 4 of each section is slightly lighter, so keep it for the day before the exam.</li></ol>
        <div class="row gap wrap">${full}</div>
        <p class="muted small">All questions are original and written to the 2024–25 blueprint; they are pattern practice, not predicted actual questions. Every Quant answer is recomputed by a script, every DILR answer is checked against all arrangements the clues allow, and VARC answers come with line references.</p></div>${groups}`;
  }

  // ---------- game plan ----------
  const tbl = (head, rows) => `<div class="tbl-wrap"><table class="tbl"><thead><tr>${head.map(h => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  function renderPlan() {
    return `
    <div class="card"><h2>1 · The score to aim for</h2>
      <p>IIM Ahmedabad, Bangalore and Calcutta shortlist on more than the CAT score: academics, work experience and diversity points also count, so a general-category engineer usually needs about <b>99.5+ overall</b>. IIMs also apply <b>sectional cut-offs</b>, so no section can be left weak.</p>
      ${tbl(["", "2023", "2024", "2025"], [["99th percentile, whole paper", "76", "95", "85"], ["VARC 99%ile", "40", "40", "44"], ["DILR 99%ile", "27", "38", "30"], ["QA 99%ile", "25", "33", "27"]])}
      <p class="small muted">Scaled marks from Cracku's score-vs-percentile tables; IIMs don't publish these. +3 correct, −1 wrong MCQ, 0 for a wrong TITA.</p>
      <p><b>Your target: about 100–105 marks</b>, 15–20 above the 99 line, which leaves margin for a 2024-type easy year:</p>
      ${tbl(["Section", "Attempt", "Get right", "≈ Marks", "Order inside the section"], [
        ["VARC", "21–23", "15–16", "42–45", "Easiest RC → TITA para-jumble / odd-one-out → medium RC → summaries & placement → hardest RC last"],
        ["DILR", "13–15", "11", "≈ 32", "Scan all 5 sets (4 min) → 2 easiest sets fully → 1 more set fully or 2 partly"],
        ["Quant", "14–16", "11–12", "≈ 31–33", "Pass 1 sitters (≤ 90 s each) → pass 2 mediums → last 5 min: TITAs you have half-solved"],
        ["Total", "≈ 50", "≈ 37", "≈ 105", "Accuracy ≥ 80% matters more than attempts"]])}
    </div>

    <div class="card"><h2>2 · How to spend the 40 minutes</h2>
      <div class="grid-3">
        <div><h3>VARC</h3><ul class="small">
          <li>Read the first two lines of all 4 passages (1 min) and rank them. Concrete science, history or policy topics go first; philosophy, aesthetics and literary theory go last.</li>
          <li>About 7 min per passage, about 1 min per VA question. Do all 4 passages: 16 of 24 marks are there.</li>
          <li>Always enter the para-jumbles and odd-one-outs: TITA has no negative marking.</li>
          <li>Out of time on the last passage? Answer its detail and "NOT mentioned" questions first and skip its "main idea / analogy" ones.</li></ul></div>
        <div><h3>DILR</h3><ul class="small">
          <li>For the first 4 minutes, only read the five set-ups. Rank them by <b>how quickly the first clue fixes something</b>.</li>
          <li>Give a set 10–12 minutes at most. If nothing is fixed after 4 minutes, leave it.</li>
          <li>Two clean sets (8–10 Qs) plus a third is a 99%ile DILR in a normal year.</li>
          <li>Half the questions are TITA, so a wrong answer costs nothing. Enter your best value.</li></ul></div>
        <div><h3>Quant</h3><ul class="small">
          <li>Pass 1 (about 18 min): every question you recognise as a template (replacement, meet-after, remainder, [x], logs, AP/GP, Venn min/max). Spend 90 s at most on each.</li>
          <li>Pass 2 (about 16 min): the mediums. If there's no method after 30 s, skip.</li>
          <li>Last 5 min: put a value in every TITA you've half-worked; it costs nothing.</li>
          <li>For a wrong-MCQ risk, eliminate two options first. Otherwise leave it blank.</li></ul></div>
      </div>
    </div>

    <div class="card"><h2>3 · Spotting easy, medium and hard in 30 seconds</h2>
      ${tbl(["", "Easy: take it", "Medium: take it second", "Hard: leave for the end or skip"], [
        ["RC passage", "Concrete topic (animals, a place, a historical episode); short sentences; few names of theories; questions ask “according to the passage”, “NOT mentioned”", "Argument with a clear claim → objection → verdict; one or two inference questions", "Abstract (philosophy, aesthetics, literary or social theory); the author rebuts a view you must first understand; long sentences; options are close paraphrases"],
        ["RC question", "Detail with a quoted phrase; “which is NOT mentioned” (check 4 options against the text)", "Inference one step from a line; author's attitude", "Analogy (“which situation is most similar”), strengthen/weaken, main idea of a hard passage"],
        ["VA", "Para-jumble with linking words (“This”, “But”, “for instance”); odd-one-out where one sentence changes the topic", "Summary where two options are close", "Sentence placement with no linking word; para-jumble of 4 general statements"],
        ["DILR set", "A single table or chart with calculation questions; or a schedule where one clue fixes a slot outright", "Grids / networks once listed; points tables (use total = 3 × matches − draws)", "Many conditional questions, several cases from the start, rules you must simulate for many rounds, or a set-up longer than half a page"],
        ["Quant", "You can name the template in 10 s; one or two lines of working; TITA with a whole-number answer", "Two concepts combined (e.g. ratio + time-work), or careful case-counting", "Long word problems with 3+ unknowns, unfamiliar functions or graphs, geometry with no figure given, “maximum/minimum” over several variables"]])}
    </div>

    <div class="card"><h2>4 · Eight years of RC: how hard were the passages?</h2>
      <p class="small">I measured all 92 RC passages from 2018–2025 in your paper pack for sentence length, word complexity, passage and option length, and ranked them. Expect roughly <b>1 easy, 2 medium and 1 hard passage in every slot</b>. This measures how hard the text is to read; a few questions can be harder or easier than their passage.</p>
      ${tbl(["Year", "Easy", "Medium", "Hard", "Passages"], [["2018", 2, 5, 3, 10], ["2019", 4, 4, 2, 10], ["2020", 3, 6, 3, 12], ["2021", 4, 6, 2, 12], ["2022", 2, 8, 2, 12], ["2023", 5, 3, 4, 12], ["2024", 4, 5, 3, 12], ["2025", 2, 6, 4, 12], ["<b>All</b>", "<b>26</b>", "<b>43</b>", "<b>23</b>", "<b>92</b>"]])}
      <div class="grid-2 fs-two">
        <div><h3>Easiest passages (do-first type)</h3><ul class="small">
          <li>2024 S3 — Moutai, China's luxury liquor</li><li>2022 S2 — Octopuses as misfits of their family</li><li>2020 S3 — Human contact becoming a luxury good</li>
          <li>2019 S2 — War and climate destroying heritage sites</li><li>2023 S1 — Wolves returning to rural France</li><li>2023 S2 — Second-hand clothes campaign</li>
          <li>2024 S2 — The spice trade before Europe</li><li>2019 S2 — Squatter cities</li><li>2021 S1 — Cuttlefish personalities</li><li>2025 S2 — How cave fish lost their eyes</li></ul>
          <p class="small muted">Pattern: animals, products, places and historical episodes, written as reporting.</p></div>
        <div><h3>Hardest passages (do-last type)</h3><ul class="small">
          <li>2021 S3 — The history of the unconscious</li><li>2025 S2 — Different science cultures</li><li>2020 S1 — The meaning of anarchy</li>
          <li>2018 S1 — Elephants and humans (dense ecology argument)</li><li>2025 S1 — Income inequality and growth</li><li>2024 S3 — Why languages die</li>
          <li>2024 S2 — Unintended consequences of technology</li><li>2025 S1 — Complex systems and uncertainty</li><li>2023 S3 — Romantic aesthetics</li><li>2019 S1 — Topophilia (love of place)</li></ul>
          <p class="small muted">Pattern: concepts and theories (philosophy, economics papers, aesthetics), long sentences, an author arguing with other scholars.</p></div>
      </div>
      <p class="small">About 2 in 5 RC questions each year were NOT / EXCEPT / least-likely questions. They are slow but safe marks: check each option against one line of the text.</p>
    </div>

    <div class="card"><h2>5 · Quant questions that were sitters (if you knew the template)</h2>
      ${tbl(["Template", "Seen in", "30-second method"], [
        ["Remove and refill", "2021 S1, S2 · 2023 S2 · 2024 S3 · 2025 S1", "Multiply the kept fractions (1 − x/V) round by round"],
        ["After meeting, A takes a h, B takes b h", "2020 S1, S2 · 2023 S1 Q16 · 2024 S1", "Speeds ∝ √b : √a; meeting time √(ab)"],
        ["Remainder of a large power", "every 2024 slot · digit sums 2025 S2, S3", "Find the cycle (Fermat / last-two-digit cycle)"],
        ["Greatest-integer [x] sums", "2022 S1 · 2024 S1 · 2025 S1", "Group terms with equal value"],
        ["Three-set Venn min/max", "2020 S2 · 2022 S1 · 2025 S3", "Count people and memberships: two equations"],
        ["Common root of two quadratics", "2024 S1 · 2025 S2", "Factor the easy one and plug in each root"],
        ["Circle in a triangle / trapezium", "2021 S1 · 2024 S1 · 2025 S3", "r = Area/s; tangential trapezium: legs = sum of parallel sides"],
        ["Regular hexagon / octagon", "2021 S1 · 2023 S3 · 2024 S3 · 2025 S2", "Hexagon = 6 equilateral triangles"],
        ["Rotating work roster", "2022 S3 Q66 · 2024 S3 Q66", "LCM units, add one cycle, walk the last cycle"],
        ["Numbers with distinct digits / digit conditions", "2020 S2, S3 · 2021 S2 · 2023 S1 · 2024 S3 · 2025 S3", "Split by number of digits; check the boundary"],
        ["Compound then simple interest", "2023 S1 · 2024 S2", "Chain the multipliers"]])}
      <p class="small muted">All 11 appear in this section's Quant papers with new numbers. The forecast page has a solved real example of each.</p>
    </div>

    <div class="card"><h2>6 · DILR: which sets were gettable in 2023–25</h2>
      <ul class="small">
        <li><b>Difficulty swings by year</b>: the 99%ile DILR score was 27 (2023, hardest), 38 (2024, easiest) and 30 (2025). In a hard year, 2 sets are enough.</li>
        <li><b>Fastest family: read the data.</b> One table or chart and arithmetic questions (2024 S1 countries visited, 2024 S3 nutrient table, 2025 S3 puzzle-competition chart). Open these first.</li>
        <li><b>A set with no TITA</b> appeared in 5 of the six 2024–25 slots. With options you can eliminate, so these are good second sets.</li>
        <li><b>Rule games</b> (2024 tournament, election, AC modes; 2025 yes/no game, passing game) are not hard to understand but take long to simulate. Do them third.</li>
        <li><b>Traps</b>: sets that open with several cases and ask mostly "if … then" questions, or need a grid you must rebuild (2024 S2 numbers 1–10). Skip these unless the other three are worse.</li>
        <li>Classic seating appeared once in 42 sets (2025 S1 round table). Don't spend the last days on it.</li></ul>
    </div>

    <div class="card"><h2>7 · The last three days</h2>
      ${tbl(["Day", "Do", "Don't"], [
        ["Today", "Paper 1 of each section, timed, back to back (2 h). Review for 1.5 h, sorting mistakes into “didn't know”, “misread” and “should have skipped”. Evening: VARC paper 2 + DILR paper 2.", "Start any new topic"],
        ["Tomorrow", "Full mock 3 (120 min) in your exam slot's time window. Review. Revise only the Quant templates above and your error log.", "Take more than one full mock"],
        ["Day before", "Paper 4 of each section, lightly. Read one editorial for 20 min. Prepare the admit card, ID and route. Sleep at your usual time.", "Look up scores or percentile predictions"],
        ["Exam day", "First 60 s of each section: scan and rank. Stick to the order rules above. Forget each section once it ends.", "Change your plan mid-paper"]])}
    </div>`;
  }

  function render() {
    A.show("final");
    view().innerHTML = `<div class="hero"><div><h1>Final Stretch</h1><p class="muted">12 new timed papers in the CAT 2024–25 pattern + the game plan for top IIMs</p></div>
      <div class="seg" id="fsTabs"><button data-t="papers" class="${tab === "papers" ? "active" : ""}">Papers</button><button data-t="plan" class="${tab === "plan" ? "active" : ""}">Game plan</button></div></div>
      ${tab === "papers" ? renderPapers() : renderPlan()}`;
    $$("#fsTabs button").forEach(b => b.onclick = () => { tab = b.dataset.t; try { localStorage.setItem("fs.tab", tab); } catch { /* storage unavailable */ } render(); });
    $$("[data-start]").forEach(b => b.onclick = () => A.startPaper(F.papers.find(p => p.id === b.dataset.start), 40));
    $$("[data-untimed]").forEach(b => b.onclick = () => A.startPaper(F.papers.find(p => p.id === b.dataset.untimed), 0));
    $$("[data-full]").forEach(b => b.onclick = () => {
      const n = b.dataset.full, ps = ["varc", "dilr", "qa"].map(s => F.papers.find(p => p.id === `fs-${s}-${n}`));
      A.startPaper({ id: `fs-full-${n}`, title: `Final Stretch · Full mock ${n}`, qids: ps.flatMap(p => p.qids) }, 120);
    });
  }

  window.FINAL = { route: render };
})();
