/* ===== Pharma.com app: UI, data, voice ===== */
const LS_DB='dawabol.db.v3', LS_SET='dawabol.settings.v2';
const STORE={name:'Shree Sai Medicals', addr:'12, 4th Block, Jayanagar, Bengaluru 560011', phone:'080-4123 7788', gstin:'29ABCDE1234F1Z5', dl:'KA-B20-123456 / KA-B21-123457'};
const MANUAL_SECONDS=300;   // typical manual check + bill time per patient (5 min)
const SARVAM_URL='https://api.sarvam.ai/speech-to-text', SARVAM_MODEL='saaras:v4';
const LANGS={
  auto:{label:'Auto',code:'unknown',sr:'hi-IN'},
  hi:{label:'हिंदी',code:'hi-IN',sr:'hi-IN'},
  en:{label:'English',code:'en-IN',sr:'en-IN'},
  mr:{label:'मराठी',code:'mr-IN',sr:'mr-IN'},
  kn:{label:'ಕನ್ನಡ',code:'kn-IN',sr:'kn-IN'},
  te:{label:'తెలుగు',code:'te-IN',sr:'te-IN'},
};
const EXAMPLES=[
  ['हिंदी','अभिजीत, 16 साल, Dolo 650 की 10 स्ट्रिप का बिल बनाओ'],
  ['मराठी','सुनीता साठी 45 वर्षे, Telma 40 च्या 2 स्ट्रिप बिल करा'],
  ['ಕನ್ನಡ','ರವಿ 32 ವರ್ಷ, Crocin 5 ಸ್ಟ್ರಿಪ್ ಬಿಲ್ ಮಾಡಿ'],
  ['తెలుగు','లక్ష్మి 60 సంవత్సరాలు, Glycomet 500 3 స్ట్రిప్స్ బిల్ చేయండి'],
  ['English','Bill 3 strips of Azithral 500 for Priya, 28 years'],
  ['Stock?','Dolo 650 स्टॉक में है क्या?',1],
  ['Restock','Pan 40 ki 20 strip stock mein add karo',1],
];
const FRAMED=(()=>{ try{ return window.self!==window.top; }catch(e){ return true; } })();
const IN_ARTIFACT=FRAMED && location.protocol!=='file:';
const ICON={
  slip:'<svg viewBox="0 0 24 24"><path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3zM9 8h6M9 12h6M9 16h3"/></svg>',
  search:'<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>',
  x:'<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  dots:'<svg viewBox="0 0 24 24"><circle cx="6" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="18" cy="12" r="1.5"/></svg>',
};

/* ---------- small helpers ---------- */
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>'₹'+Number(n).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2});
const plural=(n,w)=>`${n} ${w}${n===1?'':'s'}`;
function load(k){ try{ const v=localStorage.getItem(k); return v?JSON.parse(v):null; }catch(e){ return null; } }
function store(k,v){ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} }
function toast(msg,kind=''){ const t=$('#toast'); t.textContent=msg; t.className='toast show '+kind; clearTimeout(t._h); t._h=setTimeout(()=>t.className='toast',3000); }
const today=()=>new Date().toDateString();
const timeStr=ts=>new Date(ts).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'});

/* ---------- settings ---------- */
let SET=Object.assign({key:'',lang:'auto',useVoice:true,speak:true,autoPrint:false,keyState:'',agent:{key:'',app:'',org:'',ws:''}},load(LS_SET)||{});
if(!SET.agent) SET.agent={key:'',app:'',org:'',ws:''};
const saveSet=()=>store(LS_SET,SET);

/* ---------- data layer: cloud db when available, else this browser ---------- */
const Data={inv:{},bills:[],log:[],cloud:false,db:null,readOnly:false};
let INDEX=[], KEYTERMS=[];
function reindex(){ INDEX=buildIndex(Data.inv); KEYTERMS=Object.values(Data.inv).map(m=>m.name).concat(['strip','tablet','bottle','tube','sachet']); }
function loadLocal(){
  const s=load(LS_DB);
  if(s&&s.inv&&Object.keys(s.inv).length){ Data.inv=s.inv; Data.bills=s.bills||[]; Data.log=s.log||[]; }
  else { Data.inv=seedInventory(); Data.bills=sampleBills(Data.inv); Data.log=[]; }
  reindex();
}
function saveLocal(){ if(!Data.cloud) store(LS_DB,{inv:Data.inv,bills:Data.bills,log:Data.log}); }
let writeErrShown=false;
function cloudErr(e){
  if(e&&(e.code==='not_granted'||e.code==='revoked')) Data.readOnly=true;
  if(!writeErrShown){ writeErrShown=true; toast(Data.readOnly?'View-only access. Ask the owner to edit.':'Not saved. Check the connection.','bad'); }
}
async function cloudInit(){
  if(!window.claude||!window.claude.use) return;
  let db=null; try{ db=await window.claude.use('db'); }catch(e){}
  if(!db) return;
  Data.db=db;
  const timer=setTimeout(()=>{ if(!Data.cloud) renderFoot(); },10000);
  db.collection('inventory').onSnapshot(snap=>{
    clearTimeout(timer);
    if(snap.empty){ renderFoot('Store database is empty. Showing demo stock on this device.'); return; }
    const inv={}; snap.docs.forEach(d=>{ const v=d.data(); if(v) inv[d.id]=Object.assign({id:d.id},v); });
    Data.inv=inv; Data.cloud=true; reindex(); renderAll();
  },()=>{ clearTimeout(timer); renderFoot(); });
  db.collection('bills').orderBy('at','desc').limit(150).onSnapshot(snap=>{
    if(!Data.cloud && snap.empty) return;
    Data.bills=snap.docs.map(d=>Object.assign({_id:d.id},d.data())); renderAll();
  },()=>{});
  db.collection('log').orderBy('at','desc').limit(150).onSnapshot(snap=>{
    if(!Data.cloud && snap.empty) return;
    Data.log=snap.docs.map(d=>Object.assign({_id:d.id},d.data())); if(view==='insights') renderInsights();
  },()=>{});
}
function persistStock(ids){
  if(Data.cloud&&Data.db){ ids.forEach(id=>Data.db.doc('inventory/'+id).update({stock:Data.inv[id].stock}).catch(cloudErr)); }
  else saveLocal();
}
function persistBill(b){
  Data.bills.unshift(b);
  if(Data.cloud&&Data.db){ Data.db.doc('bills/'+b.id).set(b).catch(cloudErr); } else saveLocal();
}
function logEvent(text,meta,intent,outcome){
  const e={id:'l'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),at:Date.now(),text,engine:meta.engine||'Typed',lang:meta.lang||'',secs:meta.latency!=null?+meta.latency.toFixed(1):null,intent,outcome};
  Data.log.unshift(e); Data.log=Data.log.slice(0,150);
  if(Data.cloud&&Data.db){ Data.db.doc('log/'+e.id).set(e).catch(()=>{}); } else saveLocal();
  if(view==='insights') renderInsights();
}

/* ---------- medicine helpers ---------- */
function stockText(m,units=m.stock){
  if(m.pack===1) return plural(units,m.packName);
  const p=Math.floor(units/m.pack), r=units%m.pack;
  return plural(p,m.packName)+(r?` + ${r} ${m.unitName}`:'');
}
const unitLabel=(m,unit,qty)=> unit==='pack'||m.pack===1 ? plural(qty,m.packName) : plural(qty,m.unitName);
const needUnits=(m,it)=> it.unit==='pack'||m.pack===1 ? it.qty*m.pack : it.qty;
const lineAmt=(m,it)=> it.unit==='pack'||m.pack===1 ? it.qty*m.mrp : it.qty*m.mrp/m.pack;
function status(m){ if(m.stock<=0) return ['out','Out of stock']; if(m.stock<=m.reorder) return ['low','Reorder']; return ['ok','In stock']; }
function expiryDate(exp){ const [y,mo]=exp.split('-').map(Number); return new Date(y,mo,0,23,59,59); } // last day of expiry month
const daysLeft=exp=>Math.floor((expiryDate(exp)-Date.now())/864e5);
const monthsLeft=exp=>daysLeft(exp)/30;
function expInfo(exp){ const d=daysLeft(exp); if(d<0) return {d,cls:'bad',txt:'Expired'}; if(d<=30) return {d,cls:'bad',txt:`${d} days left`}; if(d<=90) return {d,cls:'warn',txt:`${d} days left`}; return {d,cls:'ok',txt:d<=365?`${Math.round(d/30)} months`:'> 1 year'}; }
const isExpired=m=>daysLeft(m.expiry)<0;
const stockValue=m=>m.stock*m.mrp/m.pack;
const expLabel=exp=>{ const [y,m]=exp.split('-'); return `${m}/${y.slice(2)}`; };
const substitutes=(m,units)=>Object.values(Data.inv).filter(x=>x.id!==m.id&&x.generic===m.generic&&x.stock>=Math.max(units,1)&&!isExpired(x)).sort((a,b)=>daysLeft(a.expiry)-daysLeft(b.expiry));
function itemIssue(it){ const m=Data.inv[it.id]; if(!m) return {k:'gone'}; const need=needUnits(m,it); if(m.stock<=0) return {k:'out',subs:substitutes(m,need)}; if(isExpired(m)) return {k:'expired',subs:substitutes(m,need)}; if(need>m.stock) return {k:'short'}; return null; }
function billNo(){ const d=new Date(); const y=d.getMonth()>=3?d.getFullYear():d.getFullYear()-1; const p=n=>String(n).padStart(2,'0');
  return `SSM/${String(y).slice(2)}-${String(y+1).slice(2)}/${p(d.getMonth()+1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`; }
function speak(text){
  if(!SET.speak||AG||!('speechSynthesis' in window)) return;
  try{ speechSynthesis.cancel(); const u=new SpeechSynthesisUtterance(text); u.lang='en-IN'; u.rate=1.03;
    const v=speechSynthesis.getVoices().find(v=>v.lang==='en-IN'); if(v) u.voice=v; speechSynthesis.speak(u);}catch(e){}
}

/* ---------- view routing ---------- */
const VIEWS=['counter','stock','bills','insights'];
let view='counter';
function setView(v){
  if(!VIEWS.includes(v)) v='counter'; view=v;
  VIEWS.forEach(x=>{ $('#v-'+x).hidden=x!==v; });
  document.querySelectorAll('.nav a').forEach(a=>{ if(a.dataset.view===v) a.setAttribute('aria-current','page'); else a.removeAttribute('aria-current'); });
  if(v==='stock') renderStock(); if(v==='bills') renderBills(); if(v==='insights') renderInsights();
}
window.addEventListener('hashchange',()=>setView(location.hash.slice(1)));

/* ---------- slip (the hero) ---------- */
let slip={mode:'idle'};
let lastBill=null;
const slipHeader=()=>`<div class="s-store"><b>${esc(STORE.name)}</b><span>${esc(STORE.addr)}</span></div>`;
const actionSecondary=b=>IN_ARTIFACT?(Downloads?`<button type="button" data-act="save" data-id="${esc(b.id)}">Save</button>`:''):`<button type="button" data-act="print" data-id="${esc(b.id)}">Print</button>`;
function renderSlip(){
  const el=$('#slip');
  if(slip.mode!=='idle'&&slip.mode!==renderSlip.last&&window.innerWidth<900&&view==='counter') setTimeout(()=>el.scrollIntoView({behavior:'smooth',block:'start'}),30);
  renderSlip.last=slip.mode;
  const m=slip.mode;
  if(m==='idle'){
    const tb=Data.bills.filter(b=>new Date(b.at).toDateString()===today());
    const avg=tb.length?(tb.reduce((a,b)=>a+b.seconds,0)/tb.length).toFixed(1):'—';
    el.innerHTML=`${slipHeader()}<div class="s-empty">${ICON.slip}<span class="big">Next patient</span>
      <div class="s-today"><div><b>${tb.length}</b><span>bills today</span></div><div><b>${avg}${tb.length?' s':''}</b><span>avg / bill</span></div></div></div>`;
    return;
  }
  if(m==='thinking'){ el.innerHTML=`${slipHeader()}<div class="s-empty">${ICON.dots}<span class="big">Matching…</span></div>`; return; }
  if(m==='unknown'){
    el.innerHTML=`${slipHeader()}<div class="s-empty">${ICON.search}<span class="big">No medicine found</span><span>Try the brand name, e.g. “Dolo 650”.</span></div>
      <div class="s-actions"><div class="s-sec"><button type="button" data-act="done">Back</button></div></div>`;
    return;
  }
  if(m==='draft') return renderDraft(el);
  if(m==='restock'){
    el.innerHTML=`${slipHeader()}<div class="s-title"><b>STOCK IN</b></div>
      <div class="s-items">${slip.items.map(it=>{ const md=Data.inv[it.id]; const add=needUnits(md,it);
        return `<div class="s-item"><div class="s-name">${esc(md.name)}</div><div class="s-amt">+${esc(unitLabel(md,it.unit,it.qty))}</div><div class="s-meta">${esc(stockText(md))} → ${esc(stockText(md,md.stock+add))} · ${md.rack}</div></div>`; }).join('')}</div>
      <div class="s-actions"><button type="button" class="s-go" data-act="confirm">Add to stock <kbd>Enter</kbd></button><p class="s-say">or say “haan” · <button type="button" class="link" data-act="cancel">Cancel</button></p></div>`;
    return;
  }
  if(m==='stock'){
    el.innerHTML=`${slipHeader()}<div class="s-title"><b>STOCK</b></div>${slip.items.map(it=>{ const md=Data.inv[it.id]; const [k,l]=status(md); const subs=md.stock<=0?substitutes(md,1):[];
      return `<div class="s-card"><div class="s-name">${esc(md.name)} <span class="flag ${k==='ok'?'ok':k==='low'?'warn':'bad'}">${l.toUpperCase()}</span></div><div class="qty">${esc(stockText(md))}</div>
        <div class="s-meta">Rack ${md.rack} · Exp ${expLabel(md.expiry)} (${expInfo(md.expiry).txt}) · ${money(md.mrp)}/${md.packName}</div>
        ${subs.length?`<div class="s-fix warn">Same salt: ${subs.map(s=>esc(s.name)).join(', ')}</div>`:''}</div>`; }).join('')}
      <div class="s-actions">${slip.items.some(it=>Data.inv[it.id].stock>0)?'<button type="button" class="s-go" data-act="billfromstock">Bill this</button>':''}<div class="s-sec"><button type="button" data-act="done">Done</button></div></div>`;
    return;
  }
  if(m==='done') el.innerHTML=receiptHTML(slip.bill,true);
}
function renderDraft(el){
  const total=slip.items.reduce((a,it)=>a+(Data.inv[it.id]?lineAmt(Data.inv[it.id],it):0),0);
  const blocked=!slip.items.length||slip.items.some(it=>itemIssue(it)||!(it.qty>0));
  const rows=slip.items.map((it,ix)=>{
    const md=Data.inv[it.id]; const iss=itemIssue(it);
    const unitSel=md.pack>1?`<select data-act="unit" data-ix="${ix}" aria-label="Unit"><option value="pack" ${it.unit==='pack'?'selected':''}>${md.packName}</option><option value="unit" ${it.unit==='unit'?'selected':''}>${md.unitName}</option></select>`:`<span>${md.packName}</span>`;
    let fix='';
    if(iss&&iss.k==='out') fix=`<div class="s-fix">Out of stock ${iss.subs.slice(0,2).map(s=>`<button type="button" data-act="swap" data-ix="${ix}" data-to="${s.id}">${esc(s.name)} · same salt</button>`).join('')}</div>`;
    if(iss&&iss.k==='expired') fix=`<div class="s-fix">Expired ${expLabel(md.expiry)} · do not sell ${iss.subs.slice(0,2).map(s=>`<button type="button" data-act="swap" data-ix="${ix}" data-to="${s.id}">${esc(s.name)} · same salt</button>`).join('')}</div>`;
    if(iss&&iss.k==='short') fix=`<div class="s-fix warn">Only ${esc(stockText(md))} <button type="button" data-act="useavail" data-ix="${ix}">Use available</button></div>`;
    return `<div class="s-item"><div class="s-name">${esc(md.name)}${md.rx?'<span class="flag rx">Rx</span>':''}${it.assumedQty?'<span class="flag warn">QTY?</span>':''}</div><div class="s-amt">${money(lineAmt(md,it)).slice(1)}</div>
      <div class="s-meta">${esc(md.generic)} · ${md.rack} · Exp ${expLabel(md.expiry)}${(()=>{const e=expInfo(md.expiry); return e.cls!=='ok'&&e.d>=0?` · ${e.txt}`:'';})()}</div>
      <div class="s-qty"><span class="step"><button type="button" data-act="dec" data-ix="${ix}" aria-label="Less">−</button><input type="number" id="q${ix}" min="1" value="${it.qty}" data-act="qty" data-ix="${ix}" aria-label="Quantity"><button type="button" data-act="inc" data-ix="${ix}" aria-label="More">+</button></span>${unitSel}<button type="button" class="s-x" data-act="remove" data-ix="${ix}" aria-label="Remove ${esc(md.name)}">${ICON.x}</button></div>${fix}</div>`;
  }).join('');
  el.innerHTML=`${slipHeader()}<div class="s-title"><b>BILL</b><span>DRAFT</span></div>
    <div class="s-patient"><input id="pName" value="${esc(slip.patient.name)}" placeholder="Patient" autocomplete="off" aria-label="Patient name"><input id="pAge" class="age" type="number" min="0" max="120" value="${slip.patient.age??''}" placeholder="Age" aria-label="Age"></div>
    <hr class="s-rule"><div class="s-items">${rows}</div>
    <div class="s-add"><select id="addMed" aria-label="Add medicine"><option value="">+ Add medicine</option>${Object.values(Data.inv).sort((a,b)=>a.name.localeCompare(b.name)).map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join('')}</select></div>
    <hr class="s-rule"><div class="s-total"><span>TOTAL</span><b>${money(total)}</b></div>
    <div class="s-pay" role="group" aria-label="Payment">${['Cash','UPI','Card'].map(p=>`<button type="button" data-act="pay" data-p="${p}" aria-pressed="${slip.payment===p}">${p}</button>`).join('')}</div>
    <div class="s-actions"><button type="button" class="s-go" data-act="confirm" ${blocked?'disabled':''}>Confirm <kbd>Enter</kbd></button>
      <p class="s-say">or say “haan” · <button type="button" class="link" data-act="cancel">Cancel</button></p></div>`;
}
function receiptHTML(b,live){
  const d=new Date(b.at); const rx=b.lines.some(l=>l.rx);
  const actions=live?`<div class="s-speed">Billed in <b>${b.seconds} s</b></div>
    <div class="s-actions"><button type="button" class="s-go" data-act="next">Next patient</button>${actionSecondary(b)?`<div class="s-sec">${actionSecondary(b)}</div>`:''}</div>`:'';
  return `${slipHeader()}<div class="s-title"><b>TAX INVOICE</b><span>${esc(b.payment.toUpperCase())}</span></div>
    <div class="s-kv"><span>No.</span><b>${esc(b.no)}</b></div>
    <div class="s-kv"><span>Date</span><b>${d.toLocaleDateString('en-IN')} ${timeStr(b.at)}</b></div>
    <div class="s-kv"><span>Patient</span><b>${esc(b.patient.name||'Walk-in')}${b.patient.age!=null?`, ${b.patient.age}`:''}</b></div>
    <hr class="s-rule"><div class="s-items">${b.lines.map(l=>`<div class="s-item"><div class="s-name">${esc(l.name)}${l.rx?' ℞':''}</div><div class="s-amt">${l.amount.toFixed(2)}</div><div class="s-meta">${esc(l.qtyLabel)} × ${l.rate.toFixed(2)} · ${esc(l.batch)} · ${expLabel(l.expiry)}</div></div>`).join('')}</div>
    <hr class="s-rule"><div class="s-total"><span class="s-stamp">PAID</span><span>TOTAL</span><b>${money(b.total)}</b></div>
    <p class="s-note">MRP incl. GST · GSTIN ${esc(STORE.gstin)}${rx?' · ℞ dispensed on prescription':''}</p>${actions}`;
}

/* ---------- command handling ---------- */
let samplePromise=null;
const getSample=()=>{ if(!window.claude||!window.claude.use) return Promise.resolve(null); if(!samplePromise) samplePromise=window.claude.use('sample').catch(()=>null); return samplePromise; };
async function claudeParse(text){
  const s=await getSample(); if(!s) return null;
  const list=Object.values(Data.inv).map(m=>`${m.id} | ${m.name} | ${m.generic} | sold per ${m.packName}${m.pack>1?` of ${m.pack} ${m.unitName}s`:''}`).join('\n');
  const prompt=`You read voice commands spoken at an Indian pharmacy counter (Hindi, English, Marathi, Kannada, Telugu or a mix). Match medicines ONLY to this stock list (id | name | salt | pack):\n${list}\n\nCommand: """${text}"""\n\nReply with JSON only: {"intent":"bill"|"stock"|"restock"|"unknown","patient":{"name":string,"age":number|null},"items":[{"id":string,"qty":number,"unit":"pack"|"unit"}]}. "pack" means strips/bottles/tubes, "unit" means single tablets/capsules. Write the patient's name in Latin letters. If no medicine from the list is mentioned, use intent "unknown" and an empty items list.`;
  try{
    const r=await s.json(prompt,{modelTier:'quick'});
    if(!r||!Array.isArray(r.items)) return null;
    const items=r.items.filter(i=>i&&Data.inv[i.id]).map(i=>({id:i.id,qty:Math.max(1,parseInt(i.qty,10)||1),unit:i.unit==='unit'?'unit':'pack',assumedQty:!i.qty}));
    if(!items.length) return null;
    return {intent:['bill','stock','restock'].includes(r.intent)?r.intent:'bill',items,patient:{name:(r.patient&&r.patient.name)||'',age:r.patient&&Number.isFinite(+r.patient.age)&&r.patient.age!==null?+r.patient.age:null},text};
  }catch(e){ return null; }
}
async function handleCommand(text,meta){
  text=(text||'').trim(); if(!text) return;
  if(view!=='counter') location.hash='counter';
  if(!meta.keepLive) showLive('Heard',text,meta.engine);
  const pending=slip.mode==='draft'||slip.mode==='restock';
  let res=parseCommand(text,Data.inv,INDEX,{pending});
  let via=meta.engine||'Typed';
  if(!meta.agent) setMicState(IN_ARTIFACT?'Type or tap a demo':'Tap to speak');
  if(meta.agent&&res.intent==='unknown'){ logEvent(text,meta,'chat','Agent conversation'); return; }
  if(res.intent==='unknown'){
    const s=await getSample();
    if(s){ slip={mode:'thinking',transcript:text}; renderSlip();
      const c=await claudeParse(text); if(c){ res=c; via+=' · matched by Claude'; } }
  }
  const short=(res.items||[]).map(it=>`${Data.inv[it.id].name} × ${unitLabel(Data.inv[it.id],it.unit,it.qty)}`).join(', ');
  switch(res.intent){
    case 'confirm': if(pending){ logEvent(text,meta,'confirm','Confirmed by voice'); confirmSlip(); } return;
    case 'cancel': if(pending){ slip={mode:'idle'}; renderSlip(); logEvent(text,meta,'cancel','Draft cancelled'); speak('Cancelled.'); } return;
    case 'bill': {
      slip={mode:'draft',patient:res.patient,items:res.items,transcript:text,via,t0:meta.t0||performance.now(),payment:'Cash',engine:meta.engine||'Typed'};
      renderSlip();
      const issues=res.items.map(it=>({m:Data.inv[it.id],i:itemIssue(it)})).filter(x=>x.i);
      let say=`${res.patient.name||'Patient'}. ${res.items.map(it=>`${Data.inv[it.id].name}, ${unitLabel(Data.inv[it.id],it.unit,it.qty)}`).join('. ')}.`;
      if(issues.length) issues.forEach(x=>{ say+= x.i.k==='expired'?` ${x.m.name} is expired.${x.i.subs&&x.i.subs.length?` ${x.i.subs[0].name} has the same salt.`:''}`: x.i.k==='out'?` ${x.m.name} is out of stock.${x.i.subs&&x.i.subs.length?` ${x.i.subs[0].name} has the same salt.`:''}`:` Only ${stockText(x.m)} of ${x.m.name} left.`; });
      else say+=` Total ${Math.round(res.items.reduce((a,it)=>a+lineAmt(Data.inv[it.id],it),0))} rupees. Confirm?`;
      speak(say); logEvent(text,meta,'bill',`Draft: ${short}${issues.length?' (stock issue)':''}`); return; }
    case 'stock':
      slip={mode:'stock',items:res.items,transcript:text,via}; renderSlip();
      speak(res.items.map(it=>{const m=Data.inv[it.id]; return m.stock>0?`${m.name}: ${stockText(m)}, rack ${m.rack}.`:`${m.name} is out of stock.`}).join(' '));
      logEvent(text,meta,'stock',res.items.map(it=>`${Data.inv[it.id].name}: ${stockText(Data.inv[it.id])}`).join('; ')); return;
    case 'restock':
      slip={mode:'restock',items:res.items,transcript:text,via}; renderSlip();
      speak(`Add ${res.items.map(it=>`${unitLabel(Data.inv[it.id],it.unit,it.qty)} of ${Data.inv[it.id].name}`).join(', ')} to stock?`);
      logEvent(text,meta,'restock',`Draft: ${short}`); return;
    default:
      slip={mode:'unknown',transcript:text,via}; renderSlip(); speak('I could not find the medicine. Please say it again.');
      logEvent(text,meta,'unknown','No medicine recognised');
  }
}
function confirmSlip(){
  if(Data.readOnly){ toast('View-only access.','bad'); return; }
  if(slip.mode==='restock'){
    const ids=slip.items.map(it=>{ const m=Data.inv[it.id]; m.stock+=needUnits(m,it); flash.add(m.id); return m.id; });
    persistStock(ids); toast('Stock updated','ok'); speak('Stock updated.'); slip={mode:'idle'}; renderAll(); return;
  }
  if(slip.mode!=='draft') return;
  const n=$('#pName'); if(n) slip.patient.name=n.value.trim();
  const a=$('#pAge'); if(a) slip.patient.age=a.value?Number(a.value):null;
  if(!slip.items.length||slip.items.some(it=>itemIssue(it)||!(it.qty>0))){ toast('Fix the marked item first.','bad'); return; }
  const lines=slip.items.map(it=>{ const m=Data.inv[it.id]; m.stock-=needUnits(m,it); flash.add(m.id);
    return {id:m.id,name:m.name,generic:m.generic,batch:m.batch,expiry:m.expiry,rx:m.rx,units:needUnits(m,it),qtyLabel:unitLabel(m,it.unit,it.qty),rate:it.unit==='pack'||m.pack===1?m.mrp:m.mrp/m.pack,amount:lineAmt(m,it)}; });
  persistStock(lines.map(l=>l.id));
  const seconds=+Math.max(1,(performance.now()-slip.t0)/1000).toFixed(1);
  const b={id:'b'+Date.now().toString(36),no:billNo(),at:Date.now(),patient:{name:slip.patient.name||'',age:slip.patient.age??null},payment:slip.payment,lines,total:+lines.reduce((s,l)=>s+l.amount,0).toFixed(2),seconds,engine:slip.engine,transcript:slip.transcript};
  persistBill(b); lastBill=b;
  slip={mode:'done',bill:b}; renderAll();
  speak(`Bill done. ${Math.round(b.total)} rupees.`);
  if(SET.autoPrint&&!IN_ARTIFACT) setTimeout(()=>printBill(b),350);
}
function printBill(b){ $('#printArea').innerHTML=`<div class="slip">${receiptHTML(b,false)}</div>`; try{ window.print(); }catch(e){} }
let Downloads=null;
async function saveBill(b){
  if(!Downloads) return;
  const html=`<!doctype html><meta charset="utf-8"><title>${esc(b.no)}</title><style>body{font:13px/1.5 ui-monospace,Menlo,monospace;max-width:320px;margin:20px auto}.s-stamp{display:none}.s-store{text-align:center;display:flex;flex-direction:column}.s-title{text-align:center;letter-spacing:.2em;margin:8px 0}.s-kv,.s-total{display:flex;justify-content:space-between}.s-item{display:grid;grid-template-columns:1fr auto;padding:4px 0;border-bottom:1px dotted #aaa}.s-meta{grid-column:1/-1;font-size:11px;color:#555}.s-note{font-size:11px;color:#444}.s-thanks{text-align:center}hr{border:0;border-top:1px dashed #999}</style>${receiptHTML(b,false)}`;
  try{ await Downloads.save({filename:`${b.no.replace(/\//g,'-')}.html`,data:html}); }catch(e){ if(e&&e.code!=='cancelled') toast('Could not save the bill.','bad'); }
}

/* ---------- live transcript ---------- */
function showLive(_tag,text,src){ $('#live').innerHTML=`${esc(text)}${src?`<br><span class="src">${esc(src)}</span>`:''}`; }
function setMicState(t){ $('#micState').textContent=t; }

/* ---------- stock page ---------- */
let invFilter='all', invQuery='', expWin='all', invSort='expiry'; const flash=new Set();
const EXP_WINDOWS=[['all','All'],[30,'30 days'],[60,'60 days'],[90,'3 months'],[180,'6 months'],[365,'1 year'],['expired','Expired']];
function stockStats(){ const meds=Object.values(Data.inv); return {total:meds.length,out:meds.filter(m=>m.stock<=0).length,low:meds.filter(m=>m.stock>0&&m.stock<=m.reorder).length,exp30:meds.filter(m=>m.stock>0&&daysLeft(m.expiry)<=30).length}; }
function inWindow(m){ const d=daysLeft(m.expiry); if(expWin==='all') return true; if(expWin==='expired') return d<0; return d>=0&&d<=expWin; }
function renderStock(){
  const st=stockStats();
  $('#stockStats').innerHTML=[['all',st.total,'Medicines',''],['out',st.out,'Out of stock','bad'],['low',st.low,'Reorder','warn'],['exp30',st.exp30,'Expired or ≤ 30 days','bad']]
    .map(([f,n,l,c])=>`<button type="button" class="stat ${c}" data-f="${f}" aria-pressed="${invFilter===f}"><b>${n}</b><span>${l}</span></button>`).join('');
  $('#expWin').innerHTML=EXP_WINDOWS.map(([v,l])=>`<button type="button" data-w="${v}" class="${v==='expired'?'red':''}" aria-pressed="${String(expWin)===String(v)}">${l}</button>`).join('');
  $('#invSort').value=invSort;
  let meds=Object.values(Data.inv);
  if(invFilter==='out') meds=meds.filter(m=>m.stock<=0);
  if(invFilter==='low') meds=meds.filter(m=>m.stock>0&&m.stock<=m.reorder);
  if(invFilter==='exp30') meds=meds.filter(m=>m.stock>0&&daysLeft(m.expiry)<=30);
  meds=meds.filter(inWindow);
  if(invQuery){ const q=invQuery.toLowerCase(); meds=meds.filter(m=>(m.name+' '+m.generic+' '+m.rack).toLowerCase().includes(q)); }
  const sorters={expiry:(a,b)=>daysLeft(a.expiry)-daysLeft(b.expiry)||b.stock-a.stock,value:(a,b)=>stockValue(b)-stockValue(a),rack:(a,b)=>a.rack.localeCompare(b.rack)||a.name.localeCompare(b.name),name:(a,b)=>a.name.localeCompare(b.name)};
  meds.sort(sorters[invSort]);
  const inStock=meds.filter(m=>m.stock>0);
  $('#expSum').innerHTML=expWin==='all'?'':`<b>${inStock.length}</b> in stock · <b>${money(inStock.reduce((a,m)=>a+stockValue(m),0)).replace(/\.\d\d$/,'')}</b> at MRP`;
  $('#stockBody').innerHTML=`<div class="tablewrap"><table class="t"><thead><tr><th>Medicine</th><th>Expiry</th><th>Stock</th><th class="hide-s num">Value</th><th class="hide-s">Rack</th></tr></thead><tbody>
    ${meds.map(m=>{ const [k,l]=status(m); const pct=Math.min(100,Math.round(m.stock/Math.max(m.reorder*3,1)*100)); const e=expInfo(m.expiry);
      return `<tr class="${flash.has(m.id)?'flash':''} ${e.d<0&&m.stock>0?'expired':''}"><td><b>${esc(m.name)}</b> ${m.rx?'<span class="tag rx">Rx</span>':''}<small>${esc(m.generic)} · ${m.batch}</small></td>
      <td class="mono">${expLabel(m.expiry)}<span class="days ${e.cls}">${e.txt}</span></td>
      <td><div class="lvl"><span class="gauge"><i class="${k}" style="width:${Math.max(pct,k==='out'?0:4)}%"></i></span><span class="mono">${esc(stockText(m))}</span></div>${k!=='ok'?`<small><span class="tag ${k}">${l}</span></small>`:''}</td>
      <td class="hide-s num mono">${money(stockValue(m)).replace(/\.\d\d$/,'')}</td><td class="hide-s mono">${m.rack}</td></tr>`; }).join('')||'<tr><td colspan="5" class="empty">Nothing in this window.</td></tr>'}
    </tbody></table></div>`;
  setTimeout(()=>flash.clear(),1900);
}

/* ---------- bills page ---------- */
let selBill=null;
function renderBills(){
  const bills=Data.bills; const t=bills.filter(b=>new Date(b.at).toDateString()===today());
  $('#billsSub').textContent=bills.length?`${t.length} today · ${money(t.reduce((a,b)=>a+b.total,0)).replace('.00','')}`:'';
  if(!bills.length){ $('#billsBody').innerHTML=`<p class="empty">No bills yet.</p>`; $('#billSlip').innerHTML=`${slipHeader()}<div class="s-empty">${ICON.slip}<span>Select a bill</span></div>`; return; }
  if(!selBill||!bills.find(b=>b.id===selBill)) selBill=bills[0].id;
  $('#billsBody').innerHTML=`<div class="tablewrap"><table class="t"><thead><tr><th>Time</th><th>Patient</th><th class="num">Total</th><th class="num">Speed</th></tr></thead><tbody>
    ${bills.map(b=>`<tr class="click ${b.id===selBill?'sel':''}" data-bill="${esc(b.id)}" tabindex="0"><td class="mono">${timeStr(b.at)}<small>${new Date(b.at).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</small></td><td><b>${esc(b.patient.name||'Walk-in')}</b>${b.sample?' <span class="tag">Sample</span>':''}<small>${b.lines.map(l=>esc(l.name)).join(', ')}</small></td><td class="num mono">${money(b.total)}</td><td class="num mono">${b.seconds} s</td></tr>`).join('')}
    </tbody></table></div>`;
  const b=bills.find(x=>x.id===selBill); const sec=actionSecondary(b);
  $('#billSlip').innerHTML=receiptHTML(b,false)+(sec?`<div class="s-actions"><div class="s-sec">${sec}</div></div>`:'');
}

/* ---------- dashboard ---------- */
let period='7';
const PERIODS=[['1','Today'],['7','7 days'],['30','30 days']];
function periodBills(){ const start=new Date(); start.setHours(0,0,0,0); const from=start.getTime()-(Number(period)-1)*864e5; return Data.bills.filter(b=>b.at>=from); }
const lineUnits=(l)=>{ if(l.units!=null) return l.units; const m=Data.inv[l.id]; const n=parseInt(l.qtyLabel,10)||0; return m&&/strip|bottle|tube|sachet|box/.test(l.qtyLabel)?n*m.pack:n; };
function renderInsights(){
  $('#period').innerHTML=PERIODS.map(([v,l])=>`<button type="button" data-p="${v}" aria-pressed="${period===v}">${l}</button>`).join('');
  const bills=periodBills(), today=Data.bills.filter(b=>new Date(b.at).toDateString()===new Date().toDateString());
  const sales=bills.reduce((a,b)=>a+b.total,0);
  const avg=bills.length?bills.reduce((a,b)=>a+b.seconds,0)/bills.length:0;
  const saved=bills.reduce((a,b)=>a+Math.max(0,MANUAL_SECONDS-b.seconds),0)/60;
  const pl=PERIODS.find(p=>p[0]===period)[1].toLowerCase();
  $('#kpis').innerHTML=[
    [`Sales · ${pl}`,money(sales).replace(/\.\d\d$/,''),'hero'],
    ['Bills',bills.length,''],
    ['Avg per bill',bills.length?avg.toFixed(1)+' s':'—',''],
    ['Time saved',bills.length?(saved>=60?(saved/60).toFixed(1)+' h':Math.round(saved)+' min'):'—',''],
  ].map(([l,v,c])=>`<div class="kpi ${c}"><span>${l}</span><b>${v}</b></div>`).join('');
  // top sellers by revenue
  const agg={}; bills.forEach(b=>b.lines.forEach(l=>{ const a=agg[l.id]||(agg[l.id]={id:l.id,name:l.name,rev:0,units:0,bills:0}); a.rev+=l.amount; a.units+=lineUnits(l); a.bills++; }));
  const top=Object.values(agg).sort((a,b)=>b.rev-a.rev).slice(0,8); const maxRev=top.length?top[0].rev:1;
  $('#topSub').textContent=bills.some(b=>b.sample)?'includes sample sales':'';
  $('#topBody').innerHTML=top.length?`<div class="tablewrap"><table class="t"><thead><tr><th></th><th>Medicine</th><th class="num">Sold</th><th class="num">Revenue</th><th>Stock left</th></tr></thead><tbody>
    ${top.map((t,i)=>{ const m=Data.inv[t.id]; const [k,l]=m?status(m):['ok','']; const sold=m?plural(m.pack>1?Math.round(t.units/m.pack*10)/10:t.units,m.packName):t.units;
      return `<tr class="${i<3?'top':''}"><td><span class="rank">${i+1}</span></td><td><b>${esc(t.name)}</b><div class="share"><i style="width:${Math.round(t.rev/maxRev*100)}%"></i></div></td><td class="num mono">${esc(sold)}</td><td class="num mono">${money(t.rev).replace(/\.\d\d$/,'')}</td><td>${m?`<span class="mono">${esc(stockText(m))}</span>${k!=='ok'?` <span class="tag ${k}">${l}</span>`:''}`:''}</td></tr>`; }).join('')}
    </tbody></table></div>`:'<p class="empty">No sales in this period.</p>';
  // sell first: in-stock, expiring within 90 days or expired, soonest first
  const risk=Object.values(Data.inv).filter(m=>m.stock>0&&daysLeft(m.expiry)<=90).sort((a,b)=>daysLeft(a.expiry)-daysLeft(b.expiry));
  $('#riskSub').textContent=risk.length?`${money(risk.reduce((a,m)=>a+stockValue(m),0)).replace(/\.\d\d$/,'')} at MRP`:'';
  $('#riskBody').innerHTML=risk.length?`<div class="tablewrap"><table class="t"><thead><tr><th>Medicine</th><th>Expiry</th><th>Stock</th><th class="num">Value</th></tr></thead><tbody>
    ${risk.map(m=>{ const e=expInfo(m.expiry); return `<tr class="${e.d<0?'expired':''}"><td><b>${esc(m.name)}</b><small>${m.rack} · ${m.batch}</small></td><td class="mono">${expLabel(m.expiry)}<span class="days ${e.cls}">${e.d<0?'Expired · remove':e.txt}</span></td><td class="mono">${esc(stockText(m))}</td><td class="num mono">${money(stockValue(m)).replace(/\.\d\d$/,'')}</td></tr>`; }).join('')}
    </tbody></table></div>`:'<p class="empty">Nothing expires in the next 3 months.</p>';
  // seconds per bill, today
  const rows=[{label:'Manual (typical)',v:MANUAL_SECONDS,ref:true}].concat(today.filter(b=>!b.sample).slice(0,8).reverse().map(b=>({label:`${timeStr(b.at)} ${b.patient.name||'Walk-in'}`,v:b.seconds})));
  if(rows.length===1) $('#timeChart').innerHTML='<p class="empty">Make a bill on the Counter to see its time here.</p>';
  else{
    const W=560,L=150,R=58,rowH=30,H=rows.length*rowH+26,max=Math.max(MANUAL_SECONDS,...rows.map(r=>r.v)),x=v=>L+(W-L-R)*v/max;
    const ticks=[0,60,120,180,240,300].filter(v=>v<=max);
    $('#timeChart').innerHTML=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Seconds per bill compared with manual billing">
      ${ticks.map(v=>`<line x1="${x(v)}" x2="${x(v)}" y1="4" y2="${H-22}" stroke="var(--line)" stroke-width="1"/><text x="${x(v)}" y="${H-6}" font-size="11" text-anchor="middle" fill="var(--muted)" font-family="var(--mono)">${v===0?'0':v/60+'m'}</text>`).join('')}
      ${rows.map((r,i)=>{ const y=8+i*rowH, w=Math.max(3,x(r.v)-L); return `<text x="${L-10}" y="${y+15}" font-size="12" text-anchor="end" fill="${r.ref?'var(--muted)':'var(--ink)'}" font-family="var(--body)">${esc(r.label.length>20?r.label.slice(0,19)+'…':r.label)}</text>
        <rect x="${L}" y="${y+3}" width="${w}" height="18" rx="4" fill="${r.ref?'var(--line)':'var(--brand)'}"/>
        <text x="${L+w+6}" y="${y+16}" font-size="12" fill="var(--ink)" font-family="var(--mono)" font-weight="600">${r.ref?'~300 s':r.v+' s'}</text>`; }).join('')}
    </svg>`;
  }
  $('#logBody').innerHTML=Data.log.length?`<ul class="log">${Data.log.map(l=>`<li><span class="t">${timeStr(l.at)}</span><span class="txt">${esc(l.text)}</span><span class="out">${esc(l.outcome)} · ${esc(l.engine)}</span></li>`).join('')}</ul>`:'<p class="empty">Nothing yet.</p>';
}

/* ---------- chrome: engine pill, nav dot, footer ---------- */
let SERVER_READY=false;
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
const sarvamAvailable=()=>SET.useVoice&&(SET.key||SERVER_READY);
function renderEngine(){
  const p=$('#engine'); let cls='',txt='';
  if(IN_ARTIFACT){ cls='warn'; txt='Typing mode'; }
  else if(sarvamAvailable()){ if(SET.key&&SET.keyState==='bad'){cls='bad';txt='Sarvam key issue';} else {cls='ok';txt='Sarvam';} }
  else if(SR){ cls='warn'; txt='Browser speech'; }
  else { cls='bad'; txt='Typing only'; }
  p.className='pill '+cls; $('#engineTxt').textContent=txt;
  document.querySelectorAll('#langs button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.lang===SET.lang));
  if(IN_ARTIFACT&&!rec) setMicState('Type or tap a demo');
}
function renderFoot(msg){
  const d=$('#dataMode'); d.textContent=msg||(Data.cloud?'Cloud database':'Saved on this device'); d.className='dot'+(Data.cloud?' cloud':'');
  const st=stockStats(); $('#navAlert').hidden=!(st.out||st.low);
}
function renderAll(){ renderSlip(); renderFoot(); if(view==='stock') renderStock(); if(view==='bills') renderBills(); if(view==='insights') renderInsights(); }

/* ---------- microphone + speech (Sarvam, browser fallback) ---------- */
let rec=null;
const WAVE_N=28;
function drawWave(level,t){ const bars=$('#wave').children; for(let i=0;i<bars.length;i++){ const h=4+level*30*(0.35+0.65*Math.abs(Math.sin(i*1.7+t*0.012))); bars[i].style.height=h.toFixed(1)+'px'; } }
function encodeWav(chunks,inRate){
  const len=chunks.reduce((a,c)=>a+c.length,0); const data=new Float32Array(len); let o=0; chunks.forEach(c=>{data.set(c,o);o+=c.length;});
  const ratio=inRate/16000; const outLen=Math.min(Math.floor(len/ratio),16000*29);
  const buf=new ArrayBuffer(44+outLen*2); const v=new DataView(buf); const ws=(off,s)=>{for(let i=0;i<s.length;i++) v.setUint8(off+i,s.charCodeAt(i));};
  ws(0,'RIFF'); v.setUint32(4,36+outLen*2,true); ws(8,'WAVE'); ws(12,'fmt '); v.setUint32(16,16,true); v.setUint16(20,1,true); v.setUint16(22,1,true); v.setUint32(24,16000,true); v.setUint32(28,32000,true); v.setUint16(32,2,true); v.setUint16(34,16,true); ws(36,'data'); v.setUint32(40,outLen*2,true);
  for(let i=0;i<outLen;i++){ const s0=Math.floor(i*ratio), s1=Math.min(len,Math.floor((i+1)*ratio)); let sum=0,c=0; for(let k=s0;k<s1;k++){sum+=data[k];c++;} let s=c?sum/c:0; s=Math.max(-1,Math.min(1,s)); v.setInt16(44+i*2,s<0?s*0x8000:s*0x7FFF,true); }
  return {blob:new Blob([buf],{type:'audio/wav'}),seconds:outLen/16000};
}
const silentWav=()=>encodeWav([new Float32Array(16000)],16000).blob;
function sarvamError(status,body){
  const er=(body&&body.error)||{}; const code=er.code||''; const msg=(er.message||'').slice(0,140);
  if(code==='insufficient_quota_error') return 'Sarvam credits are used up. Add credit in indus.sarvam.ai.';
  if(code==='invalid_api_key_error'||code==='authentication_error') return 'Sarvam says this key is invalid (invalid_api_key_error). Create a key at indus.sarvam.ai → API Keys (the Samvaad agent key does not work here).';
  if(status===429||code==='rate_limit_exceeded_error') return 'Sarvam is busy. Try again.';
  if(status===503&&code==='NOT_CONFIGURED') return 'No Sarvam key on the server yet.';
  return `Sarvam error ${status}${code?' · '+code:''}${msg?' · '+msg:''}`;
}
const cleanKey=k=>String(k||'').trim().replace(/^bearer\s+/i,'').replace(/^["'`]+|["'`]+$/g,'').trim();
async function sarvamSTT(blob,minimal){
  const fd=new FormData();
  fd.append('file',blob,'command.wav'); fd.append('model',SARVAM_MODEL); fd.append('language_code',LANGS[SET.lang].code);
  if(!minimal) fd.append('keyterms',JSON.stringify(KEYTERMS.slice(0,50)));
  const direct=!!SET.key;
  const ctl=new AbortController(); const to=setTimeout(()=>ctl.abort(),15000);
  let r; try{ r=await fetch(direct?SARVAM_URL:'api/stt',{method:'POST',headers:direct?{'api-subscription-key':SET.key}:{},body:fd,signal:ctl.signal}); }
  catch(e){ clearTimeout(to); throw new Error(e.name==='AbortError'?'Sarvam took too long.':'Could not reach Sarvam. Check the internet.'); }
  clearTimeout(to);
  let body={}; try{ body=await r.json(); }catch(e){}
  if((r.status===400||r.status===422)&&!minimal) return sarvamSTT(blob,true);
  if(!r.ok){ const err=new Error(sarvamError(r.status,body)); err.status=r.status; err.code=body&&body.error&&body.error.code; throw err; }
  return {text:(body.transcript||'').trim(),lang:body.language_code||''};
}
async function startListening(){
  if(AG) return stopAgent();
  if(rec) return stopListening();
  if(IN_ARTIFACT){ showLive('','Voice works in the Chrome app. Type below or tap a demo.'); $('#cmd').focus(); return; }
  if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){ toast('Microphone not available. Use Chrome.','bad'); return; }
  const r={t0:performance.now(),chunks:[],browserText:'',interim:''}; rec=r;
  try{ r.stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,channelCount:1}}); }
  catch(e){ rec=null; toast('Allow the microphone in the address bar.','bad'); return; }
  r.ctx=new (window.AudioContext||window.webkitAudioContext)();
  const src=r.ctx.createMediaStreamSource(r.stream);
  r.an=r.ctx.createAnalyser(); r.an.fftSize=512; src.connect(r.an);
  r.proc=r.ctx.createScriptProcessor(4096,1,1);
  r.proc.onaudioprocess=e=>{ if(rec===r) r.chunks.push(new Float32Array(e.inputBuffer.getChannelData(0))); };
  src.connect(r.proc); r.proc.connect(r.ctx.destination);
  if(SR){ try{ const s=new SR(); s.lang=LANGS[SET.lang].sr; s.continuous=true; s.interimResults=true;
    s.onresult=ev=>{ let fin='',inter=''; for(let i=0;i<ev.results.length;i++){ const t=ev.results[i][0].transcript; if(ev.results[i].isFinal) fin+=t+' '; else inter+=t; } r.browserText=fin.trim(); r.interim=inter; showLive('',(fin+inter).trim()); };
    r.srDone=new Promise(res=>{ s.onend=res; s.onerror=res; }); s.start(); r.sr=s; }catch(e){} }
  document.body.classList.add('listening'); setMicState('Listening'); $('#live').innerHTML='';
  const lvl=new Uint8Array(r.an.fftSize);
  const tick=t=>{ if(rec!==r){ drawWave(0,0); return; } r.an.getByteTimeDomainData(lvl); let m=0; for(const x of lvl) m=Math.max(m,Math.abs(x-128)); const L=Math.min(1,m/90); document.documentElement.style.setProperty('--lvl',L.toFixed(3)); drawWave(L,t||0); requestAnimationFrame(tick); };
  tick(); r.timer=setTimeout(()=>{ if(rec===r) stopListening(); },25000);
}
async function stopListening(){
  const r=rec; if(!r) return; rec=null; clearTimeout(r.timer);
  document.body.classList.remove('listening'); document.documentElement.style.setProperty('--lvl',0); drawWave(0,0);
  setMicState('Transcribing'); document.body.classList.add('busy');
  try{ r.proc.disconnect(); }catch(e){} r.stream.getTracks().forEach(t=>t.stop());
  const rate=r.ctx.sampleRate; try{ r.ctx.close(); }catch(e){}
  if(r.sr){ try{ r.sr.stop(); }catch(e){} await Promise.race([r.srDone,new Promise(x=>setTimeout(x,1500))]); }
  const wav=encodeWav(r.chunks,rate);
  let text='',engine='',lang='',err='';
  if(sarvamAvailable()&&wav.seconds>0.4){
    try{ const g=await sarvamSTT(wav.blob); text=g.text; lang=g.lang; engine='Sarvam'; if(SET.key&&SET.keyState!=='ok'){SET.keyState='ok';saveSet();renderEngine();} }
    catch(e){ err=e.message; if(SET.key&&(e.code==='invalid_api_key_error'||e.code==='authentication_error')){ SET.keyState='bad'; saveSet(); renderEngine(); } }
  }
  const browser=(r.browserText+' '+(r.interim||'')).trim();
  if(!text&&browser){ text=browser; engine='Browser speech'; lang=LANGS[SET.lang].sr; }
  document.body.classList.remove('busy'); setMicState('Tap to speak');
  if(err) toast(err+(text?' Used browser speech.':''),'bad');
  if(!text){ showLive('','Didn’t catch that. Try again.'); return; }
  handleCommand(text,{engine,lang,t0:r.t0,latency:(performance.now()-r.t0)/1000});
}

/* ---------- Samvaad voice agent (Sarvam conversational AI) ---------- */
let AG=null, agentEnding=false;
const agentReady=()=>{ const a=SET.agent||{}; return !!(a.key&&a.app&&a.org&&a.ws); };
function agentError(e){
  const n=(e&&(e.name||e.constructor&&e.constructor.name))||'', m=(e&&e.message)||'';
  if(/Authentication|401/.test(n+m)) return 'Agent key rejected. Check the key in Settings.';
  if(/Forbidden|403/.test(n+m)) return 'This key cannot open that agent. Check the org and workspace IDs.';
  if(/NotFound|404/.test(n+m)||/no committed version/i.test(m)) return 'Agent not found. Check the agent ID, or commit a version in Samvaad.';
  if(/RateLimit|429/.test(n+m)) return 'Sarvam is busy. Try again in a moment.';
  return 'Could not start the agent'+(m?': '+m.slice(0,90):'.');
}
function renderAgentBtn(){
  const b=$('#agentBtn'); if(!b) return;
  b.hidden=IN_ARTIFACT||!window.SarvamConv;
  $('#agentTxt').textContent=AG?'End agent call':'Talk to agent';
}
async function stopAgent(){
  const ag=AG; if(!ag) return; agentEnding=true; AG=null;
  try{ await ag.stop(); }catch(e){}
  document.body.classList.remove('agent'); setMicState(IN_ARTIFACT?'Type or tap a demo':'Tap to speak'); renderAgentBtn(); agentEnding=false;
}
async function toggleAgent(){
  if(AG) return stopAgent();
  if(!agentReady()){ openSettings(); $('#agentSet').open=true; toast('Add the agent key and IDs first'); return; }
  if(rec) await stopListening();
  const {ConversationAgent,BrowserAudioInterface,InteractionType}=window.SarvamConv;
  const a=SET.agent;
  let ag;
  try{
    ag=new ConversationAgent({
      apiKey:a.key,
      config:{org_id:a.org,workspace_id:a.ws,app_id:a.app,user_identifier:'counter-'+Math.random().toString(36).slice(2,8),user_identifier_type:'custom',interaction_type:InteractionType.CALL,input_sample_rate:16000,output_sample_rate:16000},
      audioInterface:new BrowserAudioInterface(),
      transcriptCallback:async msg=>{
        if(!msg||!msg.content) return;
        const user=msg.role==='user';
        $('#live').innerHTML=`<span class="who">${user?'You':'Agent'}</span>${esc(msg.content)}`;
        if(user) handleCommand(msg.content,{engine:'Samvaad agent',t0:performance.now(),agent:true,keepLive:true});
      },
      stateCallback:async st=>{ if(!AG) return; const L={connecting:'Connecting…',connected:'Agent connected',listening:'Agent listening',speaking:'Agent speaking',error:'Agent error'}; setMicState(L[st]||'Agent'); },
      endCallback:async()=>{ if(AG&&!agentEnding){ AG=null; document.body.classList.remove('agent'); setMicState('Tap to speak'); renderAgentBtn(); toast('Agent call ended'); } },
    });
  }catch(e){ toast(agentError(e),'bad'); return; }
  AG=ag; document.body.classList.add('agent'); renderAgentBtn(); setMicState('Connecting…'); $('#live').innerHTML='';
  try{
    await ag.start();
    const ok=await ag.waitForConnect(12);
    if(!ok) throw new Error('timed out connecting');
    logEvent('Agent call started',{engine:'Samvaad agent'},'agent','Connected');
  }catch(e){ toast(agentError(e),'bad'); await stopAgent(); }
}

/* ---------- settings ---------- */
function keyStatusText(){ return SET.key?(SET.keyState==='ok'?'Key works.':SET.keyState==='bad'?'Key rejected last time.':'Saved. Not tested yet.'):(SERVER_READY?'Using the server key.':'No key. Browser speech is used.'); }
function openSettings(){
  $('#setKey').value=SET.key; $('#setVoice').checked=SET.useVoice; $('#setSpeak').checked=SET.speak; $('#setPrint').checked=SET.autoPrint;
  $('#keyStatus').textContent=keyStatusText();
  const a=SET.agent||{}; $('#agKey').value=a.key||''; $('#agApp').value=a.app||''; $('#agOrg').value=a.org||''; $('#agWs').value=a.ws||''; $('#agStatus').textContent=agentReady()?'Ready. Use “Talk to agent” on the Counter.':'Find the IDs in Samvaad → your agent → Deploy with code.'; $('#agentSet').hidden=IN_ARTIFACT;
  const vn=$('#voiceNote'); vn.hidden=!IN_ARTIFACT; vn.textContent='Shared links can’t use the mic. Open Pharma-com.html in Chrome for voice.';
  $('#setModal').hidden=false; $('#setKey').focus();
}
function saveSettings(){ const k=cleanKey($('#setKey').value); $('#setKey').value=k; if(k!==SET.key) SET.keyState=''; SET.key=k; SET.useVoice=$('#setVoice').checked; SET.speak=$('#setSpeak').checked; SET.autoPrint=$('#setPrint').checked; SET.agent={key:cleanKey($('#agKey').value),app:$('#agApp').value.trim(),org:$('#agOrg').value.trim(),ws:$('#agWs').value.trim()}; saveSet(); renderEngine(); renderAgentBtn(); }
async function testKey(){
  saveSettings(); const st=$('#keyStatus');
  if(!SET.key&&!SERVER_READY){ st.textContent='Paste a key first.'; return; }
  st.textContent='Testing…';
  try{ await sarvamSTT(silentWav(),true); if(SET.key) SET.keyState='ok'; st.textContent='Connected to Sarvam. Key works.'; }
  catch(e){
    if(e.status===400||e.status===422){ if(SET.key) SET.keyState='ok'; st.textContent='Key accepted by Sarvam.'; }
    else { if(SET.key&&(e.code==='invalid_api_key_error'||e.code==='authentication_error')) SET.keyState='bad'; st.textContent=e.message; }
  }
  saveSet(); renderEngine();
}

/* ---------- reset ---------- */
async function resetData(){
  const seed=seedInventory();
  if(Data.cloud&&Data.db){
    try{
      await Promise.all(Object.values(seed).map(m=>Data.db.doc('inventory/'+m.id).set(m)));
      await Promise.all(Data.bills.map(b=>Data.db.doc('bills/'+(b._id||b.id)).delete().catch(()=>{})));
      await Promise.all(Data.log.map(l=>Data.db.doc('log/'+(l._id||l.id)).delete().catch(()=>{})));
      await Promise.all(sampleBills(seed).map(b=>Data.db.doc('bills/'+b.id).set(b)));
    }catch(e){ cloudErr(e); return; }
  }
  Data.inv=seed; Data.bills=sampleBills(seed); Data.log=[]; reindex(); saveLocal(); slip={mode:'idle'}; renderAll(); toast('Reset done','ok');
}

/* ---------- events ---------- */
const billById=id=>Data.bills.find(b=>b.id===id)||lastBill;
document.addEventListener('click',e=>{
  const el=e.target.closest('[data-act]'); if(!el) return; const act=el.dataset.act, ix=+el.dataset.ix;
  if(act==='example') handleCommand(el.dataset.text,{engine:'Demo',t0:performance.now()});
  else if(act==='confirm') confirmSlip();
  else if(act==='cancel'){ slip={mode:'idle'}; renderSlip(); }
  else if(act==='done'||act==='next'){ slip={mode:'idle'}; renderSlip(); $('#live').innerHTML=''; }
  else if(act==='remove'){ slip.items.splice(ix,1); if(!slip.items.length) slip={mode:'idle'}; renderSlip(); }
  else if(act==='inc'||act==='dec'){ const it=slip.items[ix]; it.qty=Math.max(1,(it.qty||0)+(act==='inc'?1:-1)); it.assumedQty=false; renderSlip(); }
  else if(act==='swap'){ slip.items[ix].id=el.dataset.to; renderSlip(); }
  else if(act==='useavail'){ const it=slip.items[ix]; const m=Data.inv[it.id]; if(it.unit==='pack'&&m.pack>1&&m.stock%m.pack){ it.unit='unit'; it.qty=m.stock; } else it.qty=it.unit==='pack'||m.pack===1?Math.floor(m.stock/m.pack):m.stock; renderSlip(); }
  else if(act==='pay'){ slip.payment=el.dataset.p; renderSlip(); }
  else if(act==='print') printBill(billById(el.dataset.id));
  else if(act==='save') saveBill(billById(el.dataset.id));
  else if(act==='billfromstock'){ const items=slip.items.filter(it=>Data.inv[it.id].stock>0).map(it=>({id:it.id,qty:1,unit:'pack',assumedQty:true})); slip={mode:'draft',patient:{name:'',age:null},items,transcript:slip.transcript,t0:performance.now(),payment:'Cash',engine:'Typed'}; renderSlip(); }
});
document.addEventListener('change',e=>{
  const el=e.target; if(slip.mode!=='draft') return; const ix=+el.dataset.ix;
  if(el.dataset.act==='qty'){ slip.items[ix].qty=Math.max(1,parseInt(el.value,10)||1); slip.items[ix].assumedQty=false; renderSlip(); }
  else if(el.dataset.act==='unit'){ slip.items[ix].unit=el.value; renderSlip(); }
  else if(el.id==='addMed'&&el.value){ slip.items.push({id:el.value,qty:1,unit:'pack'}); renderSlip(); }
});
document.addEventListener('input',e=>{ if(slip.mode!=='draft') return; if(e.target.id==='pName') slip.patient.name=e.target.value; if(e.target.id==='pAge') slip.patient.age=e.target.value?Number(e.target.value):null; });
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){ if(!$('#setModal').hidden){ $('#setModal').hidden=true; return; } if(slip.mode==='draft'||slip.mode==='restock'){ slip={mode:'idle'}; renderSlip(); } return; }
  if(view!=='counter'||!$('#setModal').hidden) return;
  const inField=e.target.closest('input,select,textarea,button');
  if(e.key==='Enter'&&(slip.mode==='draft'||slip.mode==='restock')&&(!inField||e.target.closest('.s-patient,.s-qty'))){ e.preventDefault(); confirmSlip(); return; }
  if(inField) return;
  if(e.code==='Space'){ e.preventDefault(); startListening(); }
});
$('#billsBody').addEventListener('click',e=>{ const tr=e.target.closest('[data-bill]'); if(tr){ selBill=tr.dataset.bill; renderBills(); } });
$('#billsBody').addEventListener('keydown',e=>{ const tr=e.target.closest('[data-bill]'); if(tr&&e.key==='Enter'){ selBill=tr.dataset.bill; renderBills(); } });
$('#mic').addEventListener('click',startListening);
$('#agentBtn').addEventListener('click',toggleAgent);
$('#typeForm').addEventListener('submit',e=>{ e.preventDefault(); const v=$('#cmd').value; $('#cmd').value=''; handleCommand(v,{engine:'Typed',t0:performance.now()}); });
$('#langs').addEventListener('click',e=>{ const b=e.target.closest('button'); if(!b) return; SET.lang=b.dataset.lang; saveSet(); renderEngine(); });
$('#stockStats').addEventListener('click',e=>{ const b=e.target.closest('[data-f]'); if(!b) return; invFilter=(invFilter===b.dataset.f?'all':b.dataset.f); if(invFilter==='exp30') expWin='all'; renderStock(); });
$('#invSearch').addEventListener('input',e=>{ invQuery=e.target.value; renderStock(); });
$('#expWin').addEventListener('click',e=>{ const b=e.target.closest('[data-w]'); if(!b) return; expWin=b.dataset.w==='all'||b.dataset.w==='expired'?b.dataset.w:Number(b.dataset.w); if(invFilter==='exp30') invFilter='all'; renderStock(); });
$('#invSort').addEventListener('change',e=>{ invSort=e.target.value; renderStock(); });
$('#period').addEventListener('click',e=>{ const b=e.target.closest('[data-p]'); if(!b) return; period=b.dataset.p; renderInsights(); });
$('#openSet').addEventListener('click',openSettings);
$('#engine').addEventListener('click',openSettings);
$('#setSave').addEventListener('click',()=>{ saveSettings(); $('#setModal').hidden=true; toast('Saved','ok'); });
$('#setTest').addEventListener('click',testKey);
$('#setShow').addEventListener('click',()=>{ const i=$('#setKey'); i.type=i.type==='password'?'text':'password'; $('#setShow').textContent=i.type==='password'?'Show':'Hide'; });
document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>{ b.closest('.modal').hidden=true; }));
$('#resetData').addEventListener('click',e=>{ const b=e.currentTarget; if(b.dataset.armed){ delete b.dataset.armed; b.textContent='Reset demo'; resetData(); } else { b.dataset.armed='1'; b.textContent='Tap again to reset'; setTimeout(()=>{ if(b.dataset.armed){ delete b.dataset.armed; b.textContent='Reset demo'; } },4000); } });

/* ---------- boot ---------- */
$('#langs').innerHTML=Object.entries(LANGS).map(([k,v])=>`<button type="button" data-lang="${k}">${v.label}</button>`).join('');
$('#examples').innerHTML=EXAMPLES.map(([l,t,alt])=>`<button type="button" class="chip-btn${alt?' alt':''}" data-act="example" data-text="${esc(t)}" title="${esc(t)}">${esc(l)}</button>`).join('');
$('#wave').innerHTML='<i></i>'.repeat(WAVE_N);
loadLocal(); renderEngine(); renderAgentBtn(); setView(location.hash.slice(1)); renderAll();
if('speechSynthesis' in window){ try{ speechSynthesis.getVoices(); }catch(e){} }
cloudInit();
if(window.claude&&window.claude.use){ window.claude.use('downloads').then(d=>{ Downloads=d; renderAll(); }).catch(()=>{}); }
if(!IN_ARTIFACT&&location.protocol.startsWith('http')){
  fetch('api/stt').then(r=>r.ok?r.json():null).then(j=>{ SERVER_READY=!!(j&&j.ready); renderEngine(); }).catch(()=>{});
}
