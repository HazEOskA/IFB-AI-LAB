(()=>{
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const STORE="ifp_cockpit_v03";
const state={mode:"chat",provider:"auto",model:null,modelTab:"auto",search:"",catalog:{nvidia:[],openrouter:[]},catalogMeta:{},memoryEnabled:true,memory:[],status:null,last:null};

function esc(s=""){return String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]))}
function load(){
  try{
    const x=JSON.parse(localStorage.getItem(STORE)||"{}");
    if(Array.isArray(x.memory))state.memory=x.memory.slice(-6);
    if(typeof x.memoryEnabled==="boolean")state.memoryEnabled=x.memoryEnabled;
    if(["auto","nvidia","openrouter"].includes(x.provider))state.provider=x.provider;
    if(typeof x.model==="string"||x.model===null)state.model=x.model;
  }catch{}
}
function save(){localStorage.setItem(STORE,JSON.stringify({memory:state.memory.slice(-6),memoryEnabled:state.memoryEnabled,provider:state.provider,model:state.model}))}
function renderMemory(){
  const host=$("[data-memory-list]"); if(!host)return;
  if(!state.memory.length){host.innerHTML="<p>Brak zapisanych ustaleń.</p>";return}
  host.innerHTML=state.memory.slice().reverse().map(x=>'<div class="memory-item">'+esc(x)+'</div>').join("");
}
function addMessage(role,text,route){
  const host=$("[data-chat]"); if(!host)return null;
  const welcome=$(".welcome",host); if(welcome)welcome.remove();
  const el=document.createElement("div"); el.className="message "+role;
  const label=role==="user"?"MARTYNA":role==="assistant"?"IFP EXPERT":"SYSTEM";
  el.innerHTML='<div class="meta">'+label+'</div><div class="bubble">'+esc(text)+(route?'<div><span class="route-chip">'+esc(route)+'</span></div>':"")+'</div>';
  host.appendChild(el); host.scrollTop=host.scrollHeight; return el;
}
function typing(){
  const host=$("[data-chat]"); if(!host)return null;
  const welcome=$(".welcome",host); if(welcome)welcome.remove();
  const el=document.createElement("div"); el.className="message assistant";
  el.innerHTML='<div class="meta">IFP EXPERT</div><div class="bubble"><div class="typing"><i></i><i></i><i></i></div></div>';
  host.appendChild(el); host.scrollTop=host.scrollHeight; return el;
}
function setMode(mode){
  state.mode=mode;
  $$("[data-mode]").forEach(b=>b.classList.toggle("active",b.dataset.mode===mode));
}
function renderModelChoice(){
  const title=$(".app-title strong");
  if(!title)return;
  title.textContent=state.provider==="auto"?"IFP Expert":state.provider==="nvidia"?"IFP Expert · NVIDIA":"IFP Expert · OpenRouter";
}
function setInspector(open){
  const panel=$("[data-inspector]"),backdrop=$("[data-inspector-backdrop]");
  if(!panel)return;
  panel.classList.toggle("open",open);
  panel.setAttribute("aria-hidden",String(!open));
  if(backdrop)backdrop.hidden=!open;
}
async function getStatus(){
  try{
    const r=await fetch("/api/cockpit?catalog=1",{headers:{Accept:"application/json"},cache:"no-store"});
    if(!r.ok)throw new Error("HTTP "+r.status);
    state.status=await r.json();
    state.catalog=state.status.catalog||state.catalog;
    state.catalogMeta=state.status.catalog_meta||{};
    const rt=state.status.runtime||{};
    const rs=$("[data-runtime-status]"); if(rs)rs.textContent=rt.ready?"LIVE":"DEMO";
    $("[data-runtime-dot]")?.classList.toggle("live",!!rt.ready);
    const set=(sel,on)=>{const el=$(sel);if(!el)return;el.textContent=on?"READY":"OFF";el.className=on?"on":"off"};
    set("[data-jev-status]",rt.jev);set("[data-nvidia-status]",rt.nvidia);set("[data-openrouter-status]",rt.openrouter);
    renderModelChoice();
  }catch(err){
    const rs=$("[data-runtime-status]"); if(rs)rs.textContent="OFFLINE";
  }
}
function renderReceipt(data){
  const r=data.receipt||{};
  const set=(sel,val)=>{const el=$(sel);if(el)el.textContent=val??"—"};
  set("[data-route]",data.route?.workflow);
  set("[data-jev]",data.route?.source?((data.route.source==="jev"?"JEV ":"FALLBACK ")+(data.route.confidence??"")):"—");
  set("[data-used-provider]",r.provider);set("[data-model]",r.model);set("[data-gate]",r.authority_gate);
  const pre=$("[data-receipt]");if(pre)pre.textContent=JSON.stringify(r,null,2);
}
async function send(message){
  const trimmed=String(message||"").trim(); if(!trimmed)return;
  addMessage("user",trimmed);
  if(state.memoryEnabled){state.memory.push(trimmed.slice(0,220));state.memory=state.memory.slice(-6);save();renderMemory()}
  const wait=typing();
  try{
    const r=await fetch("/api/cockpit",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
      message:trimmed,mode:state.mode,provider:state.provider,model:state.model,workspace:"IFP Expert",memory:state.memoryEnabled?state.memory:[]
    })});
    const data=await r.json();
    wait?.remove();
    if(!r.ok){addMessage("system",data.error||("Błąd runtime: HTTP "+r.status));return}
    addMessage("assistant",data.answer,data.route?.workflow?("route: "+data.route.workflow):null);
    state.last=data;renderReceipt(data);
  }catch(err){
    wait?.remove();addMessage("system","Runtime error: "+err.message);
  }
}
function contextLabel(n){if(!n)return"";return n>=1000000?(Math.round(n/100000)/10+"M ctx"):(Math.round(n/1000)+"K ctx")}
function openModelSheet(){
  const sheet=$("[data-model-sheet]");if(!sheet)return;
  state.modelTab=state.provider==="auto"?"auto":state.provider;state.search="";
  const q=$("[data-model-search]");if(q)q.value="";
  sheet.hidden=false;renderModelSheet();
}
function closeModelSheet(){const sheet=$("[data-model-sheet]");if(sheet)sheet.hidden=true}
function renderModelSheet(){
  $$("[data-provider-tab]").forEach(b=>b.classList.toggle("active",b.dataset.providerTab===state.modelTab));
  const auto=$("[data-auto-panel]"),browser=$("[data-model-browser]");
  if(auto)auto.hidden=state.modelTab!=="auto";
  if(browser)browser.hidden=state.modelTab==="auto";
  if(state.modelTab!=="auto")renderModelList();
}
function renderModelList(){
  const provider=state.modelTab,all=state.catalog[provider]||[],q=state.search.trim().toLowerCase();
  const list=all.filter(m=>!q||String(m.id||"").toLowerCase().includes(q)||String(m.name||"").toLowerCase().includes(q));
  const count=$("[data-model-count]");if(count)count.textContent=list.length+" modeli";
  const note=$("[data-catalog-note]"),meta=(state.catalogMeta&&state.catalogMeta[provider])||{};
  if(note)note.textContent=meta.error?"Katalog live niedostępny.":provider==="openrouter"?"FREE = aktualnie 0 kosztu wejścia i wyjścia.":"Katalog NVIDIA z podpiętego klucza.";
  const host=$("[data-model-list]");if(!host)return;
  if(!list.length){host.innerHTML='<div class="model-row"><span><strong>Brak modeli</strong><small>Zmień filtr lub providera.</small></span></div>';return}
  host.innerHTML=list.map(m=>{
    const selected=state.provider===provider&&state.model===m.id;
    let badges=""; if(m.free)badges+='<span class="model-badge free">FREE</span>';
    const ctx=contextLabel(m.context_length);if(ctx)badges+='<span class="model-badge">'+esc(ctx)+'</span>';
    return '<button class="model-row '+(selected?"selected":"")+'" data-model-id="'+esc(m.id)+'" data-model-provider="'+provider+'"><span><strong>'+esc(m.name||m.id)+'</strong><small>'+esc(m.id)+'</small></span><span class="model-badges">'+badges+'</span></button>';
  }).join("");
}
function selectAutoRoute(){state.provider="auto";state.model=null;save();renderModelChoice();closeModelSheet()}
function selectConcreteModel(provider,id){state.provider=provider;state.model=id;save();renderModelChoice();setTimeout(closeModelSheet,80)}

load();renderMemory();renderModelChoice();getStatus();

$$("[data-mode]").forEach(b=>b.addEventListener("click",()=>setMode(b.dataset.mode)));
$$("[data-quick]").forEach(b=>b.addEventListener("click",()=>{const input=$("[data-input]");if(input){input.value=b.dataset.quick;input.focus()}}));
$("[data-memory-toggle]")?.addEventListener("click",e=>{
  state.memoryEnabled=!state.memoryEnabled;e.currentTarget.classList.toggle("active",state.memoryEnabled);
  e.currentTarget.innerHTML=state.memoryEnabled?'<span>●</span> Small Memory':'<span>○</span> Small Memory OFF';save()
});
$("[data-clear-memory]")?.addEventListener("click",()=>{state.memory=[];save();renderMemory()});
$("[data-form]")?.addEventListener("submit",e=>{e.preventDefault();const input=$("[data-input]");if(!input)return;const msg=input.value;input.value="";send(msg)});
$("[data-input]")?.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();$("[data-form]")?.requestSubmit()}});
$("[data-inspector-trigger]")?.addEventListener("click",()=>setInspector(true));
$("[data-inspector-close]")?.addEventListener("click",()=>setInspector(false));
$("[data-inspector-backdrop]")?.addEventListener("click",()=>setInspector(false));
$("[data-model-trigger]")?.addEventListener("click",openModelSheet);
$("[data-model-close]")?.addEventListener("click",closeModelSheet);
$("[data-model-sheet]")?.addEventListener("click",e=>{if(e.target===$("[data-model-sheet]"))closeModelSheet()});
$$("[data-provider-tab]").forEach(b=>b.addEventListener("click",()=>{state.modelTab=b.dataset.providerTab;state.search="";const q=$("[data-model-search]");if(q)q.value="";renderModelSheet()}));
$("[data-auto-select]")?.addEventListener("click",selectAutoRoute);
$("[data-model-search]")?.addEventListener("input",e=>{state.search=e.target.value;renderModelList()});
$("[data-model-list]")?.addEventListener("click",e=>{const b=e.target.closest("[data-model-id]");if(b)selectConcreteModel(b.dataset.modelProvider,b.dataset.modelId)});
document.addEventListener("keydown",e=>{if(e.key==="Escape"){closeModelSheet();setInspector(false)}});
})();