/* Real CAT papers — exam mode (section-locked, timed) and practice mode (instant checking).
   Paper content is NOT in this repo: it is loaded from the owner's private GitHub repo (with a
   read-only token) or from local JSON files, then cached in IndexedDB on this device. */
(() => {
  "use strict";
  const A = window.VARCApp;
  const { esc, fmt, fmtShort, pct } = A;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const KEY = "varc.cat.v1";
  const SEC = { varc: "VARC", dilr: "DILR", qa: "Quant" };
  const SEC_LONG = { varc: "Verbal Ability & Reading Comprehension", dilr: "Data Interpretation & Logical Reasoning", qa: "Quantitative Aptitude" };
  const TOPIC = { rc: "Reading Comprehension", pj: "Para Jumbles", ps: "Para Summary", ooo: "Odd Sentence Out", pc: "Sentence Placement", va: "Verbal Ability (other)",
    arithmetic: "Arithmetic", algebra: "Algebra", geometry: "Geometry & Mensuration", number: "Number System", modern: "Modern Math (P&C, Probability)" };
  const TARGET = { varc: 90e3, dilr: 120e3, qa: 105e3 };   // rough per-question pace targets

  // Method playbooks shown in the report for weak areas.
  const METHOD = {
    rc: ["Read the passage once, actively, before the questions: note each paragraph's job in 4–6 words.", "Answer central-idea/tone questions from your first-read map; go back to the text only for detail and EXCEPT questions.", "Eliminate options with extreme words (always, never, only), half-right clauses, and claims outside the passage's scope.", "Pick passages by readability: skim the first 2–3 lines and leave a dense one for last."],
    pj: ["Find the mandatory pair first (pronoun/‘this’/‘however’ that needs an antecedent) — it fixes most of the order.", "Identify the opener: a sentence that introduces a topic without referring back to anything.", "Check the closer: conclusions, implications, ‘thus/therefore’ sentences.", "TITA has no negative marking — always type an answer."],
    ps: ["State the paragraph's main point in your own words before reading options.", "Reject options that are too narrow (one example), too broad, or add a new idea.", "The right summary keeps the author's stance and the key relationship (cause, contrast) intact."],
    ooo: ["Find the paragraph's specific angle, not just its topic — the misfit usually shares the topic but not the angle.", "Build the 4-sentence chain (pairs, pronoun links) and see which sentence cannot attach.", "Watch for a sentence that shifts scope (general vs specific) or register."],
    pc: ["Read the sentences around each blank and look for the link the missing sentence must create (contrast, example, conclusion).", "Match pronouns and connectors in the given sentence to what comes just before the slot."],
    va: ["Treat it like a summary question: identify the author's core claim, then match the option that preserves it."],
    dilr: ["Spend the first 4–5 minutes scanning ALL sets and pick the two that look most structured (clear grid, few variables).", "Draw the table/grid before reading questions; write every condition in shorthand.", "If a set gives you nothing after 8–10 minutes, leave it — a fresh set is worth more than a stuck one.", "Solve TITA questions in a set too: no negative marking."],
    arithmetic: ["Convert percentages to fractions (12.5% = 1/8) and use multiplying factors instead of step-by-step changes.", "Speed/time/work: use LCM-of-time units, relative speed, and ratio methods instead of equations.", "Mixtures and averages: use alligation and deviation from the mean."],
    algebra: ["Plug in options or simple values (0, 1, −1) before solving algebraically.", "For inequalities and modulus, split into cases at critical points.", "Progressions: write the general term and sum formulas; look for symmetry (middle terms)."],
    geometry: ["Always draw the figure to rough scale and mark every given length/angle.", "Know standard triangles (30-60-90, 45-45-90, 3-4-5 family) and similarity ratios.", "Coordinate questions: midpoint/section formula and slopes are faster than distance calculations."],
    number: ["Remainders: use cyclicity, Euler/Fermat and remainder theorem of products.", "Factors: prime-factorise first; number of factors = product of (power + 1).", "Digit problems: write the number as 10a + b (or 100a + 10b + c) and work with that."],
    modern: ["Decide first: order matters (permutation) or not (combination).", "Use complement counting (total − unwanted) for ‘at least one’.", "Probability = favourable / total with the SAME counting method on both sides."],
  };

  // ---------- state ----------
  const blank = () => ({ cfg: { owner: "sujithsuresh-803", repo: "cat-papers-private", token: "", source: "" }, attempts: [], active: null });
  let S;
  try { S = Object.assign(blank(), JSON.parse(localStorage.getItem(KEY)) || {}); } catch { S = blank(); }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { /* storage unavailable */ } };

  // ---------- IndexedDB cache ----------
  const idb = (() => {
    let dbp;
    const open = () => dbp || (dbp = new Promise((res, rej) => {
      const r = indexedDB.open("varc-cat", 1);
      r.onupgradeneeded = () => r.result.createObjectStore("kv");
      r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
    }));
    const tx = (mode, fn) => open().then(db => new Promise((res, rej) => {
      const t = db.transaction("kv", mode), st = t.objectStore("kv"), req = fn(st);
      t.oncomplete = () => res(req && req.result); t.onerror = () => rej(t.error);
    }));
    return { get: k => tx("readonly", s => s.get(k)), put: (k, v) => tx("readwrite", s => s.put(v, k)), clear: () => tx("readwrite", s => s.clear()) };
  })();

  async function ghFetch(path) {
    const { owner, repo, token } = S.cfg;
    const r = await fetch(`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${path}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github.raw+json", "X-GitHub-Api-Version": "2022-11-28" }, cache: "no-store" });
    if (!r.ok) throw new Error(r.status === 401 ? "Token rejected (401). Check it hasn't expired." : r.status === 404 ? "Repo or file not found (404). Check the repo name and that the token can read it." : `GitHub error ${r.status}`);
    return r.json();
  }
  async function getIndex() {
    if (S.cfg.source === "github") {
      try { const ix = await ghFetch("index.json"); await idb.put("__index", ix); return ix; }
      catch (e) { const c = await idb.get("__index"); if (c) return c; throw e; }
    }
    return await idb.get("__index");
  }
  const memo = {};
  async function getPaper(id) {
    if (memo[id]) return memo[id];
    let p = await idb.get("paper:" + id);
    if (!p && S.cfg.source === "github") { p = await ghFetch(`papers/${id}.json`); await idb.put("paper:" + id, p); }
    if (!p) throw new Error("Paper not available on this device. Import it again.");
    return (memo[id] = p);
  }

  // ---------- helpers ----------
  const isAns = v => v !== undefined && v !== null && String(v).trim() !== "";
  const normT = v => String(v ?? "").trim().replace(/\s+/g, "");
  function grade(q, given) {
    if (!isAns(given)) return "skip";
    if (q.type === "mcq") return given === q.ans ? "correct" : "wrong";
    const g = normT(given), a = normT(q.ans);
    if (g === a) return "correct";
    const gn = parseFloat(g), an = parseFloat(a);
    return !isNaN(gn) && !isNaN(an) && Math.abs(gn - an) < 1e-9 && /^-?[\d.]+$/.test(g) ? "correct" : "wrong";
  }
  const marks = (q, r) => r === "correct" ? 3 : r === "wrong" && q.type === "mcq" ? -1 : 0;
  const view = () => $("#view-cat");
  const imgs = list => (list || []).map(u => `<img src="${u}" alt="" loading="lazy">`).join("");
  const topicName = (q) => q.sec === "dilr" ? `DILR ${q.topic.replace("set", "Set ")}` : TOPIC[q.topic] || q.topic;

  // ---------- routing ----------
  let tick = null, last = 0, paused = false, P = null;   // P = loaded paper of the active attempt
  function leave() { stopClock(); }
  async function route(h) {
    stopClock();
    A.show("cat");
    const parts = h.split("/");
    if (parts[1] === "report") return renderReport(parts[2]);
    if (parts[1] === "attempt" && S.active) return openAttempt();
    if (parts[1] === "setup" || !S.cfg.source) return renderSetup();
    return renderPapers();
  }

  // ---------- setup ----------
  function renderSetup() {
    const c = S.cfg;
    view().innerHTML = `
      <h1>Real CAT papers</h1>
      <p class="muted">CAT 2018–2022 (13 slots, 1,024 questions) with official answer keys and step-by-step solutions. The papers stay private: they load from your private GitHub repo, or from files on this device, and are cached in this browser.</p>
      <div class="grid-2">
        <div class="card"><h2>Load from your private GitHub repo</h2>
          <p class="muted small">Works on every device. Create a fine-grained token with <b>read-only Contents</b> access to just this repo, then paste it here once per device.</p>
          <div class="field"><span class="label">Repository</span><input class="inp" id="ghRepo" value="${esc(c.owner + "/" + c.repo)}"></div>
          <div class="field"><span class="label">Access token</span><input class="inp" id="ghToken" type="password" autocomplete="off" placeholder="github_pat_…" value="${esc(c.token)}"></div>
          <button class="btn primary" id="ghSave">Connect</button>
          <p class="muted small" id="ghMsg"></p>
          <details class="small"><summary>How to create the token</summary><ol>
            <li>GitHub → Settings → Developer settings → Personal access tokens → <b>Fine-grained tokens</b> → Generate new token.</li>
            <li>Repository access: <b>Only select repositories</b> → <code>${esc(c.repo)}</code>.</li>
            <li>Permissions → Repository permissions → <b>Contents: Read-only</b>. Nothing else.</li>
            <li>Generate, copy, paste above. The token is stored only in this browser.</li></ol></details>
        </div>
        <div class="card"><h2>Or load from files</h2>
          <p class="muted small">Pick the paper JSON files (the <code>papers/*.json</code> files from the private pack). They're stored in this browser only.</p>
          <input type="file" id="fileIn" accept=".json,application/json" multiple>
          <p class="muted small" id="fileMsg"></p>
        </div>
      </div>
      ${S.cfg.source ? `<p><a href="#cat" class="link">← Back to papers</a></p>` : ""}`;
    $("#ghSave").onclick = async () => {
      const [owner, repo] = $("#ghRepo").value.trim().split("/");
      Object.assign(S.cfg, { owner, repo, token: $("#ghToken").value.trim(), source: "github" });
      $("#ghMsg").textContent = "Connecting…";
      try { const ix = await ghFetch("index.json"); await idb.put("__index", ix); save(); $("#ghMsg").textContent = `Connected — ${ix.papers.length} papers.`; location.hash = "cat"; route("cat"); }
      catch (e) { S.cfg.source = ""; $("#ghMsg").textContent = e.message; }
    };
    $("#fileIn").onchange = async e => {
      const files = [...e.target.files]; let ok = 0;
      const ix = (await idb.get("__index")) || { version: 1, papers: [] };
      for (const f of files) {
        try {
          const p = JSON.parse(await f.text());
          if (!p.questions || !p.id) continue;
          await idb.put("paper:" + p.id, p);
          ix.papers = ix.papers.filter(x => x.id !== p.id).concat({ id: p.id, title: p.title, year: p.year, slot: p.slot, sections: p.sections });
          ok++;
        } catch { /* skip unreadable file */ }
      }
      ix.papers.sort((a, b) => b.year - a.year || a.slot - b.slot);
      await idb.put("__index", ix);
      if (ok) { S.cfg.source = S.cfg.source || "file"; save(); }
      $("#fileMsg").textContent = ok ? `Imported ${ok} paper${ok > 1 ? "s" : ""}.` : "No paper files found in that selection.";
      if (ok) setTimeout(() => { location.hash = "cat"; route("cat"); }, 600);
    };
  }

  // ---------- paper list ----------
  async function renderPapers() {
    view().innerHTML = `<h1>Real CAT papers</h1><p class="muted">Loading…</p>`;
    let ix;
    try { ix = await getIndex(); } catch (e) { view().innerHTML = `<h1>Real CAT papers</h1><div class="card"><p>${esc(e.message)}</p><a class="btn" href="#cat/setup">Fix connection</a></div>`; return; }
    if (!ix || !ix.papers.length) return renderSetup();
    const best = {};
    for (const at of S.attempts) { const k = at.paperId; if (!best[k] || at.score > best[k].score) best[k] = at; }
    const years = [...new Set(ix.papers.map(p => p.year))];
    const a = S.active;
    view().innerHTML = `
      <div class="report-head"><div><h1>Real CAT papers</h1><p class="muted">${ix.papers.length} papers · ${ix.papers.reduce((n, p) => n + p.sections.reduce((m, s) => m + s.n, 0), 0)} questions · official keys + solutions</p></div>
        <div class="report-actions"><a class="btn ghost" href="#cat/setup">Data source</a></div></div>
      ${a ? `<div class="resume"><div><b>Unfinished: ${esc(a.title)}</b><div class="muted small">${a.mode === "exam" ? "Exam mode · " + SEC[a.secs[a.si]] + " section · " + fmt(a.remaining[a.secs[a.si]]) + " left" : "Practice mode · " + Object.keys(a.answers).length + " answered"}</div></div>
        <div class="row gap"><button class="btn" id="catDiscard">Discard</button><button class="btn primary" id="catResume">Resume ▶</button></div></div>` : ""}
      <div class="card">
        <h2>How it works</h2>
        <div class="grid-2 modes-explain">
          <div><b>Exam mode</b><p class="muted small">Real CAT conditions: sections in order (VARC → DILR → QA), each with its own countdown (60 min for 2018–19, 40 min from 2020). You can't go back to a finished section. Answers and analysis appear only at the end.</p></div>
          <div><b>Normal (practice) mode</b><p class="muted small">No time limit. Answer a question, press <i>Check</i>, and see immediately whether it's right, the correct answer, the full solution, and the method to use.</p></div>
        </div>
      </div>
      ${years.map(y => `<h2 class="year-h">CAT ${y}</h2><div class="paper-grid">${ix.papers.filter(p => p.year === y).map(p => {
        const b = best[p.id], tot = p.sections.reduce((m, s) => m + s.n, 0);
        return `<div class="card paper">
          <div class="row between"><b>${esc(p.title)}</b>${b ? `<span class="score-pill">Best ${b.score}/${b.max}</span>` : ""}</div>
          <p class="muted small">${tot} questions · ${p.sections.map(s => `${SEC[s.id]} ${s.n}`).join(" · ")} · ${p.sections[0].minutes} min/section</p>
          <div class="field"><span class="label">Sections</span><select class="inp" data-sel="${p.id}">
            <option value="all">Full paper (${p.sections.length * p.sections[0].minutes} min)</option>
            ${p.sections.map(s => `<option value="${s.id}">${SEC[s.id]} only (${s.n} Qs)</option>`).join("")}</select></div>
          <div class="row gap"><button class="btn primary" data-start="exam" data-id="${p.id}">Exam mode</button><button class="btn" data-start="practice" data-id="${p.id}">Normal mode</button></div>
        </div>`; }).join("")}</div>`).join("")}
      ${S.attempts.length ? `<div class="card"><h2>Your attempts</h2>${S.attempts.map(at => `<a class="hist-item" href="#cat/report/${at.id}"><div><div class="t">${esc(at.title)}</div><div class="muted small">${new Date(at.finishedAt).toLocaleString()} · ${at.mode === "exam" ? "Exam" : "Normal"} mode · ${at.secs.map(s => SEC[s]).join(", ")}</div></div><span class="score-pill">${at.score}/${at.max}</span></a>`).join("")}</div>` : ""}`;
    $$("[data-start]").forEach(b => b.onclick = () => startAttempt(b.dataset.id, b.dataset.start, $(`[data-sel="${b.dataset.id}"]`).value, ix));
    if (a) {
      $("#catResume").onclick = () => { location.hash = "cat/attempt"; };
      $("#catDiscard").onclick = () => A.confirm("Discard the unfinished paper?", "Your answers in it will be lost.", "Discard", () => { S.active = null; save(); renderPapers(); });
    }
  }

  async function startAttempt(id, mode, which, ix) {
    if (S.active) return A.confirm("Replace your unfinished paper?", "Starting a new one discards the paper in progress.", "Start new", () => { S.active = null; save(); startAttempt(id, mode, which, ix); });
    const meta = ix.papers.find(p => p.id === id);
    view().innerHTML = `<h1>${esc(meta.title)}</h1><p class="muted">Loading paper… (${meta.bytes ? Math.round(meta.bytes / 1e6) + " MB, first time only" : "from this device"})</p>`;
    try { P = await getPaper(id); } catch (e) { A.alert(e.message); return renderPapers(); }
    const secs = which === "all" ? P.sections.map(s => s.id) : [which];
    const remaining = {}; for (const s of P.sections) remaining[s.id] = s.minutes * 60e3;
    S.active = { id: "c" + Date.now().toString(36), paperId: id, title: P.title + (which === "all" ? "" : ` · ${SEC[which]}`), mode, secs, si: 0, idx: 0,
      answers: {}, marked: {}, visited: {}, checked: {}, time: {}, remaining, used: {}, pauses: 0, created: Date.now() };
    save(); location.hash = "cat/attempt";
  }

  // ---------- attempt ----------
  const secQs = sec => P.questions.filter(q => q.sec === sec);
  const curQs = () => secQs(S.active.secs[S.active.si]);
  async function openAttempt() {
    const a = S.active;
    if (!P || P.id !== a.paperId) {
      view().innerHTML = `<p class="muted">Loading paper…</p>`;
      try { P = await getPaper(a.paperId); } catch (e) { view().innerHTML = `<div class="card"><p>${esc(e.message)}</p><a class="btn" href="#cat/setup">Data source</a></div>`; return; }
    }
    paused = false;
    view().innerHTML = `
      <div class="quizbar cat-bar">
        <div class="qmeta"><span id="cQc"></span><span id="cTags"></span></div>
        <div class="qctl">
          <span class="timer" id="cTimer" title="${a.mode === "exam" ? "Time left in this section" : "Time on this paper"}">00:00</span>
          <button class="btn ghost" id="cPause">❚❚ Pause</button>
          <button class="btn ghost" id="cExit">Save &amp; exit</button>
          <button class="btn danger" id="cSubmit">${a.mode === "exam" ? "Submit section" : "Finish"}</button>
          <button class="btn ghost palette-toggle" id="cPalT" aria-label="Question palette">☰</button>
        </div>
      </div>
      <div class="quiz-layout"><div class="quiz-main" id="cMain"></div>
        <aside class="palette" id="cPal"><h3 id="cSecName"></h3><div id="cPalGrid" class="pal-grid"></div>
          <div class="legend"><span><i class="dot ans"></i>Answered</span><span><i class="dot mark"></i>Marked</span><span><i class="dot vis"></i>Not answered</span><span><i class="dot"></i>Not visited</span></div>
          ${a.mode === "exam" ? `<p class="muted small">Section ${a.si + 1} of ${a.secs.length}. You can't return to a section after submitting it.</p>` : `<div class="sec-switch">${a.secs.map((s, i) => `<button class="btn ${i === a.si ? "primary" : "ghost"}" data-sec="${i}">${SEC[s]}</button>`).join("")}</div>`}
        </aside></div>
      <div class="pause-overlay hidden" id="cPauseO"><div class="pause-card"><h2>Paused</h2><p class="muted">Timer stopped and questions hidden.</p>
        <button class="btn primary big" id="cResume">▶ Resume</button><button class="btn ghost" id="cPauseExit">Save &amp; exit</button></div></div>`;
    $("#cPause").onclick = () => setPaused(true);
    $("#cResume").onclick = () => setPaused(false);
    $("#cExit").onclick = $("#cPauseExit").onclick = () => { stopClock(); save(); location.hash = "cat"; };
    $("#cSubmit").onclick = () => a.mode === "exam" ? submitSection(false) : finishPrompt();
    $("#cPalT").onclick = () => $("#cPal").classList.toggle("open");
    $$("[data-sec]").forEach(b => b.onclick = () => { a.si = +b.dataset.sec; a.idx = 0; save(); openAttempt(); });
    renderQ(); startClock();
  }

  function startClock() {
    stopClock(); last = Date.now();
    tick = setInterval(() => {
      const a = S.active; if (!a || paused) return;
      const now = Date.now(), d = Math.min(now - last, 5000); last = now;
      const sec = a.secs[a.si], q = curQs()[a.idx];
      a.time[q.n] = (a.time[q.n] || 0) + d; a.used[sec] = (a.used[sec] || 0) + d;
      if (a.mode === "exam") {
        a.remaining[sec] -= d;
        if (a.remaining[sec] <= 0) { a.remaining[sec] = 0; return submitSection(true); }
      }
      updTimer();
      if (Math.round((a.used[sec] || 0) / 1000) % 5 === 0) save();
    }, 1000);
  }
  function stopClock() { if (tick) clearInterval(tick); tick = null; }
  function updTimer() {
    const a = S.active, sec = a.secs[a.si], el = $("#cTimer"); if (!el) return;
    if (a.mode === "exam") { el.textContent = fmt(a.remaining[sec]); el.classList.toggle("low", a.remaining[sec] < 5 * 60e3); }
    else el.textContent = fmt(Object.values(a.used).reduce((x, y) => x + y, 0));
  }
  function setPaused(v) { paused = v; last = Date.now(); if (v) S.active.pauses++; $("#cPauseO").classList.toggle("hidden", !v); save(); }
  document.addEventListener("visibilitychange", () => { if (document.hidden && S.active && tick && !paused) setPaused(true); });

  function renderQ() {
    const a = S.active, qs = curQs(), q = qs[a.idx], sec = a.secs[a.si];
    a.visited[q.n] = true;
    $("#cQc").textContent = `${SEC[sec]} · Q${a.idx + 1} of ${qs.length}` + (q.n !== a.idx + 1 ? ` (paper Q${q.n})` : "");
    $("#cTags").innerHTML = `<span class="badge topic-b">${esc(P.title)}</span>${q.type === "tita" ? '<span class="badge new">TITA</span>' : ""}`;
    $("#cSecName").textContent = SEC_LONG[sec];
    updTimer();
    const given = a.answers[q.n], checked = a.mode === "practice" && a.checked[q.n];
    const res = checked ? grade(q, given) : null;
    let body = "";
    if (q.img) body += `<div class="qimg">${imgs(q.img)}</div>`;
    else body += `<p class="qstem serif">${esc(q.stem).replace(/\n\n/g, "</p><p class=\"qstem serif\">")}</p>`;
    if (q.type === "mcq") {
      const opts = q.opts || Array.from({ length: q.nopts || 4 }, (_, i) => ({ k: "ABCDE"[i], t: "" }));
      body += `<div class="options ${q.opts ? "" : "opt-row"}">${opts.map(o => {
        let cls = given === o.k ? "sel" : "";
        if (checked) cls = o.k === q.ans ? "correct" : given === o.k ? "wrong" : "";
        return `<button class="opt ${cls}" data-k="${o.k}" ${checked ? "disabled" : ""}><span class="k">${o.k}</span>${o.t ? `<span>${esc(o.t)}</span>` : ""}</button>`; }).join("")}</div>`;
    } else {
      body += `<div class="tita"><input id="cTita" inputmode="decimal" autocomplete="off" value="${esc(given || "")}" placeholder="Type your answer" ${checked ? "disabled" : ""}>
        <div class="keypad">${"1234567890".split("").map(d => `<button data-d="${d}" ${checked ? "disabled" : ""}>${d}</button>`).join("")}<button data-d="." ${checked ? "disabled" : ""}>.</button><button data-d="-" ${checked ? "disabled" : ""}>−</button><button data-d="back" ${checked ? "disabled" : ""}>⌫</button></div></div>
        <p class="tita-note">TITA — no negative marking for a wrong answer.</p>`;
    }
    if (checked) body += feedback(q, given, res);
    const nav = `<div class="qnav"><div class="grp"><button class="btn" id="cPrev" ${a.idx === 0 ? "disabled" : ""}>← Previous</button>${checked ? "" : `<button class="btn ghost" id="cClear">Clear</button>`}</div>
      <div class="grp">${a.mode === "practice"
        ? (checked ? "" : `<button class="btn primary" id="cCheck">Check answer</button>`) + `<button class="btn ${checked ? "primary" : ""}" id="cNext">${a.idx < qs.length - 1 ? "Next →" : a.si < a.secs.length - 1 ? `Next: ${SEC[a.secs[a.si + 1]]} →` : "Finish"}</button>`
        : `<button class="btn ghost" id="cMark">${a.marked[q.n] ? "★ Unmark" : "☆ Mark for review"}</button><button class="btn primary" id="cNext">${a.idx === qs.length - 1 ? "Save" : "Save & next →"}</button>`}</div></div>`;
    const card = `<div class="qcard">${body}${nav}</div>`;
    const set = q.set && P.sets.find(s => s.id === q.set);
    if (set && (set.paras?.length || set.img?.length)) {
      const sameSet = qs.filter(x => x.set === set.id).map(x => qs.indexOf(x) + 1);
      const label = `Questions ${sameSet[0]}–${sameSet[sameSet.length - 1]} are based on this ${sec === "varc" ? "passage" : "set"}`;
      if (set.paras) {
        $("#cMain").innerHTML = `<div class="q-split"><article class="passage" id="cPassage"><p class="muted small">${label}</p>${set.paras.map(x => `<p>${esc(x)}</p>`).join("")}</article>${card}</div>`;
        if (a._lastSet === set.id && a._ps != null) $("#cPassage").scrollTop = a._ps;
        $("#cPassage").onscroll = e => { a._ps = e.target.scrollTop; };
      } else {   // image sets (DILR/QA) read better full-width, stacked above the question
        const open = a._setOpen?.[set.id] !== false;
        $("#cMain").innerHTML = `<details class="card set-card" id="cSetBox" ${open ? "open" : ""}><summary>${label} <span class="muted small">(tap image to zoom)</span></summary><div class="qimg">${imgs(set.img)}</div></details>${card}`;
        $("#cSetBox").ontoggle = e => { (a._setOpen = a._setOpen || {})[set.id] = e.target.open; };
      }
      a._lastSet = set.id;
    } else { $("#cMain").innerHTML = card; a._lastSet = null; }

    // wiring
    $$("#cMain .opt").forEach(b => b.onclick = () => { if (checked) return; a.answers[q.n] = a.answers[q.n] === b.dataset.k ? undefined : b.dataset.k; if (!isAns(a.answers[q.n])) delete a.answers[q.n]; save(); renderQ(); });
    const ti = $("#cTita");
    if (ti && !checked) {
      const setT = v => { ti.value = v; if (isAns(v)) a.answers[q.n] = v.trim(); else delete a.answers[q.n]; save(); renderPal(); };
      ti.oninput = () => setT(ti.value.replace(/[^\d.\-\/]/g, ""));
      $$("#cMain .keypad button").forEach(b => b.onclick = () => { const d = b.dataset.d; setT(d === "back" ? ti.value.slice(0, -1) : ti.value + d); });
    }
    $("#cPrev").onclick = () => go(a.idx - 1);
    const nx = $("#cNext");
    nx.onclick = () => {
      if (a.idx < qs.length - 1) return go(a.idx + 1);
      if (a.mode === "exam") return submitSection(false);
      if (a.si < a.secs.length - 1) { a.si++; a.idx = 0; save(); return openAttempt(); }
      finishPrompt();
    };
    if ($("#cClear")) $("#cClear").onclick = () => { delete a.answers[q.n]; save(); renderQ(); };
    if ($("#cMark")) $("#cMark").onclick = () => { a.marked[q.n] = !a.marked[q.n]; save(); a.marked[q.n] && a.idx < qs.length - 1 ? go(a.idx + 1) : renderQ(); };
    if ($("#cCheck")) $("#cCheck").onclick = () => {
      if (!isAns(a.answers[q.n])) return A.confirm("Reveal without answering?", "This question will count as skipped.", "Show solution", () => { a.checked[q.n] = true; save(); renderQ(); });
      a.checked[q.n] = true; save(); renderQ();
      const fb = $("#cFeedback"); if (fb) fb.scrollIntoView({ behavior: "smooth", block: "nearest" });
    };
    renderPal();
  }

  function feedback(q, given, res) {
    const set = q.set && P.sets.find(s => s.id === q.set);
    const ok = res === "correct";
    const tag = res === "correct" ? `<span class="verdict c">✓ Correct · +3</span>` : res === "wrong" ? `<span class="verdict w">✗ Wrong · ${q.type === "mcq" ? "−1" : "0 (TITA)"}</span>` : `<span class="verdict s">Not answered</span>`;
    const expl = solutionHtml(q, set);
    const method = METHOD[q.sec === "dilr" ? "dilr" : q.topic] || [];
    return `<div class="feedback ${ok ? "fb-ok" : "fb-no"}" id="cFeedback">
      <div class="row between">${tag}<span>Correct answer: <b>${esc(q.ans)}</b>${!ok && isAns(given) ? ` · yours: <b>${esc(given)}</b>` : ""}</span></div>
      ${expl}
      ${method.length ? `<details class="method" ${ok ? "" : "open"}><summary>Method for ${esc(topicName(q))}</summary><ul>${method.map(m => `<li>${esc(m)}</li>`).join("")}</ul></details>` : ""}</div>`;
  }
  function solutionHtml(q, set) {
    let h = "";
    if (set && (set.expl?.length || set.expl_img?.length)) h += `<details class="sol" open><summary>Set solution</summary>${set.expl ? set.expl.map(x => `<p>${esc(x)}</p>`).join("") : `<div class="qimg">${imgs(set.expl_img)}</div>`}</details>`;
    if (q.expl?.length) h += `<div class="sol-body"><b>Solution</b>${q.expl.map(x => `<p>${esc(x)}</p>`).join("")}</div>`;
    else if (q.expl_img?.length) h += `<div class="sol-body"><b>Solution</b><div class="qimg">${imgs(q.expl_img)}</div></div>`;
    return h || `<p class="muted small">See the set solution above.</p>`;
  }

  function go(i) {
    const a = S.active, qs = curQs(); if (i < 0 || i >= qs.length) return;
    a.idx = i; save(); renderQ(); $("#cPal").classList.remove("open");
    if (!qs[i].set) window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function renderPal() {
    const a = S.active, qs = curQs();
    $("#cPalGrid").innerHTML = qs.map((q, i) => {
      let cls = a.marked[q.n] ? "mark" : isAns(a.answers[q.n]) ? "ans" : a.visited[q.n] ? "vis" : "";
      if (a.mode === "practice" && a.checked[q.n]) cls = grade(q, a.answers[q.n]) === "correct" ? "ans" : "vis";
      return `<button class="${cls} ${i === a.idx ? "cur" : ""}" data-i="${i}">${i + 1}</button>`; }).join("");
    $$("#cPalGrid button").forEach(b => b.onclick = () => go(+b.dataset.i));
  }

  function submitSection(auto) {
    const a = S.active, sec = a.secs[a.si], qs = curQs();
    const doIt = () => {
      if (a.si < a.secs.length - 1) {
        a.si++; a.idx = 0; save();
        openAttempt().then(() => {
          stopClock();   // the next section's clock starts only when the candidate is ready
          A.alert(`${auto ? `Time's up for ${SEC[sec]}.` : `${SEC[sec]} submitted.`} Next: ${SEC_LONG[a.secs[a.si]]} — ${fmt(a.remaining[a.secs[a.si]])}. The timer starts when you press OK.`, startClock);
        });
      } else finish();
    };
    if (auto) { stopClock(); return doIt(); }
    const n = qs.filter(q => isAns(a.answers[q.n])).length;
    A.confirm(`Submit the ${SEC[sec]} section?`, `${n} of ${qs.length} answered · ${fmt(a.remaining[sec])} left. You can't return to this section.`, a.si < a.secs.length - 1 ? "Submit & next section" : "Submit paper", doIt);
  }
  function finishPrompt() {
    const a = S.active, all = a.secs.flatMap(s => secQs(s));
    const n = all.filter(q => a.checked[q.n] || isAns(a.answers[q.n])).length;
    A.confirm("Finish and see your report?", `${n} of ${all.length} questions attempted. Unchecked answers will also be graded.`, "Finish", finish);
  }

  function finish() {
    const a = S.active; stopClock();
    const results = a.secs.flatMap(s => secQs(s)).map(q => {
      const given = isAns(a.answers[q.n]) ? a.answers[q.n] : null, result = grade(q, given);
      return { n: q.n, sec: q.sec, topic: q.topic, set: q.set || null, type: q.type, given, ans: q.ans, result, marks: marks(q, result), time: a.time[q.n] || 0 };
    });
    const rec = { id: a.id, paperId: a.paperId, title: a.title, mode: a.mode, secs: a.secs, created: a.created, finishedAt: Date.now(), used: a.used, pauses: a.pauses,
      minutes: Object.fromEntries(P.sections.map(s => [s.id, s.minutes])), results,
      score: results.reduce((x, r) => x + r.marks, 0), max: results.length * 3 };
    S.attempts.unshift(rec); S.active = null; save();
    history.replaceState(null, "", "#cat/report/" + rec.id);
    renderReport(rec.id);
  }

  // ---------- report ----------
  function sum(rs) {
    const s = { n: rs.length, c: 0, w: 0, sk: 0, score: 0, time: 0, negs: 0 };
    for (const r of rs) { s[r.result === "correct" ? "c" : r.result === "wrong" ? "w" : "sk"]++; s.score += r.marks; s.time += r.time; if (r.marks < 0) s.negs++; }
    s.att = s.c + s.w; s.acc = pct(s.c, s.att); return s;
  }
  const row = (label, s) => `<tr><td>${label}</td><td>${s.n}</td><td>${s.att}</td><td style="color:var(--good)">${s.c}</td><td style="color:var(--bad)">${s.w}</td><td>${s.att ? s.acc + "%" : "–"}</td><td><b>${s.score}</b></td><td>${fmtShort(s.time)}</td><td>${s.att ? fmtShort(s.time / Math.max(s.att, 1)) : "–"}</td></tr>`;
  const HEAD = `<tr><th></th><th>Qs</th><th>Attempted</th><th>Correct</th><th>Wrong</th><th>Accuracy</th><th>Score</th><th>Time</th><th>Time/attempt</th></tr>`;
  const group = (rs, key) => { const g = {}; for (const r of rs) (g[r[key]] = g[r[key]] || []).push(r); return g; };

  function diagnose(rec) {
    const out = [], R = rec.results, weak = new Set();
    const negs = R.filter(r => r.marks < 0).length;
    if (negs >= 4) out.push(["warn", `Negative marking cost you <b>${negs} marks</b> (${negs} wrong MCQs). Attempt an MCQ only when you've eliminated at least two options with a reason.`]);
    const titaSkip = R.filter(r => r.type === "tita" && r.result === "skip").length;
    if (titaSkip) out.push(["warn", `<b>${titaSkip} TITA questions left blank.</b> TITA carries no negative marking — an educated answer is free marks.`]);
    for (const sec of rec.secs) {
      const rs = R.filter(r => r.sec === sec), s = sum(rs); if (!rs.length) continue;
      const lim = (rec.minutes[sec] || 40) * 60e3, used = rec.used[sec] || 0;
      if (rec.mode === "exam" && used < lim * 0.8 && s.sk > rs.length * 0.3) out.push(["warn", `${SEC[sec]}: you submitted with ${fmt(lim - used)} still on the clock and ${s.sk} questions untouched. Use the full time on the easiest remaining questions.`]);
      if (s.att && s.acc < 50) out.push(["warn", `${SEC[sec]} accuracy is ${s.acc}%. Below ~60%, more attempts lower your score — attempt fewer, more certain questions.`]);
      if (s.att && s.acc >= 80 && s.att < rs.length * 0.6) out.push(["good", `${SEC[sec]}: ${s.acc}% accuracy on ${s.att} attempts — you can afford to attempt more questions in this section.`]);
    }
    // VARC by type / QA by topic
    for (const sec of ["varc", "qa"]) {
      const g = group(R.filter(r => r.sec === sec), "topic");
      for (const [t, rs] of Object.entries(g)) {
        const s = sum(rs);
        if (s.att >= 2 && s.acc < 50) { weak.add(t); out.push(["warn", `<b>${TOPIC[t]}</b>: only ${s.c} of ${s.att} attempts correct (${s.acc}%), ${fmtShort(s.time / s.att)} per attempt. See the method below.`]); }
        else if (s.n >= 3 && s.sk / s.n > 0.6) { weak.add(t); out.push(["warn", `<b>${TOPIC[t]}</b>: you attempted just ${s.att} of ${s.n}. If you're avoiding this type, it's costing marks — practise it in Normal mode.`]); }
        else if (s.att >= 3 && s.acc >= 75) out.push(["good", `<b>${TOPIC[t]}</b>: strong — ${s.c}/${s.n} correct.`]);
        const avg = s.att ? s.time / s.att : 0;
        if (s.att >= 2 && avg > TARGET[sec] * 1.6) { weak.add(t); out.push(["warn", `<b>${TOPIC[t]}</b> is slow: ${fmtShort(avg)} per attempt vs a target of about ${fmtShort(TARGET[sec])}.`]); }
      }
    }
    // DILR set selection
    const sets = group(R.filter(r => r.sec === "dilr"), "set");
    const setRows = Object.entries(sets).map(([id, rs], i) => ({ i: i + 1, s: sum(rs) }));
    for (const { i, s } of setRows) {
      if (s.time > 12 * 60e3 && s.c <= 1) { weak.add("dilr"); out.push(["warn", `DILR Set ${i}: ${fmtShort(s.time)} spent for ${s.c} correct — a time sink. Leave a set that isn't opening up after ~8–10 minutes.`]); }
      else if (s.c >= Math.ceil(s.n * 0.75)) out.push(["good", `DILR Set ${i}: ${s.c}/${s.n} — good set selection.`]);
    }
    if (rec.secs.includes("dilr") && setRows.filter(x => x.s.att > 0).length > 4) out.push(["warn", `You touched ${setRows.filter(x => x.s.att > 0).length} DILR sets. Toppers usually solve 2–3 sets fully rather than nibbling at all of them.`]);
    return { notes: out, weak: [...weak] };
  }

  async function renderReport(id) {
    stopClock();
    const rec = S.attempts.find(x => x.id === id);
    if (!rec) { view().innerHTML = `<div class="card empty">Report not found. <a href="#cat">Back to papers</a></div>`; return; }
    const R = rec.results, s = sum(R), { notes, weak } = diagnose(rec);
    const bySec = rec.secs.map(sec => row(SEC[sec], sum(R.filter(r => r.sec === sec)))).join("");
    const topicRows = sec => Object.entries(group(R.filter(r => r.sec === sec), "topic")).map(([t, rs]) => row(TOPIC[t] || t, sum(rs))).join("");
    const setRows = Object.entries(group(R.filter(r => r.sec === "dilr"), "set")).map(([, rs], i) => row(`Set ${i + 1} (Q${rs[0].n}–${rs[rs.length - 1].n})`, sum(rs))).join("");
    view().innerHTML = `
      <div class="report-head"><div><h1>${esc(rec.title)}</h1><p class="muted">${rec.mode === "exam" ? "Exam mode" : "Normal mode"} · ${new Date(rec.finishedAt).toLocaleString()}${rec.pauses ? ` · paused ${rec.pauses}×` : ""}</p></div>
        <div class="report-actions"><a class="btn" href="#cat">All papers</a></div></div>
      <div class="kpis">
        <div class="kpi"><div class="v">${s.score}<span class="muted" style="font-size:1rem"> / ${rec.max}</span></div><div class="l">CAT score</div></div>
        <div class="kpi ${s.acc >= 70 ? "good" : s.att && s.acc < 45 ? "bad" : ""}"><div class="v">${s.att ? s.acc + "%" : "–"}</div><div class="l">Accuracy</div></div>
        <div class="kpi"><div class="v">${s.att}<span class="muted" style="font-size:1rem"> / ${s.n}</span></div><div class="l">Attempted</div></div>
        <div class="kpi good"><div class="v">${s.c}</div><div class="l">Correct</div></div>
        <div class="kpi bad"><div class="v">${s.w}</div><div class="l">Wrong (−${s.negs})</div></div>
        <div class="kpi"><div class="v">${fmt(s.time)}</div><div class="l">Time</div></div>
      </div>
      <div class="card"><h2>Where to improve</h2><ul class="insights">${notes.map(([c, t]) => `<li class="${c}">${t}</li>`).join("") || "<li>Clean attempt — no major issues found.</li>"}</ul></div>
      ${weak.length ? `<div class="card"><h2>How to improve — methods for your weak areas</h2>${weak.map(t => `<div class="method-block"><b>${esc(t === "dilr" ? "DILR set selection" : TOPIC[t])}</b><ul>${(METHOD[t] || []).map(m => `<li>${esc(m)}</li>`).join("")}</ul></div>`).join("")}</div>` : ""}
      <div class="card"><h2>By section</h2><div class="tbl-wrap"><table class="tbl">${HEAD}${bySec}</table></div></div>
      <div class="grid-2">
        ${rec.secs.includes("varc") ? `<div class="card"><h2>VARC by question type</h2><div class="tbl-wrap"><table class="tbl">${HEAD}${topicRows("varc")}</table></div></div>` : ""}
        ${rec.secs.includes("qa") ? `<div class="card"><h2>Quant by topic</h2><div class="tbl-wrap"><table class="tbl">${HEAD}${topicRows("qa")}</table></div><p class="muted small">Topics are auto-tagged and approximate.</p></div>` : ""}
        ${rec.secs.includes("dilr") ? `<div class="card"><h2>DILR by set</h2><div class="tbl-wrap"><table class="tbl">${HEAD}${setRows}</table></div></div>` : ""}
      </div>
      <div class="card"><h2>Answers &amp; solutions</h2>
        <div class="filters"><button class="active" data-f="all">All (${s.n})</button><button data-f="wrong">Wrong (${s.w})</button><button data-f="skip">Skipped (${s.sk})</button><button data-f="correct">Correct (${s.c})</button></div>
        <div id="cReview">${R.map(r => `<details class="review r-${r.result === "skip" ? "skip" : r.result}" data-res="${r.result}" data-n="${r.n}">
          <summary class="review-head"><div class="tags"><b>${SEC[r.sec]} Q${r.n}</b><span class="badge topic-b">${esc(r.sec === "dilr" ? "DILR" : TOPIC[r.topic] || r.topic)}</span>${r.type === "tita" ? '<span class="badge new">TITA</span>' : ""}</div>
          <div class="tags">${r.result === "correct" ? '<span class="verdict c">✓ +3</span>' : r.result === "wrong" ? `<span class="verdict w">✗ ${r.marks}</span>` : '<span class="verdict s">— 0</span>'}<span class="muted">Yours: <b>${r.given ? esc(r.given) : "—"}</b> · Key: <b>${esc(r.ans)}</b> · ⏱ ${fmtShort(r.time)}</span></div></summary>
          <div class="rv-body"></div></details>`).join("")}</div></div>
      <p class="muted small">Scoring: +3 correct, −1 wrong MCQ, 0 wrong TITA, 0 skipped. Solutions are from the paper pack.</p>`;
    $$(".filters button").forEach(b => b.onclick = () => {
      $$(".filters button").forEach(x => x.classList.toggle("active", x === b));
      $$("#cReview .review").forEach(d => d.classList.toggle("hidden", b.dataset.f !== "all" && d.dataset.res !== b.dataset.f));
    });
    // Solutions load lazily from the paper when a question is expanded.
    $$("#cReview details").forEach(d => d.addEventListener("toggle", async () => {
      const body = $(".rv-body", d); if (!d.open || body.dataset.done) return;
      body.innerHTML = `<p class="muted">Loading…</p>`;
      try {
        const paper = await getPaper(rec.paperId), q = paper.questions.find(x => x.n === +d.dataset.n), set = q.set && paper.sets.find(x => x.id === q.set);
        const r = rec.results.find(x => x.n === q.n);
        let h = "";
        if (set && (set.paras?.length || set.img?.length)) h += `<details class="sol"><summary>Show ${q.sec === "varc" ? "passage" : "set"}</summary>${set.paras ? set.paras.map(x => `<p class="serif-p">${esc(x)}</p>`).join("") : `<div class="qimg">${imgs(set.img)}</div>`}</details>`;
        h += q.img ? `<div class="qimg">${imgs(q.img)}</div>` : `<p class="qstem serif">${esc(q.stem)}</p>`;
        if (q.opts) h += `<div class="options">${q.opts.map(o => `<div class="opt ${o.k === q.ans ? "correct" : o.k === r.given ? "wrong" : ""}"><span class="k">${o.k}</span><span>${esc(o.t)}</span></div>`).join("")}</div>`;
        h += solutionHtml(q, set);
        const m = METHOD[q.sec === "dilr" ? "dilr" : q.topic];
        if (m) h += `<details class="method"><summary>Method for ${esc(topicName(q))}</summary><ul>${m.map(x => `<li>${esc(x)}</li>`).join("")}</ul></details>`;
        body.innerHTML = h; body.dataset.done = 1;
      } catch (e) { body.innerHTML = `<p class="muted">${esc(e.message)}</p>`; }
    }));
  }

  // tap an image to view it at full size (pinch-zoom / scroll on phones)
  document.addEventListener("click", e => {
    const img = e.target.closest(".qimg img"); if (!img || !$("#view-cat") || $("#view-cat").classList.contains("hidden")) return;
    const o = document.createElement("div"); o.className = "zoom";
    o.innerHTML = `<button class="btn" aria-label="Close">✕ Close</button><div class="zoom-inner"><img src="${img.src}" alt=""></div>`;
    o.onclick = ev => { if (ev.target === o || ev.target.tagName === "BUTTON") o.remove(); };
    document.body.appendChild(o);
  });

  // keyboard: A–D select, ←/→ navigate, P pause (only on the attempt screen)
  document.addEventListener("keydown", e => {
    if (!tick || !S.active || e.target.tagName === "INPUT" || !$("#modal").classList.contains("hidden")) return;
    if (e.key.toLowerCase() === "p") return setPaused(!paused);
    if (paused) return;
    const k = e.key.toUpperCase();
    if (k.length === 1 && "ABCDE".includes(k)) { const b = $(`#cMain .opt[data-k="${k}"]`); if (b) b.click(); }
    else if (e.key === "ArrowRight") go(S.active.idx + 1);
    else if (e.key === "ArrowLeft") go(S.active.idx - 1);
  });
  window.addEventListener("beforeunload", save);

  window.RealCAT = { route, leave };
  A.start();
})();
