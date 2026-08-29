const CACHE='vysefit-v1';
const PRECACHE=['/app','/manifest.json','/icon.svg'];
self.addEventListener('install', e=>{ e.waitUntil(caches.open(CACHE).then(c=>c.addAll(PRECACHE))); self.skipWaiting(); });
self.addEventListener('activate', e=>{ e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', e=>{
  const url=new URL(e.request.url);
  if(e.request.mode==='navigate'){ e.respondWith(fetch(e.request).catch(()=>caches.match('/app'))); return; }
  if(url.pathname.startsWith('/_next/static/')||url.pathname.match(/\.(js|css|woff2|png|svg|jpg)$/)){ e.respondWith(caches.match(e.request).then(r=> r|| fetch(e.request).then(res=>{ caches.open(CACHE).then(c=>c.put(e.request,res.clone())); return res; }))); return; }
  if(url.pathname.startsWith('/api/')){ e.respondWith(fetch(e.request).catch(()=>caches.match(e.request))); return; }
});
