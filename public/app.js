const MODEL_VERSION = "ASD-FaceNet v2.1.3 (Research Prototype)";

const SUBTLE_DISCLAIMER =
"This prototype is designed for research and early screening support only. It is not intended for diagnostic use.";

const RESEARCH_NOTE =
"This research initiative aims to support early autism screening in the United States through AI-assisted decision support tools designed for behavioral health professionals.";

const app = document.getElementById("app");

let state = {
  authenticated:false,
  page:"login", // login | screening | results | authors | autism
  uploadedImageDataUrl:null,
  capturedImageDataUrl:null,
  results:null,
  cameraStream:null
};

function footerNote(){
return `
<div class="footer-wrap">
<div class="tiny">${SUBTLE_DISCLAIMER}</div>
<div class="tiny" style="margin-top:6px;">${RESEARCH_NOTE}</div>
</div>
`;
}

function escapeHtml(text){
const div=document.createElement("div");
div.innerText=text;
return div.innerHTML;
}

function render(){

if(!state.authenticated || state.page==="login") renderLogin();
else if(state.page==="screening") renderScreening();
else if(state.page==="results") renderResults();
else if(state.page==="authors") renderAuthors();
else if(state.page==="autism") renderAutism();
}

function renderLogin(){

stopCamera();

app.innerHTML=`

<div class="main-header">🧠 ASD Screening Prototype</div>
<div class="subheader">Secure access for clinical research workflows</div>

<div class="grid-2">

<div>

<div class="card banner">

<div class="card-title">Research platform access</div>

<div class="muted">
Use authorised credentials to access the prototype.
</div>

<div class="soft-line"></div>

<div class="muted"><b>Demo credentials</b></div>
<div class="muted">Username: <code>admin</code></div>
<div class="muted">Password: <code>research2026</code></div>

<div class="soft-line"></div>

<button id="authorsBtn">Authors</button>
<button id="autismBtn" style="margin-top:8px;">Autism in the U.S.</button>

</div>

<div class="card" style="margin-top:14px;">

<div class="card-title">For clinical research use only</div>

<div class="muted">
This system is a prototype. It is not a diagnostic device and must not be used as a substitute for clinical judgement or validated assessment tools.
</div>

</div>

</div>

<div>

<div class="card">

<div class="card-title">Sign in</div>

<input id="username" placeholder="admin">
<input id="password" type="password" placeholder="research2026">

<button id="loginBtn" class="primary" style="width:100%;">Access Prototype</button>

<div id="loginMessage" class="note"></div>

</div>

</div>

</div>

${footerNote()}

`;

document.getElementById("loginBtn").onclick=()=>{

const u=document.getElementById("username").value.trim();
const p=document.getElementById("password").value.trim();

if(u==="admin" && p==="research2026"){
state.authenticated=true;
state.page="screening";
render();
}else{
document.getElementById("loginMessage").innerHTML="<span style='color:#b91c1c;'>Invalid credentials</span>";
}

};

document.getElementById("authorsBtn").onclick=()=>{
state.page="authors";
render();
};

document.getElementById("autismBtn").onclick=()=>{
state.page="autism";
render();
};

}

function renderAuthors(){

app.innerHTML=`

<div class="main-header">Project Lead</div>

<div class="card">

<b>Md Nuruzzaman Pranto</b>

<br><br>

Researcher in AI-Driven Health Information Systems

<br><br>

<b>Focus</b><br>
Early Autism Risk Screening using Explainable AI

<br><br>

<b>Affiliation Areas</b>

<ul>
<li>Artificial Intelligence</li>
<li>Health Information Systems</li>
<li>Clinical Decision Support</li>
</ul>

<button onclick="state.page='login';render()">⬅ Back</button>

</div>

${footerNote()}

`;

}

function renderAutism(){

app.innerHTML=`

<div class="main-header">Autism in the United States</div>

<div class="card">

According to the Centers for Disease Control and Prevention,
approximately <b>1 in 36 children in the United States</b> is diagnosed with Autism Spectrum Disorder (ASD).

<br><br>

Early identification remains challenging due to limitations in accessible screening tools and clinical resources.

<br><br>

This research project explores the development of an Explainable AI–enabled health information system designed to support early autism screening and decision-making in behavioral health services.

<br><br>

<button onclick="state.page='login';render()">⬅ Back</button>

</div>

${footerNote()}

`;

}

function renderScreening(){

app.innerHTML=`

<div class="main-header">👤 Patient Screening</div>

<div class="subheader">Provide a front-facing facial image</div>

<div class="grid-2-equal">

<div class="card">

<div class="card-title">Upload facial image</div>

<input id="fileInput" type="file" accept="image/*">

<div id="uploadPreviewWrap" style="margin-top:12px;"></div>

</div>

<div class="card">

<div class="card-title">Webcam capture</div>

<video id="video" autoplay playsinline class="hidden"></video>
<canvas id="canvas"></canvas>

<div class="actions">

<button id="startCameraBtn">Start Camera</button>
<button id="captureBtn">Take Photo</button>
<button id="stopCameraBtn">Stop Camera</button>

</div>

<div id="cameraPreviewWrap"></div>

<div class="soft-line"></div>

<button id="analyzeBtn" class="primary" style="width:100%;" disabled>
🧠 Run Pre-Screening Analysis
</button>

<div id="analyzeStatus" class="loader"></div>

</div>

</div>

${footerNote()}

`;

bindScreeningEvents();
updateScreeningPreviews();
updateAnalyzeButton();

}

function bindScreeningEvents(){

const fileInput=document.getElementById("fileInput");
const startCameraBtn=document.getElementById("startCameraBtn");
const captureBtn=document.getElementById("captureBtn");
const stopCameraBtn=document.getElementById("stopCameraBtn");
const analyzeBtn=document.getElementById("analyzeBtn");

fileInput.addEventListener("change",async(e)=>{

const file=e.target.files[0];
if(!file) return;

state.uploadedImageDataUrl=await fileToDataUrl(file);

updateScreeningPreviews();
updateAnalyzeButton();

});

startCameraBtn.onclick=startCamera;
captureBtn.onclick=captureFromCamera;
stopCameraBtn.onclick=stopCamera;

analyzeBtn.onclick=runAnalysis;

}

function updateScreeningPreviews(){

const uploadPreviewWrap=document.getElementById("uploadPreviewWrap");
const cameraPreviewWrap=document.getElementById("cameraPreviewWrap");
const video=document.getElementById("video");

if(uploadPreviewWrap){
uploadPreviewWrap.innerHTML=state.uploadedImageDataUrl
? `<img class="preview" src="${state.uploadedImageDataUrl}">`
: `<div class="muted">No uploaded image yet.</div>`;
}

if(cameraPreviewWrap){

let html="";

if(state.cameraStream){
video.classList.remove("hidden");
html+="<div class='note'>Camera active</div>";
}else{
video.classList.add("hidden");
}

if(state.capturedImageDataUrl){
html+=`<img class="preview" src="${state.capturedImageDataUrl}" style="margin-top:12px;">`;
}else{
html+=`<div class="muted" style="margin-top:12px;">No captured image yet.</div>`;
}

cameraPreviewWrap.innerHTML=html;

}

}

function updateAnalyzeButton(){
const btn=document.getElementById("analyzeBtn");
if(btn) btn.disabled=!getSelectedImage();
}

function getSelectedImage(){
return state.capturedImageDataUrl || state.uploadedImageDataUrl;
}

function fileToDataUrl(file){
return new Promise((resolve,reject)=>{

const reader=new FileReader();

reader.onload=()=>resolve(reader.result);
reader.onerror=reject;

reader.readAsDataURL(file);

});
}

async function startCamera(){

const video=document.getElementById("video");

try{

state.cameraStream=await navigator.mediaDevices.getUserMedia({
video:{facingMode:"user"},
audio:false
});

video.srcObject=state.cameraStream;
video.classList.remove("hidden");

updateScreeningPreviews();

}catch(err){
alert("Camera access denied");
}

}

function stopCamera(){

if(state.cameraStream){
state.cameraStream.getTracks().forEach(t=>t.stop());
state.cameraStream=null;
}

}

function captureFromCamera(){

const video=document.getElementById("video");
const canvas=document.getElementById("canvas");

if(!state.cameraStream) return;

canvas.width=video.videoWidth;
canvas.height=video.videoHeight;

const ctx=canvas.getContext("2d");
ctx.drawImage(video,0,0);

state.capturedImageDataUrl=canvas.toDataURL("image/png");

updateScreeningPreviews();
updateAnalyzeButton();

}

async function runAnalysis(){

const selectedImage=getSelectedImage();

if(!selectedImage) return;

const status=document.getElementById("analyzeStatus");

status.innerText="Running AI analysis...";

const response=await fetch("/api/analyze",{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({image:selectedImage})
});

const data=await response.json();

state.results=data;
state.page="results";

render();

}

function renderResults(){

const r=state.results;

app.innerHTML=`

<div class="main-header">📊 AI Analysis Results</div>

<div class="card">

<h2>${Math.round(r.probability*100)}%</h2>

<div class="badge ${r.badge_class}">
${r.confidence}
</div>

<br>

<p>${r.explanation}</p>

<br>

<img class="preview" src="${r.original_image}">

<br><br>

<img class="preview" src="${r.heatmap_image}">

<br><br>

<button id="pdfBtn">Download PDF Report</button>

<button onclick="state.page='screening';render()">New Screening</button>

<button onclick="state.page='login';state.authenticated=false;render()">Logout</button>

</div>

${footerNote()}

`;

document.getElementById("pdfBtn").onclick=downloadPdf;

}

async function downloadPdf(){

const r=state.results;

const response=await fetch("/api/report",{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({
original_image:r.original_image,
heatmap_image:r.heatmap_image,
probability:r.probability,
confidence:r.confidence,
explanation:r.explanation
})
});

const blob=await response.blob();

const url=window.URL.createObjectURL(blob);

const a=document.createElement("a");

a.href=url;
a.download="ASD_Report.pdf";

document.body.appendChild(a);
a.click();
a.remove();

}

render();