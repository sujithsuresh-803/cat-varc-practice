/* DILR PYQ — CAT 2023–2025 DILR sets.
   Timed mix: N sets (default 2) drawn from different slots/years, ~10 minutes a set, scored like CAT.
   Practice: one set at a time, untimed, with instant checking.
   Set content is NOT in this repo: it loads from the owner's private repo (same token as Real CAT)
   or from an imported file, and is cached in this browser. */
(() => {
  "use strict";
  const A = window.VARCApp;
  const { esc, fmt, fmtShort, pct } = A;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const KEY = "varc.dpyq.v1", FILE = "dilr/pyq-2023-2025.json", CACHE = "dpyq:2023-2025:v2", OLD_CACHE = "dpyq:2023-2025";
  const FAM = { data: "Tables & charts (DI)", slots: "Arrangement, matching, scheduling", scores: "Scores, ratings, Venn", maps: "Routes, networks, grids", rules: "Games, rules, logic" };
  const FAM_SHORT = { data: "DI", slots: "Arrange", scores: "Scores", maps: "Routes/grid", rules: "Games/rules" };
  const METHOD = [
    "First 60–90 seconds: read the whole set once and decide — is the structure clear (a grid, a table, a timeline)? If you can't draw it in a minute, it may be the set to drop.",
    "Draw the table/grid before the questions and write every condition in shorthand next to it; tick a condition off once it is used.",
    "Start from the most restrictive clue (a fixed position, a 'only', an extreme value), not from clue 1.",
    "Read the questions early: some can be answered from a partial grid, and conditional questions ('If X…') are separate mini-cases — don't let them overwrite your main grid.",
    "Budget ~10 minutes a set. At 12 minutes with nothing solid, move on; TITA guesses cost nothing, so key in your best value before leaving.",
  ];

  // ---------- state ----------
  const blank = () => ({ attempts: [], active: null, seen: {}, pref: { n: 2, per: 10, years: [2023, 2024, 2025], fam: "mix", unseen: true } });
  let S;
  try { S = Object.assign(blank(), JSON.parse(localStorage.getItem(KEY)) || {}); } catch { S = blank(); }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { /* storage unavailable */ } };
  let D = null, Q = {}, tick = null, last = 0, paused = false;
  const view = () => $("#view-dpyq");

  async function load() {
    if (D) return D;
    D = await window.RealCAT.cachedJSON(FILE, CACHE);
    if (!D) return null;
    window.RealCAT.putCache(OLD_CACHE, null).catch(() => {}); // free the pre-solutions copy
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
  const setQs = sid => D.questions.filter(q => q.set === sid).sort((x, y) => x.n - y.n);
  const imgs = list => (list || []).map(u => `<img src="${u}" alt="Set write-up" loading="lazy">`).join("");
  // worked solutions: strings are paragraphs, {table} objects are tables
  const paras = list => (list || []).map(x => typeof x === "string" ? `<p>${esc(x)}</p>`
    : `<div class="tbl-wrap data-tbl">${x.caption ? `<div class="tcap">${esc(x.caption)}</div>` : ""}<table class="tbl"><thead><tr>${x.table.head.map(h => `<th>${esc(h)}</th>`).join("")}</tr></thead><tbody>${x.table.rows.map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`).join("");
  const setSolution = (set, open) => set.expl ? `<details class="sol dp-setsol"${open ? " open" : ""}><summary>How to crack the whole set</summary><div class="sol-body">${paras(set.expl)}</div></details>` : "";
  function solution(q, withSet) {
    let h = "";
    if (q.expl) h += `<div class="expl dp-expl"><p class="dp-expl-h">Solution</p>${paras(q.expl)}</div>`;
    if (q.keyNote) h += `<p class="dp-knote">Note: ${esc(q.keyNote)}</p>`;
    if (withSet) h += setSolution(D.sets[q.set], false);
    return h;
  }
  const setSeen = sid => setQs(sid).filter(q => S.seen[q.id]).length;
  function setStat(sid) {
    const qs = setQs(sid), done = qs.filter(q => S.seen[q.id]);
    return { n: qs.length, done: done.length, c: done.filter(q => S.seen[q.id].r === "correct").length };
  }

  // ---------- routing ----------
  function leave() { stopClock(); }
  async function route(h) {
    stopClock(); A.show("dpyq");
    view().innerHTML = `<h1>DILR PYQs</h1><p class="muted">Loading…</p>`;
    let ok;
    try { ok = await load(); } catch (e) { return renderConnect(e.message); }
    if (!ok) return renderConnect();
    const parts = h.split("/");
    if (parts[1] === "report") return renderReport(parts[2]);
    if (parts[1] === "go" && S.active) return openSession();
    renderHome();
  }

  function renderConnect(err) {
    view().innerHTML = `<h1>DILR PYQs · CAT 2023–2025</h1>
      <div class="card"><p>These are real CAT sets, so they stay private and load from your private repo — the <b>same connection as Real CAT</b>.</p>
      <p class="muted small">If you connected before this section existed, the file is fetched automatically on first open. A new browser needs the token pasted once.</p>
      ${err ? `<p class="bad-t">${esc(err)}</p>` : ""}
      <div class="row gap"><a class="btn primary" href="#cat/setup/dpyq">Connect GitHub (once per browser)</a></div>
      <p class="muted small" style="margin-top:14px">Or import the file <code>${FILE}</code> from the private pack:</p>
      <input type="file" id="dFile" accept=".json,application/json"><p class="muted small" id="dMsg"></p></div>`;
    $("#dFile").onchange = async e => {
      try {
        const d = JSON.parse(await e.target.files[0].text());
        if (!d.questions || !d.sets || !FILE.includes(String(d.years?.[0]))) throw new Error("That isn't the DILR PYQ file.");
        await window.RealCAT.putCache(CACHE, d); D = null; route("dpyq");
      } catch (err2) { $("#dMsg").textContent = err2.message; }
    };
  }

  // ---------- home ----------
  function renderHome() {
    const a = S.active, p = S.pref, nSets = Object.keys(D.sets).length;
    const segBtns = (id, vals, cur, lab = v => v) => `<div class="seg" id="${id}">${vals.map(v => `<button data-v="${v}" class="${String(v) === String(cur) ? "active" : ""}">${lab(v)}</button>`).join("")}</div>`;
    const bySlot = D.papers.map(pp => {
      const sids = Object.keys(D.sets).filter(s => D.sets[s].paper === pp.id);
      return `<div class="dp-slot"><div class="dp-slot-h">${esc(pp.title)}</div>${sids.map(sid => {
        const s = D.sets[sid], st = setStat(sid);
        return `<button class="dp-set" data-s="${sid}"><span class="badge topic-b">${FAM_SHORT[s.fam]}</span><span class="dp-name">${esc(s.name)}</span>
          <span class="muted small">${s.n} Qs${st.done ? ` · ${st.c}/${st.n} right` : ""}</span>${st.done === st.n ? '<span class="dp-done" title="Done">✓</span>' : ""}</button>`; }).join("")}</div>`;
    }).join("");
    view().innerHTML = `
      <div class="report-head"><div><h1>DILR PYQs · CAT 2023–2025</h1>
        <p class="muted">${D.papers.length} slots · ${nSets} sets · ${D.questions.length} questions · official/source answer keys · worked solutions for every set · set write-ups shown exactly as printed (tables and charts included)</p></div></div>
      ${a ? `<div class="resume"><div><b>Unfinished: ${esc(a.title)}</b><div class="muted small">${a.mode === "timed" ? "Timed · " + fmt(a.remaining) + " left" : "Practice · " + Object.keys(a.checked).length + " of " + a.qids.length + " checked"}</div></div>
        <div class="row gap"><button class="btn" id="dDiscard">Discard</button><button class="btn primary" id="dResume">Resume ▶</button></div></div>` : ""}
      <div class="grid-2">
        <div class="card">
          <h2>Timed mix</h2>
          <p class="muted small">Random sets from <b>different slots</b> of the last three CATs, against the clock. +3 / −1 (TITA: no negative). Answers only at the end, with time spent on each set.</p>
          <div class="field"><span class="label">Sets</span>${segBtns("dN", [2, 3, 4], p.n)}</div>
          <div class="field"><span class="label">Time per set</span>${segBtns("dPer", [8, 10, 12], p.per, v => v + " min")}
            <span class="muted small" id="dTot"></span></div>
          <div class="field"><span class="label">Years</span><div class="seg" id="dYears">${D.years.map(y => `<button data-y="${y}" class="${p.years.includes(y) ? "active" : ""}">${y}</button>`).join("")}</div></div>
          <div class="field"><span class="label">Set types</span><select class="inp" id="dFam">
            <option value="mix">Mixed — no two sets of the same type (like the real paper)</option>
            <option value="any">Anything</option>
            ${Object.entries(FAM).map(([k, v]) => `<option value="${k}" ${p.fam === k ? "selected" : ""}>Only: ${esc(v)}</option>`).join("")}
          </select></div>
          <label class="check"><input type="checkbox" id="dUnseen" ${p.unseen ? "checked" : ""}> Prefer sets I haven't done</label>
          <button class="btn primary big" id="dStart">Start</button>
          <details class="method"><summary>How to attack a set</summary><ul>${METHOD.map(m => `<li>${esc(m)}</li>`).join("")}</ul></details>
        </div>
        <div class="card">
          <h2>Full slot · 40 min</h2>
          <p class="muted small">An entire DILR section as it was set: 4 sets (2023) or 5 sets (2024–25), 40 minutes. In the real exam you pick the sets to attempt — scan all of them first.</p>
          <div class="field"><select class="inp" id="dSlot">${D.papers.map(pp => `<option value="${pp.id}">${esc(pp.title)} · ${pp.n} Qs</option>`).join("")}</select></div>
          <button class="btn big" id="dStartSlot">Start 40-minute section</button>
          <h2 style="margin-top:1.4rem">Practice one set · untimed</h2>
          <p class="muted small">Pick any set; check each answer as you go. The clock still runs so you see how long it took.</p>
        </div>
      </div>
      <div class="card"><div class="dp-grid">${bySlot}</div></div>
      ${S.attempts.length ? `<div class="card"><h2>Your DILR sessions</h2>${S.attempts.slice(0, 30).map(at => `<a class="hist-item" href="#dpyq/report/${at.id}"><div><div class="t">${esc(at.title)}</div><div class="muted small">${new Date(at.finishedAt).toLocaleString()} · ${at.mode === "practice" ? "Practice" : "Timed"} · ${fmtShort(at.used)}</div></div><span class="score-pill">${at.score}/${at.max}</span></a>`).join("")}</div>` : ""}
      <p class="muted small">Sources: 2023 — candidate response sheets (provisional official key); 2024–25 — memory-based papers with the publisher's key, so an odd option or figure can differ slightly from the real paper (e.g. 2024 Slot 2 Q30 lists 3000 twice, as printed). Every set has a worked solution (shown after you check an answer in practice, and in the report review); each one was checked against the key by brute force, and notes flag the few places where the source or key is shaky.</p>`;
    const tot = () => { $("#dTot").textContent = `= ${S.pref.n * S.pref.per} minutes`; };
    tot();
    $$("#dN button").forEach(b => b.onclick = () => { $$("#dN button").forEach(x => x.classList.toggle("active", x === b)); S.pref.n = +b.dataset.v; save(); tot(); });
    $$("#dPer button").forEach(b => b.onclick = () => { $$("#dPer button").forEach(x => x.classList.toggle("active", x === b)); S.pref.per = +b.dataset.v; save(); tot(); });
    $$("#dYears button").forEach(b => b.onclick = () => { b.classList.toggle("active"); if (!$$("#dYears button.active").length) b.classList.add("active"); S.pref.years = $$("#dYears button.active").map(x => +x.dataset.y); save(); });
    $("#dFam").value = p.fam;
    $("#dFam").onchange = e => { S.pref.fam = e.target.value; save(); };
    $("#dUnseen").onchange = e => { S.pref.unseen = e.target.checked; save(); };
    $("#dStart").onclick = startMix;
    $("#dStartSlot").onclick = () => startSlot($("#dSlot").value);
    $$(".dp-set").forEach(b => b.onclick = () => startPractice(b.dataset.s));
    if (a) {
      $("#dResume").onclick = () => { location.hash = "dpyq/go"; };
      $("#dDiscard").onclick = () => A.confirm("Discard the unfinished session?", "Answers in it will be lost.", "Discard", () => { S.active = null; save(); renderHome(); });
    }
  }

  // ---------- building sessions ----------
  const guard = fn => S.active ? A.confirm("Replace your unfinished session?", "Starting a new one discards it.", "Start new", () => { S.active = null; save(); fn(); }) : fn();
  function begin(o) {
    S.active = Object.assign({ id: "d" + Date.now().toString(36), idx: 0, answers: {}, marked: {}, visited: {}, checked: {}, time: {}, used: 0, pauses: 0, created: Date.now() }, o);
    save(); location.hash = "dpyq/go";
  }
  function startMix() {
    guard(() => {
      const { n, per, years, fam, unseen } = S.pref;
      let pool = Object.keys(D.sets).filter(s => years.includes(+D.sets[s].paper.slice(0, 4)));
      if (fam !== "mix" && fam !== "any") pool = pool.filter(s => D.sets[s].fam === fam);
      pool = shuffle(pool);
      if (unseen) pool.sort((x, y) => (setSeen(x) > 0) - (setSeen(y) > 0));
      const chosen = [];
      const ok = (s, strict) => !chosen.some(c => D.sets[c].paper === D.sets[s].paper)
        && (!strict || fam !== "mix" || !chosen.some(c => D.sets[c].fam === D.sets[s].fam))
        && (!strict || chosen.length >= years.length || !chosen.some(c => D.sets[c].paper.slice(0, 4) === D.sets[s].paper.slice(0, 4)));
      for (const strict of [true, false]) for (const s of pool) { if (chosen.length < n && !chosen.includes(s) && ok(s, strict)) chosen.push(s); }
      for (const s of pool) if (chosen.length < n && !chosen.includes(s)) chosen.push(s);
      if (!chosen.length) return A.alert("No sets match those filters.");
      begin({ mode: "timed", sets: chosen, qids: chosen.flatMap(s => setQs(s).map(q => q.id)), remaining: chosen.length * per * 60e3, limit: chosen.length * per,
        title: `DILR mix · ${chosen.length} sets · ${chosen.length * per} min` });
    });
  }
  function startSlot(pid) {
    guard(() => {
      const sets = Object.keys(D.sets).filter(s => D.sets[s].paper === pid);
      begin({ mode: "timed", sets, qids: sets.flatMap(s => setQs(s).map(q => q.id)), remaining: 40 * 60e3, limit: 40, title: `${paperTitle(pid)} · DILR section` });
    });
  }
  function startPractice(sid) {
    guard(() => begin({ mode: "practice", sets: [sid], qids: setQs(sid).map(q => q.id), title: `Practice · ${D.sets[sid].name} (${paperTitle(D.sets[sid].paper)})` }));
  }

  // ---------- session ----------
  function openSession() {
    const a = S.active; paused = false;
    view().innerHTML = `
      <div class="quizbar cat-bar">
        <div class="qmeta"><span id="dQc"></span><span id="dTags"></span></div>
        <div class="qctl">
          <span class="timer" id="dTimer" title="${a.mode === "timed" ? "Time left" : "Time spent"}">00:00</span>
          <button class="btn ghost" id="dPause">❚❚ Pause</button>
          <button class="btn ghost" id="dExit">Save &amp; exit</button>
          <button class="btn danger" id="dSubmit">${a.mode === "timed" ? "Submit" : "Finish"}</button>
          <button class="btn ghost palette-toggle" id="dPalT" aria-label="Question palette">☰</button>
        </div>
      </div>
      <div class="quiz-layout"><div class="quiz-main" id="dMain"></div>
        <aside class="palette" id="dPal"><h3>${a.mode === "timed" ? `DILR · ${a.limit} min` : "Practice"}</h3><div id="dPalGrid"></div>
          <div class="legend"><span><i class="dot ans"></i>${a.mode === "timed" ? "Answered" : "Correct"}</span><span><i class="dot mark"></i>Marked</span><span><i class="dot vis"></i>${a.mode === "timed" ? "Not answered" : "Wrong/skipped"}</span><span><i class="dot"></i>Not visited</span></div>
          ${a.mode === "timed" ? `<p class="muted small">Clock under each set = time spent on it. Aim ≈10 min; drop a set that gives nothing by 12.</p>` : ""}
        </aside></div>
      <div class="pause-overlay hidden" id="dPauseO"><div class="pause-card"><h2>Paused</h2><p class="muted">Timer stopped and sets hidden.</p>
        <button class="btn primary big" id="dResumeB">▶ Resume</button><button class="btn ghost" id="dPauseExit">Save &amp; exit</button></div></div>`;
    $("#dPause").onclick = () => setPaused(true);
    $("#dResumeB").onclick = () => setPaused(false);
    $("#dExit").onclick = $("#dPauseExit").onclick = () => { stopClock(); save(); location.hash = "dpyq"; };
    $("#dSubmit").onclick = submitPrompt;
    $("#dPalT").onclick = () => $("#dPal").classList.toggle("open");
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
      if (Math.round(a.used / 1000) % 5 === 0) { save(); renderSetClocks(); }
    }, 1000);
  }
  function stopClock() { if (tick) clearInterval(tick); tick = null; }
  function updTimer() {
    const a = S.active, el = $("#dTimer"); if (!el) return;
    if (a.mode === "timed") { el.textContent = fmt(a.remaining); el.classList.toggle("low", a.remaining < 4 * 60e3); }
    else el.textContent = fmt(a.used);
  }
  function setPaused(v) { paused = v; last = Date.now(); if (v) S.active.pauses++; $("#dPauseO").classList.toggle("hidden", !v); save(); }
  document.addEventListener("visibilitychange", () => { if (document.hidden && S.active && tick && !paused) setPaused(true); });

  const setTime = (a, sid) => a.qids.filter(id => Q[id].set === sid).reduce((t, id) => t + (a.time[id] || 0), 0);

  function renderQ() {
    const a = S.active, id = a.qids[a.idx], q = Q[id], set = D.sets[q.set];
    a.visited[id] = true;
    const checked = a.mode === "practice" && a.checked[id], given = a.answers[id], res = checked ? grade(q, given) : null;
    const si = a.sets.indexOf(q.set), sqs = a.qids.filter(x => Q[x].set === q.set), pos = sqs.indexOf(id);
    $("#dQc").textContent = `Set ${si + 1} of ${a.sets.length} · Q${pos + 1} of ${sqs.length}`;
    $("#dTags").innerHTML = `<span class="badge topic-b">${esc(FAM_SHORT[set.fam])}</span>${a.mode === "practice" ? `<span class="badge">${esc(paperTitle(q.paper))} · Q${q.n}</span>` : ""}${q.type === "tita" ? '<span class="badge new">TITA</span>' : ""}`;
    updTimer();
    let body = `<p class="muted small dp-qno">Question ${a.idx + 1}</p>`;
    if (q.stem_img) body += `<div class="qimg">${imgs(q.stem_img)}</div>`;
    else body += `<p class="qstem">${esc(q.stem)}</p>`;
    if (q.type === "mcq") {
      body += `<div class="options">${q.opts.map(o => {
        let cls = given === o.k ? "sel" : "";
        if (checked) cls = o.k === q.ans ? "correct" : given === o.k ? "wrong" : "";
        return `<button class="opt ${cls}" data-k="${o.k}" ${checked ? "disabled" : ""}><span class="k">${o.k}</span><span>${esc(o.t)}</span></button>`; }).join("")}</div>`;
    } else {
      body += `<div class="tita"><input id="dTita" inputmode="decimal" autocomplete="off" value="${esc(given || "")}" placeholder="Type your answer" ${checked ? "disabled" : ""}>
        <div class="keypad">${"1234567890".split("").map(d => `<button data-d="${d}" ${checked ? "disabled" : ""}>${d}</button>`).join("")}<button data-d="." ${checked ? "disabled" : ""}>.</button><button data-d="-" ${checked ? "disabled" : ""}>−</button><button data-d="back" ${checked ? "disabled" : ""}>⌫</button></div></div>
        <p class="tita-note">TITA — no negative marking for a wrong answer.</p>`;
    }
    if (checked) body += feedback(q, given, res);
    const lastQ = a.idx === a.qids.length - 1;
    const nav = `<div class="qnav"><div class="grp"><button class="btn" id="dPrev" ${a.idx === 0 ? "disabled" : ""}>← Previous</button>${checked ? "" : `<button class="btn ghost" id="dClear">Clear</button>`}</div>
      <div class="grp">${a.mode === "practice"
        ? (checked ? "" : `<button class="btn primary" id="dCheck">Check answer</button>`) + `<button class="btn ${checked ? "primary" : ""}" id="dNext">${lastQ ? "Finish" : "Next →"}</button>`
        : `<button class="btn ghost" id="dMark">${a.marked[id] ? "★ Unmark" : "☆ Mark for review"}</button><button class="btn primary" id="dNext">${lastQ ? "Save" : "Save & next →"}</button>`}</div></div>`;
    $("#dMain").innerHTML = `<div class="q-split dp-split"><article class="passage dp-set-img" id="dSet"><p class="muted small">Set ${si + 1}${a.mode === "practice" ? ` · ${esc(set.name)} · ${esc(paperTitle(set.paper))}` : ""} · questions ${a.qids.indexOf(sqs[0]) + 1}–${a.qids.indexOf(sqs[sqs.length - 1]) + 1} · <span class="muted">tap to zoom</span></p><div class="qimg">${imgs(set.img)}</div>${checked ? setSolution(set, a._solOpen === q.set) : ""}</article><div class="qcard">${body}${nav}</div></div>`;
    const box = $("#dSet");
    if (a._lastSet === q.set && a._ps != null) box.scrollTop = a._ps; else a._ps = 0;
    box.onscroll = e => { a._ps = e.target.scrollTop; };
    const ss = $(".dp-setsol", box); if (ss) ss.addEventListener("toggle", () => { a._solOpen = ss.open ? q.set : null; });
    if (a._lastSet !== q.set && window.innerWidth < 761) window.scrollTo({ top: 0 });
    a._lastSet = q.set;

    $$("#dMain .opt").forEach(b => b.onclick = () => { if (checked) return; a.answers[id] = a.answers[id] === b.dataset.k ? undefined : b.dataset.k; if (!isAns(a.answers[id])) delete a.answers[id]; save(); renderQ(); });
    const ti = $("#dTita");
    if (ti && !checked) {
      const setT = v => { ti.value = v; if (isAns(v)) a.answers[id] = v.trim(); else delete a.answers[id]; save(); renderPal(); };
      ti.oninput = () => setT(ti.value.replace(/[^\d.\-\/]/g, "").slice(0, 12));
      $$("#dMain .keypad button").forEach(b => b.onclick = () => { const d = b.dataset.d; setT(d === "back" ? ti.value.slice(0, -1) : (ti.value + d).slice(0, 12)); });
    }
    $("#dPrev").onclick = () => go(a.idx - 1);
    $("#dNext").onclick = () => lastQ ? submitPrompt() : go(a.idx + 1);
    if ($("#dClear")) $("#dClear").onclick = () => { delete a.answers[id]; save(); renderQ(); };
    if ($("#dMark")) $("#dMark").onclick = () => { a.marked[id] = !a.marked[id]; save(); a.marked[id] && !lastQ ? go(a.idx + 1) : renderQ(); };
    if ($("#dCheck")) $("#dCheck").onclick = () => {
      const doCheck = () => { a.checked[id] = true; S.seen[id] = { r: grade(q, a.answers[id]), at: Date.now() }; save(); renderQ(); const fb = $("#dFeedback"); if (fb) fb.scrollIntoView({ behavior: "smooth", block: "nearest" }); };
      if (!isAns(a.answers[id])) return A.confirm("Reveal without answering?", "This question will count as skipped.", "Show answer", doCheck);
      doCheck();
    };
    renderPal();
  }
  function feedback(q, given, res) {
    const tag = res === "correct" ? `<span class="verdict c">✓ Correct · +3</span>` : res === "wrong" ? `<span class="verdict w">✗ Wrong · ${q.type === "mcq" ? "−1" : "0 (TITA)"}</span>` : `<span class="verdict s">Not answered</span>`;
    return `<div class="feedback ${res === "correct" ? "fb-ok" : "fb-no"}" id="dFeedback">
      <div class="row between">${tag}<span>Answer: <b>${esc(ansLabel(q))}</b>${res !== "correct" && isAns(given) ? ` · yours: <b>${esc(given)}</b>` : ""}</span></div>
      ${solution(q, false)}
      <p class="muted small">Full walkthrough: “How to crack the whole set”, under the set. · ${esc(paperTitle(q.paper))} · Q${q.n}</p></div>`;
  }
  const ansLabel = q => { if (q.type !== "mcq") return q.ans; const o = q.opts.find(x => x.k === q.ans); return o ? `${q.ans} · ${o.t.length > 40 ? o.t.slice(0, 40) + "…" : o.t}` : q.ans; };
  function go(i) {
    const a = S.active; if (i < 0 || i >= a.qids.length) return;
    a.idx = i; save(); renderQ(); $("#dPal").classList.remove("open");
  }
  function renderPal() {
    const a = S.active;
    $("#dPalGrid").innerHTML = a.sets.map((sid, si) => {
      const ids = a.qids.filter(x => Q[x].set === sid);
      return `<div class="dp-pal-set"><div class="dp-pal-h"><b>Set ${si + 1}</b><span class="muted small" data-clock="${sid}">⏱ ${fmt(setTime(a, sid))}</span></div><div class="pal-grid">${ids.map(id => {
        const i = a.qids.indexOf(id);
        let cls = a.marked[id] ? "mark" : isAns(a.answers[id]) ? "ans" : a.visited[id] ? "vis" : "";
        if (a.mode === "practice" && a.checked[id]) cls = grade(Q[id], a.answers[id]) === "correct" ? "ans" : "vis";
        return `<button class="${cls} ${i === a.idx ? "cur" : ""}" data-i="${i}">${i + 1}</button>`; }).join("")}</div></div>`;
    }).join("");
    $$("#dPalGrid button").forEach(b => b.onclick = () => go(+b.dataset.i));
  }
  function renderSetClocks() {
    const a = S.active; if (!a) return;
    $$("#dPalGrid [data-clock]").forEach(el => { el.textContent = "⏱ " + fmt(setTime(a, el.dataset.clock)); });
  }
  function submitPrompt() {
    const a = S.active, n = a.qids.filter(id => isAns(a.answers[id])).length;
    if (a.mode === "timed") A.confirm("Submit?", `${n} of ${a.qids.length} answered · ${fmt(a.remaining)} left.`, "Submit", finish);
    else A.confirm("Finish this set?", `${Object.keys(a.checked).length} of ${a.qids.length} checked. Unchecked answers are graded too.`, "Finish", finish);
  }
  function finish() {
    const a = S.active; stopClock();
    const results = a.qids.map(id => { const q = Q[id], given = isAns(a.answers[id]) ? a.answers[id] : null, r = grade(q, given); return { id, set: q.set, type: q.type, given, ans: q.ans, result: r, marks: marks(q, r), time: a.time[id] || 0 }; });
    for (const r of results) if (a.mode === "timed" || a.checked[r.id] || r.given) S.seen[r.id] = { r: r.result, at: Date.now() };
    const c = results.filter(r => r.result === "correct").length;
    const rec = { id: a.id, mode: a.mode, title: a.title, sets: a.sets, limit: a.limit, created: a.created, finishedAt: Date.now(), used: a.used, pauses: a.pauses, results,
      score: results.reduce((x, r) => x + r.marks, 0), max: results.length * 3, c, n: results.length };
    S.attempts.unshift(rec); S.attempts = S.attempts.slice(0, 80); S.active = null; save();
    history.replaceState(null, "", "#dpyq/report/" + rec.id);
    renderReport(rec.id);
  }

  // ---------- report ----------
  function sum(rs) {
    const s = { n: rs.length, c: 0, w: 0, sk: 0, score: 0, time: 0, negs: 0 };
    for (const r of rs) { s[r.result === "correct" ? "c" : r.result === "wrong" ? "w" : "sk"]++; s.score += r.marks; s.time += r.time; if (r.marks < 0) s.negs++; }
    s.att = s.c + s.w; s.acc = pct(s.c, s.att); return s;
  }
  function diagnose(rec) {
    const out = [], R = rec.results;
    const bySet = rec.sets.map(sid => [sid, sum(R.filter(r => r.set === sid))]);
    bySet.forEach(([sid, s], i) => {
      const nm = `Set ${i + 1} (${esc(D.sets[sid].name)})`;
      if (s.c === s.n) out.push(["good", `${nm}: fully solved in ${fmtShort(s.time)}.`]);
      else if (s.time > 12 * 60e3 && s.c <= s.n / 2) out.push(["warn", `${nm}: ${fmtShort(s.time)} for ${s.c}/${s.n}. That's the sunk-cost trap — by minute 12 with no solid grid, move on.`]);
      else if (s.time < 4 * 60e3 && s.att === 0) out.push(["warn", `${nm}: barely touched (${fmtShort(s.time)}). If you chose to skip it, fine — but key in TITA guesses before leaving.`]);
      if (s.w >= 2 && s.c >= 1) out.push(["warn", `${nm}: ${s.w} wrong next to ${s.c} right — usually one misread condition. Re-read the clues against your grid before answering the rest.`]);
    });
    const negs = R.filter(r => r.marks < 0).length;
    if (negs >= 3) out.push(["warn", `Negative marks cost you <b>${negs}</b>. In DILR a set is usually all-or-nothing: if the grid isn't certain, don't guess MCQs from it.`]);
    const titaSkip = R.filter(r => r.type === "tita" && r.result === "skip").length;
    if (titaSkip) out.push(["warn", `<b>${titaSkip} TITA left blank</b> — no negative marking, always key in your best value.`]);
    if (rec.mode === "timed") {
      const full = bySet.filter(([, s]) => s.c === s.n).length;
      out.push(["", `Sets fully solved: <b>${full} of ${rec.sets.length}</b>. For a 99 percentile DILR you need about 2 sets solved fully out of 4–5 in 40 minutes, plus a few questions from a third.`]);
    }
    return { notes: out, bySet };
  }
  function renderReport(id) {
    stopClock(); A.show("dpyq");
    const rec = S.attempts.find(x => x.id === id);
    if (!rec) { view().innerHTML = `<div class="card empty">Report not found. <a href="#dpyq">Back</a></div>`; return; }
    const R = rec.results, s = sum(R), { notes, bySet } = diagnose(rec);
    const HEAD = `<tr><th>Set</th><th>Type</th><th>Qs</th><th>Correct</th><th>Wrong</th><th>Score</th><th>Time</th></tr>`;
    view().innerHTML = `
      <div class="report-head"><div><h1>${esc(rec.title)}</h1><p class="muted">${rec.mode === "timed" ? `Timed · ${rec.limit} min` : "Practice"} · ${new Date(rec.finishedAt).toLocaleString()}${rec.pauses ? ` · paused ${rec.pauses}×` : ""}</p></div>
        <div class="report-actions"><a class="btn" href="#dpyq">DILR PYQ home</a></div></div>
      <div class="kpis">
        <div class="kpi"><div class="v">${s.score}<span class="muted" style="font-size:1rem"> / ${rec.max}</span></div><div class="l">Score</div></div>
        <div class="kpi ${s.acc >= 70 ? "good" : s.att && s.acc < 45 ? "bad" : ""}"><div class="v">${s.att ? s.acc + "%" : "–"}</div><div class="l">Accuracy</div></div>
        <div class="kpi"><div class="v">${s.att}<span class="muted" style="font-size:1rem"> / ${s.n}</span></div><div class="l">Attempted</div></div>
        <div class="kpi good"><div class="v">${s.c}</div><div class="l">Correct</div></div>
        <div class="kpi bad"><div class="v">${s.w}</div><div class="l">Wrong (−${s.negs})</div></div>
        <div class="kpi"><div class="v">${fmt(rec.used)}</div><div class="l">Time</div></div>
      </div>
      <div class="card"><h2>By set</h2><div class="tbl-wrap"><table class="tbl">${HEAD}${bySet.map(([sid, x], i) => `<tr><td>Set ${i + 1} · ${esc(D.sets[sid].name)}<div class="muted small">${esc(paperTitle(D.sets[sid].paper))}</div></td><td>${esc(FAM_SHORT[D.sets[sid].fam])}</td><td>${x.n}</td><td style="color:var(--good)">${x.c}</td><td style="color:var(--bad)">${x.w}</td><td><b>${x.score}</b></td><td>${fmtShort(x.time)}</td></tr>`).join("")}</table></div></div>
      <div class="card"><h2>What this says</h2><ul class="insights">${notes.map(([c, t]) => `<li class="${c}">${t}</li>`).join("")}</ul>
        <details class="method"><summary>How to attack a set</summary><ul>${METHOD.map(m => `<li>${esc(m)}</li>`).join("")}</ul></details></div>
      <div class="card"><h2>Answers</h2>
        <div class="filters"><button class="active" data-f="all">All (${s.n})</button><button data-f="wrong">Wrong (${s.w})</button><button data-f="skip">Skipped (${s.sk})</button><button data-f="correct">Correct (${s.c})</button></div>
        <div id="dReview">${R.map((r, i) => { const q = Q[r.id]; return `<details class="review r-${r.result}" data-res="${r.result}" data-id="${r.id}">
          <summary class="review-head"><div class="tags"><b>Q${i + 1}</b><span class="badge topic-b">Set ${rec.sets.indexOf(r.set) + 1}</span><span class="badge">${esc(paperTitle(q.paper))} · Q${q.n}</span>${r.type === "tita" ? '<span class="badge new">TITA</span>' : ""}</div>
          <div class="tags">${r.result === "correct" ? '<span class="verdict c">✓ +3</span>' : r.result === "wrong" ? `<span class="verdict w">✗ ${r.marks}</span>` : '<span class="verdict s">— 0</span>'}<span class="muted">Yours: <b>${r.given ? esc(r.given) : "—"}</b> · Key: <b>${esc(q.ans)}</b> · ⏱ ${fmtShort(r.time)}</span></div></summary>
          <div class="rv-body"></div></details>`; }).join("")}</div></div>
      <p class="muted small">Scoring: +3 correct, −1 wrong MCQ, 0 wrong TITA, 0 skipped.</p>`;
    $$(".filters button").forEach(b => b.onclick = () => {
      $$(".filters button").forEach(x => x.classList.toggle("active", x === b));
      $$("#dReview .review").forEach(d => d.classList.toggle("hidden", b.dataset.f !== "all" && d.dataset.res !== b.dataset.f));
    });
    $$("#dReview details").forEach(d => d.addEventListener("toggle", () => {
      const body = $(".rv-body", d); if (!d.open || body.dataset.done) return;
      const q = Q[d.dataset.id], r = rec.results.find(x => x.id === q.id), set = D.sets[q.set];
      let h = `<details class="sol"><summary>Show the set</summary><div class="qimg">${imgs(set.img)}</div></details>`;
      h += q.stem_img ? `<div class="qimg">${imgs(q.stem_img)}</div>` : `<p class="qstem">${esc(q.stem)}</p>`;
      if (q.type === "mcq") h += `<div class="options">${q.opts.map(o => `<div class="opt ${o.k === q.ans ? "correct" : o.k === r.given ? "wrong" : ""}"><span class="k">${o.k}</span><span>${esc(o.t)}</span></div>`).join("")}</div>`;
      h += `<p class="muted small">Key: <b>${esc(ansLabel(q))}</b></p>` + solution(q, true);
      body.innerHTML = h; body.dataset.done = 1;
    }));
  }

  // tap a set image to view it full size
  document.addEventListener("click", e => {
    const img = e.target.closest("#view-dpyq .qimg img"); if (!img) return;
    const o = document.createElement("div"); o.className = "zoom";
    o.innerHTML = `<button class="btn" aria-label="Close">✕ Close</button><div class="zoom-inner"><img src="${img.src}" alt=""></div>`;
    o.onclick = ev => { if (ev.target === o || ev.target.tagName === "BUTTON") o.remove(); };
    document.body.appendChild(o);
  });
  document.addEventListener("keydown", e => {
    if (!tick || !S.active || e.target.tagName === "INPUT" || !$("#modal").classList.contains("hidden") || $("#view-dpyq").classList.contains("hidden")) return;
    if (e.key.toLowerCase() === "p") return setPaused(!paused);
    if (paused) return;
    const k = e.key.toUpperCase();
    if (k.length === 1 && "ABCD".includes(k)) { const b = $(`#dMain .opt[data-k="${k}"]`); if (b) b.click(); }
    else if (e.key === "ArrowRight") go(S.active.idx + 1);
    else if (e.key === "ArrowLeft") go(S.active.idx - 1);
  });
  window.addEventListener("beforeunload", save);
  window.DPYQ = { route, leave };
})();
