(()=>{
  let deferredPrompt=null;
  const button=document.querySelector("[data-install-app]");
  const note=document.querySelector("[data-install-note]");
  const standalone=window.matchMedia("(display-mode: standalone)").matches||window.navigator.standalone===true;

  function hideInstall(){
    if(button)button.hidden=true;
    if(note&&standalone)note.textContent="Hermes działa już w trybie aplikacji.";
  }

  if("serviceWorker" in navigator){
    window.addEventListener("load",()=>{
      navigator.serviceWorker.register("/admin/cockpit/sw.js",{scope:"/admin/cockpit/"}).catch(()=>{});
    });
  }

  if(standalone){
    hideInstall();
  }else{
    window.addEventListener("beforeinstallprompt",event=>{
      event.preventDefault();
      deferredPrompt=event;
      if(button)button.hidden=false;
      if(note)note.textContent="Możesz zainstalować Hermesa jako osobną aplikację.";
    });
  }

  button?.addEventListener("click",async()=>{
    if(!deferredPrompt)return;
    button.disabled=true;
    try{
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
    }finally{
      deferredPrompt=null;
      button.disabled=false;
      button.hidden=true;
    }
  });

  window.addEventListener("appinstalled",()=>{
    deferredPrompt=null;
    hideInstall();
  });
})();