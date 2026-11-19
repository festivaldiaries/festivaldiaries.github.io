/* ---------- storage ---------- */
const KEY = 'iffi-diary-v1';
const DEFAULT_VENUES = ['INOX Panaji (Old GMC)','INOX Porvorim','Maquinez Palace','Kala Academy','Ashok Samrat','Magic Movies Ponda','Ravindra Bhavan Margao','Other'];
const DEFAULT_SECTIONS = ['International Competition','Best Debut Feature','ICFT UNESCO Gandhi Medal','Indian Panorama – Feature','Indian Panorama – Non-Feature','Indian Panorama','Cinema of the World','Festival Kaleidoscope','Mission Life','Country Focus','Restored Classics','Retrospective','Homage','Gala Premiere','Opening Film','Closing Film','Other'];

/* Storage: the film list always comes from data.js; the phone keeps only your own marks (a few KB). */
const _tk = t => String(t||'').trim().toLowerCase();
const _sk = s => [s.date,s.time,s.venue].join('|');
/* Official schedule revised 19 Nov 2026: screenings that moved. Old marks follow the film to its new slot. */
const MOVED = {"the huntress": {"2026-11-25|16:30|INOX Panaji": "2026-11-23|12:15|INOX Panaji"}, "pray for us": {"2026-11-23|12:15|INOX Panaji": "2026-11-22|20:30|INOX Panaji"}, "paris, paris": {"2026-11-27|16:00|Ravindra Bhavan, Margao": "2026-11-27|13:00|Ravindra Bhavan, Margao"}, "salvation": {"2026-11-27|16:00|Samrat Ashok": "2026-11-27|16:30|Samrat Ashok"}, "nunkui": {"2026-11-22|20:30|INOX Panaji": "2026-11-25|16:30|INOX Panaji"}, "trainspotting": {"2026-11-21|16:00|Samrat Ashok": "2026-11-27|13:00|Samrat Ashok"}, "come with me": {"2026-11-27|16:30|Samrat Ashok": "2026-11-27|16:00|Samrat Ashok"}, "the shadow’s edge": {"2026-11-27|20:30|INOX Panaji": "2026-11-21|19:00|INOX Panaji"}, "hold onto me": {"2026-11-22|10:00|INOX Porvorim": "2026-11-22|10:00|Ravindra Bhavan, Margao"}, "ulya": {"2026-11-27|13:00|Samrat Ashok": "2026-11-21|16:00|Samrat Ashok"}, "heil jupiter": {"2026-11-21|19:00|INOX Panaji": "2026-11-27|20:30|INOX Panaji"}, "new home": {"2026-11-23|16:00|Ravindra Bhavan, Margao": "2026-11-23|16:30|Ravindra Bhavan, Margao"}, "krishnavataram part 1: the heart": {"2026-11-26|13:15|INOX Porvorim": "2026-11-26|13:30|INOX Porvorim"}, "urum": {"2026-11-22|17:15|INOX Porvorim": "2026-11-22|19:15|INOX Porvorim"}, "bhakta kannappa": {"2026-11-22|14:00|INOX Porvorim": "2026-11-22|16:15|INOX Porvorim"}, "kathar katha": {"2026-11-23|13:00|Ravindra Bhavan, Margao": "2026-11-23|13:30|Ravindra Bhavan, Margao"}, "surjyamukhi": {"2026-11-23|13:00|Ravindra Bhavan, Margao": "2026-11-23|13:30|Ravindra Bhavan, Margao"}, "shakuntala": {"2026-11-22|15:30|INOX Panaji": "2026-11-22|15:45|INOX Panaji"}, "carlos suara, the kid in the photo": {"2026-11-22|18:30|INOX Panaji": "2026-11-22|18:40|INOX Panaji"}, "too many beasts": {"2026-11-22|10:00|Ravindra Bhavan, Margao": "2026-11-22|10:00|INOX Porvorim"}, "amit atal": {"2026-11-26|16:15|INOX Porvorim": "2026-11-26|16:30|INOX Porvorim"}, "the hug of emptiness": {"2026-11-26|16:15|INOX Porvorim": "2026-11-26|16:30|INOX Porvorim"}, "the unseen holy river – saraswati": {"2026-11-26|16:15|INOX Porvorim": "2026-11-26|16:30|INOX Porvorim"}, "waqt": {"2026-11-27|13:00|Ravindra Bhavan, Margao": "2026-11-27|16:00|Ravindra Bhavan, Margao"}, "mog asum": {"2026-11-27|19:00|Ravindra Bhavan Open Lawns, Margao": "2026-11-22|19:00|Vagator Beach (Helipad)"}};
function moveMarks(title,e){ const mv=MOVED[_tk(title)]; if(!mv||!e) return e; const r={...e}; if(e.s){ r.s={}; for(const k in e.s) r.s[mv[k]||k]=e.s[k]; } if(e.wa&&mv[e.wa]) r.wa=mv[e.wa]; return r; }
const _slug = t => String(t||'').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
function officialVer(){ const t=window.__OFFICIAL||document.getElementById('official')?.textContent||''; return '5:'+t.length+':'+((t.match(/"fetched":"([^"]*)"/)||[])[1]||''); }
function officialList(){ try{ return JSON.parse(window.__OFFICIAL||document.getElementById('official')?.textContent||'{}').movies||[]; }catch(e){ return []; } }
let _offSet = null;
const MARK_KEYS = ['status','priority','rating','liked','review','watchedOn'];
function fromCompact(d){
  const marks=d.marks||{}, ratings=d.ratings||{};
  const movies = officialList().map(o=>{
    const m = {rating:0, ...o, status:o.status||'none', id:'f-'+_slug(o.title), screenings:(o.screenings||[]).map(x=>({...x}))};
    const e = moveMarks(m.title, marks[_tk(m.title)]);
    if(e){ for(const k of MARK_KEYS) if(e.f && e.f[k]!==undefined) m[k]=e.f[k];
      for(const x of m.screenings){ const r=e.s?.[_sk(x)]; if(r && (r.going||r.booked)) x.going=true; }
      if(e.wa) m.watchedAt = m.screenings.find(x=>_sk(x)===e.wa)?.id; }
    if(ratings[_tk(m.title)]) m.ratings = ratings[_tk(m.title)];
    return m;
  });
  return {movies: movies.concat(d.custom||[]), venues:d.venues||[...DEFAULT_VENUES], sections:d.sections||[...DEFAULT_SECTIONS], omdbKey:d.omdbKey, officialVer:officialVer()};
}
function load(){
  let d=null; try{ d = JSON.parse(localStorage.getItem(KEY)); }catch(e){}
  if(d && d.v===2) return fromCompact(d);
  if(d && d.movies && d.movies.length) return {venues:DEFAULT_VENUES, sections:DEFAULT_SECTIONS, ...d};   // older full copy: tidied on next save
  return fromCompact({});
}
function save(){
  try{
    const off = _offSet ||= new Set(officialList().map(o=>_tk(o.title))), marks={}, ratings={}, custom=[];
    for(const m of db.movies){
      if(!off.has(_tk(m.title))){ custom.push(m); continue; }
      const e = localMark(m); if(e) marks[_tk(m.title)] = e;
      if(m.ratings) ratings[_tk(m.title)] = m.ratings;
    }
    localStorage.setItem(KEY, JSON.stringify({v:2, marks, ratings, custom, venues:db.venues, sections:db.sections, omdbKey:db.omdbKey, officialVer:db.officialVer}));
  }catch(e){ toast('Could not save – storage blocked'); }
}
let db = load();
const uid = () => Math.random().toString(36).slice(2,10);

/* ---------- helpers ---------- */
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dt = s => new Date(`${s.date}T${s.time || '00:00'}`);
const fmtTime = d => d.toLocaleTimeString([], {hour:'numeric', minute:'2-digit'});
const fmtDay = d => d.toLocaleDateString([], {weekday:'long', day:'numeric', month:'short'});
const fmtShort = d => d.toLocaleDateString([], {weekday:'short', day:'numeric', month:'short'});
const runtime = m => +m.runtime || 120;
const endOf = (m,s) => new Date(dt(s).getTime() + (+s.dur || runtime(m))*60000);   // s.dur = whole programme when films are shown together
const stars = r => r ? '★'.repeat(Math.floor(r)) + (r%1 ? '½' : '') : '';
function toast(t){ const el=$('#toast'); el.textContent=t; el.classList.add('show'); clearTimeout(toast._t); toast._t=setTimeout(()=>el.classList.remove('show'),2200); }
function hue(str){ let h=0; for(const c of str) h=(h*31+c.charCodeAt(0))%360; return h; }
function poster(m, mini, large){
  if(m.poster) return `<div class="poster"><img src="${esc(large&&m.posterL||m.poster)}"${m.pc?` style="inset:auto;left:${m.pc[2]}%;top:${m.pc[3]}%;width:${m.pc[0]}%;height:${m.pc[1]}%;object-fit:fill"`:''} alt="" loading="lazy" decoding="async" onerror="this.remove()">${mini?'':placeholder(m,true)}</div>`;
  return `<div class="poster">${placeholder(m, false, mini)}</div>`;
}
function placeholder(m, behind, mini){
  const h = hue(m.title||'x');
  return `<div class="ph" style="background:linear-gradient(160deg,hsl(${h} 18% 30%),hsl(${h} 12% 15%));${mini?'font-size:9px;padding:4px':''}">${mini?'':esc(m.title)}${mini?'':`<small>${esc(m.director||'')}</small>`}</div>`;
}
const now = () => new Date();
const localISO = (d=new Date()) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

/* ---------- derived ---------- */
function allScreenings(){
  const out=[];
  for(const m of db.movies) for(const s of (m.screenings||[])) if(s.date) out.push({m,s,start:dt(s),end:endOf(m,s)});
  return out.sort((a,b)=>a.start-b.start);
}
function clashes(){ return new Set(clashInfo().keys()); }
/* For every planned show that clashes: which film it clashes with, and why (times overlap, or not enough time to get between venues). */
function clashInfo(){
  const active = allScreenings().filter(x => x.m.status!=='watched' && (x.s.booked || x.s.going));
  const out = new Map(), add = (id,t) => { if(!out.has(id)) out.set(id,[]); out.get(id).push(t); };
  const vname = x => venueOf(x.s.venue)?.name || x.s.venue || 'venue TBA';
  const when = x => `${fmtTime(x.start)}–${fmtTime(x.end)}`;
  for(let i=0;i<active.length;i++) for(let j=i+1;j<active.length;j++){
    const a=active[i], b=active[j];   // a starts first
    const va=venueOf(a.s.venue), vb=venueOf(b.s.venue), need=travelMin(va,vb), gap=Math.round((b.start-a.end)/60000);
    if(gap >= need) continue;
    if(gap < 0){
      const ov = Math.round((Math.min(a.end,b.end)-b.start)/60000);
      add(a.s.id, `Overlaps “${b.m.title}” (${when(b)}, ${vname(b)}) by ${ov} min`);
      add(b.s.id, `Overlaps “${a.m.title}” (${when(a)}, ${vname(a)}) by ${ov} min`);
    } else {
      const same = va && vb && (va.id===vb.id || kmBetween(va,vb)<1.2);
      const trip = same ? `allow at least 15` : `~${need} min drive, ${Math.max(1,Math.round(kmBetween(va,vb)*1.4))} km`;
      add(a.s.id, `Too tight before “${b.m.title}” (starts ${fmtTime(b.start)}, ${vname(b)}): only ${gap} min to get there (${trip})`);
      add(b.s.id, `Too tight after “${a.m.title}” (ends ${fmtTime(a.end)}, ${vname(a)}): only ${gap} min to get here (${trip})`);
    }
  }
  return out;
}
/* Your plan, for warning on a showtime BEFORE you tap it */
function planCtx(){ const ci=clashInfo(), n=now(); return Object.assign(new Set(ci.keys()),{info:ci, plan:allScreenings().filter(x=>x.s.going && x.m.status!=='watched' && x.end>n)}); }
function wouldClash(x, plan){   // the first planned show (other film) this one can't be combined with
  let best=null;
  for(const y of plan||[]){ if(y.m===x.m) continue;
    const {gap,need}=dpGap(x,y); if(gap>=need) continue;
    const vx=venueOf(x.s.venue), vy=venueOf(y.s.venue), far = gap>=0 && vx && vy && vx.id!==vy.id && kmBetween(vx,vy)>=1.2;
    const w={y, far, gap, need, why: gap<0 ? `Overlaps “${y.m.title}” (${fmtTime(y.start)}–${fmtTime(y.end)})` : far ? `Only ${gap} min to get from ${(x.start<y.start?vy:vx).name} – it’s ~${need} min away (“${y.m.title}”, ${fmtTime(y.start)})` : `Only ${gap} min between this and “${y.m.title}” (${fmtTime(y.start)})`};
    if(!best || (gap<0 && best.gap>=0)) best=w;
  }
  return best;
}
const clashHtml = (ci,id) => (ci.get(id)||[]).map(t=>`<div class="pwarn">⚠️ ${esc(t)}</div>`).join('');
function nextScreening(m){ const n=now(); return (m.screenings||[]).filter(s=>s.date).map(s=>({s,start:dt(s)})).filter(x=>x.start>n).sort((a,b)=>a.start-b.start)[0]; }
const CONF = 'Screening confirmed';
const confirmInfo = m => m.confirmed?.on ? m.confirmed : ((m.screenings||[]).find(s=>s.source) ? {on:true, source:(m.screenings.find(s=>s.source)).source, label:'Showtime source'} : null);
const allTags = m => [...(confirmInfo(m)?[CONF]:[]), ...(m.tags||[])];
const tagOK = m => !state.tag || allTags(m).includes(state.tag);
const isUrl = v => /^https?:\/\//i.test(v||'');
const srcLink = (v,label='Source') => !v ? '' : isUrl(v) ? `<a href="${esc(v)}" target="_blank" rel="noopener">${esc(label)} ↗</a>` : `<span title="Source">${esc(v)}</span>`;
function matches(m){
  const q = state.q.trim().toLowerCase(); if(!q) return true;
  return [m.title,m.originalTitle,m.genre,m.director,m.country,m.language,m.section,m.notes,m.cast,allTags(m).join(' ')].join(' ').toLowerCase().includes(q);
}

/* ---------- state + routing ---------- */
let DETAIL=null, detailP=null;
function ensureDetails(){
  if(DETAIL || !window.__DETAIL_URL) return Promise.resolve();
  return detailP ||= new Promise(res=>{ const sc=document.createElement('script'); sc.src=window.__DETAIL_URL; sc.async=true;
    sc.onload=()=>{ DETAIL=window.__DETAIL||{}; applyDetails(); res(); }; sc.onerror=()=>{ detailP=null; res(); }; document.head.appendChild(sc); });
}
function applyDetails(){ if(!DETAIL) return; for(const m of db.movies){ const d=DETAIL[_tk(m.title)]; if(d) for(const k in d) if(m[k]===undefined||m[k]===''||m[k]===null) m[k]=d[k]; } }
function officialText(){ return window.__OFFICIAL || document.getElementById('official')?.textContent || ''; }
const state = { view: 'all', q:'', showPast:false, onlyMine:false, venue:'', section:'', tag:'', mineTab:'want' };
try{ Object.assign(state, JSON.parse(localStorage.getItem(KEY+'-ui')||'{}'), {q:'', view:'all'}); }catch(e){}
for(const m of db.movies||[]) for(const x of m.screenings||[]){ if(x.booked) x.going=true; delete x.booked; delete x.seat; }
let _fest0;
const festStart = () => _fest0 ??= Math.min(...allScreenings().map(x=>x.start.getTime()).filter(Boolean), Infinity);
const festOn = () => now().getTime() >= festStart() - 2*3600e3;   // shows begin (2 h ahead, like "Now")
function signinLabel(){ let was=false; try{ was=localStorage.getItem('fd-was')==='1'||localStorage.getItem('fd-in')==='1'; }catch(e){} const t=document.getElementById('signinTxt'); if(t) t.textContent = was ? 'Sign in' : 'Sign up'; }
signinLabel();
const GLOGO = `<svg class="glogo" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>`;
const guestNote = () => { if(cloud.user || !db.movies.some(m=>m.status==='want'||m.status==='watched')) return ''; try{ if(localStorage.getItem('fd-gn-x')) return ''; }catch(e){}
  return `<div class="gnote"><svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3.5l7 3v5c0 4.5-3 8-7 9-4-1-7-4.5-7-9v-5z"/></svg><span>Saved on this phone. <b>Sign in</b> to keep it on all your devices.</span><button class="gbtn" onclick="askSignIn()" aria-label="Sign in with Google">${GLOGO}Sign in</button><button class="gn-x" aria-label="Dismiss" title="Dismiss" onclick="gnHide()">×</button></div>`; };
function gnHide(){ try{ localStorage.setItem('fd-gn-x','1'); }catch(e){} document.querySelectorAll('.gnote').forEach(e=>e.remove()); }
const playNudge = () => `<div class="empty"><h3>Not sure where to start?</h3>Play This or That – pick between films you know, and get a festival top 10 for your taste.<div style="margin-top:14px"><button class="btn primary" onclick="openTaste()">Play This or That</button></div></div>`;
const hasShows = () => db.movies.some(m=>(m.screenings||[]).some(s=>s.date));
function setView(v, fromRoute){ const ch=state.view!==v; state.view=v; persistUI(); if(!fromRoute){ const u=ROOT+(VIEW_PATH[v]||''); if(location.href!==u) history.pushState({view:v},'',u); } syncTitle(); if(ch) window.scrollTo(0,0); render(); }
/* ---------- URLs ----------
   ./               Discover        film/<slug>/   a film (opens over the current page)
   schedule/        Schedule        venue/<id>/    a venue
   my-list/         My Watchlist                                                      */
const ROOT = document.baseURI.replace(/[?#].*$/,'').replace(/[^/]*$/,'');
const VIEW_PATH = {all:'', schedule:'schedule/', mine:'my-list/', fest:'festival-darlings/'};
const VIEW_NAME = {all:'', schedule:'Schedule', mine:'My Shortlist', fest:'Festival darlings'};
const SITE = 'Festival Diaries · Goa';
const filmURL = m => ROOT+'film/'+slug(m.title)+'/';
const venueURL = v => ROOT+'venue/'+v.id+'/';
function routeOf(href){
  href = href||location.href; let p = href.startsWith(ROOT) ? href.slice(ROOT.length) : '';
  p = p.replace(/[?#].*$/,'').replace(/index\.html$/,''); let r;
  if((r=p.match(/^film\/([^/]+)\/?$/))) return {film:decodeURIComponent(r[1])};
  if((r=p.match(/^venue\/([^/]+)\/?$/))) return {venue:decodeURIComponent(r[1])};
  if(/^privacy\/?$/.test(p)) return {privacy:true};
  if(/^how-to\/?$/.test(p)) return {howto:true};
  if(/^play\/?$/.test(p)){ const q=(href.split('?')[1]||'').split('#')[0]; return {play:true, by:new URLSearchParams(q).get('by')||''}; }
  if(/^list\/?$/.test(p)){ const q=(href.split('?')[1]||'').split('#')[0]; const sp=new URLSearchParams(q); return {list:sp.get('f')||'', by:sp.get('n')||''}; }
  if(/^schedule\/?$/.test(p)) return {view:'schedule'};
  if(/^my-list\/?$/.test(p)) return {view:'mine'};
  if(/^festival-darlings\/?$/.test(p)) return {view:'fest'};
  return {view:'all', unknown:p!==''};
}
function syncTitle(){
  const r=routeOf(), m=r.film&&db.movies.find(x=>slug(x.title)===r.film), v=r.venue&&venueById(r.venue);
  const t = m ? m.title : v ? v.name : r.privacy ? 'Privacy & your data' : r.howto ? 'How to use' : r.play ? 'This or That' : r.list!==undefined ? listTitle(r.by) : VIEW_NAME[r.view||state.view];
  document.title = t ? t+' · '+SITE : SITE;
}
function openRoute(r){
  if(r.film){ const m=db.movies.find(x=>slug(x.title)===r.film); if(m){ openDetail(m.id); return true; } }
  if(r.venue && venueById(r.venue)){ openVenue(r.venue); return true; }
  if(r.privacy){ openPrivacy(); return true; }
  if(r.howto){ openHowto(); return true; }
  if(r.play){ if(tgLoad()) openTaste(true); else openTaste(false, r.by); return true; }
  if(r.list!==undefined){ openSharedList(r.list, r.by); return true; }
  return false;
}
// Startup: work out the page from the URL (also handles old #film= links and GitHub's 404 redirect)
function initRoute(){
  try{ const red=sessionStorage.getItem('fd-redirect'); if(red){ sessionStorage.removeItem('fd-redirect'); if(red.startsWith(ROOT)) history.replaceState(null,'',red); } }catch(e){}
  const hf=(location.hash.match(/film=([^&]+)/)||[])[1], hv=(location.hash.match(/venue=([^&]+)/)||[])[1];
  if(hf) history.replaceState(null,'',ROOT+'film/'+hf+'/'); else if(hv) history.replaceState(null,'',ROOT+'venue/'+hv+'/');
  const r=routeOf();
  if(r.film||r.venue||r.privacy||r.howto||r.play||r.list!==undefined){ initRoute.pending=r; history.replaceState({view:'all'},'',ROOT); state.view='all'; }
  else { state.view=r.view; history.replaceState({view:r.view},'',ROOT+VIEW_PATH[r.view]+(r.unknown?'':location.search)); }
}
initRoute();
function persistUI(){ try{ localStorage.setItem(KEY+'-ui', JSON.stringify({view:state.view,showPast:state.showPast,onlyMine:state.onlyMine,mineTab:state.mineTab})); }catch(e){} }

$('#home').onclick = e => { if(e.metaKey||e.ctrlKey||e.shiftKey) return; e.preventDefault(); if($('#sheet')?.classList.contains('open')) closeSheet(true); if($('#scrim').classList.contains('open')) closeModal(true); state.q=''; $('#q').value=''; state.genre=state.country=state.section=state.venue=''; state.now=false; setView('all'); window.scrollTo({top:0,behavior:'smooth'}); };
$('#tabs').onclick = e => { const b=e.target.closest('a'); if(!b || e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||e.button) return; e.preventDefault(); setView(b.dataset.v); };
$('#q').oninput = e => { state.q = e.target.value; render(); };
$('#menuBtn').onclick = e => { e.stopPropagation(); const o=$('#menu').classList.toggle('open'); $('#menuBtn').setAttribute('aria-expanded', o); };
document.addEventListener('click', ()=>$('#menu').classList.remove('open'));
$('#menu .dd').onclick = e => { const a=e.target.closest('[data-a]')?.dataset.a; if(a) menuAction(a); };
$('#scrim').onclick = e => { if(e.target.id==='scrim') closeModal(); };
document.addEventListener('keydown', e => {
  if(e.key==='Escape'){ if($('#sheet').classList.contains('open')) closeSheet(); else closeModal(); $('#menu').classList.remove('open'); }
  if((e.key==='Enter'||e.key===' ') && document.activeElement?.dataset?.pid && !e.target.closest('.bm')){ e.preventDefault(); openDetail(document.activeElement.dataset.pid); }
  if(e.key==='/' && document.activeElement.tagName!=='INPUT' && document.activeElement.tagName!=='TEXTAREA'){ e.preventDefault(); $('#q').focus(); }
});

/* ---------- render ---------- */
function render(){
  const _hl=()=>document.querySelectorAll('#tabs a').forEach(b=>{ const on=b.dataset.v===(state.view==='fest'?'all':state.view); b.classList.toggle('on', on); if(on) b.setAttribute('aria-current','page'); else b.removeAttribute('aria-current'); });
  const n=now();
  const shows = hasShows(); document.body.classList.toggle('noshows', !shows);
  state.now=false;   // the Now filter was removed
  $('#n-mine').textContent = db.movies.filter(m=>m.status==='want').length;
  _hl();
  const v = {schedule:renderSchedule, mine:renderMine, fest:renderFest}[state.view] || (()=>renderGrid('all'));
  const y=window.scrollY; $('#main').innerHTML = v(); tick(); if(y) window.scrollTo(0,y);
  initVenueMap();
  const ds=document.querySelector('.dstrip'), on=ds?.querySelector('.dtile.on'); if(on && ds.scrollWidth>ds.clientWidth) ds.scrollLeft = on.offsetLeft - ds.offsetLeft - ds.clientWidth/2 + on.offsetWidth/2;
}

/* ---------- venues ---------- */
const VENUES = [
  {id:'inox-panaji', lat:15.49868, lon:73.82117, g:'pan', travel:'', name:'INOX Panaji', area:'Panaji', kind:'cinema', re:/inox.*(panaji|gmc)|old gmc|gmc heritage/i, map:'INOX Panaji, Old GMC Heritage Precinct, Panaji, Goa', about:'PVR INOX Panjim, the main festival hub in the Old GMC Heritage Precinct, with four screens (Audi 1–4). Free delegate rickshaws: service lane in front of Old GMC.'},
  {id:'maquinez', lat:15.49947, lon:73.82134, g:'pan', travel:'Next to INOX Panaji', name:'Maquinez Palace', area:'Panaji', kind:'cinema', re:/maquinez/i, map:'Maquinez Palace, Entertainment Society of Goa, Panaji, Goa', about:'A heritage screening venue inside the Entertainment Society of Goa (ESG) complex, next to INOX Panaji.'},
  {id:'samrat-ashoka', lat:15.49707, lon:73.82385, g:'pan', travel:'Short walk from INOX Panaji', name:'Samrat Ashok', area:'Panaji', kind:'cinema', re:/samrat|ashoka?\b/i, map:'Samrat Ashok Cinema, Dada Vaidya Road, Panaji, Goa', about:'Twin screens, Samrat and Ashok, on Dada Vaidya Road. Free delegate rickshaws stop in front of Samrat Theatre.'},
  {id:'inox-porvorim', lat:15.52562, lon:73.82732, g:'por', travel:'About 20 min drive from INOX Panaji', name:'INOX Porvorim', area:'Porvorim', kind:'cinema', re:/porvorim|mall de goa/i, map:'INOX Mall De Goa, Porvorim, Goa', about:'PVR INOX Porvorim: four screens (Audi 1–4) inside Mall De Goa. Free delegate rickshaws: side lane of Mall De Goa. Delegate bus Route 1 ends here.'},
  {id:'ravindra-margao', lat:15.28506, lon:73.96253, g:'mar', travel:'About 55 min drive from INOX Panaji', name:'Ravindra Bhavan', area:'Margao', kind:'cinema', re:/ravindra(?!.*open)/i, map:'Ravindra Bhavan, Fatorda, Margao, Goa', about:'The main South Goa screening venue, in Fatorda. Delegate bus Route 3 runs here from Panaji.'},
  {id:'magic-ponda', approx:true, lat:15.40355, lon:74.01017, g:'pon', travel:'About 1 hr drive from INOX Panaji', name:'Magic Moviez', area:'Ponda', kind:'cinema', re:/magic movie|ponda/i, map:'Magic Moviez, Ponda, Goa', about:'One festival film every evening at 6 PM, 21–27 Nov. Delegate bus Route 2 runs here from Panaji.'},
  {id:'miramar', lat:15.4766, lon:73.80668, g:'pan', travel:'10 min drive from INOX Panaji', name:'Miramar Beach', area:'Panaji', kind:'open', re:/miramar/i, map:'Miramar Beach, Panaji, Goa', about:'Free open-air screening every evening at 7 PM, 21–27 Nov.'},
  {id:'vagator', lat:15.59765, lon:73.73349, g:'nor', travel:'About 45 min drive from INOX Panaji', name:'Vagator Beach (Helipad)', area:'North Goa', kind:'open', re:/vagator/i, map:'Vagator Beach Helipad, Goa', about:'Free open-air screening every evening at 7 PM, 21–27 Nov.'},
  {id:'ravindra-open', lat:15.28506, lon:73.96253, g:'mar', travel:'About 55 min drive from INOX Panaji', name:'Ravindra Bhavan Open Lawns', area:'Margao', kind:'open', re:/ravindra.*open|open.*ravindra/i, map:'Ravindra Bhavan, Fatorda, Margao, Goa', about:'Free open-air screening every evening at 7 PM, 21–27 Nov, on the lawns of Ravindra Bhavan.'},
  {id:'kala-academy', lat:15.49421, lon:73.81741, g:'pan', travel:'5 min drive from INOX Panaji', name:'Kala Academy', area:'Campal, Panaji', kind:'event', re:/kala academy/i, map:'Kala Academy, Campal, Panaji, Goa', about:'Masterclasses, panel discussions and in-conversation sessions, 21–27 Nov, at 11:30 AM and 2:30 PM. Free delegate rickshaws stop in front of Kala Academy.'},
  {id:'spm-stadium', approx:true, lat:15.47027, lon:73.82257, g:'evt', travel:'10 min drive from INOX Panaji', name:'Dr. Shyama Prasad Mukherjee Indoor Stadium', area:'Taleigao', kind:'event', re:/mukherjee|indoor stadium|taleigao/i, map:'Dr. Shyama Prasad Mukherjee Indoor Stadium, Taleigao, Goa', about:'Closing ceremony on 28 Nov, from 5 PM.'},
  {id:'taj-cidade', lat:15.45614, lon:73.81422, g:'evt', travel:'15 min drive from INOX Panaji', name:'Taj Cidade de Goa Horizon', area:'Dona Paula', kind:'event', re:/cidade|taj\b/i, map:'Taj Cidade de Goa Horizon, Dona Paula, Goa', about:'Official curtain-raiser events and select press gatherings.'},
];
/* ---------- talks & ceremonies (official IFFI 2026 schedule) ---------- */
const EVENTS = [
  {d:'2026-11-21',t:'11:30',e:'13:00',v:'kala-academy',k:'In conversation',title:'The Moral Universe of Parallel Cinema: 50 Years of Girish Kasaravalli',who:'Speaker: Girish Kasaravalli · Moderator: Naman Ramachandran'},
  {d:'2026-11-21',t:'14:30',e:'16:00',v:'kala-academy',k:'In conversation',title:'From Witness to Change: The Social Responsibility of Documentary Cinema',who:'Speaker: Julie Bertuccelli · Moderator: Haobam Paban Kumar'},
  {d:'2026-11-22',t:'11:30',e:'13:00',v:'kala-academy',k:'Session',title:'Session 3 – details on the official IFFI website or app'},
  {d:'2026-11-22',t:'14:30',e:'16:30',v:'kala-academy',k:'Round table',title:'The Unteachable Frame: Can Cinema Be Taught or Must It Be Discovered?',who:'Speakers: Dhiraj Singh, Santosh Ajmera, Anupam Kher, Amala Akkineni, Artur Zaborski, Manoj Paramahamsa · Moderator: Vikramjit Roy'},
  {d:'2026-11-23',t:'11:30',e:'13:00',v:'kala-academy',k:'Panel discussion',title:'Goa in Cinema',who:'Speakers: Abhishek Pathak, Marianne Borgo, Rajendra Talak · Moderator: Sachin Chatte'},
  {d:'2026-11-23',t:'14:30',e:'16:00',v:'kala-academy',k:'In conversation',title:'The Epic Genres – Mythologies, Superheroes & New Worlds',who:'Speakers: Ayan Mukerji, Basil Joseph · Moderator: Puja Talwar'},
  {d:'2026-11-24',t:'11:30',e:'13:00',v:'kala-academy',k:'Panel discussion',title:'Her Lens, Her Legacy, Her Liberty: Women Shaping World Cinema',who:'Speakers: Narghiza Dotieva, Alina Șerban, Suzanne Andrews Correa · Moderator: Abhishek Jain'},
  {d:'2026-11-24',t:'14:30',e:'16:00',v:'kala-academy',k:'Masterclass',title:'The Thin Borders Between Reality and Fiction',who:'Speaker: Bogdan Mureșanu'},
  {d:'2026-11-25',t:'11:30',e:'13:00',v:'kala-academy',k:'Retrospective',title:'Lata Mangeshkar Talk: The Voice that Echoes Forever – in memory of Asha Bhosle & S Janaki',who:'Speaker: K. S. Chithra · Moderator: Suhasini Maniratnam'},
  {d:'2026-11-25',t:'14:30',e:'16:00',v:'kala-academy',k:'Masterclass',title:'Words Across Borders: Subtitling Across Cultures',who:'Speaker: Rekhs'},
  {d:'2026-11-26',t:'11:30',e:'13:00',v:'kala-academy',k:'Masterclass',title:'The Casting Magic: Auditions Unplugged',who:'Speaker: Mukesh Chhabra'},
  {d:'2026-11-26',t:'14:30',e:'16:00',v:'kala-academy',k:'Masterclass',title:'Decoding Academy Awards',who:'Speaker: Natalie Wade'},
  {d:'2026-11-27',t:'11:30',e:'13:00',v:'kala-academy',k:'Panel discussion',title:'The Legendary 25s',who:'Speakers: Farhan Akhtar, Ashutosh Gowariker, Madhur Bhandarkar · Moderator: Khushboo Sundar'},
  {d:'2026-11-27',t:'14:30',e:'16:00',v:'kala-academy',k:'Interview session',title:'What If the Villain Is Right? The Unconventional Filmmaker Karthik Subbaraj',who:'Speaker: Karthik Subbaraj · Moderator: Sudhir Srinivasan'},
  {d:'2026-11-28',t:'17:00',v:'spm-stadium',k:'Ceremony',title:'Closing Ceremony'},
];
const evStart = e => new Date(`${e.d}T${e.t}`);
const evEnd = e => e.e ? new Date(`${e.d}T${e.e}`) : new Date(evStart(e).getTime()+150*60000);
const evRow = (e, card) => `<div class="evrow ${card?'card-ev':''}"><span class="vt"><b>${fmtTime(evStart(e))}</b><small>${e.e?'– '+fmtTime(evEnd(e)):'onwards'}</small></span><span class="vm"><small class="evk">${esc(e.k)}${card?' · '+esc(venueById(e.v)?.name||''):''}</small><b>${esc(e.title)}</b>${e.who?`<small>${esc(e.who)}</small>`:''}</span></div>`;
const VKIND = {cinema:'Cinema', open:'Open-air', event:'Events & ceremonies'};
const VGROUPS = [['pan','Panaji','The festival hub – these venues are close together'],['por','Porvorim',''],['mar','Margao','South Goa'],['pon','Ponda','Central Goa'],['nor','North Goa beaches','Open-air evening screenings'],['evt','Ceremonies & events','']];
const kmBetween = (a,b) => { const R=6371, r=Math.PI/180, dLa=(b.lat-a.lat)*r, dLo=(b.lon-a.lon)*r; const h=Math.sin(dLa/2)**2+Math.cos(a.lat*r)*Math.cos(b.lat*r)*Math.sin(dLo/2)**2; return 2*R*Math.asin(Math.sqrt(h)); };
// minutes needed between two shows: same building/cluster 15, otherwise rough road time + 10
const travelMin = (va,vb) => { if(!va||!vb) return 15; if(va.id===vb.id) return 15; const km=kmBetween(va,vb); return km<1.2 ? 15 : Math.round(km*1.4*2.2+10); };
const venueOf = v => { if(!v) return null; const o=VENUES.find(x=>x.id==='ravindra-open'); if(o.re.test(v)) return o; return VENUES.find(x=>x.re.test(v)) || null; };
const venueById = id => VENUES.find(x=>x.id===id);
const venueShows = vid => allScreenings().filter(x=>venueOf(x.s.venue)?.id===vid);
const VICON = {cinema:'<rect x="3" y="5" width="18" height="12" rx="2"/><path d="M8 21h8M12 17v4"/>', open:'<circle cx="12" cy="9" r="3.5"/><path d="M12 2.5v1.5M12 14v1.5M5.5 9H4M20 9h-1.5M7.4 4.4l1 1M15.6 4.4l-1 1M3 20c3-2 6-2 9 0s6 2 9 0"/>', event:'<path d="M12 3.6l2.6 5.2 5.8.9-4.2 4.1 1 5.7L12 16.8l-5.2 2.7 1-5.7-4.2-4.1 5.8-.9z"/>'};
const vIcon = (k,sz=20) => `<svg viewBox="0 0 24 24" width="${sz}" height="${sz}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${VICON[k]}</svg>`;
function venuesStrip(){
  const has = hasShows();
  return `<h2 class="sec-h">Venues <span>${VENUES.length}</span></h2><div class="vstrip">${VENUES.map(v=>{ const n=has?new Set(venueShows(v.id).map(x=>x.m.id)).size:0; return `<button class="vcard" onclick="openVenue('${v.id}')"><span class="vic k-${v.kind}">${vIcon(v.kind)}</span><span class="vtx"><b>${esc(v.name)}</b><small>${esc(v.area)} · ${n?n+' film'+(n>1?'s':''):VKIND[v.kind]}</small></span></button>`; }).join('')}</div>`;
}
const dayWord = d => { const t=localISO(), k=localISO(d), tm=localISO(new Date(Date.now()+864e5)); return k===t?'Today':k===tm?'Tomorrow':fmtShort(d); };
function venueNext(vid){ const n=now(); return venueShows(vid).find(x=>x.end>n); }
function renderVenues(){
  const has = hasShows(), n = now();
  let h = `<div class="vmapwrap"><div id="vmap" role="region" aria-label="Map of festival venues"></div><button class="mapfs" onclick="mapFull(true)" aria-label="Full screen map"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg><span>Full screen</span></button><button class="mapx" onclick="mapFull(false)" aria-label="Close full screen map"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg><span>Close</span></button><div class="mapkey" aria-hidden="true"><span><i style="background:#3E4EB0"></i>Cinema</span><span><i style="background:#D08A1E"></i>Open-air</span><span><i style="background:#0E5A60"></i>Events</span></div></div>`;
  for(const [g,label,sub] of VGROUPS){
    const vs = VENUES.filter(v=>v.g===g); if(!vs.length) continue;
    h += `<div class="vgroup"><h2 class="sec-h">${esc(label)} <span>${sub?esc(sub):vs.length+' venue'+(vs.length>1?'s':'')}</span></h2><div class="vlist">`;
    h += vs.map(v=>{
      const nx = has && venueNext(v.id), live = nx && nx.start<=n;
      const line2 = nx ? `<span class="vnext ${live?'live':''}">${live?'Now: ':'Next: '}${live?'':dayWord(nx.start)+' · '+fmtTime(nx.start)+' · '}${esc(nx.m.title)}</span>` : `<small>${esc(v.travel||'')}</small>`;
      return `<button class="vitem" onclick="openVenue('${v.id}')"><span class="vic k-${v.kind}">${vIcon(v.kind)}</span><span class="vtx"><b>${esc(v.name)}</b><small class="vk">${VKIND[v.kind]}${nx&&v.travel?' · '+esc(v.travel):''}</small>${line2}</span><svg class="chev" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 6l6 6-6 6"/></svg></button>`;
    }).join('') + `</div></div>`;
  }
  return h;
}
let _lf=null;
function initVenueMap(){
  const el=$('#vmap'); if(!el) return;
  const go=()=>{ if(!el.isConnected || el._done) return; el._done=1;
    const L=window.L, map=L.map(el,{scrollWheelZoom:false, tap:true, attributionControl:true, zoomSnap:0.25, zoomDelta:0.5}); el._map=map;
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18, attribution:'© OpenStreetMap'}).addTo(map);
    const col={cinema:'#3E4EB0', open:'#D08A1E', event:'#0E5A60'}, pts=[];
    for(const v of VENUES){ if(v.id==='ravindra-open') continue; pts.push([v.lat,v.lon]);
      L.circleMarker([v.lat,v.lon],{radius:9, color:'#fff', weight:2, fillColor:col[v.kind], fillOpacity:1}).addTo(map)
        .bindTooltip(v.name+(v.id==='ravindra-margao'?' (+ open space)':'')+(v.approx?' – approx. location':''),{direction:'top', offset:[0,-8]})
        .on('click',()=>openVenue(v.id)); }
    el._pts=pts; map.invalidateSize(); map.fitBounds(pts,{paddingTopLeft:[18,56],paddingBottomRight:[18,50]}); };
  if(window.L) return go();
  if(!_lf){ _lf=new Promise((ok,no)=>{ const c=document.createElement('link'); c.rel='stylesheet'; c.href='https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css'; document.head.appendChild(c);
    const sc=document.createElement('script'); sc.src='https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js'; sc.onload=ok; sc.onerror=no; document.head.appendChild(sc); }); }
  _lf.then(go).catch(()=>{ el.parentNode.style.display='none'; });
}
function mapFull(on){
  const w=$('.vmapwrap'), el=$('#vmap'); if(!w) return;
  if(on===w.classList.contains('fs')) return;
  w.classList.toggle('fs', on); document.body.style.overflow = on ? 'hidden' : '';
  if(on && !history.state?.mapfs) history.pushState({mapfs:1},'');
  if(!on && history.state?.mapfs && mapFull._fromBack!==true) history.back();
  mapFull._fromBack=false;
  if(el?._map){ setTimeout(()=>{ el._map.invalidateSize(); el._map.fitBounds(el._pts,on?{paddingTopLeft:[40,70],paddingBottomRight:[40,70]}:{paddingTopLeft:[18,56],paddingBottomRight:[18,50]}); if(on) el._map.scrollWheelZoom.enable(); else el._map.scrollWheelZoom.disable(); }, 60); }
}
window.addEventListener('popstate', ()=>{ const w=$('.vmapwrap'); if(w?.classList.contains('fs') && !history.state?.mapfs){ mapFull._fromBack=true; mapFull(false); } });
document.addEventListener('keydown', e=>{ if(e.key==='Escape' && $('.vmapwrap.fs') && !$('#scrim').classList.contains('open')) mapFull(false); });
function openVenue(id){
  const v = venueById(id); if(!v) return;
  const n = now(), all = venueShows(id).filter(x=>x.end>n || state.showPast);
  if(openVenue._id!==id){ openVenue._id=id; openVenue._day=''; }
  const days=[...new Set(all.map(x=>localISO(x.start)))], today=localISO(n);
  if(!openVenue._day || !days.includes(openVenue._day)) openVenue._day = days.includes(today) ? today : (days[0]||'');
  const shows = all.filter(x=>localISO(x.start)===openVenue._day);
  const nx = all[0], live = nx && nx.start<=n;
  let body = '';
  if(nx) body += `<button class="vnextbox ${live?'live':''}" onclick="openDetail('${nx.m.id}')"><span><small>${live?'Showing now':'Next here'}</small><b>${live?'':fmtTime(nx.start)+' · '}${esc(nx.m.title)}</b><small>${dayWord(nx.start)}${nx.s.screen?' · '+esc(nx.s.screen):''}</small>${live?'':`<span class="cdline"><span class="cd" data-cd="${nx.start.getTime()}"></span> to showtime</span>`}</span></button>`;
  if(days.length>1) body += `<div class="chips vdays">${days.map(d=>{ const dd=new Date(d+'T12:00'); return `<button class="chip ${d===openVenue._day?'on':''}" onclick="openVenue._day='${d}';openVenue('${id}')">${d===today?'Today':dd.toLocaleDateString('en-IN',{weekday:'short',day:'numeric'})}</button>`; }).join('')}</div>`;
  if(shows.length){
    let day='';
    for(const x of shows){
      const d=x.start.toDateString();
      if(d!==day){ day=d; body += `<div class="vday">${fmtDay(x.start)}${d===n.toDateString()?' · Today':''}</div>`; }
      const live = x.start<=n && x.end>n;
      body += `<button class="vrow" onclick="openDetail('${x.m.id}')"><span class="vt"><b>${fmtTime(x.start)}</b><small>– ${fmtTime(x.end)}</small></span><span class="vm"><b>${esc(x.m.title)}</b><small>${[x.s.screen, x.m.language, runtime(x.m)+' min'].filter(Boolean).map(esc).join(' · ')}</small>${x.s.note?`<small class="snote">${esc(x.s.note)}</small>`:''}</span>${live?'<span class="tag booked">Now</span>':x.s.going||x.s.booked?'<span class="tag plan">Going</span>':''}</button>`;
    }
  }
  const evs = EVENTS.filter(e=>e.v===id && (state.showPast || evEnd(e)>n));
  if(evs.length){ let dd=''; for(const e of evs){ if(e.d!==dd){ dd=e.d; body += `<div class="vday">${fmtDay(evStart(e))}</div>`; } body += evRow(e); } }
  else if(!shows.length) {
    body = `<div class="vnone">${v.kind==='event' ? 'No film screenings are listed here.' : hasShows() ? 'No upcoming screenings listed here.' : 'Schedule not announced yet. Films and showtimes will appear here as soon as IFFI publishes them.'}</div>`;
  }
  openModal(`<div class="vhead"><span class="vic big k-${v.kind}">${vIcon(v.kind,26)}</span><div><h2>${esc(v.name)}</h2><div class="dmeta">${esc(v.area)} · ${VKIND[v.kind]}</div>${v.travel?`<div class="dmeta">${esc(v.travel)}</div>`:''}${v.approx?`<div class="dmeta" style="font-size:13.5px">Map pin is approximate – use Directions</div>`:''}</div></div>
    <p class="vabout">${esc(v.about)}</p>
    <a class="btn vdir" href="${mapUrl(v.map)}" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.4"/></svg>Directions</a>
    ${v.kind!=='event'||shows.length?`<div class="vlist-h">Films showing here</div>`:''}${body}`, venueURL(v)); tick();
}
const secGroup = s => !s ? '' : /^Indian Panorama/.test(s) ? 'Indian Panorama' : /^(Opening Film|Mid Fest Film|Closing Film|Special Screenings|Special Presentations|Gala Premieres)$/.test(s) ? 'Galas & specials' : /^(Centenary Celebrations|Homage|Golden Jubilee Celebrations)$/.test(s) ? 'Indian classics & tributes' : s;
// a film can sit in more than one section (e.g. International Competition + Indian Panorama): use its section plus any section-name tags
const secGroups = m => { const all=new Set(db.movies.map(x=>x.section)); return [...new Set([m.section, ...(m.tags||[]).filter(t=>all.has(t))].map(secGroup).filter(Boolean))]; };
const secOK = m => !state.section || secGroups(m).includes(state.section);
const GENRES = [['Drama',/drama/i],['Documentary',/documentary|docu/i],['Comedy',/comed/i],['Thriller',/thriller|mystery|noir/i],['Horror',/horror|gothic/i],['Sci-fi',/sci-fi/i],['Fantasy',/fantasy|supernatural/i],['Animation',/anim/i],['Experimental',/experimental|slow cinema/i],['Crime',/crime/i],['Romance',/roman/i],['Family',/family|children/i],['Action & adventure',/action|adventure|spy|epic/i],['Mythological',/mytholog/i],['Music & dance',/music|dance/i],['War & history',/war |war\/|war$|historical|period/i],['Coming of age',/coming-of-age/i],['Classics',/classic/i]];
const genreTags = m => GENRES.filter(([,r])=>r.test(m.genre||'')).map(([g])=>g);
const countries = m => String(m.country||'').split(',').map(x=>x.trim()).filter(Boolean);
const NOW_WIN = 2*3600e3;
const nowShows = m => { const n=now(); return (m.screenings||[]).filter(s=>{ const st=dt(s), en=endOf(m,s); return en>n && st-n<NOW_WIN; }); };
const fOK = m => secOK(m) && (!state.genre || genreTags(m).includes(state.genre)) && (!state.country || countries(m).includes(state.country)) && (!state.now || nowShows(m).length) && (!state.venue || (m.screenings||[]).some(s=>venueOf(s.venue)?.id===state.venue));
function countOpts(fn){ const c={}; for(const m of db.movies) for(const v of fn(m)) c[v]=(c[v]||0)+1; return c; }
function filterBar(extra='', right=''){
  const sec=countOpts(secGroups), gen=countOpts(genreTags), cty=countOpts(countries);
  if(state.section && !sec[state.section]) state.section='';
  const az = c => Object.keys(c).sort((a,b)=>a.localeCompare(b)).map(k=>[k,k,c[k]]);
  filterBar._o = {
    genre:['Genre',[['','All genres',db.movies.length],...az(gen)]],
    country:['Country',[['','All countries',db.movies.length],...az(cty)]],
    section:['Track',[['','All tracks',db.movies.length],...az(sec)]],
    venue:['Venue',[['','All venues',db.movies.length],...VENUES.filter(v=>v.kind!=='event').map(v=>[v.id,v.name,new Set(venueShows(v.id).map(x=>x.m.id)).size]).filter(o=>o[2])]],
  };
  if(state.venue && !hasShows()) state.venue='';
  const sel = ['genre','country','section','venue'].filter(k=>state[k]);
  const X = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  return `<div class="filters"><div class="frow">
    <button class="fpill" aria-haspopup="dialog" onclick="openFilters(this)"><svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/></svg>Filters${sel.length?` · ${sel.length}`:''}</button>
    ${extra}
    ${sel.map(k=>`<button class="fpill set x" aria-label="Remove ${esc(state[k])}" onclick="state.${k}='';render()">${esc(k==='venue'?(venueById(state.venue)?.name||state.venue):state[k])}${X}</button>`).join('')}
  </div></div>`;
}
const FTABS_ALL = [['genre','Genre'],['country','Country'],['section','Track'],['venue','Venue']];
let FTABS = FTABS_ALL.slice(0,3);
function openFilters(btn, tab){
  filterBar._o || filterBar();
  FTABS = hasShows() ? FTABS_ALL : FTABS_ALL.slice(0,3);
  tab = tab || openFilters._t || 'genre'; openFilters._t = tab; openFilters._b = btn || openFilters._b;
  const sh=$('#sheet'), o=filterBar._o[tab][1], cur=state[tab]||'';
  const count = db.movies.filter(fOK).length, nsel = FTABS.filter(([k])=>state[k]).length;
  sh.innerHTML = `<div class="pk-head"><b>Filters</b><button class="pk-x" aria-label="Close" onclick="closeSheet()"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>
    <div class="mseg" role="tablist">${FTABS.map(([k,l])=>`<button role="tab" aria-selected="${k===tab}" class="${k===tab?'on':''}" onclick="openFilters(null,'${k}')">${l}${state[k]?' •':''}</button>`).join('')}</div>
    ${o.length>14?`<div class="pk-search"><input type="search" placeholder="Search ${FTABS.find(t=>t[0]===tab)[1].toLowerCase()}" aria-label="Search" oninput="const q=this.value.toLowerCase();this.closest('#sheet').querySelectorAll('.pk-opt').forEach(b=>b.hidden=q&&!b.textContent.toLowerCase().includes(q))"></div>`:''}
    <div class="pk-list" role="listbox">${o.map(([v,l,c])=>`<button role="option" aria-selected="${v===cur}" class="pk-opt ${v===cur?'on':''}" data-v="${esc(v)}"><span>${esc(l)}</span>${c!=null?`<small>${c}</small>`:''}${v===cur?'<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>':''}</button>`).join('')}</div>
    <div class="fl-foot"><button class="linkbtn" ${nsel?'':'disabled style="opacity:.4"'} onclick="FTABS.forEach(([k])=>state[k]='');render();openFilters()">Clear all</button><button class="btn primary" onclick="closeSheet()">Show ${count} film${count===1?'':'s'}</button></div>`;
  sh.querySelectorAll('.pk-opt').forEach(b=>b.onclick=()=>{ state[tab]=b.dataset.v; render(); openFilters(); });
  if(sh.classList.contains('open')) return;
  sh.classList.add('picker','filt');
  const b=openFilters._b;
  if(innerWidth>640 && b){ const r=b.getBoundingClientRect(); Object.assign(sh.style,{left:Math.min(r.left, innerWidth-390)+'px', top:(r.bottom+6)+'px', right:'auto', bottom:'auto', width:'380px', maxHeight:Math.min(560, innerHeight-r.bottom-20)+'px'}); }
  else sh.removeAttribute('style');
  sh.classList.add('open'); $('#sheetScrim').classList.add('open');
  if(!history.state?.sheet) history.pushState({sheet:1},'');
}

function renderSchedule(){
  const shows = hasShows();
  if(!shows) return `<div class="soon"><b>Showtimes coming soon</b><span>IFFI hasn’t published the 2026 schedule yet. Here are the festival venues – tap one for directions.</span></div>` + renderVenues();
  const n = now(), myUp = allScreenings().filter(x => x.s.going && x.end>n && x.m.status!=='watched').length;
  if(!['plan','time','venue'].includes(state.smode)) state.smode = myUp ? 'plan' : 'time';
  const mode = state.smode;
  const tab = (k,l,extra='') => `<button role="tab" aria-selected="${mode===k}" class="${mode===k?'on':''}" onclick="state.smode='${k}';window.scrollTo(0,0);render()">${l}${extra}</button>`;
  const seg = `<div class="mseg sseg" role="tablist">${tab('plan','My Plan', myUp?`<small>${myUp}</small>`:'')}${tab('time','All shows')}${tab('venue','By venue')}</div>`;
  if(mode==='venue') return seg + renderVenues();
  if(mode==='plan') return seg + renderCalendar();
  return seg + renderScheduleTime();
}
/* a time button: tap to mark / unmark Going */
function timeChip(x, cl, n, withDate){
  const live = x.start<=n && x.end>n, past = x.end<=n;
  const v = venueOf(x.s.venue), place = [v?.name || x.s.venue || 'Venue TBA', x.s.screen].filter(Boolean).join(' · ');
  const w = !x.s.going && !past && cl.plan ? wouldClash(x, cl.plan) : null;
  const sw = !x.s.going && !past && !w && cl.plan?.some(y=>y.m===x.m);
  const cls = ['tchip', x.s.going&&'going', cl.has(x.s.id)&&'clash', w&&'warn', live&&'live', past&&'past'].filter(Boolean).join(' ');
  const when = (withDate ? fmtShort(x.start)+' · ' : '') + fmtTime(x.start);
  const lab = `${when}, ${place}${x.s.going?', going – tap to remove':w?'. Warning: '+w.why+'. Tap to add anyway':sw?', tap to switch your plan to this time':', tap to mark as going'}`;
  const act = past ? (x.m.status==='watched' ? `openDetail('${x.m.id}')` : `quickWatched('${x.m.id}','${x.s.id}')`) : `pickTime('${x.m.id}','${x.s.id}')`;
  return `<button class="${cls}" aria-pressed="${!!x.s.going}" aria-label="${esc(lab)}"${w?` title="${esc(w.why)}"`:''} onclick="event.stopPropagation();${act}">${withDate?`<small class="tdate">${fmtShort(x.start)}</small>`:''}<b>${fmtTime(x.start)}</b><span>${esc(place)}</span>${x.s.going?(cl.has(x.s.id)?'<i>✓ Going · clash</i>':'<i>✓ Going</i>'):live&&!w?'<i>Now showing</i>':past&&x.m.status!=='watched'?'<i>Mark watched</i>':w?`<i class="cw">${w.far?'Too far from':w.gap<0?'Clashes with':'Tight after'} ${esc(w.y.m.title)}</i>`:sw?'<i class="sw">⇄ Switch to this</i>':''}</button>`;
}
function pickTime(mid, sid){   // tapping another time of a film you've planned moves the plan there
  const m=find(mid), s=m?.screenings.find(y=>y.id===sid); if(!s) return;
  const n=now(), moved = !s.going ? m.screenings.filter(y=>y!==s && y.going && y.date && endOf(m,y)>n) : [];
  moved.forEach(y=>y.going=false);
  toggleS(mid, sid, 'going');
  if(s.going && !clashes().has(sid)) toast(moved.length ? `Moved to ${fmtShort(dt(s))} · ${fmtTime(dt(s))}` : 'Added to My Plan'+signHint());
  else if(!s.going) toast('Removed from My Plan');
}
let _sh=0; const signHint = () => cloud.user || _sh++ ? '' : ' · saved on this phone';
/* one card per film per day, with all its times as buttons */
function filmGroup(g, cl, n, withDate, inMine){
  const m = g.m, going = g.items.some(x=>x.s.going);
  const notes = [...new Set(g.items.map(x=>x.s.note).filter(Boolean))];
  const meta = [runtime(m)+' min', m.language, m.section].filter(Boolean).map(esc).join(' · ');
  const tags = (m.status==='want'&&!inMine?'<span class="tag saved">Saved</span>':'') + (m.status==='watched'?'<span class="tag booked">Watched</span>':'');
  return `<div class="fgroup ${going?'has-going':''}">
    <div class="fg-head" onclick="openDetail('${m.id}')">
      <div class="mini">${poster(m,true)}</div>
      <div class="info"><div class="t">${esc(m.title)}</div><div class="meta">${meta}</div>${tags?`<div class="fg-tags">${tags}</div>`:''}</div>
      ${inMine?`<button class="icbtn fg-rm" aria-label="Remove ${esc(m.title)} from your list" title="Remove from your list" onclick="event.stopPropagation();quickSave('${m.id}')">${IC.x}</button>`:''}
    </div>
    ${notes.map(t=>`<div class="snote">${esc(t)}</div>`).join('')}
    <div class="tchips">${g.items.map(x=>timeChip(x,cl,n,withDate)).join('')}</div>
    ${cl.info?g.items.filter(x=>x.s.going).map(x=>clashHtml(cl.info,x.s.id)).join(''):''}
  </div>`;
}
function earlierLink(hidden){
  if(state.showPast) return `<button class="earlier" onclick="state.showPast=false;persistUI();render()">Hide earlier shows ▴</button>`;
  return hidden ? `<button class="earlier" onclick="state.showPast=true;persistUI();render()">Earlier shows (${hidden}) ▾</button>` : '';
}
function renderScheduleTime(){
  const n = now(), cl = planCtx(), ci = cl.info, today = localISO(n);
  let items = allScreenings().filter(x => x.m.status!=='watched' || x.start<n);
  items = items.filter(x => matches(x.m) && tagOK(x.m) && (!state.venue || venueOf(x.s.venue)?.id===state.venue) && fOK(x.m) && (!state.now || (x.end>now() && x.start-now()<NOW_WIN)));
  const allDays = [...new Set(items.map(x=>localISO(x.start)))].sort();
  const daysShown = state.showPast ? allDays : allDays.filter(d => d>=today);
  const days = daysShown.length ? daysShown : allDays;
  if(state.day===undefined) state.day = days.find(d=>d>=today) || '';
  if(state.day && !days.includes(state.day)) state.day = days.find(d=>d>=today) || '';
  if(state.day) items = items.filter(x => localISO(x.start)===state.day);
  const hidden = state.showPast ? 0 : items.filter(x => x.end<=n).length;
  if(!state.showPast) items = items.filter(x => x.end>n);

  let html = filterBar() + (days.length>1 ? dateStrip(days, state.day, 'setSDay', true) : '') + earlierLink(hidden);
  const noFilter = !state.q && !state.tag && !state.now && !state.genre && !state.country && !state.section && !state.venue;
  const evs = noFilter ? EVENTS.filter(e => (state.showPast || evEnd(e)>n) && (!state.day || e.d===state.day)) : [];
  if(!items.length && !evs.length){
    return html + (db.movies.length
      ? `<div class="empty"><h3>${allScreenings().length?'No shows match':'Schedule not announced yet'}</h3>${allScreenings().length?'Try another day or section.':'Showtimes will appear here as soon as IFFI publishes them.'}</div>`
      : `<div class="empty"><h3>No films yet</h3>The film list is loading. Refresh the page if it doesn't appear.</div>`);
  }
  // group: day → film
  const byDay = new Map();
  for(const x of items){ const d=localISO(x.start); if(!byDay.has(d)) byDay.set(d,new Map()); const g=byDay.get(d); if(!g.has(x.m.id)) g.set(x.m.id,{m:x.m,start:x.start,items:[]}); g.get(x.m.id).items.push(x); }
  for(const e of evs) if(!byDay.has(e.d)) byDay.set(e.d,new Map());
  for(const d of [...byDay.keys()].sort()){
    const groups = [...byDay.get(d).values()], nShows = groups.reduce((t,g)=>t+g.items.length,0);
    const dd = new Date(d+'T12:00');
    html += `<h2 class="day"><span>${fmtDay(dd)}${d===today?' · Today':''}</span><span>${groups.length?`${groups.length} film${groups.length>1?'s':''} · ${nShows} show${nShows>1?'s':''}`:''}</span></h2>`;
    const list = [...groups.map(g=>({g,start:g.start})), ...evs.filter(e=>e.d===d).map(e=>({ev:e,start:evStart(e)}))].sort((a,b)=>a.start-b.start);
    for(const x of list) html += x.ev ? evRow(x.ev, true) : filmGroup(x.g, cl, n);
  }
  return html;
}
function gapFits(a, b){
  const n=now(), d=localISO(a.start), all=allScreenings(), pf=new Set(all.filter(x=>x.s.going).map(x=>x.m.id));
  return all.filter(x=>localISO(x.start)===d && x.start>n && x.m.status!=='watched' && !pf.has(x.m.id) && (+x.m.runtime||99)>=40 && dpFits(a,x) && dpFits(x,b) && x.start>=a.end && x.end<=b.start);
}
/* ---------- My Plan as a calendar: a row of dates, then the day as a timeline ---------- */
const festDays = () => [...new Set(allScreenings().map(x=>localISO(x.start)))].sort();
function setSDay(d){ state.day=d; window.scrollTo(0,0); render(); }
function dateStrip(days, cur, act, allTile){
  const today=localISO(now()), plan={};
  for(const x of allScreenings()) if(x.s.going && x.m.status!=='watched'){ const d=localISO(x.start); plan[d]=(plan[d]||0)+1; }
  const tile = d => { const dd=new Date(d+'T12:00'), long=dd.toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'});
    return `<button class="dtile ${d===cur?'on':''} ${d<today?'past':''}" aria-pressed="${d===cur}" aria-label="${long}${plan[d]?`, ${plan[d]} show${plan[d]>1?'s':''} in your plan`:''}" onclick="${act}('${d}')"><small>${d===today?'Today':dd.toLocaleDateString('en-IN',{weekday:'short'})}</small><b>${dd.getDate()}</b><i>${plan[d]||''}</i></button>`; };
  return `<div class="dstrip" role="group" aria-label="Festival days">${allTile?`<button class="dtile all ${!cur?'on':''}" aria-pressed="${!cur}" onclick="${act}('')"><small>All</small><b>days</b></button>`:''}${days.map(tile).join('')}</div>`;
}
function calDay(){
  const days=festDays(), n=now(), today=localISO(n);
  if(days.includes(state.day)) return state.day;
  const up=allScreenings().find(x=>x.s.going && x.end>n && x.m.status!=='watched');
  return days.includes(today) ? today : up ? localISO(up.start) : (days.find(d=>d>=today) || days[0]);
}
function renderCalendar(){
  const n=now(), today=localISO(n), days=festDays(); if(!days.length) return '';
  const d = state.day = calDay(), dd=new Date(d+'T12:00'), cl=planCtx(), ci=cl.info;
  const items=allScreenings().filter(x=>x.s.going && x.m.status!=='watched' && localISO(x.start)===d).sort((a,b)=>a.start-b.start);
  const next=allScreenings().find(x=>x.s.going && x.m.status!=='watched' && x.start>n);
  let html = next ? `<button class="nextup" onclick="openDetail('${next.m.id}')"><span class="nu-k">Next up</span><span class="nu-t"><b>${esc(next.m.title)}</b><small>${dayWord(next.start)} · ${fmtTime(next.start)} · ${esc(venueOf(next.s.venue)?.name||next.s.venue||'')}</small></span><span class="nu-cd"><span class="cd" data-cd="${next.start.getTime()}"></span></span></button>` : '';
  html += dateStrip(days, d, 'setSDay');
  const nCl=items.filter(x=>cl.has(x.s.id)).length, up=items.some(x=>x.end>n), canPick=dpDays().includes(d);
  html += `<div class="cal-h"><div><h2>${fmtDay(dd)}${d===today?' · Today':''}</h2><span>${items.length?`${items.length} show${items.length>1?'s':''} planned`:'Nothing planned yet'}${nCl?` · <b class="cal-cl">${nCl} clash${nCl>1?'es':''}</b>`:''}</span></div>
    <div class="cal-acts">${canPick?`<button class="pillbtn" onclick="openDayPick('${d}')">✨ Pick my day</button>`:''}${up?`<button class="pillbtn" onclick="dayICS('${d}')" aria-label="Add this day to your phone's calendar">${IC.cal}Save day</button>`:''}</div></div>`;
  const short=dd.toLocaleDateString('en-IN',{weekday:'short',day:'numeric'});
  if(!items.length){
    html += `<div class="empty cal-empty"><h3>Your ${short} is free</h3>${d<today?'This day is over.':'Pick films yourself, or let us suggest the day’s best for your taste.'}${d>=today?`<div class="cal-eb">${canPick?`<button class="btn primary" onclick="openDayPick('${d}')">✨ Pick my day</button>`:''}<button class="btn" onclick="state.day='${d}';state.smode='time';window.scrollTo(0,0);render()">Browse ${short} shows</button></div>`:''}</div>`;
  } else {
    const s0=new Date(d+'T00:00'), mins=t=>Math.round((t-s0)/60000);
    let h0=9, h1=23; for(const x of items){ h0=Math.min(h0,Math.floor(mins(x.start)/60)); h1=Math.max(h1,Math.ceil(mins(x.end)/60)); }
    h1=Math.min(h1,27); const base=h0*60, Y=t=>`calc(${mins(t)-base}px * var(--ppm))`, H=m=>`calc(${m}px * var(--ppm))`;
    // side-by-side lanes for shows that overlap
    const lane=new Map(); let cluster=[], cEnd=0, ends=[];
    const flush=()=>{ const k=Math.max(...cluster.map(x=>lane.get(x).l+1)); cluster.forEach(x=>lane.get(x).k=k); cluster=[]; ends=[]; };
    for(const x of items){ if(cluster.length && x.start>=cEnd) flush(); let l=ends.findIndex(e=>e<=x.start); if(l<0){ l=ends.length; ends.push(0); } ends[l]=x.end; lane.set(x,{l}); cluster.push(x); cEnd=Math.max(cluster.length>1?cEnd:0, x.end); }
    flush();
    let grid=''; for(let h=h0; h<=h1; h++) grid += `<div class="tl-hr" style="top:${H(h*60-base)}"><span>${h%24}:00</span></div>`;
    let gaps='', prev=null;
    for(const x of items){
      if(prev && x.start>prev.end){
        const gap=Math.round((x.start-prev.end)/60000), {need}=dpGap(prev,x), va=venueOf(prev.s.venue), vb=venueOf(x.s.venue);
        const move = !va||!vb||va.id===vb.id ? 'same venue' : kmBetween(va,vb)<1.2 ? `short walk to ${vb.name}` : `~${need} min to ${vb.name}`;
        const len = gap>=60 ? `${Math.floor(gap/60)} h${gap%60?' '+gap%60+' min':''}` : `${gap} min`;
        const k = gap>=75 && x.start>n ? new Set(gapFits(prev,x).map(y=>y.m.id)).size : 0;
        gaps += `<div class="tl-gap ${gap<need?'tight':''}" style="top:${Y(prev.end)};height:${H(mins(x.start)-mins(prev.end))}">${gap>=20?`<span>${gap<need?'⚠ Only ':''}${len}${gap<need?'':' free'} · ${esc(move)}</span>`:''}${k?`<button class="pg-b" onclick="gapModal('${prev.s.id}','${x.s.id}')">Find a film · ${k} fit</button>`:''}</div>`;
      }
      if(!prev || x.end>prev.end) prev=x;
    }
    const blocks = items.map(x=>{ const L=lane.get(x), c=cl.has(x.s.id), v=venueOf(x.s.venue);
      return `<div class="tl-ev ${c?'clash':''} ${x.end<=n?'past':''} ${L.k>1?'narrow':''}" role="button" tabindex="0" data-pid="${x.m.id}" style="top:${Y(x.start)};height:${H(Math.max(34,mins(x.end)-mins(x.start)))};left:calc(${L.l} * 100% / ${L.k});width:calc(100% / ${L.k} - 4px)" onclick="openDetail('${x.m.id}')" aria-label="${esc(`${fmtTime(x.start)} to ${fmtTime(x.end)}, ${x.m.title}, ${v?.name||x.s.venue||''}${c?'. Clash: '+ci.get(x.s.id)[0]:''}`)}"><small class="tl-tm">${fmtTime(x.start)}–${fmtTime(x.end)}</small><b>${esc(x.m.title)}</b><small>📍 ${esc(v?.name||x.s.venue||'Venue TBA')}${x.s.screen?' · '+esc(x.s.screen):''}</small>${c?(w=>`<small class="tl-w">⚠ ${w?`${w.far?'Too far from':w.gap<0?'Overlaps':'Too tight with'} ${esc(w.y.m.title)}`:'Clash'}</small>`)(wouldClash(x, items.filter(y=>y!==x))):''}${x.end>n?`<span class="tl-acts"><button class="tl-b" onclick="event.stopPropagation();swapOpen('${x.s.id}')" aria-label="Swap ${esc(x.m.title)} for another film" title="Swap for a film that fits this slot">⇄<span> Swap</span></button><button class="tl-b x" onclick="event.stopPropagation();planRemove('${x.s.id}')" aria-label="Remove ${esc(x.m.title)} from My Plan" title="Remove from My Plan">${IC.x}</button></span>`:''}</div>`; }).join('');
    const nowLine = d===today && mins(n)>base && mins(n)<h1*60 ? `<div class="tl-now" style="top:${Y(n)}"><span>${fmtTime(n)}</span></div>` : '';
    html += `<div class="tl" style="height:${H((h1-h0)*60)}"><div class="tl-grid">${grid}</div><div class="tl-col">${gaps}${blocks}${nowLine}</div></div>`;
    if(d>=today) html += `<button class="btn tl-more" onclick="state.day='${d}';state.smode='time';window.scrollTo(0,0);render()">+ Add more shows on ${short}</button>`;
  }
  const todo = mineGroups().todo.length;
  if(todo) html += `<button class="todo-card" onclick="state.mineTab='todo';persistUI();setView('mine')"><span class="tc-n">${todo}</span><span><b>saved film${todo>1?'s':''} still need${todo>1?'':'s'} a showtime</b>Pick times for ${todo>1?'them':'it'} in My Shortlist</span><span aria-hidden="true" class="tc-go">›</span></button>`;
  return html;
}
/* swap a planned show: films that fit the freed slot (between your show before and after it), nearest in time first */
function slotFits(x){
  const n=now(), d=localISO(x.start), all=allScreenings(), plan=all.filter(y=>y.s.going && y.m.status!=='watched' && localISO(y.start)===d && y!==x);
  const prev=plan.filter(y=>y.end<=x.start).sort((a,b)=>b.end-a.end)[0], next=plan.filter(y=>y.start>=x.end).sort((a,b)=>a.start-b.start)[0];
  const pf=new Set(all.filter(y=>y.s.going).map(y=>y.m.id));
  const list=all.filter(y=>localISO(y.start)===d && y.start>n && y.m.status!=='watched' && !pf.has(y.m.id) && (+y.m.runtime||99)>=40 && (!prev || (y.start>=prev.end && dpFits(prev,y))) && (!next || (y.end<=next.start && dpFits(y,next))));
  const ok=new Set(list.map(y=>y.m.id)), others=plan;   // nearby films that would clash with the show before or after
  const near=all.filter(y=>localISO(y.start)===d && y.start>n && y.m.status!=='watched' && !pf.has(y.m.id) && !ok.has(y.m.id) && (+y.m.runtime||99)>=40 && Math.abs(y.start-x.start)<=2*3600e3).map(y=>({y, w:wouldClash(y, others)})).filter(o=>o.w);
  return {prev, next, list, near};
}
function swapOpen(sid){
  const x=allScreenings().find(y=>y.s.id===sid); if(!x) return;
  const {prev,next,list,near}=slotFits(x), sc=dpScores(), used={}, seen=new Set(), seen2=new Set();
  const nr=near.sort((a,b)=>Math.abs(a.y.start-x.start)-Math.abs(b.y.start-x.start)).filter(o=>!seen2.has(o.y.m.id) && seen2.add(o.y.m.id)).slice(0,6).sort((a,b)=>a.y.start-b.y.start);
  const f=list.sort((a,b)=>Math.abs(a.start-x.start)-Math.abs(b.start-x.start) || (sc[b.m.id]?.s||0)-(sc[a.m.id]?.s||0)).filter(y=>!seen.has(y.m.id) && seen.add(y.m.id)).slice(0,10).sort((a,b)=>a.start-b.start);
  const win = `${prev?`after <b>${esc(prev.m.title)}</b> (ends ${fmtTime(prev.end)})`:'from the morning'} ${next?`and before <b>${esc(next.m.title)}</b> (${fmtTime(next.start)})`:'until the evening'}`;
  openModal(`<div class="gapm swapm"><h2>Swap ${esc(x.m.title)}</h2>
    <div class="sw-cur"><b>${fmtTime(x.start)}–${fmtTime(x.end)}</b> · ${esc(venueOf(x.s.venue)?.name||x.s.venue||'')} · ${fmtShort(x.start)}</div>
    <p class="tg-sub">${f.length?`Films that fit ${win}, with time to get there. Closest to this slot first.`:`Nothing else fits ${win}.`}</p>
    <div class="pg-l">${f.map(y=>{ const same=y.start<x.end && y.end>x.start;
      return `<div class="pg-o"><button class="pg-f" onclick="openDetail('${y.m.id}')"><b>${fmtTime(y.start)}–${fmtTime(y.end)}${same?' <span class="sw-same">Same slot</span>':''}</b><span>${esc(y.m.title)}</span><small>📍 ${esc(venueOf(y.s.venue)?.name||y.s.venue||'')}${y.s.screen?' · '+esc(y.s.screen):''} · ${runtime(y.m)} min · ${esc(dpWhy(y,used))}</small></button><button class="btn sm primary" onclick="swapTo('${x.s.id}','${y.m.id}','${y.s.id}')">Swap in</button></div>`; }).join('')}</div>
    ${nr.length?`<h3 class="sw-h">Around this time – would clash with your plan</h3><div class="pg-l">${nr.map(({y,w})=>`<div class="pg-o sw-cl"><button class="pg-f" onclick="openDetail('${y.m.id}')"><b>${fmtTime(y.start)}–${fmtTime(y.end)}</b><span>${esc(y.m.title)}</span><small>📍 ${esc(venueOf(y.s.venue)?.name||y.s.venue||'')} · ${runtime(y.m)} min</small><small class="dp-c">⚠ ${w.far?'Too far from':w.gap<0?'Overlaps':'Too tight with'} ${esc(w.y.m.title)} (${fmtTime(w.y.start)})</small></button><button class="btn sm" onclick="swapTo('${x.s.id}','${y.m.id}','${y.s.id}')">Swap in</button></div>`).join('')}</div>`:''}
    <div class="tg-acts"><button class="btn" onclick="closeModal(true);planRemove('${x.s.id}')">${IC.x} Remove ${esc(x.m.title)} instead</button></div></div>`);
}
function swapTo(oldSid, mid, sid){
  const o=allScreenings().find(y=>y.s.id===oldSid), m=find(mid), s=m?.screenings.find(y=>y.id===sid); if(!o||!s) return;
  o.s.going=false; s.going=true; if(!m.status||m.status==='none') m.status='want';
  save(); closeModal(true); render();
  toast(`Swapped: ${o.m.title} → ${m.title}`);
}
function planRemove(sid){
  const x=allScreenings().find(y=>y.s.id===sid); if(!x) return;
  x.s.going=false; save(); render(); toast(`Removed ${x.m.title} from My Plan`);
}
function gapModal(aid, bid){   // films that fit in a free slot of your plan
  const A=allScreenings(), a=A.find(x=>x.s.id===aid), b=A.find(x=>x.s.id===bid); if(!a||!b) return;
  const sc=dpScores(), seen=new Set(), used={};
  const f=gapFits(a,b).sort((p,q)=>(sc[q.m.id]?.s||0)-(sc[p.m.id]?.s||0)).filter(x=>!seen.has(x.m.id) && seen.add(x.m.id)).slice(0,8).sort((p,q)=>p.start-q.start);
  openModal(`<div class="gapm"><h2>Free ${fmtTime(a.end)}–${fmtTime(b.start)}</h2><p class="tg-sub">Films that fit between <b>${esc(a.m.title)}</b> and <b>${esc(b.m.title)}</b>, with time to get there.</p><div class="pg-l">${f.map(x=>`<div class="pg-o"><button class="pg-f" onclick="openDetail('${x.m.id}')"><b>${fmtTime(x.start)}–${fmtTime(x.end)}</b><span>${esc(x.m.title)}</span><small>📍 ${esc(venueOf(x.s.venue)?.name||x.s.venue||'')}${x.s.screen?' · '+esc(x.s.screen):''} · ${runtime(x.m)} min · ${esc(dpWhy(x,used))}</small></button><button class="btn sm primary" onclick="closeModal(true);pickTime('${x.m.id}','${x.s.id}')">+ Going</button></div>`).join('')}</div></div>`);
}
function dayICS(d){   // one calendar file with every show you've planned that day
  const ev=allScreenings().filter(x=>x.s.going && x.m.status!=='watched' && localISO(x.start)===d && x.end>now());
  if(!ev.length) return toast('No upcoming shows planned that day');
  const f=v=>v.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,''), e=v=>String(v).replace(/[\;,]/g,c=>'\\'+c).replace(/\n/g,'\\n');
  const L=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Festival Diaries Goa//EN','METHOD:PUBLISH'];
  for(const x of ev){ const t=`${x.m.title} – IFFI`; L.push('BEGIN:VEVENT','UID:'+x.s.id+'-'+slug(x.m.title)+'@festivaldiaries','DTSTAMP:'+f(new Date()),'DTSTART:'+f(x.start),'DTEND:'+f(x.end),'SUMMARY:'+e(t),'LOCATION:'+e([venueOf(x.s.venue)?.name||x.s.venue,x.s.screen].filter(Boolean).join(', ')),'DESCRIPTION:'+e(filmURL(x.m)),'BEGIN:VALARM','TRIGGER:-PT1H','ACTION:DISPLAY','DESCRIPTION:'+e(t),'END:VALARM','END:VEVENT'); }
  L.push('END:VCALENDAR');
  download(`iffi-${d}.ics`, L.join('\r\n'), 'text/calendar');
  toast(`Calendar file saved – open it to add ${ev.length} show${ev.length>1?'s':''}`);
}

function cardHtml(m, badge){
  const ns = nextScreening(m);
  const sub = m.status==='watched' ? `<span class="stars">${stars(m.rating)}</span>` : (ns ? `<span>${fmtShort(ns.start)+' '+fmtTime(ns.start)}</span>` : '');
  const b = badge || (m.status==='watched' ? '<span style="color:var(--green)">✓ Watched</span>' : '');
  return `<div class="card" data-pid="${m.id}" tabindex="0" role="button" aria-label="${esc(m.title)}" onclick="openDetail('${m.id}')">
    ${poster(m).replace(/<\/div>$/, (m.status!=='watched' ? `<button class="bm ${m.status==='want'?'on':''}" data-mid="${m.id}" aria-label="${m.status==='want'?'Remove from my watchlist':'Save to my watchlist'}" onclick="event.stopPropagation();quickSave('${m.id}')"><svg viewBox="0 0 24 24"><path d="M6 3h12v18l-6-4.5L6 21z" stroke-linejoin="round"/></svg></button>` : '') + '</div>')}
    ${b?`<span class="badge-next">${b}</span>`:''}
    <div class="cap">${esc(m.title)}</div>
    <div class="sub">${sub}</div>
  </div>`;
}
const byTitle = (a,b) => a.title.localeCompare(b.title);
const byNext = (a,b) => (nextScreening(a)?.start ?? Infinity) - (nextScreening(b)?.start ?? Infinity) || byTitle(a,b);
function renderGrid(kind){
  const filtering = state.q.trim() || (kind==='all' && ['genre','country','section','now','venue'].some(k=>state[k]));
  let list = db.movies.filter(m => (kind==='all' ? fOK(m) : m.status===kind) && matches(m));
  if(kind==='watched') list.sort((a,b)=>(b.watchedOn||'').localeCompare(a.watchedOn||'') || byTitle(a,b));
  else list.sort((kind==='want'||kind==='all') && hasShows() ? byNext : byTitle);
  let html = kind==='all' ? (filtering ? '' : `<p class="dhero"><b>Your free guide to IFFI Goa 2026</b> · 20–28 Nov · ${officialList().length} films, every showtime</p>` + tasteBanner()) + filterBar(discoverPills()) + (filtering ? '' : tasteReady()) : '';
  if(!list.length){
    if(state.now){ const nx = allScreenings().filter(x=>x.start>now()).sort((a,b)=>a.start-b.start)[0];
      return html + `<div class="empty"><h3>Nothing screening right now</h3>No shows are on or starting in the next 2 hours.${nx?`<div style="margin-top:8px">Next up: <a href="${filmURL(nx.m)}" onclick="event.preventDefault();openDetail('${nx.m.id}')"><b>${esc(nx.m.title)}</b></a> · ${fmtShort(nx.start)} · ${fmtTime(nx.start)}</div>`:''}<div style="margin-top:14px"><button class="btn primary" onclick="state.now=false;render()">Show all films</button></div></div>`; }
    if(filtering) return html + `<div class="empty"><h3>No films match</h3>Try another search or filter.</div>`;
    if(kind==='want' && !db.movies.some(m=>m.status==='watched')) return html + playNudge();
    const msg = {want:['Nothing saved yet','Tap the bookmark on any film to save it here.'], watched:['No films watched yet','Open a film and tap Watched, then give it stars.'], all:['No films yet','The film list is loading. Refresh the page if it doesn’t appear.']}[kind];
    return html + `<div class="empty"><h3>${msg[0]}</h3>${msg[1]}</div>`;
  }
  if(kind==='all' && !filtering){
    html += `<h2 class="sec-h">All films <span>${list.length}</span></h2>`;
  }
  return html + `<div class="grid">${list.map(m=>cardHtml(m)).join('')}</div>`;
}
const discoverPills = () => `<button class="fpill acc ${state.view==='fest'?'set':''}" aria-pressed="${state.view==='fest'}" onclick="setView(state.view==='fest'?'all':'fest')" title="The 20 most-travelled films on the festival circuit"><svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="9" r="5.5"/><path d="M8.6 13.4L7 21l5-2.6 5 2.6-1.6-7.6"/></svg>Acclaimed</button><button class="fpill" onclick="openTaste(!!tgLoad())" title="Pick between films you know – get a top 10 for your taste">${TG_IC.replace('width="22" height="22"','width="17" height="17"')}This or That</button>`;
function renderFest(){   // Discover, sorted by festival-circuit record (keeps the festival-darlings/ link)
  const fc = db.movies.filter(m=>m.fc && matches(m) && fOK(m)).sort((a,b)=>a.fc-b.fc);
  const html = filterBar(discoverPills()) + `<h1 class="sec-h fest-h">Acclaimed <span>${fc.length}</span></h1><p class="sec-sub">This year’s most-travelled films on the festival circuit – ranked by where they played: Cannes, Venice, Berlin, Toronto, Sundance and more.</p>`;
  if(!fc.length) return html + `<div class="empty"><h3>${db.movies.some(m=>m.fc)?'No films match':'The list is loading'}</h3>${db.movies.some(m=>m.fc)?'Try another search or filter.':'Refresh the page if it doesn’t appear.'}</div>`;
  return html + `<div class="grid">${fc.map(m=>cardHtml(m, `#${m.fc} · ${esc(String(m.fcl).split(' · ')[0])}`)).join('')}</div>`;
}
const IC = {
  share:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 15V3M7 8l5-5 5 5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/></svg>',
  link:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/></svg>',
  copy:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
  open:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>',
  wa:'<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>',
  download:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg>',
  trash:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
  bookmark:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M6 3h12v18l-6-4.5L6 21z"/></svg>',
  x:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  cal:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4M12 13v5M9.5 15.5h5"/></svg>',
};
/* ---------- shared watchlist: a public page at list/?f=slug.slug… ---------- */
const firstName = () => String(cloud.user?.displayName||'').trim().split(/\s+/)[0].slice(0,30);
const cleanName = n => String(n||'').replace(/[^\p{L}\p{M}' .-]/gu,'').trim().slice(0,30);
const listTitle = n => (n=cleanName(n)) ? `${n}’s Watchlist` : 'IFFI Goa 2026 Watchlist';
const listURL = films => { const n=cleanName(firstName()); return ROOT + 'list/?f=' + films.map(m=>slug(m.title)).join('.') + (n?'&n='+encodeURIComponent(n):''); };
function myWatchlist(){ return db.movies.filter(m=>m.status==='want').sort(hasShows()?byNext:byTitle); }
async function shareWatchlist(){
  const films = myWatchlist(); if(!films.length) return;
  const url = listURL(films), title = listTitle(firstName()), text = `${title} – ${films.length} film${films.length>1?'s':''} for IFFI Goa 2026 🎬`;
  if(navigator.share && matchMedia('(pointer: coarse)').matches){ try{ await navigator.share({title, text, url}); }catch(e){} return; }
  const wa = 'https://wa.me/?text='+encodeURIComponent(text+'\n'+url);
  openModal(`<div class="sharedlg"><h2>Share your watchlist</h2><p>Anyone with this link can see “${esc(title)}” – your first name and ${films.length} film${films.length>1?'s':''}. Share again after you change your watchlist.</p>
    <div class="shr-link"><input readonly value="${esc(url)}" onclick="this.select()" aria-label="Link to your watchlist"><button class="icbtn" onclick="copyText('${esc(url)}')" aria-label="Copy link" title="Copy link">${IC.copy}</button></div>
    <div class="shr-opts">
      <button onclick="copyText('${esc(url)}')"><span class="ico">${IC.link}</span>Copy link</button>
      <a href="${esc(wa)}" target="_blank" rel="noopener"><span class="ico wa">${IC.wa}</span>WhatsApp</a>
      <a href="${esc(url)}" target="_blank" rel="noopener"><span class="ico">${IC.open}</span>Open</a>
    </div></div>`);
}
async function copyText(t){ try{ await navigator.clipboard.writeText(t); toast('Link copied'); }catch(e){ toast('Could not copy – select the link and copy it'); } }
function sharedFilms(code){
  const seen=new Set(); return String(code||'').split('.').map(sl=>db.movies.find(m=>slug(m.title)===sl)).filter(m=>m && !seen.has(m.id) && seen.add(m.id));
}
function openSharedList(code, by){
  const films = sharedFilms(code), n = now();
  if(!films.length){ openModal(`<div class="ask"><h2>This list is empty</h2><p>The link may be incomplete. Ask for it to be shared again.</p><button class="btn primary" onclick="closeModal()">Browse all films</button></div>`, ROOT+'list/?f='+encodeURIComponent(code||'')); return; }
  const rows = films.map(m=>{
    const ups = allScreenings().filter(x=>x.m===m && x.end>n), nx = ups[0];
    const when = nx ? `Next: ${dayWord(nx.start)}, ${fmtTime(nx.start)} · ${esc(venueOf(nx.s.venue)?.name||nx.s.venue||'')}${ups.length>1?` <span class="more">+${ups.length-1} more</span>`:''}` : (m.screenings||[]).some(s=>s.date) ? 'No more showtimes' : 'Showtime to be announced';
    const meta = [m.director, m.runtime||m.screenings?.length ? runtime(m)+' min' : '', m.language].filter(Boolean).map(esc).join(' · ');
    return `<button class="srow" onclick="openDetail('${m.id}')"><div class="mini">${poster(m,true)}</div><div class="info"><div class="t">${esc(m.title)}${m.status==='want'?' <span class="tag saved">Saved</span>':''}</div><div class="meta">${meta}</div><div class="when">${when}</div></div></button>`;
  }).join('');
  const all = films.every(m=>m.status==='want'||m.status==='watched');
  openModal(`<div class="slist"><h2>${esc(listTitle(by))}</h2><p class="upd">${films.length} film${films.length>1?'s':''} for IFFI Goa 2026 · shared from Festival Diaries · Goa</p>
    <div class="srows">${rows}</div>
    <div class="pact">${all ? '<span class="done">✓ All in your watchlist</span>' : `<button class="pillbtn on" onclick="saveSharedList('${esc(code)}','${esc(cleanName(by)).replace(/'/g,'&#39;')}')">${IC.bookmark}Save all</button>`}<button class="linkbtn more" onclick="closeModal()">Browse all films →</button></div></div>`, ROOT+'list/?f='+encodeURIComponent(code).replace(/%2E/gi,'.')+(cleanName(by)?'&n='+encodeURIComponent(cleanName(by)):''));
  document.title = listTitle(by)+' · '+SITE;
}
function saveSharedList(code, by){
  const films = sharedFilms(code);
  let k=0; for(const m of films) if(m.status!=='want' && m.status!=='watched'){ m.status='want'; k++; }
  save(); render(); openSharedList(code, by); toast(k ? `Saved ${k} film${k>1?'s':''} to My Watchlist` : 'Already in your watchlist');
}
function mineGroups(){
  const n=now(), all=allScreenings();
  const planned=all.filter(x=>x.s.going && x.end>n && x.m.status!=='watched'), pf=new Set(planned.map(x=>x.m.id));
  const todo=[], gone=[];
  for(const m of db.movies){ if(m.status!=='want' || pf.has(m.id)) continue; const items=all.filter(x=>x.m===m && x.end>n); if(items.length) todo.push({m,items}); else gone.push(m); }
  todo.sort((a,b)=>a.items[0].start-b.items[0].start);
  return {todo, gone, planned, watched:db.movies.filter(m=>m.status==='watched')};
}
function renderMine(){
  if(!cloud.user) cloudInit();
  const g=mineGroups(), nw=db.movies.filter(m=>m.status==='want').length, n=now();
  const t = state.mineTab==='watched' ? 'watched' : 'todo';
  const tab=(k,l,c)=>`<button role="tab" aria-selected="${t===k}" class="${t===k?'on':''}" onclick="state.mineTab='${k}';persistUI();window.scrollTo(0,0);render()">${l}${c?`<small>${c}</small>`:''}</button>`;
  let html = `<div class="mhead"><h1>My Shortlist</h1>${nw?`<button class="pillbtn" onclick="shareWatchlist()">${IC.share}Share my list</button>`:''}</div>
    <div class="mseg mseg3" role="tablist">${tab('todo','To schedule',g.todo.length)}${tab('watched','Watched',g.watched.length)}</div>` + guestNote()
    + (g.planned.length ? `<button class="planlink" onclick="state.smode='plan';setView('schedule')">${IC.cal}<span><b>${g.planned.length} show${g.planned.length>1?'s':''} in My Plan</b> · see them day by day</span><span aria-hidden="true">›</span></button>` : '');
  if(t==='watched') return html + renderGrid('watched');
  if(!g.todo.length && !g.gone.length){
    if(!nw && !g.planned.length && !g.watched.length) return html + playNudge();
    return html + `<div class="empty"><h3>${g.planned.length?'Everything’s scheduled':'Nothing to schedule'}</h3>${g.planned.length?'Every film on your list has a showtime in your plan.':'Save films from Discover and they’ll wait here for a showtime.'}<div style="margin-top:14px"><button class="btn primary" onclick="${g.planned.length?`state.smode='plan';setView('schedule')`:`setView('all')`}">${g.planned.length?'See my plan':'Discover films'}</button></div></div>`;
  }
  const cl=planCtx();
  if(g.todo.length) html += `<p class="sec-sub">${g.todo.length} saved film${g.todo.length>1?'s':''} without a showtime yet. Tap a time to add it to My Plan – times that clash say so before you tap.</p>`;
  for(const x of g.todo) html += filmGroup({m:x.m, items:x.items}, cl, n, true, true);
  if(g.gone.length) html += `<h2 class="day sub"><span>No showtimes left</span><span>${g.gone.length}</span></h2><div class="grid">${g.gone.map(m=>cardHtml(m)).join('')}</div>`;
  return html;
}

const statusLabel = m => m.status==='watched' ? 'Watched' : m.status==='want' ? 'Watchlist' : '';
const LCOLS = [['title','Title'],['genre','Genre'],['director','Director','hm'],['country','Country','hm'],['language','Language','hm'],['year','Year','hm'],['section','Section'],['premiere','Premiere','hm'],['conf','Screening'],['status','Status','st']];
const lval = (m,k) => k==='year' ? (+m.year||0) : k==='conf' ? (confirmInfo(m)?'Confirmed':'') : k==='status' ? statusLabel(m) : (m[k]||'');
function listRows(){
  const k = state.lsort||'title', dir = state.ldir||1;
  return db.movies.filter(m => matches(m) && tagOK(m) && fOK(m))
    .sort((a,b) => { const x=lval(a,k), y=lval(b,k); return (typeof x==='number' ? x-y : String(x).localeCompare(String(y))) * dir || a.title.localeCompare(b.title); });
}
function sortList(k){ state.ldir = state.lsort===k ? -(state.ldir||1) : 1; state.lsort = k; render(); }
function tableHtml(rows, kind){
  const k = state.lsort, dir = state.ldir||1;
  if(k) rows = [...rows].sort((a,b) => { const x=lval(a,k), y=lval(b,k); return (typeof x==='number' ? x-y : String(x).localeCompare(String(y))) * dir || a.title.localeCompare(b.title); });
  let html = `<div class="tblwrap"><table class="tbl"><thead><tr>${LCOLS.map(([c,l,h])=>`<th class="${h||''}" onclick="sortList('${c}')">${l}${k===c?(dir>0?' ↑':' ↓'):''}</th>`).join('')}</tr></thead><tbody>`;
  html += rows.map(m => `<tr data-pid="${m.id}" tabindex="0" onclick="openDetail('${m.id}')">
    <td class="t">${kind==='rec'?`<span style="color:var(--muted)">#${m.recRank}</span> `:''}${esc(m.title)}${m.originalTitle?`<div style="font-weight:400;color:var(--muted);font-size:14px">${esc(m.originalTitle)}</div>`:''}</td>
    <td class="m">${esc(m.genre||'')}${m.genreUnverified?' <span title="Best guess – not verified" style="color:var(--muted)">?</span>':''}</td><td class="hm">${esc(m.director)}</td><td class="hm" title="${esc(m.country)}">${(()=>{ const c=String(m.country||'').split(',').map(x=>x.trim()).filter(Boolean); return esc(c.slice(0,2).join(', '))+(c.length>2?` <span style="color:var(--muted)">+${c.length-2}</span>`:''); })()}</td><td class="hm m">${esc(m.language)}</td><td class="hm m">${esc(m.year)}</td>
    <td>${esc(m.section)}</td><td class="hm m">${esc(m.premiere||'')}</td>
    <td style="color:var(--green)">${confirmInfo(m)?'Confirmed':''}</td><td class="m st">${statusLabel(m)}</td></tr>`).join('');
  return html + `</tbody></table></div>`;
}
function downloadCSV(){
  const q = v => `"${String(v??'').replace(/"/g,'""')}"`;
  const head = ['Title','Original title','Genre','Director','Country','Language','Year','Section','Premiere','Screening confirmed','Status','IFFI link'];
  const lines = [head.map(q).join(',')].concat(listRows().map(m => [m.title,m.originalTitle,m.genre,m.director,m.country,m.language,m.year,m.section,m.premiere,confirmInfo(m)?'Yes':'',statusLabel(m),m.link].map(q).join(',')));
  download('iffi-2026-films.csv', '\ufeff'+lines.join('\r\n'), 'text/csv');
}

function renderStats(){
  const w = db.movies.filter(m=>m.status==='watched');
  const mins = w.reduce((t,m)=>t+runtime(m),0);
  const rated = w.filter(m=>m.rating);
  const avg = rated.length ? (rated.reduce((t,m)=>t+m.rating,0)/rated.length).toFixed(1) : '–';
  const countries = new Set(w.map(m=>m.country).filter(Boolean));
  const n=now();
  const goingN = allScreenings().filter(x=>x.s.going && x.start>n).length;
  const by = (arr,key) => Object.entries(arr.reduce((o,m)=>{ const k=m[key]||'Unknown'; o[k]=(o[k]||0)+1; return o; },{})).sort((a,b)=>b[1]-a[1]);
  const bar = (rows) => { const max = Math.max(1,...rows.map(r=>r[1])); return rows.slice(0,8).map(([k,v])=>`<div style="display:flex;align-items:center;gap:10px;margin:6px 0"><div style="width:180px;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(k)}</div><div style="flex:1;background:var(--bg);border-radius:4px;height:16px"><div style="width:${v/max*100}%;height:100%;background:var(--green);border-radius:4px"></div></div><div style="width:24px;text-align:right;font-size:15px">${v}</div></div>`).join('') || '<div style="color:var(--muted)">Nothing yet</div>'; };
  const top = [...rated].sort((a,b)=>b.rating-a.rating).slice(0,6);
  return `<div class="stats">
    <div class="stat"><b>${w.length}</b><span>films watched</span></div>
    <div class="stat"><b>${Math.floor(mins/60)}h ${mins%60}m</b><span>in the dark</span></div>
    <div class="stat"><b>${avg}</b><span>average rating</span></div>
    <div class="stat"><b>${countries.size}</b><span>countries visited</span></div>
    <div class="stat"><b>${db.movies.filter(m=>m.status==='want').length}</b><span>still on watchlist</span></div>
    <div class="stat"><b>${goingN}</b><span>upcoming shows you’re going to</span></div>
  </div>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:16px">
    <div class="stat"><div style="font-weight:700;margin-bottom:6px">Watched by section</div>${bar(by(w,'section'))}</div>
    <div class="stat"><div style="font-weight:700;margin-bottom:6px">Watched by country</div>${bar(by(w,'country'))}</div>
  </div>
  ${top.length?`<h2 class="day"><span>Your festival favourites</span></h2><div class="grid">${top.map(m=>`<div class="card" onclick="openDetail('${m.id}')">${poster(m)}<div class="cap">${esc(m.title)}</div><div class="sub"><span class="stars">${stars(m.rating)}</span></div></div>`).join('')}</div>`:''}`;
}

/* countdown ticker */
function tick(){ document.querySelectorAll('[data-cd]').forEach(el=>{
  let ms = +el.dataset.cd - Date.now(); if(ms<0){ el.textContent='Now'; return; }
  const d=Math.floor(ms/864e5), h=Math.floor(ms/36e5)%24, m=Math.floor(ms/6e4)%60, s=Math.floor(ms/1e3)%60;
  el.textContent = d ? `${d}d ${h}h ${m}m` : `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}); }
setInterval(tick, 1000);
const setHdr = () => document.documentElement.style.setProperty('--hdr', (document.querySelector('header')?.offsetHeight||64)+'px');
addEventListener('resize', setHdr); setHdr();
addEventListener('scroll', ()=>{ const f=document.querySelector('.filters'); document.body.classList.toggle('fstuck', !!f && scrollY>0 && f.getBoundingClientRect().top<=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--hdr'))+1); }, {passive:true});

/* ---------- This or That: build a taste palette from famous films, then suggest festival films ----------
   Every visitor sees the same pairs in the same order. Each pick only nudges a few taste "dials" a little;
   recommendations lean towards the palette and are mixed across countries and tracks – never a strict match. */
const TG_PAIRS = [
  {a:['Lost in Translation',2003,'Sofia Coppola','lost-in-translation','Two lonely Americans drift through Tokyo at night'], b:['Mad Max: Fury Road',2015,'George Miller','mad-max-fury-road','Two hours of desert chase, fire and chrome'], v:{pace:1}},
  {a:['Joker',2019,'Todd Phillips','joker','A failed comedian slides into violence in a crumbling city'], b:['Amélie',2001,'Jean-Pierre Jeunet','amelie','A shy Paris waitress secretly fixes strangers’ lives'], v:{tone:1, thrill:.4}},
  {a:['Free Solo',2018,'E. Chai Vasarhelyi, Jimmy Chin','free-solo','A climber scales El Capitan with no ropes – for real'], b:['Life of Pi',2012,'Ang Lee','life-of-pi','A boy, a lifeboat and a Bengal tiger, lost at sea'], v:{real:1, fantasy:-.5}},
  {a:['The Grand Budapest Hotel',2014,'Wes Anderson','the-grand-budapest-hotel','A hotel concierge and his lobby boy on a madcap caper'], b:['Schindler’s List',1993,'Steven Spielberg','schindler-s-list','A businessman saves over a thousand Jews in the Holocaust'], v:{humour:1, tone:-.3}, both:{history:.3}},
  {a:['RRR',2022,'S. S. Rajamouli','rrr','Two revolutionaries, one friendship, giant action set pieces'], b:['Birdman',2014,'Alejandro G. Iñárritu','birdman','A faded superhero actor stages a Broadway comeback'], v:{access:1, pace:-.3}},
  {a:['Boyhood',2014,'Richard Linklater','boyhood','One boy growing up, filmed over 12 real years'], b:['Rang De Basanti',2006,'Rakeysh Omprakash Mehra','rang-de-basanti','Carefree students wake up to politics and protest'], v:{focus:1}},
  {a:['Everything Everywhere All at Once',2022,'Daniel Kwan, Daniel Scheinert','everything-everywhere-all-at-once','A laundromat owner battles across the multiverse – and her tax audit'], b:['12 Angry Men',1957,'Sidney Lumet','12-angry-men','One juror holds out, in one hot room'], v:{style:1, era:-.5}},
  {a:['Lawrence of Arabia',1962,'David Lean','lawrence-of-arabia','A British officer in the Arab revolt – nearly four hours of desert'], b:['Whiplash',2014,'Damien Chazelle','whiplash','A young drummer and a brutal teacher, in 106 tense minutes'], v:{length:1}, rel:{a:['Maverick: The Epic Adventures of David Lean','this documentary is about its director']}},
  {a:['Get Out',2017,'Jordan Peele','get-out','Meeting the girlfriend’s parents turns into a nightmare'], b:['The Lunchbox',2013,'Ritesh Batra','the-lunchbox','A mixed-up lunch delivery sparks letters between two strangers'], v:{thrill:1, pace:-.3}},
  {a:['Interstellar',2014,'Christopher Nolan','interstellar','Astronauts search for a new home for humanity'], b:['The Social Network',2010,'David Fincher','the-social-network','The messy true story of how Facebook began'], v:{fantasy:1}},
  // — 10 more, if they want to keep playing —
  {a:['Pather Panchali',1955,'Satyajit Ray','pather-panchali','A poor family’s life in a Bengal village, through a boy’s eyes'], b:['Bicycle Thieves',1948,'Vittorio De Sica','bicycle-thieves','A father and son search Rome for his stolen bicycle'], v:{india:1, europe:-1}, both:{era:.3}, rel:{b:['Vittorio De Sica - Staging Life','this documentary is about its director']}},
  {a:['Casablanca',1942,'Michael Curtiz','casablanca','Old flames meet again in a wartime nightclub'], b:['La La Land',2016,'Damien Chazelle','la-la-land','An actor and a jazz pianist chase dreams in Los Angeles'], v:{era:1}, both:{romance:.3}},
  {a:['Spirited Away',2001,'Hayao Miyazaki','spirited-away','A girl is trapped in a bathhouse for spirits'], b:['Pan’s Labyrinth',2006,'Guillermo del Toro','pan-s-labyrinth','A girl escapes wartime Spain into a dark fairy tale'], v:{anim:1}, both:{fantasy:.5}},
  {a:['Lagaan',2001,'Ashutosh Gowariker','lagaan','Villagers bet their taxes on a cricket match against the British'], b:['Masaan',2015,'Neeraj Ghaywan','masaan','Grief, love and caste along the ghats of Varanasi'], v:{access:.7}, both:{india:.4}, rel:{a:['Lagaan','it’s screening at the festival']}},
  {a:['Taare Zameen Par',2007,'Aamir Khan','taare-zameen-par','An art teacher sees what everyone missed in a struggling boy'], b:['Gangs of Wasseypur',2012,'Anurag Kashyap','gangs-of-wasseypur','Decades of coal-mafia feuds in Jharkhand'], v:{tone:-1, thrill:-.4}, both:{india:.4}},
  {a:['Inception',2010,'Christopher Nolan','inception','Thieves plant an idea inside a dream – and that ending'], b:['The Shawshank Redemption',1994,'Frank Darabont','the-shawshank-redemption','Hope and friendship over two decades in prison'], v:{access:-.6, style:.4}},
  {a:['Stand by Me',1986,'Rob Reiner','stand-by-me','Four boys, one summer, a walk to find a body'], b:['Marriage Story',2019,'Noah Baumbach','marriage-story','A couple goes through a painful divorce'], v:{kids:1}},
  {a:['Cinema Paradiso',1988,'Giuseppe Tornatore','cinema-paradiso','A filmmaker remembers his village cinema'], b:['City of God',2002,'Fernando Meirelles, Kátia Lund','city-of-god','Growing up among gangs in Rio’s favelas'], v:{nostalgia:1, tone:-.3}},
  {a:['Titanic',1997,'James Cameron','titanic','A love story aboard the ship that couldn’t sink'], b:['Parasite',2019,'Bong Joon-ho','parasite','A poor family schemes its way into a rich family’s home'], v:{romance:1, thrill:-1}},
  {a:['Little Miss Sunshine',2006,'Jonathan Dayton, Valerie Faris','little-miss-sunshine','A chaotic family road trip to a kids’ pageant'], b:['Cast Away',2000,'Robert Zemeckis','cast-away','One man, alone on a desert island'], v:{family:1, humour:.3}},
];
const TG_CORE = 10;
// how each dial is described: [the "+" side, the "−" side]
const TG_DIAL = {pace:['Slow-burning','Fast-paced'], tone:['Dark','Warm'], real:['Real life','Fiction'], humour:['Funny','Serious'], access:['Crowd-pleasing','Challenging'],
  focus:['Personal','Political'], style:['Bold & unusual','Classic storytelling'], length:['Epic','Tight'], era:['Classics','New films'], thrill:['Genre thrills','Quiet drama'],
  romance:['Romance','Suspense'], fantasy:['Imaginative','Grounded'], anim:['Animation','Live action'], kids:['Young lives','Grown-up lives'], family:['Families','Loners'],
  nostalgia:['Nostalgic','Raw'], history:['History',''], india:['Indian',''], asia:['Asian',''], europe:['European',''], latam:['Latin American',''], mideast:['Middle Eastern & African','']};
const TG_REGION = new Set(['india','asia','europe','latam','mideast']);
const TG_W = d => TG_REGION.has(d) ? .3 : d==='history' ? .6 : 1;   // where a film is from counts for little
const TG_KEY = 'fd-taste';
function tgLoad(){ try{ const d=JSON.parse(localStorage.getItem(TG_KEY)||'null'); return d&&d.v===2&&Array.isArray(d.p)?d:null; }catch(e){ return null; } }
function tgStore(p){ try{ localStorage.setItem(TG_KEY, JSON.stringify({v:2, p, at:Date.now()})); }catch(e){} render(); }

/* the taste palette: each dial is the average nudge it got, softened when it was only asked once or twice */
function tgPalette(p){
  const sum={}, n={};
  p.forEach((c,i)=>{ const P=TG_PAIRS[i]; if(!P || (c!=='a'&&c!=='b')) return; const s=c==='a'?1:-1;
    for(const [d,w] of Object.entries(P.v)){ sum[d]=(sum[d]||0)+s*w; n[d]=(n[d]||0)+Math.abs(w); }
    for(const [d,w] of Object.entries(P.both||{})){ sum[d]=(sum[d]||0)+w; n[d]=(n[d]||0)+w; } });
  const pal={}; for(const d in sum){ const avg=sum[d]/n[d]; pal[d] = avg * n[d]/(n[d]+.6); }
  return pal;
}
/* where each festival film sits on the same dials, from its genre, track, country, length and taste tags */
const TG_FIRST = c => String(c||'').split(',')[0].trim();
function tgVec(m){
  const t=m.tt||'', h=c=>t.includes(c), g=String(m.genre||''), sec=String(m.section||''), rt=+m.runtime||0;
  const doc=/docu/i.test(g)||/Docu Montage|Non-Feature/.test(sec), anim=/anim/i.test(g)||sec==='Animation'||h('Z');
  const classic=(+m.year && +m.year<2000)||/classic/i.test(g)||/Restored Classics|Wajda/.test(sec)||(/Centenary|Homage|Golden Jubilee/.test(sec)&&rt>=90);
  const arty=/International Competition|Emerging|Debut|Experimental|New Horizons/.test(sec);
  const c=TG_FIRST(m.country), v={};
  v.pace = h('S')?1 : h('F')?-1 : h('T')?-.4 : 0;
  v.tone = h('D')?1 : h('W')?-1 : h('C')?-.4 : 0;
  v.real = doc?1:-.3;
  v.humour = h('C')?1 : h('D')?-.5 : 0;
  v.access = h('P')?1 : (h('A')||h('X'))?-1 : arty?-.4 : 0;
  v.focus = h('I')?1 : h('O')?-1 : 0;
  v.style = h('X')?1 : classic?-.5 : h('P')?-.3 : 0;
  v.length = rt>=140?1 : rt>=120?.4 : rt&&rt<=95?-.7 : rt&&rt<=105?-.3 : 0;
  v.era = classic?1:-.3;
  v.thrill = h('T')?1 : h('S')?-.4 : 0;
  v.romance = h('R')?1 : h('T')?-.5 : 0;
  v.fantasy = h('Y')?1 : doc?-.6 : -.2;
  v.anim = anim?1:-.2;
  v.kids = h('K')?1:0;
  v.family = h('M')?1 : h('I')?-.3 : 0;
  v.nostalgia = h('N')?1 : h('D')?-.2 : 0;
  v.history = h('H')?1:0;
  if(/India/.test(c)) v.india=1;
  else if(/Japan|China|Korea|Taiwan|Hong Kong|Vietnam|Thailand|Philippines|Singapore|Indonesia|Malaysia|Cambodia|Myanmar|Kyrgyz|Kazakh|Uzbek|Nepal|Bangladesh/.test(c)) v.asia=1;
  else if(/Mexico|Argentina|Brazil|Chile|Peru|Bolivia|Ecuador|Cuba|Haiti|Dominican|Uruguay|Colombia/.test(c)) v.latam=1;
  else if(/Iran|Turkey|Egypt|Saudi|Lebanon|Palestine|UAE|Iraq|Qatar|Morocco|Libya|Tunisia|Ghana|Kenya|Uganda|South Africa|Nigeria|Ethiopia|Central African|Congo/.test(c)) v.mideast=1;
  else if(c && !/USA|Canada/.test(c)) v.europe=1;
  return v;
}
function tgRecommend(p, k=10){
  const pal=tgPalette(p), rel={};
  p.forEach((c,i)=>{ const r=TG_PAIRS[i]?.rel?.[c]; if(r) rel[r[0].toLowerCase()]={why:r[1], by:TG_PAIRS[i][c][0]}; });
  const n=now();
  const pool = db.movies.filter(m=>isOfficial(m) && m.status!=='watched' && !((+m.runtime||99)<40) && (m.screenings||[]).length && !(m.screenings.every(s=>endOf(m,s)<n)))
    .map(m=>{ const v=tgVec(m); let s=0; const parts=[];
      for(const d in pal){ const c=pal[d]*(v[d]||0)*TG_W(d); s+=c; if(c>0 && TG_DIAL[d][(v[d]>0)?0:1]) parts.push([c,d,v[d]>0?0:1]); }
      const r=rel[m.title.toLowerCase()]; if(r) s+=1.2;
      return {m, s:s+(m.tt?.05:0), parts:parts.sort((a,b)=>b[0]-a[0]), r, region:Object.keys(v).find(d=>TG_REGION.has(d))||'other'}; })
    .sort((a,b)=>b.s-a.s);
  // keep the list varied: each extra film from the same part of the world or the same track costs a little
  const out=[], reg={}, sec={};
  while(out.length<k && pool.length){
    let bi=0, bv=-Infinity;
    for(let i=0;i<Math.min(pool.length,60);i++){ const x=pool[i]; const adj=x.s - .35*(reg[x.region]||0) - .3*(sec[x.m.section]||0); if(adj>bv){ bv=adj; bi=i; } }
    const x=pool.splice(bi,1)[0]; out.push(x); reg[x.region]=(reg[x.region]||0)+1; sec[x.m.section]=(sec[x.m.section]||0)+1;
  }
  // always include at least two must-sees, whatever the taste: the closest-fitting ones, placed 3rd and 6th
  const accIn = out.filter(x=>x.m.acc);
  if(accIn.length<2){
    const add = pool.filter(x=>x.m.acc).slice(0, 2-accIn.length); add.forEach(x=>x.must=1);
    const rest = out.filter(x=>!x.m.acc).slice(0, k-accIn.length-add.length);
    const keep = out.filter(x=>x.m.acc || rest.includes(x));
    add.forEach((x,j)=>keep.splice(Math.min([2,5][j], keep.length), 0, x));
    return {pal, list:keep};
  }
  return {pal, list:out};
}
function tgReason(x, used={}){
  if(x.r) return `You picked ${x.r.by} – ${x.r.why}`;
  if(x.must) return 'A must-see, whatever your taste';
  // name the two strongest reasons, but avoid repeating the same ones down the list
  const c = x.parts.filter(p=>!TG_REGION.has(p[1]));
  const fresh = c.filter(p=>(used[p[1]]||0)<2), pick = (fresh.length>=2 ? fresh : c).slice(0,2);
  pick.forEach(p=>used[p[1]]=(used[p[1]]||0)+1);
  const w = pick.map(p=>TG_DIAL[p[1]][p[2]].toLowerCase());
  return w.length ? 'Leans ' + w.join(' and ') : 'A wildcard to widen your festival';
}

/* ---------- game screens ---------- */
const G = {i:0, p:[], lim:TG_CORE};
const TG_IC = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2.5" y="5" width="8" height="14" rx="1.5"/><rect x="13.5" y="5" width="8" height="14" rx="1.5"/></svg>';
const tgImg = f => ROOT+'posters/game/'+f+'.webp';
function tgPreload(from=0){ TG_PAIRS.slice(from, from+TG_CORE).forEach((P,j)=>setTimeout(()=>{ for(const s of [P.a,P.b]) new Image().src=tgImg(s[3]); }, j*60)); }
function openTaste(results, by){
  $('#menu')?.classList.remove('open');
  const saved=tgLoad();
  if(results && saved){ G.p=saved.p.slice(); return tgResults(); }
  G.i=0; G.p=[]; G.lim=TG_CORE; tgPreload(0);
  if(by!==undefined) return tgIntro(by);
  tgStep();
}
function tgIntro(by){
  const n = cleanName(by);
  openModal(`<div class="ask tg-intro"><span class="tg-introic">${TG_IC}</span>
    <h2>${n?`${esc(n)} invited you to play This or That`:'Play This or That'}</h2>
    <p>Pick between 10 pairs of well-known films and get a top 10 from IFFI Goa 2026 that suits your taste. Takes about a minute.</p>
    <button class="btn primary" onclick="tgStep()">Start playing</button>
    <p class="muted" style="font-size:14px;margin:12px 0 0">Free. Sign in with Google afterwards to save your list.</p></div>`, ROOT+'play/'+(n?'?by='+encodeURIComponent(n):''));
}
function tgCard(s, side){
  return `<button class="tg-film" onclick="tgPick('${side}',this)" aria-label="${esc(s[0])} (${s[1]})">
    <span class="tg-img" style="--h:${hue(s[0])}"><em>${esc(s[0])}</em><img src="${tgImg(s[3])}" alt="" decoding="async" onerror="this.remove()"></span>
    <b>${esc(s[0])}</b><small>${s[1]} · ${esc(s[2])}</small><span class="tg-hook">${esc(s[4])}</span></button>`;
}
function tgStep(){
  const P=TG_PAIRS[G.i], done=G.i, tot=G.lim;
  openModal(`<div class="tg">
    <div class="tg-top"><div class="tg-bar" role="progressbar" aria-valuemin="0" aria-valuemax="${tot}" aria-valuenow="${done}"><i style="width:${done/tot*100}%"></i></div><span>${done+1} of ${tot}</span></div>
    <h2 class="tg-q">Which is more your kind of film?</h2>
    <p class="tg-sub">Seen it or just heard of it – pick the one that’s closer to your taste.</p>
    <div class="tg-pair">${tgCard(P.a,'a')}<span class="tg-or">or</span>${tgCard(P.b,'b')}</div>
    <div class="tg-foot"><button class="linkbtn" onclick="tgBack()" ${G.i? '' : 'style="visibility:hidden"'}>‹ Back</button><button class="linkbtn" onclick="tgPick('s')">Can’t choose – skip</button></div>
  </div>`, ROOT+'play/');
}
function tgPick(c, el){
  G.p[G.i]=c;
  const go=()=>{ G.i++; if(G.i>=G.lim){ tgStore(G.p); if(G.lim<TG_PAIRS.length) tgHalf(); else tgResults(); } else tgStep(); };
  if(el){ el.classList.add('chosen'); el.parentNode.classList.add('picked'); setTimeout(go, 230); } else go();
}
function tgBack(){ if(G.i>0){ G.i--; tgStep(); } }
function tgMore(){ const s=tgLoad(); if(s && G.p.length<TG_CORE) G.p=s.p.slice(); G.lim=TG_PAIRS.length; G.i=TG_CORE; G.p.length=TG_CORE; tgPreload(TG_CORE); tgStep(); }
function tgHalf(){
  const picked=G.p.filter(c=>c==='a'||c==='b').length;
  openModal(`<div class="ask tg-half"><span class="tg-introic">${TG_IC}</span>
    <h2>10 down – nice!</h2>
    <p>${picked>=3?'We know enough to make your list now. Answer 10 more and it gets sharper.':'Only a few picks so far – 10 more will help a lot.'}</p>
    <button class="btn primary" onclick="tgResults()">Show my top 10</button>
    <button class="btn" onclick="tgMore()">Keep playing – 10 more</button></div>`, ROOT+'play/');
}
function tgShare(){
  const n = cloud.user ? firstName() : '', url = ROOT+'play/'+(n?'?by='+encodeURIComponent(n):'');
  const title = 'This or That · Festival Diaries · Goa', text = 'Play This or That and get a list of IFFI Goa 2026 films based on your taste 🎬';
  if(navigator.share && matchMedia('(pointer: coarse)').matches){ navigator.share({title, text, url}).catch(()=>{}); return; }
  const wa = 'https://wa.me/?text='+encodeURIComponent(text+'\n'+url);
  openModal(`<div class="sharedlg"><h2>Invite friends to play</h2><p>Friends play the same 10 pairs and get their own festival top 10${n?` – the link says you invited them`:''}.</p>
    <div class="shr-link"><input readonly value="${esc(url)}" onclick="this.select()" aria-label="Link to the game"><button class="icbtn" onclick="copyText('${esc(url)}')" aria-label="Copy link" title="Copy link">${IC.copy}</button></div>
    <div class="shr-opts">
      <button onclick="copyText('${esc(url)}')"><span class="ico">${IC.link}</span>Copy link</button>
      <a href="${esc(wa)}" target="_blank" rel="noopener"><span class="ico wa">${IC.wa}</span>WhatsApp</a>
      <button onclick="openTaste(true)"><span class="ico">${IC.open}</span>Back to my list</button>
    </div></div>`, ROOT+'play/');
}
function tgResults(){
  const {pal, list} = tgRecommend(G.p), picked = G.p.filter(c=>c==='a'||c==='b').length;
  if(!picked){ openModal(`<div class="ask"><h2>No picks yet</h2><p>Choose one film from at least a few pairs and we’ll suggest festival films for you.</p><button class="btn primary" onclick="openTaste()">Play again</button></div>`, ROOT+'play/'); return; }
  const dials = Object.entries(pal).filter(([d,v])=>!TG_REGION.has(d) && TG_DIAL[d][1] && Math.abs(v)>=.2).sort((a,b)=>Math.abs(b[1])-Math.abs(a[1])).slice(0,6);
  const pals = dials.map(([d,v])=>`<div class="tg-dial"><span class="${v>0?'on':''}">${TG_DIAL[d][0]}</span><i><b style="left:${(1-v)/2*100}%"></b></i><span class="${v<0?'on':''}">${TG_DIAL[d][1]}</span></div>`).join('');
  const ns = m => { const x=nextScreening(m); return x ? fmtShort(x.start)+' · '+fmtTime(x.start) : ''; };
  const used={};
  const allIn = list.every(x=>x.m.status==='want'||x.m.status==='watched');
  openModal(`<div class="tg tg-res">
    <button class="shr" aria-label="Invite friends to play" title="Invite friends" onclick="tgShare()">${IC.share}</button>
    <h2>Your festival top 10</h2>
    <p class="tg-sub">From ${picked} pick${picked>1?'s':''}. These lean towards your taste, with some variety and at least two festival must-sees mixed in.</p>
    ${pals?`<div class="tg-pal"><b>Your taste palette</b>${pals}</div>`:''}
    <ol class="tg-list">${list.map(x=>`<li${nextScreening(x.m)?' class="hg"':''}><button onclick="window._tgBack=1;openDetail('${x.m.id}')">
      <span class="tg-mini">${poster(x.m,true)}</span>
      <span class="tg-li">${x.m.acc?`<span class="tg-must">★ Must-see · ${esc(x.m.acc)}</span>`:''}<b>${esc(x.m.title)}</b><small>${esc([x.m.genre, TG_FIRST(x.m.country), x.m.runtime?x.m.runtime+' min':''].filter(Boolean).join(' · '))}</small>${ns(x.m)?`<small>Next: ${ns(x.m)}</small>`:''}<span class="tg-why">${esc(tgReason(x, used))}</span></span>
      ${x.m.status==='want'?'<span class="tg-saved" aria-label="In your watchlist">✓</span>':''}</button>${tgGoBtn(x.m)}</li>`).join('')}</ol>
    <div class="tg-acts">
      ${allIn?'<span class="tg-ok">✓ All in your watchlist</span>':`<button class="btn primary" onclick="tgSaveAll()">Save all 10 to my watchlist</button>`}
      <button class="btn" onclick="tgShare()">${IC.share} Invite friends to play</button>
      ${G.p.length<TG_PAIRS.length?`<button class="btn" onclick="tgMore()">Sharpen it: 10 more pairs</button>`:''}
      <button class="linkbtn" onclick="openTaste()">Start over</button>
    </div>
  </div>`, ROOT+'play/');
}
function tgGoBtn(m){
  const x = nextScreening(m); if(!x) return '';
  const s = x.s||x, on = !!s.going;
  return `<button class="tg-go ${on?'on':''}" aria-pressed="${on}" aria-label="${on?'Going':'Add to My Plan'}: ${esc(m.title)}, ${fmtShort(x.start)} ${fmtTime(x.start)}" onclick="tgGo('${m.id}','${s.id}')">${on?'✓ Going':'+ Going'}</button>`;
}
function tgGo(mid,sid){ const m=find(mid), s=m?.screenings.find(y=>y.id===sid); if(!s) return;
  s.going=!s.going; if(s.going && m.status!=='watched') m.status='want'; save(); render(); tgResults();
  const w = s.going && clashInfo().get(s.id);
  toast(w ? '⚠️ Clash: '+w[0]+(w.length>1?` (+${w.length-1} more)`:'') : s.going?'Added to My Plan'+signHint():'Removed from My Plan'); }
/* ---------- Pick my day: up to 6 shows on one day, matched to your taste, with no clashes ---------- */
const DP_KEY='fd-day', DP_MAX=6;
function dpLoad(){ try{ return JSON.parse(localStorage.getItem(DP_KEY)||'{}')||{}; }catch(e){ return {}; } }
function dpStore(o){ try{ localStorage.setItem(DP_KEY, JSON.stringify(o)); }catch(e){} }
let _dpSc=null;
function dpScores(){   // film id -> how well it suits you: taste (This or That), watchlist, festival track record
  const t=tgLoad(), p=t?.p||[], pal=t?tgPalette(p):null, rel={};
  if(t) p.forEach((c,i)=>{ const r=TG_PAIRS[i]?.rel?.[c]; if(r) rel[r[0].toLowerCase()]=1; });
  const out={};
  for(const m of db.movies){
    if(!isOfficial(m) || m.status==='watched' || (+m.runtime||99)<40) continue;
    let s=0; const parts=[];
    if(pal){ const v=tgVec(m); for(const d in pal){ const c=pal[d]*(v[d]||0)*TG_W(d); s+=c; if(c>0 && !TG_REGION.has(d) && TG_DIAL[d][(v[d]>0)?0:1]) parts.push([c,d,v[d]>0?0:1]); } if(rel[m.title.toLowerCase()]) s+=1.2; }
    const fest=(String(m.festivals||'').match(/Cannes|Venice|Berlin|Tor+onto|TIFF|Sundance|Locarno|Rotterdam|San Sebasti|Karlovy|Busan/gi)||[]).length;
    s += (m.acc?.8:0) + Math.min(fest,4)*.15 + (m.status==='want'?1.5:0);
    out[m.id]={s, parts:parts.sort((a,b)=>b[0]-a[0]), fest};
  }
  return _dpSc=out;
}
const dpGap = (a,b) => { const [x,y]=a.start<=b.start?[a,b]:[b,a]; return {x,y,gap:Math.round((y.start-x.end)/60000), need:travelMin(venueOf(x.s.venue),venueOf(y.s.venue))}; };
const dpFits = (a,b) => a.m.id!==b.m.id && (({gap,need})=>gap>=need)(dpGap(a,b));
function dpCandsA(date, skip=[]){ const a=dpArea(date); return dpCands(date, skip).filter(x=>dpAreaOf(x)===a); }
function dpCands(date, skip=[]){
  const n=now(), sc=_dpSc||dpScores();
  const elsewhere=new Set(allScreenings().filter(x=>x.s.going && localISO(x.start)!==date).map(x=>x.m.id));
  return allScreenings().filter(x=>localISO(x.start)===date && x.start>n && sc[x.m.id] && !skip.includes(x.m.id) && !elsewhere.has(x.m.id));
}
function dpBuild(date, skip=[], keep=[], pool){
  dpScores();
  let C=(pool||dpCandsA(date, skip)).slice().sort((a,b)=>a.start-b.start);
  const force=new Set([...keep, ...C.filter(x=>x.s.going).map(x=>x.s.id)]);
  const val = x => 4 + _dpSc[x.m.id].s + (force.has(x.s.id)?100:0);
  const hop = (a,b) => { const va=venueOf(a.s.venue), vb=venueOf(b.s.venue); return va&&vb&&va.g!==vb.g ? 1+travelMin(va,vb)/30 : 0; };
  for(let tries=0; tries<6; tries++){
    const N=C.length, best=[], prev=[];
    let top=null;
    for(let i=0;i<N;i++){ best[i]=[]; prev[i]=[]; best[i][1]=val(C[i]); prev[i][1]=-1;
      for(let k=2;k<=DP_MAX;k++){ let bv=-Infinity, bj=-1;
        for(let j=0;j<i;j++){ if(best[j][k-1]===undefined || !dpFits(C[j],C[i])) continue; const v=best[j][k-1]+val(C[i])-hop(C[j],C[i]); if(v>bv){ bv=v; bj=j; } }
        if(bj>=0){ best[i][k]=bv; prev[i][k]=bj; } }
      for(let k=1;k<=DP_MAX;k++) if(best[i][k]!==undefined && (!top || best[i][k]>top.v)) top={i,k,v:best[i][k]}; }
    if(!top) return [];
    const pick=[]; for(let i=top.i,k=top.k; i>=0 && k>=1; i=prev[i][k], k--) pick.unshift(C[i]);
    const seen=new Map(), dup=pick.find(x=>{ if(seen.has(x.m.id)) return true; seen.set(x.m.id,1); });
    if(!dup) return pick.map(x=>x.s.id);
    C=C.filter(x=>x!==dup);   // the same film twice in one day: drop the later showing and try again
  }
  return [];
}
function dpCardHtml(d){ const lab = d ? new Date(d+'T12:00').toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'short'}) : '';
  return `<button class="dpcard" onclick="openDayPick(${d?`'${d}'`:''})"><span>✨</span><span><b>Pick my day${d?' · '+esc(lab):''}</b>The day’s best films for your taste – choose yours, clashes marked</span><span class="btn sm primary">Pick</span></button>`; }
const dpItem = id => allScreenings().find(x=>x.s.id===id);
function dpDays(){ const n=now(), today=localISO(n); return [...new Set(allScreenings().filter(x=>x.start>n && x.m.status!=='watched').map(x=>localISO(x.start)))].filter(d=>d>=today && new Set(dpCands(d).map(x=>x.m.id)).size>=2).sort(); }
function dpWhy(x, used={}){
  const sc=_dpSc?.[x.m.id];
  if(x.s.going) return 'Already in your plan';
  if(x.m.status==='want') return 'In your watchlist';
  const c=(sc?.parts||[]).filter(q=>q[1]!=='length'), fresh=c.filter(q=>(used[q[1]]||0)<2), pk=(fresh.length>=2?fresh:c).slice(0,2);
  if(pk.length && tgLoad()){ pk.forEach(q=>used[q[1]]=(used[q[1]]||0)+1); return 'Leans '+pk.map(q=>TG_DIAL[q[1]][q[2]].toLowerCase()).join(' and '); }
  if(x.m.acc) return 'Festival favourite';
  if(sc?.fest) return 'Played major festivals';
  return 'A wildcard for the day';
}
function dpLeg(a,b){   // the break between two picks, and how to get there
  const {gap,need}=dpGap(a,b), va=venueOf(a.s.venue), vb=venueOf(b.s.venue);
  const brk = gap>=60 ? `${Math.floor(gap/60)} h${gap%60?' '+gap%60+' min':''} break` : `${gap} min break`;
  const move = !va||!vb||va.id===vb.id ? 'same venue' : kmBetween(va,vb)<1.2 ? `short walk to ${vb.name}` : `~${need} min to ${vb.name} (${Math.max(1,Math.round(kmBetween(va,vb)*1.4))} km)`;
  return `<div class="dp-leg">${brk} · ${esc(move)}</div>`;
}
const DP_BEST=7;
const DP_AREAS = [['pan','Panaji & Porvorim',['pan','por']],['mar','Margao',['mar']],['pon','Ponda',['pon']],['nor','North Goa beaches',['nor']]];
const dpAreaOf = x => { const g=venueOf(x.s.venue)?.g; return (DP_AREAS.find(a=>a[2].includes(g))||[])[0]; };
function dpArea(date){ if(state.dpArea) return state.dpArea; const go=allScreenings().find(x=>x.s.going && localISO(x.start)===date); return (go && dpAreaOf(go)) || 'pan'; }
const dpMode = () => 'best';
const dpKey = d => d+'|'+dpMode()+'|'+dpArea(d);
function dpBuildBest(date, skip=[]){   // the day's top films by your taste – clashes allowed, so you can choose
  dpScores();
  const C=dpCandsA(date, skip), by={};
  for(const x of C) (by[x.m.id] ||= []).push(x);
  const films=Object.keys(by).sort((p,q)=>{ const g=id=>by[id].some(x=>x.s.going)?100:0; return (g(q)+_dpSc[q].s)-(g(p)+_dpSc[p].s); }).slice(0,DP_BEST);
  const out=[];
  for(const id of films){   // if a film shows twice that day, take the showing that clashes least with the ones above it
    const opts=by[id]; const go=opts.find(x=>x.s.going);
    out.push(go || opts.map(x=>[x, out.filter(o=>!dpFits(o,x)).length]).sort((p,q)=>p[1]-q[1])[0][0]);
  }
  return out.map(x=>x.s.id);
}
function dpClash(x, items){   // the other picks this one can't be combined with
  const out=[];
  for(const y of items){ if(y===x) continue;
    const {gap,need}=dpGap(x,y); if(gap>=need) continue;
    const vx=venueOf(x.s.venue), vy=venueOf(y.s.venue), far = gap>=0 && vx && vy && vx.id!==vy.id && kmBetween(vx,vy)>=1.2;
    out.push(`${y.m.title} (${fmtTime(y.start)}${y.s.going?', in your plan':''}${gap>=0?(far?`, too far – ${vy.name} is ~${need} min away`:', too little time between'):''})`);
  }
  return out;
}
function openDayPick(date){
  const days=dpDays();
  if(!days.length){ toast('No more festival days with shows left'); return; }
  if(!date || !days.includes(date)) date = days.includes(state.day) ? state.day : days[0];
  dpScores();
  const mode=dpMode(), key=dpKey(date), all=dpLoad(); let rec=all[key];
  const valid = rec && rec.ids.every(id=>{ const x=dpItem(id); return x && x.start>now(); });
  if(!valid){ rec={ids: mode==='fit' ? dpBuild(date, rec?.skip||[]) : dpBuildBest(date, rec?.skip||[]), skip:rec?.skip||[]}; all[key]=rec; dpStore(all); }
  const items=rec.ids.map(dpItem).filter(Boolean).sort((a,b)=>a.start-b.start), used={};
  const inPlan=items.filter(x=>x.s.going).length, toAdd=items.length-inPlan;
  const chip = d => { const dd=new Date(d+'T12:00'); return `<button class="chip ${d===date?'on':''}" onclick="state.dpArea='';openDayPick('${d}')">${d===localISO(now())?'Today':dd.toLocaleDateString('en-IN',{weekday:'short',day:'numeric'})}</button>`; };
  const nClash = mode==='best' ? items.filter(x=>dpClash(x,items).length).length : 0;
  const fill = items.length<(mode==='fit'?DP_MAX:DP_BEST) && dpAlts(date, null).length;
  openModal(`<div class="dp">
    <h2>Pick my day</h2>
    <p class="tg-sub">The day’s ${DP_BEST} best matches for your taste. Some clash – tap <b>+ Going</b> on the ones you choose, or let us pick a set that all fit.</p>
    <div class="chips dp-days">${days.map(chip).join('')}</div>
    ${(()=>{ const n={}; for(const x of dpCands(date)) { const a=dpAreaOf(x); if(a) (n[a] ||= new Set()).add(x.m.id); } const av=DP_AREAS.filter(a=>(n[a[0]]?.size||0)>=2);
      return av.length>1 ? `<div class="chips dp-areas"><span class="dp-lab">Area:</span>${av.map(a=>`<button class="chip ${dpArea(date)===a[0]?'on':''}" onclick="state.dpArea='${a[0]}';openDayPick('${date}')">${a[1]} <small>${n[a[0]].size}</small></button>`).join('')}</div>` : ''; })()}
    ${tgLoad()?'':`<div class="dp-note">Picks are based on your watchlist and festival favourites. <button class="linkbtn" onclick="openTaste()">Play This or That</button> (2 min) to match them to your taste.</div>`}
    ${mode==='best' && items.length ? `<div class="dp-sum">${inPlan?`<b>${inPlan} in My Plan</b> · `:''}${nClash?`${nClash} of ${items.length} clash with another pick`:'None of these clash'}</div>`:''}
    ${items.length ? `<ol class="dp-list ${mode}">${items.map((x,i)=>{ const cl = mode==='best' ? dpClash(x,items) : [];
      return `${mode==='fit'&&i?dpLeg(items[i-1],x):''}<li id="dp-${x.s.id}" class="${cl.length?'clash':''} ${x.s.going?'in':''}">
      <div class="dp-row" onclick="openDetail('${x.m.id}')">
        <span class="dp-time"><b>${fmtTime(x.start)}</b><small>– ${fmtTime(x.end)}</small></span>
        <span class="tg-mini">${poster(x.m,true)}</span>
        <span class="tg-li"><b>${esc(x.m.title)}</b><small>📍 ${esc(venueOf(x.s.venue)?.name||x.s.venue||'')}${x.s.screen?' · '+esc(x.s.screen):''} · ${runtime(x.m)} min</small><span class="tg-why">${esc(dpWhy(x,used))}</span></span>
      </div>
      ${cl.length?`<div class="pwarn">⚠️ Clashes with: ${esc(cl.join(', '))}</div>`:''}
      <div class="dp-acts">${mode==='best' ? `<button class="btn sm ${x.s.going?'dp-on':''}" aria-pressed="${!!x.s.going}" onclick="dpGo('${date}','${x.m.id}','${x.s.id}')">${x.s.going?'✓ Going':'+ Going'}</button>` : x.s.going?'<span class="dp-in">✓ In My Plan</span>':''}<button class="btn sm" onclick="dpSwapOpen('${date}','${x.s.id}')">⇄ Swap</button><button class="btn sm" onclick="dpRemove('${date}','${x.s.id}')">Remove</button></div>
      <div class="dp-alts" hidden></div>
    </li>`; }).join('')}</ol>` : `<div class="empty"><h3>Nothing fits this day</h3>Try another day, or <button class="linkbtn" onclick="dpReset('${date}')">start this day again</button>.</div>`}
    ${fill?`<button class="btn dp-add" onclick="dpSwapOpen('${date}','')">+ Add another film</button><div id="dp-addalts" class="dp-alts" hidden></div>`:''}
    <div class="tg-acts">
      ${(()=>{ if(!toAdd) return items.length?'<span class="tg-ok">✓ All in My Plan</span>':'';
        const k=dpBuild(date,[],[],items.filter(x=>x.start>now())).filter(id=>!dpItem(id)?.s.going).length;
        return k ? `<button class="btn primary" onclick="dpAuto('${date}')">${nClash?`✨ Add the best ${k} that fit together`:`Add ${k===items.length?'all '+k:k+' more'} to My Plan`}</button>` : '<span class="dp-none">The rest clash with your plan – tap <b>⇄ Swap</b> or <b>+ Going</b> if you’d rather see one of them.</span>'; })()}
      <button class="linkbtn" onclick="dpReset('${date}')">Start this day again</button>
    </div>
  </div>`);
}
function dpGo(date, mid, sid){
  const m=find(mid), s=m?.screenings.find(y=>y.id===sid); if(!s) return;
  s.going=!s.going; if(s.going && m.status==='none') m.status='want'; save(); render(); openDayPick(date);
  const w = s.going && clashInfo().get(sid);
  toast(w ? '⚠️ In My Plan – but '+w[0] : s.going ? 'Added to My Plan' : 'Removed from My Plan');
  document.getElementById('dp-'+sid)?.scrollIntoView({block:'nearest'});
}
function dpAlts(date, sid){   // other shows that day: in No clashes mode only those that fit around the other picks
  const rec=dpLoad()[dpKey(date)]; if(!rec) return [];
  const others=rec.ids.filter(id=>id!==sid).map(dpItem).filter(Boolean);
  const used=new Set(others.map(x=>x.m.id).concat(sid?[dpItem(sid)?.m.id]:[]));
  return dpCandsA(date, rec.skip).filter(x=>!used.has(x.m.id) && (dpMode()==='best' || others.every(o=>dpFits(o,x))))
    .sort((a,b)=>(_dpSc[b.m.id]?.s||0)-(_dpSc[a.m.id]?.s||0)).slice(0,8);
}
function dpSwapOpen(date, sid){
  dpScores();
  const box = sid ? document.querySelector(`#dp-${CSS.escape(sid)} .dp-alts`) : document.getElementById('dp-addalts');
  if(!box) return;
  if(!box.hidden){ box.hidden=true; return; }
  document.querySelectorAll('.dp-alts').forEach(b=>b.hidden=true);
  const best=dpMode()==='best', alts=dpAlts(date, sid);
  const others=(dpLoad()[dpKey(date)]?.ids||[]).filter(id=>id!==sid).map(dpItem).filter(Boolean);
  box.innerHTML = alts.length ? `<div class="dp-alts-h">${sid?'Swap for':'Add'} one of these${best?' – next best for your taste that day':' – they fit around your other picks'}:</div>`+alts.map(x=>{ const c=best?dpClash(x,others.concat(x)):[];
      return `<button class="dp-alt" onclick="dpPick('${date}','${sid}','${x.s.id}')"><b>${fmtTime(x.start)}–${fmtTime(x.end)}</b> ${esc(x.m.title)}<small>📍 ${esc(venueOf(x.s.venue)?.name||x.s.venue||'')} · ${runtime(x.m)} min · ${esc(dpWhy(x))}</small>${c.length?`<small class="dp-c">⚠️ Clashes with: ${esc(c.join(', '))}</small>`:best?'<small class="dp-ok">✓ No clash with your other picks</small>':''}</button>`; }).join('')
    : `<div class="dp-alts-h">Nothing else fits around your other picks${sid?'. Remove one of them to free up time.':'.'}</div>`;
  box.hidden=false;
}
function dpPick(date, oldId, newId){
  const all=dpLoad(), rec=all[dpKey(date)]; if(!rec) return;
  rec.ids = oldId ? rec.ids.map(id=>id===oldId?newId:id) : rec.ids.concat(newId);
  if(oldId){ const om=dpItem(oldId)?.m.id; if(om && !rec.skip.includes(om)) rec.skip.push(om); }
  dpStore(all); openDayPick(date);
}
function dpRemove(date, sid){
  const all=dpLoad(), rec=all[dpKey(date)]; if(!rec) return;
  const x=dpItem(sid); rec.ids=rec.ids.filter(id=>id!==sid); if(x && !rec.skip.includes(x.m.id)) rec.skip.push(x.m.id);
  dpStore(all); openDayPick(date);
  if(x?.s.going) toast('Removed from this shortlist – it’s still in My Plan');
}
function dpAuto(date){   // from the shortlist, the best set that all fit together (keeps what's already in your plan)
  const rec=dpLoad()[dpKey(date)]; if(!rec) return;
  const pool=rec.ids.map(dpItem).filter(x=>x && x.start>now()), ids=dpBuild(date, [], [], pool);
  let k=0; for(const id of ids){ const x=dpItem(id); if(x && !x.s.going){ x.s.going=true; if(!x.m.status||x.m.status==='none') x.m.status='want'; k++; } }
  save(); render(); openDayPick(date);
  toast(k ? `Added ${k} show${k>1?'s':''} that fit together${ids.length<pool.length?' – clashing ones left out':''}` : 'Nothing more fits around what’s in your plan');
}
function dpReset(date){ const all=dpLoad(); delete all[dpKey(date)]; dpStore(all); openDayPick(date); }
function dpAddAll(date){
  const rec=dpLoad()[dpKey(date)]; if(!rec) return;
  let k=0; for(const id of rec.ids){ const x=dpItem(id); if(x && !x.s.going){ x.s.going=true; if(x.m.status==='none') x.m.status='want'; k++; } }
  save(); render(); openDayPick(date);
  const c=clashInfo(); const bad=rec.ids.find(id=>c.has(id));
  toast(bad ? '⚠️ Added – but '+c.get(bad)[0] : `Added ${k} show${k>1?'s':''} to My Plan`);
}
function tgSaveAll(after){
  const saved=tgLoad(); if(saved) G.p=saved.p.slice();
  let n=0; for(const x of tgRecommend(G.p).list) if(x.m.status==='none'||!x.m.status){ x.m.status='want'; n++; }
  save(); render(); toast(n ? `Added ${n} film${n>1?'s':''} to My Watchlist` : 'Already in your watchlist');
  if(!after || $('#scrim').classList.contains('open')) tgResults();
}
function tgHide(){ try{ localStorage.setItem(TG_KEY+'-hide','1'); }catch(e){} document.querySelector('.tbanner')?.remove(); }
function tasteBanner(){   // on top of Discover until someone has played once
  if(tgLoad()) return '';
  setTimeout(()=>{ const P=TG_PAIRS[0]; for(const x of [P.a,P.b]) new Image().src=tgImg(x[3]); }, 800);
  return `<div class="tbanner"><span class="tb-ic">${TG_IC}</span>
    <span class="tb-tx"><b>Not sure what to watch?</b><span>Play This or That and get a list based on your taste.</span></span>
    <button class="btn primary sm" onclick="openTaste()">Play</button></div>`;
}
function tasteReady(){   // after playing: signed-in people find it in the profile menu; guests get a slim reminder to save it
  if(!tgLoad() || cloud.user) return '';
  return `<button class="tready" onclick="openTaste(true)">${TG_IC}<span><b>Your festival top 10</b> · tap to see it</span><span aria-hidden="true">›</span></button>`;
}

/* ---------- actions ---------- */
const find = id => db.movies.find(m=>m.id===id);
function toggleS(mid,sid,field){
  const m=find(mid), s=m.screenings.find(s=>s.id===sid);
  s[field]=!s[field];
  if(m.status==='none' && (s.going||s.booked)) m.status='want';
  save(); render(); if($('#scrim').classList.contains('open')) openDetail(mid);
  if(s[field]){ const w=clashInfo().get(s.id); if(w) toast('⚠️ Clash: '+w[0]+(w.length>1?` (+${w.length-1} more)`:'')); }
}
function quickWatched(mid,sid){
  const m=find(mid); const s=m.screenings.find(s=>s.id===sid);
  m.status='watched'; m.watchedOn = s?.date || localISO(); m.watchedAt = sid;
  save(); render(); openDetail(mid); toast('Logged! Give it a rating ★');
}
function setStatus(mid,st){
  const m=find(mid);
  if(st==='priority'){ m.priority=!m.priority; }
  else {
    m.status = m.status===st ? 'none' : st;
    if(m.status==='watched' && !m.watchedOn) m.watchedOn = localISO();
  }
  save(); render(); openDetail(mid);
}
function setRating(mid,r){ const m=find(mid); m.rating = m.rating===r ? 0 : r; if(m.status!=='watched'){ m.status='watched'; m.watchedOn=m.watchedOn||localISO();} save(); render(); openDetail(mid); }
function toggleLike(mid){ const m=find(mid); m.liked=!m.liked; save(); render(); openDetail(mid); }
function quickSave(mid){ const m=find(mid); if(!m) return; m.status = m.status==='want' ? 'none' : 'want'; save();
  if(state.view==='all'){ const on=m.status==='want'; document.querySelectorAll(`.bm[data-mid="${mid}"]`).forEach(b=>{ b.classList.toggle('on',on); b.setAttribute('aria-label', on?'Remove from my watchlist':'Save to my watchlist'); }); $('#n-mine').textContent = db.movies.filter(x=>x.status==='want').length; }
  else render();
  toast(m.status==='want'?(cloud.user?'Saved to My Watchlist':'Saved'+signHint()):'Removed from your list'); }
function askSignIn(mid,st,sid){
  cloudInit();
  const m=find(mid), back=$('#scrim').classList.contains('open'); const sc=sid&&m?.screenings.find(y=>y.id===sid); cloud.pending = m ? {t:m.title.toLowerCase(), st, sk:sc?skey(sc):''} : null;
  openModal(`<div class="ask"><h2>${st==='watched'?'Keep track of what you watch':m?'Save films to your watchlist':'Save your festival picks'}</h2><p>Create a free account with Google so your watchlist and plan are saved and work on all your devices. Already have one? Same button.</p><button class="gbtn" onclick="cloudToggle()">${GLOGO}Continue with Google</button><button class="btn" onclick="${m&&back?`openDetail('${m.id}')`:'closeModal()'}">Not now</button>${CONSENT_NOTE}</div>`);
}
const slug = t => String(t||'').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const ytUrl = m => 'https://www.youtube.com/results?search_query=' + encodeURIComponent(`${m.title} ${m.director||''} trailer`.replace(/\s+/g,' '));
const mapUrl = v => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(/goa/i.test(v) ? v : v+', Goa');
function addToCal(mid,sid){
  const m=find(mid), s=m&&(m.screenings||[]).find(x=>x.id===sid); if(!s) return;
  const st=dt(s), en=endOf(m,s), f=d=>d.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');
  const title=`${m.title} – IFFI`, where=[s.venue,s.screen].filter(Boolean).join(', '), link=filmURL(m);
  if(/Android/i.test(navigator.userAgent)){ window.open('https://calendar.google.com/calendar/render?action=TEMPLATE&text='+encodeURIComponent(title)+'&dates='+f(st)+'/'+f(en)+'&location='+encodeURIComponent(where)+'&details='+encodeURIComponent(link), '_blank', 'noopener'); return; }
  const e = v => String(v).replace(/[\\;,]/g,c=>'\\'+c).replace(/\n/g,'\\n');
  const ics=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Festival Diaries Goa//EN','BEGIN:VEVENT','UID:'+sid+'-'+slug(m.title)+'@festivaldiaries','DTSTAMP:'+f(new Date()),'DTSTART:'+f(st),'DTEND:'+f(en),'SUMMARY:'+e(title),'LOCATION:'+e(where),'DESCRIPTION:'+e(link),'BEGIN:VALARM','TRIGGER:-PT1H','ACTION:DISPLAY','DESCRIPTION:'+e(title),'END:VALARM','END:VEVENT','END:VCALENDAR'].join('\r\n');
  const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([ics],{type:'text/calendar'})); a.download=slug(m.title)+'.ics'; document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}
function shareFilm(mid){
  const m=find(mid); if(!m) return;
  const url = filmURL(m);
  const text = `${m.title}${m.director?' by '+m.director:''} – at IFFI Goa 2026`;
  if(navigator.share) navigator.share({title:m.title, text, url}).catch(()=>{});
  else window.open('https://wa.me/?text='+encodeURIComponent(text+'\n'+url), '_blank', 'noopener');
}
function openFromHash(){
  const r=initRoute.pending; initRoute.pending=null;
  if(r && !openRoute(r)) toast('That page isn’t here any more – showing all films');
  syncTitle();
}
window.addEventListener('hashchange', ()=>{ if(/(film|venue)=/.test(location.hash)){ initRoute(); openFromHash(); } });
function saveReview(mid,v){ const m=find(mid); m.review=v; save(); }
function delMovie(mid){ if(!confirm('Delete this film and its showtimes?')) return; db.movies=db.movies.filter(m=>m.id!==mid); save(); closeModal(); render(); toast('Deleted'); }

/* ---------- modals ---------- */
function openModal(html, url){ const wasOpen=$('#scrim').classList.contains('open'); $('#modal').innerHTML = `<button class="x" onclick="closeModal()" aria-label="Close">×</button>` + html; $('#scrim').classList.add('open'); document.body.style.overflow='hidden'; if(!wasOpen && !history.state?.modal) history.pushState({modal:1},'',url||location.href); else if(url && location.href!==url) history.replaceState(history.state,'',url); syncTitle(); if(!wasOpen){ openModal._ret=document.activeElement; $('#modal .x').focus({preventScroll:true}); } }
function closeModal(fromBack){ if(!$('#scrim').classList.contains('open')) return; window._tgBack=0; $('#scrim').classList.remove('open'); document.body.style.overflow=''; try{ openModal._ret?.focus({preventScroll:true}); }catch(e){} if(fromBack!==true && history.state?.modal) history.back(); }
window.addEventListener('popstate', ()=>{ if($('#sheet').classList.contains('open')) closeSheet(true); else if($('#scrim').classList.contains('open')) closeModal(true); });
window.addEventListener('popstate', ()=>{   // keep the page in step with the URL (back / forward)
  const r=routeOf();
  if(r.film||r.venue||r.privacy||r.howto||r.play||r.list!==undefined){ if(!$('#scrim').classList.contains('open')) openRoute(r); }
  else if(state.view!==r.view) setView(r.view, true);
  syncTitle();
});

function openDetail(id){
  const m = find(id); if(!m) return;
  if(!DETAIL && window.__DETAIL_URL) ensureDetails().then(()=>{ if($('#scrim').classList.contains('open') && location.href===filmURL(m)) openDetail(id); });
  const n = now(), cl = planCtx(), ci = cl.info;
  const scr = [...(m.screenings||[])].sort((a,b)=>dt(a)-dt(b));
  const r = m.rating||0;
  const starsHtml = [1,2,3,4,5].map(i=>{
    const full = r>=i, half = !full && r>=i-.5;
    return `<span class="${full||half?'on':''}" title="Click: ${i} · Shift-click: ${i-.5}" onclick="setRating('${m.id}', event.shiftKey||event.altKey ? ${i-.5} : ${i})">${half?'⯪':'★'}</span>`;
  }).join('');
  const cs = String(m.country||'').split(',').map(x=>x.trim()).filter(Boolean);
  const meta = [m.genre, cs.length ? cs[0]+(cs.length>1?` +${cs.length-1}`:'') : '', m.language, m.runtime?m.runtime+' min':''].filter(Boolean).map(esc).join(' · ');
  const extra = [m.originalTitle?`<div><b>Original title:</b> ${esc(m.originalTitle)}</div>`:'', cs.length>1?`<div><b>Countries:</b> ${esc(cs.join(', '))}</div>`:'', m.cast?`<div><b>Cast:</b> ${esc(m.cast)}</div>`:'', m.festivals?`<div><b>Festivals:</b> ${esc(String(m.festivals).replace(/\s*\|\s*/g,', '))}</div>`:'', m.notes?`<div>${esc(m.notes)}</div>`:''].join('');
  const going = scr.find(s=>(s.going||s.booked) && endOf(m,s)>n);
  const I = d => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const X = allScreenings().filter(x=>x.m===m && (m.status!=='watched' || x.end>n)), upN = X.filter(x=>x.end>n).length;
  const notes = [...new Set(X.map(x=>x.s.note).filter(Boolean))];
  const vl = x => { const v=venueOf(x.s.venue); return v ? `<a class="vlink" href="${venueURL(v)}" onclick="event.preventDefault();openVenue('${v.id}')">${esc(v.name)}</a>` : esc(x.s.venue||'Venue TBA'); };
  const showsHtml = X.length ? `<section class="dshows" id="dshows"><div class="dsh-h"><b>${upN?'Pick a showtime':'Showtimes'}</b><span>${upN?`${upN} show${upN>1?'s':''} left`:'All shows are over'}</span></div>
    ${notes.map(t=>`<div class="snote">${esc(t)}</div>`).join('')}
    <div class="tchips">${X.map(x=>timeChip(x,cl,n,true)).join('')}</div>
    ${X.filter(x=>x.s.going && x.end>n).map(x=>`<div class="dgo"><span>✓ <b>Going · ${fmtShort(x.start)}, ${fmtTime(x.start)}–${fmtTime(x.end)}</b><br>📍 ${vl(x)}${x.s.screen?' · '+esc(x.s.screen):''}</span><button class="btn sm" onclick="addToCal('${m.id}','${x.s.id}')">📅 Add to calendar</button></div>${clashHtml(ci,x.s.id)}`).join('')}
    <div class="srcline">From the official IFFI 2026 schedule · tap a time to add it to My Plan</div></section>` : '';
  const tgb = window._tgBack ? `<button class="linkbtn tg-back" onclick="openTaste(true)">‹ Your top 10</button>` : '';
  openModal(tgb+`<button class="shr" aria-label="Share this film" title="Share" onclick="shareFilm('${m.id}')">${I('<path d="M12 15V3.5M7.5 8L12 3.5 16.5 8"/><path d="M5 12.5v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/>')}</button><div class="dhead">
    <a class="dposter" href="${ytUrl(m)}" target="_blank" rel="noopener" aria-label="Watch the trailer of ${esc(m.title)} on YouTube">${poster(m,false,true)}<span class="play"><svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M7 4.5v15l12.5-7.5z" fill="currentColor"/></svg>Trailer</span></a>
    <div class="dinfo">
      <h2>${esc(m.title)}</h2>
      ${meta?`<div class="dmeta">${meta}</div>`:''}
      ${m.director?`<div class="dmeta">Directed by <b>${esc(m.director)}</b></div>`:''}
      ${m.section?`<div class="dmeta">${esc(m.section)}</div>`:''}
      <div class="dmeta wlc" data-f="${wlSlug(m)}" hidden></div>
    </div>
  </div>
  ${m.status==='watched'
    ? `<div class="myrate"><span>✓ You’ve seen this</span><div class="rate">${starsHtml}</div><button class="linkbtn" onclick="setStatus('${m.id}','watched')">Undo</button></div>` : ''}
  ${showsHtml}
  ${m.status!=='watched' ? `<div class="dacts">${going ? '' : `<button class="pillbtn ${m.status==='want'?'on':''}" aria-pressed="${m.status==='want'}" onclick="setStatus('${m.id}','want')">${m.status==='want'?I('<path d="M5 12.5l4.5 4.5L19 7.5"/>'):IC.bookmark}${m.status==='want'?'In my watchlist':'Save for later'}</button>`}${festOn()?`<button class="linkbtn" onclick="setStatus('${m.id}','watched')">Already seen it?</button>`:''}</div>` : ''}
  ${m.synopsis||extra?`<div class="dsyn"><p class="syn clamp">${esc(m.synopsis||'')}</p><div class="dextra" hidden>${extra}</div><button class="linkbtn rmore" onclick="const d=this.parentNode;const o=d.classList.toggle('open');d.querySelector('.dextra').hidden=!o;this.textContent=o?'Show less':'Read more'">Read more</button></div>`:''}
  ${ratingsBlock(m)}
  ${m.status==='watched' ? `<div class="myrate"><span>Your rating</span><div class="rate">${starsHtml}</div></div>` : ''}
  `, filmURL(m));
  fillCount(m);
}

let editScr = [];
function openEdit(id){
  const m = id ? find(id) : {status:'want', screenings:[]};
  editScr = JSON.parse(JSON.stringify(m.screenings||[]));
  const opt = (arr,v) => arr.map(x=>`<option ${x===v?'selected':''}>${esc(x)}</option>`).join('');
  openModal(`<h2 style="margin:0 0 14px">${id?'Edit film':'Add a film'}</h2>
  <form id="f" onsubmit="event.preventDefault();submitEdit('${id||''}')">
    <div class="g">
      <label class="full">Title *<input name="title" required value="${esc(m.title||'')}" autofocus></label>
      <label>Original title<input name="originalTitle" value="${esc(m.originalTitle||'')}"></label>
      <label>Director<input name="director" value="${esc(m.director||'')}"></label>
      <label>Country<input name="country" value="${esc(m.country||'')}"></label>
      <label>Language<input name="language" value="${esc(m.language||'')}"></label>
      <label>Genre<input name="genre" value="${esc(m.genre||'')}" placeholder="Drama, Thriller"></label>
      <label>Year<input name="year" type="number" value="${esc(m.year||'')}"></label>
      <label>Runtime (min)<input name="runtime" type="number" value="${esc(m.runtime||'')}" placeholder="120"></label>
      <label>Section<select name="section"><option value="">—</option>${opt(db.sections,m.section)}</select></label>
      <label>Status<select name="status">
        <option value="want" ${m.status==='want'?'selected':''}>Want to watch</option>
        <option value="watched" ${m.status==='watched'?'selected':''}>Watched</option>
        <option value="none" ${m.status==='none'?'selected':''}>Just tracking</option></select></label>
      <label class="full">Poster image URL<input name="poster" value="${esc(m.poster||'')}" placeholder="https://… (optional)"></label>
      <label class="full">Synopsis<textarea name="synopsis" rows="3">${esc(m.synopsis||'')}</textarea></label>
      <label>Notes (buzz, who recommended…)<input name="notes" value="${esc(m.notes||'')}"></label>
      <label>Link (IFFI page, trailer)<input name="link" value="${esc(m.link||'')}"></label>
      <label class="full">IMDb ID (optional – e.g. tt1234567, makes ratings match exactly)<input name="imdbID" value="${esc(m.imdbID||'')}" placeholder="tt…"></label>
      <label class="full">Tags (comma separated)<input name="tags" value="${esc((m.tags||[]).join(', '))}" placeholder="Competition, India Premiere, …"></label>
      <label style="flex-direction:row;align-items:center;gap:8px;color:var(--text)"><input type="checkbox" name="confirmedOn" ${m.confirmed?.on?'checked':''} style="width:auto"> Screening confirmed</label>
      <label>Confirmation source (link or note)<input name="confirmedSource" value="${esc(m.confirmed?.source||'')}" placeholder="https://… or 'IFFI app schedule'"></label>
      <label class="full" style="flex-direction:row;align-items:center;gap:8px;color:var(--text)"><input type="checkbox" name="priority" ${m.priority?'checked':''} style="width:auto"> Must-see (highlight in schedule)</label>
    </div>
    <div style="font-weight:700;margin:16px 0 8px;display:flex;justify-content:space-between;align-items:center">Showtimes <button type="button" class="btn sm" onclick="addScr()">+ Add showtime</button></div>
    <datalist id="venues">${db.venues.map(v=>`<option value="${esc(v)}">`).join('')}</datalist>
    <div id="scrList"></div>
    <div class="foot"><span></span><div style="display:flex;gap:8px"><button type="button" class="btn" onclick="${id?`openDetail('${id}')`:'closeModal()'}">Cancel</button><button class="btn primary">Save film</button></div></div>
  </form>`);
  if(!id && !editScr.length) addScr(); else drawScr();
}
function drawScr(){
  $('#scrList').innerHTML = editScr.length ? editScr.map((s,i)=>`<div class="sedit">
    <input type="date" value="${esc(s.date||'')}" oninput="editScr[${i}].date=this.value">
    <input type="time" value="${esc(s.time||'')}" oninput="editScr[${i}].time=this.value">
    <input list="venues" placeholder="Venue" value="${esc(s.venue||'')}" oninput="editScr[${i}].venue=this.value">
    <input placeholder="Screen / Audi" value="${esc(s.screen||'')}" oninput="editScr[${i}].screen=this.value">
    <input placeholder="Source (link)" value="${esc(s.source||'')}" oninput="editScr[${i}].source=this.value">
    <div style="display:flex;gap:6px;align-items:center">
      <button type="button" class="btn sm danger" onclick="editScr.splice(${i},1);drawScr()">✕</button>
    </div>
  </div>`).join('') : `<div style="color:var(--muted);font-size:15px">No showtimes. You can add them later.</div>`;
}
function addScr(){
  const last = editScr[editScr.length-1];
  editScr.push({id:uid(), date: last?.date || defaultDate(), time:'', venue:last?.venue||'', screen:'', source:'', going:false});
  drawScr();
}
function defaultDate(){ return localISO(); }
function submitEdit(id){
  const fd = new FormData($('#f'));
  const data = Object.fromEntries(fd.entries());
  data.priority = !!fd.get('priority');
  data.tags = String(data.tags||'').split(',').map(t=>t.trim()).filter(t=>t && t!==CONF);
  data.confirmed = {on: !!fd.get('confirmedOn'), source: (data.confirmedSource||'').trim()};
  delete data.confirmedOn; delete data.confirmedSource;
  data.runtime = data.runtime ? +data.runtime : '';
  const scr = editScr.filter(s=>s.date).map(s=>({...s, going: !!(s.going || s.booked), booked:false, seat:''}));
  scr.forEach(s=>{ if(s.venue && !db.venues.includes(s.venue)) db.venues.splice(db.venues.length-1,0,s.venue); });
  let m;
  const idKey = x => [x.title,x.originalTitle,x.year,x.imdbID].join('|');
  const changed = !id || idKey(find(id)) !== idKey(data);
  if(id){ m=find(id); Object.assign(m, data, {screenings:scr}); if(changed) delete m.ratings; }
  else { m={id:uid(), added:Date.now(), rating:0, ...data, screenings:scr}; db.movies.push(m); }
  if(m.status==='watched' && !m.watchedOn) m.watchedOn = localISO();
  save(); render(); openDetail(m.id); toast(id?'Saved':'Added to your diary');
  if(changed && db.omdbKey) fetchRatings(m.id);
}

/* ---------- ratings (OMDb: IMDb + Rotten Tomatoes + Metacritic) ---------- */
function ratingsBlock(m){
  const r = m.ratings, t = encodeURIComponent(m.title), q = encodeURIComponent(m.title+(m.year?' '+m.year:''));
  const chip = (icon,label,val,href) => `<a class="rchip" href="${href}" target="_blank" rel="noopener"><span>${icon}</span><b>${esc(val)}</b><small>${label}</small></a>`;
  let chips = '';
  if(r && !r.notFound){
    if(r.rt) chips += chip('🍅','Rotten Tomatoes',r.rt,`https://www.rottentomatoes.com/search?search=${t}`);
    if(r.imdb) chips += chip('⭐','IMDb'+(r.imdbVotes?` · ${esc(r.imdbVotes)} votes`:''),r.imdb+'/10',`https://www.imdb.com/title/${esc(r.imdbID)}/`);
    if(r.mc) chips += chip('Ⓜ️','Metacritic',r.mc,`https://www.metacritic.com/search/${t}/`);
  }
  return chips ? `<div class="ratings"><div class="rrow">${chips}</div></div>` : '';
}
function setKey(cb){
  const k = prompt('Ratings come from OMDb (IMDb, Rotten Tomatoes, Metacritic).\nGet a free key at omdbapi.com/apikey.aspx (it arrives by email), then paste it here:', db.omdbKey||'');
  if(k===null) return;
  db.omdbKey = k.trim(); save();
  if(db.omdbKey){ toast('Key saved'); if(typeof cb==='function') cb(); }
}
async function fetchRatings(mid, quiet){
  const m = find(mid); if(!m) return;
  if(!db.omdbKey){ if(!quiet) setKey(()=>fetchRatings(mid)); return; }
  const get = async qs => (await fetch(`https://www.omdbapi.com/?apikey=${encodeURIComponent(db.omdbKey)}&type=movie${qs}`)).json();
  const yr = m.year ? `&y=${encodeURIComponent(m.year)}` : '';
  try{
    let d;
    if(m.imdbID) d = await get(`&i=${encodeURIComponent(m.imdbID.trim())}`);
    else {
      d = await get(`&t=${encodeURIComponent(m.title)}${yr}`);
      if(d.Response==='False' && m.originalTitle) d = await get(`&t=${encodeURIComponent(m.originalTitle)}${yr}`);
      if(d.Response==='False' && m.year){ // retry without year, but only accept a close year (avoids matching an old film of the same name)
        const d2 = await get(`&t=${encodeURIComponent(m.title)}`);
        if(d2.Response!=='False' && Math.abs(parseInt(d2.Year)-m.year)<=1) d = d2;
      }
    }
    if(d.Error && /key/i.test(d.Error)){ toast('OMDb says the key is invalid or not activated yet'); return 'stop'; }
    if(d.Error && /limit/i.test(d.Error)){ toast('OMDb daily limit reached – try tomorrow'); return 'stop'; }
    const ok = v => v && v!=='N/A' ? v : '';
    if(d.Response==='False') m.ratings = {notFound:true, fetched:Date.now()};
    else {
      const R = Object.fromEntries((d.Ratings||[]).map(x=>[x.Source,x.Value]));
      m.ratings = {rt:ok(R['Rotten Tomatoes']), mc:ok(R['Metacritic']), imdb:ok(d.imdbRating), imdbVotes:ok(d.imdbVotes), imdbID:d.imdbID, matched:`${d.Title} (${d.Year})`, fetched:Date.now()};
      if(!m.poster && ok(d.Poster)) m.poster = d.Poster;
      if(!m.genre && ok(d.Genre)){ m.genre = d.Genre; (m.sources ||= []).push({label:'OMDb (genre)', url:`https://www.imdb.com/title/${d.imdbID}/`}); }
      if(!m.runtime && parseInt(d.Runtime)) m.runtime = parseInt(d.Runtime);
    }
    save(); render();
    if(!quiet && $('#scrim').classList.contains('open')) openDetail(mid);
  }catch(e){ if(!quiet) toast('Could not reach OMDb – are you online?'); return 'stop'; }
}
async function fetchAll(){
  if(!db.omdbKey) return setKey(fetchAll);
  const list = db.movies.filter(m => !m.ratings || Date.now()-m.ratings.fetched > 864e5);
  if(!list.length) return toast('All ratings are fresh (updated in the last day)');
  toast(`Fetching ratings for ${list.length} film${list.length>1?'s':''}…`);
  for(const m of list){ if(await fetchRatings(m.id, true)==='stop') return toast('Stopped: OMDb error (key, limit or offline)'); }
  toast('Ratings updated');
}

/* ---------- menu ---------- */
function download(name, text, type){
  const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([text],{type})); a.download=name; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
function menuAction(a){
  $('#menu').classList.remove('open');
  if(a==='export') download(`iffi-diary-${localISO()}.json`, JSON.stringify({...db, omdbKey:undefined},null,2), 'application/json');
  if(a==='import') $('#file').click();
  if(a==='official') loadOfficial();
  if(a==='ics') exportICS();
  if(a==='venues') editLists();
  if(a==='wipe'){ if(confirm('Erase all films, showtimes and ratings? Export a backup first if unsure.')){ db={movies:[],venues:[...DEFAULT_VENUES],sections:[...DEFAULT_SECTIONS]}; save(); render(); } }
  if(a==='demo') loadDemo();
  if(a==='ratings') fetchAll();
  if(a==='key') setKey();
  if(a==='cloud') cloudToggle();
  if(a==='privacy') openPrivacy();
  if(a==='howto') openHowto();
  if(a==='taste') openTaste(!!tgLoad());
  if(a==='account') openAccount();
  if(a==='mine') setView('mine');
  if(a==='plan'){ state.smode='plan'; setView('schedule'); }
}
$('#file').onchange = async e => {
  const f=e.target.files[0]; if(!f) return;
  try{
    const d = JSON.parse(await f.text());
    const incoming = Array.isArray(d) ? d : d.movies;
    if(!Array.isArray(incoming)) throw 0;
    const replace = !window._forceMerge && !Array.isArray(d) && confirm('OK = replace everything with this backup.\nCancel = merge these films into your diary.');
    if(replace){ db = {venues:DEFAULT_VENUES, sections:DEFAULT_SECTIONS, ...d, omdbKey:db.omdbKey}; }
    else {
      let added=0, updated=0;
      for(const m of incoming){
        if(!m.title) continue;
        const ex = db.movies.find(x=>x.title.toLowerCase()===String(m.title).toLowerCase());
        const screenings = (m.screenings||[]).map(s=>({id:uid(),...s}));
        if(ex){
          if(screenings.some(s=>s.off)){   // official schedule: replace earlier official showtimes, keep your own picks
            const prev=Object.fromEntries((ex.screenings||[]).filter(s=>s.off).map(s=>[s.id,s]));
            ex.screenings = [...(ex.screenings||[]).filter(s=>!s.off), ...screenings.map(s=>({...s, going:!!(prev[s.id]?.going||prev[s.id]?.booked), booked:false, seat:''}))];
          } else ex.screenings = [...(ex.screenings||[]), ...screenings.filter(s=>!ex.screenings.some(o=>o.date===s.date&&o.time===s.time&&o.venue===s.venue))];
          for(const k of ['notes','originalTitle','genre','genreUnverified','recRank','director','country','language','year','runtime','section','synopsis','poster','link','cast','festivals','premiere','pc']) if(k in m) ex[k]=m[k];   // official list is the source of truth
          ex.tags = m.tags ? [...m.tags] : (ex.tags||[]);   // official list decides the tags
          ex.sources = [...(ex.sources||[]), ...(m.sources||[]).filter(x=>!(ex.sources||[]).some(o=>o.url===x.url))];
          if(m.confirmed?.on && !ex.confirmed?.on) ex.confirmed = m.confirmed;
          updated++;
        }
        else { db.movies.push({status:'want', rating:0, ...m, id:uid(), added:Date.now(), screenings}); added++; }
      }
      if(!window._quiet) toast(`Imported ${added} new film${added===1?'':'s'}${updated?`, updated ${updated}`:''}`);
    }
    save(); render();
  }catch(err){ alert('That file is not a valid Festival Diaries backup or film list.'); }
  e.target.value=''; window._forceMerge=false; window._quiet=false;
};
async function loadOfficial(){
  try{
    const txt = officialText() || '';
    if(!txt.trim()) throw 0;
    const dt = new DataTransfer(); dt.items.add(new File([txt], 'iffi-2026-films.json', {type:'application/json'}));
    window._forceMerge = true; $('#file').files = dt.files; $('#file').dispatchEvent(new Event('change'));
  }catch(e){ alert('Could not load the built-in film list.'); }
}
function exportICS(){
  const ev = allScreenings().filter(x=>x.s.booked||x.s.going);
  if(!ev.length) return toast('Mark some shows as Going first');
  const f = d => d.toISOString().replace(/[-:]/g,'').replace(/\.\d+/,'');
  const lines = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Festival Diaries Goa//EN'];
  for(const x of ev) lines.push('BEGIN:VEVENT',`UID:${x.s.id}@iffi-diary`,`DTSTAMP:${f(new Date())}`,`DTSTART:${f(x.start)}`,`DTEND:${f(x.end)}`,
    `SUMMARY:${x.m.title}`,`LOCATION:${[x.s.venue,x.s.screen].filter(Boolean).join(' - ')}`,`DESCRIPTION:${[x.m.director&&'Dir. '+x.m.director,x.m.section].filter(Boolean).join(' | ')}`,'END:VEVENT');
  lines.push('END:VCALENDAR');
  download('iffi-shows.ics', lines.join('\r\n'), 'text/calendar');
}
function editLists(){
  openModal(`<h2 style="margin:0 0 12px">Venues &amp; sections</h2>
  <form onsubmit="event.preventDefault();db.venues=$('#lv').value.split('\\n').map(s=>s.trim()).filter(Boolean);db.sections=$('#ls').value.split('\\n').map(s=>s.trim()).filter(Boolean);save();closeModal();render();toast('Saved')">
    <div class="g">
      <label>Venues (one per line)<textarea id="lv" rows="12">${esc(db.venues.join('\n'))}</textarea></label>
      <label>Sections (one per line)<textarea id="ls" rows="12">${esc(db.sections.join('\n'))}</textarea></label>
    </div>
    <div class="foot"><button type="button" class="btn" onclick="$('#lv').value=DEFAULT_VENUES.join('\\n');$('#ls').value=DEFAULT_SECTIONS.join('\\n')">Reset to defaults</button><button class="btn primary">Save</button></div>
  </form>`);
}
function loadDemo(){
  // Fictional demo films so you can see how the app works. Delete them anytime.
  const base = new Date(); base.setHours(0,0,0,0);
  const day = k => { const d=new Date(base); d.setDate(d.getDate()+k); return localISO(d); };
  const demo = [
    {title:'The Salt Orchard', director:'Demo Director A', country:'Portugal', language:'Portuguese', year:2026, runtime:104, section:'International Competition', priority:true, synopsis:'(Demo) A widowed fisherman inherits a failing orchard on a windswept coast.', screenings:[{date:day(5),time:'10:00',venue:'INOX Panaji (Old GMC)',screen:'Audi 1',going:true,going:true,seat:'F12'},{date:day(7),time:'17:30',venue:'Maquinez Palace',screen:'Screen 2'}]},
    {title:'Monsoon Ledger', director:'Demo Director B', country:'India', language:'Konkani', year:2026, runtime:118, section:'Indian Panorama – Feature', synopsis:'(Demo) An accountant in Margao finds a decades-old ledger.', screenings:[{date:day(5),time:'11:15',venue:'Kala Academy',screen:'Dinanath Mangeshkar Hall',going:true},{date:day(8),time:'20:00',venue:'INOX Porvorim',screen:'Audi 3'}]},
    {title:'Paper Lanterns Over Seoul', director:'Demo Director C', country:'South Korea', language:'Korean', year:2025, runtime:96, section:'Cinema of the World', screenings:[{date:day(6),time:'14:00',venue:'INOX Panaji (Old GMC)',screen:'Audi 4'}]},
    {title:'Northern Quiet', director:'Demo Director D', country:'Finland', language:'Finnish', year:2026, runtime:89, section:'Best Debut Feature', screenings:[{date:day(6),time:'19:45',venue:'Maquinez Palace',screen:'Screen 1'}]},
    {title:'The Last Projectionist', director:'Demo Director E', country:'Iran', language:'Persian', year:2025, runtime:110, section:'Festival Kaleidoscope', status:'watched', rating:4.5, liked:true, watchedOn:day(-1), review:'(Demo) Gorgeous love letter to cinema.', screenings:[{date:day(-1),time:'18:00',venue:'INOX Panaji (Old GMC)',screen:'Audi 2',going:true,going:true}]},
  ];
  for(const d of demo){ db.movies.push({status:'want', rating:0, ...d, id:uid(), added:Date.now(), screenings:d.screenings.map(s=>({id:uid(),going:false,...s}))}); }
  save(); render(); toast('Demo films added — delete them whenever you like');
}

/* ---------- privacy notice (India DPDP Act 2023) ---------- */
const PRIVACY_V = 1;
const PRIVACY_CONTACT = 'tejaswiraghurama@gmail.com';   // grievance e-mail shown in the notice
const CONSENT_NOTE = `<p class="consent">Signing in saves your name, email and film lists so they sync across your devices. Nothing else is collected. <a href="privacy/" onclick="openPrivacy();return false">Privacy notice</a></p>`;
function privacyHtml(){
  const mail = PRIVACY_CONTACT ? `<a href="mailto:${esc(PRIVACY_CONTACT)}">${esc(PRIVACY_CONTACT)}</a>` : 'the contact on this page';
  const act = cloud.user
    ? `<div class="pact"><p>You’re signed in as <b>${esc(cloud.user.email||cloud.user.displayName||'')}</b>. To download or delete your data, go to <a href="#" onclick="openAccount();return false">Account &amp; data</a>.</p></div>`
    : '';
  return `<article class="priv">
<h2>Privacy &amp; your data</h2><p class="upd">Last updated 17 November 2026</p>
<p>Festival Diaries · Goa is a free, unofficial fan guide to IFFI Goa 2026, run privately by a film fan – not a company. This notice explains what we collect and why, in line with India’s Digital Personal Data Protection Act, 2023.</p>
<h3>If you don’t sign in</h3>
<p>We collect nothing. Anything you do stays on your own phone or computer – including your This or That picks. There are no ads, no analytics and no tracking cookies.</p>
<h3>If you sign in with Google</h3>
<p>We store:</p>
<ul><li>your <b>name, email address and profile photo</b>, which Google shares when you sign in</li>
<li>your <b>film lists</b> – films you want to see or have seen, showtimes you’re going to, ratings, notes and any films you add</li>
<li>the date you agreed to this notice</li></ul>
<p><b>Why:</b> only to save your lists and show them on all your devices. We never sell or share your data, and never use it for advertising.</p>
<h3>Where it’s kept</h3>
<p>On Google Firebase, which may store it on servers outside India. Google handles it for us under its own security and privacy terms.</p>
<h3>How long we keep it</h3>
<p>Until you delete your account. If we ever close the site, we’ll delete all accounts.</p>
<h3>Your rights</h3>
<ul><li><b>See and correct</b> your data any time in My Watchlist.</li>
<li><b>Get a copy of your data:</b> use <b>Download my data</b> under Account &amp; data in the account menu (your photo, top right).</li>
<li><b>Withdraw consent and delete everything:</b> use <b>Delete my account</b> under Account &amp; data. Your name, email and lists are erased immediately. Signing out alone keeps your lists saved.</li>
<li><b>Questions or complaints:</b> write to ${mail}. We’ll reply within 30 days. If you’re not satisfied, you can complain to the Data Protection Board of India.</li></ul>
<h3>Children</h3>
<p>Signing in is for adults (18+). Anyone under 18 can use the whole guide without signing in.</p>
<h3>Watchlist counts</h3>
<p>When you save a film to your watchlist while signed in, it adds one to that film’s count, such as “3 people want to see this”. Only the number is shown – never your name or who saved it. Removing the film, or deleting your account, takes you out of the count.</p>
<h3>Shared lists</h3>
<p>If you share your watchlist, the link shows your first name and the films on it to anyone you send it to. Nothing is stored for it.</p>
<h3>Other sites</h3>
<p>Trailer, map, calendar and ratings links open other sites (YouTube, Google Maps, IMDb and others), which have their own privacy policies. If you add an OMDb key for ratings, it stays on your device.</p>
<h3>If something goes wrong</h3>
<p>If your data were ever exposed, we would tell you and the Data Protection Board.</p>
${act}</article>`;
}
function openAccount(){
  $('#menu').classList.remove('open');
  const u = cloud.user; if(!u) return askSignIn();
  const nw = db.movies.filter(m=>m.status==='want').length, nd = db.movies.filter(m=>m.status==='watched').length;
  const np = allScreenings().filter(x=>x.s.going).length, nc = db.movies.filter(m=>!isOfficial(m)).length;
  const since = cloud.consent?.at ? new Date(cloud.consent.at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}) : '';
  openModal(`<div class="accpg">
    <h2>Account &amp; data</h2>
    <div class="acc-id"><span class="acct-av big">${$('#menuBtn').innerHTML}</span><div><b>${esc(u.displayName||'Signed in')}</b><span>${esc(u.email||'')}</span><small>Signed in with Google</small></div></div>
    <h3>Your data</h3>
    <ul class="acc-stats"><li><b>${nw}</b> to watch</li><li><b>${nd}</b> watched</li><li><b>${np}</b> in your plan</li>${nc?`<li><b>${nc}</b> films you added</li>`:''}</ul>
    <p class="muted">Saved to your account so it syncs across your devices.${since?` You agreed to the privacy notice on ${since}.`:''} <a href="privacy/" onclick="openPrivacy();return false">Privacy notice</a></p>
    <button class="pillbtn" onclick="downloadMyData()">${IC.download}Download my data</button>
    <div class="danger-zone">
      <h3>Delete account</h3>
      <p class="muted">Permanently erases your name, email and all your lists. This can’t be undone.</p>
      <button class="pillbtn danger" onclick="deleteAccount()">${IC.trash}Delete my account</button>
    </div></div>`);
}
function downloadMyData(){
  const u = cloud.user; if(!u) return;
  const marks = {}; for(const m of db.movies) if(isOfficial(m)){ const e=localMark(m); if(e) marks[m.title]=e; }
  const data = {exported:new Date().toISOString(), account:{name:u.displayName||'', email:u.email||''}, consent:cloud.consent||null, films:marks, filmsYouAdded:db.movies.filter(m=>!isOfficial(m))};
  download(`festival-diaries-my-data-${localISO()}.json`, JSON.stringify(data,null,2), 'application/json');
  toast('Downloaded');
}
/* ---------- How to use: a step-by-step guide with small pictures made from the real buttons ---------- */
function howtoHtml(){
  const st = (n,ic,t,p,demo) => `<li class="hw-step"><span class="hw-n" aria-hidden="true">${n}</span><div class="hw-body"><h3><span class="hw-ic" aria-hidden="true">${ic}</span>${t}</h3><p>${p}</p>${demo?`<div class="hw-demo" aria-hidden="true" inert>${demo}</div>`:''}</div></li>`;
  const chip = (cls,d,t,pl,i) => `<span class="tchip ${cls}"><small class="tdate">${d}</small><b>${t}</b><span>${pl}</span>${i?`<i class="${cls==='warn'?'cw':''}">${i}</i>`:''}</span>`;
  const flow = [['🔍','Find'],['🔖','Save'],['🕘','Schedule'],['🎬','Watch']].map(([e,l],i)=>`${i?'<span class="hw-arr">→</span>':''}<span class="hw-f"><span>${e}</span>${l}</span>`).join('');
  return `<div class="howto">
    <h2>How to use Festival Diaries</h2>
    <p class="hw-lead">Plan IFFI Goa 2026 in four moves – find films, save them, pick showtimes that fit, then watch and rate. It’s free; your picks are saved on your phone.</p>
    <div class="hw-flow">${flow}</div>
    <ol class="hw-steps">
      ${st(1,'🔍','Find films','Search by title or director, or use <b>Filters</b> for genre, country, track and venue. <b>Acclaimed</b> shows the 20 films with the strongest festival record. Not sure? Play <b>This or That</b> for a top 10 that suits your taste.',
        `<span class="hw-search">Search films or directors</span><div class="hw-row"><span class="fpill">Filters</span><span class="fpill acc">★ Acclaimed</span><span class="fpill">This or That</span></div>`)}
      ${st(2,'🔖','Save the ones you like','Tap the bookmark on a poster, or <b>Save for later</b> on a film page. Saved films wait in <b>My Shortlist › To schedule</b>.',
        `<div class="hw-row"><span class="pillbtn">${IC.bookmark}Save for later</span><span class="hw-arr">→</span><span class="hw-tag">My Shortlist · To schedule</span></div>`)}
      ${st(3,'🕘','Tap a time to plan it','Every film shows its times as buttons. Tap one to add it to <b>My Plan</b>; tap again to remove it. The app checks your plan <b>before</b> you tap: a dashed amber time clashes with a film you’ve planned, or is too far to reach in time.',
        `<div class="hw-chips">${chip('','Sat 21','9:45','INOX Panaji')}${chip('going','Sat 21','13:30','Samrat Ashok','✓ Going')}${chip('warn','Sat 21','11:00','Maquinez Palace','Clashes with your 9:15')}</div>
         <div class="hw-key"><span><i class="k1"></i>Free to pick</span><span><i class="k2"></i>In your plan</span><span><i class="k3"></i>Clashes or too far</span><span>⇄ Switch to this – moves your plan to that time</span></div>`)}
      ${st(4,'✨','Let it pick your day','In <b>Schedule</b>, open <b>Pick my day</b>. You get the day’s 7 best films for your taste, close to each other. Choose with <b>+ Going</b>, swap any film, or tap <b>Add the best that fit together</b>.',
        `<div class="hw-row"><span class="btn sm primary">✨ Pick my day</span><span class="btn sm">⇄ Swap</span><span class="btn sm">+ Going</span></div>`)}
      ${st(5,'📅','Fill the gaps','<b>Schedule › My Plan</b> shows each day as a timeline, with travel time between venues. Long breaks say how many films fit – tap <b>Find a film</b> to fill them. Save a whole day to your phone’s calendar, with a reminder an hour before each show.',
        `<div class="hw-plan"><div class="hw-pr"><b>9:15</b><span>Your first film · INOX Panaji</span></div><div class="pgap"><span><b>Free 11:05–13:30</b> · 2 h 25 min</span><span class="pg-b">Find a film · 5 fit ▾</span></div><div class="hw-pr"><b>13:30</b><span>Your next film · Samrat Ashok</span></div><span class="dcal">${IC.cal}Add day to calendar</span></div>`)}
      ${st(6,'🎬','At the festival','Your next show and a countdown sit at the top of <b>My Plan</b>. After a show, tap <b>Mark watched</b> and give it stars – it moves to <b>My Shortlist › Watched</b>.',
        `<div class="hw-row"><span class="btn sm">✓ Watched this</span><span class="hw-stars">★★★★☆</span></div>`)}
      ${st(7,'☁️','Sign in to keep it everywhere (optional)','Without an account your watchlist and plan stay on this phone. Sign in with Google to keep them on all your devices. Share your list with friends from <b>My Shortlist</b>.','')}
    </ol>
    <div class="hw-tips"><b>Good to know</b><ul>
      <li>Times come from the official IFFI 2026 schedule. IFFI sometimes changes it – check the film page on the day.</li>
      <li>Travel times are estimates: the app allows at least 15 min between nearby Panaji venues, and more for Porvorim, Margao or Ponda.</li>
      <li>Festival Diaries is an unofficial fan guide. For delegate passes and seat booking, use the official IFFI channels.</li>
    </ul></div>
    <div class="hw-acts"><button class="btn primary" onclick="closeModal();setView('all')">Start finding films</button><button class="btn" onclick="openTaste(!!tgLoad())">Play This or That</button></div>
  </div>`;
}
function openHowto(){ $('#menu').classList.remove('open'); openModal(howtoHtml(), ROOT+'how-to/'); syncTitle(); }
function openPrivacy(){ $('#menu').classList.remove('open'); openModal(privacyHtml(), ROOT+'privacy/'); syncTitle(); }
function askConsent(){
  openModal(`<div class="ask"><h2>We’ve added a privacy notice</h2><p>Your name, email and film lists are saved to your account so they sync across devices. Nothing else is collected.</p><button class="btn primary" onclick="agreeConsent()">OK, keep syncing</button><button class="btn" onclick="openPrivacy()">Read the notice</button><button class="btn danger" onclick="deleteAccount()">Delete my account</button></div>`);
}
function agreeConsent(){ cloud.consent={v:PRIVACY_V, at:Date.now()}; pushNow(); closeModal(); toast('Thanks – your watchlist stays synced'); }
async function deleteAccount(){
  $('#menu').classList.remove('open');
  if(!cloud.user || !cloud.fb) return;
  if(!confirm('Delete your account?\n\nThis permanently erases your name, email and all your saved lists. It can’t be undone.')) return;
  const {doc, deleteDoc, deleteUser, reauthenticateWithPopup, GoogleAuthProvider, signOut} = cloud.fb, auth = cloud.fb.auth, u = auth.currentUser;
  clearTimeout(cloud.t); cloud.ready=false; if(cloud.unsub){ cloud.unsub(); cloud.unsub=null; }
  let listsGone=false;
  try{
    const fs = new Set([...wlMine(), ...db.movies.filter(m=>m.status==='want').map(wlSlug).filter(Boolean)]);
    await Promise.all([...fs].map(f=>deleteDoc(doc(cloud.fb.store,'counts',f,'by',u.uid)).catch(()=>{})));
    try{ localStorage.removeItem(WL_KEY(u.uid)); }catch(e){}
    await deleteDoc(doc(cloud.fb.store,'users',u.uid)); listsGone=true;
    cloud.deleting=true;
    try{ await deleteUser(u); }
    catch(e){ if(e.code!=='auth/requires-recent-login') throw e;
      toast('Please confirm with Google to finish'); await reauthenticateWithPopup(u, new GoogleAuthProvider()); await deleteUser(u); }
    closeModal(); toast('Your account and data have been deleted');
  }catch(e){
    console.warn(e);
    if(listsGone){ cloud.deleting=true; await signOut(auth).catch(()=>{}); closeModal();
      alert('Your lists were deleted, but your sign-in record wasn’t.\n\nSign in again and choose Delete my account to finish.'); }
    else { cloud.deleting=false; cloud.ready=true; toast('Could not delete – please try again'); }
  }
}

/* ---------- online sync (optional Google sign-in) ---------- */
const FB_CFG = {apiKey:"AIzaSyA6mBtRlKHFojWP46-KuL5AjdRmTR2TD-c",authDomain:"iffi26-8579d.firebaseapp.com",projectId:"iffi26-8579d",storageBucket:"iffi26-8579d.firebasestorage.app",messagingSenderId:"798581706323",appId:"1:798581706323:web:b4725dfb07f67087e440a6"};
const FBV = 'https://www.gstatic.com/firebasejs/10.12.2/';
const MARK_FIELDS = ['status','priority','rating','liked','review','watchedOn'];
const cloud = {fb:null, user:null, ready:false, marks:{}, known:new Set(), unsub:null, t:null, consent:null, agreed:false, deleting:false};
const tkey = m => String(m.title||'').trim().toLowerCase();
const skey = s => [s.date,s.time,s.venue].join('|');
let OFFICIAL_T = new Set(); try{ OFFICIAL_T = new Set(JSON.parse(officialText()).movies.map(tkey)); }catch(e){}
const isOfficial = m => OFFICIAL_T.has(tkey(m));
function localMark(m){
  const f={}; for(const k of MARK_FIELDS){ const v=m[k]; if(v!==undefined && v!==null && v!=='' && v!==false && v!==0 && !(k==='status'&&v==='none')) f[k]=v; }
  const s={}; for(const x of m.screenings||[]) if(x.going||x.booked) s[skey(x)]={going:true};
  const w = m.watchedAt ? (m.screenings||[]).find(x=>x.id===m.watchedAt) : null;
  const e={}; if(Object.keys(f).length) e.f=f; if(Object.keys(s).length) e.s=s; if(w) e.wa=skey(w);
  return Object.keys(e).length ? e : null;
}
function setMark(m,e){
  e = moveMarks(m.title,e);
  for(const k of MARK_FIELDS){ const v=e?.f?.[k]; if(v===undefined){ if(k==='status') m.status='none'; else delete m[k]; } else m[k]=v; }
  for(const x of m.screenings||[]){ const r=e?.s?.[skey(x)]; x.going=!!(r?.going||r?.booked); x.booked=false; x.seat=''; }
  m.watchedAt = e?.wa ? (m.screenings||[]).find(x=>skey(x)===e.wa)?.id : undefined;
}
const clean = o => JSON.parse(JSON.stringify(o));
function applyRemote(data){
  const marks = data?.marks||{}, custom = data?.custom||[];
  const same = JSON.stringify(marks)===JSON.stringify(cloud.marks) && JSON.stringify(custom)===JSON.stringify(db.movies.filter(m=>!isOfficial(m)).map(clean));
  cloud.marks = marks;
  if(same && cloud.ready) return;
  for(const m of db.movies) if(isOfficial(m)){ setMark(m, marks[tkey(m)]); cloud.known.add(tkey(m)); }
  db.movies = db.movies.filter(isOfficial).concat(custom);
  _localSave(); render(); if(cloud.ready) syncCounts();
}
function pushSoon(){ clearTimeout(cloud.t); cloud.t = setTimeout(pushNow, 1200); }
async function pushNow(){
  clearTimeout(cloud.t); if(!cloud.user || !cloud.ready) return;
  let fixed=false; const marks={...cloud.marks};
  for(const m of db.movies){ if(!isOfficial(m)) continue; const t=tkey(m);
    if(!cloud.known.has(t)){ setMark(m, marks[t]); cloud.known.add(t); fixed=true; continue; }
    const e=localMark(m); if(e) marks[t]=e; else delete marks[t]; }
  if(fixed){ _localSave(); render(); }
  cloud.marks = marks;
  const {doc,setDoc} = cloud.fb;
  try{ await setDoc(doc(cloud.fb.store,'users',cloud.user.uid), clean({marks, custom:db.movies.filter(m=>!isOfficial(m)), consent:cloud.consent||undefined, updated:Date.now()})); syncCounts(); }
  catch(e){ console.warn(e); toast('Could not save online – will retry'); pushSoon(); }
}
const _localSave = save;
save = function(){ _localSave(); if(cloud.user && cloud.ready) pushSoon(); };
document.addEventListener('visibilitychange', ()=>{ if(document.hidden && cloud.t) pushNow(); });
async function onUser(u){
  let wasIn=!!cloud.user; try{ wasIn = wasIn || localStorage.getItem('fd-in')==='1'; }catch(e){}
  cloud.user=u; cloud.ready=false; if(cloud.unsub){ cloud.unsub(); cloud.unsub=null; }
  try{ if(u){ localStorage.setItem('fd-in','1'); localStorage.setItem('fd-was','1'); } else localStorage.removeItem('fd-in'); }catch(e){}
  signinLabel();
  if(!u && cloud.deleting){   // account just deleted: forget everything on this device too
    cloud.deleting=false; cloud.consent=null; clearLocalMarks(); try{ localStorage.removeItem(KEY+'-parked'); }catch(e){}
    updateCloudMenu(); return;
  }
  if(!u && wasIn){   // signed out (not a guest who never signed in): park any marks on this phone so they're hidden, and add them to the account at next sign-in
    const park={}; for(const m of db.movies){ if(isOfficial(m)){ const e=localMark(m); if(e) park[tkey(m)]=e; } else park['custom:'+tkey(m)]=clean(m); }
    if(Object.keys(park).length){ try{ const old=JSON.parse(localStorage.getItem(KEY+'-parked')||'{}'); localStorage.setItem(KEY+'-parked', JSON.stringify({...old,...park})); }catch(e){} clearLocalMarks(); }
  }
  updateCloudMenu();
  if(!u) return;
  const {doc,getDoc,onSnapshot} = cloud.fb, ref = doc(cloud.fb.store,'users',u.uid);
  try{
    const snap = await getDoc(ref), remote = snap.exists() ? snap.data() : {marks:{},custom:[]};
    cloud.consent = remote.consent?.v>=PRIVACY_V ? remote.consent : cloud.agreed ? {v:PRIVACY_V, at:Date.now()} : null;
    const marks = {...(remote.marks||{})};
    for(const m of db.movies) if(isOfficial(m)){ const t=tkey(m), e=localMark(m); if(e && !marks[t]) marks[t]=e; }   // keep this phone's activity
    let parked={}; try{ parked=JSON.parse(localStorage.getItem(KEY+'-parked')||'{}'); localStorage.removeItem(KEY+'-parked'); }catch(e){}
    const custom = [...(remote.custom||[])], have = new Set(custom.map(tkey));
    for(const [k,v] of Object.entries(parked)){ if(k.startsWith('custom:')){ if(!have.has(tkey(v))){ custom.push(v); have.add(tkey(v)); } } else if(!marks[k]) marks[k]=v; }
    for(const m of db.movies) if(!isOfficial(m) && !have.has(tkey(m))) custom.push(clean(m));
    cloud.marks = {}; applyRemote({marks, custom}); cloud.ready = true;
    await pushNow();
    cloud.unsub = onSnapshot(ref, s=>{ if(!s.metadata.hasPendingWrites && s.exists()) applyRemote(s.data()); });
    const pd = cloud.pending; cloud.pending = null;
    const pm = pd && db.movies.find(m=>m.title.toLowerCase()===pd.t);
    if(pm){ pm.status = pd.st; if(pd.st==='watched' && !pm.watchedOn) pm.watchedOn = localISO(); const ps = pd.sk && pm.screenings.find(y=>skey(y)===pd.sk); if(ps) ps.going=true; save(); render(); if(ps){ if($('#scrim').classList.contains('open')) closeModal(); toast('Signed in – added to My Plan'); } else { openDetail(pm.id); toast(pd.st==='want'?'Signed in – saved to My Watchlist':'Signed in – marked as watched'); } }
    else if(cloud.agreed){ if($('#scrim').classList.contains('open') && $('#modal .ask')) closeModal(); toast('Signed in – your watchlist is saved online'); }
    if(cloud.pendingList){ const [c,b]=cloud.pendingList; cloud.pendingList=null; saveSharedList(c,b); }
    try{ if(localStorage.getItem(TG_KEY+'-save')){ localStorage.removeItem(TG_KEY+'-save'); tgSaveAll(true); } }catch(e){}
    if(!cloud.consent) askConsent();   // signed in before the privacy notice existed
  }catch(e){ console.warn(e); toast('Could not reach online storage'); }
}
function clearLocalMarks(){
  for(const m of db.movies) if(isOfficial(m)) setMark(m, null);
  db.movies = db.movies.filter(isOfficial); cloud.marks={}; cloud.known=new Set(); _localSave();
}
function updateCloudMenu(){
  document.body.classList.toggle('guest', !cloud.user);
  render();
  const u=cloud.user, av=$('#menuBtn');
  if(u){ const nm=u.displayName||u.email||'';
    av.innerHTML = u.photoURL ? `<img src="${esc(u.photoURL)}" alt="" referrerpolicy="no-referrer">` : esc((nm[0]||'?').toUpperCase());
    av.title = nm; $('#cloudState').innerHTML = `<span class="acct-av">${av.innerHTML}</span><span class="acct-id"><b>${esc(u.displayName||'Signed in')}</b><span>${esc(u.email||'')}</span></span>`; }
}
/* ---------- how many people want to see a film ----------
   Saving a film while signed in adds an empty marker at counts/<film>/by/<your id>; removing it deletes the marker.
   The page only ever reads the total, never who. */
const WL_KEY = u => 'fd-wl-'+u;
const wlSlug = m => _slug(m.title);
function wlMine(){ try{ return new Set(JSON.parse(localStorage.getItem(WL_KEY(cloud.user.uid))||'[]')); }catch(e){ return new Set(); } }
function wlKeep(set){ try{ localStorage.setItem(WL_KEY(cloud.user.uid), JSON.stringify([...set])); }catch(e){} }
let wlBusy=false, wlAgain=false;
async function syncCounts(){
  if(!cloud.user || !cloud.ready || !cloud.fb?.store) return;
  if(wlBusy){ wlAgain=true; return; } wlBusy=true;
  try{
    const {doc,setDoc,deleteDoc} = cloud.fb, uid=cloud.user.uid, mine=wlMine();
    const want = new Set(db.movies.filter(m=>isOfficial(m) && m.status==='want').map(wlSlug).filter(Boolean));
    for(const f of want) if(!mine.has(f)){ try{ await setDoc(doc(cloud.fb.store,'counts',f,'by',uid),{}); mine.add(f); wlCount.delete(f); }catch(e){ console.warn('count', e.code||e); break; } }
    for(const f of [...mine]) if(!want.has(f)){ try{ await deleteDoc(doc(cloud.fb.store,'counts',f,'by',uid)); mine.delete(f); wlCount.delete(f); }catch(e){ console.warn('count', e.code||e); break; } }
    wlKeep(mine);
  } finally { wlBusy=false; if(wlAgain){ wlAgain=false; syncCounts(); } }
}
const wlCount = new Map();   // film → {n, mine} as read from the server
async function readCount(f){
  if(wlCount.has(f)) return wlCount.get(f);
  const mine = cloud.user ? wlMine().has(f) : false;
  const r = await fetch(`https://firestore.googleapis.com/v1/projects/${FB_CFG.projectId}/databases/(default)/documents/counts/${encodeURIComponent(f)}:runAggregationQuery?key=${FB_CFG.apiKey}`,
    {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({structuredAggregationQuery:{structuredQuery:{from:[{collectionId:'by'}]}, aggregations:[{alias:'n',count:{}}]}})});
  if(!r.ok) throw new Error('count '+r.status);
  const j = await r.json(), n = +(j?.[0]?.result?.aggregateFields?.n?.integerValue||0);
  const v = {n, mine}; wlCount.set(f, v); return v;
}
function countText(m, v){
  const me = !!cloud.user && m.status==='want';
  const others = Math.max(0, v.n - (v.mine?1:0));
  if(me) return others ? `You and ${others} other${others>1?'s':''} want to see this` : '';
  return others ? `${others} ${others>1?'people want':'person wants'} to see this` : '';
}
function fillCount(m){
  const f = wlSlug(m); if(!f || !isOfficial(m)) return;
  readCount(f).then(v=>{ const el=document.querySelector(`.wlc[data-f="${f}"]`); if(!el) return; const t=countText(m,v); el.hidden=!t;
    el.innerHTML = t ? `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18.5 14.8c1.7.8 2.7 2.5 3 5.2"/></svg>${t}` : ''; }).catch(()=>{});
}

let cloudP=null, storeP=null;
function cloudInit(){
  return cloudP ||= (async()=>{ try{
    const [app,auth] = await Promise.all(['firebase-app.js','firebase-auth.js'].map(f=>import(FBV+f)));
    const a = app.initializeApp(FB_CFG);
    cloud.fb = {...auth, app:a, auth:auth.getAuth(a)};
    auth.onAuthStateChanged(cloud.fb.auth, async u=>{ if(u){ try{ await loadStore(); }catch(e){ console.warn(e); } } onUser(u); });
  }catch(e){ console.warn('Online sync unavailable', e); cloudP=null; } })();
}
function loadStore(){   // the sync database code (the biggest part) – only for signed-in people
  return storeP ||= (async()=>{ const fs = await import(FBV+'firebase-firestore.js'), a = cloud.fb.app;
    const store = (()=>{ try{ return fs.initializeFirestore(a,{localCache:fs.persistentLocalCache({tabManager:fs.persistentMultipleTabManager()})}); }catch(e){ return fs.getFirestore(a); } })();
    Object.assign(cloud.fb, fs, {store}); })().catch(e=>{ storeP=null; throw e; });
}
async function cloudStart(){   // signed in before? connect now. Otherwise wait until someone wants to sign in.
  let was = false; try{ was = localStorage.getItem('fd-in')==='1'; }catch(e){}
  if(!was){ try{ was = !!(await indexedDB.databases?.())?.some(d=>d.name==='firebaseLocalStorageDb'); }catch(e){} }
  if(was){ cloudInit().then(()=>cloud.fb && loadStore().catch(()=>{})); }
  else if(!indexedDB.databases) setTimeout(cloudInit, 3000);
}
async function cloudToggle(){
  if(!cloud.fb){ await cloudInit(); if(!cloud.fb){ toast('Online sync not available right now'); return; } }
  const {auth, GoogleAuthProvider, signInWithPopup, signOut} = cloud.fb;
  if(cloud.user){ if(confirm('Sign out? Your lists stay saved in your account.')){ await pushNow(); await signOut(auth); clearLocalMarks(); render(); toast('Signed out'); } return; }
  const p = new GoogleAuthProvider();
  cloud.agreed = true;   // every sign-in button sits next to the privacy notice
  try{ await signInWithPopup(auth, p); }
  catch(e){ const c=e.code||'';
    if(/popup-blocked|operation-not-supported|web-storage/.test(c)) alert('Sign-in window was blocked.\n\nOpen this site directly in Safari or Chrome (not inside WhatsApp or another app), allow pop-ups, and try again.');
    else if(!/popup-closed|cancelled-popup/.test(c)) toast('Sign-in failed: '+(c||e.message)); }
}
(function unparkGuest(){   // undo an old bug that hid guests' lists: give them back if this phone was never signed in
  try{ if(localStorage.getItem('fd-was')==='1' || localStorage.getItem('fd-in')==='1') return;
    const p=JSON.parse(localStorage.getItem(KEY+'-parked')||'null'); if(!p) return; let k=0;
    for(const m of db.movies) if(isOfficial(m)){ const e=p[tkey(m)]; if(e && !localMark(m)){ setMark(m,e); k++; } }
    for(const [key,v] of Object.entries(p)) if(key.startsWith('custom:') && v && !db.movies.some(m=>tkey(m)===tkey(v))){ db.movies.push(v); k++; }
    localStorage.removeItem(KEY+'-parked'); if(k){ _localSave(); render(); }
  }catch(e){} })();
cloudStart();
/* ---------- quick look: hover (desktop) / press-and-hold (phone) ---------- */
function peekHtml(m){
  const c = String(m.country||'').split(',')[0].trim();
  const meta = [m.genre, c, m.runtime ? m.runtime+' min' : ''].filter(Boolean).map(esc).join(' · ');
  return `<b>${esc(m.title)}</b>${meta?`<div class="pm">${meta}</div>`:''}${m.synopsis?`<p>${esc(m.synopsis)}</p>`:''}`;
}
(function(){
  const pk = $('#peek'); let hT=null, cur=null;
  const hide = (now)=>{ if(now){ pk.style.transition='none'; pk.classList.remove('on'); pk.offsetHeight; pk.style.transition=''; } else pk.classList.remove('on'); };
  const hoverable = matchMedia('(hover: hover) and (pointer: fine)').matches;
  if(hoverable){
    document.addEventListener('mouseover', e=>{
      const el = e.target.closest('[data-pid]'); if(el===cur) return;
      clearTimeout(hT); hide(); cur=el; if(!el) return;
      hT = setTimeout(()=>{
        const m = find(el.dataset.pid); if(!m || (!m.synopsis && !m.genre)) return;
        pk.innerHTML = peekHtml(m);
        const po = el.querySelector('.poster'), r = (po||el).getBoundingClientRect();
        pk.classList.toggle('tip', !po);
        if(po){ Object.assign(pk.style,{left:r.left+'px',top:r.top+'px',width:r.width+'px',height:r.height+'px',maxHeight:'none'}); }
        else { const w=Math.min(380, innerWidth-24); Object.assign(pk.style,{left:Math.min(e.clientX+12, innerWidth-w-12)+'px',top:Math.min(r.bottom+4, innerHeight-220)+'px',width:w+'px',height:'auto',maxHeight:'240px'}); }
        requestAnimationFrame(()=>pk.classList.add('on'));
      }, 450);
    });
    document.addEventListener('scroll', ()=>{ clearTimeout(hT); hide(true); cur=null; }, {passive:true, capture:true});
    document.addEventListener('mousedown', ()=>{ clearTimeout(hT); hide(true); });
  }
  $('#sheetScrim').onclick = ()=>closeSheet();
})();
function pick(btn, title, options, cur, onPick){
  pick._fn = onPick;
  const sh=$('#sheet');
  sh.innerHTML = `<div class="pk-head"><b>${esc(title)}</b><button class="pk-x" aria-label="Close" onclick="closeSheet()"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>
    ${options.length>14?`<div class="pk-search"><input type="search" placeholder="Search ${esc(title.toLowerCase())}" aria-label="Search" oninput="const q=this.value.toLowerCase();this.closest('#sheet').querySelectorAll('.pk-opt').forEach(b=>b.hidden=q&&!b.textContent.toLowerCase().includes(q))"></div>`:''}
    <div class="pk-list" role="listbox">${options.map(([v,l,c])=>`<button role="option" aria-selected="${v===cur}" class="pk-opt ${v===cur?'on':''}" data-v="${esc(v)}"><span>${esc(l)}</span>${c!=null?`<small>${c}</small>`:''}${v===cur?'<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>':''}</button>`).join('')}</div>`;
  sh.querySelectorAll('.pk-opt').forEach(b=>b.onclick=()=>{ const v=b.dataset.v; closeSheet(); pick._fn(v); });
  sh.classList.remove('filt'); sh.classList.add('picker');
  if(innerWidth>640){ const r=btn.getBoundingClientRect(); Object.assign(sh.style,{left:Math.min(r.left, innerWidth-330)+'px', top:(r.bottom+6)+'px', right:'auto', bottom:'auto', width:'320px'}); }
  else sh.removeAttribute('style');
  sh.classList.add('open'); $('#sheetScrim').classList.add('open');
  if(!history.state?.sheet) history.pushState({sheet:1},'');
  setTimeout(()=>sh.querySelector('.pk-opt.on, .pk-opt')?.focus({preventScroll:false}), 50);
}
function closeSheet(fromBack){
  if(!$('#sheet').classList.contains('open')) return;
  $('#sheet').classList.remove('open','filt'); $('#sheetScrim').classList.remove('open');
  if(fromBack==='detail' && history.state?.sheet) history.replaceState({modal:1},'');
  else if(fromBack!==true && history.state?.sheet) history.back();
}
if('serviceWorker' in navigator && (location.protocol==='https:' || location.hostname==='localhost')) navigator.serviceWorker.register('sw.js').catch(()=>{});
/* a newer version published? offer a one-tap refresh (phones can hold on to a saved copy of the page) */
let _upAt=0;
function checkUpdate(){
  const cur=(document.querySelector('script[src*="app.js?v="]')?.src.match(/[?&]v=(\w+)/)||[])[1];
  if(!cur || !navigator.onLine || Date.now()-_upAt<5*60e3 || document.getElementById('upbar')) return; _upAt=Date.now();
  fetch(ROOT+'?fdu='+Date.now(), {cache:'no-store'}).then(r=>r.ok?r.text():'').then(t=>{
    const v=(t.match(/app\.js\?v=(\w+)/)||[])[1]; if(!v || v===cur) return;
    const b=document.createElement('div'); b.id='upbar'; b.setAttribute('role','status');
    b.innerHTML='<span><b>New version ready</b> · with the latest updates</span><button class="btn sm primary" onclick="location.reload()">Refresh</button><button class="up-x" aria-label="Later" onclick="this.parentNode.remove()">×</button>';
    document.body.appendChild(b);
  }).catch(()=>{});
}
setTimeout(checkUpdate, 4000);
document.addEventListener('visibilitychange', ()=>{ if(!document.hidden) checkUpdate(); });

render();
{ const ver=officialVer();
  if(officialText() && db.officialVer!==ver){ db.officialVer=ver; window._quiet=true; loadOfficial(); } }   // pick up film-list updates automatically
openFromHash();
setTimeout(()=>{ (window.requestIdleCallback||setTimeout)(()=>ensureDetails()); }, 1500);
