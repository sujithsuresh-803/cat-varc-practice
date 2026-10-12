/* CAT VARC Practice — all state lives in localStorage; no backend. */
(() => {
  "use strict";

  const DATA = window.VARC;
  const Q = Object.fromEntries(DATA.questions.map(q => [q.id, q]));
  const TOPICS = DATA.topics;                      // [[id, name], ...] — RC first (priority)
  const TNAME = Object.fromEntries(TOPICS);
  const DLEVEL = { easy: 1, medium: 2, hard: 3 };
  const STORE_KEY = "varc.v1";

  // ---------- storage ----------
  const blank = () => ({ history: [], seen: {}, active: null, prefs: {} });
  let S;
  try { S = Object.assign(blank(), JSON.parse(localStorage.getItem(STORE_KEY)) || {}); } catch { S = blank(); }
  const save = () => { try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); } catch { /* storage unavailable */ } };

  // ---------- helpers ----------
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const fmt = ms => { const s = Math.round(ms / 1000), h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, x = s % 60;
    return (h ? h + ":" + String(m).padStart(2, "0") : String(m).padStart(2, "0")) + ":" + String(x).padStart(2, "0"); };
  const fmtShort = ms => { const s = Math.round(ms / 1000); return s < 60 ? s + "s" : Math.floor(s / 60) + "m " + (s % 60) + "s"; };
  const dayKey = t => new Date(t).toLocaleDateString("en-CA");
  const pct = (a, b) => b ? Math.round(100 * a / b) : 0;
  const normTita = v => String(v || "").replace(/\D/g, "");
  const isAnswered = v => v !== undefined && v !== null && String(v).trim() !== "";

  function grade(q, given) {
    if (!isAnswered(given)) return "skip";
    if (q.type === "tita") return normTita(given) === q.answer ? "correct" : "wrong";
    return given === q.answer ? "correct" : "wrong";
  }
  const marks = (q, r) => r === "correct" ? 3 : r === "wrong" && q.type === "mcq" ? -1 : 0;

  // ---------- views ----------
  function show(view) {
    if (view !== "quiz") stopClock();
    $$(".view").forEach(v => v.classList.add("hidden"));
    $("#view-" + view).classList.remove("hidden");
    $$(".topbar nav a").forEach(a => a.classList.toggle("active", a.dataset.nav === view));
    window.scrollTo(0, 0);
  }
  function route() {
    const h = location.hash.replace("#", "") || "home";
    if (h.startsWith("report/")) return renderReport(h.slice(7));
    if (h === "history") return renderHistory();
    if (h === "quiz" && S.active) return openQuiz();
    renderHome();
  }
  window.addEventListener("hashchange", route);

  // ---------- theme ----------
  const applyTheme = t => { if (t) document.documentElement.dataset.theme = t; else delete document.documentElement.dataset.theme; };
  applyTheme(S.prefs.theme);
  $("#themeBtn").onclick = () => {
    const dark = S.prefs.theme ? S.prefs.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    S.prefs.theme = dark ? "light" : "dark"; applyTheme(S.prefs.theme); save();
  };

  // ---------- home ----------
  const prefs = () => Object.assign({ topics: ["rc"], mode: "quick5", pattern: "hard", diff: "mixed", count: 16,
    rcPriority: true, rcFull: true, unseenFirst: true, timer: true }, S.prefs);

  function topicStats() {
    const st = Object.fromEntries(TOPICS.map(([t]) => [t, { a: 0, c: 0, w: 0, time: 0 }]));
    for (const h of S.history) for (const r of h.results) {
      const s = st[r.topic]; if (!s || r.result === "skip") continue;
      s.a++; if (r.result === "correct") s.c++; else s.w++; s.time += r.time;
    }
    return st;
  }

  function renderHome() {
    show("home");
    const p = prefs();
    // resume
    const a = S.active;
    $("#resumeBox").innerHTML = a ? `<div class="resume"><div><b>You have an unfinished set</b><div class="muted small">${esc(a.title)} · ${Object.keys(a.answers).filter(k => isAnswered(a.answers[k])).length}/${a.qids.length} answered · ${fmt(a.elapsed)} elapsed</div></div>
      <div class="row gap"><button class="btn" id="discardBtn">Discard</button><button class="btn primary" id="resumeSet">Resume ▶</button></div></div>` : "";
    if (a) {
      $("#resumeSet").onclick = () => { location.hash = "quiz"; openQuiz(); };
      $("#discardBtn").onclick = () => confirmBox("Discard the unfinished set?", "Your answers in it will be lost.", "Discard", () => { S.active = null; save(); renderHome(); });
    }
    // hero stats
    const today = dayKey(Date.now());
    const todays = S.history.filter(h => dayKey(h.finishedAt) === today);
    const tq = todays.reduce((n, h) => n + h.results.filter(r => r.result !== "skip").length, 0);
    const tc = todays.reduce((n, h) => n + h.results.filter(r => r.result === "correct").length, 0);
    const days = new Set(S.history.map(h => dayKey(h.finishedAt)));
    let streak = 0; for (let d = new Date(); days.has(dayKey(d)); d.setDate(d.getDate() - 1)) streak++;
    $("#heroStats").textContent = `${DATA.questions.length} questions · ${Object.keys(DATA.passages).length} RC passages · ${Object.keys(S.seen).length} seen so far`;
    $("#todayChips").innerHTML = `<span class="chip">Today: <b>${tq}</b> attempted</span><span class="chip">Accuracy: <b>${tq ? pct(tc, tq) + "%" : "–"}</b></span><span class="chip">Streak: <b>${streak}</b> day${streak === 1 ? "" : "s"}</span>`;

    // topics
    $("#topicList").innerHTML = TOPICS.map(([t, n]) => {
      const cnt = DATA.questions.filter(q => q.topic === t).length;
      const on = p.topics.includes(t);
      return `<label class="topic ${on ? "checked" : ""}"><input type="checkbox" value="${t}" ${on ? "checked" : ""}>
        <span class="tname">${n}</span>${t === "rc" ? '<span class="badge pri">Priority</span>' : ""}<span class="tcount">${cnt} Qs</span></label>`;
    }).join("");
    $$("#topicList input").forEach(i => i.onchange = () => { i.closest(".topic").classList.toggle("checked", i.checked); savePrefs(); });
    const setTopics = list => { $$("#topicList input").forEach(i => { i.checked = list.includes(i.value); i.closest(".topic").classList.toggle("checked", i.checked); }); savePrefs(); };
    $("#selAll").onclick = () => setTopics(TOPICS.map(t => t[0]));
    $("#selRC").onclick = () => setTopics(["rc"]);
    $("#selNone").onclick = () => setTopics([]);

    // mode tabs
    const setMode = m => { $$(".mode-tab").forEach(b => b.classList.toggle("active", b.dataset.mode === m)); $$(".mode-panel").forEach(x => x.classList.toggle("hidden", x.dataset.panel !== m)); };
    $$(".mode-tab").forEach(b => b.onclick = () => { setMode(b.dataset.mode); S.prefs.mode = b.dataset.mode; save(); });
    setMode(p.mode);
    $$('input[name="pattern"]').forEach(r => { r.checked = r.value === p.pattern; r.onchange = savePrefs; });
    const seg = (id, val) => $$(`#${id} button`).forEach(b => { b.classList.toggle("active", b.dataset.v === String(val));
      b.onclick = () => { $$(`#${id} button`).forEach(x => x.classList.remove("active")); b.classList.add("active"); savePrefs(); }; });
    seg("diffSeg", p.diff); seg("countSeg", p.count);
    $("#rcPriority").checked = p.rcPriority; $("#rcFull").checked = p.rcFull; $("#unseenFirst").checked = p.unseenFirst;
    $("#cTimer").checked = p.timer; $("#q5Timer").checked = p.timer;
    ["rcPriority", "rcFull", "unseenFirst", "cTimer", "q5Timer"].forEach(id => $("#" + id).onchange = e => {
      if (id === "cTimer") $("#q5Timer").checked = e.target.checked; if (id === "q5Timer") $("#cTimer").checked = e.target.checked; savePrefs(); });
    updatePoolInfo();

    $("#startQuick").onclick = () => startSet("quick5");
    $("#startCustom").onclick = () => startSet("custom");

    // progress bars
    const st = topicStats();
    $("#progressBars").innerHTML = TOPICS.map(([t, n]) => {
      const s = st[t], acc = pct(s.c, s.a), cls = !s.a ? "" : acc >= 70 ? "good" : acc >= 45 ? "mid" : "low";
      return `<div class="bar-row"><span>${n}</span><div class="bar"><i class="${cls}" style="width:${s.a ? acc : 0}%"></i></div>
        <span class="muted small">${s.a ? `${acc}% · ${s.a} done` : "not started"}</span></div>`;
    }).join("");
  }

  function readPrefs() {
    return {
      topics: $$("#topicList input:checked").map(i => i.value),
      pattern: ($('input[name="pattern"]:checked') || {}).value || "hard",
      diff: $("#diffSeg .active").dataset.v,
      count: +$("#countSeg .active").dataset.v,
      rcPriority: $("#rcPriority").checked, rcFull: $("#rcFull").checked,
      unseenFirst: $("#unseenFirst").checked, timer: $("#cTimer").checked,
    };
  }
  function savePrefs() { Object.assign(S.prefs, readPrefs()); save(); updatePoolInfo(); }
  function updatePoolInfo() {
    const p = readPrefs();
    const pool = DATA.questions.filter(q => p.topics.includes(q.topic) && (p.diff === "mixed" || q.difficulty === p.diff));
    const unseen = pool.filter(q => !S.seen[q.id]).length;
    $("#poolInfo").textContent = p.topics.length ? `${pool.length} questions match (${unseen} unseen).` : "Select at least one topic.";
  }

  // ---------- set builder ----------
  function pickFrom(pool, n, unseenFirst) {
    const sh = shuffle(pool);
    if (unseenFirst) sh.sort((a, b) => (S.seen[a.id] || 0) - (S.seen[b.id] || 0));
    return sh.slice(0, n);
  }
  const passageDifficulty = pid => DATA.passages[pid].difficulty;
  const passageQids = pid => DATA.questions.filter(q => q.passage === pid).map(q => q.id);

  // Quick 5 = five full RC passages (CAT-style) in the chosen difficulty mix,
  // plus five single questions from any other selected topics in the same mix.
  function buildQuick5(p) {
    const plan = p.pattern === "easy" ? ["easy", "easy", "medium", "medium", "hard"] : ["easy", "medium", "medium", "hard", "hard"];
    const near = { easy: ["easy", "medium", "hard"], medium: ["medium", "easy", "hard"], hard: ["hard", "medium", "easy"] };
    const out = [];
    if (p.topics.includes("rc")) {
      const used = new Set(), picked = [];
      for (const d of plan) {
        for (const alt of near[d]) {
          const pool = shuffle(Object.keys(DATA.passages).filter(pid => passageDifficulty(pid) === alt && !used.has(pid)));
          pool.sort((a, b) => seenCount(a) - seenCount(b));
          if (pool.length) { used.add(pool[0]); picked.push(pool[0]); break; }
        }
      }
      for (const pid of shuffle(picked)) out.push(...passageQids(pid));
    }
    const others = p.topics.filter(t => t !== "rc");
    if (others.length) {
      const used = new Set();
      for (const d of plan) {
        const topic = others[Math.floor(Math.random() * others.length)];
        let q = null;
        for (const alt of near[d]) {
          q = pickFrom(DATA.questions.filter(x => x.topic === topic && x.difficulty === alt && !used.has(x.id)), 1, true)[0];
          if (q) break;
        }
        if (q) { used.add(q.id); out.push(q.id); }
      }
    }
    return out;
  }

  function buildCustom(p) {
    const n = p.count, matchD = q => p.diff === "mixed" || q.difficulty === p.diff;
    const others = p.topics.filter(t => t !== "rc");
    const hasRC = p.topics.includes("rc");
    let rcTarget = !hasRC ? 0 : !others.length ? n : p.rcPriority ? Math.round(n * 0.6) : Math.round(n / p.topics.length);
    const ids = [];
    if (rcTarget) {
      if (p.rcFull) {
        let pids = Object.keys(DATA.passages).filter(pid => p.diff === "mixed" || passageDifficulty(pid) === p.diff);
        if (!pids.length) pids = Object.keys(DATA.passages);
        pids = shuffle(pids);
        if (p.unseenFirst) pids.sort((a, b) => seenCount(a) - seenCount(b));
        for (const pid of pids) {
          if (ids.length >= rcTarget) break;
          const qs = DATA.questions.filter(q => q.passage === pid);
          if (ids.length && ids.length + qs.length > rcTarget + 2) continue;
          ids.push(...qs.map(q => q.id));
        }
      } else {
        const picked = pickFrom(DATA.questions.filter(q => q.topic === "rc" && matchD(q)), rcTarget, p.unseenFirst);
        picked.sort((a, b) => a.passage.localeCompare(b.passage, undefined, { numeric: true }));
        ids.push(...picked.map(q => q.id));
      }
    }
    const remaining = n - ids.length;
    if (others.length && remaining > 0) {
      const per = others.map((t, i) => [t, Math.floor(remaining / others.length) + (i < remaining % others.length ? 1 : 0)]);
      for (const [t, k] of shuffle(per)) {
        if (!k) continue;
        ids.push(...pickFrom(DATA.questions.filter(q => q.topic === t && matchD(q)), k, p.unseenFirst).map(q => q.id));
      }
    }
    return ids;
  }
  const seenCount = pid => DATA.questions.filter(q => q.passage === pid).reduce((s, q) => s + (S.seen[q.id] ? 1 : 0), 0);

  function startSet(mode) {
    const p = readPrefs();
    if (!p.topics.length) return alertBox("Pick at least one topic first.");
    if (S.active) return confirmBox("Replace your unfinished set?", "Starting a new set discards the one in progress.", "Start new", () => { S.active = null; startSet(mode); });
    const qids = mode === "quick5" ? buildQuick5(p) : buildCustom(p);
    if (!qids.length) return alertBox("No questions match that combination. Try Mixed difficulty or more topics.");
    const names = p.topics.map(t => TNAME[t]);
    S.active = {
      id: "s" + Date.now().toString(36), created: Date.now(), mode,
      title: mode === "quick5" ? `Quick 5${p.topics.includes("rc") ? " RC passages" : ""} (${p.pattern === "easy" ? "2E·2M·1H" : "1E·2M·2H"})` :`Custom · ${p.diff[0].toUpperCase() + p.diff.slice(1)} · ${qids.length} Qs`,
      topics: p.topics, topicNames: names, timer: p.timer, qids, idx: 0, answers: {}, marked: {}, visited: {}, time: {}, elapsed: 0,
    };
    save(); location.hash = "quiz"; openQuiz();
  }

  // ---------- quiz ----------
  let tick = null, lastTick = 0, paused = false;

  function openQuiz() {
    show("quiz");
    paused = false; $("#pauseOverlay").classList.add("hidden");
    $("#timer").classList.toggle("off", !S.active.timer);
    renderQuestion(); startClock();
  }
  function startClock() {
    stopClock(); lastTick = Date.now();
    tick = setInterval(() => {
      const a = S.active; if (!a || paused) return;
      const now = Date.now(), d = Math.min(now - lastTick, 5000); lastTick = now;  // cap gaps (sleep / hidden tab)
      a.elapsed += d; const qid = a.qids[a.idx]; a.time[qid] = (a.time[qid] || 0) + d;
      $("#timer").textContent = fmt(a.elapsed);
      if (Math.round(a.elapsed / 1000) % 5 === 0) save();
    }, 1000);
  }
  function stopClock() { if (tick) clearInterval(tick); tick = null; }
  function setPaused(v) {
    paused = v; lastTick = Date.now();
    $("#pauseOverlay").classList.toggle("hidden", !v);
    if (v) save();
  }
  document.addEventListener("visibilitychange", () => { if (document.hidden && S.active && !$("#view-quiz").classList.contains("hidden")) setPaused(true); });

  function renderQuestion() {
    const a = S.active, qid = a.qids[a.idx], q = Q[qid];
    a.visited[qid] = true;
    $("#qCounter").textContent = `Question ${a.idx + 1} of ${a.qids.length}`;
    $("#qTags").innerHTML = `<span class="badge topic-b">${TNAME[q.topic]}</span><span class="badge ${q.difficulty}">${q.difficulty}</span>`;
    $("#timer").textContent = fmt(a.elapsed);
    const given = a.answers[qid];
    let body = "";
    if (q.segments) {
      body += `<p class="qstem">${esc(q.stem)}</p><div class="segments">${q.segments.map((s, i) => `<sup>(${"ABCD"[i]})</sup><span>${esc(s)}</span>`).join(" ")}</div>`;
    } else if (q.sentences) {
      body += `<p class="qstem">${esc(q.stem)}</p><ol class="sentences">${q.sentences.map((s, i) => `<li><b>${i + 1}.</b><span>${esc(s)}</span></li>`).join("")}</ol>`;
    } else {
      body += `<p class="qstem ${q.topic === "rc" ? "" : "serif"}">${esc(q.stem)}</p>`;
    }
    if (q.type === "mcq") {
      body += `<div class="options">${q.options.map(o => `<button class="opt ${given === o.k ? "sel" : ""}" data-k="${o.k}"><span class="k">${o.k}</span><span>${esc(o.t)}</span></button>`).join("")}</div>`;
    } else {
      const n = q.sentences.length;
      body += `<div class="tita"><input id="titaIn" inputmode="numeric" autocomplete="off" maxlength="${q.topic === "pj" ? n : 1}" value="${esc(given || "")}" placeholder="${q.topic === "pj" ? "e.g. " + "2413".slice(0, n) + (n > 4 ? "5" : "") : "e.g. 3"}">
        <div class="keypad">${Array.from({ length: n }, (_, i) => `<button data-d="${i + 1}">${i + 1}</button>`).join("")}<button data-d="back" title="Backspace">⌫</button><button data-d="clr">Clear</button></div></div>
        <p class="tita-note">TITA: type your answer — no negative marking for a wrong answer.</p>`;
    }
    const nav = `<div class="qnav"><div class="grp"><button class="btn" id="prevBtn" ${a.idx === 0 ? "disabled" : ""}>← Previous</button><button class="btn ghost" id="clearBtn">Clear response</button></div>
      <div class="grp"><button class="btn ghost" id="markBtn">${a.marked[qid] ? "★ Unmark" : "☆ Mark for review"}</button><button class="btn primary" id="nextBtn">${a.idx === a.qids.length - 1 ? "Finish ✓" : "Save & next →"}</button></div></div>`;
    const card = `<div class="qcard">${body}${nav}</div>`;
    if (q.passage) {
      const P = DATA.passages[q.passage];
      const sameP = a.qids.filter(id => Q[id].passage === q.passage);
      $("#quizMain").innerHTML = `<div class="q-split"><article class="passage" id="passageBox"><h3>${esc(P.title)}</h3><p class="muted small">Passage · questions ${sameP.map(id => a.qids.indexOf(id) + 1).join(", ")}</p>${P.paras.map(x => `<p>${esc(x)}</p>`).join("")}</article>${card}</div>`;
      if (a._lastPassage === q.passage && a._pscroll != null) $("#passageBox").scrollTop = a._pscroll;
      $("#passageBox").onscroll = e => { a._pscroll = e.target.scrollTop; };
      a._lastPassage = q.passage;
    } else {
      $("#quizMain").innerHTML = card; a._lastPassage = null; a._pscroll = 0;
    }
    // wire
    $$(".opt").forEach(b => b.onclick = () => { a.answers[qid] = a.answers[qid] === b.dataset.k ? undefined : b.dataset.k; save(); $$(".opt").forEach(x => x.classList.toggle("sel", x.dataset.k === a.answers[qid])); renderPalette(); });
    const ti = $("#titaIn");
    if (ti) {
      const setT = v => { ti.value = v; a.answers[qid] = normTita(v) || undefined; save(); renderPalette(); };
      ti.oninput = () => setT(normTita(ti.value).slice(0, +ti.maxLength));
      $$(".keypad button").forEach(b => b.onclick = () => {
        const d = b.dataset.d;
        if (d === "back") setT(ti.value.slice(0, -1)); else if (d === "clr") setT("");
        else if (ti.value.length < +ti.maxLength && (q.topic !== "pj" || !ti.value.includes(d))) setT(ti.value + d);
      });
    }
    $("#prevBtn").onclick = () => go(a.idx - 1);
    $("#nextBtn").onclick = () => a.idx === a.qids.length - 1 ? submitPrompt() : go(a.idx + 1);
    $("#clearBtn").onclick = () => { delete a.answers[qid]; save(); renderQuestion(); };
    $("#markBtn").onclick = () => { a.marked[qid] = !a.marked[qid]; save(); if (a.marked[qid] && a.idx < a.qids.length - 1) go(a.idx + 1); else renderQuestion(); };
    renderPalette();
  }
  function go(i) {
    const a = S.active; if (i < 0 || i >= a.qids.length) return;
    a.idx = i; save(); renderQuestion();
    if (!Q[a.qids[i]].passage) window.scrollTo({ top: 0, behavior: "smooth" });
    $("#palette").classList.remove("open");
  }
  function renderPalette() {
    const a = S.active;
    $("#paletteGrid").innerHTML = a.qids.map((id, i) => {
      const cls = a.marked[id] ? "mark" : isAnswered(a.answers[id]) ? "ans" : a.visited[id] ? "vis" : "";
      return `<button class="${cls} ${i === a.idx ? "cur" : ""}" data-i="${i}" title="${TNAME[Q[id].topic]}">${i + 1}</button>`;
    }).join("");
    $$("#paletteGrid button").forEach(b => b.onclick = () => go(+b.dataset.i));
  }

  $("#pauseBtn").onclick = () => setPaused(true);
  $("#resumeBtn").onclick = () => setPaused(false);
  const saveExit = () => { stopClock(); paused = false; save(); location.hash = "home"; };
  $("#saveExitBtn").onclick = saveExit;
  $("#pauseSaveExit").onclick = saveExit;
  $("#submitBtn").onclick = () => submitPrompt();
  $("#paletteToggle").onclick = () => $("#palette").classList.toggle("open");

  function submitPrompt() {
    const a = S.active, ans = a.qids.filter(id => isAnswered(a.answers[id])).length, mk = a.qids.filter(id => a.marked[id]).length;
    confirmBox("Submit this set?", `You've answered ${ans} of ${a.qids.length}${mk ? ` · ${mk} marked for review` : ""}. Answers and explanations are shown after you submit.`, "Submit", finish);
  }

  function finish() {
    const a = S.active; stopClock();
    const results = a.qids.map(id => {
      const q = Q[id], given = a.answers[id], result = grade(q, given);
      S.seen[id] = (S.seen[id] || 0) + 1;
      return { id, topic: q.topic, difficulty: q.difficulty, given: isAnswered(given) ? given : null, result, time: a.time[id] || 0, marks: marks(q, result), marked: !!a.marked[id] };
    });
    const rec = { id: a.id, title: a.title, mode: a.mode, topics: a.topics, created: a.created, finishedAt: Date.now(), elapsed: a.elapsed, results };
    S.history.unshift(rec); S.active = null; save();
    // Render directly rather than relying on the hashchange event, then sync the URL.
    history.replaceState(null, "", "#report/" + rec.id);
    renderReport(rec.id);
  }

  // ---------- report ----------
  function summarise(results) {
    const s = { n: results.length, c: 0, w: 0, sk: 0, score: 0, time: 0 };
    for (const r of results) { if (r.result === "correct") s.c++; else if (r.result === "wrong") s.w++; else s.sk++; s.score += r.marks; s.time += r.time; }
    s.att = s.c + s.w; s.acc = pct(s.c, s.att); s.max = s.n * 3;
    return s;
  }
  function groupRows(results, key, labels) {
    const groups = {};
    for (const r of results) (groups[r[key]] = groups[r[key]] || []).push(r);
    return labels.filter(([k]) => groups[k]).map(([k, name]) => {
      const s = summarise(groups[k]);
      return `<tr><td>${name}</td><td>${s.n}</td><td>${s.att}</td><td style="color:var(--good)">${s.c}</td><td style="color:var(--bad)">${s.w}</td><td>${s.sk}</td><td><b>${s.att ? s.acc + "%" : "–"}</b></td><td>${s.score}</td><td>${fmtShort(s.time / s.n)}</td></tr>`;
    }).join("");
  }
  const TH = "<tr><th></th><th>Qs</th><th>Attempted</th><th>Correct</th><th>Wrong</th><th>Skipped</th><th>Accuracy</th><th>Score</th><th>Avg time</th></tr>";

  function insights(rec) {
    const out = [], R = rec.results, s = summarise(R);
    const byT = {}; for (const r of R) (byT[r.topic] = byT[r.topic] || []).push(r);
    const tSum = Object.entries(byT).map(([t, rs]) => [t, summarise(rs)]).filter(([, x]) => x.att >= 2);
    if (tSum.length > 1) {
      tSum.sort((x, y) => x[1].acc - y[1].acc);
      const [wt, ws] = tSum[0], [bt, bs] = tSum[tSum.length - 1];
      if (ws.acc < bs.acc) out.push(["warn", `Weakest area this set: <b>${TNAME[wt]}</b> (${ws.acc}% accuracy). Strongest: <b>${TNAME[bt]}</b> (${bs.acc}%).`]);
    }
    const rcR = R.filter(r => r.topic === "rc");
    if (rcR.length) {
      const avg = rcR.reduce((x, r) => x + r.time, 0) / rcR.length;
      out.push([avg > 150000 ? "warn" : "", `RC pace: ${fmtShort(avg)} per question (target ≈ 1m 30s per question including reading — about 7–8 min for a 5-question passage).`]);
    }
    const nonRC = R.filter(r => r.topic !== "rc");
    if (nonRC.length) {
      const avg = nonRC.reduce((x, r) => x + r.time, 0) / nonRC.length;
      out.push([avg > 120000 ? "warn" : "", `Verbal-ability pace: ${fmtShort(avg)} per question (aim for under 1m 30s).`]);
    }
    const mcqW = R.filter(r => r.result === "wrong" && Q[r.id].type === "mcq").length;
    if (mcqW >= 3 && s.acc < 60) out.push(["warn", `${mcqW} wrong MCQs cost you ${mcqW} marks in negative marking. On CAT, skip MCQs you can't narrow to two options.`]);
    const titaSk = R.filter(r => r.result === "skip" && Q[r.id].type === "tita").length;
    if (titaSk) out.push(["warn", `You skipped ${titaSk} TITA question${titaSk > 1 ? "s" : ""}. TITA has no negative marking — always enter an answer.`]);
    const byD = {}; for (const r of R) (byD[r.difficulty] = byD[r.difficulty] || []).push(r);
    if (byD.hard && summarise(byD.hard).att >= 2 && summarise(byD.hard).acc >= 60) out.push(["good", `Solid on hard questions: ${summarise(byD.hard).acc}% accuracy.`]);
    if (byD.easy && summarise(byD.easy).w) out.push(["warn", `${summarise(byD.easy).w} easy question${summarise(byD.easy).w > 1 ? "s" : ""} wrong — these are usually reading slips; slow down on the stem.`]);
    if (s.att && s.acc >= 80) out.push(["good", `Excellent accuracy (${s.acc}%). Try a harder set next time.`]);
    const slow = R.slice().sort((x, y) => y.time - x.time)[0];
    if (slow && slow.time > 0) out.push(["", `Longest time spent: Q${R.indexOf(slow) + 1} (${TNAME[slow.topic]}, ${fmtShort(slow.time)}) — ${slow.result === "correct" ? "you got it right" : slow.result === "wrong" ? "and it was wrong" : "and you skipped it"}.`]);
    return out;
  }

  function optText(q, k) { const o = q.options && q.options.find(x => x.k === k); return o ? o.t : ""; }

  function renderReport(id) {
    const rec = S.history.find(h => h.id === id);
    show("report");
    const el = $("#view-report");
    if (!rec) { el.innerHTML = `<div class="card empty">Report not found. <a href="#history">See all reports</a></div>`; return; }
    const s = summarise(rec.results);
    const tLabels = TOPICS, dLabels = [["easy", "Easy"], ["medium", "Medium"], ["hard", "Hard"]];
    let lastPassage = null;
    const reviews = rec.results.map((r, i) => {
      const q = Q[r.id]; if (!q) return "";
      let pass = "";
      if (q.passage && q.passage !== lastPassage) {
        const P = DATA.passages[q.passage];
        pass = `<details class="review-passage"><summary>Show passage: ${esc(P.title)}</summary><div>${P.paras.map(x => `<p>${esc(x)}</p>`).join("")}</div></details>`;
      }
      lastPassage = q.passage || null;
      let body = "";
      if (q.segments) body = `<p class="qstem">${esc(q.stem)}</p><div class="segments">${q.segments.map((x, j) => `<sup>(${"ABCD"[j]})</sup><span>${esc(x)}</span>`).join(" ")}</div>`;
      else if (q.sentences) body = `<p class="qstem">${esc(q.stem)}</p><ol class="sentences">${q.sentences.map((x, j) => `<li><b>${j + 1}.</b><span>${esc(x)}</span></li>`).join("")}</ol>`;
      else body = `<p class="qstem">${esc(q.stem)}</p>`;
      if (q.type === "mcq") {
        body += `<div class="options">${q.options.map(o => `<div class="opt ${o.k === q.answer ? "correct" : o.k === r.given ? "wrong" : ""}"><span class="k">${o.k}</span><span>${esc(o.t)}${o.k === r.given ? ' <span class="muted small">(your answer)</span>' : ""}</span></div>`).join("")}</div>`;
      } else {
        body += `<div class="ans-line"><span>Your answer: <span class="${r.result === "correct" ? "ok" : "no"}">${r.given ? esc(r.given) : "—"}</span></span><span>Correct: <span class="ok">${q.answer}</span></span></div>`;
      }
      const v = r.result === "correct" ? `<span class="verdict c">✓ Correct +3</span>` : r.result === "wrong" ? `<span class="verdict w">✗ Wrong ${r.marks}</span>` : `<span class="verdict s">— Skipped 0</span>`;
      return `${pass}<div class="review r-${r.result === "skip" ? "skip" : r.result}" data-res="${r.result}">
        <div class="review-head"><div class="tags"><b>Q${i + 1}</b><span class="badge topic-b">${TNAME[q.topic]}</span><span class="badge ${q.difficulty}">${q.difficulty}</span>${q.cluster ? `<span class="muted small">${esc(q.cluster)}</span>` : ""}${r.marked ? '<span class="badge new">marked</span>' : ""}</div>
        <div class="tags">${v}<span class="muted">⏱ ${fmtShort(r.time)}</span></div></div>
        ${body}<div class="expl"><b>Answer: ${q.type === "mcq" ? `(${q.answer}) ${esc(optText(q, q.answer))}` : q.answer}</b><br>${esc(q.explanation)}</div></div>`;
    }).join("");

    const wrongIds = rec.results.filter(r => r.result !== "correct").map(r => r.id);
    el.innerHTML = `
      <div class="report-head"><div><h1>Report · ${esc(rec.title)}</h1><p class="muted">${new Date(rec.finishedAt).toLocaleString()} · ${rec.topics.map(t => TNAME[t]).join(", ")}</p></div>
        <div class="report-actions">${wrongIds.length ? `<button class="btn" id="retryWrong">Retry ${wrongIds.length} wrong/skipped</button>` : ""}<a class="btn primary" href="#home">New set</a></div></div>
      <div class="kpis">
        <div class="kpi"><div class="v">${s.score}<span class="muted" style="font-size:1rem"> / ${s.max}</span></div><div class="l">CAT score</div></div>
        <div class="kpi ${s.acc >= 70 ? "good" : s.att && s.acc < 45 ? "bad" : ""}"><div class="v">${s.att ? s.acc + "%" : "–"}</div><div class="l">Accuracy</div></div>
        <div class="kpi good"><div class="v">${s.c}</div><div class="l">Correct</div></div>
        <div class="kpi bad"><div class="v">${s.w}</div><div class="l">Wrong</div></div>
        <div class="kpi"><div class="v">${s.sk}</div><div class="l">Skipped</div></div>
        <div class="kpi"><div class="v">${fmt(rec.elapsed)}</div><div class="l">Total time · ${fmtShort(rec.elapsed / s.n)}/Q</div></div>
      </div>
      <div class="card"><h2>Insights</h2><ul class="insights">${insights(rec).map(([c, t]) => `<li class="${c}">${t}</li>`).join("") || "<li>Nice work.</li>"}</ul></div>
      <div class="grid-2">
        <div class="card"><h2>By topic</h2><div class="tbl-wrap"><table class="tbl">${TH}${groupRows(rec.results, "topic", tLabels)}</table></div></div>
        <div class="card"><h2>By difficulty</h2><div class="tbl-wrap"><table class="tbl">${TH}${groupRows(rec.results, "difficulty", dLabels)}</table></div></div>
      </div>
      <div class="card"><h2>Answers &amp; explanations</h2>
        <div class="filters"><button class="active" data-f="all">All (${s.n})</button><button data-f="wrong">Wrong (${s.w})</button><button data-f="skip">Skipped (${s.sk})</button><button data-f="correct">Correct (${s.c})</button></div>
        <div id="reviewList">${reviews}</div></div>
      <p class="muted small">Scoring follows CAT: +3 correct; −1 wrong MCQ; 0 wrong TITA (Para Jumbles, Odd Sentence Out); 0 skipped.</p>`;
    $$(".filters button", el).forEach(b => b.onclick = () => {
      $$(".filters button", el).forEach(x => x.classList.toggle("active", x === b));
      $$("#reviewList .review", el).forEach(rv => rv.classList.toggle("hidden", b.dataset.f !== "all" && rv.dataset.res !== b.dataset.f));
      $$("#reviewList details", el).forEach(d => d.classList.toggle("hidden", b.dataset.f !== "all"));
    });
    const rw = $("#retryWrong");
    if (rw) rw.onclick = () => {
      const go2 = () => {
        // keep RC grouped by passage
        const ids = wrongIds.slice().sort((x, y) => (Q[x].passage ? 0 : 1) - (Q[y].passage ? 0 : 1) || (Q[x].passage || "").localeCompare(Q[y].passage || ""));
        S.active = { id: "s" + Date.now().toString(36), created: Date.now(), mode: "retry", title: `Retry · ${rec.title}`, topics: [...new Set(ids.map(x => Q[x].topic))],
          timer: prefs().timer, qids: ids, idx: 0, answers: {}, marked: {}, visited: {}, time: {}, elapsed: 0 };
        save(); location.hash = "quiz"; openQuiz();
      };
      S.active ? confirmBox("Replace your unfinished set?", "Starting a retry discards the set in progress.", "Start retry", () => { S.active = null; go2(); }) : go2();
    };
  }

  // ---------- history ----------
  function renderHistory() {
    show("history");
    const el = $("#view-history");
    if (!S.history.length) { el.innerHTML = `<h1>Reports</h1><div class="card empty">No completed sets yet. <a href="#home">Start practising →</a></div>`; return; }
    const all = S.history.flatMap(h => h.results), s = summarise(all);
    const days = {};
    for (const h of S.history) { const d = dayKey(h.finishedAt); (days[d] = days[d] || []).push(...h.results); }
    const dayRows = Object.entries(days).slice(0, 14).map(([d, rs]) => { const x = summarise(rs);
      return `<tr><td>${new Date(d + "T12:00").toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}</td><td>${x.n}</td><td>${x.att}</td><td style="color:var(--good)">${x.c}</td><td style="color:var(--bad)">${x.w}</td><td>${x.sk}</td><td><b>${x.att ? x.acc + "%" : "–"}</b></td><td>${x.score}</td><td>${fmtShort(x.time / x.n)}</td></tr>`; }).join("");
    el.innerHTML = `
      <div class="report-head"><div><h1>Reports</h1><p class="muted">${S.history.length} sets · ${s.n} questions · ${fmt(s.time)} practised</p></div>
        <div class="report-actions"><button class="btn ghost" id="exportBtn">Export data</button><button class="btn ghost" id="resetBtn">Reset progress</button></div></div>
      <div class="kpis">
        <div class="kpi"><div class="v">${s.att ? s.acc + "%" : "–"}</div><div class="l">Overall accuracy</div></div>
        <div class="kpi good"><div class="v">${s.c}</div><div class="l">Correct</div></div>
        <div class="kpi bad"><div class="v">${s.w}</div><div class="l">Wrong</div></div>
        <div class="kpi"><div class="v">${Object.keys(S.seen).length}<span class="muted" style="font-size:1rem"> / ${DATA.questions.length}</span></div><div class="l">Questions seen</div></div>
      </div>
      <div class="grid-2">
        <div class="card"><h2>All-time by topic</h2><div class="tbl-wrap"><table class="tbl">${TH}${groupRows(all, "topic", TOPICS)}</table></div></div>
        <div class="card"><h2>All-time by difficulty</h2><div class="tbl-wrap"><table class="tbl">${TH}${groupRows(all, "difficulty", [["easy", "Easy"], ["medium", "Medium"], ["hard", "Hard"]])}</table></div></div>
      </div>
      <div class="card"><h2>Daily log</h2><div class="tbl-wrap"><table class="tbl">${TH.replace("<th></th>", "<th>Day</th>")}${dayRows}</table></div></div>
      <div class="card"><h2>Sets</h2>${S.history.map(h => { const x = summarise(h.results);
        return `<a class="hist-item" href="#report/${h.id}"><div><div class="t">${esc(h.title)}</div><div class="muted small">${new Date(h.finishedAt).toLocaleString()} · ${h.topics.map(t => TNAME[t]).join(", ")} · ${fmt(h.elapsed)}</div></div>
          <span class="score-pill">${x.score}/${x.max} · ${x.att ? x.acc + "%" : "–"}</span></a>`; }).join("")}</div>`;
    $("#resetBtn").onclick = () => confirmBox("Reset all progress?", "This permanently clears every report, your seen-question history and any unfinished set on this device.", "Reset", () => { const t = S.prefs.theme; S = blank(); S.prefs.theme = t; save(); renderHistory(); });
    $("#exportBtn").onclick = () => {
      const blob = new Blob([JSON.stringify(S, null, 1)], { type: "application/json" });
      const u = URL.createObjectURL(blob), l = document.createElement("a");
      l.href = u; l.download = `varc-progress-${dayKey(Date.now())}.json`; l.click(); setTimeout(() => URL.revokeObjectURL(u), 1000);
    };
  }

  // ---------- modal ----------
  function confirmBox(title, text, ok, fn) {
    $("#modalCard").innerHTML = `<h2>${esc(title)}</h2><p class="muted">${esc(text)}</p><div class="row"><button class="btn" id="mNo">Cancel</button><button class="btn primary" id="mYes">${esc(ok)}</button></div>`;
    $("#modal").classList.remove("hidden");
    $("#mNo").onclick = closeModal;
    $("#mYes").onclick = () => {
      closeModal();
      try { fn(); } catch (err) { console.error(err); alertBox("Something went wrong: " + err.message + ". Your answers are saved — reload the page and try again."); }
    };
    $("#mYes").focus();
  }
  function closeModal() { $("#modal").classList.add("hidden"); }
  $("#modal").addEventListener("click", e => { if (e.target.id === "modal") closeModal(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });
  function alertBox(text) {
    $("#modalCard").innerHTML = `<p>${esc(text)}</p><div class="row"><button class="btn primary" id="mNo">OK</button></div>`;
    $("#modal").classList.remove("hidden"); $("#mNo").onclick = () => $("#modal").classList.add("hidden");
  }

  // keyboard: A–E select, ←/→ navigate, P pause
  document.addEventListener("keydown", e => {
    if ($("#view-quiz").classList.contains("hidden") || !S.active || e.target.tagName === "INPUT" || !$("#modal").classList.contains("hidden")) return;
    if (e.key.toLowerCase() === "p") return setPaused(!paused);
    if (paused) return;
    const k = e.key.toUpperCase();
    if ("ABCDE".includes(k) && k.length === 1) { const b = $(`.opt[data-k="${k}"]`); if (b) b.click(); }
    else if (e.key === "ArrowRight" && S.active.idx < S.active.qids.length - 1) go(S.active.idx + 1);
    else if (e.key === "ArrowLeft") go(S.active.idx - 1);
  });
  window.addEventListener("beforeunload", save);

  route();
})();
