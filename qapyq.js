/* Quant PYQ — CAT 2022–2025 QA questions (12 slots, 264 questions).
   Full slot: one QA section as set, 40 minutes.  Timed mix: N questions from chosen years/topics.
   Practice: one topic or sub-topic, untimed, check as you go.
   Questions are image crops (exact notation) and are NOT in this repo: they load from the owner's private
   repo (same token as Real CAT) or an imported file, and are cached in this browser. */
(() => {
  "use strict";
  const A = window.VARCApp;
  const { esc, fmt, fmtShort, pct } = A;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const KEY = "varc.qpyq.v1", FILE = "qa/pyq-2022-2025.json", CACHE = "qpyq:2022-2025:v2";
  const TOP = { arith: "Arithmetic", alg: "Algebra", geo: "Geometry & mensuration", num: "Number system", mod: "Modern maths" };
  const TOP_SHORT = { arith: "Arith", alg: "Algebra", geo: "Geometry", num: "Numbers", mod: "Modern" };
  const METHOD = [
    "Pass 1 (≈20 min): scan every question once. Solve only those you recognise in 10 seconds — the method is obvious and the arithmetic is short. Arithmetic word problems are usually here.",
    "Pass 2 (≈15 min): come back for the ones where you know the approach but it takes 2–3 steps. Hard cap 3 minutes a question.",
    "Last 5 min: key a value into every TITA you've touched (no negative marking). Leave MCQs you can't narrow to two.",
    "For MCQs, plug the options in or try a simple number (x = 0, 1, an equilateral triangle) before doing heavy algebra.",
    "Accuracy beats attempts: 12–13 correct with ≤2 wrong is a 99 percentile Quant score in recent years.",
  ];

  // ---------- state ----------
  const blank = () => ({ attempts: [], active: null, seen: {}, pref: { n: 15, per: 1.8, years: [2022, 2023, 2024, 2025], topic: "any", unseen: true } });
  let S;
  try { S = Object.assign(blank(), JSON.parse(localStorage.getItem(KEY)) || {}); } catch { S = blank(); }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { /* storage unavailable */ } };
  let D = null, Q = {}, tick = null, last = 0, paused = false;
  const view = () => $("#view-qpyq");

  async function load() {
    if (D) return D;
    D = await window.RealCAT.cachedJSON(FILE, CACHE);
    if (!D) return null;
    Q = Object.fromEntries(D.questions.map(q => [q.id, q]));
    return D;
  }

  // ---------- helpers ----------
  const isAns = v => v !== undefined && v !== null && String(v).trim() !== "";
  const normT = v => String(v ?? "").trim().replace(/\s+/g, "").replace(/,/g, "");
  const grade = (q, g) => {
    if (!isAns(g)) return "skip";
    if (q.type === "mcq") return g === q.ans ? "correct" : "wrong";
    const a = normT(q.ans), b = normT(g);
    if (a === b) return "correct";
    const x = parseFloat(a), y = parseFloat(b);
    return !isNaN(x) && !isNaN(y) && /^-?[\d.]+$/.test(b) && Math.abs(x - y) < 1e-9 ? "correct" : "wrong";
  };
  const marks = (q, r) => r === "correct" ? 3 : r === "wrong" && q.type === "mcq" ? -1 : 0;
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const paperTitle = id => (D.papers.find(p => p.id === id) || {}).title || id;
  const imgs = (list, alt = "Question") => (list || []).map(u => `<img src="${u}" alt="${alt}" loading="lazy">`).join("");
  const qLabel = q => `${paperTitle(q.paper)} · Q${q.k}`;
  const subOf = q => q.sub || TOP[q.topic] || "";
  // 2022 and 2024–25 crops include the options as printed; 2023 options are cropped separately
  const optsInCrop = q => q.type === "mcq" && !q.opts;
  function optionsHTML(q, given, checked, interactive) {
    const tag = interactive ? "button" : "div";
    const items = "ABCD".split("").map((k, i) => {
      const o = q.opts ? q.opts[i] : null;
      let cls = given === k ? "sel" : "";
      if (checked) cls = k === q.ans ? "correct" : given === k ? "wrong" : "";
      const inner = o ? (o.img ? `<img src="${o.img}" alt="Option ${k}">` : `<span>${esc(o.t)}</span>`) : `<span class="muted small">Option ${k}${q.year === 2025 ? ` (printed as ${i + 1})` : ""}</span>`;
      return `<${tag} class="opt qp-opt ${cls} ${o ? "" : "qp-opt-k"}" data-k="${k}" ${interactive && checked ? "disabled" : ""}><span class="k">${k}</span>${inner}</${tag}>`;
    }).join("");
    return `<div class="options ${q.opts ? "" : "qp-keys"}">${items}</div>`;
  }
  function solution(q) {
    if (q.expl?.length) return `<div class="expl dp-expl"><p class="dp-expl-h">Solution</p>${q.expl.map(p => `<p>${esc(p)}</p>`).join("")}</div>`;
    if (q.expl_img?.length) return `<div class="dp-expl"><p class="dp-expl-h">Solution</p><div class="qimg">${imgs(q.expl_img, "Solution")}</div></div>`;
    return `<p class="muted small">Worked solution for this one isn't in the pack yet — the key is from the ${q.year === 2023 ? "official response sheet" : "publisher's answer key"}.</p>`;
  }
  const stat = ids => { const done = ids.filter(id => S.seen[id]); return { n: ids.length, done: done.length, c: done.filter(id => S.seen[id].r === "correct").length }; };

  // ---------- routing ----------
  function leave() { stopClock(); }
  async function route(h) {
    stopClock(); A.show("qpyq");
    view().innerHTML = `<h1>Quant PYQs</h1><p class="muted">Loading…</p>`;
    let ok;
    try { ok = await load(); } catch (e) { return renderConnect(e.message); }
    if (!ok) return renderConnect();
    const parts = h.split("/");
    if (parts[1] === "report") return renderReport(parts[2]);
    if (parts[1] === "go" && S.active) return openSession();
    renderHome();
  }

  function renderConnect(err) {
    view().innerHTML = `<h1>Quant PYQs · CAT 2022–2025</h1>
      <div class="card"><p>These are real CAT questions, so they stay private and load from your private repo — the <b>same connection as Real CAT</b>.</p>
      <p class="muted small">If you connected before this section existed, the file is fetched automatically on first open (≈9 MB, once). A new browser needs the token pasted once.</p>
      ${err ? `<p class="bad-t">${esc(err)}</p>` : ""}
      <div class="row gap"><a class="btn primary" href="#cat/setup/qpyq">Connect GitHub (once per browser)</a></div>
      <p class="muted small" style="margin-top:14px">Or import the file <code>${FILE}</code> from the private pack:</p>
      <input type="file" id="qpFile" accept=".json,application/json"><p class="muted small" id="qpMsg"></p></div>`;
    $("#qpFile").onchange = async e => {
      try {
        const d = JSON.parse(await e.target.files[0].text());
        if (!d.questions || !d.papers || !d.questions[0]?.id?.includes("-qa")) throw new Error("That isn't the Quant PYQ file.");
        await window.RealCAT.putCache(CACHE, d); D = null; route("qpyq");
      } catch (err2) { $("#qpMsg").textContent = err2.message; }
    };
  }

  // ---------- home ----------
  function renderHome() {
    const a = S.active, p = S.pref;
    const segBtns = (id, vals, cur, lab = v => v) => `<div class="seg" id="${id}">${vals.map(v => `<button data-v="${v}" class="${String(v) === String(cur) ? "active" : ""}">${lab(v)}</button>`).join("")}</div>`;
    const topicCards = Object.keys(TOP).map(t => {
      const qs = D.questions.filter(q => q.topic === t), subs = {};
      qs.forEach(q => (subs[subOf(q)] = subs[subOf(q)] || []).push(q.id));
      const st = stat(qs.map(q => q.id));
      return `<div class="dp-slot"><div class="dp-slot-h">${esc(TOP[t])} · ${qs.length}${st.done ? ` · ${st.c}/${st.done} right` : ""}</div>${Object.entries(subs).sort((x, y) => y[1].length - x[1].length).map(([s, ids]) => {
        const ss = stat(ids);
        return `<button class="dp-set qp-sub" data-t="${t}" data-s="${esc(s)}"><span class="badge topic-b">${ids.length}</span><span class="dp-name">${esc(s)}</span>
          <span class="muted small">${ss.done ? `${ss.done} done · ${ss.c} right` : "not started"}</span>${ss.done === ss.n ? '<span class="dp-done" title="All done">✓</span>' : ""}</button>`; }).join("")}</div>`;
    }).join("");
    const slotRows = D.papers.map(pp => {
      const ids = D.questions.filter(q => q.paper === pp.id).map(q => q.id), st = stat(ids);
      const best = S.attempts.filter(x => x.paper === pp.id).reduce((m, x) => Math.max(m, x.score), -99);
      return `<option value="${pp.id}">${esc(pp.title)}${best > -99 ? ` · best ${best}/66` : st.done ? ` · ${st.done}/22 seen` : ""}</option>`;
    }).join("");
    view().innerHTML = `
      <div class="report-head"><div><h1>Quant PYQs · CAT 2022–2025</h1>
        <p class="muted">${D.papers.length} slots · ${D.questions.length} questions · every question shown exactly as printed · official/publisher answer keys · solutions for 2022 (more coming)</p></div></div>
      ${a ? `<div class="resume"><div><b>Unfinished: ${esc(a.title)}</b><div class="muted small">${a.mode === "timed" ? "Timed · " + fmt(a.remaining) + " left" : "Practice · " + Object.keys(a.checked).length + " of " + a.qids.length + " checked"}</div></div>
        <div class="row gap"><button class="btn" id="qpDiscard">Discard</button><button class="btn primary" id="qpResume">Resume ▶</button></div></div>` : ""}
      <div class="grid-2">
        <div class="card">
          <h2>Full slot · 40 min</h2>
          <p class="muted small">A whole QA section as it was set: 22 questions (8 TITA), 40 minutes, +3 / −1. The best rehearsal for the real thing — use 2024–25 slots last.</p>
          <div class="field"><select class="inp" id="qpSlot">${slotRows}</select></div>
          <button class="btn primary big" id="qpStartSlot">Start 40-minute section</button>
          <details class="method"><summary>How to attempt the Quant section</summary><ul>${METHOD.map(m => `<li>${esc(m)}</li>`).join("")}</ul></details>
        </div>
        <div class="card">
          <h2>Timed mix</h2>
          <p class="muted small">Random questions from different slots. Answers only at the end, with time per question.</p>
          <div class="field"><span class="label">Questions</span>${segBtns("qpN", [10, 15, 22], p.n)}</div>
          <div class="field"><span class="label">Time per question</span>${segBtns("qpPer", [1.5, 1.8, 2.5], p.per, v => v + " min")}<span class="muted small" id="qpTot"></span></div>
          <div class="field"><span class="label">Years</span><div class="seg" id="qpYears">${D.years.map(y => `<button data-y="${y}" class="${p.years.includes(y) ? "active" : ""}">${y}</button>`).join("")}</div></div>
          <div class="field"><span class="label">Topics</span><select class="inp" id="qpTopic"><option value="any">All topics (CAT-like mix)</option>${Object.entries(TOP).map(([k, v]) => `<option value="${k}">Only: ${esc(v)}</option>`).join("")}</select></div>
          <label class="check"><input type="checkbox" id="qpUnseen" ${p.unseen ? "checked" : ""}> Prefer questions I haven't done</label>
          <button class="btn big" id="qpStart">Start</button>
        </div>
      </div>
      <div class="card"><h2>Practice by topic · untimed</h2><p class="muted small">Pick a sub-topic to drill every CAT 2022–25 question on it, checking each answer as you go.</p><div class="dp-grid">${topicCards}</div></div>
      ${S.attempts.length ? `<div class="card"><h2>Your Quant sessions</h2>${S.attempts.slice(0, 30).map(at => `<a class="hist-item" href="#qpyq/report/${at.id}"><div><div class="t">${esc(at.title)}</div><div class="muted small">${new Date(at.finishedAt).toLocaleString()} · ${at.mode === "practice" ? "Practice" : "Timed"} · ${fmtShort(at.used)}</div></div><span class="score-pill">${at.score}/${at.max}</span></a>`).join("")}</div>` : ""}
      <p class="muted small">Sources: 2022 — Cracku papers with official keys and solutions; 2023 — candidate response sheets (official provisional key); 2024–25 — memory-based papers with the publisher's key, so an odd figure or option can differ slightly from the real paper. In 2025 papers the options are printed 1–4: they map to A–D.</p>`;
    const tot = () => { $("#qpTot").textContent = `= ${Math.round(S.pref.n * S.pref.per)} minutes`; };
    tot();
    $$("#qpN button").forEach(b => b.onclick = () => { $$("#qpN button").forEach(x => x.classList.toggle("active", x === b)); S.pref.n = +b.dataset.v; save(); tot(); });
    $$("#qpPer button").forEach(b => b.onclick = () => { $$("#qpPer button").forEach(x => x.classList.toggle("active", x === b)); S.pref.per = +b.dataset.v; save(); tot(); });
    $$("#qpYears button").forEach(b => b.onclick = () => { b.classList.toggle("active"); if (!$$("#qpYears button.active").length) b.classList.add("active"); S.pref.years = $$("#qpYears button.active").map(x => +x.dataset.y); save(); });
    $("#qpTopic").value = p.topic;
    $("#qpTopic").onchange = e => { S.pref.topic = e.target.value; save(); };
    $("#qpUnseen").onchange = e => { S.pref.unseen = e.target.checked; save(); };
    $("#qpStart").onclick = startMix;
    $("#qpStartSlot").onclick = () => startSlot($("#qpSlot").value);
    $$(".qp-sub").forEach(b => b.onclick = () => startPractice(b.dataset.t, b.dataset.s));
    if (a) {
      $("#qpResume").onclick = () => { location.hash = "qpyq/go"; };
      $("#qpDiscard").onclick = () => A.confirm("Discard the unfinished session?", "Answers in it will be lost.", "Discard", () => { S.active = null; save(); renderHome(); });
    }
  }

  // ---------- building sessions ----------
  const guard = fn => S.active ? A.confirm("Replace your unfinished session?", "Starting a new one discards it.", "Start new", () => { S.active = null; save(); fn(); }) : fn();
  function begin(o) {
    S.active = Object.assign({ id: "q" + Date.now().toString(36), idx: 0, answers: {}, marked: {}, visited: {}, checked: {}, time: {}, used: 0, pauses: 0, created: Date.now() }, o);
    save(); location.hash = "qpyq/go";
  }
  function startSlot(pid) {
    guard(() => begin({ mode: "timed", paper: pid, qids: D.questions.filter(q => q.paper === pid).sort((x, y) => x.k - y.k).map(q => q.id), remaining: 40 * 60e3, limit: 40, title: `${paperTitle(pid)} · Quant section` }));
  }
  function startMix() {
    guard(() => {
      const { n, per, years, topic, unseen } = S.pref;
      let pool = shuffle(D.questions.filter(q => years.includes(q.year) && (topic === "any" || q.topic === topic)));
      if (unseen) pool.sort((x, y) => (!!S.seen[x.id]) - (!!S.seen[y.id]));
      let chosen = [];
      if (topic === "any") {                          // roughly the CAT blend: arithmetic-heavy, then algebra, geometry, numbers, modern
        const want = { arith: Math.round(n * 0.38), alg: Math.round(n * 0.32), geo: Math.round(n * 0.14), num: Math.round(n * 0.1) };
        for (const [t, k] of Object.entries(want)) chosen.push(...pool.filter(q => q.topic === t).slice(0, k));
        for (const q of pool) if (chosen.length < n && !chosen.includes(q)) chosen.push(q);
        chosen = shuffle(chosen.slice(0, n));
      } else chosen = pool.slice(0, n);
      if (!chosen.length) return A.alert("No questions match those filters.");
      const mins = Math.round(chosen.length * per);
      begin({ mode: "timed", qids: chosen.map(q => q.id), remaining: mins * 60e3, limit: mins, title: `Quant mix · ${chosen.length} Qs · ${mins} min${topic !== "any" ? " · " + TOP[topic] : ""}` });
    });
  }
  function startPractice(t, sub) {
    guard(() => {
      const qs = D.questions.filter(q => q.topic === t && subOf(q) === sub).sort((x, y) => (!!S.seen[x.id]) - (!!S.seen[y.id]) || y.year - x.year);
      begin({ mode: "practice", qids: qs.map(q => q.id), title: `Practice · ${sub}` });
    });
  }

  // ---------- session ----------
  function openSession() {
    const a = S.active; paused = false;
    view().innerHTML = `
      <div class="quizbar cat-bar">
        <div class="qmeta"><span id="qpQc"></span><span id="qpTags"></span></div>
        <div class="qctl">
          <span class="timer" id="qpTimer" title="${a.mode === "timed" ? "Time left" : "Time spent"}">00:00</span>
          <button class="btn ghost" id="qpPause">❚❚ Pause</button>
          <button class="btn ghost" id="qpExit">Save &amp; exit</button>
          <button class="btn danger" id="qpSubmit">${a.mode === "timed" ? "Submit" : "Finish"}</button>
          <button class="btn ghost palette-toggle" id="qpPalT" aria-label="Question palette">☰</button>
        </div>
      </div>
      <div class="quiz-layout"><div class="quiz-main" id="qpMain"></div>
        <aside class="palette" id="qpPal"><h3>${a.mode === "timed" ? `Quant · ${a.limit} min` : "Practice"}</h3><div class="pal-grid" id="qpPalGrid"></div>
          <div class="legend"><span><i class="dot ans"></i>${a.mode === "timed" ? "Answered" : "Correct"}</span><span><i class="dot mark"></i>Marked</span><span><i class="dot vis"></i>${a.mode === "timed" ? "Not answered" : "Wrong/skipped"}</span><span><i class="dot"></i>Not visited</span></div>
          <p class="muted small" id="qpQClock"></p>
        </aside></div>
      <div class="pause-overlay hidden" id="qpPauseO"><div class="pause-card"><h2>Paused</h2><p class="muted">Timer stopped and questions hidden.</p>
        <button class="btn primary big" id="qpResumeB">▶ Resume</button><button class="btn ghost" id="qpPauseExit">Save &amp; exit</button></div></div>`;
    $("#qpPause").onclick = () => setPaused(true);
    $("#qpResumeB").onclick = () => setPaused(false);
    $("#qpExit").onclick = $("#qpPauseExit").onclick = () => { stopClock(); save(); location.hash = "qpyq"; };
    $("#qpSubmit").onclick = submitPrompt;
    $("#qpPalT").onclick = () => $("#qpPal").classList.toggle("open");
    renderQ(); startClock();
  }
  function startClock() {
    stopClock(); last = Date.now();
    tick = setInterval(() => {
      const a = S.active; if (!a || paused) return;
      const now = Date.now(), d = Math.min(now - last, 5000); last = now;
      const id = a.qids[a.idx]; a.time[id] = (a.time[id] || 0) + d; a.used += d;
      if (a.mode === "timed") { a.remaining -= d; if (a.remaining <= 0) { a.remaining = 0; stopClock(); return A.alert("Time's up — submitted.", finish); } }
      updTimer();
      if (Math.round(a.used / 1000) % 5 === 0) save();
    }, 1000);
  }
  function stopClock() { if (tick) clearInterval(tick); tick = null; }
  function updTimer() {
    const a = S.active, el = $("#qpTimer"); if (!el) return;
    if (a.mode === "timed") { el.textContent = fmt(a.remaining); el.classList.toggle("low", a.remaining < 4 * 60e3); }
    else el.textContent = fmt(a.used);
    const qc = $("#qpQClock"), t = a.time[a.qids[a.idx]] || 0;
    if (qc) { qc.textContent = `This question: ${fmt(t)}`; qc.classList.toggle("bad-t", t > 3 * 60e3); }
  }
  function setPaused(v) { paused = v; last = Date.now(); if (v) S.active.pauses++; $("#qpPauseO").classList.toggle("hidden", !v); save(); }
  document.addEventListener("visibilitychange", () => { if (document.hidden && S.active && tick && !paused) setPaused(true); });

  function renderQ() {
    const a = S.active, id = a.qids[a.idx], q = Q[id];
    a.visited[id] = true;
    const checked = a.mode === "practice" && a.checked[id], given = a.answers[id], res = checked ? grade(q, given) : null;
    $("#qpQc").textContent = `Question ${a.idx + 1} of ${a.qids.length}`;
    $("#qpTags").innerHTML = (a.mode === "practice" || checked ? `<span class="badge topic-b">${esc(TOP_SHORT[q.topic] || "")}</span><span class="badge">${esc(qLabel(q))}</span>` : "") + (q.type === "tita" ? '<span class="badge new">TITA</span>' : "");
    updTimer();
    let body = `<div class="qimg qp-stem">${imgs(q.img)}</div>`;
    if (q.type === "mcq") {
      if (optsInCrop(q)) body += `<p class="muted small qp-hint">The options are in the question image above${q.year === 2025 ? " (printed 1–4 → A–D)" : ""} — pick the letter:</p>`;
      body += optionsHTML(q, given, checked, true);
    } else {
      body += `<div class="tita"><input id="qpTita" inputmode="decimal" autocomplete="off" value="${esc(given || "")}" placeholder="Type your answer" ${checked ? "disabled" : ""}>
        <div class="keypad">${"1234567890".split("").map(d => `<button data-d="${d}" ${checked ? "disabled" : ""}>${d}</button>`).join("")}<button data-d="." ${checked ? "disabled" : ""}>.</button><button data-d="-" ${checked ? "disabled" : ""}>−</button><button data-d="back" ${checked ? "disabled" : ""}>⌫</button></div></div>
        <p class="tita-note">TITA — no negative marking for a wrong answer.</p>`;
    }
    if (checked) body += feedback(q, given, res);
    const lastQ = a.idx === a.qids.length - 1;
    const nav = `<div class="qnav"><div class="grp"><button class="btn" id="qpPrev" ${a.idx === 0 ? "disabled" : ""}>← Previous</button>${checked ? "" : `<button class="btn ghost" id="qpClear">Clear</button>`}</div>
      <div class="grp">${a.mode === "practice"
        ? (checked ? "" : `<button class="btn primary" id="qpCheck">Check answer</button>`) + `<button class="btn ${checked ? "primary" : ""}" id="qpNext">${lastQ ? "Finish" : "Next →"}</button>`
        : `<button class="btn ghost" id="qpMark">${a.marked[id] ? "★ Unmark" : "☆ Mark for review"}</button><button class="btn primary" id="qpNext">${lastQ ? "Save" : "Save & next →"}</button>`}</div></div>`;
    $("#qpMain").innerHTML = `<div class="qcard qp-card">${body}${nav}</div>`;

    $$("#qpMain .opt").forEach(b => b.onclick = () => { if (checked) return; a.answers[id] = a.answers[id] === b.dataset.k ? undefined : b.dataset.k; if (!isAns(a.answers[id])) delete a.answers[id]; save(); renderQ(); });
    const ti = $("#qpTita");
    if (ti && !checked) {
      const setT = v => { ti.value = v; if (isAns(v)) a.answers[id] = v.trim(); else delete a.answers[id]; save(); renderPal(); };
      ti.oninput = () => setT(ti.value.replace(/[^\d.\-\/]/g, "").slice(0, 12));
      $$("#qpMain .keypad button").forEach(b => b.onclick = () => { const d = b.dataset.d; setT(d === "back" ? ti.value.slice(0, -1) : (ti.value + d).slice(0, 12)); });
    }
    $("#qpPrev").onclick = () => go(a.idx - 1);
    $("#qpNext").onclick = () => lastQ ? submitPrompt() : go(a.idx + 1);
    if ($("#qpClear")) $("#qpClear").onclick = () => { delete a.answers[id]; save(); renderQ(); };
    if ($("#qpMark")) $("#qpMark").onclick = () => { a.marked[id] = !a.marked[id]; save(); a.marked[id] && !lastQ ? go(a.idx + 1) : renderQ(); };
    if ($("#qpCheck")) $("#qpCheck").onclick = () => {
      const doCheck = () => { a.checked[id] = true; S.seen[id] = { r: grade(q, a.answers[id]), at: Date.now() }; save(); renderQ(); const fb = $("#qpFeedback"); if (fb) fb.scrollIntoView({ behavior: "smooth", block: "nearest" }); };
      if (!isAns(a.answers[id])) return A.confirm("Reveal without answering?", "This question will count as skipped.", "Show answer", doCheck);
      doCheck();
    };
    renderPal();
    if (window.innerWidth < 761) window.scrollTo({ top: 0 });
  }
  function feedback(q, given, res) {
    const tag = res === "correct" ? `<span class="verdict c">✓ Correct · +3</span>` : res === "wrong" ? `<span class="verdict w">✗ Wrong · ${q.type === "mcq" ? "−1" : "0 (TITA)"}</span>` : `<span class="verdict s">Not answered</span>`;
    return `<div class="feedback ${res === "correct" ? "fb-ok" : "fb-no"}" id="qpFeedback">
      <div class="row between">${tag}<span>Answer: <b>${esc(q.ans)}</b>${res !== "correct" && isAns(given) ? ` · yours: <b>${esc(given)}</b>` : ""}</span></div>
      <p class="muted small">${esc(qLabel(q))} · ${esc(TOP[q.topic] || "")} → ${esc(subOf(q))}</p>
      ${solution(q)}</div>`;
  }
  function go(i) {
    const a = S.active; if (i < 0 || i >= a.qids.length) return;
    a.idx = i; save(); renderQ(); $("#qpPal").classList.remove("open");
  }
  function renderPal() {
    const a = S.active;
    $("#qpPalGrid").innerHTML = a.qids.map((id, i) => {
      let cls = a.marked[id] ? "mark" : isAns(a.answers[id]) ? "ans" : a.visited[id] ? "vis" : "";
      if (a.mode === "practice" && a.checked[id]) cls = grade(Q[id], a.answers[id]) === "correct" ? "ans" : "vis";
      return `<button class="${cls} ${i === a.idx ? "cur" : ""} ${Q[id].type === "tita" ? "qp-tita" : ""}" data-i="${i}" title="${Q[id].type === "tita" ? "TITA" : "MCQ"}">${i + 1}</button>`;
    }).join("");
    $$("#qpPalGrid button").forEach(b => b.onclick = () => go(+b.dataset.i));
  }
  function submitPrompt() {
    const a = S.active, n = a.qids.filter(id => isAns(a.answers[id])).length;
    if (a.mode === "timed") A.confirm("Submit?", `${n} of ${a.qids.length} answered · ${fmt(a.remaining)} left.`, "Submit", finish);
    else A.confirm("Finish this practice?", `${Object.keys(a.checked).length} of ${a.qids.length} checked. Unchecked answers are graded too.`, "Finish", finish);
  }
  function finish() {
    const a = S.active; stopClock();
    const results = a.qids.map(id => { const q = Q[id], given = isAns(a.answers[id]) ? a.answers[id] : null, r = grade(q, given); return { id, topic: q.topic, type: q.type, given, ans: q.ans, result: r, marks: marks(q, r), time: a.time[id] || 0 }; });
    for (const r of results) if (a.mode === "timed" || a.checked[r.id] || r.given) S.seen[r.id] = { r: r.result, at: Date.now() };
    const c = results.filter(r => r.result === "correct").length;
    const rec = { id: a.id, mode: a.mode, title: a.title, paper: a.paper || null, limit: a.limit, created: a.created, finishedAt: Date.now(), used: a.used, pauses: a.pauses, results,
      score: results.reduce((x, r) => x + r.marks, 0), max: results.length * 3, c, n: results.length };
    S.attempts.unshift(rec); S.attempts = S.attempts.slice(0, 80); S.active = null; save();
    history.replaceState(null, "", "#qpyq/report/" + rec.id);
    renderReport(rec.id);
  }

  // ---------- report ----------
  function sum(rs) {
    const s = { n: rs.length, c: 0, w: 0, sk: 0, score: 0, time: 0, negs: 0 };
    for (const r of rs) { s[r.result === "correct" ? "c" : r.result === "wrong" ? "w" : "sk"]++; s.score += r.marks; s.time += r.time; if (r.marks < 0) s.negs++; }
    s.att = s.c + s.w; s.acc = pct(s.c, s.att); return s;
  }
  function diagnose(rec) {
    const out = [], R = rec.results, s = sum(R);
    const sinks = R.filter(r => r.time > 3 * 60e3 && r.result !== "correct");
    if (sinks.length) out.push(["warn", `<b>${sinks.length} time sink${sinks.length > 1 ? "s" : ""}</b>: over 3 minutes and no marks (${sinks.map(r => "Q" + (R.indexOf(r) + 1)).join(", ")}) — ${fmtShort(sinks.reduce((t, r) => t + r.time, 0))} in total. Cap every question at 3 minutes in pass 2.`]);
    const quickRight = R.filter(r => r.result === "correct" && r.time < 90e3).length;
    if (quickRight) out.push(["good", `${quickRight} solved in under 90 seconds — those are your sitters; make sure pass 1 finds all of them.`]);
    if (s.negs >= 3) out.push(["warn", `<b>${s.negs} wrong MCQs</b> cost ${s.negs} marks. If you can't get an MCQ down to two options, leave it.`]);
    const titaSkip = R.filter(r => r.type === "tita" && r.result === "skip").length;
    if (titaSkip) out.push(["warn", `<b>${titaSkip} TITA left blank</b> — no negative marking; key in a value for any you started.`]);
    const unseen = R.filter(r => r.result === "skip" && r.time < 15e3).length;
    if (rec.mode === "timed" && unseen > 4) out.push(["warn", `${unseen} questions were barely looked at (under 15 s). In pass 1, read every question once before going deep on any.`]);
    if (rec.mode === "timed" && R.length === 22) out.push(["", `Score <b>${s.score}</b>: in 2023–25 a Quant score around <b>25–33</b> was the 99 percentile line — roughly 10–12 correct with few negatives.`]);
    const byT = Object.keys(TOP).map(t => [t, sum(R.filter(r => r.topic === t))]).filter(([, x]) => x.n);
    const weak = byT.filter(([, x]) => x.att >= 2 && x.acc < 50);
    if (weak.length) out.push(["warn", `Lowest accuracy: ${weak.map(([t, x]) => `${TOP[t]} (${x.c}/${x.att})`).join(", ")} — drill those in “Practice by topic”.`]);
    return { notes: out, byT };
  }
  function renderReport(id) {
    stopClock(); A.show("qpyq");
    const rec = S.attempts.find(x => x.id === id);
    if (!rec) { view().innerHTML = `<div class="card empty">Report not found. <a href="#qpyq">Back</a></div>`; return; }
    const R = rec.results, s = sum(R), { notes, byT } = diagnose(rec);
    view().innerHTML = `
      <div class="report-head"><div><h1>${esc(rec.title)}</h1><p class="muted">${rec.mode === "timed" ? `Timed · ${rec.limit} min` : "Practice"} · ${new Date(rec.finishedAt).toLocaleString()}${rec.pauses ? ` · paused ${rec.pauses}×` : ""}</p></div>
        <div class="report-actions"><a class="btn" href="#qpyq">Quant PYQ home</a></div></div>
      <div class="kpis">
        <div class="kpi"><div class="v">${s.score}<span class="muted" style="font-size:1rem"> / ${rec.max}</span></div><div class="l">Score</div></div>
        <div class="kpi ${s.acc >= 75 ? "good" : s.att && s.acc < 50 ? "bad" : ""}"><div class="v">${s.att ? s.acc + "%" : "–"}</div><div class="l">Accuracy</div></div>
        <div class="kpi"><div class="v">${s.att}<span class="muted" style="font-size:1rem"> / ${s.n}</span></div><div class="l">Attempted</div></div>
        <div class="kpi good"><div class="v">${s.c}</div><div class="l">Correct</div></div>
        <div class="kpi bad"><div class="v">${s.w}</div><div class="l">Wrong (−${s.negs})</div></div>
        <div class="kpi"><div class="v">${fmt(rec.used)}</div><div class="l">Time</div></div>
      </div>
      <div class="card"><h2>By topic</h2><div class="tbl-wrap"><table class="tbl"><tr><th>Topic</th><th>Qs</th><th>Correct</th><th>Wrong</th><th>Skipped</th><th>Score</th><th>Time</th></tr>${byT.map(([t, x]) => `<tr><td>${esc(TOP[t])}</td><td>${x.n}</td><td style="color:var(--good)">${x.c}</td><td style="color:var(--bad)">${x.w}</td><td>${x.sk}</td><td><b>${x.score}</b></td><td>${fmtShort(x.time)}</td></tr>`).join("")}</table></div></div>
      <div class="card"><h2>What this says</h2><ul class="insights">${notes.map(([c, t]) => `<li class="${c}">${t}</li>`).join("") || "<li>Nothing stands out — keep going.</li>"}</ul>
        <details class="method"><summary>How to attempt the Quant section</summary><ul>${METHOD.map(m => `<li>${esc(m)}</li>`).join("")}</ul></details></div>
      <div class="card"><h2>Answers</h2>
        <div class="filters"><button class="active" data-f="all">All (${s.n})</button><button data-f="wrong">Wrong (${s.w})</button><button data-f="skip">Skipped (${s.sk})</button><button data-f="correct">Correct (${s.c})</button></div>
        <div id="qpReview">${R.map((r, i) => { const q = Q[r.id]; return `<details class="review r-${r.result}" data-res="${r.result}" data-id="${r.id}">
          <summary class="review-head"><div class="tags"><b>Q${i + 1}</b><span class="badge topic-b">${esc(TOP_SHORT[q.topic] || "")}</span><span class="badge">${esc(subOf(q))}</span><span class="badge">${esc(qLabel(q))}</span>${r.type === "tita" ? '<span class="badge new">TITA</span>' : ""}</div>
          <div class="tags">${r.result === "correct" ? '<span class="verdict c">✓ +3</span>' : r.result === "wrong" ? `<span class="verdict w">✗ ${r.marks}</span>` : '<span class="verdict s">— 0</span>'}<span class="muted">Yours: <b>${r.given ? esc(r.given) : "—"}</b> · Key: <b>${esc(q.ans)}</b> · ⏱ ${fmtShort(r.time)}</span></div></summary>
          <div class="rv-body"></div></details>`; }).join("")}</div></div>
      <p class="muted small">Scoring: +3 correct, −1 wrong MCQ, 0 wrong TITA, 0 skipped.</p>`;
    $$(".filters button").forEach(b => b.onclick = () => {
      $$(".filters button").forEach(x => x.classList.toggle("active", x === b));
      $$("#qpReview .review").forEach(d => d.classList.toggle("hidden", b.dataset.f !== "all" && d.dataset.res !== b.dataset.f));
    });
    $$("#qpReview details").forEach(d => d.addEventListener("toggle", () => {
      const body = $(".rv-body", d); if (!d.open || body.dataset.done) return;
      const q = Q[d.dataset.id], r = rec.results.find(x => x.id === q.id);
      let h = `<div class="qimg qp-stem">${imgs(q.img)}</div>`;
      if (q.type === "mcq") h += optionsHTML(q, r.given, true, false);
      h += solution(q);
      body.innerHTML = h; body.dataset.done = 1;
    }));
  }

  // tap an image to view it full size
  document.addEventListener("click", e => {
    const img = e.target.closest("#view-qpyq .qimg img"); if (!img) return;
    const o = document.createElement("div"); o.className = "zoom";
    o.innerHTML = `<button class="btn" aria-label="Close">✕ Close</button><div class="zoom-inner"><img src="${img.src}" alt=""></div>`;
    o.onclick = ev => { if (ev.target === o || ev.target.tagName === "BUTTON") o.remove(); };
    document.body.appendChild(o);
  });
  document.addEventListener("keydown", e => {
    if (!tick || !S.active || e.target.tagName === "INPUT" || !$("#modal").classList.contains("hidden") || $("#view-qpyq").classList.contains("hidden")) return;
    if (e.key.toLowerCase() === "p") return setPaused(!paused);
    if (paused) return;
    const k = e.key.toUpperCase();
    if (k.length === 1 && "ABCD".includes(k)) { const b = $(`#qpMain .opt[data-k="${k}"]`); if (b) b.click(); }
    else if (e.key === "ArrowRight") go(S.active.idx + 1);
    else if (e.key === "ArrowLeft") go(S.active.idx - 1);
  });
  window.addEventListener("beforeunload", save);
  window.QPYQ = { route, leave };
})();
