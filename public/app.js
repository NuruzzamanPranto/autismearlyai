// AutismEarlyAI - independent research project by Md Nuruzzaman Pranto.
// Screener: published Q-CHAT-10 rule (answers sent only to /api/score; nothing stored).
// AI Research: real model results produced by research/evaluate.py, plus a live
// logistic-regression demo that uses the trained model's real weights.

const app = document.getElementById("app");
const LETTERS = ["A", "B", "C", "D", "E"];
const GROUP_LABEL = { answers: "10 questionnaire answers", total: "Precomputed total score", demographics: "Demographics (age, sex, ethnicity, jaundice, family history, respondent)" };

const state = {
  page: "screen",
  instrument: null,
  answers: Array(10).fill(null),
  result: null,
  research: null,
  explorer: { answers: false, total: false, demographics: true },
  demo: Array(10).fill(0),
  error: "",
};

const esc = (t) => { const d = document.createElement("div"); d.textContent = t ?? ""; return d.innerHTML; };

async function getJSON(url, opts) {
  const r = await fetch(url, opts);
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.detail || `Request failed (${r.status})`);
  return data;
}

const TABS = [
  ["screen", "Questionnaire"],
  ["ai", "AI Research"],
  ["methods", "Methods"],
  ["pubs", "Publications"],
  ["roadmap", "Roadmap"],
  ["about", "About"],
];

function shell(inner) {
  const active = state.page === "result" ? "screen" : state.page;
  return `
    <header class="site">
      <div class="brand">AutismEarlyAI<small>Independent research on transparent, leakage-controlled autism screening</small></div>
      <nav class="tabs">${TABS.map(([id, l]) => `<button data-tab="${id}" class="${active === id ? "active" : ""}">${l}</button>`).join("")}</nav>
    </header>
    <div class="notice"><b>Screening, not diagnosis.</b> The questionnaire is scored with its published rule. The AI on this
      site is a research instrument for testing screening claims; it does not screen or diagnose children and is not a
      medical device. If you are concerned about a child's development, talk to a pediatrician.</div>
    ${inner}
    <footer>
      Md Nuruzzaman Pranto &middot; Independent research project &middot;
      <a href="https://scholar.google.com/citations?user=pyZLqF4AAAAJ" target="_blank" rel="noopener">Google Scholar</a> &middot;
      <a href="https://github.com/NuruzzamanPranto/autismearlyai" target="_blank" rel="noopener">Code</a><br/>
      Q-CHAT-10: Allison, Auyeung &amp; Baron-Cohen (2012), J Am Acad Child Adolesc Psychiatry 51(2):202&ndash;212.
      Q-CHAT items &copy; Autism Research Centre, University of Cambridge, CC BY-NC 4.0 (non-commercial use). Answers are not stored.
    </footer>`;
}

function bindTabs() {
  document.querySelectorAll("[data-tab]").forEach((b) =>
    b.addEventListener("click", () => {
      state.page = b.dataset.tab === "screen" && state.result ? "result" : b.dataset.tab;
      render();
      window.scrollTo(0, 0);
    })
  );
}

/* ---------------- Questionnaire ---------------- */

function renderScreen() {
  const inst = state.instrument;
  if (!inst) {
    app.innerHTML = shell(`<div class="card">${state.error ? `<p class="err">${esc(state.error)}</p>` : "Loading questionnaire&hellip;"}</div>`);
    return bindTabs();
  }
  const qs = inst.items.map((it, qi) => `
    <div class="q"><div class="q-text">${it.item}. ${esc(it.question)}</div><div class="opts">
      ${it.options.map((o, oi) => `<label><input type="radio" name="q${qi}" value="${oi}" ${state.answers[qi] === oi ? "checked" : ""}/> ${LETTERS[oi]}. ${esc(o)}</label>`).join("")}
    </div></div>`).join("");
  const n = state.answers.filter((a) => a !== null).length;
  app.innerHTML = shell(`
    <div class="card">
      <h1>Q-CHAT-10 toddler questionnaire</h1>
      <p class="muted">For a parent or carer of a child about 18&ndash;24 months old. Choose the answer that best describes your child. About 2 minutes.</p>
      ${qs}
      <div class="row" style="margin-top:12px;">
        <button class="primary" id="scoreBtn" ${n === 10 ? "" : "disabled"}>See score</button>
        <span class="muted small" id="progress">${n} of 10 answered</span>
      </div>
      ${state.error ? `<p class="err" style="margin-top:10px;">${esc(state.error)}</p>` : ""}
    </div>`);
  bindTabs();
  document.querySelectorAll('input[type="radio"]').forEach((el) =>
    el.addEventListener("change", (e) => {
      state.answers[Number(e.target.name.slice(1))] = Number(e.target.value);
      const k = state.answers.filter((a) => a !== null).length;
      document.getElementById("progress").textContent = `${k} of 10 answered`;
      document.getElementById("scoreBtn").disabled = k !== 10;
    })
  );
  document.getElementById("scoreBtn").addEventListener("click", submit);
}

async function submit() {
  state.error = "";
  try {
    state.result = await getJSON("/api/score", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ answers: state.answers }) });
    state.page = "result";
  } catch (e) { state.error = e.message; }
  render();
}

function renderResult() {
  const r = state.result;
  app.innerHTML = shell(`
    <div class="card">
      <h1>Your screening score</h1>
      <div class="score"><span class="big">${r.total} / ${r.max}</span><span class="tag ${r.above_cutoff ? "hi" : "lo"}">${esc(r.result)}</span></div>
      <p class="muted">${esc(r.cutoff)}.</p>
      <p><b>Next step:</b> ${esc(r.next_step)}</p>
      <p class="small muted">${esc(r.disclaimer)}</p>
    </div>
    <div class="card">
      <h2>How the score was calculated</h2>
      <p class="muted small">Every point comes from one answer. Items 1&ndash;9 score 1 for options C, D or E; item 10 scores 1 for options A, B or C. No hidden weighting.</p>
      <table><thead><tr><th>#</th><th>Question</th><th>Answer</th><th class="num">Points</th></tr></thead><tbody>
      ${r.breakdown.map((b) => `<tr><td>${b.item}</td><td>${esc(b.question)}</td><td>${esc(b.answer)}</td><td class="num ${b.points ? "pt1" : ""}">${b.points}</td></tr>`).join("")}
      </tbody></table>
    </div>
    <div class="row">
      <button class="ghost" id="editBtn">Change answers</button>
      <button class="ghost" id="resetBtn">Start over</button>
      <button class="ghost" id="printBtn">Print</button>
    </div>`);
  bindTabs();
  document.getElementById("editBtn").onclick = () => { state.page = "screen"; state.result = null; render(); };
  document.getElementById("resetBtn").onclick = () => { state.answers = Array(10).fill(null); state.result = null; state.page = "screen"; render(); };
  document.getElementById("printBtn").onclick = () => window.print();
}

/* ---------------- AI Research ---------------- */

async function ensureResearch() {
  if (state.research) return true;
  app.innerHTML = shell(`<div class="card">Loading research results&hellip;</div>`);
  bindTabs();
  try { state.research = await getJSON("/api/research"); return true; }
  catch (e) { state.error = e.message; app.innerHTML = shell(`<div class="card"><p class="err">${esc(e.message)}</p></div>`); bindTabs(); return false; }
}

function explorerRow(groups, model = "Logistic regression") {
  const key = [...groups].sort().join("|");
  return state.research.explorer.find((e) => e.model === model && [...e.groups].sort().join("|") === key);
}

function aucBar(auc) {
  // AUC axis from 0.5 (chance) to 1.0 (perfect)
  const pct = Math.max(0, Math.min(1, (auc - 0.5) / 0.5)) * 100;
  return `<div class="aucbar" title="AUC ${auc.toFixed(3)}"><span style="width:${pct}%"></span></div>
          <div class="aucaxis"><span>0.5 chance</span><span>1.0 perfect</span></div>`;
}

function explorerVerdict(groups, row) {
  if (!row) return "";
  const leaks = groups.includes("answers") || groups.includes("total");
  if (leaks) return `<p class="verdict leak"><b>Leakage.</b> The label in this dataset is defined as &ldquo;total above 3&rdquo;, so any model that sees the answers or the total can reconstruct the label exactly. The near-perfect score measures that rule, not clinical accuracy.</p>`;
  return `<p class="verdict fair"><b>Close to chance.</b> Without the questionnaire, demographics carry almost no signal for this label (balanced accuracy ${row.balanced_accuracy_mean.toFixed(3)}, where 0.5 is guessing).</p>`;
}

function weightsChart(lm) {
  const max = Math.ceil(Math.max(...lm.items.map((i) => i.weight)) * 2) / 2;
  const pct = (v) => (v / max) * 100;
  const rows = lm.items.map((it) => `
    <div class="wrow" tabindex="0" title="Item ${it.item}: ${esc(it.name)} \u2014 weight ${it.weight.toFixed(2)}">
      <div class="wname">${it.item}. ${esc(it.name)}</div>
      <div class="wtrack"><span class="wfill" style="width:${pct(it.weight)}%"></span><span class="wmean" style="left:${pct(lm.mean_weight)}%"></span></div>
      <div class="wval">${it.weight.toFixed(2)}</div>
    </div>`).join("");
  return `<div class="wchart" role="img" aria-label="Model weights for the 10 questionnaire items, all close to the mean of ${lm.mean_weight.toFixed(2)}">
    <div class="wlegend"><span class="wmean-key"></span> dashed line = mean weight ${lm.mean_weight.toFixed(2)} &middot; axis 0 to ${max.toFixed(1)}</div>
    ${rows}
  </div>`;
}

function liveDemo(lm) {
  const z = lm.intercept + lm.items.reduce((s, it, i) => s + it.weight * state.demo[i], 0);
  const p = 1 / (1 + Math.exp(-z));
  const total = state.demo.reduce((a, b) => a + b, 0);
  const ruleYes = total > 3, aiYes = p >= 0.5;
  return `
    <div class="demo-grid">
      ${lm.items.map((it, i) => `<label class="tog"><input type="checkbox" data-demo="${i}" ${state.demo[i] ? "checked" : ""}/> ${it.item}. ${esc(it.name)}</label>`).join("")}
    </div>
    <div class="demo-out">
      <div><div class="muted small">Published rule</div><div class="demo-num">${total} / 10</div><div class="tag ${ruleYes ? "hi" : "lo"}">${ruleYes ? "Above cutoff" : "Below cutoff"}</div></div>
      <div><div class="muted small">Trained AI model</div><div class="demo-num">${p < 0.001 ? "&lt;0.1" : p > 0.999 ? "&gt;99.9" : (p * 100).toFixed(1)}%</div><div class="tag ${aiYes ? "hi" : "lo"}">${aiYes ? "Predicts label: Yes" : "Predicts label: No"}</div></div>
      <div class="demo-agree">${ruleYes === aiYes ? "The AI agrees with the rule." : "The AI disagrees with the rule."}</div>
    </div>`;
}

async function renderAI() {
  if (!(await ensureResearch())) return;
  if (state.page !== "ai") return;
  const d = state.research, a = d.audit, lm = d.learned_model;
  const groups = Object.keys(state.explorer).filter((g) => state.explorer[g]);
  const row = groups.length ? explorerRow(groups) : null;
  const table = d.explorer.map((e) => `<tr><td>${e.groups.map((g) => esc(GROUP_LABEL[g].split(" (")[0])).join(" + ")}</td><td>${esc(e.model)}</td>
    <td class="num">${e.auc_mean.toFixed(3)} &plusmn; ${e.auc_sd.toFixed(3)}</td><td class="num">${e.balanced_accuracy_mean.toFixed(3)}</td></tr>`).join("");
  app.innerHTML = shell(`
    <div class="card">
      <h1>Does AI autism screening really work? Testing a public benchmark</h1>
      <p>Many studies report near-perfect accuracy for machine learning on the public <i>${esc(d.dataset)}</i> data
      (${a.n_rows.toLocaleString()} toddlers). This page tests why. In <b>${(a.label_equals_total_gt_3 * 100).toFixed(0)}%</b> of rows the
      &ldquo;ASD traits&rdquo; label equals the questionnaire total above 3, so the label is built from the inputs.
      This is <b>label leakage</b>.</p>
      <p class="muted small">All numbers below come from real model runs: ${esc(d.evaluation)} (${a.n_after_dedup.toLocaleString()} unique rows,
      ${(a.positive_rate_after_dedup * 100).toFixed(1)}% labelled positive). Code: <code>research/evaluate.py</code>.</p>
    </div>

    <div class="card">
      <h2>1. Leakage Explorer &mdash; choose what the AI is allowed to see</h2>
      <div class="checks">
        ${Object.keys(GROUP_LABEL).map((g) => `<label><input type="checkbox" data-grp="${g}" ${state.explorer[g] ? "checked" : ""}/> ${esc(GROUP_LABEL[g])}</label>`).join("")}
      </div>
      ${row ? `
        <div class="explorer-out">
          <div class="score"><span class="big">${row.auc_mean.toFixed(3)}</span><span class="muted">AUC (&plusmn; ${row.auc_sd.toFixed(3)}) &middot; balanced accuracy ${row.balanced_accuracy_mean.toFixed(3)}</span></div>
          ${aucBar(row.auc_mean)}
          ${explorerVerdict(groups, row)}
        </div>` : `<p class="muted">Select at least one feature group.</p>`}
      <details style="margin-top:10px;"><summary>All results (table)</summary>
        <table><thead><tr><th>Features</th><th>Model</th><th class="num">AUC</th><th class="num">Bal. acc.</th></tr></thead><tbody>${table}</tbody></table>
      </details>
    </div>

    <div class="card">
      <h2>2. What the AI learned (explainable AI)</h2>
      <p>A logistic regression trained on the 10 answers gives every question almost the same weight
      (all within <b>${lm.weight_variation_pct}%</b> of the mean) and sets its decision point at <b>${lm.threshold_in_points.toFixed(2)} points</b>
      &mdash; between 3 and 4. In other words, the AI rediscovered the questionnaire's own rule: add up the answers and flag totals above 3.</p>
      ${weightsChart(lm)}
      <p class="muted small">Weights from the model fitted on ${lm.fitted_on_rows.toLocaleString()} unique rows. Bar length = weight (0 to the axis maximum).</p>
    </div>

    <div class="card">
      <h2>3. Run the trained AI live &mdash; and compare it with the rule</h2>
      <p class="muted small">Tick the items where a child's answer would score a point. The model below runs in your browser with the real trained
      weights. Research demonstration only &mdash; it predicts this dataset's label, not autism.</p>
      <div id="demo">${liveDemo(lm)}</div>
    </div>

    <div class="card">
      <h2>What this means</h2>
      <p>High accuracy on this benchmark shows that a model can copy a scoring rule, not that it can detect autism. Screening AI should be
      checked for labels defined by the inputs, duplicate records and evaluation against clinical diagnosis on independent data. Until then,
      a transparent published questionnaire is the honest tool to offer &mdash; which is why the Questionnaire page uses it.</p>
    </div>`);
  bindTabs();
  document.querySelectorAll("[data-grp]").forEach((el) => el.addEventListener("change", (e) => { state.explorer[e.target.dataset.grp] = e.target.checked; renderAI(); }));
  const bindDemo = () => document.querySelectorAll("[data-demo]").forEach((el) => el.addEventListener("change", (e) => {
    state.demo[Number(e.target.dataset.demo)] = e.target.checked ? 1 : 0;
    document.getElementById("demo").innerHTML = liveDemo(lm);
    bindDemo();
  }));
  bindDemo();
}

/* ---------------- Static pages ---------------- */

function renderMethods() {
  app.innerHTML = shell(`
    <div class="card">
      <h1>Methods: leakage-controlled evaluation</h1>
      <p>The research question is not &ldquo;how accurate can a model look?&rdquo; but &ldquo;does the reported accuracy survive a fair test?&rdquo;
      Each study in this project applies the same checks.</p>
      <ol class="steps">
        <li><b>Audit the label.</b> Check whether the outcome is defined from the inputs (for example, a questionnaire cutoff). If it is, a perfect score is expected and meaningless.</li>
        <li><b>Remove duplicates before splitting.</b> Identical records in training and test sets inflate accuracy.</li>
        <li><b>Ablate feature groups.</b> Re-run the model with and without each group of inputs to find where the signal actually comes from.</li>
        <li><b>Repeat the evaluation.</b> Use repeated stratified cross-validation and report the spread, not a single best split.</li>
        <li><b>Test across datasets and subgroups.</b> Check whether performance holds on independent data and for different groups of children.</li>
        <li><b>Explain the model.</b> Inspect what the model relies on (weights, SHAP values) and compare it with the clinical rule.</li>
        <li><b>Document limitations.</b> State plainly what the model cannot show, especially when labels are not clinical diagnoses.</li>
      </ol>
      <p class="muted small">This approach is described in the author's IEEE Access paper on leakage-controlled re-evaluation of autism-screening machine learning.</p>
    </div>`);
  bindTabs();
}

function renderPubs() {
  app.innerHTML = shell(`
    <div class="card">
      <h1>Publications</h1>
      <h2>Autism screening research</h2>
      <ul class="pubs">
        <li><b>Demographic Features Fail to Provide Clinically Viable Autism Screening: A Leakage-Controlled Multi-Dataset Re-evaluation of Machine Learning.</b>
          <i>IEEE Access</i>, accepted 2026. Md Nuruzzaman Pranto (first and corresponding author).</li>
        <li><b>Early Prediction of Autism Spectrum Disorder Using Demographic Features: A Leakage-Controlled Deep Learning Approach.</b>
          ISITDI 2026, accepted August 18, 2026; presented November 9, 2026. Md Nuruzzaman Pranto (first and presenting author).
          Its single-split results are superseded by the stricter leakage-controlled evaluation in the IEEE Access study.</li>
        <li><b>Interpretable Multimodal Transformer for Scalable Behavioral Assessment in Pediatric Autism Therapy.</b>
          <i>Results in Control and Optimization</i>, under review (submitted June 21, 2026). Md Nuruzzaman Pranto (first author).</li>
      </ul>
      <p class="muted small">Full publication list: <a href="https://scholar.google.com/citations?user=pyZLqF4AAAAJ" target="_blank" rel="noopener">Google Scholar</a>.
      Peer review record: <a href="https://www.webofscience.com/wos/author/record/PTE-7273-2026" target="_blank" rel="noopener">Web of Science PTE-7273-2026</a>.</p>
    </div>`);
  bindTabs();
}

function renderRoadmap() {
  const p = (t, body) => `<div class="proj"><span class="tag plan">Planned</span><h2 style="margin:8px 0 0;">${t}</h2>${body}</div>`;
  app.innerHTML = shell(`
    <div class="card">
      <h1>Research roadmap</h1>
      <p class="muted">Planned work, 2027&ndash;2028. Nothing on this page is finished or deployed.</p>
      ${p("A. Leakage-controlled audit and open evaluation toolkit (January&ndash;December 2027)",
        `<p>Test whether the high accuracies reported for machine-learning autism screening hold up under fair evaluation: label-definition audits, duplicate removal before splitting, feature-group ablation, stratified and grouped cross-validation, held-out external datasets, calibration, and performance by age group, sex and data source. Publish the results and release a documented, open-source evaluation toolkit so other researchers and developers can run the same checks.</p>`)}
      ${p("B. Explainable questionnaire-based screening support (July 2027 &ndash; June 2028)",
        `<p>Validated questionnaires already have standard scoring. Study when interpretable machine learning adds anything to that scoring and when it does not, separating models that predict a questionnaire-computed label from models tested against clinically confirmed diagnoses, with question-level explanations, uncertainty and referral-threshold analysis.</p>`)}
      ${p("C. Interpretable behavioral assessment in autism therapy (January&ndash;December 2028)",
        `<p>Develop interpretable models that summarize children's behavioral progress in autism therapy in a way clinicians can examine and check, evaluated with the same leakage, subgroup and baseline comparisons. Any work with real clinical data would be done only through a collaborating institution, with ethics (IRB) approval, consent and de-identified data.</p>`)}
    </div>`);
  bindTabs();
}

function renderAbout() {
  app.innerHTML = shell(`
    <div class="card">
      <h1>About this project</h1>
      <p>AutismEarlyAI is an independent research project by <b>Md Nuruzzaman Pranto</b> on how early-autism screening tools should be built and
      evaluated: transparent scoring, leakage-controlled testing across datasets, and clearly documented limits.</p>
      <p><b>Correction.</b> An earlier version of this website was a face-image interface demo that displayed simulated, randomly generated scores and
      illustrative heatmaps that did not come from any model. That demo was removed in November 2026; its history remains visible in the public repository.</p>
      <p><b>Autism in the U.S.</b> The CDC's 2025 ADDM Network report estimated that about 1 in 31 eight-year-old children had been identified with autism
      in 2022. The CDC's &ldquo;Learn the Signs. Act Early.&rdquo; program offers free developmental milestone resources for parents.</p>
      <p><b>Privacy.</b> Questionnaire answers are used only to calculate the score and are not stored. The live AI demonstration runs entirely in your browser.</p>
    </div>`);
  bindTabs();
}

function render() {
  switch (state.page) {
    case "result": return state.result ? renderResult() : renderScreen();
    case "ai": return renderAI();
    case "methods": return renderMethods();
    case "pubs": return renderPubs();
    case "roadmap": return renderRoadmap();
    case "about": return renderAbout();
    default: state.page = "screen"; return renderScreen();
  }
}

(async function init() {
  render();
  try { state.instrument = await getJSON("/api/instrument"); } catch (e) { state.error = e.message; }
  if (state.page === "screen") render();
})();
