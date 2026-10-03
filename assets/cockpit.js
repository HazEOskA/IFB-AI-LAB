(()=>{
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const STORE="ifp_cockpit_v01";
const state={mode:"chat",provider:"auto",memoryEnabled:true,memory:[],messages:[],status:null,last:null};

function load(){
  try{
    const x=JSON.parse(localStorage.getItem(STORE)||"{}");
    if(Array.isArray(x.memory)) state.memory=x.memory.slice(-6);
    if(typeof x.memoryEnabled==="boolean") state.memoryEnabled=x.memoryEnabled;
  }catch{}
}
function save(){
  localStorage.setItem(STORE,JSON.stringify({memory:state.memory.slice(-6),memoryEnabled:state.memoryEnabled}));
}
function esc(s=""){return String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]))}
function renderMemory(){
  const host=$("[data-memory-list]");
  if(!state.memory.length){host.innerHTML="<p>Brak zapisanych ustaleń.</p>";return}
  host.innerHTML=state.memory.slice().reverse().map(x=>`<div class="memory-item">${esc(x)}</div>`).join("");
}
function addMessage(role,text,route){
  const host=$("[data-chat]");
  const welcome=$(".welcome",host);
  if(welcome) welcome.remove();
  const el=document.createElement("div");
  el.className="message "+role;
  el.innerHTML=`<div class="meta">${role==="user"?"MARTYNA":"IFP COPILOT"}</div><div class="bubble">${esc(text)}${route?`<div><span class="route-chip">${esc(route)}</span></div>`:""}</div>`;
  host.appendChild(el);host.scrollTop=host.scrollHeight;
  return el;
}
function typing(){
  const host=$("[data-chat]");const el=document.createElement("div");el.className="message assistant";
  el.innerHTML='<div class="meta">IFP RUNTIME</div><div class="bubble"><div class="typing"><i></i><i></i><i></i></div></div>';
  host.appendChild(el);host.scrollTop=host.scrollHeight;return el;
}
function setMode(mode){
  state.mode=mode;$$("[data-mode]").forEach(b=>b.classList.toggle("active",b.dataset.mode===mode));
}
function setPreset(id){
  $$(".tool-pill").forEach(b=>b.classList.toggle("active",b.dataset.preset===id));
  const prompts={
    materials:"Przygotuj materiały szkoleniowe. Najpierw zidentyfikuj brakujące dane. Potem zaproponuj strukturę, ćwiczenie, workbook i zadanie domowe.",
    mentoring:"Przygotuj mnie do mentoringu. Zrób brief, pytania diagnostyczne, ryzyka, rekomendacje i 3 kolejne działania.",
    report:"Zbuduj raport ekspercki z danych, które podam. Rozdziel FAKTY / ZAŁOŻENIA / REKOMENDACJE / BRAKI DANYCH.",
    plan:"Ułóż plan działania z priorytetami, zależnościami, terminami i kryteriami ukończenia.",
    document:"Pomóż mi przygotować dokument. Najpierw ustal typ dokumentu, odbiorcę, cel i dane źródłowe. Nie wymyślaj brakujących faktów.",
    eu:"Przeanalizuj dokument programu europejskiego, który wkleję. Zbuduj requirements matrix, eligibility check, ryzyka, terminy i braki danych. Nie zgaduj kryteriów.",
    general:""
  };
  const input=$("[data-input]");if(prompts[id]){input.value=prompts[id];input.focus()}
}
async function getStatus(){
  try{
    const r=await fetch("/api/cockpit",{headers:{Accept:"application/json"},cache:"no-store"});
    if(!r.ok) throw new Error("HTTP "+r.status);
    state.status=await r.json();
    const rt=state.status.runtime||{};
    $("[data-runtime-status]").textContent=rt.ready?"LIVE":"DEMO";
    $("[data-runtime-status]").classList.toggle("live",!!rt.ready);
    $("[data-runtime-dot]").classList.toggle("live",true);
    const set=(sel,on,label)=>{const el=$(sel);el.textContent=label||(on?"READY":"NO KEY");el.className=on?"on":"off"};
    set("[data-jev-status]",rt.jev,rt.jev?"READY":"NO KEY");
    set("[data-nvidia-status]",rt.nvidia,rt.nvidia?"READY":"NO KEY");
    set("[data-openrouter-status]",rt.openrouter,rt.openrouter?"READY":"NO KEY");
  }catch{
    $("[data-runtime-status]").textContent="OFFLINE";
  }
}
function renderReceipt(data){
  const r=data.receipt||{};
  $("[data-route]").textContent=data.route?.workflow||"—";
  $("[data-jev]").textContent=data.route?.source?((data.route.source==="jev"?"JEV ":"FALLBACK ")+(data.route.confidence??"")):"—";
  $("[data-used-provider]").textContent=r.provider||"—";
  $("[data-model]").textContent=r.model||"—";
  $("[data-gate]").textContent=r.authority_gate||"—";
  $("[data-receipt]").textContent=JSON.stringify(r,null,2);
}
async function send(message){
  const trimmed=message.trim();if(!trimmed)return;
  addMessage("user",trimmed);
  if(state.memoryEnabled){state.memory.push(trimmed.slice(0,220));state.memory=state.memory.slice(-6);save();renderMemory()}
  const wait=typing();
  try{
    const r=await fetch("/api/cockpit",{
      method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({message:trimmed,mode:state.mode,provider:state.provider,workspace:"IFP Expert",memory:state.memoryEnabled?state.memory:[]})
    });
    const data=await r.json();
    wait.remove();
    if(!r.ok){addMessage("system",data.error||("Błąd runtime: HTTP "+r.status));return}
    addMessage("assistant",data.answer,data.route?.workflow?("route: "+data.route.workflow):null);
    state.last=data;renderReceipt(data);
  }catch(err){wait.remove();addMessage("system","Runtime error: "+err.message)}
}
load();renderMemory();getStatus();

$$("[data-mode]").forEach(b=>b.addEventListener("click",()=>setMode(b.dataset.mode)));
$("[data-provider]").addEventListener("change",e=>state.provider=e.target.value);
$$("[data-preset]").forEach(b=>b.addEventListener("click",()=>setPreset(b.dataset.preset)));
$$("[data-quick]").forEach(b=>b.addEventListener("click",()=>{const input=$("[data-input]");input.value=b.dataset.quick;input.focus()}));
$("[data-memory-toggle]").addEventListener("click",e=>{state.memoryEnabled=!state.memoryEnabled;e.currentTarget.classList.toggle("active",state.memoryEnabled);e.currentTarget.innerHTML=state.memoryEnabled?'<span>●</span> Small Memory ON':'<span>○</span> Small Memory OFF';save()});
$("[data-memory-toggle]").classList.toggle("active",state.memoryEnabled);
$("[data-memory-toggle]").innerHTML=state.memoryEnabled?'<span>●</span> Small Memory ON':'<span>○</span> Small Memory OFF';
$("[data-clear-memory]").addEventListener("click",()=>{state.memory=[];save();renderMemory()});
$("[data-form]").addEventListener("submit",e=>{e.preventDefault();const input=$("[data-input]");const msg=input.value;input.value="";send(msg)});
$("[data-input]").addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();$("[data-form]").requestSubmit()}});
})();