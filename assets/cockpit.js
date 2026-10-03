(()=>{
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const STORE="ifp_cockpit_v02";
const state={mode:"chat",provider:"auto",model:null,modelTab:"auto",search:"",catalog:{nvidia:[],openrouter:[]},catalogMeta:{},memoryEnabled:true,memory:[],messages:[],status:null,last:null};

function load(){
  try{
    const x=JSON.parse(localStorage.getItem(STORE)||"{}");
    if(Array.isArray(x.memory)) state.memory=x.memory.slice(-6);
    if(typeof x.memoryEnabled==="boolean") state.memoryEnabled=x.memoryEnabled;
    if(["auto","nvidia","openrouter"].includes(x.provider)) state.provider=x.provider;
    if(typeof x.model==="string"||x.model===null) state.model=x.model;
  }catch{}
}
function save(){
  localStorage.setItem(STORE,JSON.stringify({memory:state.memory.slice(-6),memoryEnabled:state.memoryEnabled,provider:state.provider,model:state.model}));
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
    const r=await fetch("/api/cockpit?catalog=1",{headers:{Accept:"application/json"},cache:"no-store"});
    if(!r.ok) throw new Error("HTTP "+r.status);
    state.status=await r.json();
    state.catalog=state.status.catalog||state.catalog;
    state.catalogMeta=state.status.catalog_meta||{};
    renderModelChoice();
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
      body:JSON.stringify({message:trimmed,mode:state.mode,provider:state.provider,model:state.model,workspace:"IFP Expert",memory:state.memoryEnabled?state.memory:[]})
    });
    const data=await r.json();
    wait.remove();
    if(!r.ok){addMessage("system",data.error||("Błąd runtime: HTTP "+r.status));return}
    addMessage("assistant",data.answer,data.route?.workflow?("route: "+data.route.workflow):null);
    state.last=data;renderReceipt(data);
  }catch(err){wait.remove();addMessage("system","Runtime error: "+err.message)}
}

function friendlyModelName(id){
  const tail=String(id||"").split("/").pop()||id;
  return tail.replace(/:free$/,"").replace(/[-_]/g," ").replace(/\b\w/g,c=>c.toUpperCase());
}
function contextLabel(n){
  if(!n)return "";
  return n>=1000000?(Math.round(n/100000)/10+"M ctx"):(Math.round(n/1000)+"K ctx");
}
function renderModelChoice(){
  const kicker=$("[data-model-kicker]"),label=$("[data-model-label]");
  if(!kicker||!label)return;
  if(state.provider==="auto"){
    kicker.textContent="AUTO · IFP ORCHESTRATOR";
    label.textContent="NVIDIA + OpenRouter + Jev";
  }else{
    kicker.textContent=state.provider==="nvidia"?"NVIDIA NIM":"OPENROUTER";
    label.textContent=state.model||"Wybierz model";
  }
}
function openModelSheet(){
  const sheet=$("[data-model-sheet]");if(!sheet)return;
  state.modelTab=state.provider==="auto"?"auto":state.provider;state.search="";
  const q=$("[data-model-search]");if(q)q.value="";
  sheet.hidden=false;renderModelSheet();
}
function closeModelSheet(){const sheet=$("[data-model-sheet]");if(sheet)sheet.hidden=true}
function renderModelSheet(){
  $("[data-provider-tab]").forEach(b=>b.classList.toggle("active",b.dataset.providerTab===state.modelTab));
  const auto=$("[data-auto-panel]"),browser=$("[data-model-browser]");
  if(auto)auto.hidden=state.modelTab!=="auto";
  if(browser)browser.hidden=state.modelTab==="auto";
  if(state.modelTab!=="auto")renderModelList();
}
function renderModelList(){
  const provider=state.modelTab,all=state.catalog[provider]||[];
  const q=state.search.trim().toLowerCase();
  const list=all.filter(m=>!q||String(m.id||"").toLowerCase().includes(q)||String(m.name||"").toLowerCase().includes(q));
  const count=$("[data-model-count]");if(count)count.textContent=list.length+" modeli";
  const note=$("[data-catalog-note]"),meta=(state.catalogMeta&&state.catalogMeta[provider])||{};
  if(note){
    if(meta.error)note.textContent="Katalog live niedostępny — pokazuję fallback.";
    else if(provider==="openrouter")note.textContent="FREE = koszt wejścia i wyjścia 0 w aktualnym katalogu OpenRouter.";
    else note.textContent="Katalog dostępny dla podpiętego klucza NVIDIA.";
  }
  const host=$("[data-model-list]");if(!host)return;
  if(!list.length){host.innerHTML='<div class="model-row"><span><strong>Brak modeli</strong><small>Dodaj klucz providera albo zmień filtr.</small></span></div>';return}
  host.innerHTML=list.map(m=>{
    const selected=state.provider===provider&&state.model===m.id;
    let badges="";
    if(m.free)badges+='<span class="model-badge free">FREE</span>';
    const ctx=contextLabel(m.context_length);if(ctx)badges+='<span class="model-badge">'+esc(ctx)+'</span>';
    if(selected)badges+='<span class="model-badge selected">✓</span>';
    return '<button class="model-row '+(selected?'selected':'')+'" data-model-id="'+esc(m.id)+'" data-model-provider="'+provider+'"><span><strong>'+esc(m.name||friendlyModelName(m.id))+'</strong><small>'+esc(m.id)+'</small></span><span class="model-badges">'+badges+'</span></button>';
  }).join("");
}
function selectAutoRoute(){
  state.provider="auto";state.model=null;save();renderModelChoice();closeModelSheet();
}
function selectConcreteModel(provider,id){
  state.provider=provider;state.model=id;save();renderModelChoice();renderModelSheet();setTimeout(closeModelSheet,100);
}

load();renderMemory();renderModelChoice();getStatus();

$$("[data-mode]").forEach(b=>b.addEventListener("click",()=>setMode(b.dataset.mode)));
$$("[data-preset]").forEach(b=>b.addEventListener("click",()=>setPreset(b.dataset.preset)));
$$("[data-quick]").forEach(b=>b.addEventListener("click",()=>{const input=$("[data-input]");input.value=b.dataset.quick;input.focus()}));
$("[data-memory-toggle]").addEventListener("click",e=>{state.memoryEnabled=!state.memoryEnabled;e.currentTarget.classList.toggle("active",state.memoryEnabled);e.currentTarget.innerHTML=state.memoryEnabled?'<span>●</span> Small Memory ON':'<span>○</span> Small Memory OFF';save()});
$("[data-memory-toggle]").classList.toggle("active",state.memoryEnabled);
$("[data-memory-toggle]").innerHTML=state.memoryEnabled?'<span>●</span> Small Memory ON':'<span>○</span> Small Memory OFF';
$("[data-clear-memory]").addEventListener("click",()=>{state.memory=[];save();renderMemory()});
$("[data-form]").addEventListener("submit",e=>{e.preventDefault();const input=$("[data-input]");const msg=input.value;input.value="";send(msg)});
$("[data-input]").addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();$("[data-form]").requestSubmit()}});
$("[data-model-trigger]")?.addEventListener("click",openModelSheet);
$("[data-model-close]")?.addEventListener("click",closeModelSheet);
$("[data-model-sheet]")?.addEventListener("click",e=>{if(e.target===$("[data-model-sheet]"))closeModelSheet()});
$("[data-provider-tab]").forEach(b=>b.addEventListener("click",()=>{state.modelTab=b.dataset.providerTab;state.search="";const q=$("[data-model-search]");if(q)q.value="";renderModelSheet()}));
$("[data-auto-select]")?.addEventListener("click",selectAutoRoute);
$("[data-model-search]")?.addEventListener("input",e=>{state.search=e.target.value;renderModelList()});
$("[data-model-list]")?.addEventListener("click",e=>{const b=e.target.closest("[data-model-id]");if(b)selectConcreteModel(b.dataset.modelProvider,b.dataset.modelId)});
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeModelSheet()});
})();