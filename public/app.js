const MODEL_VERSION = "None (interface prototype — no trained model connected)";
const SUBTLE_DISCLAIMER =
  "This website is an interface prototype only. No trained AI model is connected and it does not analyse images or produce screening results. It is not a medical device.";
const RESEARCH_NOTE =
  "The modelling research behind this project (evaluation of autism-screening machine learning) is reported in the author's papers, not run on this site.";

const app = document.getElementById("app");

let state = {
  authenticated: false,
  page: "login", // login | screening | results | authors | autism
  previousPage: "login",
  uploadedImageDataUrl: null,
  capturedImageDataUrl: null,
  results: null,
  cameraStream: null,
};

function subtleDisclaimerFooter() {
  return `
    <div class="footer-wrap">
      <div class="tiny">${SUBTLE_DISCLAIMER}</div>
      <div class="tiny" style="margin-top:6px;">${RESEARCH_NOTE}</div>
    </div>
  `;
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.innerText = text ?? "";
  return div.innerHTML;
}

function openInfoPage(targetPage) {
  state.previousPage = state.page;
  state.page = targetPage;
  render();
}

function goBackFromInfoPage() {
  state.page = state.previousPage || (state.authenticated ? "screening" : "login");
  render();
}

function renderTopActions(showSignOut = false) {
  return `
    <div class="card" style="margin-bottom:16px; border:2px solid #b45309; background:#fffbeb;">
      <div class="card-title" style="color:#92400e;">Notice: interface prototype — no AI model is connected</div>
      <div class="muted" style="color:#78350f;">
        This site demonstrates a planned user interface and report layout only. It does not analyse images and does not
        produce autism risk scores. Earlier versions of this demo displayed <b>simulated (randomly generated)</b> scores and
        illustrative heatmaps that did not come from any model; those outputs had no clinical or scientific meaning.
        If you have concerns about a child's development, please speak with a pediatrician or qualified clinician.
      </div>
    </div>
    <div class="card" style="margin-bottom:16px;">
      <div class="actions" style="justify-content:space-between; align-items:center;">
        <div class="muted"><b>Research information</b></div>
        <div class="actions">
          <button id="authorsBtn">Authors</button>
          <button id="autismBtn">Autism in the U.S.</button>
          ${showSignOut ? `<button id="topSignOutBtn">Sign out</button>` : ``}
        </div>
      </div>
    </div>
  `;
}

function bindSharedActions(showSignOut = false) {
  const authorsBtn = document.getElementById("authorsBtn");
  const autismBtn = document.getElementById("autismBtn");
  const topSignOutBtn = document.getElementById("topSignOutBtn");

  if (authorsBtn) {
    authorsBtn.addEventListener("click", () => openInfoPage("authors"));
  }

  if (autismBtn) {
    autismBtn.addEventListener("click", () => openInfoPage("autism"));
  }

  if (showSignOut && topSignOutBtn) {
    topSignOutBtn.addEventListener("click", () => {
      stopCamera();
      state.authenticated = false;
      state.results = null;
      state.uploadedImageDataUrl = null;
      state.capturedImageDataUrl = null;
      state.page = "login";
      state.previousPage = "login";
      render();
    });
  }
}

function render() {
  if (state.page === "authors") {
    renderAuthors();
  } else if (state.page === "autism") {
    renderAutismInfo();
  } else if (!state.authenticated || state.page === "login") {
    renderLogin();
  } else if (state.page === "screening") {
    renderScreening();
  } else if (state.page === "results") {
    renderResults();
  }
}

function renderLogin() {
  stopCamera();

  app.innerHTML = `
    ${renderTopActions(false)}

    <div class="main-header">🧠 ASD Screening Prototype</div>
    <div class="subheader">Interface preview — no model connected</div>

    <div class="grid-2">
      <div>
        <div class="card banner">
          <div class="card-title">Interface preview</div>
          <div class="muted">
            This preview shows the planned screens of a research interface. Image analysis is disabled because no
            trained, validated model is connected.
          </div>
        </div>

        <div class="card" style="margin-top:14px;">
          <div class="card-title">For clinical research use only</div>
          <div class="muted">
            This system is a prototype. It is not a diagnostic device and must not be used as a substitute for
            clinical judgement or validated assessment tools.
          </div>
          <div class="soft-line"></div>
          <div class="muted">
            <b>HIPAA-style notice (prototype):</b> Avoid uploading identifiable data unless your
            research protocol permits it. Use de-identified images when possible.
          </div>
        </div>
      </div>

      <div>
        <div class="card">
          <div class="card-title">View the interface</div>
          <div class="muted" style="margin-bottom:12px;">Please do not upload photos of real children.</div>
          <button id="loginBtn" class="primary" style="width:100%;">Open Interface Preview</button>

          <div id="loginMessage" class="note"></div>
        </div>
      </div>
    </div>

    ${subtleDisclaimerFooter()}
  `;

  bindSharedActions(false);

  document.getElementById("loginBtn").addEventListener("click", () => {
    state.authenticated = true;
    state.page = "screening";
    state.previousPage = "screening";
    render();
  });
}

function renderAuthors() {
  app.innerHTML = `
    ${renderTopActions(state.authenticated)}

    <div class="main-header">👤 Project Lead</div>
    <div class="subheader">Research profile and affiliation areas</div>

    <div class="card" style="max-width:900px;">
      <div class="card-title">Md Nuruzzaman Pranto</div>

      <div class="muted" style="font-size:1rem; margin-bottom:14px;">
        Researcher in AI-Driven Health Information Systems
      </div>

      <div class="soft-line"></div>

      <div class="muted" style="margin-bottom:12px;">
        <b>Focus:</b> Early Autism Risk Screening using Explainable AI
      </div>

      <div class="card" style="background:rgba(99,102,241,0.05);">
        <div class="card-title">Affiliation areas</div>
        <div class="muted">• Artificial Intelligence</div>
        <div class="muted">• Health Information Systems</div>
        <div class="muted">• Clinical Decision Support</div>
      </div>

      <div style="margin-top:16px;">
        <button id="backFromAuthorsBtn">⬅ Back</button>
      </div>
    </div>

    ${subtleDisclaimerFooter()}
  `;

  bindSharedActions(state.authenticated);
  document.getElementById("backFromAuthorsBtn").addEventListener("click", goBackFromInfoPage);
}

function renderAutismInfo() {
  app.innerHTML = `
    ${renderTopActions(state.authenticated)}

    <div class="main-header">📘 Autism in the United States</div>
    <div class="subheader">Context for the research prototype</div>

    <div class="card" style="max-width:900px;">
      <div class="card-title">Background</div>

      <div class="muted" style="font-size:1rem; line-height:1.7;">
        According to the Centers for Disease Control and Prevention, approximately
        <b>1 in 31 eight-year-old children in the United States</b> had been identified with Autism Spectrum Disorder (ASD) in 2022 (CDC ADDM Network, 2025 report).
      </div>

      <div class="soft-line"></div>

      <div class="muted" style="font-size:1rem; line-height:1.7;">
        Early identification remains challenging due to limitations in accessible screening tools
        and clinical resources.
      </div>

      <div class="soft-line"></div>

      <div class="muted" style="font-size:1rem; line-height:1.7;">
        The underlying research examines how autism-screening machine-learning models should be evaluated
        (data-leakage control, multiple datasets, subgroup checks, documented limitations). This website
        itself contains no model.
      </div>

      <div style="margin-top:16px;">
        <button id="backFromAutismBtn">⬅ Back</button>
      </div>
    </div>

    ${subtleDisclaimerFooter()}
  `;

  bindSharedActions(state.authenticated);
  document.getElementById("backFromAutismBtn").addEventListener("click", goBackFromInfoPage);
}

function renderScreening() {
  app.innerHTML = `
    ${renderTopActions(true)}

    <div class="main-header">👤 Screening Interface (preview only)</div>
    <div class="subheader">Layout preview — analysis is disabled; no model is connected. Please do not upload photos of real children.</div>

    <div class="grid-2-equal">
      <div class="card" style="min-height:420px;">
        <div class="card-title">Upload facial image</div>
        <div class="muted" style="margin-bottom:10px;">
          Select a PNG, JPG, or JPEG image for pre-screening analysis.
        </div>
        <input id="fileInput" type="file" accept=".png,.jpg,.jpeg,image/png,image/jpeg" />
        <div id="uploadPreviewWrap" style="margin-top:12px;"></div>
      </div>

      <div class="card" style="min-height:420px;">
        <div class="card-title">Webcam capture</div>
        <div class="muted" style="margin-bottom:10px;">
          Capture a front-facing image directly from your device camera.
        </div>

        <video id="video" autoplay playsinline class="hidden"></video>
        <canvas id="canvas"></canvas>

        <div class="actions" style="margin:12px 0;">
          <button id="startCameraBtn">Start Camera</button>
          <button id="captureBtn">Take a Photo</button>
          <button id="stopCameraBtn">Stop Camera</button>
        </div>

        <div id="cameraPreviewWrap"></div>

        <div class="soft-line"></div>

        <button id="analyzeBtn" class="primary" style="width:100%;" disabled>
          Analysis disabled — no model connected
        </button>
        <div id="analyzeStatus" class="loader"></div>
      </div>
    </div>

    ${subtleDisclaimerFooter()}
  `;

  bindSharedActions(true);
  bindScreeningEvents();
  updateScreeningPreviews();
  updateAnalyzeButton();
}

function bindScreeningEvents() {
  const fileInput = document.getElementById("fileInput");
  const startCameraBtn = document.getElementById("startCameraBtn");
  const captureBtn = document.getElementById("captureBtn");
  const stopCameraBtn = document.getElementById("stopCameraBtn");
  const analyzeBtn = document.getElementById("analyzeBtn");

  fileInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    state.uploadedImageDataUrl = await fileToDataUrl(file);
    updateScreeningPreviews();
    updateAnalyzeButton();
  });

  startCameraBtn.addEventListener("click", startCamera);
  captureBtn.addEventListener("click", captureFromCamera);
  stopCameraBtn.addEventListener("click", () => {
    stopCamera();
    updateScreeningPreviews();
  });

  analyzeBtn.addEventListener("click", runAnalysis);
}

function updateScreeningPreviews() {
  const uploadPreviewWrap = document.getElementById("uploadPreviewWrap");
  const cameraPreviewWrap = document.getElementById("cameraPreviewWrap");
  const video = document.getElementById("video");

  if (uploadPreviewWrap) {
    uploadPreviewWrap.innerHTML = state.uploadedImageDataUrl
      ? `<img class="preview" src="${state.uploadedImageDataUrl}" alt="Uploaded image" />`
      : `<div class="muted">No uploaded image selected yet.</div>`;
  }

  if (cameraPreviewWrap) {
    let html = "";
    if (state.cameraStream) {
      video.classList.remove("hidden");
      html += `<div class="note">Camera active.</div>`;
    } else {
      video.classList.add("hidden");
    }

    if (state.capturedImageDataUrl) {
      html += `<img class="preview" src="${state.capturedImageDataUrl}" alt="Captured image" style="margin-top:12px;" />`;
    } else {
      html += `<div class="muted" style="margin-top:12px;">No captured image yet.</div>`;
    }

    cameraPreviewWrap.innerHTML = html;
  }
}

function updateAnalyzeButton() {
  const analyzeBtn = document.getElementById("analyzeBtn");
  if (!analyzeBtn) return;
  analyzeBtn.disabled = true; // no model connected
}

function getSelectedImage() {
  return state.capturedImageDataUrl || state.uploadedImageDataUrl;
}

async function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function startCamera() {
  const video = document.getElementById("video");
  try {
    state.cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user" },
      audio: false,
    });
    video.srcObject = state.cameraStream;
    video.classList.remove("hidden");
    updateScreeningPreviews();
  } catch (err) {
    alert("Unable to access camera. Please allow camera permission.");
  }
}

function stopCamera() {
  if (state.cameraStream) {
    state.cameraStream.getTracks().forEach(track => track.stop());
    state.cameraStream = null;
  }
  const video = document.getElementById("video");
  if (video) {
    video.srcObject = null;
    video.classList.add("hidden");
  }
}

function captureFromCamera() {
  const video = document.getElementById("video");
  const canvas = document.getElementById("canvas");

  if (!state.cameraStream || !video.videoWidth || !video.videoHeight) {
    alert("Start the camera first.");
    return;
  }

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  state.capturedImageDataUrl = canvas.toDataURL("image/png");
  updateScreeningPreviews();
  updateAnalyzeButton();
}

async function runAnalysis() {
  const st = document.getElementById("analyzeStatus");
  if (st) st.textContent = "Analysis is disabled: no trained model is connected to this interface prototype.";
  return;

  const selectedImage = getSelectedImage();
  if (!selectedImage) return;

  const analyzeBtn = document.getElementById("analyzeBtn");
  const analyzeStatus = document.getElementById("analyzeStatus");

  analyzeBtn.disabled = true;
  analyzeStatus.textContent = "Analysis is disabled in this interface prototype.";

  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ image: selectedImage }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || "Analysis failed.");
    }

    const data = await response.json();
    state.results = data;
    state.page = "results";
    state.previousPage = "screening";
    render();
  } catch (error) {
    analyzeStatus.innerHTML = `<span style="color:#b91c1c;">${escapeHtml(error.message)}</span>`;
    analyzeBtn.disabled = false;
  }
}

function renderResults() {
  if (!state.results) {
    state.page = "screening";
    render();
    return;
  }

  const r = state.results;

  app.innerHTML = `
    ${renderTopActions(true)}

    <div class="main-header">📊 AI Analysis Results</div>
    <div class="subheader">Decision-support summary • Model: ${escapeHtml(r.model_version || MODEL_VERSION)}</div>

    <div class="grid-3">
      <div class="card">
        <div class="card-title">1) ASD Risk Score</div>
        <div class="metric">
          <div>
            <div class="label">ASD probability</div>
            <div class="value">${Math.round(r.probability * 100)}%</div>
          </div>
          <div class="muted" style="text-align:right;">
            <div><b>${Number(r.probability).toFixed(2)}</b></div>
            <div class="tiny">(${escapeHtml(r.timestamp)})</div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-title">2) Confidence level</div>
        <div class="badge ${escapeHtml(r.badge_class)}">
          Confidence: ${escapeHtml(r.confidence)}
        </div>
        <div class="soft-line"></div>
        <div class="muted">
          Thresholds:<br/>
          • 0–0.40 → Low Risk<br/>
          • 0.40–0.70 → Moderate Risk<br/>
          • 0.70+ → Elevated Risk
        </div>
      </div>

      <div class="card">
        <div class="card-title">4) Clinical interpretation</div>
        <div class="muted">${escapeHtml(r.explanation)}</div>
      </div>
    </div>

    <div class="soft-line"></div>

    <div class="grid-2-equal">
      <div class="card">
        <div class="card-title">Original image</div>
        <img class="preview" src="${r.original_image}" alt="Original image" />
      </div>

      <div class="card">
        <div class="card-title">3) Explanation overlay (placeholder)</div>
        <img class="preview" src="${r.heatmap_image}" alt="Heatmap image" />
        <div class="tiny" style="margin-top:10px;">
          Overlay highlights: Eyes (higher) • Nose (medium) • Mouth (lower)
        </div>
        <div class="tiny" style="margin-top:8px;">
          Note: This is a prototype saliency-style visualisation for research UX.
        </div>
      </div>
    </div>

    <div class="soft-line"></div>

    <div class="grid-2-equal">
      <div class="card">
        <div class="card-title">Download PDF report</div>
        <div class="muted">
          Includes images, probability, confidence, interpretation, disclaimer, model version, and date/time.
        </div>
        <button id="downloadPdfBtn" class="primary" style="width:100%; margin-top:12px;">
          📥 Download PDF Report
        </button>
        <div id="downloadStatus" class="note"></div>
      </div>

      <div class="card">
        <div class="card-title">Next step</div>
        <div class="muted">
          If the result indicates moderate or elevated risk, follow your protocol for standardised behavioural assessment and clinician review.
        </div>
        <button id="newScreeningBtn" style="width:100%; margin-top:12px;">🔄 New Screening</button>
        <button id="signOutBtn" style="width:100%; margin-top:12px;">🚪 Sign out</button>
      </div>
    </div>

    ${subtleDisclaimerFooter()}
  `;

  bindSharedActions(true);

  document.getElementById("downloadPdfBtn").addEventListener("click", downloadPdf);
  document.getElementById("newScreeningBtn").addEventListener("click", () => {
    state.results = null;
    state.uploadedImageDataUrl = null;
    state.capturedImageDataUrl = null;
    state.page = "screening";
    state.previousPage = "screening";
    render();
  });

  document.getElementById("signOutBtn").addEventListener("click", () => {
    stopCamera();
    state.authenticated = false;
    state.results = null;
    state.uploadedImageDataUrl = null;
    state.capturedImageDataUrl = null;
    state.page = "login";
    state.previousPage = "login";
    render();
  });
}

async function downloadPdf() {
  const r = state.results;
  const status = document.getElementById("downloadStatus");
  status.textContent = "Generating PDF...";

  try {
    const response = await fetch("/api/report", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        original_image: r.original_image,
        heatmap_image: r.heatmap_image,
        probability: r.probability,
        confidence: r.confidence,
        explanation: r.explanation,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to generate PDF report.");
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ASD_Report_${new Date().toISOString().replace(/[:.]/g, "-")}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
    status.textContent = "";
  } catch (error) {
    status.innerHTML = `<span style="color:#b91c1c;">${escapeHtml(error.message)}</span>`;
  }
}

render();