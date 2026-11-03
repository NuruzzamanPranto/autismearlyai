// AutismEarlyAI - transparent Q-CHAT-10 screener + research results.
// Answers are sent only to /api/score to compute the total; nothing is stored.

const app = document.getElementById("app");
const LETTERS = ["A", "B", "C", "D", "E"];

const state = {
  page: "screen",
  instrument: null,
  answers: Array(10).fill(null),
  result: null,
  research: null,
  error: "",
};

function esc(t) {
  const d = document.createElement("div");
  d.textContent = t ?? "";
  return d.innerHTML;
}

async function getJSON(url, opts) {
  const r = await fetch(url, opts);
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.detail || `Request failed (${r.status})`);
  return data;
}

function shell(inner) {
  const tab = (id, label) =>
    `<button data-tab="${id}" class="${state.page === id || (id === "screen" && state.page === "result") ? "active" : ""}">${label}</button>`;
  return `
    <header class="site">
      <div class="brand">AutismEarlyAI<small>Transparent toddler screening questionnaire &middot; research project</small></div>
      <nav class="tabs">
        ${tab("screen", "Questionnaire")}
        ${tab("research", "Research")}
        ${tab("about", "About")}
      </nav>
    </header>
    <div class="notice">
      <b>Screening, not diagnosis.</b> This site scores a published 10-question toddler checklist (Q-CHAT-10) with its
      published rule. It contains no AI model and is not a medical device. If you are concerned about a child's
      development, talk to a pediatrician.
    </div>
    ${inner}
    <footer>
      Q-CHAT-10: Allison, Auyeung &amp; Baron-Cohen (2012), J Am Acad Child Adolesc Psychiatry 51(2):202&ndash;212.
      Q-CHAT items &copy; Autism Research Centre, University of Cambridge, CC BY-NC 4.0 (non-commercial use).
      Answers are not stored.
    </footer>`;
}

function bindTabs() {
  document.querySelectorAll("[data-tab]").forEach((b) =>
    b.addEventListener("click", () => {
      state.page = b.dataset.tab === "screen" && state.result ? "result" : b.dataset.tab;
      render();
    })
  );
}

function renderScreen() {
  const inst = state.instrument;
  if (!inst) {
    app.innerHTML = shell(`<div class="card">${state.error ? `<p class="err">${esc(state.error)}</p>` : "Loading questionnaire&hellip;"}</div>`);
    bindTabs();
    return;
  }
  const qs = inst.items
    .map((it, qi) => {
      const opts = it.options
        .map(
          (o, oi) => `
        <label><input type="radio" name="q${qi}" value="${oi}" ${state.answers[qi] === oi ? "checked" : ""}/>
        ${LETTERS[oi]}. ${esc(o)}</label>`
        )
        .join("");
      return `<div class="q"><div class="q-text">${it.item}. ${esc(it.question)}</div><div class="opts">${opts}</div></div>`;
    })
    .join("");
  const done = state.answers.every((a) => a !== null);
  app.innerHTML = shell(`
    <div class="card">
      <h1>Q-CHAT-10 toddler questionnaire</h1>
      <p class="muted">For a parent or carer of a child about 18&ndash;24 months old. Choose the answer that best describes
      your child. It takes about 2 minutes.</p>
      ${qs}
      <div class="row" style="margin-top:12px;">
        <button class="primary" id="scoreBtn" ${done ? "" : "disabled"}>See score</button>
        <span class="muted small" id="progress">${state.answers.filter((a) => a !== null).length} of 10 answered</span>
      </div>
      ${state.error ? `<p class="err" style="margin-top:10px;">${esc(state.error)}</p>` : ""}
    </div>`);
  bindTabs();
  document.querySelectorAll('input[type="radio"]').forEach((el) =>
    el.addEventListener("change", (e) => {
      const qi = Number(e.target.name.slice(1));
      state.answers[qi] = Number(e.target.value);
      document.getElementById("progress").textContent = `${state.answers.filter((a) => a !== null).length} of 10 answered`;
      document.getElementById("scoreBtn").disabled = !state.answers.every((a) => a !== null);
    })
  );
  document.getElementById("scoreBtn").addEventListener("click", submit);
}

async function submit() {
  state.error = "";
  try {
    state.result = await getJSON("/api/score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers: state.answers }),
    });
    state.page = "result";
  } catch (e) {
    state.error = e.message;
  }
  render();
}

function renderResult() {
  const r = state.result;
  const rows = r.breakdown
    .map(
      (b) => `<tr><td>${b.item}</td><td>${esc(b.question)}</td><td>${esc(b.answer)}</td>
        <td class="num ${b.points ? "pt1" : ""}">${b.points}</td></tr>`
    )
    .join("");
  app.innerHTML = shell(`
    <div class="card">
      <h1>Your screening score</h1>
      <div class="score">
        <span class="big">${r.total} / ${r.max}</span>
        <span class="tag ${r.above_cutoff ? "hi" : "lo"}">${esc(r.result)}</span>
      </div>
      <p class="muted">${esc(r.cutoff)}.</p>
      <p><b>Next step:</b> ${esc(r.next_step)}</p>
      <p class="small muted">${esc(r.disclaimer)}</p>
    </div>
    <div class="card">
      <h2>How the score was calculated</h2>
      <p class="muted small">Every point comes from one answer. Items 1&ndash;9 score 1 for options C, D or E; item 10 scores 1 for
      options A, B or C. No model or hidden weighting is involved.</p>
      <table><thead><tr><th>#</th><th>Question</th><th>Answer</th><th class="num">Points</th></tr></thead>
      <tbody>${rows}</tbody></table>
    </div>
    <div class="row">
      <button class="ghost" id="editBtn">Change answers</button>
      <button class="ghost" id="resetBtn">Start over</button>
      <button class="ghost" id="printBtn">Print</button>
    </div>`);
  bindTabs();
  document.getElementById("editBtn").addEventListener("click", () => { state.page = "screen"; state.result = null; render(); });
  document.getElementById("resetBtn").addEventListener("click", () => {
    state.answers = Array(10).fill(null); state.result = null; state.page = "screen"; render();
  });
  document.getElementById("printBtn").addEventListener("click", () => window.print());
}

async function renderResearch() {
  if (!state.research) {
    app.innerHTML = shell(`<div class="card">Loading results&hellip;</div>`);
    bindTabs();
    try { state.research = await getJSON("/api/research"); } catch (e) { state.error = e.message; }
    if (state.page !== "research") return;
  }
  const d = state.research;
  if (!d) {
    app.innerHTML = shell(`<div class="card"><p class="err">${esc(state.error)}</p></div>`);
    bindTabs();
    return;
  }
  const rows = d.results
    .map(
      (m) => `<tr><td>${esc(m.model)}</td>
        <td class="num">${m.auc_mean.toFixed(3)} &plusmn; ${m.auc_sd.toFixed(3)}</td>
        <td class="barcol"><div class="bar"><span style="width:${Math.round(m.auc_mean * 100)}%"></span></div></td>
        <td class="num">${m.balanced_accuracy_mean.toFixed(3)}</td></tr>`
    )
    .join("");
  app.innerHTML = shell(`
    <div class="card">
      <h1>Why this site has no AI model</h1>
      <p>A widely used public dataset (${esc(d.dataset)}; ${d.n_rows.toLocaleString()} toddlers) appears to let machine-learning
      models reach perfect accuracy. The reason is <b>label leakage</b>: its &ldquo;ASD traits&rdquo; label is simply the
      questionnaire total above 3.</p>
      <p>In ${(d.label_equals_score_gt_3 * 100).toFixed(0)}% of rows the label equals that rule. A model given the 10 answers
      re-learns the addition rule and scores perfectly, but it adds nothing over the questionnaire. Without the answers,
      demographic features alone perform close to chance.</p>
    </div>
    <div class="card">
      <h2>Leakage check results</h2>
      <p class="muted small">${esc(d.evaluation)} (${d.n_after_dedup.toLocaleString()} unique rows; ${(d.positive_rate_after_dedup * 100).toFixed(1)}% labelled positive).
      AUC 0.5 = chance, 1.0 = perfect.</p>
      <table><thead><tr><th>Model and features</th><th class="num">AUC (mean &plusmn; SD)</th><th class="barcol"></th><th class="num">Bal. acc.</th></tr></thead>
      <tbody>${rows}</tbody></table>
      <p class="small muted" style="margin-top:10px;">The perfect score reflects leakage, not clinical accuracy. The label is a
      questionnaire cutoff, not a clinical diagnosis, so no model trained on these data can be called clinically validated.
      Reproduce with <code>research/evaluate.py</code> in the public repository.</p>
    </div>
    <div class="card">
      <h2>What this means for screening tools</h2>
      <p>Reported accuracy for AI autism screening should be checked for leakage, duplicate records and labels that are
      defined by the inputs. Until a model is evaluated against clinical diagnoses on independent data, a transparent,
      published questionnaire is the honest tool to offer.</p>
    </div>`);
  bindTabs();
}

function renderAbout() {
  app.innerHTML = shell(`
    <div class="card">
      <h1>About this project</h1>
      <p>AutismEarlyAI is a research project by Md Nuruzzaman Pranto on how early-autism screening tools should be built
      and evaluated: transparent scoring, leakage-controlled testing across datasets, and clearly documented limits.</p>
      <p><b>Correction.</b> An earlier version of this website was a face-image interface demo that displayed simulated,
      randomly generated scores and illustrative heatmaps that did not come from any model. That demo was removed in
      November 2026. The history remains visible in the public repository.</p>
      <p><b>Autism in the U.S.</b> The CDC's 2025 ADDM Network report estimated that about 1 in 31 eight-year-old children
      had been identified with autism in 2022. Early identification helps families reach services sooner; the CDC's
      &ldquo;Learn the Signs. Act Early.&rdquo; program has free developmental milestone resources.</p>
      <p><b>Privacy.</b> Your answers are used only to calculate the score and are not stored.</p>
    </div>`);
  bindTabs();
}

function render() {
  if (state.page === "result" && state.result) return renderResult();
  if (state.page === "research") return renderResearch();
  if (state.page === "about") return renderAbout();
  state.page = "screen";
  return renderScreen();
}

(async function init() {
  render();
  try {
    state.instrument = await getJSON("/api/instrument");
  } catch (e) {
    state.error = e.message;
  }
  if (state.page === "screen") render();
})();
