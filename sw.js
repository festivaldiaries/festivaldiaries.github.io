// Festival Diaries offline + speed:
//  • files with a version (app.js?v=…, data.js?v=…) and posters never change → served from the phone instantly;
//    when a new version is saved, the old copies of that file are deleted
//  • pages: the saved copy opens instantly (works offline) while a fresh copy downloads in the background for next time
//    (the app's "New version ready" bar then offers the update)
//  • Google sign-in code: saved after first use
//  • everything else (sw.js, manifest, icons, the app's update check) goes to the network as normal
const C = 'fd-v3';
const pageKey = u => u.origin + u.pathname;   // one saved copy per page, whatever its ?query
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k !== C) await caches.delete(k);
  // tidy up after older versions of this file: drop stale app files and query-string copies of pages
  const c = await caches.open(C), newest = {};
  for (const req of await c.keys()) {
    const u = new URL(req.url);
    if (u.origin !== location.origin || u.pathname.includes('/posters/')) continue;
    if (u.searchParams.has('v')) { (newest[u.pathname] = newest[u.pathname] || []).push(req); continue; }
    if (u.search || u.pathname.endsWith('/sw.js')) await c.delete(req);
  }
  for (const reqs of Object.values(newest)) for (const req of reqs.slice(0, -1)) await c.delete(req);   // keys come oldest first
  await self.clients.claim();
})()));
async function save(key, res) {
  if (!res || !(res.ok || res.type === 'opaque')) return res;
  const c = await caches.open(C), copy = res.clone(), u = new URL(typeof key === 'string' ? key : key.url);
  if (u.origin === location.origin && u.searchParams.has('v'))   // a new version of app.js etc.: forget the old ones
    for (const old of await c.keys()) { const o = new URL(old.url); if (o.pathname === u.pathname && o.search !== u.search) c.delete(old); }
  await c.put(key, copy);
  return res;
}
const cacheFirst = r => caches.match(r).then(c => c || fetch(r).then(res => save(r, res)));
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin === location.origin) {
    if (u.searchParams.has('v') || u.pathname.includes('/posters/')) { e.respondWith(cacheFirst(r)); return; }
    if (r.mode !== 'navigate' || u.searchParams.has('fdu')) return;
    const key = pageKey(u);
    const fresh = fetch(r.url, { cache: 'no-cache', credentials: 'same-origin' })
      .then(res => res.redirected ? Response.redirect(res.url, 302) : save(key, res));
    e.waitUntil(fresh.catch(() => {}));
    e.respondWith(caches.match(key).then(c => c || fresh.catch(() =>
      caches.match(new URL('./', self.registration.scope).href).then(x => x || Response.error()))));
  } else if (u.hostname === 'www.gstatic.com' && u.pathname.startsWith('/firebasejs/')) {
    e.respondWith(cacheFirst(r));
  }
});
