/* VARC PYQ — CAT 2022–2025 VARC questions only.
   CAT mode: a randomised 24-question, 40-minute section built like the real one (4 RC passages + 8 VA).
   Practice mode: untimed, topic by topic, instant checking with explanations.
   Question content is NOT in this repo: it loads from the owner's private repo (same token as Real CAT)
   or from an imported file, and is cached in this browser. */
(() => {
  "use strict";
  const A = window.VARCApp;
  const { esc, fmt, fmtShort, pct } = A;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const KEY = "varc.pyq.v1", FILE = "varc/pyq-2022-2025.json", CACHE = "pyq:2022-2025";
  const TOPIC = { rc: "Reading Comprehension", ps: "Para Summary", pc: "Sentence Placement", pj: "Para Jumbles", ooo: "Odd Sentence Out" };
  const SHORT = { rc: "RC", ps: "Summary", pc: "Placement", pj: "Jumbles", ooo: "Odd one out" };
  const PATTERNS = {
    "2025": { label: "CAT 2025 style", va: { pj: 2, ps: 2, pc: 2, ooo: 2 } },
    "2024": { label: "CAT 2024 style (no jumbles)", va: { ps: 3, pc: 3, ooo: 2 } },
    "2022": { label: "CAT 2022 style", va: { pj: 3, ps: 3, pc: 2 } },
  };
  const METHOD = {
    rc: ["Read the passage once, actively: note each paragraph's job in a few words before touching the questions.", "Answer main-idea and tone questions from your first-read map; go back to the text for detail and EXCEPT questions.", "Eliminate options with extreme words (always, never, only), half-right clauses, and claims outside the passage.", "In CAT mode, pick passages by readability: skim 2–3 lines and leave the densest passage for last."],
    pj: ["Find the mandatory pair first (a pronoun, 'this', 'however' that needs something before it).", "The opener introduces the topic without referring back; the closer concludes or generalises.", "TITA: no negative marking — always key in an answer."],
    ps: ["State the paragraph's point in your own words before reading the options.", "Reject options that are too narrow (one example), too broad, or that add a new idea or a stronger claim.", "Keep the author's stance and key relationship (cause, contrast, then-vs-now) intact."],
    ooo: ["Find the paragraph's specific angle, not just its topic — the odd one often shares the topic but not the angle.", "Build the 4-sentence chain with link words and pronouns; the sentence that can't attach is out.", "Watch for a shift in scope, time frame or register."],
    pc: ["Read the sentences on both sides of each blank; the missing sentence must link to both.", "Match its pronouns, 'this/these', connectors and repeated nouns to what comes just before the slot."],
  };
  const TARGET_MS = { rc: 100e3, ps: 90e3, pc: 90e3, pj: 120e3, ooo: 100e3 };

  // ---------- state ----------
  const blank = () => ({ attempts: [], active: null, seen: {} });
  let S;
  try { S = Object.assign(blank(), JSON.parse(localStorage.getItem(KEY)) || {}); } catch { S = blank(); }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { /* storage unavailable */ } };
  let D = null, Q = {}, tick = null, last = 0, paused = false;
  const view = () => $("#view-pyq");

  async function load() {
    if (D) return D;
    const rc = window.RealCAT;
    D = await rc.cachedJSON(FILE, CACHE);
    if (!D) return null;
    Q = Object.fromEntries(D.questions.map(q => [q.id, q]));
    return D;
  }

  // ---------- helpers ----------
  const isAns = v => v !== undefined && v !== null && String(v).trim() !== "";
  const normT = v => String(v ?? "").trim().replace(/\s+/g, "");
  const grade = (q, g) => !isAns(g) ? "skip" : q.type === "mcq" ? (g === q.ans ? "correct" : "wrong") : (normT(g) === normT(q.ans) ? "correct" : "wrong");
  const marks = (q, r) => r === "correct" ? 3 : r === "wrong" && q.type === "mcq" ? -1 : 0;
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const paperTitle = id => (D.papers.find(p => p.id === id) || {}).title || id;
  const setQs = sid => D.questions.filter(q => q.set === sid);
  const seenQ = id => S.seen[id];
  const paras = s => esc(s).split(/\n\n+/).map(x => `<p class="qstem serif">${x}</p>`).join("");

  // ---------- routing ----------
  function leave() { stopClock(); }
  async function route(h) {
    stopClock(); A.show("pyq");
    view().innerHTML = `<h1>VARC PYQs</h1><p class="muted">Loading…</p>`;
    let ok;
    try { ok = await load(); } catch (e) { return renderConnect(e.message); }
    if (!ok) return renderConnect();
    const parts = h.split("/");
    if (parts[1] === "report") return renderReport(parts[2]);
    if (parts[1] === "go" && S.active) return openSession();
    renderHome();
  }

  function renderConnect(err) {
    view().innerHTML = `<h1>VARC PYQs · CAT 2022–2025</h1>
      <div class="card"><p>These are real CAT questions, so they stay private and load from your private repo — the <b>same connection as Real CAT</b>.</p>
      ${err ? `<p class="bad-t">${esc(err)}</p>` : ""}
      <div class="row gap"><a class="btn primary" href="#cat/setup">Connect GitHub (one-time)</a></div>
      <p class="muted small" style="margin-top:14px">Or import the file <code>${FILE}</code> from the private pack:</p>
      <input type="file" id="pyqFile" accept=".json,application/json"><p class="muted small" id="pyqMsg"></p></div>`;
    $("#pyqFile").onchange = async e => {
      try {
        const d = JSON.parse(await e.target.files[0].text());
        if (!d.questions || !d.sets) throw new Error("That isn't the PYQ file.");
        await window.RealCAT.putCache(CACHE, d); D = null; route("pyq");
      } catch (err2) { $("#pyqMsg").textContent = err2.message; }
    };
  }

  // ---------- home ----------
  function topicStats(t) {
    const qs = D.questions.filter(q => q.topic === t), done = qs.filter(q => seenQ(q.id));
    const c = done.filter(q => S.seen[q.id].r === "correct").length;
    return { n: qs.length, done: done.length, c, acc: pct(c, done.length) };
  }
  function renderHome() {
    const nP = Object.keys(D.sets).length, a = S.active;
    view().innerHTML = `
      <div class="report-head"><div><h1>VARC PYQs · CAT 2022–2025</h1>
        <p class="muted">${D.papers.length} slots · ${D.questions.length} questions · ${nP} RC passages · every question with the answer and an explanation</p></div></div>
      ${a ? `<div class="resume"><div><b>Unfinished: ${esc(a.title)}</b><div class="muted small">${a.mode === "cat" ? "CAT mode · " + fmt(a.remaining) + " left" : "Practice · " + Object.keys(a.checked).length + " of " + a.qids.length + " checked"}</div></div>
        <div class="row gap"><button class="btn" id="pDiscard">Discard</button><button class="btn primary" id="pResume">Resume ▶</button></div></div>` : ""}
      <div class="grid-2">
        <div class="card">
          <h2>CAT mode · timed</h2>
          <p class="muted small">A fresh 24-question VARC section, shuffled like the real thing: <b>4 RC passages (16 Qs) + 8 VA</b>, mixed across slots and years. <b>40 minutes</b>, +3 / −1 (TITA: no negative). Answers and analysis only at the end.</p>
          <div class="field"><span class="label">Build</span><select class="inp" id="pBuild">
            <option value="mix:2025">Randomised mix · CAT 2025 pattern (RC 16 · PJ 2 · PS 2 · PC 2 · OOO 2)</option>
            <option value="mix:2024">Randomised mix · CAT 2024 pattern (RC 16 · PS 3 · PC 3 · OOO 2)</option>
            <option value="mix:2022">Randomised mix · CAT 2022 pattern (RC 16 · PJ 3 · PS 3 · PC 2)</option>
            <option value="mix:any">Randomised mix · surprise me</option>
            <optgroup label="An actual slot, as it was">${D.papers.map(p => `<option value="slot:${p.id}">${esc(p.title)}</option>`).join("")}</optgroup>
          </select></div>
          <label class="check"><input type="checkbox" id="pUnseen" checked> Prefer passages and questions I haven't seen</label>
          <label class="check"><input type="checkbox" id="pOrder" checked> Interleave VA between passages (as in recent CATs)</label>
          <button class="btn primary big" id="pStartCat">Start 40-minute section →</button>
        </div>
        <div class="card">
          <h2>Practice mode · untimed</h2>
          <p class="muted small">Pick a topic and go question by question. Press <i>Check</i> to see right/wrong, the answer and why. RC comes as whole passages.</p>
          <div class="field"><span class="label">Years</span><div class="seg" id="pYears">${D.years.map(y => `<button data-y="${y}" class="active">${y}</button>`).join("")}</div></div>
          <div class="topic-pick">${Object.keys(TOPIC).map(t => { const s = topicStats(t); return `
            <button class="topic-tile" data-t="${t}"><b>${TOPIC[t]}</b>
              <span class="muted small">${s.n} Qs${t === "rc" ? ` · ${nP} passages` : ""} · done ${s.done}${s.done ? ` · ${s.acc}% right` : ""}</span>
              <span class="bar"><i style="width:${pct(s.done, s.n)}%"></i></span></button>`; }).join("")}</div>
          <div class="field"><span class="label">How many</span><div class="seg" id="pCount">
            <button data-v="5" class="active">5</button><button data-v="10">10</button><button data-v="20">20</button><button data-v="all">All</button></div>
            <span class="muted small">RC counts passages; others count questions.</span></div>
          <label class="check"><input type="checkbox" id="pPUnseen" checked> Unseen first</label>
        </div>
      </div>
      ${S.attempts.length ? `<div class="card"><h2>Your sections &amp; practice sessions</h2>${S.attempts.slice(0, 30).map(at => `<a class="hist-item" href="#pyq/report/${at.id}"><div><div class="t">${esc(at.title)}</div><div class="muted small">${new Date(at.finishedAt).toLocaleString()} · ${at.mode === "cat" ? "CAT mode · " + fmtShort(at.used) : "Practice"}</div></div><span class="score-pill">${at.mode === "cat" ? at.score + "/" + at.max : at.c + "/" + at.n}</span></a>`).join("")}</div>` : ""}
      <p class="muted small">Sources: 2022 — official key with full solutions; 2023 — candidate response sheets (provisional official key); 2024–25 — memory-based papers with the source key. Where a source key looked wrong it has been corrected and flagged on that question.</p>`;
    if (a) {
      $("#pResume").onclick = () => { location.hash = "pyq/go"; };
      $("#pDiscard").onclick = () => A.confirm("Discard the unfinished session?", "Answers in it will be lost.", "Discard", () => { S.active = null; save(); renderHome(); });
    }
    $$("#pYears button").forEach(b => b.onclick = () => { b.classList.toggle("active"); if (!$$("#pYears button.active").length) b.classList.add("active"); });
    $$("#pCount button").forEach(b => b.onclick = () => { $$("#pCount button").forEach(x => x.classList.toggle("active", x === b)); });
    $("#pStartCat").onclick = () => startCat($("#pBuild").value, $("#pUnseen").checked, $("#pOrder").checked);
    $$(".topic-tile").forEach(b => b.onclick = () => startPractice(b.dataset.t));
  }

  // ---------- building sessions ----------
  const freshness = (ids) => ids.filter(id => seenQ(id)).length;   // lower = fresher
  function pickFresh(items, n, ids, unseen) {
    let pool = shuffle(items);
    if (unseen) pool.sort((x, y) => freshness(ids(x)) - freshness(ids(y)));
    return pool.slice(0, n);
  }
  function startCat(build, unseen, interleave) {
    if (S.active) return A.confirm("Replace your unfinished session?", "Starting a new one discards it.", "Start new", () => { S.active = null; save(); startCat(build, unseen, interleave); });
    const [kind, arg] = build.split(":");
    let qids, title;
    if (kind === "slot") {
      qids = D.questions.filter(q => q.paper === arg).sort((x, y) => x.n - y.n).map(q => q.id);
      title = paperTitle(arg) + " · VARC";
    } else {
      const pat = PATTERNS[arg === "any" ? shuffle(Object.keys(PATTERNS))[0] : arg];
      // 4 passages, spread across papers and (where possible) years
      const sets = Object.keys(D.sets);
      let chosen = [];
      for (const sid of pickFresh(sets, sets.length, s => setQs(s).map(q => q.id), unseen)) {
        const p = D.sets[sid].paper, y = p.slice(0, 4);
        if (chosen.some(c => D.sets[c].paper === p)) continue;
        if (chosen.length < 3 && chosen.some(c => D.sets[c].paper.slice(0, 4) === y)) continue;
        chosen.push(sid); if (chosen.length === 4) break;
      }
      for (const sid of sets) { if (chosen.length >= 4) break; if (!chosen.includes(sid)) chosen.push(sid); }
      const rcBlocks = chosen.map(sid => setQs(sid).sort((x, y) => x.n - y.n).slice(0, 4).map(q => q.id));
      const va = [];
      for (const [t, k] of Object.entries(pat.va)) {
        const pool = D.questions.filter(q => q.topic === t);
        va.push(...pickFresh(pool, k, q => [q.id], unseen).map(q => q.id));
      }
      const vaS = shuffle(va);
      if (interleave) {
        qids = [];
        rcBlocks.forEach((b, i) => { qids.push(...vaS.slice(i * 2, i * 2 + 2), ...b); });
        qids.push(...vaS.slice(8));
      } else qids = [...rcBlocks.flat(), ...vaS];
      title = `VARC mock · ${pat.label}`;
    }
    S.active = { id: "p" + Date.now().toString(36), mode: "cat", title, qids, idx: 0, answers: {}, marked: {}, visited: {}, checked: {}, time: {}, remaining: 40 * 60e3, used: 0, pauses: 0, created: Date.now() };
    save(); location.hash = "pyq/go";
  }
  function startPractice(t) {
    if (S.active) return A.confirm("Replace your unfinished session?", "Starting a new one discards it.", "Start new", () => { S.active = null; save(); startPractice(t); });
    const years = $$("#pYears button.active").map(b => +b.dataset.y), cnt = $("#pCount button.active").dataset.v, unseen = $("#pPUnseen").checked;
    const inYears = q => years.includes(q.year);
    let qids;
    if (t === "rc") {
      const sets = Object.keys(D.sets).filter(s => years.includes(+D.sets[s].paper.slice(0, 4)));
      const n = cnt === "all" ? sets.length : +cnt;
      qids = pickFresh(sets, n, s => setQs(s).map(q => q.id), unseen).flatMap(s => setQs(s).sort((x, y) => x.n - y.n).map(q => q.id));
    } else {
      const pool = D.questions.filter(q => q.topic === t && inYears(q));
      qids = pickFresh(pool, cnt === "all" ? pool.length : +cnt, q => [q.id], unseen).map(q => q.id);
    }
    if (!qids.length) return A.alert("No questions match those years.");
    S.active = { id: "p" + Date.now().toString(36), mode: "practice", topic: t, title: `Practice · ${TOPIC[t]} (${years.join(", ")})`, qids, idx: 0, answers: {}, marked: {}, visited: {}, checked: {}, time: {}, used: 0, pauses: 0, created: Date.now() };
    save(); location.hash = "pyq/go";
  }

  // ---------- session ----------
  function openSession() {
    const a = S.active; paused = false;
    view().innerHTML = `
      <div class="quizbar cat-bar">
        <div class="qmeta"><span id="pQc"></span><span id="pTags"></span></div>
        <div class="qctl">
          <span class="timer" id="pTimer" title="${a.mode === "cat" ? "Time left" : "Time spent"}">00:00</span>
          <button class="btn ghost" id="pPause">❚❚ Pause</button>
          <button class="btn ghost" id="pExit">Save &amp; exit</button>
          <button class="btn danger" id="pSubmit">${a.mode === "cat" ? "Submit section" : "Finish"}</button>
          <button class="btn ghost palette-toggle" id="pPalT" aria-label="Question palette">☰</button>
        </div>
      </div>
      <div class="quiz-layout"><div class="quiz-main" id="pMain"></div>
        <aside class="palette" id="pPal"><h3>${a.mode === "cat" ? "VARC · 40 min" : esc(TOPIC[a.topic])}</h3><div id="pPalGrid" class="pal-grid"></div>
          <div class="legend"><span><i class="dot ans"></i>${a.mode === "cat" ? "Answered" : "Correct"}</span><span><i class="dot mark"></i>Marked</span><span><i class="dot vis"></i>${a.mode === "cat" ? "Not answered" : "Wrong/skipped"}</span><span><i class="dot"></i>Not visited</span></div>
          ${a.mode === "cat" ? `<p class="muted small">Like the real exam: answers and solutions appear after you submit.</p>` : ""}
        </aside></div>
      <div class="pause-overlay hidden" id="pPauseO"><div class="pause-card"><h2>Paused</h2><p class="muted">Timer stopped and questions hidden.</p>
        <button class="btn primary big" id="pResumeB">▶ Resume</button><button class="btn ghost" id="pPauseExit">Save &amp; exit</button></div></div>`;
    $("#pPause").onclick = () => setPaused(true);
    $("#pResumeB").onclick = () => setPaused(false);
    $("#pExit").onclick = $("#pPauseExit").onclick = () => { stopClock(); save(); location.hash = "pyq"; };
    $("#pSubmit").onclick = submitPrompt;
    $("#pPalT").onclick = () => $("#pPal").classList.toggle("open");
    renderQ(); startClock();
  }
  function startClock() {
    stopClock(); last = Date.now();
    tick = setInterval(() => {
      const a = S.active; if (!a || paused) return;
      const now = Date.now(), d = Math.min(now - last, 5000); last = now;
      const id = a.qids[a.idx]; a.time[id] = (a.time[id] || 0) + d; a.used += d;
      if (a.mode === "cat") { a.remaining -= d; if (a.remaining <= 0) { a.remaining = 0; stopClock(); return A.alert("Time's up — the section is submitted.", finish); } }
      updTimer();
      if (Math.round(a.used / 1000) % 5 === 0) save();
    }, 1000);
  }
  function stopClock() { if (tick) clearInterval(tick); tick = null; }
  function updTimer() {
    const a = S.active, el = $("#pTimer"); if (!el) return;
    if (a.mode === "cat") { el.textContent = fmt(a.remaining); el.classList.toggle("low", a.remaining < 5 * 60e3); }
    else el.textContent = fmt(a.used);
  }
  function setPaused(v) { paused = v; last = Date.now(); if (v) S.active.pauses++; $("#pPauseO").classList.toggle("hidden", !v); save(); }
  document.addEventListener("visibilitychange", () => { if (document.hidden && S.active && tick && !paused) setPaused(true); });

  function renderQ() {
    const a = S.active, id = a.qids[a.idx], q = Q[id];
    a.visited[id] = true;
    const checked = a.mode === "practice" && a.checked[id], given = a.answers[id], res = checked ? grade(q, given) : null;
    $("#pQc").textContent = `Q${a.idx + 1} of ${a.qids.length}`;
    $("#pTags").innerHTML = `<span class="badge topic-b">${esc(TOPIC[q.topic])}</span>${a.mode === "practice" || a.mode === "review" ? `<span class="badge">${esc(paperTitle(q.paper))} · Q${q.n}</span>` : ""}${q.type === "tita" ? '<span class="badge new">TITA</span>' : ""}`;
    updTimer();
    let body = paras(q.stem);
    if (q.type === "mcq") {
      body += `<div class="options">${q.opts.map(o => {
        let cls = given === o.k ? "sel" : "";
        if (checked) cls = o.k === q.ans ? "correct" : given === o.k ? "wrong" : "";
        return `<button class="opt ${cls}" data-k="${o.k}" ${checked ? "disabled" : ""}><span class="k">${o.k}</span><span>${esc(o.t)}</span></button>`; }).join("")}</div>`;
    } else {
      body += `<div class="tita num"><input id="pTita" inputmode="numeric" autocomplete="off" value="${esc(given || "")}" placeholder="${q.topic === "pj" ? "e.g. 2413" : "e.g. 3"}" ${checked ? "disabled" : ""}>
        <div class="keypad num">${"123456789".split("").map(d => `<button data-d="${d}" ${checked ? "disabled" : ""}>${d}</button>`).join("")}<button data-d="back" ${checked ? "disabled" : ""}>⌫</button></div></div>
        <p class="tita-note">TITA — no negative marking for a wrong answer.</p>`;
    }
    if (checked) body += feedback(q, given, res);
    const last = a.idx === a.qids.length - 1;
    const nav = `<div class="qnav"><div class="grp"><button class="btn" id="pPrev" ${a.idx === 0 ? "disabled" : ""}>← Previous</button>${checked ? "" : `<button class="btn ghost" id="pClear">Clear</button>`}</div>
      <div class="grp">${a.mode === "practice"
        ? (checked ? "" : `<button class="btn primary" id="pCheck">Check answer</button>`) + `<button class="btn ${checked ? "primary" : ""}" id="pNext">${last ? "Finish" : "Next →"}</button>`
        : `<button class="btn ghost" id="pMark">${a.marked[id] ? "★ Unmark" : "☆ Mark for review"}</button><button class="btn primary" id="pNext">${last ? "Save" : "Save & next →"}</button>`}</div></div>`;
    const card = `<div class="qcard">${body}${nav}</div>`;
    const set = q.set && D.sets[q.set];
    if (set) {
      const pos = a.qids.map((x, i) => Q[x].set === q.set ? i + 1 : 0).filter(Boolean);
      $("#pMain").innerHTML = `<div class="q-split"><article class="passage" id="pPassage"><p class="muted small">Questions ${pos[0]}–${pos[pos.length - 1]} are based on this passage${a.mode === "practice" ? ` · ${esc(paperTitle(set.paper))}` : ""}</p>${set.paras.map(x => `<p>${esc(x)}</p>`).join("")}</article>${card}</div>`;
      if (a._lastSet === q.set && a._ps != null) $("#pPassage").scrollTop = a._ps;
      $("#pPassage").onscroll = e => { a._ps = e.target.scrollTop; };
      a._lastSet = q.set;
    } else { $("#pMain").innerHTML = card; a._lastSet = null; }

    $$("#pMain .opt").forEach(b => b.onclick = () => { if (checked) return; a.answers[id] = a.answers[id] === b.dataset.k ? undefined : b.dataset.k; if (!isAns(a.answers[id])) delete a.answers[id]; save(); renderQ(); });
    const ti = $("#pTita");
    if (ti && !checked) {
      const setT = v => { ti.value = v; if (isAns(v)) a.answers[id] = v.trim(); else delete a.answers[id]; save(); renderPal(); };
      ti.oninput = () => setT(ti.value.replace(/[^\d]/g, "").slice(0, 5));
      $$("#pMain .keypad button").forEach(b => b.onclick = () => { const d = b.dataset.d; setT(d === "back" ? ti.value.slice(0, -1) : (ti.value + d).slice(0, 5)); });
    }
    $("#pPrev").onclick = () => go(a.idx - 1);
    $("#pNext").onclick = () => last ? submitPrompt() : go(a.idx + 1);
    if ($("#pClear")) $("#pClear").onclick = () => { delete a.answers[id]; save(); renderQ(); };
    if ($("#pMark")) $("#pMark").onclick = () => { a.marked[id] = !a.marked[id]; save(); a.marked[id] && !last ? go(a.idx + 1) : renderQ(); };
    if ($("#pCheck")) $("#pCheck").onclick = () => {
      const doCheck = () => { a.checked[id] = true; S.seen[id] = { r: grade(q, a.answers[id]), at: Date.now() }; save(); renderQ(); const fb = $("#pFeedback"); if (fb) fb.scrollIntoView({ behavior: "smooth", block: "nearest" }); };
      if (!isAns(a.answers[id])) return A.confirm("Reveal without answering?", "This question will count as skipped.", "Show answer", doCheck);
      doCheck();
    };
    renderPal();
  }
  function feedback(q, given, res) {
    const tag = res === "correct" ? `<span class="verdict c">✓ Correct · +3</span>` : res === "wrong" ? `<span class="verdict w">✗ Wrong · ${q.type === "mcq" ? "−1" : "0 (TITA)"}</span>` : `<span class="verdict s">Not answered</span>`;
    return `<div class="feedback ${res === "correct" ? "fb-ok" : "fb-no"}" id="pFeedback">
      <div class="row between">${tag}<span>Answer: <b>${esc(ansLabel(q))}</b>${res !== "correct" && isAns(given) ? ` · yours: <b>${esc(given)}</b>` : ""}</span></div>
      ${solution(q)}
      <details class="method" ${res === "correct" ? "" : "open"}><summary>Method for ${esc(TOPIC[q.topic])}</summary><ul>${METHOD[q.topic].map(m => `<li>${esc(m)}</li>`).join("")}</ul></details></div>`;
  }
  const ansLabel = q => { const o = q.type === "mcq" && q.opts.find(x => x.k === q.ans); return o && /^Option \d$/.test(o.t) ? `${q.ans} (${o.t})` : q.ans; };
  const solution = q => `<div class="sol-body"><b>Why</b>${q.expl.map(x => `<p>${esc(x)}</p>`).join("")}${q.keyNote ? `<p class="muted small">⚑ Key note: ${esc(q.keyNote)}</p>` : ""}<p class="muted small">${esc(paperTitle(q.paper))} · Q${q.n}</p></div>`;
  function go(i) {
    const a = S.active; if (i < 0 || i >= a.qids.length) return;
    a.idx = i; save(); renderQ(); $("#pPal").classList.remove("open");
    if (!Q[a.qids[i]].set) window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function renderPal() {
    const a = S.active;
    $("#pPalGrid").innerHTML = a.qids.map((id, i) => {
      let cls = a.marked[id] ? "mark" : isAns(a.answers[id]) ? "ans" : a.visited[id] ? "vis" : "";
      if (a.mode === "practice" && a.checked[id]) cls = grade(Q[id], a.answers[id]) === "correct" ? "ans" : "vis";
      return `<button class="${cls} ${i === a.idx ? "cur" : ""}" data-i="${i}">${i + 1}</button>`; }).join("");
    $$("#pPalGrid button").forEach(b => b.onclick = () => go(+b.dataset.i));
  }
  function submitPrompt() {
    const a = S.active, n = a.qids.filter(id => isAns(a.answers[id])).length;
    if (a.mode === "cat") A.confirm("Submit the section?", `${n} of ${a.qids.length} answered · ${fmt(a.remaining)} left.`, "Submit", finish);
    else A.confirm("Finish this practice set?", `${Object.keys(a.checked).length} of ${a.qids.length} checked. Unchecked answers are graded too.`, "Finish", finish);
  }
  function finish() {
    const a = S.active; stopClock();
    const results = a.qids.map(id => { const q = Q[id], given = isAns(a.answers[id]) ? a.answers[id] : null, r = grade(q, given); return { id, topic: q.topic, set: q.set, type: q.type, given, ans: q.ans, result: r, marks: marks(q, r), time: a.time[id] || 0 }; });
    for (const r of results) {
      if (a.mode === "cat") S.seen[r.id] = { r: r.result, at: Date.now() };
      else if (!a.checked[r.id] && r.given) S.seen[r.id] = { r: r.result, at: Date.now() };  // answered but not checked
    }
    const c = results.filter(r => r.result === "correct").length;
    const rec = { id: a.id, mode: a.mode, title: a.title, created: a.created, finishedAt: Date.now(), used: a.used, pauses: a.pauses, results,
      score: results.reduce((x, r) => x + r.marks, 0), max: results.length * 3, c, n: results.length };
    S.attempts.unshift(rec); S.attempts = S.attempts.slice(0, 80); S.active = null; save();
    history.replaceState(null, "", "#pyq/report/" + rec.id);
    renderReport(rec.id);
  }

  // ---------- report ----------
  function sum(rs) {
    const s = { n: rs.length, c: 0, w: 0, sk: 0, score: 0, time: 0, negs: 0 };
    for (const r of rs) { s[r.result === "correct" ? "c" : r.result === "wrong" ? "w" : "sk"]++; s.score += r.marks; s.time += r.time; if (r.marks < 0) s.negs++; }
    s.att = s.c + s.w; s.acc = pct(s.c, s.att); return s;
  }
  const HEAD = `<tr><th></th><th>Qs</th><th>Attempted</th><th>Correct</th><th>Wrong</th><th>Accuracy</th><th>Score</th><th>Time</th><th>Time/Q</th></tr>`;
  const row = (l, s) => `<tr><td>${l}</td><td>${s.n}</td><td>${s.att}</td><td style="color:var(--good)">${s.c}</td><td style="color:var(--bad)">${s.w}</td><td>${s.att ? s.acc + "%" : "–"}</td><td><b>${s.score}</b></td><td>${fmtShort(s.time)}</td><td>${s.att ? fmtShort(s.time / Math.max(s.att, 1)) : "–"}</td></tr>`;
  function diagnose(rec) {
    const out = [], weak = new Set(), R = rec.results;
    const negs = R.filter(r => r.marks < 0).length;
    if (rec.mode === "cat") {
      if (negs >= 4) out.push(["warn", `Negative marking cost you <b>${negs} marks</b>. Mark an MCQ only after eliminating at least two options for a reason.`]);
      const titaSkip = R.filter(r => r.type === "tita" && r.result === "skip").length;
      if (titaSkip) out.push(["warn", `<b>${titaSkip} TITA left blank.</b> No negative marking — always key in your best answer.`]);
      const untouched = R.filter(r => r.result === "skip" && !r.time).length;
      if (untouched >= 4) out.push(["warn", `${untouched} questions never opened. In VARC, VA questions (≈1.5 min each) are the cheapest marks — do them before the toughest passage.`]);
      const sets = {}; for (const r of R) if (r.set) (sets[r.set] = sets[r.set] || []).push(r);
      Object.values(sets).forEach((rs, i) => { const s = sum(rs); if (s.time > 10 * 60e3) out.push(["warn", `RC passage ${i + 1}: ${fmtShort(s.time)} for ${s.c}/${s.n}. Aim for ~8 minutes per 4-question passage (read ≈3, questions ≈5).`]); });
    }
    const byT = {}; for (const r of R) (byT[r.topic] = byT[r.topic] || []).push(r);
    for (const [t, rs] of Object.entries(byT)) {
      const s = sum(rs);
      if (s.att >= 2 && s.acc < 50) { weak.add(t); out.push(["warn", `<b>${TOPIC[t]}</b>: ${s.c} of ${s.att} right (${s.acc}%). Drill it in Practice mode with the method below.`]); }
      else if (s.att >= 3 && s.acc >= 75) out.push(["good", `<b>${TOPIC[t]}</b>: strong — ${s.c}/${s.n}.`]);
      const avg = s.att ? s.time / s.att : 0;
      if (rec.mode === "cat" && s.att >= 2 && avg > TARGET_MS[t] * 1.5) { weak.add(t); out.push(["warn", `<b>${TOPIC[t]}</b> is slow: ${fmtShort(avg)} per question vs about ${fmtShort(TARGET_MS[t])}.`]); }
    }
    const s = sum(R);
    if (s.att && s.acc >= 80 && s.att < R.length * 0.75 && rec.mode === "cat") out.push(["good", `${s.acc}% accuracy on ${s.att} attempts — you can afford to attempt more.`]);
    return { notes: out, weak: [...weak] };
  }
  function renderReport(id) {
    stopClock(); A.show("pyq");
    const rec = S.attempts.find(x => x.id === id);
    if (!rec) { view().innerHTML = `<div class="card empty">Report not found. <a href="#pyq">Back</a></div>`; return; }
    const R = rec.results, s = sum(R), { notes, weak } = diagnose(rec);
    const byT = {}; for (const r of R) (byT[r.topic] = byT[r.topic] || []).push(r);
    const sets = {}; for (const r of R) if (r.set) (sets[r.set] = sets[r.set] || []).push(r);
    view().innerHTML = `
      <div class="report-head"><div><h1>${esc(rec.title)}</h1><p class="muted">${rec.mode === "cat" ? "CAT mode · 40 min" : "Practice mode"} · ${new Date(rec.finishedAt).toLocaleString()}${rec.pauses ? ` · paused ${rec.pauses}×` : ""}</p></div>
        <div class="report-actions"><a class="btn" href="#pyq">VARC PYQ home</a></div></div>
      <div class="kpis">
        <div class="kpi"><div class="v">${s.score}<span class="muted" style="font-size:1rem"> / ${rec.max}</span></div><div class="l">Score</div></div>
        <div class="kpi ${s.acc >= 70 ? "good" : s.att && s.acc < 45 ? "bad" : ""}"><div class="v">${s.att ? s.acc + "%" : "–"}</div><div class="l">Accuracy</div></div>
        <div class="kpi"><div class="v">${s.att}<span class="muted" style="font-size:1rem"> / ${s.n}</span></div><div class="l">Attempted</div></div>
        <div class="kpi good"><div class="v">${s.c}</div><div class="l">Correct</div></div>
        <div class="kpi bad"><div class="v">${s.w}</div><div class="l">Wrong (−${s.negs})</div></div>
        <div class="kpi"><div class="v">${fmt(rec.used)}</div><div class="l">Time</div></div>
      </div>
      <div class="card"><h2>Where to improve</h2><ul class="insights">${notes.map(([c, t]) => `<li class="${c}">${t}</li>`).join("") || "<li>Clean attempt — no major issues found.</li>"}</ul></div>
      ${weak.length ? `<div class="card"><h2>How to improve</h2>${weak.map(t => `<div class="method-block"><b>${esc(TOPIC[t])}</b><ul>${METHOD[t].map(m => `<li>${esc(m)}</li>`).join("")}</ul></div>`).join("")}</div>` : ""}
      <div class="grid-2">
        <div class="card"><h2>By question type</h2><div class="tbl-wrap"><table class="tbl">${HEAD}${Object.entries(byT).map(([t, rs]) => row(TOPIC[t], sum(rs))).join("")}</table></div></div>
        ${Object.keys(sets).length ? `<div class="card"><h2>By RC passage</h2><div class="tbl-wrap"><table class="tbl">${HEAD}${Object.entries(sets).map(([sid, rs], i) => row(`P${i + 1} · ${esc(paperTitle(D.sets[sid].paper))}`, sum(rs))).join("")}</table></div></div>` : ""}
      </div>
      <div class="card"><h2>Answers &amp; explanations</h2>
        <div class="filters"><button class="active" data-f="all">All (${s.n})</button><button data-f="wrong">Wrong (${s.w})</button><button data-f="skip">Skipped (${s.sk})</button><button data-f="correct">Correct (${s.c})</button></div>
        <div id="pReview">${R.map((r, i) => { const q = Q[r.id]; return `<details class="review r-${r.result}" data-res="${r.result}" data-id="${r.id}">
          <summary class="review-head"><div class="tags"><b>Q${i + 1}</b><span class="badge topic-b">${esc(SHORT[r.topic])}</span><span class="badge">${esc(paperTitle(q.paper))} · Q${q.n}</span>${r.type === "tita" ? '<span class="badge new">TITA</span>' : ""}</div>
          <div class="tags">${r.result === "correct" ? '<span class="verdict c">✓ +3</span>' : r.result === "wrong" ? `<span class="verdict w">✗ ${r.marks}</span>` : '<span class="verdict s">— 0</span>'}<span class="muted">Yours: <b>${r.given ? esc(r.given) : "—"}</b> · Key: <b>${esc(ansLabel(q))}</b> · ⏱ ${fmtShort(r.time)}</span></div></summary>
          <div class="rv-body"></div></details>`; }).join("")}</div></div>
      <p class="muted small">Scoring: +3 correct, −1 wrong MCQ, 0 wrong TITA, 0 skipped.</p>`;
    $$(".filters button").forEach(b => b.onclick = () => {
      $$(".filters button").forEach(x => x.classList.toggle("active", x === b));
      $$("#pReview .review").forEach(d => d.classList.toggle("hidden", b.dataset.f !== "all" && d.dataset.res !== b.dataset.f));
    });
    $$("#pReview details").forEach(d => d.addEventListener("toggle", () => {
      const body = $(".rv-body", d); if (!d.open || body.dataset.done) return;
      const q = Q[d.dataset.id], r = rec.results.find(x => x.id === q.id), set = q.set && D.sets[q.set];
      let h = set ? `<details class="sol"><summary>Show passage</summary>${set.paras.map(x => `<p class="serif-p">${esc(x)}</p>`).join("")}</details>` : "";
      h += paras(q.stem);
      if (q.opts.length) h += `<div class="options">${q.opts.map(o => `<div class="opt ${o.k === q.ans ? "correct" : o.k === r.given ? "wrong" : ""}"><span class="k">${o.k}</span><span>${esc(o.t)}</span></div>`).join("")}</div>`;
      h += solution(q);
      body.innerHTML = h; body.dataset.done = 1;
    }));
  }

  document.addEventListener("keydown", e => {
    if (!tick || !S.active || e.target.tagName === "INPUT" || !$("#modal").classList.contains("hidden") || $("#view-pyq").classList.contains("hidden")) return;
    if (e.key.toLowerCase() === "p") return setPaused(!paused);
    if (paused) return;
    const k = e.key.toUpperCase();
    if (k.length === 1 && "ABCD".includes(k)) { const b = $(`#pMain .opt[data-k="${k}"]`); if (b) b.click(); }
    else if (e.key === "ArrowRight") go(S.active.idx + 1);
    else if (e.key === "ArrowLeft") go(S.active.idx - 1);
  });
  window.addEventListener("beforeunload", save);
  window.PYQ = { route, leave };
})();
