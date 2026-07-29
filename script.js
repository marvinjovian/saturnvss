// =========================================================
// Content Collaboration Manager — script.js
// =========================================================

const STORAGE_KEY = 'ccm_kerjasama_data';

const STATUS = {
  BARU: 'Baru Masuk',
  DIKERJAKAN: 'Sedang Dikerjakan',
  REVISI: 'Menunggu Revisi',
  UPLOAD: 'Menunggu Upload',
  BAYAR: 'Menunggu Pembayaran',
  SELESAI: 'Selesai'
};

const TIMELINE_STEPS = [
  { key: 'masuk', label: 'Kerja Sama Masuk' },
  { key: 'produk', label: 'Produk Diterima' },
  { key: 'konten', label: 'Konten Dibuat' },
  { key: 'kirim', label: 'Dikirim ke Brand' },
  { key: 'upload', label: 'Upload' },
  { key: 'bayar', label: 'Pembayaran' }
];

const BULAN_ID = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];

let data = [];
let currentFilter = 'semua';
let currentSearch = '';
let currentRiwayatSearch = '';
let currentDetailId = null;
let editingId = null;
let confirmCallback = null;
let bannerDismissed = false;
let toastTimeout = null;

// ===== Init =====
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  attachEventListeners();
  renderAll();
  refreshIcons();
});

function refreshIcons() {
  if (window.lucide) lucide.createIcons();
}

// ===== Storage =====
function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    data = raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Gagal memuat data:', e);
    data = [];
  }
}

function saveData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Gagal menyimpan data:', e);
    showToast('Gagal menyimpan data. Penyimpanan browser mungkin penuh.');
  }
}

function generateId() {
  return 'ks_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ===== Date / deadline helpers =====
function daysUntil(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + 'T00:00:00');
  return Math.round((target - today) / 86400000);
}

function isUrgent(item) {
  if (item.status === STATUS.SELESAI) return false;
  return daysUntil(item.deadline) <= 3 && daysUntil(item.deadline) >= 0;
}

function isOverdue(item) {
  if (item.status === STATUS.SELESAI) return false;
  return daysUntil(item.deadline) < 0;
}

function formatTanggal(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d)) return '-';
  return `${d.getDate()} ${BULAN_ID[d.getMonth()]} ${d.getFullYear()}`;
}

function formatRupiah(num) {
  const n = Number(num) || 0;
  return 'Rp' + n.toLocaleString('id-ID');
}

function deadlineLabel(item) {
  if (item.status === STATUS.SELESAI) return formatTanggal(item.deadline);
  const d = daysUntil(item.deadline);
  if (d < 0) return `Terlambat ${Math.abs(d)} hari`;
  if (d === 0) return 'Hari ini';
  if (d === 1) return '1 hari lagi';
  return `${d} hari lagi`;
}

function toWaLink(number) {
  let digits = (number || '').replace(/[^0-9]/g, '');
  if (digits.startsWith('0')) digits = '62' + digits.slice(1);
  return `https://wa.me/${digits}`;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

// ===== Status styling =====
function statusClass(item) {
  if (isOverdue(item)) return 'status-terlambat';
  if (item.status === STATUS.SELESAI) return 'status-selesai';
  if (item.status === STATUS.BAYAR) return 'status-pembayaran';
  if (isUrgent(item)) return 'status-deadline';
  if (item.status === STATUS.BARU) return 'status-baru';
  return 'status-dikerjakan';
}

function cardIcon(platform) {
  const map = { 'TikTok': 'video', 'Instagram': 'camera', 'Shopee': 'shopping-bag', 'Affiliate': 'link-2' };
  return map[platform] || 'sparkles';
}

// ===== Filtering =====
function getFilteredData() {
  let list = data.filter(i => i.status !== STATUS.SELESAI);
  switch (currentFilter) {
    case 'baru':
      list = list.filter(i => i.status === STATUS.BARU);
      break;
    case 'dikerjakan':
      list = list.filter(i => [STATUS.DIKERJAKAN, STATUS.REVISI, STATUS.UPLOAD].includes(i.status));
      break;
    case 'deadline':
      list = list.filter(i => isUrgent(i) || isOverdue(i));
      break;
    case 'pembayaran':
      list = list.filter(i => i.status === STATUS.BAYAR);
      break;
    default:
      break;
  }
  if (currentSearch.trim()) {
    const q = currentSearch.trim().toLowerCase();
    list = list.filter(i =>
      (i.brand || '').toLowerCase().includes(q) ||
      (i.pic || '').toLowerCase().includes(q) ||
      (i.platform || '').toLowerCase().includes(q)
    );
  }
  list.sort((a, b) => {
    const aOver = isOverdue(a), bOver = isOverdue(b);
    if (aOver !== bOver) return aOver ? -1 : 1;
    const aUrg = isUrgent(a), bUrg = isUrgent(b);
    if (aUrg !== bUrg) return aUrg ? -1 : 1;
    return new Date(a.deadline) - new Date(b.deadline);
  });
  return list;
}

function getRiwayatData() {
  let list = data.filter(i => i.status === STATUS.SELESAI);
  if (currentRiwayatSearch.trim()) {
    const q = currentRiwayatSearch.trim().toLowerCase();
    list = list.filter(i =>
      (i.brand || '').toLowerCase().includes(q) ||
      (i.pic || '').toLowerCase().includes(q) ||
      (i.platform || '').toLowerCase().includes(q)
    );
  }
  list.sort((a, b) => new Date(b.completedAt || b.deadline) - new Date(a.completedAt || a.deadline));
  return list;
}

// ===== Rendering =====
function renderAll() {
  renderSummary();
  renderCardGrid();
  renderRiwayat();
  checkReminder();
  refreshIcons();
}

function renderSummary() {
  const active = data.filter(i => i.status !== STATUS.SELESAI);
  document.getElementById('cntBaru').textContent = active.filter(i => i.status === STATUS.BARU).length;
  document.getElementById('cntDikerjakan').textContent = active.filter(i => [STATUS.DIKERJAKAN, STATUS.REVISI, STATUS.UPLOAD].includes(i.status)).length;
  document.getElementById('cntDeadline').textContent = active.filter(i => isUrgent(i) || isOverdue(i)).length;
  document.getElementById('cntPembayaran').textContent = active.filter(i => i.status === STATUS.BAYAR).length;
  document.getElementById('cntSelesai').textContent = data.filter(i => i.status === STATUS.SELESAI).length;
}

function cardTemplate(item) {
  const cls = statusClass(item);
  const urgent = isUrgent(item);
  const overdue = isOverdue(item);
  const initial = (item.brand || '?').trim().charAt(0).toUpperCase();
  let badge = '';
  if (overdue) badge = '<span class="badge badge-overdue">⚠️ Terlambat</span>';
  else if (urgent) badge = '<span class="badge badge-urgent">🔥 Deadline Dekat</span>';
  return `
    <article class="ks-card ${cls}" data-id="${item.id}" tabindex="0" role="button">
      ${badge}
      <div class="ks-card-top">
        <div class="ks-avatar">${initial}</div>
        <div class="ks-card-title">
          <h3>${escapeHtml(item.brand)}</h3>
          <span class="ks-platform"><i data-lucide="${cardIcon(item.platform)}"></i>${escapeHtml(item.platform || '-')}</span>
        </div>
      </div>
      <div class="ks-card-meta">
        <span class="ks-deadline"><i data-lucide="calendar"></i>${deadlineLabel(item)}</span>
        <span class="ks-fee">${formatRupiah(item.fee)}</span>
      </div>
      <span class="status-pill ${cls}">${escapeHtml(item.status)}</span>
    </article>
  `;
}

function renderCardGrid() {
  const grid = document.getElementById('cardGrid');
  const empty = document.getElementById('emptyState');
  const list = getFilteredData();
  const totalActive = data.filter(i => i.status !== STATUS.SELESAI).length;
  if (!list.length) {
    grid.innerHTML = '';
    empty.hidden = false;
    empty.querySelector('h3').textContent = totalActive === 0 ? 'Belum ada kerja sama' : 'Tidak ditemukan';
    empty.querySelector('p').textContent = totalActive === 0 ? 'Yuk tambahkan kerja sama pertamamu.' : 'Coba filter atau kata kunci lain.';
    return;
  }
  empty.hidden = true;
  grid.innerHTML = list.map(cardTemplate).join('');
}

function renderRiwayat() {
  const container = document.getElementById('riwayatList');
  const empty = document.getElementById('emptyRiwayat');
  const list = getRiwayatData();
  const totalSelesai = data.filter(i => i.status === STATUS.SELESAI).length;
  if (!list.length) {
    container.innerHTML = '';
    empty.hidden = false;
    empty.querySelector('h3').textContent = totalSelesai === 0 ? 'Belum ada riwayat' : 'Tidak ditemukan';
    empty.querySelector('p').textContent = totalSelesai === 0 ? 'Kerja sama yang selesai akan muncul di sini.' : 'Coba kata kunci lain.';
    return;
  }
  empty.hidden = true;
  container.innerHTML = list.map(item => `
    <article class="riwayat-item" data-id="${item.id}" tabindex="0" role="button">
      <div class="ks-avatar ks-avatar--sm">${(item.brand || '?').charAt(0).toUpperCase()}</div>
      <div class="riwayat-info">
        <h4>${escapeHtml(item.brand)}</h4>
        <span>${escapeHtml(item.platform || '-')} • Selesai ${formatTanggal(item.completedAt || item.deadline)}</span>
        ${item.catatan ? `<p class="riwayat-note">${escapeHtml(item.catatan)}</p>` : ''}
      </div>
      <div class="riwayat-fee">${formatRupiah(item.fee)}</div>
    </article>
  `).join('');
}

// ===== Detail view =====
function openDetail(id) {
  currentDetailId = id;
  const item = data.find(i => i.id === id);
  if (!item) return;
  renderDetail(item);
  switchView('detail');
}

function renderDetail(item) {
  const cls = statusClass(item);
  const container = document.getElementById('detailContent');
  container.innerHTML = `
    <div class="detail-hero">
      <div class="ks-avatar ks-avatar--lg">${(item.brand || '?').charAt(0).toUpperCase()}</div>
      <h2>${escapeHtml(item.brand)}</h2>
      <span class="status-pill ${cls}">${escapeHtml(item.status)}</span>
    </div>

    <div class="detail-grid">
      <div class="detail-field"><span>PIC</span><strong>${escapeHtml(item.pic) || '-'}</strong></div>
      <div class="detail-field"><span>Platform</span><strong>${escapeHtml(item.platform) || '-'}</strong></div>
      <div class="detail-field"><span>Jenis Kerja Sama</span><strong>${escapeHtml(item.jenis) || '-'}</strong></div>
      <div class="detail-field"><span>Deadline</span><strong>${formatTanggal(item.deadline)}</strong></div>
      <div class="detail-field"><span>Fee</span><strong>${formatRupiah(item.fee)}</strong></div>
      <div class="detail-field"><span>WhatsApp</span><strong>${escapeHtml(item.whatsapp) || '-'}</strong></div>
    </div>

    ${item.whatsapp ? `<a class="btn-wa" href="${toWaLink(item.whatsapp)}" target="_blank" rel="noopener"><i data-lucide="message-circle"></i>Chat via WhatsApp</a>` : ''}

    ${item.catatan ? `<div class="detail-note"><span>Catatan</span><p>${escapeHtml(item.catatan)}</p></div>` : ''}

    <div class="detail-status-update">
      <label for="fDetailStatus">Ubah Status</label>
      <select id="fDetailStatus">
        ${Object.values(STATUS).map(s => `<option ${s === item.status ? 'selected' : ''}>${s}</option>`).join('')}
      </select>
    </div>

    <div class="timeline">
      <h3>Timeline</h3>
      ${TIMELINE_STEPS.map(step => `
        <label class="timeline-step ${item.timeline[step.key] ? 'done' : ''}">
          <input type="checkbox" data-step="${step.key}" ${item.timeline[step.key] ? 'checked' : ''}>
          <span class="timeline-check"><i data-lucide="check"></i></span>
          <span>${step.label}</span>
        </label>
      `).join('')}
    </div>
  `;

  document.getElementById('fDetailStatus').addEventListener('change', (e) => {
    updateItemStatus(item.id, e.target.value);
  });

  container.querySelectorAll('.timeline-step').forEach(label => {
    const cb = label.querySelector('input');
    cb.addEventListener('change', () => {
      toggleTimelineStep(item.id, cb.dataset.step, cb.checked);
      label.classList.toggle('done', cb.checked);
    });
  });

  refreshIcons();
}

function updateItemStatus(id, newStatus) {
  const item = data.find(i => i.id === id);
  if (!item) return;
  const wasSelesai = item.status === STATUS.SELESAI;
  item.status = newStatus;
  if (newStatus === STATUS.SELESAI && !wasSelesai) {
    item.completedAt = new Date().toISOString().slice(0, 10);
  } else if (newStatus !== STATUS.SELESAI) {
    item.completedAt = null;
  }
  saveData();
  renderAll();
  if (newStatus === STATUS.SELESAI && !wasSelesai) {
    showToast('Kerja sama dipindahkan ke Riwayat ✅');
    switchView('dashboard');
  } else {
    renderDetail(item);
  }
}

function toggleTimelineStep(id, key, checked) {
  const item = data.find(i => i.id === id);
  if (!item) return;
  item.timeline[key] = checked;
  saveData();
}

// ===== View switching =====
function switchView(view) {
  document.getElementById('viewDashboard').hidden = view !== 'dashboard';
  document.getElementById('viewDetail').hidden = view !== 'detail';
  document.getElementById('viewRiwayat').hidden = view !== 'riwayat';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===== Reminder banner =====
function checkReminder() {
  const banner = document.getElementById('reminderBanner');
  const hasUrgent = data.some(i => i.status !== STATUS.SELESAI && isUrgent(i));
  banner.hidden = !(hasUrgent && !bannerDismissed);
}

// ===== Modal: Tambah / Edit =====
function openAddModal(editId = null) {
  editingId = editId;
  const form = document.getElementById('formKerjaSama');
  form.reset();
  if (editId) {
    const item = data.find(i => i.id === editId);
    document.getElementById('modalAddTitle').textContent = 'Edit Kerja Sama';
    document.getElementById('fBrand').value = item.brand || '';
    document.getElementById('fPic').value = item.pic || '';
    document.getElementById('fWa').value = item.whatsapp || '';
    document.getElementById('fPlatform').value = item.platform || 'TikTok';
    document.getElementById('fJenis').value = item.jenis || 'Endorsement';
    document.getElementById('fDeadline').value = item.deadline || '';
    document.getElementById('fFee').value = item.fee || 0;
    document.getElementById('fStatus').value = item.status || STATUS.BARU;
    document.getElementById('fCatatan').value = item.catatan || '';
  } else {
    document.getElementById('modalAddTitle').textContent = 'Tambah Kerja Sama';
  }
  document.getElementById('modalAdd').hidden = false;
  document.body.classList.add('modal-open');
}

function closeAddModal() {
  document.getElementById('modalAdd').hidden = true;
  document.body.classList.remove('modal-open');
  editingId = null;
}

function handleFormSubmit(e) {
  e.preventDefault();
  const brand = document.getElementById('fBrand').value.trim();
  const deadline = document.getElementById('fDeadline').value;
  if (!brand || !deadline) {
    showToast('Nama brand dan deadline wajib diisi ya 🌸');
    return;
  }
  const formData = {
    brand,
    pic: document.getElementById('fPic').value.trim(),
    whatsapp: document.getElementById('fWa').value.trim(),
    platform: document.getElementById('fPlatform').value,
    jenis: document.getElementById('fJenis').value,
    deadline,
    fee: Number(document.getElementById('fFee').value) || 0,
    status: document.getElementById('fStatus').value,
    catatan: document.getElementById('fCatatan').value.trim()
  };

  if (editingId) {
    const item = data.find(i => i.id === editingId);
    const wasSelesai = item.status === STATUS.SELESAI;
    Object.assign(item, formData);
    if (formData.status === STATUS.SELESAI && !wasSelesai) {
      item.completedAt = new Date().toISOString().slice(0, 10);
    } else if (formData.status !== STATUS.SELESAI) {
      item.completedAt = null;
    }
    showToast('Perubahan disimpan 🌸');
  } else {
    const newItem = {
      id: generateId(),
      ...formData,
      timeline: { masuk: true, produk: false, konten: false, kirim: false, upload: false, bayar: false },
      createdAt: new Date().toISOString(),
      completedAt: formData.status === STATUS.SELESAI ? new Date().toISOString().slice(0, 10) : null
    };
    data.push(newItem);
    showToast('Kerja sama baru ditambahkan 🌸');
  }
  saveData();
  closeAddModal();
  renderAll();
  if (currentDetailId === editingId) renderDetail(data.find(i => i.id === editingId));
}

// ===== Modal: Konfirmasi =====
function openConfirm(title, message, onYes) {
  document.getElementById('confirmTitle').textContent = title;
  document.getElementById('confirmMessage').textContent = message;
  confirmCallback = onYes;
  document.getElementById('modalConfirm').hidden = false;
  document.body.classList.add('modal-open');
}

function closeConfirm() {
  document.getElementById('modalConfirm').hidden = true;
  document.body.classList.remove('modal-open');
  confirmCallback = null;
}

function deleteItem(id) {
  openConfirm('Hapus Kerja Sama?', 'Data yang dihapus tidak bisa dikembalikan.', () => {
    data = data.filter(i => i.id !== id);
    saveData();
    closeConfirm();
    switchView('dashboard');
    renderAll();
    showToast('Kerja sama dihapus');
  });
}

function resetAllData() {
  openConfirm('Reset Semua Data?', 'Semua kerja sama akan dihapus permanen. Pastikan sudah backup data.', () => {
    data = [];
    saveData();
    closeConfirm();
    switchView('dashboard');
    renderAll();
    showToast('Semua data telah direset');
  });
}

// ===== Export / Import / Backup =====
function downloadJSON(filename, obj) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function exportData() {
  downloadJSON('kerjasama-export.json', data);
  showToast('Data berhasil diexport 🌸');
}

function backupData() {
  const today = new Date().toISOString().slice(0, 10);
  downloadJSON(`backup-kerjasama-${today}.json`, data);
  showToast('Backup berhasil dibuat 🌸');
}

function importData(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    let imported;
    try {
      imported = JSON.parse(e.target.result);
      if (!Array.isArray(imported)) throw new Error('Format tidak valid');
    } catch (err) {
      showToast('File tidak valid. Pastikan file JSON hasil export.');
      return;
    }
    openConfirm('Import Data?', `Ditemukan ${imported.length} data. Ini akan digabungkan dengan data yang ada.`, () => {
      const existingIds = new Set(data.map(i => i.id));
      let added = 0;
      imported.forEach(item => {
        if (item && item.id && !existingIds.has(item.id)) {
          data.push(item);
          added++;
        }
      });
      saveData();
      closeConfirm();
      renderAll();
      showToast(`${added} data berhasil diimport 🌸`);
    });
  };
  reader.readAsText(file);
}

// ===== Toast =====
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.hidden = false;
  requestAnimationFrame(() => toast.classList.add('show'));
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => { toast.hidden = true; }, 300);
  }, 2600);
}

// ===== Event listeners =====
function attachEventListeners() {
  document.getElementById('btnAdd').addEventListener('click', () => openAddModal());
  document.getElementById('btnCloseModalAdd').addEventListener('click', closeAddModal);
  document.getElementById('btnCancelForm').addEventListener('click', closeAddModal);
  document.getElementById('modalAdd').addEventListener('click', (e) => {
    if (e.target.id === 'modalAdd') closeAddModal();
  });
  document.getElementById('formKerjaSama').addEventListener('submit', handleFormSubmit);

  document.getElementById('modalConfirm').addEventListener('click', (e) => {
    if (e.target.id === 'modalConfirm') closeConfirm();
  });
  document.getElementById('btnConfirmCancel').addEventListener('click', closeConfirm);
  document.getElementById('btnConfirmYes').addEventListener('click', () => {
    if (confirmCallback) confirmCallback();
  });

  document.getElementById('searchInput').addEventListener('input', (e) => {
    currentSearch = e.target.value;
    renderCardGrid();
    refreshIcons();
  });

  document.getElementById('searchRiwayat').addEventListener('input', (e) => {
    currentRiwayatSearch = e.target.value;
    renderRiwayat();
  });

  document.getElementById('filterTabs').addEventListener('click', (e) => {
    const btn = e.target.closest('.filter-tab');
    if (!btn) return;
    const filter = btn.dataset.filter;
    if (filter === 'riwayat') { switchView('riwayat'); return; }
    currentFilter = filter;
    document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    renderCardGrid();
    refreshIcons();
  });

  document.getElementById('summaryGrid').addEventListener('click', (e) => {
    const btn = e.target.closest('.summary-card');
    if (!btn) return;
    const filter = btn.dataset.filter;
    if (filter === 'riwayat') { switchView('riwayat'); return; }
    currentFilter = filter;
    document.querySelectorAll('.filter-tab').forEach(t => t.classList.toggle('active', t.dataset.filter === filter));
    switchView('dashboard');
    renderCardGrid();
    refreshIcons();
  });

  document.getElementById('cardGrid').addEventListener('click', (e) => {
    const card = e.target.closest('.ks-card');
    if (card) openDetail(card.dataset.id);
  });
  document.getElementById('cardGrid').addEventListener('keypress', (e) => {
    if (e.key !== 'Enter') return;
    const card = e.target.closest('.ks-card');
    if (card) openDetail(card.dataset.id);
  });

  document.getElementById('riwayatList').addEventListener('click', (e) => {
    const item = e.target.closest('.riwayat-item');
    if (item) openDetail(item.dataset.id);
  });

  document.getElementById('btnBackFromDetail').addEventListener('click', () => switchView('dashboard'));
  document.getElementById('btnBackFromRiwayat').addEventListener('click', () => switchView('dashboard'));

  document.getElementById('btnEditDetail').addEventListener('click', () => {
    if (currentDetailId) openAddModal(currentDetailId);
  });
  document.getElementById('btnDeleteDetail').addEventListener('click', () => {
    if (currentDetailId) deleteItem(currentDetailId);
  });

  document.getElementById('btnCloseBanner').addEventListener('click', () => {
    bannerDismissed = true;
    document.getElementById('reminderBanner').hidden = true;
  });

  document.getElementById('btnBackup').addEventListener('click', backupData);
  document.getElementById('btnExport').addEventListener('click', exportData);
  document.getElementById('btnImport').addEventListener('click', () => {
    document.getElementById('importFileInput').click();
  });
  document.getElementById('importFileInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) importData(file);
    e.target.value = '';
  });
  document.getElementById('btnReset').addEventListener('click', resetAllData);

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (!document.getElementById('modalAdd').hidden) closeAddModal();
    if (!document.getElementById('modalConfirm').hidden) closeConfirm();
  });
}
