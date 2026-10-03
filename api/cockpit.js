const crypto = require("crypto");

const JEV_MODEL = process.env.JEV_MODEL || "typesafe/jev-1.13";
const NVIDIA_MODEL = process.env.NVIDIA_MODEL || "openai/gpt-oss-120b";
const OPENROUTER_MODEL = process.env.OPENROUTER_CHAT_MODEL || "openai/gpt-oss-120b:free";

function json(res,status,body){
  res.setHeader("Cache-Control","no-store");
  res.setHeader("Content-Type","application/json; charset=utf-8");
  return res.status(status).json(body);
}
function sha(value){return crypto.createHash("sha256").update(String(value)).digest("hex")}
function validModel(value){return typeof value==="string"&&/^[a-zA-Z0-9._:/-]{2,180}$/.test(value)}
async function fetchJson(url,options,timeout=22000){
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),timeout);
  try{
    const r=await fetch(url,{...options,signal:controller.signal});
    const text=await r.text();
    let data={};try{data=JSON.parse(text)}catch{data={raw:text}}
    if(!r.ok){const err=new Error(data?.error?.message||data?.message||("HTTP "+r.status));err.status=r.status;err.data=data;throw err}
    return data;
  }finally{clearTimeout(timer)}
}
function parseBody(req){
  if(!req.body) return {};
  if(typeof req.body==="object") return req.body;
  try{return JSON.parse(req.body)}catch{return {}}
}
function fallbackWorkflow(message){
  const s=message.toLowerCase();
  if(/europe|ue|grant|dotac|wniosek|fundusz/.test(s)) return "eu_funding";
  if(/mentoring|kursant|rozmow|konsult/.test(s)) return "mentoring";
  if(/raport|podsum|analiz/.test(s)) return "report";
  if(/plan|roadmap|harmonogram|priorytet/.test(s)) return "plan";
  if(/dokument|strateg|brief|ofert|tłum|tlum|translate/.test(s)) return "document";
  if(/materiał|material|slajd|workbook|ćwiczen|cwiczen|lekcj|quiz/.test(s)) return "training_material";
  return "general_advice";
}
function codeAuthority(message){
  const s=message.toLowerCase();
  const sideEffect=/(wyślij|wyslij|opublikuj|złóż wniosek|zloz wniosek|submit|send email|usuń|usun|delete|zapłać|zaplac|purchase)/.test(s);
  return sideEffect?{status:"REVIEW_REQUIRED",reason:"external_side_effect"}:{status:"ALLOWED_DRAFT",reason:"analysis_or_draft_only"};
}
async function jevRoute(message,mode,workspace,memory){
  if(!process.env.OPENROUTER_API_KEY){
    return {workflow:fallbackWorkflow(message),source:"fallback",confidence:null,external_action_probability:null,model:null};
  }
  const data=await fetchJson("https://openrouter.ai/api/alpha/decisions",{
    method:"POST",
    headers:{Authorization:"Bearer "+process.env.OPENROUTER_API_KEY,"Content-Type":"application/json","HTTP-Referer":"https://ifb-ai-lab.vercel.app","X-Title":"IFP Expert Cockpit"},
    body:JSON.stringify({
      model:JEV_MODEL,
      state:{message,mode,workspace,memory:(memory||[]).slice(-6)},
      questions:{
        workflow:{
          type:"choice",
          instructions:"Choose the single primary IFP Expert workflow needed to handle the user's current request.",
          criteria:{
            training_material:"Create or structure teaching materials, slides, workbook, exercise, quiz or homework.",
            mentoring:"Prepare mentoring, consultation, client or student conversation and diagnostic questions.",
            report:"Analyze supplied information and produce a factual report, summary or progress review.",
            plan:"Create an action plan, roadmap, priorities, milestones or schedule.",
            document:"Draft, transform, review or translate a business or fundraising document.",
            eu_funding:"Analyze an EU/grant/funding call, eligibility requirements or application documentation.",
            general_advice:"General expert discussion that does not fit the other workflows."
          }
        },
        external_action:{
          type:"noul",
          instructions:"Does the user ask the system to perform an external side effect such as sending, publishing, submitting, deleting, purchasing, or changing an external system?"
        },
        human_review:{
          type:"noul",
          instructions:"Does this request require expert human review because it concerns eligibility, legal/compliance interpretation, grant submission, or a consequential external action?"
        }
      }
    })
  },12000);
  const w=data.answers?.workflow;
  const ext=data.answers?.external_action;
  const review=data.answers?.human_review;
  return {
    workflow:w?.choice||fallbackWorkflow(message),
    source:"jev",
    confidence:typeof w?.confidence==="number"?Number(w.confidence.toFixed(3)):null,
    probabilities:w?.probabilities||null,
    external_action_probability:typeof ext?.noul==="number"?Number(ext.noul.toFixed(3)):null,
    human_review_probability:typeof review?.noul==="number"?Number(review.noul.toFixed(3)):null,
    model:data.model||JEV_MODEL,
    decision_id:data.id||null,
    cost_usd:data.usage?.cost??null
  };
}
function systemPrompt(route,mode){
  return [
    "You are IFP Expert Copilot for an experienced fundraising expert.",
    "Answer in Polish unless the user explicitly asks for another language.",
    "You are an engineering-grade assistant, not a motivational chatbot.",
    "Never invent organization facts, donor statistics, grant eligibility, deadlines, legal rules, or program requirements.",
    "When facts are missing, mark them as BRAK DANYCH. Distinguish FAKT / ZAŁOŻENIE / REKOMENDACJA where useful.",
    "For EU/grant work, treat only supplied official documentation as authoritative; if it is absent, state exactly what must be verified.",
    "Do not claim you sent, submitted, published, deleted, purchased, or changed anything externally.",
    "End operational outputs with 3 concrete next actions.",
    "Current workflow: "+route+". Mode: "+mode+"."
  ].join("\n");
}
async function callNvidia(message,route,mode,memory,model){
  if(!process.env.NVIDIA_API_KEY) throw new Error("NVIDIA_API_KEY not configured");
  const messages=[{role:"system",content:systemPrompt(route,mode)}];
  if(memory?.length) messages.push({role:"system",content:"Small scoped memory (user-provided recent context):\n- "+memory.slice(-6).join("\n- ")});
  messages.push({role:"user",content:message});
  const data=await fetchJson("https://integrate.api.nvidia.com/v1/chat/completions",{
    method:"POST",headers:{Authorization:"Bearer "+process.env.NVIDIA_API_KEY,"Content-Type":"application/json"},
    body:JSON.stringify({model:validModel(model)?model:NVIDIA_MODEL,messages,temperature:.25,max_tokens:1800,stream:false})
  });
  return {provider:"nvidia",model:data.model||(validModel(model)?model:NVIDIA_MODEL),text:data.choices?.[0]?.message?.content||"",usage:data.usage||null};
}
async function callOpenRouter(message,route,mode,memory,model){
  if(!process.env.OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY not configured");
  const messages=[{role:"system",content:systemPrompt(route,mode)}];
  if(memory?.length) messages.push({role:"system",content:"Small scoped memory (user-provided recent context):\n- "+memory.slice(-6).join("\n- ")});
  messages.push({role:"user",content:message});
  const data=await fetchJson("https://openrouter.ai/api/v1/chat/completions",{
    method:"POST",
    headers:{Authorization:"Bearer "+process.env.OPENROUTER_API_KEY,"Content-Type":"application/json","HTTP-Referer":"https://ifb-ai-lab.vercel.app","X-Title":"IFP Expert Cockpit"},
    body:JSON.stringify({model:validModel(model)?model:OPENROUTER_MODEL,messages,temperature:.25,max_tokens:1800})
  });
  return {provider:"openrouter",model:data.model||(validModel(model)?model:OPENROUTER_MODEL),text:data.choices?.[0]?.message?.content||"",usage:data.usage||null};
}

async function getOpenRouterCatalog(){
  try{
    const data=await fetchJson("https://openrouter.ai/api/v1/models",{headers:{Accept:"application/json"}},10000);
    const models=(data.data||[]).map(m=>{
      const p=m.pricing||{};
      const free=Number(p.prompt||0)===0&&Number(p.completion||0)===0;
      return {id:m.id,name:m.name||m.id,context_length:m.context_length||null,free};
    }).filter(m=>validModel(m.id));
    models.sort((a,b)=>Number(b.free)-Number(a.free)||String(a.name).localeCompare(String(b.name)));
    return {models:models.slice(0,140),meta:{live:true,total:models.length}};
  }catch(err){
    return {models:[{id:OPENROUTER_MODEL,name:OPENROUTER_MODEL,context_length:null,free:OPENROUTER_MODEL.endsWith(":free")}],meta:{live:false,error:String(err.message||err)}};
  }
}
async function getNvidiaCatalog(){
  if(!process.env.NVIDIA_API_KEY){
    return {models:[{id:NVIDIA_MODEL,name:NVIDIA_MODEL,context_length:null,free:true}],meta:{live:false,error:"NVIDIA_API_KEY missing"}};
  }
  try{
    const data=await fetchJson("https://integrate.api.nvidia.com/v1/models",{headers:{Authorization:"Bearer "+process.env.NVIDIA_API_KEY,Accept:"application/json"}},10000);
    const models=(data.data||[]).map(m=>({id:m.id,name:m.id,context_length:m.context_length||null,free:true})).filter(m=>validModel(m.id));
    return {models:(models.length?models:[{id:NVIDIA_MODEL,name:NVIDIA_MODEL,context_length:null,free:true}]).slice(0,120),meta:{live:true,total:models.length}};
  }catch(err){
    return {models:[{id:NVIDIA_MODEL,name:NVIDIA_MODEL,context_length:null,free:true}],meta:{live:false,error:String(err.message||err)}};
  }
}

function demoAnswer(route,gate){
  const labels={
    training_material:"MATERIAŁY SZKOLENIOWE",mentoring:"MENTORING",report:"RAPORT",plan:"PLAN",
    document:"DOKUMENT",eu_funding:"EU FUNDING",general_advice:"DORADCA"
  };
  return [
    "DEMO RUNTIME — provider generatywny nie jest jeszcze podpięty kluczem.",
    "",
    "ROUTE: "+(labels[route]||route),
    "AUTHORITY: "+gate.status,
    "",
    "Runtime i routing działają. Żeby ten krok generował treść live, dodaj NVIDIA_API_KEY i/lub OPENROUTER_API_KEY do środowiska Vercel.",
    "",
    "3 następne działania:",
    "1. Dodaj klucz providera do env.",
    "2. Uruchom ten sam prompt ponownie i sprawdź receipt.",
    "3. Po pierwszych 10–20 runach porównaj jakość routingu Jev z ręcznie oznaczonym workflow."
  ].join("\n");
}

module.exports = async function handler(req,res){
  if(req.method==="GET"){
    const runtime={
      jev:Boolean(process.env.OPENROUTER_API_KEY),
      nvidia:Boolean(process.env.NVIDIA_API_KEY),
      openrouter:Boolean(process.env.OPENROUTER_API_KEY),
    };
    runtime.ready=runtime.nvidia||runtime.openrouter;
    const payload={ok:true,runtime,models:{jev:JEV_MODEL,nvidia:NVIDIA_MODEL,openrouter:OPENROUTER_MODEL},version:"IFP_RUNTIME_V0.2"};
    if(String(req.query?.catalog||"")==="1"){
      const [nvidiaCatalog,openrouterCatalog]=await Promise.all([getNvidiaCatalog(),getOpenRouterCatalog()]);
      payload.catalog={nvidia:nvidiaCatalog.models,openrouter:openrouterCatalog.models};
      payload.catalog_meta={nvidia:nvidiaCatalog.meta,openrouter:openrouterCatalog.meta};
    }
    return json(res,200,payload);
  }
  if(req.method!=="POST") return json(res,405,{error:"Method not allowed"});

  const body=parseBody(req);
  const message=String(body.message||"").trim();
  const mode=body.mode==="agent"?"agent":"chat";
  const preferred=["auto","nvidia","openrouter"].includes(body.provider)?body.provider:"auto";
  const selectedModel=validModel(body.model)?body.model:null;
  const memory=Array.isArray(body.memory)?body.memory.map(String).slice(-6):[];
  const workspace=String(body.workspace||"IFP Expert").slice(0,80);
  if(message.length<2) return json(res,400,{error:"Message is required"});
  if(message.length>20000) return json(res,413,{error:"Message too long"});

  const started=Date.now();
  const executionId="ifp_"+crypto.randomUUID();
  const inputDigest=sha(JSON.stringify({message,mode,workspace,memory,preferred,selectedModel}));
  const gate=codeAuthority(message);
  let route;
  try{route=await jevRoute(message,mode,workspace,memory)}
  catch(err){route={workflow:fallbackWorkflow(message),source:"fallback_after_jev_error",confidence:null,error:String(err.message||err)}}

  if(route.external_action_probability!=null && route.external_action_probability>=0.65){
    gate.status="REVIEW_REQUIRED";gate.reason="jev_external_side_effect";
  }

  let generation=null;const errors=[];
  const order=preferred==="nvidia"?["nvidia"]:preferred==="openrouter"?["openrouter"]:["nvidia","openrouter"];
  for(const p of order){
    try{
      if(p==="nvidia"&&process.env.NVIDIA_API_KEY){generation=await callNvidia(message,route.workflow,mode,memory,preferred==="nvidia"?selectedModel:null);break}
      if(p==="openrouter"&&process.env.OPENROUTER_API_KEY){generation=await callOpenRouter(message,route.workflow,mode,memory,preferred==="openrouter"?selectedModel:null);break}
    }catch(err){errors.push(p+":"+String(err.message||err))}
  }

  const answer=(generation?.text||"").trim()||demoAnswer(route.workflow,gate);
  const receipt={
    execution_id:executionId,
    runtime_version:"IFP_RUNTIME_V0.2",
    mode,
    workflow:route.workflow,
    route_source:route.source,
    jev_model:route.model||null,
    jev_confidence:route.confidence??null,
    requested_provider:preferred,
    requested_model:selectedModel,
    provider:generation?.provider||"demo",
    model:generation?.model||null,
    authority_gate:gate.status,
    authority_reason:gate.reason,
    input_digest:inputDigest,
    output_digest:sha(answer),
    latency_ms:Date.now()-started,
    verified:"EXECUTION_RECORDED",
    provider_errors:errors.length?errors:undefined
  };
  return json(res,200,{ok:true,answer,route,receipt});
};