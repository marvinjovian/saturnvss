

/* ============ CONSTANTS ============ */
const LS_KEY='saturnvss_dashboard_v1';
const LS_KEY_OLD='dwi_dashboard_v1';
const TYPE_LIST=['Endorsement','Paid Promote','Affiliate','Campaign','Product Exchange','Other'];
const PLATFORM_LIST=['TikTok','Instagram','YouTube','Shopee','Other'];
const STATUS_LIST=['New','In Progress','Revision','Waiting Upload','Waiting Payment','Completed','Cancelled'];
const PAYMENT_STATUS=['Pending','Invoiced','Paid','Partial','Overdue'];
const INVOICE_STATUS=['Draft','Sent','Paid','Overdue','Cancelled'];
const CHECKLIST=[['brief','Brief received'],['product','Product received'],['content','Content created'],['sent','Sent to brand'],['revision','Revision completed'],['uploaded','Uploaded'],['payment','Payment received']];

/* ============ STATE ============ */
let state=null;
function seedState(){
  const now=new Date();
  const iso=(d)=>d.toISOString().slice(0,10);
  const addDays=(n)=>{const d=new Date(); d.setDate(d.getDate()+n); return iso(d);};
  return {
    profile:{name:'Saturnvss',brandName:'Saturnvss',email:'',whatsapp:'',address:'',bankName:'',accountName:'',accountNumber:'',instagram:'',tiktok:''},
    theme:'light',
    invoiceSeq:{},
    collabs:[
      {id:uid(),brand:'Wardah Beauty',pic:'Kak Nadia',whatsapp:'6281234567890',type:'Endorsement',platform:'TikTok',deadline:addDays(0),fee:1500000,status:'In Progress',notes:'',checklist:{brief:true,product:true,content:false,sent:false,revision:false,uploaded:false,payment:false},timeline:[{date:new Date().toISOString(),text:'Produk diterima.'}],payment:{status:'Pending',invoiceId:null,invoiceNumber:'',invoiceDate:'',dueDate:'',amount:1500000,method:'',paymentDate:'',notes:''},createdAt:new Date().toISOString()},
      {id:uid(),brand:'Somethinc',pic:'Kak Rani',whatsapp:'6281234567891',type:'Paid Promote',platform:'Instagram',deadline:addDays(1),fee:800000,status:'Revision',notes:'',checklist:{brief:true,product:true,content:true,sent:true,revision:false,uploaded:false,payment:false},timeline:[{date:new Date().toISOString(),text:'Brand meminta revisi caption.'}],payment:{status:'Pending',invoiceId:null,invoiceNumber:'',invoiceDate:'',dueDate:'',amount:800000,method:'',paymentDate:'',notes:''},createdAt:new Date().toISOString()},
      {id:uid(),brand:'Brand XYZ',pic:'Kak Sarah',whatsapp:'6281234567892',type:'Campaign',platform:'TikTok',deadline:addDays(3),fee:2000000,status:'New',notes:'',checklist:{brief:false,product:false,content:false,sent:false,revision:false,uploaded:false,payment:false},timeline:[],payment:{status:'Pending',invoiceId:null,invoiceNumber:'',invoiceDate:'',dueDate:'',amount:2000000,method:'',paymentDate:'',notes:''},createdAt:new Date().toISOString()},
      {id:uid(),brand:'Scarlett Whitening',pic:'Kak Dini',whatsapp:'6281234567893',type:'Affiliate',platform:'Shopee',deadline:addDays(-2),fee:500000,status:'Completed',notes:'',checklist:{brief:true,product:true,content:true,sent:true,revision:true,uploaded:true,payment:true},timeline:[{date:new Date().toISOString(),text:'Konten sudah tayang, payment diterima.'}],payment:{status:'Paid',invoiceId:null,invoiceNumber:'',invoiceDate:'',dueDate:'',amount:500000,method:'Transfer Bank',paymentDate:addDays(-1),notes:''},createdAt:new Date().toISOString()}
    ],
    invoices:[]
  };
}
function load(){
  try{
    let raw=localStorage.getItem(LS_KEY);
    if(!raw){ raw=localStorage.getItem(LS_KEY_OLD); } // migrate from earlier version's storage key
    state=raw?JSON.parse(raw):seedState();
  }catch(e){state=seedState();}
  if(!state.invoiceSeq)state.invoiceSeq={};
  if(state.profile && (state.profile.name==='Dwi Lestari')) state.profile.name='Saturnvss';
  if(state.profile && (state.profile.brandName==='Dwi Lestari')) state.profile.brandName='Saturnvss';
  save();
}
function save(){ localStorage.setItem(LS_KEY,JSON.stringify(state)); }

/* ============ UTILS ============ */
function uid(){return 'id'+Date.now().toString(36)+Math.random().toString(36).slice(2,8);}
function rp(n){ n=Number(n)||0; return 'Rp'+n.toLocaleString('id-ID');}
function fmtDate(s){ if(!s)return '-'; const d=new Date(s+ (s.length===10?'T00:00:00':'')); if(isNaN(d))return s; return d.toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'}); }
function fmtDateShort(s){ if(!s)return '-'; const d=new Date(s+ (s.length===10?'T00:00:00':'')); if(isNaN(d))return s; return d.toLocaleDateString('id-ID',{day:'numeric',month:'short'}); }
function todayISO(){return new Date().toISOString().slice(0,10);}
function daysUntil(dateStr){
  if(!dateStr)return null;
  const d=new Date(dateStr+'T00:00:00'); const t=new Date(); t.setHours(0,0,0,0);
  return Math.round((d-t)/86400000);
}
function esc(s){ return (s==null?'':String(s)).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function toast(msg){
  const t=document.getElementById('toast'); t.textContent=msg; t.classList.add('show');
  clearTimeout(window._toastTimer); window._toastTimer=setTimeout(()=>t.classList.remove('show'),2200);
}
function icons(){ if(window.lucide) lucide.createIcons(); }

function collabDeadlineState(c){
  if(c.status==='Completed'||c.status==='Cancelled')return null;
  const du=daysUntil(c.deadline);
  if(du<0)return 'overdue';
  if(du===0)return 'today';
  if(du<=3)return 'soon';
  return 'normal';
}
function deadlineBadge(c){
  const s=collabDeadlineState(c);
  if(!s)return '';
  const du=daysUntil(c.deadline);
  if(s==='overdue')return `<span class="badge badge-overdue"><i data-lucide="alert-circle" style="width:11px;height:11px"></i> OVERDUE</span>`;
  if(s==='today')return `<span class="badge badge-today">Today</span>`;
  if(s==='soon')return `<span class="badge badge-peach">${du} hari lagi</span>`;
  return `<span class="badge badge-pink">${fmtDateShort(c.deadline)}</span>`;
}
function paymentBadge(c){
  const st=c.payment.status;
  const map={Pending:'badge-muted',Invoiced:'badge-peach',Paid:'badge-success',Partial:'badge-peach',Overdue:'badge-overdue'};
  return `<span class="badge ${map[st]||'badge-muted'}">${st==='Pending'&&c.status==='Completed'?'PAYMENT PENDING':st}</span>`;
}
function statusBadge(status){
  const map={New:'badge-pink','In Progress':'badge-peach',Revision:'badge-peach','Waiting Upload':'badge-peach','Waiting Payment':'badge-today',Completed:'badge-success',Cancelled:'badge-muted'};
  return `<span class="badge ${map[status]||'badge-pink'}">${status}</span>`;
}
function progressPct(c){
  const keys=CHECKLIST.map(x=>x[0]);
  const done=keys.filter(k=>c.checklist[k]).length;
  return Math.round(done/keys.length*100);
}

/* ============ ROUTER ============ */
let route={view:'dashboard',params:{}};
function nav(view,params={}){
  route={view,params};
  location.hash='#'+view+(params.id?'/'+params.id:'');
  render();
  window.scrollTo(0,0);
}
window.addEventListener('hashchange',()=>{
  const h=location.hash.replace('#','');
  const [view,id]=h.split('/');
  route={view:view||'dashboard',params:id?{id}:{}};
  render();
});

/* ============ SHELL ============ */
const NAV_ITEMS=[
  {v:'dashboard',label:'Dashboard',icon:'layout-dashboard'},
  {v:'collaborations',label:'Collaborations',icon:'heart-handshake'},
  {v:'calendar',label:'Calendar',icon:'calendar-days'},
  {v:'invoices',label:'Invoices',icon:'file-text'},
  {v:'payments',label:'Payments',icon:'wallet'},
  {v:'history',label:'History',icon:'history'},
  {v:'analytics',label:'Analytics',icon:'bar-chart-3'},
];
const BOTTOM_NAV=[
  {v:'dashboard',label:'Home',icon:'home'},
  {v:'collaborations',label:'Collab',icon:'heart-handshake'},
  {v:'calendar',label:'Calendar',icon:'calendar-days'},
  {v:'history',label:'History',icon:'history'},
  {v:'more',label:'More',icon:'menu'},
];

function shellHTML(inner){
  const active=route.view;
  return `
  <svg class="lily-watermark" viewBox="0 0 200 200" fill="none"><path d="M100 20 C 60 40, 60 100, 100 180 C140 100, 140 40, 100 20 Z" fill="currentColor"/><path d="M20 100 C 40 60, 100 60, 180 100 C100 140, 40 140, 20 100 Z" fill="currentColor" opacity=".6"/></svg>
  <div class="shell">
    <aside class="sidebar">
      <div class="sidebar-brand">
        <div class="flower">🌸</div>
        <div><div class="name">${esc(state.profile.name||'Saturnvss')}</div><div class="role">Creator Dashboard</div></div>
      </div>
      <div class="nav-group">
        ${NAV_ITEMS.map(n=>`<button class="nav-item ${active===n.v?'active':''}" data-nav="${n.v}"><i data-lucide="${n.icon}"></i>${n.label}</button>`).join('')}
      </div>
      <div class="sidebar-footer">
        <button class="nav-item ${active==='settings'?'active':''}" data-nav="settings"><i data-lucide="settings"></i>Settings</button>
        <button class="nav-item" data-action="backup"><i data-lucide="database"></i>Backup Data</button>
      </div>
    </aside>
    <div class="main">
      <div class="topbar">
        <div class="topbar-greeting">
          <h1>${topbarTitle()}</h1>
          <p>${topbarSubtitle()}</p>
        </div>
        <div class="topbar-actions">
          <button class="icon-btn" data-action="search"><i data-lucide="search"></i></button>
          <button class="icon-btn" data-action="notif"><span class="dot"></span><i data-lucide="bell"></i></button>
          <div class="avatar" data-nav="settings">${(state.profile.name||'D').trim().charAt(0).toUpperCase()}</div>
        </div>
      </div>
      <div class="container" id="view-root">${inner}</div>
    </div>
  </div>
  <div class="bottom-nav">
    ${BOTTOM_NAV.map(n=>`<button class="bnav-item ${active===n.v?'active':''}" data-nav="${n.v==='more'?'more':n.v}"><i data-lucide="${n.icon}"></i>${n.label}</button>`).join('')}
  </div>
  <button class="fab" data-action="add-collab"><i data-lucide="plus"></i></button>
  `;
}
function topbarTitle(){
  const t={dashboard:'Good '+(new Date().getHours()<12?'morning':new Date().getHours()<18?'afternoon':'evening')+', '+ (state.profile.name||'Saturnvss').split(' ')[0]+' 🌸',
  collaborations:'Collaborations',calendar:'Calendar',invoices:'Invoices',payments:'Payments',history:'History',analytics:'Analytics',settings:'Settings',
  'collab-detail':'Collaboration','invoice-create':'Create Invoice','invoice-detail':'Invoice'};
  return t[route.view]||'Saturnvss';
}
function topbarSubtitle(){
  const t={dashboard:"Let's keep your collaborations organized.",collaborations:'Semua kerja sama dalam satu tempat.',calendar:'Deadline, upload, dan jadwal pembayaran.',
  invoices:'Buat dan kelola invoice profesional.',payments:'Pantau status pembayaran setiap kerja sama.',history:'Kerja sama yang sudah selesai.',analytics:'Ringkasan performa kerja sama.',
  settings:'Profil invoice & preferensi aplikasi.'};
  return t[route.view]||'';
}

/* ============ MAIN RENDER ============ */
function render(){
  let inner='';
  if(route.view==='dashboard')inner=viewDashboard();
  else if(route.view==='collaborations')inner=viewCollaborations();
  else if(route.view==='collab-detail')inner=viewCollabDetail(route.params.id);
  else if(route.view==='calendar')inner=viewCalendar();
  else if(route.view==='invoices')inner=viewInvoices();
  else if(route.view==='invoice-create')inner=viewInvoiceCreate(route.params.id);
  else if(route.view==='invoice-detail')inner=viewInvoiceDetail(route.params.id);
  else if(route.view==='payments')inner=viewPayments();
  else if(route.view==='history')inner=viewHistory();
  else if(route.view==='analytics')inner=viewAnalytics();
  else if(route.view==='settings')inner=viewSettings();
  else if(route.view==='more')inner=viewMore();
  else inner=viewDashboard();
  document.getElementById('app').innerHTML=shellHTML(inner);
  icons();
  afterRender();
}
function afterRender(){
  if(route.view==='analytics') drawCharts();
}

/* ============ VIEW: DASHBOARD ============ */
function viewDashboard(){
  const cs=state.collabs;
  const active=cs.filter(c=>!['Completed','Cancelled'].includes(c.status));
  const soon=cs.filter(c=>{const s=collabDeadlineState(c); return s==='soon'||s==='today'||s==='overdue';});
  const completed=cs.filter(c=>c.status==='Completed');
  const pendingPay=cs.filter(c=>c.payment.status!=='Paid'&&c.status!=='Cancelled');
  const earnings=cs.filter(c=>c.payment.status==='Paid').reduce((s,c)=>s+Number(c.fee||0),0);

  const stats=[
    ['heart-handshake',cs.length,'Total Collaboration'],
    ['zap',active.length,'Active'],
    ['clock',soon.length,'Deadline Soon'],
    ['check-circle-2',completed.length,'Completed'],
    ['banknote',pendingPay.length,'Pending Payment'],
    ['sparkles',rp(earnings),'Total Earnings'],
  ];
  const attention=cs.filter(c=>{
    if(c.status==='Cancelled')return false;
    const s=collabDeadlineState(c);
    return s==='overdue'||s==='today'||s==='soon'||c.status==='Revision'||c.status==='Waiting Upload'||(c.status==='Completed'&&c.payment.status!=='Paid');
  }).sort((a,b)=>daysUntil(a.deadline)-daysUntil(b.deadline));

  const upcoming=cs.filter(c=>!['Completed','Cancelled'].includes(c.status)).sort((a,b)=>new Date(a.deadline)-new Date(b.deadline)).slice(0,6);

  return `
  <div class="stat-grid">
    ${stats.map(s=>`<div class="card stat-card"><div class="top"><div class="icon-wrap"><i data-lucide="${s[0]}"></i></div></div><div class="value">${s[1]}</div><div class="label">${s[2]}</div></div>`).join('')}
  </div>

  <div class="section">
    <div class="section-head"><h2><i data-lucide="alert-circle" style="width:16px;height:16px;color:var(--overdue)"></i> Needs Attention</h2></div>
    ${attention.length===0?`<div class="card"><div class="empty-state" style="padding:34px 20px;"><i data-lucide="check-circle-2"></i><div class="t1">All caught up 🌸</div><div class="t2">Tidak ada yang butuh perhatian sekarang.</div></div></div>`:
      attention.slice(0,6).map(c=>attnCard(c)).join('')}
  </div>

  <div class="section">
    <div class="section-head"><h2><i data-lucide="calendar-clock" style="width:16px;height:16px"></i> Upcoming Deadlines</h2><a class="link" data-nav="calendar">View calendar</a></div>
    <div class="card" style="padding:6px 4px;">
      ${upcoming.length===0?`<div class="empty-state" style="padding:30px 20px;"><i data-lucide="calendar"></i><div class="t1">No deadlines yet</div></div>`:
      upcoming.map(c=>{
        const du=daysUntil(c.deadline); let tag=fmtDateShort(c.deadline);
        if(du===0)tag='Today'; else if(du===1)tag='Tomorrow'; else if(du<0)tag='Overdue';
        return `<div class="attn-card" style="border:none; border-bottom:1px solid var(--border); border-radius:0; margin-bottom:0; cursor:pointer;" data-nav="collab-detail" data-id="${c.id}">
          <div class="stripe" style="background:${du<0?'var(--overdue)':du===0?'var(--today)':du<=3?'var(--peach)':'var(--primary)'}"></div>
          <div class="body"><div class="brand">${esc(c.brand)}</div><div class="meta">${esc(c.type)} • ${tag}</div></div>
          ${statusBadge(c.status)}
        </div>`;
      }).join('')}
    </div>
  </div>
  `;
}
function attnCard(c){
  const s=collabDeadlineState(c);
  const stripe=s==='overdue'?'var(--overdue)':s==='today'?'var(--today)':s==='soon'?'var(--peach)':'var(--primary)';
  let reason=deadlineBadge(c);
  if(c.status==='Revision')reason=`<span class="badge badge-peach">Waiting revision</span>`;
  if(c.status==='Waiting Upload')reason=`<span class="badge badge-peach">Waiting upload</span>`;
  if(c.status==='Completed'&&c.payment.status!=='Paid')reason=`<span class="badge badge-overdue">Payment pending</span>`;
  return `<div class="attn-card">
    <div class="stripe" style="background:${stripe}"></div>
    <div class="body">
      <div class="brand">${esc(c.brand)}</div>
      <div class="meta">${esc(c.type)} • ${esc(c.platform)}</div>
      <div style="margin-top:6px;">${reason}</div>
      <div class="fee">${rp(c.fee)}</div>
    </div>
    <button class="go" data-nav="collab-detail" data-id="${c.id}">View</button>
  </div>`;
}

/* ============ VIEW: COLLABORATIONS ============ */
let collabFilter={status:'All',search:'',platform:'',type:'',sort:'deadline'};
function viewCollaborations(){
  let list=[...state.collabs];
  const f=collabFilter;
  if(f.status==='Active')list=list.filter(c=>!['Completed','Cancelled'].includes(c.status));
  else if(f.status==='Deadline Soon')list=list.filter(c=>['soon','today','overdue'].includes(collabDeadlineState(c)));
  else if(f.status==='Waiting Payment')list=list.filter(c=>c.payment.status!=='Paid'&&!['Cancelled'].includes(c.status));
  else if(f.status==='Completed')list=list.filter(c=>c.status==='Completed');
  else if(f.status==='Cancelled')list=list.filter(c=>c.status==='Cancelled');
  if(f.platform)list=list.filter(c=>c.platform===f.platform);
  if(f.type)list=list.filter(c=>c.type===f.type);
  if(f.search)list=list.filter(c=>(c.brand+c.pic+c.notes).toLowerCase().includes(f.search.toLowerCase()));
  if(f.sort==='deadline')list.sort((a,b)=>new Date(a.deadline)-new Date(b.deadline));
  else list.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));

  const chips=['All','Active','Deadline Soon','Waiting Payment','Completed','Cancelled'];
  return `
  <div class="filter-row">${chips.map(c=>`<button class="chip ${f.status===c?'active':''}" data-filter-status="${c}">${c}</button>`).join('')}</div>
  <div class="search-box"><i data-lucide="search"></i><input id="collab-search" placeholder="Cari brand, PIC, catatan..." value="${esc(f.search)}"></div>
  <div class="select-row">
    <select id="filter-platform"><option value="">All Platforms</option>${PLATFORM_LIST.map(p=>`<option ${f.platform===p?'selected':''}>${p}</option>`).join('')}</select>
    <select id="filter-type"><option value="">All Types</option>${TYPE_LIST.map(p=>`<option ${f.type===p?'selected':''}>${p}</option>`).join('')}</select>
    <select id="filter-sort"><option value="deadline" ${f.sort==='deadline'?'selected':''}>Sort: Deadline</option><option value="latest" ${f.sort==='latest'?'selected':''}>Sort: Latest</option></select>
  </div>

  ${list.length===0?`<div class="card"><div class="empty-state">
      <svg viewBox="0 0 100 100" fill="none"><path d="M50 10 C 30 20, 30 50, 50 90 C70 50, 70 20, 50 10 Z" stroke="currentColor" stroke-width="4"/></svg>
      <div class="t1">No collaborations yet 🌸</div><div class="t2">Your next collaboration starts here.</div>
      <button class="btn btn-primary btn-sm t1-btn" style="margin-top:14px" data-action="add-collab"><i data-lucide="plus"></i>Add Collaboration</button>
    </div></div>`:`
  <div class="collab-list mobile-only">
    ${list.map(c=>collabCard(c)).join('')}
  </div>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Brand</th><th>Type</th><th>Platform</th><th>Deadline</th><th>Fee</th><th>Status</th><th>Payment</th><th></th></tr></thead>
      <tbody>
        ${list.map(c=>`<tr style="cursor:pointer" data-nav="collab-detail" data-id="${c.id}">
          <td><strong>${esc(c.brand)}</strong></td><td>${esc(c.type)}</td><td>${esc(c.platform)}</td>
          <td>${deadlineBadge(c)||fmtDateShort(c.deadline)}</td><td class="fee">${rp(c.fee)}</td>
          <td>${statusBadge(c.status)}</td><td>${paymentBadge(c)}</td>
          <td><button class="btn btn-ghost btn-sm" data-nav="collab-detail" data-id="${c.id}">View</button></td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>`}
  `;
}
function collabCard(c){
  return `<div class="card collab-card" data-nav="collab-detail" data-id="${c.id}">
    <div class="row1"><div><div class="brand">${esc(c.brand)}</div><div class="type">${esc(c.type)} • ${esc(c.platform)}</div></div>${statusBadge(c.status)}</div>
    <div class="grid">
      <div><div class="k">Deadline</div><div class="v">${deadlineBadge(c)||fmtDateShort(c.deadline)}</div></div>
      <div><div class="k">Fee</div><div class="v">${rp(c.fee)}</div></div>
      <div><div class="k">Payment</div><div class="v">${paymentBadge(c)}</div></div>
    </div>
    <div class="actions"><button class="btn btn-ghost btn-sm btn-block" data-nav="collab-detail" data-id="${c.id}">View Details</button></div>
  </div>`;
}

/* ============ VIEW: COLLAB DETAIL ============ */
function viewCollabDetail(id){
  const c=state.collabs.find(x=>x.id===id);
  if(!c)return `<div class="empty-state"><div class="t1">Collaboration not found</div></div>`;
  const pct=progressPct(c);
  const relatedInvoice=state.invoices.find(i=>i.id===c.payment.invoiceId);
  return `
  <button class="btn btn-ghost btn-sm" data-nav="collaborations" style="margin-bottom:14px;"><i data-lucide="chevron-left"></i>Back</button>
  <div class="card" style="padding:20px;">
    <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:10px;">
      <div>
        <h2 class="serif" style="font-size:21px; font-weight:700;">${esc(c.brand)}</h2>
        <div style="margin-top:6px; display:flex; gap:8px; flex-wrap:wrap;">${statusBadge(c.status)} ${deadlineBadge(c)} ${paymentBadge(c)}</div>
      </div>
      <div style="display:flex; gap:6px;">
        <button class="icon-btn" data-action="edit-collab" data-id="${c.id}"><i data-lucide="edit-3"></i></button>
        <button class="icon-btn" data-action="delete-collab" data-id="${c.id}"><i data-lucide="trash-2"></i></button>
      </div>
    </div>
    <div style="display:flex; justify-content:space-between; margin-top:16px; padding-top:16px; border-top:1px solid var(--border);">
      <div><div style="font-size:10.5px;color:var(--muted);text-transform:uppercase;">Deadline</div><div style="font-weight:600;margin-top:3px;">${fmtDate(c.deadline)}</div></div>
      <div style="text-align:right;"><div style="font-size:10.5px;color:var(--muted);text-transform:uppercase;">Fee</div><div style="font-weight:700;color:var(--primary-dark);margin-top:3px;">${rp(c.fee)}</div></div>
    </div>
  </div>

  <div class="two-col">
  <div>
  <div class="section">
    <div class="section-head"><h2>Collaboration Information</h2></div>
    <div class="card" style="padding:16px 18px;">
      ${infoRow('Brand',c.brand)}${infoRow('PIC',c.pic||'-')}
      <div style="display:flex; align-items:center; justify-content:space-between; padding:9px 0;">
        <div><div style="font-size:11px;color:var(--muted);">WhatsApp</div><div style="font-size:13.5px;font-weight:600;margin-top:2px;">${esc(c.whatsapp||'-')}</div></div>
        ${c.whatsapp?`<a class="btn btn-sm" style="background:#DCF8C6;color:#2b5c1f;" href="https://wa.me/${c.whatsapp.replace(/[^0-9]/g,'')}" target="_blank"><i data-lucide="message-circle"></i>Chat</a>`:''}
      </div>
      ${infoRow('Platform',c.platform)}${infoRow('Type',c.type)}${infoRow('Deadline',fmtDate(c.deadline))}${infoRow('Fee',rp(c.fee))}
      ${c.notes?infoRow('Notes',c.notes):''}
    </div>
  </div>

  <div class="section">
    <div class="section-head"><h2>Progress</h2><span style="font-size:12.5px;font-weight:700;color:var(--primary-dark)">${pct}% Complete</span></div>
    <div class="card" style="padding:16px 18px;">
      <div class="progress-bar"><div class="fill" style="width:${pct}%"></div></div>
      <div class="checklist">
        ${CHECKLIST.map(([k,label])=>`<label class="check-item ${c.checklist[k]?'done':''}"><input type="checkbox" data-check="${k}" data-id="${c.id}" ${c.checklist[k]?'checked':''}><span>${label}</span></label>`).join('')}
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-head"><h2>Notes & History</h2></div>
    <div class="card" style="padding:16px 18px;">
      <div class="field" style="margin-bottom:10px;"><div class="field-with-btn"><input id="new-note" placeholder="Tambah catatan baru..."><button class="btn btn-primary btn-sm" data-action="add-note" data-id="${c.id}">Add</button></div></div>
      <div class="timeline">
        ${c.timeline.length===0?'<p style="font-size:12.5px;color:var(--muted)">Belum ada catatan.</p>':
        [...c.timeline].reverse().map(t=>`<div class="tl-item"><div class="tl-dot"></div><div class="body"><div class="date">${new Date(t.date).toLocaleString('id-ID',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</div><div class="text">${esc(t.text)}</div></div></div>`).join('')}
      </div>
    </div>
  </div>
  </div>

  <div>
  <div class="section" style="margin-top:0;">
    <div class="section-head"><h2>Payment</h2></div>
    <div class="card" style="padding:16px 18px;">
      <div class="field"><label>Status</label><select data-payfield="status" data-id="${c.id}">${PAYMENT_STATUS.map(s=>`<option ${c.payment.status===s?'selected':''}>${s}</option>`).join('')}</select></div>
      <div class="field-row">
        <div class="field"><label>Invoice #</label><input value="${esc(c.payment.invoiceNumber||'')}" disabled placeholder="-"></div>
        <div class="field"><label>Due Date</label><input type="date" data-payfield="dueDate" data-id="${c.id}" value="${c.payment.dueDate||''}"></div>
      </div>
      <div class="field"><label>Amount</label><input type="number" data-payfield="amount" data-id="${c.id}" value="${c.payment.amount||c.fee}"></div>
      <div class="field-row">
        <div class="field"><label>Method</label><input data-payfield="method" data-id="${c.id}" value="${esc(c.payment.method||'')}" placeholder="Transfer Bank"></div>
        <div class="field"><label>Payment Date</label><input type="date" data-payfield="paymentDate" data-id="${c.id}" value="${c.payment.paymentDate||''}"></div>
      </div>
      <button class="btn btn-primary btn-block" data-action="mark-paid" data-id="${c.id}"><i data-lucide="check"></i>Mark as Paid</button>
      <div style="margin-top:10px;">
      ${relatedInvoice?`<button class="btn btn-ghost btn-block" data-nav="invoice-detail" data-id="${relatedInvoice.id}"><i data-lucide="file-text"></i>Invoice Created — ${relatedInvoice.number}</button>`:
      `<button class="btn btn-primary btn-block" data-action="create-invoice-from" data-id="${c.id}"><i data-lucide="receipt"></i>Create Invoice</button>`}
      </div>
    </div>
  </div>
  </div>
  </div>
  `;
}
function infoRow(k,v){return `<div style="display:flex;justify-content:space-between;gap:10px;padding:9px 0;border-bottom:1px solid var(--border);"><span style="font-size:12px;color:var(--muted)">${k}</span><span style="font-size:13.5px;font-weight:600;text-align:right;">${esc(v)}</span></div>`;}

/* ============ VIEW: CALENDAR ============ */
let calCursor=new Date();
function viewCalendar(){
  const y=calCursor.getFullYear(), m=calCursor.getMonth();
  const first=new Date(y,m,1); const startDow=first.getDay();
  const daysInMonth=new Date(y,m+1,0).getDate();
  const prevDays=new Date(y,m,0).getDate();
  const cells=[];
  for(let i=startDow-1;i>=0;i--)cells.push({d:prevDays-i,other:true});
  for(let i=1;i<=daysInMonth;i++)cells.push({d:i,other:false,iso:`${y}-${String(m+1).padStart(2,'0')}-${String(i).padStart(2,'0')}`});
  while(cells.length%7!==0)cells.push({d:cells.length,other:true});
  const todayIso=todayISO();
  const eventsByDay={};
  state.collabs.forEach(c=>{
    if(!eventsByDay[c.deadline])eventsByDay[c.deadline]=[];
    eventsByDay[c.deadline].push({c,color:collabDeadlineState(c)==='overdue'?'var(--overdue)':collabDeadlineState(c)==='today'?'var(--today)':'var(--primary)'});
    if(c.payment.dueDate){ if(!eventsByDay[c.payment.dueDate])eventsByDay[c.payment.dueDate]=[]; eventsByDay[c.payment.dueDate].push({c,color:'var(--peach)',label:'Payment Due'}); }
  });
  const monthLabel=calCursor.toLocaleDateString('id-ID',{month:'long',year:'numeric'});
  const dows=['Min','Sen','Sel','Rab','Kam','Jum','Sab'];

  const selDayEvents=(route.params.day&&eventsByDay[route.params.day])||[];
  return `
  <div class="card" style="padding:16px;">
    <div class="cal-head">
      <h3>${monthLabel}</h3>
      <div class="cal-nav">
        <button class="icon-btn" data-action="cal-prev"><i data-lucide="chevron-left"></i></button>
        <button class="icon-btn" data-action="cal-next"><i data-lucide="chevron-right"></i></button>
      </div>
    </div>
    <div class="cal-grid">
      ${dows.map(d=>`<div class="cal-dow">${d}</div>`).join('')}
      ${cells.map(c=>{
        const isToday=c.iso===todayIso;
        const evs=c.iso?(eventsByDay[c.iso]||[]):[];
        return `<div class="cal-day ${c.other?'other':''} ${isToday?'today':''}" ${c.iso?`data-action="cal-day" data-day="${c.iso}"`:''} style="cursor:${c.iso?'pointer':'default'}">
          <div class="num">${c.d}</div>
          <div class="dots">${evs.slice(0,3).map(e=>`<span class="dot" style="background:${e.color}"></span>`).join('')}</div>
        </div>`;
      }).join('')}
    </div>
    <div class="cal-legend">
      <span><i style="background:var(--primary)"></i>Deadline</span>
      <span><i style="background:var(--today)"></i>Today</span>
      <span><i style="background:var(--overdue)"></i>Overdue</span>
      <span><i style="background:var(--peach)"></i>Payment Due</span>
    </div>
  </div>
  ${route.params.day?`
  <div class="section">
    <div class="section-head"><h2>${fmtDate(route.params.day)}</h2></div>
    ${selDayEvents.length===0?`<div class="card"><div class="empty-state" style="padding:26px;"><i data-lucide="calendar-x"></i><div class="t2">Tidak ada jadwal di tanggal ini.</div></div></div>`:
    selDayEvents.map(e=>`<div class="attn-card" data-nav="collab-detail" data-id="${e.c.id}" style="cursor:pointer;"><div class="stripe" style="background:${e.color}"></div><div class="body"><div class="brand">${esc(e.c.brand)}</div><div class="meta">${e.label||'Deadline'} • ${esc(e.c.type)}</div></div>${statusBadge(e.c.status)}</div>`).join('')}
  </div>`:''}
  `;
}

/* ============ VIEW: INVOICES ============ */
let invoiceFilter='All';
function viewInvoices(){
  let list=[...state.invoices];
  if(invoiceFilter!=='All')list=list.filter(i=>i.status===invoiceFilter);
  list.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
  return `
  <button class="btn btn-primary" data-action="new-invoice" style="margin-bottom:16px;"><i data-lucide="plus"></i>Create Invoice</button>
  <div class="filter-row">${['All',...INVOICE_STATUS].map(s=>`<button class="chip ${invoiceFilter===s?'active':''}" data-filter-invstatus="${s}">${s}</button>`).join('')}</div>
  <div class="section" style="margin-top:14px;">
  ${list.length===0?`<div class="card"><div class="empty-state">
    <i data-lucide="file-text"></i><div class="t1">No invoices yet</div><div class="t2">Create your first professional invoice.</div>
    <button class="btn btn-primary btn-sm" style="margin-top:14px" data-action="new-invoice"><i data-lucide="plus"></i>Create Invoice</button>
  </div></div>`:`
  <div class="collab-list mobile-only">
    ${list.map(i=>`<div class="card collab-card" data-nav="invoice-detail" data-id="${i.id}">
      <div class="row1"><div><div class="brand">${esc(i.number)}</div><div class="type">${esc(i.brandName)}</div></div>${invStatusBadge(i.status)}</div>
      <div class="grid"><div><div class="k">Date</div><div class="v">${fmtDateShort(i.invoiceDate)}</div></div><div><div class="k">Amount</div><div class="v">${rp(invoiceTotal(i))}</div></div></div>
      <div class="actions"><button class="btn btn-ghost btn-sm btn-block" data-nav="invoice-detail" data-id="${i.id}">View</button></div>
    </div>`).join('')}
  </div>
  <div class="table-wrap">
  <table><thead><tr><th>Invoice</th><th>Brand</th><th>Date</th><th>Due</th><th>Amount</th><th>Status</th><th></th></tr></thead>
  <tbody>${list.map(i=>`<tr style="cursor:pointer" data-nav="invoice-detail" data-id="${i.id}">
    <td><strong>${esc(i.number)}</strong></td><td>${esc(i.brandName)}</td><td>${fmtDateShort(i.invoiceDate)}</td><td>${fmtDateShort(i.dueDate)}</td>
    <td class="fee">${rp(invoiceTotal(i))}</td><td>${invStatusBadge(i.status)}</td>
    <td><button class="btn btn-ghost btn-sm" data-nav="invoice-detail" data-id="${i.id}">View</button></td>
  </tr>`).join('')}</tbody></table>
  </div>`}
  </div>
  `;
}
function invStatusBadge(s){
  const map={Draft:'badge-muted',Sent:'badge-peach',Paid:'badge-success',Overdue:'badge-overdue',Cancelled:'badge-muted'};
  return `<span class="badge ${map[s]}">${s}</span>`;
}
function invoiceTotal(i){ return i.items.reduce((s,it)=>s+Number(it.qty||0)*Number(it.rate||0),0); }
function nextInvoiceNumber(){
  const now=new Date(); const key=`${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}`;
  const seq=(state.invoiceSeq[key]||0)+1;
  return {number:`INV-DWL-${key}-${String(seq).padStart(3,'0')}`,key,seq};
}

/* ============ VIEW: INVOICE CREATE ============ */
let invDraft=null;
function freshInvDraft(collabId){
  const nn=nextInvoiceNumber();
  const c=collabId?state.collabs.find(x=>x.id===collabId):null;
  const due=new Date(); due.setDate(due.getDate()+7);
  return {
    id:uid(), number:nn.number, _seqKey:nn.key,
    collaborationId:c?c.id:null,
    brandName:c?c.brand:'', pic:c?c.pic:'', email:'', whatsapp:c?c.whatsapp:'', address:'',
    invoiceDate:todayISO(), dueDate:due.toISOString().slice(0,10),
    items:[{service:c?(c.type+' — '+c.platform):'', desc:'', qty:1, rate:c?c.fee:0}],
    bank:state.profile.bankName||'', accountName:state.profile.accountName||'', accountNumber:state.profile.accountNumber||'',
    paymentNotes:'Payment due within 7 days.', status:'Draft', createdAt:new Date().toISOString()
  };
}
function viewInvoiceCreate(collabId){
  if(!invDraft || route.params._fresh){ invDraft=freshInvDraft(collabId); }
  const d=invDraft;
  const total=d.items.reduce((s,it)=>s+Number(it.qty||0)*Number(it.rate||0),0);
  return `
  <button class="btn btn-ghost btn-sm" data-action="cancel-invoice" style="margin-bottom:14px;"><i data-lucide="chevron-left"></i>Cancel</button>
  <div class="card" style="padding:20px;">
    <div class="section" style="margin-top:0;">
      <div class="section-head"><h2>1. Client</h2></div>
      <div class="field"><label>Nama Brand</label><input id="inv-brandName" value="${esc(d.brandName)}"></div>
      <div class="field-row">
        <div class="field"><label>Nama PIC</label><input id="inv-pic" value="${esc(d.pic)}"></div>
        <div class="field"><label>WhatsApp</label><input id="inv-whatsapp" value="${esc(d.whatsapp)}"></div>
      </div>
      <div class="field"><label>Email</label><input id="inv-email" value="${esc(d.email)}"></div>
      <div class="field"><label>Alamat</label><textarea id="inv-address">${esc(d.address)}</textarea></div>
    </div>

    <div class="section">
      <div class="section-head"><h2>2. Invoice</h2></div>
      <div class="field"><label>Invoice Number</label><input value="${d.number}" disabled></div>
      <div class="field-row">
        <div class="field"><label>Tanggal Invoice</label><input type="date" id="inv-date" value="${d.invoiceDate}"></div>
        <div class="field"><label>Due Date</label><input type="date" id="inv-due" value="${d.dueDate}"></div>
      </div>
    </div>

    <div class="section">
      <div class="section-head"><h2>3. Service</h2></div>
      <div id="inv-items">
        ${d.items.map((it,idx)=>invItemRow(it,idx)).join('')}
      </div>
      <button class="btn btn-ghost btn-sm" data-action="add-item"><i data-lucide="plus"></i>Add Item</button>
      <div style="margin-top:14px; text-align:right; font-weight:700; font-family:'Playfair Display',serif; font-size:17px; color:var(--primary-dark);">Total: ${rp(total)}</div>
    </div>

    <div class="section">
      <div class="section-head"><h2>4. Payment</h2></div>
      <div class="field-row">
        <div class="field"><label>Bank / E-Wallet</label><input id="inv-bank" value="${esc(d.bank)}"></div>
        <div class="field"><label>Account Name</label><input id="inv-accname" value="${esc(d.accountName)}"></div>
      </div>
      <div class="field"><label>Account Number</label><input id="inv-accnum" value="${esc(d.accountNumber)}"></div>
      <div class="field"><label>Payment Notes</label><textarea id="inv-paynotes">${esc(d.paymentNotes)}</textarea></div>
    </div>

    <button class="btn btn-primary btn-block" data-action="preview-invoice"><i data-lucide="eye"></i>Preview Invoice</button>
  </div>
  `;
}
function invItemRow(it,idx){
  return `<div class="item-row" data-item-idx="${idx}">
    <div class="field" style="margin-bottom:0;"><label style="font-size:11px;">Service / Description</label><input class="inv-item-service" value="${esc(it.service)}"></div>
    <div class="field" style="margin-bottom:0;"><label style="font-size:11px;">Qty</label><input type="number" class="inv-item-qty" value="${it.qty}" min="1"></div>
    <div class="field" style="margin-bottom:0;"><label style="font-size:11px;">Rate</label><input type="number" class="inv-item-rate" value="${it.rate}"></div>
    <button class="rm" data-action="remove-item" data-idx="${idx}"><i data-lucide="x"></i></button>
  </div>`;
}
function syncInvDraftFromDOM(){
  if(!invDraft)return;
  const g=id=>document.getElementById(id);
  invDraft.brandName=g('inv-brandName')?.value||'';
  invDraft.pic=g('inv-pic')?.value||'';
  invDraft.whatsapp=g('inv-whatsapp')?.value||'';
  invDraft.email=g('inv-email')?.value||'';
  invDraft.address=g('inv-address')?.value||'';
  invDraft.invoiceDate=g('inv-date')?.value||invDraft.invoiceDate;
  invDraft.dueDate=g('inv-due')?.value||invDraft.dueDate;
  invDraft.bank=g('inv-bank')?.value||'';
  invDraft.accountName=g('inv-accname')?.value||'';
  invDraft.accountNumber=g('inv-accnum')?.value||'';
  invDraft.paymentNotes=g('inv-paynotes')?.value||'';
  const rows=document.querySelectorAll('#inv-items [data-item-idx]');
  invDraft.items=Array.from(rows).map(r=>({
    service:r.querySelector('.inv-item-service').value,
    desc:'',
    qty:Number(r.querySelector('.inv-item-qty').value)||0,
    rate:Number(r.querySelector('.inv-item-rate').value)||0
  }));
}

/* ============ VIEW: INVOICE DETAIL / PREVIEW ============ */
function viewInvoiceDetail(id){
  const inv=id==='draft'?invDraft:state.invoices.find(x=>x.id===id);
  if(!inv)return `<div class="empty-state"><div class="t1">Invoice not found</div></div>`;
  const isDraftPreview=(id==='draft');
  const total=invoiceTotal(inv);
  return `
  <button class="btn btn-ghost btn-sm" data-action="${isDraftPreview?'back-to-edit':'back-invoices'}" style="margin-bottom:14px;"><i data-lucide="chevron-left"></i>Back</button>

  <div id="print-area">
  <div class="invoice-paper">
    <div class="inv-header">
      <svg class="lily" width="90" height="90" viewBox="0 0 100 100" style="position:absolute; top:-10px; right:10px;"><path d="M50 10 C 30 20, 30 50, 50 90 C70 50, 70 20, 50 10 Z" fill="currentColor"/></svg>
      <div style="display:flex; justify-content:space-between; align-items:flex-start;">
        <div><div class="brandname">${esc((state.profile.brandName||'SATURNVSS').toUpperCase())}</div><div class="brandsub">Fashion &amp; Beauty Enthusiast</div></div>
        <div class="inv-title">INVOICE</div>
      </div>
    </div>
    <div class="inv-body">
      <div class="inv-meta">
        <div class="block"><div class="lbl">Bill To</div><div class="val"><strong>${esc(inv.brandName||'-')}</strong><br>${esc(inv.pic||'')}<br>${esc(inv.email||'')}</div></div>
        <div class="block" style="text-align:right;">
          <div class="lbl">Invoice Number</div><div class="val">${esc(inv.number)}</div>
          <div class="lbl" style="margin-top:8px;">Date</div><div class="val">${fmtDate(inv.invoiceDate)}</div>
          <div class="lbl" style="margin-top:8px;">Due Date</div><div class="val">${fmtDate(inv.dueDate)}</div>
        </div>
      </div>
      <table class="inv-table">
        <thead><tr><th>Service</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead>
        <tbody>${inv.items.map(it=>`<tr><td>${esc(it.service)}</td><td>${it.qty}</td><td>${rp(it.rate)}</td><td>${rp(it.qty*it.rate)}</td></tr>`).join('')}</tbody>
      </table>
      <div class="inv-totals">
        <div class="row"><span>Subtotal</span><span>${rp(total)}</span></div>
        <div class="row total"><span>TOTAL DUE</span><span>${rp(total)}</span></div>
      </div>
      <div class="inv-pay">
        <div class="lbl">Payment Information</div>
        <div style="font-size:13px; line-height:1.7;"><strong>${esc(inv.bank||'-')}</strong><br>${esc(inv.accountName||'-')} — ${esc(inv.accountNumber||'-')}</div>
        ${inv.paymentNotes?`<div style="font-size:12px; color:#9a828c; margin-top:8px;">${esc(inv.paymentNotes)}</div>`:''}
      </div>
    </div>
    <div class="inv-footer">Thank you for your trust &amp; collaboration ♡</div>
  </div>
  </div>

  <div style="max-width:760px;margin:16px auto 0;">
  ${isDraftPreview?`
    <button class="btn btn-primary btn-block" data-action="save-invoice"><i data-lucide="check"></i>Generate Invoice</button>
  `:`
  <div style="display:flex; gap:8px; flex-wrap:wrap;">
    <button class="btn btn-primary" data-action="download-pdf"><i data-lucide="download"></i>Download PDF</button>
    <button class="btn btn-ghost" data-action="print-invoice"><i data-lucide="printer"></i>Print</button>
    <button class="btn btn-ghost" data-action="share-invoice" data-id="${inv.id}"><i data-lucide="share-2"></i>Share</button>
    <select data-action="set-invoice-status" data-id="${inv.id}" style="border:1px solid var(--border);border-radius:10px;padding:0 12px;background:var(--card);color:var(--text);">
      ${INVOICE_STATUS.map(s=>`<option ${inv.status===s?'selected':''}>${s}</option>`).join('')}
    </select>
  </div>`}
  </div>
  `;
}

/* ============ VIEW: PAYMENTS ============ */
function viewPayments(){
  const list=[...state.collabs].filter(c=>c.status!=='Cancelled').sort((a,b)=>{
    const order={Overdue:0,Pending:1,Invoiced:2,Partial:3,Paid:4};
    return (order[a.payment.status]??9)-(order[b.payment.status]??9);
  });
  const totalPaid=state.collabs.filter(c=>c.payment.status==='Paid').reduce((s,c)=>s+Number(c.fee||0),0);
  const totalPending=state.collabs.filter(c=>c.payment.status!=='Paid'&&c.status!=='Cancelled').reduce((s,c)=>s+Number(c.fee||0),0);
  return `
  <div class="stat-grid" style="grid-template-columns:1fr 1fr;">
    <div class="card stat-card"><div class="value">${rp(totalPaid)}</div><div class="label">Total Paid</div></div>
    <div class="card stat-card"><div class="value">${rp(totalPending)}</div><div class="label">Total Pending</div></div>
  </div>
  <div class="section">
    <div class="section-head"><h2>All Payments</h2></div>
    ${list.length===0?`<div class="card"><div class="empty-state" style="padding:30px;"><i data-lucide="wallet"></i><div class="t1">No payments yet</div></div></div>`:
    list.map(c=>`<div class="attn-card" data-nav="collab-detail" data-id="${c.id}" style="cursor:pointer;">
      <div class="stripe" style="background:${c.payment.status==='Paid'?'var(--success)':c.payment.status==='Overdue'?'var(--overdue)':'var(--peach)'}"></div>
      <div class="body"><div class="brand">${esc(c.brand)}</div><div class="meta">${esc(c.type)} • Due ${c.payment.dueDate?fmtDateShort(c.payment.dueDate):'-'}</div><div class="fee">${rp(c.fee)}</div></div>
      ${paymentBadge(c)}
    </div>`).join('')}
  </div>
  `;
}

/* ============ VIEW: HISTORY ============ */
let historyFilter={year:'',month:''};
function viewHistory(){
  let list=state.collabs.filter(c=>c.status==='Completed');
  const years=[...new Set(state.collabs.map(c=>c.deadline?.slice(0,4)).filter(Boolean))].sort().reverse();
  if(historyFilter.year)list=list.filter(c=>c.deadline?.slice(0,4)===historyFilter.year);
  if(historyFilter.month)list=list.filter(c=>c.deadline?.slice(5,7)===historyFilter.month);
  list.sort((a,b)=>new Date(b.deadline)-new Date(a.deadline));
  const months=[['01','Jan'],['02','Feb'],['03','Mar'],['04','Apr'],['05','Mei'],['06','Jun'],['07','Jul'],['08','Agu'],['09','Sep'],['10','Okt'],['11','Nov'],['12','Des']];
  return `
  <div class="select-row">
    <select id="hist-year"><option value="">Semua Tahun</option>${years.map(y=>`<option ${historyFilter.year===y?'selected':''}>${y}</option>`).join('')}</select>
    <select id="hist-month"><option value="">Semua Bulan</option>${months.map(m=>`<option value="${m[0]}" ${historyFilter.month===m[0]?'selected':''}>${m[1]}</option>`).join('')}</select>
  </div>
  ${list.length===0?`<div class="card"><div class="empty-state" style="padding:34px;"><i data-lucide="history"></i><div class="t1">Belum ada riwayat</div><div class="t2">Kerja sama yang selesai akan muncul di sini.</div></div></div>`:`
  <div class="collab-list mobile-only">${list.map(c=>{
    const inv=state.invoices.find(i=>i.id===c.payment.invoiceId);
    return `<div class="card collab-card" data-nav="collab-detail" data-id="${c.id}">
      <div class="row1"><div><div class="brand">${esc(c.brand)}</div><div class="type">${esc(c.type)} • ${esc(c.platform)}</div></div>${paymentBadge(c)}</div>
      <div class="grid"><div><div class="k">Completed</div><div class="v">${fmtDateShort(c.deadline)}</div></div><div><div class="k">Fee</div><div class="v">${rp(c.fee)}</div></div></div>
      <div class="grid"><div><div class="k">Invoice</div><div class="v">${inv?inv.number:'-'}</div></div></div>
    </div>`;
  }).join('')}</div>
  <div class="table-wrap"><table><thead><tr><th>Brand</th><th>Type</th><th>Platform</th><th>Completed</th><th>Fee</th><th>Invoice</th><th>Payment</th></tr></thead>
  <tbody>${list.map(c=>{
    const inv=state.invoices.find(i=>i.id===c.payment.invoiceId);
    return `<tr style="cursor:pointer" data-nav="collab-detail" data-id="${c.id}"><td><strong>${esc(c.brand)}</strong></td><td>${esc(c.type)}</td><td>${esc(c.platform)}</td><td>${fmtDateShort(c.deadline)}</td><td class="fee">${rp(c.fee)}</td><td>${inv?inv.number:'-'}</td><td>${paymentBadge(c)}</td></tr>`;
  }).join('')}</tbody></table></div>`}
  `;
}

/* ============ VIEW: ANALYTICS ============ */
function viewAnalytics(){
  const cs=state.collabs;
  const paid=cs.filter(c=>c.payment.status==='Paid').reduce((s,c)=>s+Number(c.fee),0);
  const pending=cs.filter(c=>c.payment.status!=='Paid'&&c.status!=='Cancelled').reduce((s,c)=>s+Number(c.fee),0);
  const overdue=cs.filter(c=>c.payment.status==='Overdue').reduce((s,c)=>s+Number(c.fee),0);
  return `
  <div class="mini-stat-row">
    <div class="card mini-stat"><div class="v">${cs.length}</div><div class="l">Total</div></div>
    <div class="card mini-stat"><div class="v">${cs.filter(c=>c.status==='Completed').length}</div><div class="l">Completed</div></div>
    <div class="card mini-stat"><div class="v">${cs.filter(c=>!['Completed','Cancelled'].includes(c.status)).length}</div><div class="l">Active</div></div>
  </div>
  <div class="mini-stat-row" style="margin-top:10px;">
    <div class="card mini-stat"><div class="v" style="color:var(--success)">${rp(paid)}</div><div class="l">Paid</div></div>
    <div class="card mini-stat"><div class="v" style="color:var(--peach)">${rp(pending)}</div><div class="l">Pending</div></div>
    <div class="card mini-stat"><div class="v" style="color:var(--overdue)">${rp(overdue)}</div><div class="l">Overdue</div></div>
  </div>
  <div class="section"><div class="card chart-card"><h3>Income per Month</h3><canvas id="chart-income" height="160"></canvas></div></div>
  <div class="section"><div class="card chart-card"><h3>Collaboration per Month</h3><canvas id="chart-collab" height="160"></canvas></div></div>
  <div class="section"><div class="card chart-card"><h3>Platform Breakdown</h3><canvas id="chart-platform" height="160"></canvas></div></div>
  `;
}
let chartInstances=[];
function drawCharts(){
  chartInstances.forEach(c=>c.destroy()); chartInstances=[];
  if(!window.Chart)return;
  const cs=state.collabs;
  const monthLabels=[]; const monthIncome=[]; const monthCount=[];
  const now=new Date();
  for(let i=5;i>=0;i--){
    const d=new Date(now.getFullYear(),now.getMonth()-i,1);
    const key=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    monthLabels.push(d.toLocaleDateString('id-ID',{month:'short'}));
    monthIncome.push(cs.filter(c=>c.payment.status==='Paid'&&c.deadline?.startsWith(key)).reduce((s,c)=>s+Number(c.fee),0));
    monthCount.push(cs.filter(c=>c.deadline?.startsWith(key)).length);
  }
  const pink='#D9789F', cream='#F2A7C2';
  const c1=document.getElementById('chart-income');
  if(c1)chartInstances.push(new Chart(c1,{type:'line',data:{labels:monthLabels,datasets:[{data:monthIncome,borderColor:pink,backgroundColor:'rgba(242,167,194,.2)',fill:true,tension:.35}]},options:{plugins:{legend:{display:false}},scales:{y:{ticks:{callback:v=>'Rp'+(v/1000)+'k'}}}}}));
  const c2=document.getElementById('chart-collab');
  if(c2)chartInstances.push(new Chart(c2,{type:'bar',data:{labels:monthLabels,datasets:[{data:monthCount,backgroundColor:cream,borderRadius:6}]},options:{plugins:{legend:{display:false}}}}));
  const c3=document.getElementById('chart-platform');
  const byPlat={}; cs.forEach(c=>byPlat[c.platform]=(byPlat[c.platform]||0)+1);
  if(c3)chartInstances.push(new Chart(c3,{type:'doughnut',data:{labels:Object.keys(byPlat),datasets:[{data:Object.values(byPlat),backgroundColor:['#F2A7C2','#D9789F','#F3B88A','#E8934F','#C98BA8']}]},options:{plugins:{legend:{position:'bottom',labels:{boxWidth:10,font:{size:11}}}}}}));
}

/* ============ VIEW: SETTINGS ============ */
function viewSettings(){
  const p=state.profile;
  return `
  <div class="section" style="margin-top:0;">
    <div class="section-head"><h2>Invoice Profile</h2></div>
    <div class="card" style="padding:16px 18px;">
      <div class="field"><label>Nama</label><input id="set-name" value="${esc(p.name)}"></div>
      <div class="field"><label>Brand / Creator Name</label><input id="set-brandName" value="${esc(p.brandName)}"></div>
      <div class="field-row">
        <div class="field"><label>Email</label><input id="set-email" value="${esc(p.email)}"></div>
        <div class="field"><label>WhatsApp</label><input id="set-whatsapp" value="${esc(p.whatsapp)}"></div>
      </div>
      <div class="field"><label>Address</label><textarea id="set-address">${esc(p.address)}</textarea></div>
      <div class="field-row">
        <div class="field"><label>Bank Name</label><input id="set-bankName" value="${esc(p.bankName)}"></div>
        <div class="field"><label>Account Name</label><input id="set-accountName" value="${esc(p.accountName)}"></div>
      </div>
      <div class="field"><label>Account Number</label><input id="set-accountNumber" value="${esc(p.accountNumber)}"></div>
      <div class="field-row">
        <div class="field"><label>Instagram</label><input id="set-instagram" value="${esc(p.instagram)}"></div>
        <div class="field"><label>TikTok</label><input id="set-tiktok" value="${esc(p.tiktok)}"></div>
      </div>
      <button class="btn btn-primary btn-block" data-action="save-profile"><i data-lucide="check"></i>Save Profile</button>
    </div>
  </div>

  <div class="section">
    <div class="section-head"><h2>Preferences</h2></div>
    <div class="card" style="padding:6px 18px;">
      <div class="settings-row">
        <div><div class="lbl">Dark Mode</div><div class="sub">Tampilan gelap dengan tone dusty rose</div></div>
        <label class="switch"><input type="checkbox" id="dark-toggle" ${state.theme==='dark'?'checked':''}><span class="slider"></span></label>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-head"><h2>Backup</h2></div>
    <div class="card" style="padding:16px 18px; display:flex; flex-direction:column; gap:10px;">
      <button class="btn btn-ghost btn-block" data-action="export-data"><i data-lucide="download"></i>Export Data (Backup JSON)</button>
      <label class="btn btn-ghost btn-block" style="display:flex;"><i data-lucide="upload"></i>Import Data<input type="file" id="import-file" accept=".json" style="display:none;"></label>
      <button class="btn btn-danger btn-block" data-action="reset-data"><i data-lucide="trash-2"></i>Reset Data</button>
    </div>
  </div>
  `;
}
function viewMore(){
  const items=[
    ['invoices','Invoices','file-text'],['payments','Payments','wallet'],['analytics','Analytics','bar-chart-3'],['settings','Settings','settings']
  ];
  return `<div class="card" style="padding:6px;">
    ${items.map(i=>`<button class="nav-item" data-nav="${i[0]}" style="opacity:1;padding:14px;"><i data-lucide="${i[2]}"></i>${i[1]}</button>`).join('')}
  </div>`;
}

/* ============ MODALS ============ */
function openModalHTML(title,bodyHTML,footHTML){
  let m=document.getElementById('dyn-modal');
  if(!m){ m=document.createElement('div'); m.id='dyn-modal'; m.className='modal'; document.body.appendChild(m); }
  m.innerHTML=`<div class="modal-head"><h3>${title}</h3><button class="modal-close" data-action="close-modal"><i data-lucide="x"></i></button></div>
  <div class="modal-body">${bodyHTML}</div>${footHTML?`<div class="modal-foot">${footHTML}</div>`:''}`;
  document.getElementById('overlay').classList.add('show');
  m.classList.add('show');
  icons();
}
function closeModal(){
  const m=document.getElementById('dyn-modal'); if(m)m.classList.remove('show');
  document.getElementById('overlay').classList.remove('show');
}

function modalAddEditCollab(existing){
  const c=existing||{brand:'',pic:'',whatsapp:'',type:TYPE_LIST[0],platform:PLATFORM_LIST[0],deadline:todayISO(),fee:'',status:'New',notes:''};
  openModalHTML(existing?'Edit Collaboration':'Add Collaboration', `
    <div class="field"><label>Brand Name</label><input id="f-brand" value="${esc(c.brand)}" placeholder="Nama brand"></div>
    <div class="field-row">
      <div class="field"><label>Contact Person</label><input id="f-pic" value="${esc(c.pic)}" placeholder="Nama PIC"></div>
      <div class="field"><label>WhatsApp</label><input id="f-whatsapp" value="${esc(c.whatsapp)}" placeholder="62..."></div>
    </div>
    <div class="field"><label>Collaboration Type</label>
      <div class="type-chip-grid" id="f-type-grid">${TYPE_LIST.map(t=>`<button type="button" class="type-chip ${c.type===t?'sel':''}" data-type="${t}">${t}</button>`).join('')}</div>
    </div>
    <div class="field"><label>Platform</label>
      <div class="type-chip-grid" id="f-platform-grid">${PLATFORM_LIST.map(t=>`<button type="button" class="type-chip ${c.platform===t?'sel':''}" data-platform="${t}">${t}</button>`).join('')}</div>
    </div>
    <div class="field-row">
      <div class="field"><label>Deadline</label><input type="date" id="f-deadline" value="${c.deadline}"></div>
      <div class="field"><label>Fee (Rp)</label><input type="number" id="f-fee" value="${c.fee}" placeholder="1500000"></div>
    </div>
    <div class="field"><label>Status</label><select id="f-status">${STATUS_LIST.map(s=>`<option ${c.status===s?'selected':''}>${s}</option>`).join('')}</select></div>
    <div class="field"><label>Notes</label><textarea id="f-notes" placeholder="Catatan tambahan...">${esc(c.notes)}</textarea></div>
  `,`<button class="btn btn-primary btn-block" data-action="save-collab" data-id="${existing?existing.id:''}"><i data-lucide="check"></i>Save Collaboration</button>`);
  document.getElementById('f-type-grid').addEventListener('click',e=>{const b=e.target.closest('[data-type]'); if(!b)return; document.querySelectorAll('#f-type-grid .type-chip').forEach(x=>x.classList.remove('sel')); b.classList.add('sel');});
  document.getElementById('f-platform-grid').addEventListener('click',e=>{const b=e.target.closest('[data-platform]'); if(!b)return; document.querySelectorAll('#f-platform-grid .type-chip').forEach(x=>x.classList.remove('sel')); b.classList.add('sel');});
}
function saveCollabFromModal(id){
  const type=document.querySelector('#f-type-grid .type-chip.sel')?.dataset.type||TYPE_LIST[0];
  const platform=document.querySelector('#f-platform-grid .type-chip.sel')?.dataset.platform||PLATFORM_LIST[0];
  const brand=document.getElementById('f-brand').value.trim();
  if(!brand){ toast('Nama brand wajib diisi'); return; }
  const fee=Number(document.getElementById('f-fee').value)||0;
  const deadline=document.getElementById('f-deadline').value||todayISO();
  const status=document.getElementById('f-status').value;
  const pic=document.getElementById('f-pic').value.trim();
  const whatsapp=document.getElementById('f-whatsapp').value.trim();
  const notes=document.getElementById('f-notes').value.trim();
  if(id){
    const c=state.collabs.find(x=>x.id===id);
    Object.assign(c,{brand,pic,whatsapp,type,platform,deadline,fee,status,notes});
  }else{
    state.collabs.push({
      id:uid(),brand,pic,whatsapp,type,platform,deadline,fee,status,notes,
      checklist:{brief:false,product:false,content:false,sent:false,revision:false,uploaded:false,payment:false},
      timeline:[], payment:{status:'Pending',invoiceId:null,invoiceNumber:'',invoiceDate:'',dueDate:'',amount:fee,method:'',paymentDate:'',notes:''},
      createdAt:new Date().toISOString()
    });
  }
  save(); closeModal(); toast('Collaboration saved 🌸'); render();
}
function modalConfirm(title,text,onConfirmAction,onConfirmId){
  openModalHTML(title,`<div class="confirm-box"><p>${text}</p></div>`,
   `<div style="display:flex;gap:8px;"><button class="btn btn-ghost btn-block" data-action="close-modal">Cancel</button><button class="btn btn-danger btn-block" data-action="${onConfirmAction}" data-id="${onConfirmId||''}">Confirm</button></div>`);
}
function modalGlobalSearch(){
  openModalHTML('Search',`<div class="search-box" style="margin:0 0 12px;"><i data-lucide="search"></i><input id="gsearch-input" placeholder="Cari brand, invoice, catatan..." autofocus></div><div id="gsearch-results"></div>`,'');
  document.getElementById('gsearch-input').addEventListener('input',e=>renderGlobalSearch(e.target.value));
  document.getElementById('gsearch-input').focus();
}
function renderGlobalSearch(q){
  const r=document.getElementById('gsearch-results');
  if(!q){r.innerHTML='';return;}
  const ql=q.toLowerCase();
  const collabs=state.collabs.filter(c=>(c.brand+c.pic+c.notes).toLowerCase().includes(ql));
  const invoices=state.invoices.filter(i=>(i.number+i.brandName+i.paymentNotes).toLowerCase().includes(ql));
  if(collabs.length===0&&invoices.length===0){ r.innerHTML=`<p style="font-size:12.5px;color:var(--muted);text-align:center;padding:16px;">Tidak ditemukan.</p>`; return; }
  r.innerHTML=
    collabs.map(c=>`<div class="gsearch-result" data-action="goto-search-result" data-nav="collab-detail" data-id="${c.id}"><div class="ic"><i data-lucide="heart-handshake"></i></div><div><div style="font-weight:600;font-size:13.5px;">${esc(c.brand)}</div><div style="font-size:11.5px;color:var(--muted);">${esc(c.type)} • Collaboration</div></div></div>`).join('')+
    invoices.map(i=>`<div class="gsearch-result" data-action="goto-search-result" data-nav="invoice-detail" data-id="${i.id}"><div class="ic"><i data-lucide="file-text"></i></div><div><div style="font-weight:600;font-size:13.5px;">${esc(i.number)}</div><div style="font-size:11.5px;color:var(--muted);">${esc(i.brandName)} • Invoice</div></div></div>`).join('');
  icons();
}
function modalNotifications(){
  const notifs=[];
  state.collabs.forEach(c=>{
    const s=collabDeadlineState(c);
    if(s==='today')notifs.push({icon:'clock',text:`Deadline ${esc(c.brand)} hari ini.`});
    if(s==='overdue')notifs.push({icon:'alert-circle',text:`${esc(c.brand)} sudah overdue.`});
    if(c.status==='Completed'&&c.payment.status!=='Paid')notifs.push({icon:'banknote',text:`Payment ${esc(c.brand)} belum diterima.`});
  });
  state.invoices.forEach(i=>{
    const du=daysUntil(i.dueDate);
    if(i.status!=='Paid'&&du===1)notifs.push({icon:'file-text',text:`Invoice ${i.number} jatuh tempo besok.`});
    if(i.status==='Paid')notifs.push({icon:'check-circle-2',text:`Payment untuk ${i.number} sudah diterima.`});
  });
  openModalHTML('Notifications 🌸',
    notifs.length===0?`<p style="font-size:12.5px;color:var(--muted);text-align:center;padding:20px;">Belum ada notifikasi.</p>`:
    notifs.map(n=>`<div class="gsearch-result"><div class="ic"><i data-lucide="${n.icon}"></i></div><div style="font-size:13px;">${n.text}</div></div>`).join(''),'');
}

/* ============ EVENT DELEGATION ============ */
document.addEventListener('click',e=>{
  const overlay=document.getElementById('overlay');
  if(e.target===overlay){ closeModal(); return; }

  const navEl=e.target.closest('[data-nav]');
  const actionEl=e.target.closest('[data-action]');

  if(navEl){
    const v=navEl.dataset.nav; const id=navEl.dataset.id;
    if(v==='more'){ nav('more'); return; }
    if(id) nav(v,{id}); else nav(v);
    return;
  }
  if(!actionEl)return;
  const a=actionEl.dataset.action; const id=actionEl.dataset.id;

  if(a==='add-collab'){ modalAddEditCollab(null); }
  else if(a==='edit-collab'){ modalAddEditCollab(state.collabs.find(c=>c.id===id)); }
  else if(a==='save-collab'){ saveCollabFromModal(id||null); }
  else if(a==='delete-collab'){ modalConfirm('Delete Collaboration','Data kerja sama ini akan dihapus permanen. Lanjutkan?','confirm-delete-collab',id); }
  else if(a==='confirm-delete-collab'){ state.collabs=state.collabs.filter(c=>c.id!==id); save(); closeModal(); toast('Collaboration deleted'); nav('collaborations'); }
  else if(a==='close-modal'){ closeModal(); }
  else if(a==='search'){ modalGlobalSearch(); }
  else if(a==='notif'){ modalNotifications(); }
  else if(a==='goto-search-result'){ closeModal(); }
  else if(a==='mark-paid'){ markPaid(id); }
  else if(a==='add-note'){ addNote(id); }
  else if(a==='create-invoice-from'){ invDraft=freshInvDraft(id); nav('invoice-create'); }
  else if(a==='new-invoice'){ invDraft=freshInvDraft(null); nav('invoice-create'); }
  else if(a==='cancel-invoice'){ invDraft=null; nav('invoices'); }
  else if(a==='add-item'){ syncInvDraftFromDOM(); invDraft.items.push({service:'',desc:'',qty:1,rate:0}); rerenderInvoiceCreate(); }
  else if(a==='remove-item'){ syncInvDraftFromDOM(); invDraft.items.splice(Number(actionEl.dataset.idx),1); if(invDraft.items.length===0)invDraft.items.push({service:'',desc:'',qty:1,rate:0}); rerenderInvoiceCreate(); }
  else if(a==='preview-invoice'){ syncInvDraftFromDOM(); nav('invoice-detail',{id:'draft'}); }
  else if(a==='back-to-edit'){ nav('invoice-create'); }
  else if(a==='back-invoices'){ nav('invoices'); }
  else if(a==='save-invoice'){ saveInvoice(); }
  else if(a==='download-pdf'){ downloadInvoicePDF(id||route.params.id); }
  else if(a==='print-invoice'){ window.print(); }
  else if(a==='share-invoice'){ shareInvoice(id); }
  else if(a==='set-invoice-status'){} // handled on change
  else if(a==='cal-prev'){ calCursor.setMonth(calCursor.getMonth()-1); nav('calendar'); }
  else if(a==='cal-next'){ calCursor.setMonth(calCursor.getMonth()+1); nav('calendar'); }
  else if(a==='cal-day'){ nav('calendar',{}); route.params.day=actionEl.dataset.day; render(); }
  else if(a==='save-profile'){ saveProfile(); }
  else if(a==='export-data'){ exportData(); }
  else if(a==='reset-data'){ modalConfirm('Reset All Data','Semua data collaboration, invoice, dan profile akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.','confirm-reset',''); }
  else if(a==='confirm-reset'){ localStorage.removeItem(LS_KEY); load(); closeModal(); toast('Data reset'); nav('dashboard'); }
  else if(a==='backup'){ exportData(); }
});

document.addEventListener('change',e=>{
  if(e.target.id==='collab-search'){ collabFilter.search=e.target.value; document.getElementById('view-root').innerHTML=viewCollaborations(); icons(); }
  if(e.target.id==='filter-platform'){ collabFilter.platform=e.target.value; render(); }
  if(e.target.id==='filter-type'){ collabFilter.type=e.target.value; render(); }
  if(e.target.id==='filter-sort'){ collabFilter.sort=e.target.value; render(); }
  if(e.target.dataset.check!==undefined){ toggleCheck(e.target.dataset.id,e.target.dataset.check); }
  if(e.target.dataset.payfield){ updatePayField(e.target.dataset.id,e.target.dataset.payfield,e.target.value); }
  if(e.target.id==='hist-year'){ historyFilter.year=e.target.value; render(); }
  if(e.target.id==='hist-month'){ historyFilter.month=e.target.value; render(); }
  if(e.target.id==='dark-toggle'){ state.theme=e.target.checked?'dark':'light'; applyTheme(); save(); }
  if(e.target.id==='import-file'){ importData(e.target.files[0]); }
  if(e.target.dataset.action==='set-invoice-status'){ const inv=state.invoices.find(i=>i.id===e.target.dataset.id); if(inv){inv.status=e.target.value; save(); toast('Status updated');} }
});
document.addEventListener('input',e=>{
  if(e.target.id==='collab-search'){ collabFilter.search=e.target.value; }
});
document.addEventListener('click',e=>{
  if(e.target.closest('.chip[data-filter-status]')){ collabFilter.status=e.target.closest('.chip').dataset.filterStatus; render(); }
  if(e.target.closest('.chip[data-filter-invstatus]')){ invoiceFilter=e.target.closest('.chip').dataset.filterInvstatus; render(); }
});

function rerenderInvoiceCreate(){ document.getElementById('view-root').innerHTML=viewInvoiceCreate(); icons(); }

function toggleCheck(id,key){
  const c=state.collabs.find(x=>x.id===id); if(!c)return;
  c.checklist[key]=!c.checklist[key];
  save(); document.getElementById('view-root').innerHTML=viewCollabDetail(id); icons();
}
function updatePayField(id,field,value){
  const c=state.collabs.find(x=>x.id===id); if(!c)return;
  c.payment[field]=field==='amount'?Number(value):value;
  save();
}
function markPaid(id){
  const c=state.collabs.find(x=>x.id===id); if(!c)return;
  c.payment.status='Paid'; c.payment.paymentDate=c.payment.paymentDate||todayISO();
  c.timeline.push({date:new Date().toISOString(),text:'Payment diterima.'});
  if(c.payment.invoiceId){ const inv=state.invoices.find(i=>i.id===c.payment.invoiceId); if(inv)inv.status='Paid'; }
  save(); toast('Marked as paid 🌸'); document.getElementById('view-root').innerHTML=viewCollabDetail(id); icons();
}
function addNote(id){
  const input=document.getElementById('new-note'); const text=input.value.trim();
  if(!text)return;
  const c=state.collabs.find(x=>x.id===id); c.timeline.push({date:new Date().toISOString(),text});
  save(); document.getElementById('view-root').innerHTML=viewCollabDetail(id); icons();
}
function saveInvoice(){
  syncInvDraftFromDOM();
  if(!invDraft.brandName){ toast('Nama brand wajib diisi'); nav('invoice-create'); return; }
  state.invoiceSeq[invDraft._seqKey]=(state.invoiceSeq[invDraft._seqKey]||0)+1;
  delete invDraft._seqKey;
  invDraft.status='Sent';
  state.invoices.push(invDraft);
  if(invDraft.collaborationId){
    const c=state.collabs.find(x=>x.id===invDraft.collaborationId);
    if(c){
      c.payment.invoiceId=invDraft.id; c.payment.invoiceNumber=invDraft.number; c.payment.invoiceDate=invDraft.invoiceDate; c.payment.dueDate=invDraft.dueDate; c.payment.status='Invoiced';
      c.timeline.push({date:new Date().toISOString(),text:`Invoice ${invDraft.number} dibuat.`});
    }
  }
  const savedId=invDraft.id;
  save(); toast('Invoice created 🌸');
  invDraft=null;
  nav('invoice-detail',{id:savedId});
}
async function downloadInvoicePDF(id){
  const inv=id==='draft'?invDraft:state.invoices.find(x=>x.id===id);
  const node=document.querySelector('.invoice-paper');
  if(!node||!window.html2canvas||!window.jspdf){ window.print(); return; }
  toast('Menyiapkan PDF...');
  try{
    const canvas=await html2canvas(node,{scale:2,backgroundColor:'#ffffff'});
    const { jsPDF }=window.jspdf;
    const pdf=new jsPDF('p','mm','a4');
    const pageW=210, pageH=297;
    const imgW=pageW; const imgH=canvas.height*imgW/canvas.width;
    let heightLeft=imgH, position=0;
    pdf.addImage(canvas.toDataURL('image/png'),'PNG',0,position,imgW,Math.min(imgH,pageH));
    heightLeft-=pageH;
    while(heightLeft>0){ position=heightLeft-imgH; pdf.addPage(); pdf.addImage(canvas.toDataURL('image/png'),'PNG',0,position,imgW,imgH); heightLeft-=pageH; }
    pdf.save(`${inv.number}.pdf`);
    toast('PDF downloaded 🌸');
  }catch(err){ console.error(err); window.print(); }
}
function shareInvoice(id){
  const inv=state.invoices.find(x=>x.id===id);
  const text=`Invoice ${inv.number} — ${inv.brandName} — Total ${rp(invoiceTotal(inv))} — Due ${fmtDate(inv.dueDate)}`;
  if(navigator.share){ navigator.share({title:inv.number,text}); }
  else { navigator.clipboard?.writeText(text); toast('Invoice info copied 🌸'); }
}
function saveProfile(){
  const g=id=>document.getElementById(id).value.trim();
  state.profile={name:g('set-name'),brandName:g('set-brandName'),email:g('set-email'),whatsapp:g('set-whatsapp'),address:g('set-address'),

/* ============ CONSTANTS ============ */
const LS_KEY='saturnvss_dashboard_v1';
const LS_KEY_OLD='dwi_dashboard_v1';
const TYPE_LIST=['Endorsement','Paid Promote','Affiliate','Campaign','Product Exchange','Other'];
const PLATFORM_LIST=['TikTok','Instagram','YouTube','Shopee','Other'];
const STATUS_LIST=['New','In Progress','Revision','Waiting Upload','Waiting Payment','Completed','Cancelled'];
const PAYMENT_STATUS=['Pending','Invoiced','Paid','Partial','Overdue'];
const INVOICE_STATUS=['Draft','Sent','Paid','Overdue','Cancelled'];
const CHECKLIST=[['brief','Brief received'],['product','Product received'],['content','Content created'],['sent','Sent to brand'],['revision','Revision completed'],['uploaded','Uploaded'],['payment','Payment received']];

/* ============ STATE ============ */
let state=null;
function seedState(){
  const now=new Date();
  const iso=(d)=>d.toISOString().slice(0,10);
  const addDays=(n)=>{const d=new Date(); d.setDate(d.getDate()+n); return iso(d);};
  return {
    profile:{name:'Saturnvss',brandName:'Saturnvss',email:'',whatsapp:'',address:'',bankName:'',accountName:'',accountNumber:'',instagram:'',tiktok:''},
    theme:'light',
    invoiceSeq:{},
    collabs:[
      {id:uid(),brand:'Wardah Beauty',pic:'Kak Nadia',whatsapp:'6281234567890',type:'Endorsement',platform:'TikTok',deadline:addDays(0),fee:1500000,status:'In Progress',notes:'',checklist:{brief:true,product:true,content:false,sent:false,revision:false,uploaded:false,payment:false},timeline:[{date:new Date().toISOString(),text:'Produk diterima.'}],payment:{status:'Pending',invoiceId:null,invoiceNumber:'',invoiceDate:'',dueDate:'',amount:1500000,method:'',paymentDate:'',notes:''},createdAt:new Date().toISOString()},
      {id:uid(),brand:'Somethinc',pic:'Kak Rani',whatsapp:'6281234567891',type:'Paid Promote',platform:'Instagram',deadline:addDays(1),fee:800000,status:'Revision',notes:'',checklist:{brief:true,product:true,content:true,sent:true,revision:false,uploaded:false,payment:false},timeline:[{date:new Date().toISOString(),text:'Brand meminta revisi caption.'}],payment:{status:'Pending',invoiceId:null,invoiceNumber:'',invoiceDate:'',dueDate:'',amount:800000,method:'',paymentDate:'',notes:''},createdAt:new Date().toISOString()},
      {id:uid(),brand:'Brand XYZ',pic:'Kak Sarah',whatsapp:'6281234567892',type:'Campaign',platform:'TikTok',deadline:addDays(3),fee:2000000,status:'New',notes:'',checklist:{brief:false,product:false,content:false,sent:false,revision:false,uploaded:false,payment:false},timeline:[],payment:{status:'Pending',invoiceId:null,invoiceNumber:'',invoiceDate:'',dueDate:'',amount:2000000,method:'',paymentDate:'',notes:''},createdAt:new Date().toISOString()},
      {id:uid(),brand:'Scarlett Whitening',pic:'Kak Dini',whatsapp:'6281234567893',type:'Affiliate',platform:'Shopee',deadline:addDays(-2),fee:500000,status:'Completed',notes:'',checklist:{brief:true,product:true,content:true,sent:true,revision:true,uploaded:true,payment:true},timeline:[{date:new Date().toISOString(),text:'Konten sudah tayang, payment diterima.'}],payment:{status:'Paid',invoiceId:null,invoiceNumber:'',invoiceDate:'',dueDate:'',amount:500000,method:'Transfer Bank',paymentDate:addDays(-1),notes:''},createdAt:new Date().toISOString()}
    ],
    invoices:[]
  };
}
function load(){
  try{
    let raw=localStorage.getItem(LS_KEY);
    if(!raw){ raw=localStorage.getItem(LS_KEY_OLD); } // migrate from earlier version's storage key
    state=raw?JSON.parse(raw):seedState();
  }catch(e){state=seedState();}
  if(!state.invoiceSeq)state.invoiceSeq={};
  if(state.profile && (state.profile.name==='Dwi Lestari')) state.profile.name='Saturnvss';
  if(state.profile && (state.profile.brandName==='Dwi Lestari')) state.profile.brandName='Saturnvss';
  save();
}
function save(){ localStorage.setItem(LS_KEY,JSON.stringify(state)); }

/* ============ UTILS ============ */
function uid(){return 'id'+Date.now().toString(36)+Math.random().toString(36).slice(2,8);}
function rp(n){ n=Number(n)||0; return 'Rp'+n.toLocaleString('id-ID');}
function fmtDate(s){ if(!s)return '-'; const d=new Date(s+ (s.length===10?'T00:00:00':'')); if(isNaN(d))return s; return d.toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'}); }
function fmtDateShort(s){ if(!s)return '-'; const d=new Date(s+ (s.length===10?'T00:00:00':'')); if(isNaN(d))return s; return d.toLocaleDateString('id-ID',{day:'numeric',month:'short'}); }
function todayISO(){return new Date().toISOString().slice(0,10);}
function daysUntil(dateStr){
  if(!dateStr)return null;
  const d=new Date(dateStr+'T00:00:00'); const t=new Date(); t.setHours(0,0,0,0);
  return Math.round((d-t)/86400000);
}
function esc(s){ return (s==null?'':String(s)).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function toast(msg){
  const t=document.getElementById('toast'); t.textContent=msg; t.classList.add('show');
  clearTimeout(window._toastTimer); window._toastTimer=setTimeout(()=>t.classList.remove('show'),2200);
}
function icons(){ if(window.lucide) lucide.createIcons(); }

function collabDeadlineState(c){
  if(c.status==='Completed'||c.status==='Cancelled')return null;
  const du=daysUntil(c.deadline);
  if(du<0)return 'overdue';
  if(du===0)return 'today';
  if(du<=3)return 'soon';
  return 'normal';
}
function deadlineBadge(c){
  const s=collabDeadlineState(c);
  if(!s)return '';
  const du=daysUntil(c.deadline);
  if(s==='overdue')return `<span class="badge badge-overdue"><i data-lucide="alert-circle" style="width:11px;height:11px"></i> OVERDUE</span>`;
  if(s==='today')return `<span class="badge badge-today">Today</span>`;
  if(s==='soon')return `<span class="badge badge-peach">${du} hari lagi</span>`;
  return `<span class="badge badge-pink">${fmtDateShort(c.deadline)}</span>`;
}
function paymentBadge(c){
  const st=c.payment.status;
  const map={Pending:'badge-muted',Invoiced:'badge-peach',Paid:'badge-success',Partial:'badge-peach',Overdue:'badge-overdue'};
  return `<span class="badge ${map[st]||'badge-muted'}">${st==='Pending'&&c.status==='Completed'?'PAYMENT PENDING':st}</span>`;
}
function statusBadge(status){
  const map={New:'badge-pink','In Progress':'badge-peach',Revision:'badge-peach','Waiting Upload':'badge-peach','Waiting Payment':'badge-today',Completed:'badge-success',Cancelled:'badge-muted'};
  return `<span class="badge ${map[status]||'badge-pink'}">${status}</span>`;
}
function progressPct(c){
  const keys=CHECKLIST.map(x=>x[0]);
  const done=keys.filter(k=>c.checklist[k]).length;
  return Math.round(done/keys.length*100);
}

/* ============ ROUTER ============ */
let route={view:'dashboard',params:{}};
function nav(view,params={}){
  route={view,params};
  location.hash='#'+view+(params.id?'/'+params.id:'');
  render();
  window.scrollTo(0,0);
}
window.addEventListener('hashchange',()=>{
  const h=location.hash.replace('#','');
  const [view,id]=h.split('/');
  route={view:view||'dashboard',params:id?{id}:{}};
  render();
});

/* ============ SHELL ============ */
const NAV_ITEMS=[
  {v:'dashboard',label:'Dashboard',icon:'layout-dashboard'},
  {v:'collaborations',label:'Collaborations',icon:'heart-handshake'},
  {v:'calendar',label:'Calendar',icon:'calendar-days'},
  {v:'invoices',label:'Invoices',icon:'file-text'},
  {v:'payments',label:'Payments',icon:'wallet'},
  {v:'history',label:'History',icon:'history'},
  {v:'analytics',label:'Analytics',icon:'bar-chart-3'},
];
const BOTTOM_NAV=[
  {v:'dashboard',label:'Home',icon:'home'},
  {v:'collaborations',label:'Collab',icon:'heart-handshake'},
  {v:'calendar',label:'Calendar',icon:'calendar-days'},
  {v:'history',label:'History',icon:'history'},
  {v:'more',label:'More',icon:'menu'},
];

function shellHTML(inner){
  const active=route.view;
  return `
  <svg class="lily-watermark" viewBox="0 0 200 200" fill="none"><path d="M100 20 C 60 40, 60 100, 100 180 C140 100, 140 40, 100 20 Z" fill="currentColor"/><path d="M20 100 C 40 60, 100 60, 180 100 C100 140, 40 140, 20 100 Z" fill="currentColor" opacity=".6"/></svg>
  <div class="shell">
    <aside class="sidebar">
      <div class="sidebar-brand">
        <div class="flower">🌸</div>
        <div><div class="name">${esc(state.profile.name||'Saturnvss')}</div><div class="role">Creator Dashboard</div></div>
      </div>
      <div class="nav-group">
        ${NAV_ITEMS.map(n=>`<button class="nav-item ${active===n.v?'active':''}" data-nav="${n.v}"><i data-lucide="${n.icon}"></i>${n.label}</button>`).join('')}
      </div>
      <div class="sidebar-footer">
        <button class="nav-item ${active==='settings'?'active':''}" data-nav="settings"><i data-lucide="settings"></i>Settings</button>
        <button class="nav-item" data-action="backup"><i data-lucide="database"></i>Backup Data</button>
      </div>
    </aside>
    <div class="main">
      <div class="topbar">
        <div class="topbar-greeting">
          <h1>${topbarTitle()}</h1>
          <p>${topbarSubtitle()}</p>
        </div>
        <div class="topbar-actions">
          <button class="icon-btn" data-action="search"><i data-lucide="search"></i></button>
          <button class="icon-btn" data-action="notif"><span class="dot"></span><i data-lucide="bell"></i></button>
          <div class="avatar" data-nav="settings">${(state.profile.name||'D').trim().charAt(0).toUpperCase()}</div>
        </div>
      </div>
      <div class="container" id="view-root">${inner}</div>
    </div>
  </div>
  <div class="bottom-nav">
    ${BOTTOM_NAV.map(n=>`<button class="bnav-item ${active===n.v?'active':''}" data-nav="${n.v==='more'?'more':n.v}"><i data-lucide="${n.icon}"></i>${n.label}</button>`).join('')}
  </div>
  <button class="fab" data-action="add-collab"><i data-lucide="plus"></i></button>
  `;
}
function topbarTitle(){
  const t={dashboard:'Good '+(new Date().getHours()<12?'morning':new Date().getHours()<18?'afternoon':'evening')+', '+ (state.profile.name||'Saturnvss').split(' ')[0]+' 🌸',
  collaborations:'Collaborations',calendar:'Calendar',invoices:'Invoices',payments:'Payments',history:'History',analytics:'Analytics',settings:'Settings',
  'collab-detail':'Collaboration','invoice-create':'Create Invoice','invoice-detail':'Invoice'};
  return t[route.view]||'Saturnvss';
}
function topbarSubtitle(){
  const t={dashboard:"Let's keep your collaborations organized.",collaborations:'Semua kerja sama dalam satu tempat.',calendar:'Deadline, upload, dan jadwal pembayaran.',
  invoices:'Buat dan kelola invoice profesional.',payments:'Pantau status pembayaran setiap kerja sama.',history:'Kerja sama yang sudah selesai.',analytics:'Ringkasan performa kerja sama.',
  settings:'Profil invoice & preferensi aplikasi.'};
  return t[route.view]||'';
}

/* ============ MAIN RENDER ============ */
function render(){
  let inner='';
  if(route.view==='dashboard')inner=viewDashboard();
  else if(route.view==='collaborations')inner=viewCollaborations();
  else if(route.view==='collab-detail')inner=viewCollabDetail(route.params.id);
  else if(route.view==='calendar')inner=viewCalendar();
  else if(route.view==='invoices')inner=viewInvoices();
  else if(route.view==='invoice-create')inner=viewInvoiceCreate(route.params.id);
  else if(route.view==='invoice-detail')inner=viewInvoiceDetail(route.params.id);
  else if(route.view==='payments')inner=viewPayments();
  else if(route.view==='history')inner=viewHistory();
  else if(route.view==='analytics')inner=viewAnalytics();
  else if(route.view==='settings')inner=viewSettings();
  else if(route.view==='more')inner=viewMore();
  else inner=viewDashboard();
  document.getElementById('app').innerHTML=shellHTML(inner);
  icons();
  afterRender();
}
function afterRender(){
  if(route.view==='analytics') drawCharts();
}

/* ============ VIEW: DASHBOARD ============ */
function viewDashboard(){
  const cs=state.collabs;
  const active=cs.filter(c=>!['Completed','Cancelled'].includes(c.status));
  const soon=cs.filter(c=>{const s=collabDeadlineState(c); return s==='soon'||s==='today'||s==='overdue';});
  const completed=cs.filter(c=>c.status==='Completed');
  const pendingPay=cs.filter(c=>c.payment.status!=='Paid'&&c.status!=='Cancelled');
  const earnings=cs.filter(c=>c.payment.status==='Paid').reduce((s,c)=>s+Number(c.fee||0),0);

  const stats=[
    ['heart-handshake',cs.length,'Total Collaboration'],
    ['zap',active.length,'Active'],
    ['clock',soon.length,'Deadline Soon'],
    ['check-circle-2',completed.length,'Completed'],
    ['banknote',pendingPay.length,'Pending Payment'],
    ['sparkles',rp(earnings),'Total Earnings'],
  ];
  const attention=cs.filter(c=>{
    if(c.status==='Cancelled')return false;
    const s=collabDeadlineState(c);
    return s==='overdue'||s==='today'||s==='soon'||c.status==='Revision'||c.status==='Waiting Upload'||(c.status==='Completed'&&c.payment.status!=='Paid');
  }).sort((a,b)=>daysUntil(a.deadline)-daysUntil(b.deadline));

  const upcoming=cs.filter(c=>!['Completed','Cancelled'].includes(c.status)).sort((a,b)=>new Date(a.deadline)-new Date(b.deadline)).slice(0,6);

  return `
  <div class="stat-grid">
    ${stats.map(s=>`<div class="card stat-card"><div class="top"><div class="icon-wrap"><i data-lucide="${s[0]}"></i></div></div><div class="value">${s[1]}</div><div class="label">${s[2]}</div></div>`).join('')}
  </div>

  <div class="section">
    <div class="section-head"><h2><i data-lucide="alert-circle" style="width:16px;height:16px;color:var(--overdue)"></i> Needs Attention</h2></div>
    ${attention.length===0?`<div class="card"><div class="empty-state" style="padding:34px 20px;"><i data-lucide="check-circle-2"></i><div class="t1">All caught up 🌸</div><div class="t2">Tidak ada yang butuh perhatian sekarang.</div></div></div>`:
      attention.slice(0,6).map(c=>attnCard(c)).join('')}
  </div>

  <div class="section">
    <div class="section-head"><h2><i data-lucide="calendar-clock" style="width:16px;height:16px"></i> Upcoming Deadlines</h2><a class="link" data-nav="calendar">View calendar</a></div>
    <div class="card" style="padding:6px 4px;">
      ${upcoming.length===0?`<div class="empty-state" style="padding:30px 20px;"><i data-lucide="calendar"></i><div class="t1">No deadlines yet</div></div>`:
      upcoming.map(c=>{
        const du=daysUntil(c.deadline); let tag=fmtDateShort(c.deadline);
        if(du===0)tag='Today'; else if(du===1)tag='Tomorrow'; else if(du<0)tag='Overdue';
        return `<div class="attn-card" style="border:none; border-bottom:1px solid var(--border); border-radius:0; margin-bottom:0; cursor:pointer;" data-nav="collab-detail" data-id="${c.id}">
          <div class="stripe" style="background:${du<0?'var(--overdue)':du===0?'var(--today)':du<=3?'var(--peach)':'var(--primary)'}"></div>
          <div class="body"><div class="brand">${esc(c.brand)}</div><div class="meta">${esc(c.type)} • ${tag}</div></div>
          ${statusBadge(c.status)}
        </div>`;
      }).join('')}
    </div>
  </div>
  `;
}
function attnCard(c){
  const s=collabDeadlineState(c);
  const stripe=s==='overdue'?'var(--overdue)':s==='today'?'var(--today)':s==='soon'?'var(--peach)':'var(--primary)';
  let reason=deadlineBadge(c);
  if(c.status==='Revision')reason=`<span class="badge badge-peach">Waiting revision</span>`;
  if(c.status==='Waiting Upload')reason=`<span class="badge badge-peach">Waiting upload</span>`;
  if(c.status==='Completed'&&c.payment.status!=='Paid')reason=`<span class="badge badge-overdue">Payment pending</span>`;
  return `<div class="attn-card">
    <div class="stripe" style="background:${stripe}"></div>
    <div class="body">
      <div class="brand">${esc(c.brand)}</div>
      <div class="meta">${esc(c.type)} • ${esc(c.platform)}</div>
      <div style="margin-top:6px;">${reason}</div>
      <div class="fee">${rp(c.fee)}</div>
    </div>
    <button class="go" data-nav="collab-detail" data-id="${c.id}">View</button>
  </div>`;
}

/* ============ VIEW: COLLABORATIONS ============ */
let collabFilter={status:'All',search:'',platform:'',type:'',sort:'deadline'};
function viewCollaborations(){
  let list=[...state.collabs];
  const f=collabFilter;
  if(f.status==='Active')list=list.filter(c=>!['Completed','Cancelled'].includes(c.status));
  else if(f.status==='Deadline Soon')list=list.filter(c=>['soon','today','overdue'].includes(collabDeadlineState(c)));
  else if(f.status==='Waiting Payment')list=list.filter(c=>c.payment.status!=='Paid'&&!['Cancelled'].includes(c.status));
  else if(f.status==='Completed')list=list.filter(c=>c.status==='Completed');
  else if(f.status==='Cancelled')list=list.filter(c=>c.status==='Cancelled');
  if(f.platform)list=list.filter(c=>c.platform===f.platform);
  if(f.type)list=list.filter(c=>c.type===f.type);
  if(f.search)list=list.filter(c=>(c.brand+c.pic+c.notes).toLowerCase().includes(f.search.toLowerCase()));
  if(f.sort==='deadline')list.sort((a,b)=>new Date(a.deadline)-new Date(b.deadline));
  else list.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));

  const chips=['All','Active','Deadline Soon','Waiting Payment','Completed','Cancelled'];
  return `
  <div class="filter-row">${chips.map(c=>`<button class="chip ${f.status===c?'active':''}" data-filter-status="${c}">${c}</button>`).join('')}</div>
  <div class="search-box"><i data-lucide="search"></i><input id="collab-search" placeholder="Cari brand, PIC, catatan..." value="${esc(f.search)}"></div>
  <div class="select-row">
    <select id="filter-platform"><option value="">All Platforms</option>${PLATFORM_LIST.map(p=>`<option ${f.platform===p?'selected':''}>${p}</option>`).join('')}</select>
    <select id="filter-type"><option value="">All Types</option>${TYPE_LIST.map(p=>`<option ${f.type===p?'selected':''}>${p}</option>`).join('')}</select>
    <select id="filter-sort"><option value="deadline" ${f.sort==='deadline'?'selected':''}>Sort: Deadline</option><option value="latest" ${f.sort==='latest'?'selected':''}>Sort: Latest</option></select>
  </div>

  ${list.length===0?`<div class="card"><div class="empty-state">
      <svg viewBox="0 0 100 100" fill="none"><path d="M50 10 C 30 20, 30 50, 50 90 C70 50, 70 20, 50 10 Z" stroke="currentColor" stroke-width="4"/></svg>
      <div class="t1">No collaborations yet 🌸</div><div class="t2">Your next collaboration starts here.</div>
      <button class="btn btn-primary btn-sm t1-btn" style="margin-top:14px" data-action="add-collab"><i data-lucide="plus"></i>Add Collaboration</button>
    </div></div>`:`
  <div class="collab-list mobile-only">
    ${list.map(c=>collabCard(c)).join('')}
  </div>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Brand</th><th>Type</th><th>Platform</th><th>Deadline</th><th>Fee</th><th>Status</th><th>Payment</th><th></th></tr></thead>
      <tbody>
        ${list.map(c=>`<tr style="cursor:pointer" data-nav="collab-detail" data-id="${c.id}">
          <td><strong>${esc(c.brand)}</strong></td><td>${esc(c.type)}</td><td>${esc(c.platform)}</td>
          <td>${deadlineBadge(c)||fmtDateShort(c.deadline)}</td><td class="fee">${rp(c.fee)}</td>
          <td>${statusBadge(c.status)}</td><td>${paymentBadge(c)}</td>
          <td><button class="btn btn-ghost btn-sm" data-nav="collab-detail" data-id="${c.id}">View</button></td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>`}
  `;
}
function collabCard(c){
  return `<div class="card collab-card" data-nav="collab-detail" data-id="${c.id}">
    <div class="row1"><div><div class="brand">${esc(c.brand)}</div><div class="type">${esc(c.type)} • ${esc(c.platform)}</div></div>${statusBadge(c.status)}</div>
    <div class="grid">
      <div><div class="k">Deadline</div><div class="v">${deadlineBadge(c)||fmtDateShort(c.deadline)}</div></div>
      <div><div class="k">Fee</div><div class="v">${rp(c.fee)}</div></div>
      <div><div class="k">Payment</div><div class="v">${paymentBadge(c)}</div></div>
    </div>
    <div class="actions"><button class="btn btn-ghost btn-sm btn-block" data-nav="collab-detail" 
