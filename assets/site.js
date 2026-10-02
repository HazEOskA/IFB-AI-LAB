const routes = [
  {label:"O Instytucie",path:"/o-instytucie/instytut/",children:[
    ["Instytut","/o-instytucie/instytut/"],
    ["Ludzie","/o-instytucie/ludzie/"],
    ["Klienci","/o-instytucie/klienci/"]
  ]},
  {label:"Szkolenia",path:"/szkolenia/",children:[
    ["Świąteczna Kampania","/kurs_kampania_swiateczna/"],
    ["System Regularnych Darowizn","/system-regularnych-darowizn-w-ngo/"]
  ]},
  {label:"Oferta",path:"/strategie-fundraisingowe/",children:[
    ["Strategie fundraisingowe","/strategie-fundraisingowe/"],
    ["Wdrażanie fundraisingu","/wdrozenie-fundraisingu-program-12-miesieczny/"],
    ["Kampanie fundraisingowe","/kampanie-fundraisingowe/"]
  ]},
  {label:"Blog",path:"/blog/"},
  {label:"Bezpłatna wiedza",path:"/bezplatna-wiedza/",children:[
    ["Bezpłatne ebooki","/bezplatna-wiedza/bezplatne-ebooki/"]
  ]},
  {label:"Sklep",path:"/sklep/"},
  {label:"AI Lab",path:"/ai-lab/"}
];

function basePath(){
  const depth=location.pathname.replace(/index\.html$/,"").split("/").filter(Boolean).length;
  return depth ? "../".repeat(depth).replace(/\/$/,"") : ".";
}
function url(path){
  const base = basePath();
  if(path === "/") return base === "." ? "./" : "../";
  return base + path.slice(0,-1);
}
function mountChrome(){
  const header=document.querySelector("[data-site-header]");
  const footer=document.querySelector("[data-site-footer]");
  if(header){
    header.innerHTML=`
      <a class="skip-link" href="#main">Przejdź do treści</a>
      <div class="site-header"><div class="shell nav">
        <a class="brand" href="${url("/")}">
          <span class="brand-mark">IFP</span>
          <span class="brand-copy">Instytut Fundraisingu<small>w Polsce</small></span>
        </a>
        <button class="menu-toggle" aria-expanded="false" aria-controls="main-nav">Menu</button>
        <nav class="nav-links" id="main-nav" aria-label="Główna nawigacja">
          ${routes.map(item=>item.children
            ? `<div class="nav-group"><a href="${url(item.path)}">${item.label}</a><div class="nav-dropdown">${item.children.map(([label,path])=>`<a href="${url(path)}">${label}</a>`).join("")}</div></div>`
            : `<a href="${url(item.path)}">${item.label}</a>`).join("")}
          <a class="nav-cta" href="${url("/kontakt/")}">Porozmawiajmy</a>
        </nav>
      </div></div>`;
    const toggle=header.querySelector(".menu-toggle");
    const nav=header.querySelector(".nav-links");
    toggle?.addEventListener("click",()=>{
      const open=nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded",String(open));
    });
    const current=location.pathname.replace(/index\.html$/,"");
    [...nav.querySelectorAll("a")].forEach(a=>{
      try{
        if(new URL(a.href).pathname.replace(/index\.html$/,"")===current) a.setAttribute("aria-current","page");
      }catch{}
    });
  }
  if(footer){
    footer.innerHTML=`
      <footer class="footer"><div class="shell">
        <div class="footer-grid">
          <div><a class="brand" href="${url("/")}"><span class="brand-mark">IFP</span><span class="brand-copy">Instytut Fundraisingu<small>w Polsce</small></span></a>
            <p style="max-width:34ch;color:#a9b9b0">Strategia, edukacja i narzędzia dla organizacji, które chcą budować stabilne finansowanie oparte na relacjach z darczyńcami.</p>
          </div>
          <div><strong>Instytut</strong><a href="${url("/o-instytucie/")}">O nas</a><a href="${url("/oferta/")}">Oferta</a><a href="${url("/kontakt/")}">Kontakt</a></div>
          <div><strong>Wiedza</strong><a href="${url("/blog/")}">Blog</a><a href="${url("/bezplatna-wiedza/")}">Bezpłatna wiedza</a><a href="${url("/szkolenia/")}">Szkolenia</a></div>
          <div><strong>AI</strong><a href="${url("/ai-lab/")}">IFP AI Lab</a><a href="${url("/sklep/")}">Narzędzia</a></div>
        </div>
        <div class="credit">Prototype V0.1 · AI concept & system architecture — OsaTechGPT / Bartosz Osiński. Production attribution subject to agreement with Instytut Fundraisingu.</div>
      </div></footer>`;
  }
}
function reveal(){
  const io = new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add("visible")}),{threshold:.08});
  document.querySelectorAll(".reveal").forEach(el=>io.observe(el));
}

const skillDefs = [
  {id:"orchestrator",name:"IFP Orchestrator",desc:"Dobiera następny krok"},
  {id:"persona",name:"Donor Persona",desc:"Kto może wesprzeć NGO"},
  {id:"campaign",name:"Campaign Architect",desc:"Jak zbudować kampanię"},
  {id:"copy",name:"Fundraising Copywriter",desc:"Co i jak powiedzieć"},
  {id:"landing",name:"Landing Architect",desc:"Jak ułożyć stronę"},
  {id:"review",name:"Campaign Reviewer",desc:"Co poprawić przed startem"},
  {id:"pack",name:"Campaign Pack",desc:"Wynik całego procesu"}
];

function defaultState(){
  return {brief:"",goal:"",current:"orchestrator",completed:[],outputs:{}};
}
function loadState(){
  try{return {...defaultState(),...JSON.parse(localStorage.getItem("ifp-lab-v01")||"{}")}}catch{return defaultState()}
}
function saveState(s){localStorage.setItem("ifp-lab-v01",JSON.stringify(s))}
function esc(v){return String(v||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]))}
function short(v,n=90){const s=String(v||"").trim();return s.length>n?s.slice(0,n-1)+"…":s}
function deriveOrg(brief){
  const b=brief.trim();
  if(!b) return "Twoja organizacja";
  const first=b.split(/[.!?\n]/)[0].trim();
  return short(first,54);
}
function campaignType(goal,brief){
  const x=(goal+" "+brief).toLowerCase();
  if(x.includes("świąt")||x.includes("swia")) return "kampania świąteczna";
  if(x.includes("regular")) return "program regularnych darowizn";
  if(x.includes("sprzęt")||x.includes("sprzet")) return "kampania celowa";
  return "kampania pozyskania darczyńców";
}
function createOutput(skill,s){
  const org=deriveOrg(s.brief), type=campaignType(s.goal,s.brief);
  if(skill==="orchestrator") return {
    "Diagnoza":"Brakuje uporządkowanej persony i kolejności działań.",
    "Rekomendowana ścieżka":"Persona → Kampania → Copy → Landing → Review",
    "Pierwszy krok":"Zbuduj Donor Persona na podstawie briefu organizacji."
  };
  if(skill==="persona") return {
    "Persona":"Zaangażowany darczyńca lokalny / cyfrowy",
    "Motywacje":"Widoczny wpływ, zaufanie do organizacji, konkretna historia zmiany",
    "Obiekcje":"Czy pieniądze faktycznie trafią na cel? Czy moja wpłata ma znaczenie?",
    "Język":"Konkretny, ludzki, bez instytucjonalnego żargonu",
    "Kanały":"E-mail, social media, rekomendacje, landing kampanii"
  };
  if(skill==="campaign") return {
    "Typ":type,
    "Cel":s.goal||"Pozyskanie nowych darczyńców i zwiększenie liczby wpłat",
    "Oś komunikacji":`Pokaż konkretny efekt, który może współtworzyć darczyńca ${org}.`,
    "KPI":"wpłaty, koszt pozyskania darczyńcy, konwersja strony, liczba nowych kontaktów",
    "Sekwencja":"Pre-launch → historia → dowód → przypomnienie → finał → podziękowanie"
  };
  if(skill==="copy") return {
    "Główny komunikat":"Nie prosimy o wsparcie abstrakcyjnej instytucji. Pokazujemy konkretną zmianę, którą darczyńca może uruchomić.",
    "E-mail":"Historia jednej osoby / jednego problemu → konkret → prosty CTA.",
    "Social":"Jedna myśl, jeden dowód, jedno wezwanie do działania.",
    "CTA":"Pomóż zrobić kolejny konkretny krok"
  };
  if(skill==="landing") return {
    "Sekcja 1":"Hero: problem + rezultat + jedno CTA",
    "Sekcja 2":"Dlaczego teraz / co się stanie bez działania",
    "Sekcja 3":"Jak wpłata zmienia sytuację — konkretne progi",
    "Sekcja 4":"Dowód zaufania: rezultaty, partnerzy, historie",
    "Sekcja 5":"Obiekcje / transparentność / FAQ + końcowe CTA"
  };
  if(skill==="review") return {
    "Gotowość":"82/100 — koncept gotowy do testu z prawdziwymi danymi",
    "Mocna strona":"Spójna persona i jedna wyraźna oś komunikacji",
    "Ryzyko":"Brak realnych benchmarków konwersji oraz kosztu pozyskania",
    "Do poprawy":"Dodać konkretne dowody, kwoty i dane organizacji przed publikacją",
    "Decyzja":"READY FOR HUMAN REVIEW — nie publikować bez akceptacji fundraisera"
  };
  return {};
}
function nextSkill(id){
  const ids=skillDefs.map(x=>x.id);
  return ids[Math.min(ids.indexOf(id)+1,ids.length-1)];
}
function renderSidebar(state){
  document.querySelectorAll("[data-lab-steps]").forEach(container=>{
    container.innerHTML=skillDefs.map((s,i)=>`
      <button class="skill-step ${state.completed.includes(s.id)?"done":""}" data-skill="${s.id}" ${state.current===s.id?'aria-current="step"':""}>
        <span class="step-num">${i+1}</span><span><strong>${s.name}</strong><small>${s.desc}</small></span>
      </button>`).join("");
  });
  const mobile=document.querySelector("[data-mobile-lab]");
  if(mobile) mobile.innerHTML=skillDefs.map(s=>`<button data-skill="${s.id}">${s.name}</button>`).join("");
}
function renderWorkspace(state){
  const host=document.querySelector("[data-workspace]");
  if(!host) return;
  const def=skillDefs.find(x=>x.id===state.current)||skillDefs[0];
  const out=state.outputs[state.current];
  const route=skillDefs.slice(1,-1).map(s=>`<span class="route-chip ${state.current===s.id?"active":""}">${s.name}</span>`).join("");
  if(state.current==="orchestrator"){
    host.innerHTML=`
      <div class="workspace">
        <span class="eyebrow">IFP AI Fundraising Lab · Orchestrator</span>
        <h2 style="font-size:clamp(42px,5vw,68px)">Opowiedz, co chcesz osiągnąć.</h2>
        <p class="lede">Nie wybierasz modelu ani promptu. Opisujesz organizację i cel, a system układa właściwą ścieżkę pracy.</p>
        <div class="input-card">
          <label for="brief">Organizacja / sytuacja</label>
          <textarea id="brief" placeholder="Np. Prowadzimy lokalne hospicjum. Chcemy pozyskać nowych darczyńców przed świętami…">${esc(state.brief)}</textarea>
          <div class="form-row"><div><label for="goal">Cel kampanii</label><input id="goal" type="text" value="${esc(state.goal)}" placeholder="Np. 60 000 zł na opiekę domową"></div>
          <div><label>Tryb</label><input type="text" value="DEMO V0.1 — bez danych klientów" disabled></div></div>
          <div class="action-row"><button class="button ai" data-run>Uruchom orchestrator</button><button class="button secondary" data-reset>Wyczyść demo</button></div>
          <div class="notice">Prototype: V0.1 nie wysyła treści do żadnego modelu. Pokazuje architekturę i UX przepływu.</div>
        </div>
        ${out?renderOutput(out,"Proponowana ścieżka"):""}
      </div>`;
  } else if(state.current==="pack"){
    const pack=buildPack(state);
    host.innerHTML=`
      <div class="workspace"><span class="eyebrow">Final output</span><h2 style="font-size:clamp(42px,5vw,68px)">Campaign Pack</h2>
      <p class="lede">Jedno miejsce z wynikami wszystkich etapów — gotowe do review z fundraiserem.</p>
      <div class="output-card"><div class="pack">${esc(pack)}</div>
      <div class="action-row"><button class="button primary" data-download> Pobierz .txt </button><button class="button secondary" data-skill="orchestrator">Wróć do początku</button></div></div></div>`;
  } else {
    host.innerHTML=`
      <div class="workspace"><span class="eyebrow">Skill ${String(skillDefs.indexOf(def)).padStart(2,"0")}</span>
      <h1>${def.name}</h1><p class="lede">${def.desc}. Ten etap korzysta z rezultatów poprzednich kroków i przekazuje uporządkowany wynik dalej.</p>
      <div class="route-strip">${route}</div>
      <div class="input-card">
        <strong>Context handoff</strong>
        <p style="color:var(--muted)">${esc(short(state.brief,180)) || "Najpierw uzupełnij brief w Orchestratorze."}</p>
        <div class="action-row"><button class="button ai" data-run>Wykonaj krok demo</button><button class="button secondary" data-skill="${state.current==="persona"?"orchestrator":skillDefs[skillDefs.findIndex(x=>x.id===state.current)-1].id}">Wstecz</button></div>
      </div>
      ${out?renderOutput(out,"Wynik modułu"):""}
      </div>`;
  }
}
function renderOutput(out,title){
  return `<div class="output-card"><h3>${title}</h3><div class="output-grid">${Object.entries(out).map(([k,v])=>`<div class="output-item"><span>${esc(k)}</span><strong>${esc(v)}</strong></div>`).join("")}</div><div class="action-row"><button class="button primary" data-next>Przekaż do następnego kroku →</button></div></div>`;
}
function buildPack(s){
  const blocks=skillDefs.filter(x=>["persona","campaign","copy","landing","review"].includes(x.id)).map(def=>{
    const out=s.outputs[def.id]||{};
    return "\n## "+def.name+"\n"+Object.entries(out).map(([k,v])=>"- "+k+": "+v).join("\n");
  });
  return `IFP AI FUNDRAISING LAB — CAMPAIGN PACK
DEMO V0.1

ORGANIZACJA
${s.brief||"(brak)"}

CEL
${s.goal||"(brak)"}
${blocks.join("\n")}
`;
}
function initLab(){
  if(!document.querySelector("[data-workspace]")) return;
  let state=loadState();
  function draw(){renderSidebar(state);renderWorkspace(state);saveState(state)}
  document.addEventListener("click",e=>{
    const skill=e.target.closest("[data-skill]")?.dataset.skill;
    if(skill){state.current=skill;draw();return}
    if(e.target.closest("[data-reset]")){state=defaultState();draw();return}
    if(e.target.closest("[data-run]")){
      const brief=document.querySelector("#brief"),goal=document.querySelector("#goal");
      if(brief) state.brief=brief.value.trim();
      if(goal) state.goal=goal.value.trim();
      if(state.current==="orchestrator" && state.brief.length<20){
        alert("Dodaj trochę więcej kontekstu o organizacji — minimum jedno pełne zdanie.");
        return;
      }
      state.outputs[state.current]=createOutput(state.current,state);
      if(!state.completed.includes(state.current)) state.completed.push(state.current);
      draw();return;
    }
    if(e.target.closest("[data-next]")){
      const next=nextSkill(state.current);
      state.current=next;
      draw();return;
    }
    if(e.target.closest("[data-download]")){
      const blob=new Blob([buildPack(state)],{type:"text/plain;charset=utf-8"});
      const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="ifp-campaign-pack-demo.txt";a.click();URL.revokeObjectURL(a.href);
    }
  });
  draw();
}

mountChrome();
reveal();
initLab();
