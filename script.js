/* ---------------- ELEMENTS ---------------- */
const videoEl = document.getElementById('videoPreview');
const overlayCanvas = document.getElementById('overlayCanvas');
const ctx = overlayCanvas.getContext('2d');
const sosBtn = document.getElementById('sosButton');
const statusPill = document.getElementById('statusPill');
const recOverlay = document.getElementById('recordOverlay');
const recTimer = document.getElementById('recTimer');
const locText = document.getElementById('locText');
const guardianList = document.getElementById('guardianList');
const downloadBtn = document.getElementById('downloadLast');
const lastVideo = document.getElementById('lastVideo');
const snapshotBtn = document.getElementById('snapshotBtn');
const triggerMode = document.getElementById('triggerMode');
const multiCount = document.getElementById('multiCount');
const longMs = document.getElementById('longMs');
const themeToggle = document.getElementById('themeToggle');
const overlayColor = document.getElementById('overlayColor');
const copyCoords = document.getElementById('copyCoords');
const logList = document.getElementById('logList');
const snapshotGallery = document.getElementById('snapshotGallery');
const dailyCountEl = document.getElementById('dailyCount');
const totalDurationEl = document.getElementById('totalDuration');
const sosAudio = document.getElementById('sosAudio');
const toastContainer = document.getElementById('toastContainer');

let stream=null,recorder=null,blobs=[],recording=false,lastBlobUrl=null;
let startTime=0,timerInterval=null;
let clickCount=0,lastTap=0,holdTimer=null;
let locHistory=[],dailySOSCount=0,totalRecordingSec=0;

/* ---------------- TOAST ---------------- */
function showToast(msg){
  const div = document.createElement('div'); div.className='toast'; div.textContent=msg;
  toastContainer.appendChild(div);
  setTimeout(()=>div.remove(),3000);
}

/* ---------------- CAMERA ---------------- */
async function initCamera(){
  if(stream) return;
  stream = await navigator.mediaDevices.getUserMedia({video:{facingMode:"user"},audio:true});
  videoEl.srcObject = stream;
}

/* ---------------- RECORDING ---------------- */
function startRecording(){
  blobs=[]; recorder=new MediaRecorder(stream);
  recorder.ondataavailable = e=>e.data.size && blobs.push(e.data);
  recorder.onstop = ()=>{
    const blob = new Blob(blobs,{type:'video/webm'});
    lastBlobUrl=URL.createObjectURL(blob);
    lastVideo.src=lastBlobUrl; lastVideo.hidden=false;
    showToast('Recording saved'); addLog('Recording saved');
    totalRecordingSec += Math.floor((Date.now()-startTime)/1000);
    updateStats();
  };
  recorder.start();
  recording=true; startTime=Date.now(); statusPill.textContent='Recording';
  recOverlay.hidden=false; document.body.classList.add('recording-border');
  sosAudio.play(); dailySOSCount++; updateStats();
  timerInterval=setInterval(()=>{
    const sec=Math.floor((Date.now()-startTime)/1000);
    const mm=String(Math.floor(sec/60)).padStart(2,'0'), ss=String(sec%60).padStart(2,'0');
    recTimer.textContent=`${mm}:${ss}`;
    if(sec>=300) stopRecording();
  },500);
}

function stopRecording(){
  if(!recording) return;
  recorder.stop(); recording=false; statusPill.textContent='Idle'; recOverlay.hidden=true;
  document.body.classList.remove('recording-border'); clearInterval(timerInterval);
  sosAudio.pause(); sosAudio.currentTime=0;
}

/* ---------------- SNAPSHOT ---------------- */
function takeSnapshot(){
  const canvas = document.createElement('canvas');
  canvas.width=videoEl.videoWidth; canvas.height=videoEl.videoHeight;
  const cctx = canvas.getContext('2d');
  cctx.drawImage(videoEl,0,0);
  // Overlay watermark
  cctx.fillStyle=overlayColor.value; cctx.font='18px Inter';
  const ts = new Date().toLocaleTimeString();
  const loc=locText.textContent; cctx.fillText(`${ts} ${loc}`,10,30);
  const url=canvas.toDataURL();
  const a=document.createElement('a'); a.href=url; a.download='snapshot.png'; a.click();
  const img=document.createElement('img'); img.src=url; snapshotGallery.prepend(img);
  showToast('Snapshot taken'); addLog('Snapshot captured');
}
snapshotBtn.addEventListener('click',takeSnapshot);

/* ---------------- LOCATION ---------------- */
function updateLocation(pos){
  const lat=pos.coords.latitude.toFixed(5), lng=pos.coords.longitude.toFixed(5);
  locText.textContent=`${lat}, ${lng}`;
  locHistory.push({lat,lng});
  if(locHistory.length>10) locHistory.shift();
}
navigator.geolocation?.watchPosition(updateLocation);
copyCoords.addEventListener('click',()=>{
  navigator.clipboard.writeText(locText.textContent);
  showToast('Coordinates copied');
});

/* ---------------- GUARDIANS ---------------- */
function simulateGuardians(){
  guardianList.innerHTML='';
  ['Asha','Kiran','Meera'].forEach(name=>{
    const li=document.createElement('li'); li.textContent=`${name} • responding`;
    guardianList.appendChild(li);
    setTimeout(()=>li.textContent=`${name} • nearby • arrived`,Math.random()*3000+2000);
  });
}

/* ---------------- LOGS ---------------- */
function addLog(msg){
  const li=document.createElement('li'); li.textContent=`${new Date().toLocaleTimeString()}: ${msg}`;
  logList.prepend(li); saveLogs();
}
function saveLogs(){ const items=Array.from(logList.children).map(li=>li.textContent);
  localStorage.setItem('safetyLogs',JSON.stringify(items));}
function loadLogs(){ const items=JSON.parse(localStorage.getItem('safetyLogs')||'[]');
  items.forEach(text=>{ const li=document.createElement('li'); li.textContent=text; logList.appendChild(li);});}
loadLogs();

/* ---------------- STATS ---------------- */
function updateStats(){
  dailyCountEl.textContent=`SOS Today: ${dailySOSCount}`;
  const mm=Math.floor(totalRecordingSec/60), ss=totalRecordingSec%60;
  totalDurationEl.textContent=`Total Recording: ${mm}:${ss.toString().padStart(2,'0')}`;
}

/* ---------------- SOS ---------------- */
async function toggleSOS(){
  await initCamera();
  if(!recording){startRecording(); simulateGuardians(); showToast('🚨 SOS STARTED'); addLog('SOS triggered');
    if(navigator.vibrate)vibratePattern();}
  else {stopRecording(); showToast('🛑 SOS STOPPED'); addLog('SOS stopped');}
}

/* ---------------- TRIGGERS ---------------- */
sosBtn.addEventListener('click',()=>{
  const mode=triggerMode.value;
  if(mode==='single') return toggleSOS();
  if(mode==='double'){ const now=Date.now(); if(now-lastTap<400) toggleSOS(); lastTap=now;}
  if(mode==='multi'){ clickCount++; if(clickCount>=multiCount.value){clickCount=0; toggleSOS();}}
});
sosBtn.addEventListener('mousedown',()=>{if(triggerMode.value==='long')holdTimer=setTimeout(toggleSOS,longMs.value);});
['mouseup','mouseleave','touchend','touchcancel'].forEach(ev=>sosBtn.addEventListener(ev,()=>clearTimeout(holdTimer)));

/* ---------------- DOWNLOAD ---------------- */
downloadBtn.addEventListener('click',()=>{
  if(!lastBlobUrl)return showToast('No recording yet');
  const a=document.createElement('a'); a.href=lastBlobUrl; a.download='evidence.webm'; a.click();
});

/* ---------------- THEME ---------------- */
themeToggle.addEventListener('click',()=>document.body.classList.toggle('light'));

/* ---------------- KEYBOARD ---------------- */
document.addEventListener('keydown',e=>{if(e.key.toLowerCase()==='s') toggleSOS();});

/* ---------------- OVERLAY COLOR ---------------- */
overlayColor.addEventListener('input',e=>document.querySelector('.pulse').style.background=e.target.value);

/* ---------------- VIBRATION ---------------- */
function vibratePattern(){ navigator.vibrate([200,100,200,100,200]);}

/* ---------------- SHAKE DETECTION ---------------- */
let lastX=null,lastY=null,lastZ=null,shakeThreshold=15;
window.addEventListener('devicemotion',e=>{
  if(triggerMode.value!=='shake')return;
  let a=e.accelerationIncludingGravity;
  if(!lastX){lastX=a.x; lastY=a.y; lastZ=a.z; return;}
  let delta=Math.abs(a.x-lastX)+Math.abs(a.y-lastY)+Math.abs(a.z-lastZ);
  if(delta>shakeThreshold) toggleSOS();
  lastX=a.x; lastY=a.y; lastZ=a.z;
});

showToast('Ultimate Nizhal-Vel Ready');
