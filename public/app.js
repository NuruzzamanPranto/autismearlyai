const MODEL_VERSION = "ASD-FaceNet v2.1.3 (Research Prototype)";

const SUBTLE_DISCLAIMER =
"This prototype is designed for research and early screening support only. It is not intended for diagnostic use.";

const RESEARCH_NOTE =
"This research initiative aims to support early autism screening in the United States through AI-assisted decision support tools designed for behavioral health professionals.";

const app = document.getElementById("app");

let state = {
authenticated:false,
page:"login",
uploadedImageDataUrl:null,
capturedImageDataUrl:null,
results:null,
cameraStream:null
};

function footerNote(){
return `
<div class="footer">
${SUBTLE_DISCLAIMER}
<br><br>
${RESEARCH_NOTE}
</div>
`;
}

function render(){
if(!state.authenticated || state.page==="login") renderLogin();
else if(state.page==="screening") renderScreening();
else if(state.page==="results") renderResults();
else if(state.page==="authors") renderAuthors();
else if(state.page==="autism") renderAutismInfo();
}

document.addEventListener("click",function(e){

if(e.target.id==="authorsBtn"){
state.page="authors";
render();
}

if(e.target.id==="aboutBtn"){
state.page="autism";
render();
}

if(e.target.id==="logoutBtn"){
state.authenticated=false;
state.page="login";
render();
}

});

function renderLogin(){

app.innerHTML=`

<div class="card">

<div class="card-title">Secure Research Login</div>

<p>Use authorised credentials to access the ASD screening prototype.</p>

<input id="username" placeholder="admin"/>
<input id="password" type="password" placeholder="research2026"/>

<button id="loginBtn" class="primary">Login</button>

<div id="loginMessage"></div>

${footerNote()}

</div>

`;

document.getElementById("loginBtn").onclick=()=>{

const u=document.getElementById("username").value;
const p=document.getElementById("password").value;

if(u==="admin" && p==="research2026"){
state.authenticated=true;
state.page="screening";
render();
}
else{
document.getElementById("loginMessage").innerHTML="<span style='color:red'>Invalid credentials</span>";
}

};

}

function renderAuthors(){

app.innerHTML=`

<div class="card info-panel">

<div class="card-title">Project Lead</div>

<p><b>Md Nuruzzaman Pranto</b></p>

<p>Researcher in AI-Driven Health Information Systems</p>

<p><b>Focus:</b> Early Autism Risk Screening using Explainable AI</p>

<p><b>Affiliation Areas</b></p>

<ul>
<li>Artificial Intelligence</li>
<li>Health Information Systems</li>
<li>Clinical Decision Support</li>
</ul>

<button onclick="state.page='login';render()">⬅ Back</button>

${footerNote()}

</div>

`;

}

function renderAutismInfo(){

app.innerHTML=`

<div class="card info-panel">

<div class="card-title">Autism in the United States</div>

<p>
According to the Centers for Disease Control and Prevention,
approximately <b>1 in 36 children in the United States</b> is diagnosed
with Autism Spectrum Disorder (ASD).
</p>

<p>
Early identification remains challenging due to limitations
in accessible screening tools and clinical resources.
</p>

<p>
This research project explores the development of an
<b>Explainable AI enabled health information system</b>
designed to support early autism screening and decision making
in behavioural health services.
</p>

<button onclick="state.page='login';render()">⬅ Back</button>

${footerNote()}

</div>

`;

}

function renderScreening(){

app.innerHTML=`

<div class="card">

<div class="card-title">Patient Screening</div>

<input id="fileInput" type="file" accept="image/*"/>

<div id="uploadPreview"></div>

<br>

<button id="analyzeBtn" class="primary">Run Screening</button>

<div id="status"></div>

${footerNote()}

</div>

`;

document.getElementById("fileInput").addEventListener("change",async(e)=>{

const file=e.target.files[0];
const reader=new FileReader();

reader.onload=function(){
state.uploadedImageDataUrl=reader.result;
document.getElementById("uploadPreview").innerHTML=
`<img class="preview" src="${reader.result}"/>`;
};

reader.readAsDataURL(file);

});

document.getElementById("analyzeBtn").onclick=runAnalysis;

}

async function runAnalysis(){

const status=document.getElementById("status");

if(!state.uploadedImageDataUrl){
status.innerHTML="<span style='color:red'>Upload an image first</span>";
return;
}

status.innerText="Running AI analysis...";

try{

const response=await fetch("/api/analyze",{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({image:state.uploadedImageDataUrl})
});

const data=await response.json();

state.results=data;
state.page="results";
render();

}catch(err){
status.innerHTML="<span style='color:red'>Analysis failed</span>";
}

}

function renderResults(){

const r=state.results;

app.innerHTML=`

<div class="card">

<div class="card-title">AI Analysis Results</div>

<h2>${Math.round(r.probability*100)}%</h2>

<div class="badge ${r.badge_class}">
${r.confidence}
</div>

<br>

<p>${r.explanation}</p>

<br>

<img class="preview" src="${r.original_image}"/>

<br><br>

<img class="preview" src="${r.heatmap_image}"/>

<br><br>

<button id="pdfBtn">Download PDF Report</button>

<button onclick="state.page='screening';render()">New Screening</button>

<button id="logoutBtn">Logout</button>

${footerNote()}

</div>

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