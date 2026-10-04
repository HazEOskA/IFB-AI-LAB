const CACHE="ifp-hermes-shell-v1";
const SHELL=[
  "/admin/cockpit/",
  "/admin/cockpit/manifest.webmanifest",
  "/assets/cockpit.css",
  "/assets/cockpit.js",
  "/assets/cockpit-pwa.js",
  "/assets/hermes-mascot.svg"
];

self.addEventListener("install",event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting()));
});

self.addEventListener("activate",event=>{
  event.waitUntil(
    caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener("fetch",event=>{
  const request=event.request;
  if(request.method!=="GET")return;
  const url=new URL(request.url);

  if(url.pathname.startsWith("/api/"))return;

  if(request.mode==="navigate"&&url.pathname.startsWith("/admin/cockpit")){
    event.respondWith(
      fetch(request).then(response=>{
        const copy=response.clone();
        caches.open(CACHE).then(cache=>cache.put("/admin/cockpit/",copy));
        return response;
      }).catch(()=>caches.match("/admin/cockpit/"))
    );
    return;
  }

  if(url.origin===location.origin){
    event.respondWith(
      caches.match(request).then(cached=>cached||fetch(request).then(response=>{
        const copy=response.clone();
        caches.open(CACHE).then(cache=>cache.put(request,copy));
        return response;
      }))
    );
  }
});