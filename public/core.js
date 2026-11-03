/* ===== Pharma.com core: inventory seed + multilingual command parser ===== */

const SEED = [
// id, name, generic, form, pack, packName, unitName, mrp, stockPacks, rack, batch, expiry, rx, reorderPacks, aliases
['dolo650','Dolo 650','Paracetamol 650 mg','tab',15,'strip','tab',33.6,48,'A1','DL24117','2027-08',0,10,['dolo']],
['crocin','Crocin Advance','Paracetamol 500 mg','tab',15,'strip','tab',22,0,'A1','CR24502','2027-03',0,10,['crocin','krosin']],
['calpol','Calpol 500','Paracetamol 500 mg','tab',15,'strip','tab',16.5,22,'A1','CP25010','2027-11',0,8,['calpol']],
['combiflam','Combiflam','Ibuprofen 400 mg + Paracetamol 325 mg','tab',20,'strip','tab',45.6,30,'A2','CF24889','2027-05',0,8,[]],
['saridon','Saridon','Propyphenazone + Paracetamol + Caffeine','tab',10,'strip','tab',42,25,'A2','SD25031','2028-01',0,8,[]],
['disprin','Disprin','Aspirin 350 mg','tab',10,'strip','tab',10.5,40,'A2','DP24770','2026-10',0,10,[]],
['brufen400','Brufen 400','Ibuprofen 400 mg','tab',15,'strip','tab',21.8,18,'A3','BF24612','2027-09',0,6,['brufen']],
['zerodolp','Zerodol-P','Aceclofenac 100 mg + Paracetamol 325 mg','tab',10,'strip','tab',68,20,'A3','ZP25044','2027-12',1,6,['zerodol p','zerodol']],
['azithral500','Azithral 500','Azithromycin 500 mg','tab',3,'strip','tab',119.5,24,'B1','AZ24930','2027-04',1,6,['azithral','azithromycin']],
['augmentin625','Augmentin 625 Duo','Amoxicillin 500 mg + Clavulanic acid 125 mg','tab',10,'strip','tab',223.4,12,'B1','AG24301','2027-02',1,4,['augmentin','augmentin 625']],
['mox500','Mox 500','Amoxicillin 500 mg','cap',10,'strip','cap',82,15,'B1','MX24555','2027-07',1,5,['mox']],
['ciplox500','Ciplox 500','Ciprofloxacin 500 mg','tab',10,'strip','tab',40.6,14,'B2','CX25012','2027-10',1,5,['ciplox']],
['taximo200','Taxim-O 200','Cefixime 200 mg','tab',10,'strip','tab',109.8,10,'B2','TX24877','2027-01',1,4,['taxim o','taxim']],
['pan40','Pan 40','Pantoprazole 40 mg','tab',15,'strip','tab',155,35,'C1','PN24990','2027-09',0,10,['pantoprazole']],
['pand','Pan-D','Pantoprazole 40 mg + Domperidone 30 mg','cap',15,'strip','cap',199.5,28,'C1','PD25005','2027-11',0,8,['pan d']],
['omez20','Omez 20','Omeprazole 20 mg','cap',20,'strip','cap',62.3,20,'C1','OM24718','2027-06',0,6,['omez','omeprazole']],
['rantac150','Rantac 150','Ranitidine 150 mg','tab',20,'strip','tab',40,3,'C2','RT24402','2026-12',0,6,['rantac']],
['digene','Digene Gel','Antacid gel, mint, 200 ml','syrup',1,'bottle','bottle',165,12,'C2','DG25033','2026-12',0,4,['digene']],
['cetzine','Cetzine 10','Cetirizine 10 mg','tab',10,'strip','tab',19.3,40,'D1','CZ24661','2026-11',0,10,['cetzine','cetirizine','setzine']],
['allegra120','Allegra 120','Fexofenadine 120 mg','tab',10,'strip','tab',229,9,'D1','AL24810','2027-05',0,4,['allegra']],
['montairlc','Montair LC','Montelukast 10 mg + Levocetirizine 5 mg','tab',10,'strip','tab',235.5,16,'D1','ML24733','2027-03',1,5,['montair']],
['sinarest','Sinarest','Paracetamol + Phenylephrine + Chlorpheniramine','tab',10,'strip','tab',60.4,22,'D2','SN25018','2026-11',0,6,[]],
['benadryl','Benadryl Syrup','Diphenhydramine cough syrup, 100 ml','syrup',1,'bottle','bottle',130,14,'D2','BN24590','2026-11',0,4,['benadryl']],
['ascorills','Ascoril LS','Ambroxol + Levosalbutamol + Guaifenesin, 100 ml','syrup',1,'bottle','bottle',118,10,'D2','AS24947','2027-06',1,4,['ascoril']],
['vicksaction','Vicks Action 500','Paracetamol + Phenylephrine + Caffeine','tab',10,'strip','tab',47,30,'D3','VA25022','2028-02',0,8,['vicks']],
['glycomet500','Glycomet 500 SR','Metformin 500 mg','tab',20,'strip','tab',35.2,45,'E1','GM24877','2027-09',1,10,['glycomet','metformin']],
['janumet','Janumet 50/500','Sitagliptin 50 mg + Metformin 500 mg','tab',15,'strip','tab',460,8,'E1','JN24620','2027-02',1,3,['janumet']],
['amaryl1','Amaryl 1','Glimepiride 1 mg','tab',30,'strip','tab',135.6,12,'E1','AM24733','2027-07',1,4,['amaryl','glimepiride']],
['telma40','Telma 40','Telmisartan 40 mg','tab',30,'strip','tab',240,20,'E2','TL25001','2027-11',1,6,['telma','telmisartan']],
['amlong5','Amlong 5','Amlodipine 5 mg','tab',15,'strip','tab',55.2,18,'E2','AN24812','2027-08',1,6,['amlong','amlodipine']],
['ecosprin75','Ecosprin 75','Aspirin 75 mg','tab',14,'strip','tab',5.3,60,'E2','EC24955','2027-10',0,10,['ecosprin']],
['atorva10','Atorva 10','Atorvastatin 10 mg','tab',15,'strip','tab',109.5,16,'E3','AT24688','2027-05',1,5,['atorva','atorvastatin']],
['rosuvas10','Rosuvas 10','Rosuvastatin 10 mg','tab',15,'strip','tab',290,10,'E3','RS24577','2027-04',1,4,['rosuvas','rosuvastatin']],
['thyronorm50','Thyronorm 50','Thyroxine 50 mcg','tab',100,'bottle','tab',180.5,15,'E3','TN25009','2027-12',1,4,['thyronorm']],
['shelcal500','Shelcal 500','Calcium 500 mg + Vitamin D3 250 IU','tab',15,'strip','tab',118,25,'F1','SH24744','2027-09',0,6,['shelcal']],
['becosules','Becosules','Vitamin B-complex + Vitamin C','cap',20,'strip','cap',50,30,'F1','BC24816','2027-06',0,8,[]],
['neurobionforte','Neurobion Forte','Vitamin B1 + B6 + B12','tab',30,'strip','tab',37.8,35,'F1','NB25027','2028-01',0,8,['neurobion']],
['limcee','Limcee 500','Vitamin C 500 mg chewable','tab',15,'strip','tab',25,40,'F2','LC24903','2026-12',0,10,['limcee']],
['zincovit','Zincovit','Multivitamin + Zinc','tab',15,'strip','tab',110,22,'F2','ZV24711','2027-07',0,6,[]],
['electral','Electral ORS','Oral rehydration salts, 21.8 g','sachet',1,'sachet','sachet',22,80,'F2','EL25040','2027-01',0,20,['electral','ors']],
['ondem4','Ondem 4','Ondansetron 4 mg','tab',10,'strip','tab',55.6,14,'G1','OD24599','2027-03',1,5,['ondem','ondansetron']],
['domstal','Domstal 10','Domperidone 10 mg','tab',10,'strip','tab',37.9,20,'G1','DS24822','2027-10',0,6,['domstal']],
['eldoper','Eldoper','Loperamide 2 mg','cap',10,'strip','cap',27,15,'G1','ED24730','2027-06',0,5,[]],
['meftalspas','Meftal-Spas','Mefenamic acid 250 mg + Dicyclomine 10 mg','tab',10,'strip','tab',48,26,'G2','MS24966','2027-11',0,8,['meftal spas','meftal']],
['cyclopam','Cyclopam','Dicyclomine 20 mg + Paracetamol 500 mg','tab',10,'strip','tab',56.3,12,'G2','CY24645','2027-04',0,5,[]],
['volini','Volini Gel','Diclofenac topical gel, 30 g','gel',1,'tube','tube',125,18,'H1','VL25014','2027-03',0,5,['volini']],
['betadine','Betadine Ointment','Povidone-iodine 5%, 20 g','ointment',1,'tube','tube',130,10,'H1','BT24788','2027-09',0,4,['betadine']],
['soframycin','Soframycin','Framycetin 1% cream, 30 g','cream',1,'tube','tube',62,12,'H1','SF24901','2027-12',0,4,[]],
['candidb','Candid-B','Clotrimazole + Beclomethasone, 15 g','cream',1,'tube','tube',110.5,2,'H2','CB24677','2027-05',1,4,['candid b','candid']],
['liv52','Liv.52 DS','Herbal liver tonic tablets','tab',60,'bottle','tab',190,9,'H2','LV25036','2028-04',0,3,['liv 52']],
];

function seedInventory(){
  const inv = {};
  SEED.forEach(r=>{
    const [id,name,generic,form,pack,packName,unitName,mrp,stockPacks,rack,batch,expiry,rx,reorder,aliases]=r;
    inv[id]={id,name,generic,form,pack,packName,unitName,mrp,stock:stockPacks*pack,rack,batch,expiry,rx:!!rx,reorder:reorder*pack,aliases};
  });
  return inv;
}

/* ---------- Transliteration: Devanagari / Kannada / Telugu -> Latin ---------- */
const V_IND={0x05:'a',0x06:'aa',0x07:'i',0x08:'ii',0x09:'u',0x0A:'uu',0x0B:'ri',0x0C:'li',0x0D:'e',0x0E:'e',0x0F:'e',0x10:'ai',0x11:'o',0x12:'o',0x13:'o',0x14:'au'};
const CONS={0x15:'k',0x16:'kh',0x17:'g',0x18:'gh',0x19:'ng',0x1A:'ch',0x1B:'chh',0x1C:'j',0x1D:'jh',0x1E:'ny',0x1F:'t',0x20:'th',0x21:'d',0x22:'dh',0x23:'n',0x24:'t',0x25:'th',0x26:'d',0x27:'dh',0x28:'n',0x29:'n',0x2A:'p',0x2B:'ph',0x2C:'b',0x2D:'bh',0x2E:'m',0x2F:'y',0x30:'r',0x31:'r',0x32:'l',0x33:'l',0x34:'l',0x35:'v',0x36:'sh',0x37:'sh',0x38:'s',0x39:'h',0x58:'q',0x59:'kh',0x5A:'g',0x5B:'z',0x5C:'r',0x5D:'rh',0x5E:'f',0x5F:'y'};
const MATRA={0x3E:'aa',0x3F:'i',0x40:'ii',0x41:'u',0x42:'uu',0x43:'ri',0x44:'ri',0x45:'e',0x46:'e',0x47:'e',0x48:'ai',0x49:'o',0x4A:'o',0x4B:'o',0x4C:'au',0x4E:'e'};
const NUKTA={ph:'f',j:'z',k:'q',d:'r',dh:'rh',g:'g',kh:'kh'};
function blockBase(cp){
  if(cp>=0x0900&&cp<=0x097F) return 0x0900;
  if(cp>=0x0C00&&cp<=0x0C7F) return 0x0C00;
  if(cp>=0x0C80&&cp<=0x0CFF) return 0x0C80;
  return -1;
}
function offIn(ch,base){ if(!ch) return -1; const cp=ch.codePointAt(0); return blockBase(cp)===base ? cp-base : -1; }
function isLetterOff(o){ return (o>=0x01&&o<=0x4D)||(o>=0x55&&o<=0x5F); }
function scriptOf(text){
  for(const ch of text){ const b=blockBase(ch.codePointAt(0)); if(b===0x0900) return 'deva'; if(b===0x0C00) return 'telu'; if(b===0x0C80) return 'knda'; }
  return 'latn';
}
function translit(s){
  const chars=[...s]; let out='';
  for(let i=0;i<chars.length;i++){
    const cp=chars[i].codePointAt(0); const base=blockBase(cp);
    if(base<0){ out+=chars[i]; continue; }
    const off=cp-base;
    if(off>=0x66&&off<=0x6F){ out+=String(off-0x66); continue; }
    if(off===0x64||off===0x65){ out+=' '; continue; }
    if(off===0x01||off===0x02){ out+='n'; continue; }
    if(off===0x03){ out+='h'; continue; }
    if(V_IND[off]){ out+=V_IND[off]; continue; }
    if(CONS[off]!==undefined){
      let c=CONS[off]; let j=i+1;
      if(offIn(chars[j],base)===0x3C){ c=NUKTA[c]||c; j++; }
      const n2=offIn(chars[j],base);
      if(n2===0x4D){ out+=c; i=j; continue; }
      if(MATRA[n2]){ out+=c+MATRA[n2]; i=j; continue; }
      const endOfWord=!(n2>=0 && isLetterOff(n2));
      out += (base===0x0900 && endOfWord) ? c : c+'a';
      i=j-1; continue;
    }
    if(MATRA[off]){ out+=MATRA[off]; continue; }
  }
  return out;
}

/* ---------- Normalisers ---------- */
function lnorm(w){
  return w.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'')
    .replace(/aa+/g,'a').replace(/ii+|ee+/g,'i').replace(/uu+|oo+/g,'u');
}
function mnorm(w){
  let s=lnorm(w);
  s=s.replace(/ph/g,'f').replace(/z/g,'j').replace(/x/g,'ks').replace(/q/g,'k').replace(/w/g,'v')
     .replace(/c(?=[eiy])/g,'s').replace(/ch/g,'c').replace(/c/g,'k')
     .replace(/([kgtdbjsp])h/g,'$1').replace(/y/g,'i').replace(/ai/g,'a').replace(/(.)\1+/g,'$1');
  return s;
}
function displayName(raw){
  return raw.split(/\s+/).filter(Boolean).map(w=>{
    if(/[A-Z]/.test(w)) return w;            // keep typed casing
    w=w.replace(/ii/g,'ee').replace(/uu/g,'oo').replace(/aa/g,'a');
    return w.charAt(0).toUpperCase()+w.slice(1);
  }).join(' ');
}

/* ---------- Word lists (all keys pass through lnorm) ---------- */
function setOf(str){ const s=new Set(); str.split(/[\s,]+/).filter(Boolean).forEach(w=>s.add(lnorm(w))); return s; }
const NUMW = {};
(function(){
  const add=(v,words)=>words.split(/[\s,]+/).filter(Boolean).forEach(w=>{NUMW[lnorm(w)]=v;});
  // English
  'zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen'.split(' ').forEach((w,i)=>add(i,w));
  [['twenty',20],['thirty',30],['forty',40],['fourty',40],['fifty',50],['sixty',60],['seventy',70],['eighty',80],['ninety',90],['hundred',100]].forEach(([w,v])=>add(v,w));
  // Hindi 1-90 (common spellings)
  const hi=['ek','do','teen tin','char chaar','panch paanch','chhe chhah chah che chhai chhaha','saat sat','aath','nau no','das dus','gyarah gyara giyarah','barah bara','terah tera','chaudah chauda','pandrah pandra','solah sola','satrah satra','atharah athara attharah','unnis unnees','bees bis','ikkis ikkees','bais baais','teis teees','chaubis chaubees','pachchis pachis pachees','chhabbis chhabbees','sattais','atthais atthaees','untis untees','tees tis','iktis iktees','battis','tetis taintis','chautis','paintis','chhattis','saintis','adtis artis','untalis','chalis chaalis','iktalis','bayalis','tetalis taintalis','chavalis chauvalis','paintalis','chhiyalis','saintalis','adtalis','unchas','pachas pachaas','ikyavan','bavan','tirpan','chauvan','pachpan','chhappan','sattavan','atthavan','unsath','saath','iksath','basath','tirsath','chausath','painsath','chhiyasath','sadsath','adsath','unhattar','sattar','ikhattar','bahattar','tihattar','chauhattar','pachhattar','chhihattar','satattar','athhattar','unasi','assi','ikyasi','bayasi','tirasi','chaurasi','pachasi','chhiyasi','sattasi','athasi','navasi nawasi','nabbe'];
  hi.forEach((w,i)=>add(i+1,w));
  add(100,'sau so');
  // Marathi
  add(2,'don'); add(5,'pach'); add(6,'saha'); add(10,'daha dahaa'); add(11,'akra'); add(12,'bara'); add(13,'tera'); add(14,'chauda'); add(15,'pandhra'); add(16,'sola'); add(17,'satra'); add(18,'athra'); add(19,'ekonis'); add(20,'vis vees'); add(25,'panchvis'); add(50,'pannas'); add(60,'saath'); add(100,'shambhar');
  // Kannada
  add(1,'ondu'); add(2,'eradu'); add(3,'muru mooru'); add(4,'nalku naalku'); add(5,'aidu'); add(6,'aru aaru'); add(7,'elu'); add(8,'entu'); add(9,'ombattu'); add(10,'hattu'); add(11,'hannondu'); add(12,'hanneradu'); add(13,'hadimuru'); add(14,'hadinalku'); add(15,'hadinaidu'); add(16,'hadinaru'); add(17,'hadinelu'); add(18,'hadinentu'); add(19,'hattombattu'); add(20,'ippattu'); add(30,'muvattu'); add(40,'nalavattu nalvattu'); add(50,'aivattu'); add(60,'aravattu'); add(70,'eppattu'); add(80,'embattu'); add(90,'tombattu'); add(100,'nuru nooru');
  // Telugu
  add(1,'okati'); add(2,'rendu'); add(3,'mudu moodu'); add(4,'nalugu naalugu'); add(7,'edu'); add(8,'enimidi'); add(9,'tommidi'); add(10,'padi'); add(11,'padakondu'); add(12,'pannendu'); add(13,'padamudu'); add(14,'padnalugu'); add(15,'padihenu'); add(16,'padaharu padahaaru'); add(17,'padihedu'); add(18,'padhenimidi'); add(19,'pantommidi'); add(20,'iravai'); add(30,'muppai'); add(40,'nalabhai nalabai'); add(50,'yabhai yabai'); add(60,'aravai'); add(70,'debbai'); add(80,'enabhai enabai'); add(90,'tombhai'); add(100,'vanda');
})();
const HUNDRED = setOf('hundred sau shambhar nuru nooru vanda');
const AMBIG_NUM = setOf('do no so aru edu tera bara sat sola');  // also common words; need a unit/age next to them

const UNIT_PACK = setOf('strip strips istrip patta patte pattey pate patti pattiyan pattiya pattiyaan bottle bottles botal botl batli bottlu bottil sheesha shishi tube tubes tyub box boxes dabba dabbi packet packets paket pack packs sachet sachets pudiya pouch');
const UNIT_UNIT = setOf('tablet tablets tab tabs tablate goli goliyan goliya golya golia gulige gulike gulika matre maatre matralu matrelu matra capsule capsules cap caps kapsul');
const AGE_AFTER = setOf('sal saal sala saalka varsh varsha varshe varshaa varshada varshagalu years year yrs yr yo umar umr vayas vayasu vayassu edlu ellu elu samvatsaralu sanvatsaralu samvatsaram sanvatsaram samvatsaraala old');
const AGE_BEFORE = setOf('age aged umar umr vayas vayasu vayassu vay');
const STOP = setOf(`please make create generate bill billing invoice for of and the a an give add to with check is there available do we have print patient name age old years me i want need sell sale total mr mrs ms miss kumari shri smt sir madam mg ml mcg gm g
ka ki ke ko liye lie liya lia banao bana banado banana banaiye banaye karo kar kardo karna kijiye kariye dedo de dijiye dena chahiye chaiye hai hain he kya nahi naam aur ek wala wali vala vali mein me se par ji sahab bhai unka uska unke iska abhi jaldi dekho batao kitna kitne kitni dawai dawa dava davai medicine bil bill ko hamko mujhe mere mera
sathi saathi la chi cha che chya kara dya dyaa pahije ahe aahe naav vay ani tyanna tyala yanna
ge ige madi maadi kodi beku ide ideya illa hesaru mattu avarige dayavittu bekagide
kosam cheyyandi cheyandi cheyi ivvandi ivvu kavali undi unda ledu peru mariyu garu gariki dayachesi
stock stok add plus more extra rupees rupay rupaye rs`);
const MARK_BEFORE = setOf('for patient naam name named mr mrs ms miss shri smt kumari peru hesaru naav');
const MARK_AFTER = setOf('liye lie liya lia ko sathi saathi kosam gariki avarige garu ji');
const ADD_W = setOf('add jodo jodiye jod daalo dalo aaya aayi aaye aya received receive restock inward purchase kharida vadhava serisi');
const STOCK_W = setOf('stock stok available availabl uplabdh kitna kitne kitni check left bacha bachi ide ideya unda unnaya undha unnai aahe ahe');
const BILL_W = setOf('bill bil billing invoice dedo dijiye kodi ivvandi dya sell give');
const YES_W = setOf('haan han ha hanji yes yeah yep ok okay confirm confirmed theek thik sahi ho hoy haudu houdu hudu avunu aunu sare done print bilkul chalega correct right');
const NO_W = setOf('nahi nahin na no cancel mat nako naka beda illa vaddu ledu ruko stop galat wrong');

/* ---------- Tokeniser ---------- */
function tokenize(text){
  let t = translit(text);
  t = t.replace(/(\d),(\d)/g,'$1$2')
       .replace(/([A-Za-z])(\d)/g,'$1 $2').replace(/(\d)([A-Za-z])/g,'$1 $2')
       .replace(/[^A-Za-z0-9\s]/g,' ');
  return t.split(/\s+/).filter(Boolean).map((raw,i)=>({i, raw, w:lnorm(raw), m:mnorm(raw), kind:null}));
}

/* ---------- Levenshtein ---------- */
function lev(a,b){
  if(a===b) return 0; const m=a.length,n=b.length; if(!m) return n; if(!n) return m;
  let prev=new Array(n+1); for(let j=0;j<=n;j++) prev[j]=j;
  for(let i=1;i<=m;i++){ const cur=[i]; for(let j=1;j<=n;j++){ cur[j]=Math.min(prev[j]+1,cur[j-1]+1,prev[j-1]+(a[i-1]===b[j-1]?0:1)); } prev=cur; }
  return prev[n];
}

/* ---------- Medicine alias index ---------- */
function buildIndex(inv){
  const idx=[]; const firstWordCount={};
  const meds=Object.values(inv);
  meds.forEach(m=>{ const fw=mnorm(tokenize(m.name)[0].raw); firstWordCount[fw]=(firstWordCount[fw]||0)+1; });
  meds.forEach(m=>{
    const names=new Set([m.name, ...(m.aliases||[])]);
    const fwTok=tokenize(m.name)[0];
    if(firstWordCount[fwTok.m]===1 && fwTok.m.length>=4 && !/\d/.test(fwTok.raw)) names.add(fwTok.raw);
    names.forEach(n=>{
      const toks=tokenize(n);
      const joined=toks.map(t=>t.m).join('');
      const digits=toks.filter(t=>/^\d+$/.test(t.raw)).map(t=>t.raw).join('|');
      if(joined.length>=3) idx.push({id:m.id, n:toks.length, joined, digits});
    });
  });
  return idx;
}

function matchMeds(tokens, index){
  const cands=[];
  for(let s=0;s<tokens.length;s++){
    for(let L=1;L<=4 && s+L<=tokens.length;L++){
      const win=tokens.slice(s,s+L);
      if(win.every(t=>/^\d+$/.test(t.raw) || NUMW[t.w]!==undefined)) continue;
      if(STOP.has(win[0].w) && win[0].w.length<=4) continue;
      const joined=win.map(t=>t.m).join('');
      const digits=win.filter(t=>/^\d+$/.test(t.raw)).map(t=>t.raw).join('|');
      for(const a of index){
        if(Math.abs(a.n-L)>1) continue;
        if(a.digits && digits && a.digits!==digits) continue;
        if(!a.digits && digits) continue;
        const d=lev(joined,a.joined); const score=1-d/Math.max(joined.length,a.joined.length);
        const min = a.joined.length<=4 ? 0.8 : 0.74;
        if(score>=min) cands.push({id:a.id,s,e:s+L,score,len:a.joined.length});
      }
    }
  }
  cands.sort((x,y)=> y.score-x.score || y.len-x.len || (y.e-y.s)-(x.e-x.s));
  const taken=new Array(tokens.length).fill(false); const used=new Set(); const out=[];
  for(const c of cands){
    if(used.has(c.id)) continue;
    let free=true; for(let k=c.s;k<c.e;k++) if(taken[k]) free=false;
    if(!free) continue;
    for(let k=c.s;k<c.e;k++){ taken[k]=true; tokens[k].kind='med'; }
    used.add(c.id); out.push(c);
  }
  return out.sort((a,b)=>a.s-b.s);
}

/* ---------- Numbers ---------- */
function findNumbers(tokens){
  const groups=[];
  for(let i=0;i<tokens.length;i++){
    const t=tokens[i]; if(t.kind) continue;
    if(/^\d+$/.test(t.raw)){ t.kind='num'; groups.push({s:i,e:i+1,val:parseInt(t.raw,10)}); continue; }
    const v=NUMW[t.w]; if(v===undefined) continue;
    if(AMBIG_NUM.has(t.w)){
      const nx=tokens[i+1]; const ok = nx && (UNIT_PACK.has(nx.w)||UNIT_UNIT.has(nx.w)||AGE_AFTER.has(nx.w));
      if(!ok) continue;
    }
    let cur=v, j=i+1;
    while(j<tokens.length && !tokens[j].kind){
      const nv=NUMW[tokens[j].w]; if(nv===undefined) break;
      if(HUNDRED.has(tokens[j].w)){ cur=(cur||1)*100; j++; continue; }
      if(cur>=100 && cur%100===0 && nv<100){ cur+=nv; j++; continue; }
      if(cur>=20 && cur<100 && cur%10===0 && nv>0 && nv<10){ cur+=nv; j++; continue; }
      break;
    }
    for(let k=i;k<j;k++) tokens[k].kind='num';
    groups.push({s:i,e:j,val:cur});
    i=j-1;
  }
  groups.forEach(g=>{
    const nx=tokens[g.e], pv=tokens[g.s-1];
    const nx2=tokens[g.e+1];
    if(nx && UNIT_PACK.has(nx.w)){ g.unit='pack'; nx.kind='unit'; }
    else if(nx && UNIT_UNIT.has(nx.w)){ g.unit='unit'; nx.kind='unit'; }
    else if(nx && ['ki','ke','ka','chi','che','cha'].includes(nx.w) && nx2 && (UNIT_PACK.has(nx2.w)||UNIT_UNIT.has(nx2.w))){ g.unit=UNIT_PACK.has(nx2.w)?'pack':'unit'; nx2.kind='unit'; }
    if(nx && AGE_AFTER.has(nx.w) && !g.unit){ g.age=true; nx.kind='ageword'; }
    if(pv && AGE_BEFORE.has(pv.w) && pv.kind!=='med' && !g.unit){ g.age=true; pv.kind='ageword'; }
  });
  return groups;
}

/* ---------- Main parse ---------- */
function parseCommand(text, inv, index, opts={}){
  const script=scriptOf(text);
  const tokens=tokenize(text);
  const res={text, script, tokens, intent:'unknown', items:[], patient:{name:'',age:null}, notes:[]};
  if(!tokens.length) return res;
  const ws=new Set(tokens.map(t=>t.w));

  if(opts.pending && tokens.length<=5){
    const yes=tokens.some(t=>YES_W.has(t.w)), no=tokens.some(t=>NO_W.has(t.w));
    if(no && !yes){ res.intent='cancel'; return res; }
    if(yes){ res.intent='confirm'; return res; }
  }

  const meds=matchMeds(tokens,index);
  const nums=findNumbers(tokens);

  let ageGroup=nums.find(g=>g.age && g.val>0 && g.val<=120);
  const strong=nums.filter(g=>!g.age && g.unit);
  const weak=nums.filter(g=>!g.age && !g.unit);

  const takenQ=new Set();
  const qty={};
  if(meds.length && strong.length===meds.length){
    meds.forEach((m,k)=>{ qty[m.id]=strong[k]; takenQ.add(strong[k]); });
  } else {
    const assign=(pool)=>meds.forEach(m=>{
      if(qty[m.id]) return;
      let best=null,bd=1e9;
      pool.forEach(g=>{ if(takenQ.has(g)) return;
        const d = g.s>=m.e ? g.s-m.e : (m.s-g.e)+0.5;
        if(d<bd){bd=d;best=g;} });
      if(best && bd<=6){ qty[m.id]=best; takenQ.add(best); }
    });
    assign(strong); assign(weak);
  }
  if(!ageGroup){
    const left=weak.filter(g=>!takenQ.has(g) && g.val>0 && g.val<=110);
    if(left.length){ ageGroup=left[0]; }
  }
  if(ageGroup){ res.patient.age=ageGroup.val; for(let k=ageGroup.s;k<ageGroup.e;k++) tokens[k].kind='num'; }

  res.items=meds.map(m=>{
    const g=qty[m.id];
    return {id:m.id, qty:g?g.val:1, unit:g&&g.unit?g.unit:'pack', assumedQty:!g, heard:tokens.slice(m.s,m.e).map(t=>t.raw).join(' ')};
  });

  // Intent
  const hasAdd=tokens.some(t=>ADD_W.has(t.w) && t.kind!=='med');
  const hasStock=tokens.some(t=>STOCK_W.has(t.w) && t.kind!=='med') || (ws.has('hai')&&ws.has('kya')) || (ws.has('ahe')&&ws.has('ka'));
  const hasBill=tokens.some(t=>BILL_W.has(t.w) && t.kind!=='med');

  // Patient name
  const isCand=t=>!t.kind && !STOP.has(t.w) && /^[a-z]+$/i.test(t.raw) && t.raw.length>=2 && NUMW[t.w]===undefined && !UNIT_PACK.has(t.w) && !UNIT_UNIT.has(t.w) && !AGE_AFTER.has(t.w) && !YES_W.has(t.w);
  let nameToks=null;
  for(let i=0;i<tokens.length && !nameToks;i++){
    const t=tokens[i]; if(t.kind) continue;
    if(MARK_BEFORE.has(t.w) && tokens[i+1] && isCand(tokens[i+1])){
      nameToks=[tokens[i+1]]; if(tokens[i+2]&&isCand(tokens[i+2])) nameToks.push(tokens[i+2]);
    } else if(MARK_AFTER.has(t.w) && i>0){
      let k=i-1; if(tokens[k] && tokens[k].w==='ke') k--;
      const arr=[]; while(k>=0 && isCand(tokens[k]) && arr.length<2){ arr.unshift(tokens[k]); k--; }
      if(arr.length) nameToks=arr;
    }
  }
  if(!nameToks){
    const first=tokens.findIndex(isCand);
    if(first>=0){ nameToks=[tokens[first]]; if(tokens[first+1]&&isCand(tokens[first+1])) nameToks.push(tokens[first+1]); }
  }
  if(nameToks){
    let raw=nameToks.map(t=>t.raw).join(' ');
    const sfx = script==='knda' ? /(avarige|ge)$/i : script==='telu' ? /(gariki|kosam|ki|ku)$/i : /(sathi|saathi)$/i;
    const parts=raw.split(' '); const last=parts.pop(); const stripped=last.replace(sfx,'');
    raw=[...parts, stripped.length>=3?stripped:last].join(' ');
    res.patient.name=displayName(raw);
  }

  if(meds.length){
    if(hasAdd) res.intent='restock';
    else if(hasStock && !hasBill && !res.patient.age) { res.intent='stock'; res.patient.name=''; }
    else res.intent='bill';
  }
  if(res.intent==='stock' || res.intent==='restock'){ res.patient={name:'',age:null}; }
  return res;
}

/* ---------- Sample sales history (demo data, clearly marked) ---------- */
function sampleBills(inv, now){
  const T=now||Date.now(), DAY=864e5;
  const names=['Ramesh','Priya','Imran','Lakshmi','Suresh','Anita','Mohan','Kavya','Farhan','Deepa','Rahul','Meena','Arjun','Sunita'];
  // [medicine id, qty packs] baskets; popular items repeat so top sellers are clear
  const baskets=[[['dolo650',2]],[['dolo650',1],['cetzine',1]],[['pan40',2]],[['glycomet500',3]],[['dolo650',3],['electral',4]],[['telma40',1]],[['azithral500',1],['dolo650',1]],[['pand',1]],[['cetzine',2]],[['shelcal500',2]],[['dolo650',2],['pan40',1]],[['glycomet500',2],['amlong5',1]],[['combiflam',1]],[['electral',6]],[['dolo650',1]],[['pan40',1],['digene',1]],[['vicksaction',2]],[['telma40',2]],[['benadryl',1]],[['dolo650',2],['limcee',2]],[['neurobionforte',1]],[['pand',2]],[['glycomet500',1]],[['ecosprin75',3]],[['dolo650',1],['sinarest',1]],[['montairlc',1]],[['pan40',2]],[['cetzine',1],['dolo650',1]]];
  const out=[];
  baskets.forEach((b,i)=>{
    const daysAgo=i<6?0:Math.min(6,1+Math.floor((i-6)/3.7));
    const at=T-daysAgo*DAY-(i%6)*47*60000-(i*13%50)*60000-30*60000;
    const lines=b.filter(([id])=>inv[id]).map(([id,q])=>{ const m=inv[id]; return {id,name:m.name,generic:m.generic,batch:m.batch,expiry:m.expiry,rx:m.rx,units:q*m.pack,qtyLabel:q+' '+m.packName+(q>1?'s':''),rate:m.mrp,amount:+(q*m.mrp).toFixed(2)}; });
    const d=new Date(at), p=n=>String(n).padStart(2,'0');
    out.push({id:'s'+String(i+1).padStart(2,'0'),no:`SSM/26-27/${p(d.getMonth()+1)}${p(d.getDate())}-S${p(i+1)}`,at,patient:{name:names[i%names.length],age:22+(i*7)%50},payment:['Cash','UPI','UPI','Card'][i%4],lines,total:+lines.reduce((a,l)=>a+l.amount,0).toFixed(2),seconds:+(6+(i*37%90)/10).toFixed(1),engine:'Sample',sample:true,transcript:''});
  });
  return out.sort((a,b)=>b.at-a.at);
}

if(typeof module!=='undefined') module.exports={SEED,seedInventory,sampleBills,translit,tokenize,parseCommand,buildIndex,lnorm,mnorm,scriptOf};
