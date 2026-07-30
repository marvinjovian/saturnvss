/* ==========================================================================
   App — routing, state, event wiring
   ========================================================================== */
const App = (function () {
  const U = Utils;
  let state = {
    page: 'dashboard',
    filters: { search: '', status: '', platform: '', type: '', sort: 'deadline' },
    historySearch: '',
    calYear: new Date().getFullYear(),
    calMonth: new Date().getMonth(),
    calSelectedDay: null,
    editingId: null,
  };

  const els = {};

  function init() {
    els.pageRoot = document.getElementById('pageRoot');
    els.modalOverlay = document.getElementById('modalOverlay');
    els.modalBox = document.getElementById('modalBox');
    els.toastWrap = document.getElementById('toastWrap');
    els.notifPanel = document.getElementById('notifPanel');

    wireNav();
    wireGlobalEvents();
    wireGlobalSearch();
    setGreeting();
    route('dashboard');

    window.addEventListener('hashchange', () => {
      const p = location.hash.replace('#', '') || 'dashboard';
      if (p.startsWith('detail/')) {
        renderDetail(p.split('/')[1]);
      } else {
        route(p);
      }
    });
  }

  function setGreeting() {
    const hr = new Date().getHours();
    const greet = hr < 11 ? 'Good morning' : hr < 15 ? 'Good afternoon' : hr < 19 ? 'Good evening' : 'Good night';
    document.querySelectorAll('.js-greeting').forEach((el) => { el.textContent = `${greet}, Dwi 🌸`; });
  }

  /* ---------------- Navigation ---------------- */
  function wireNav() {
    document.querySelectorAll('[data-nav]').forEach((el) => {
      el.addEventListener('click', () => route(el.getAttribute('data-nav')));
    });
  }

  function wireGlobalSearch() {
    const gs = document.getElementById('globalSearch');
    if (!gs) return;
    gs.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && gs.value.trim()) {
        state.filters.search = gs.value.trim();
        route('collabs');
      }
    });
  }

  function setActiveNav(page) {
    document.querySelectorAll('.nav-item[data-nav], .bn-item[data-nav]').forEach((el) => {
      el.classList.toggle('active', el.getAttribute('data-nav') === page);
    });
  }

  function route(page) {
    state.page = page;
    location.hash = page;
    setActiveNav(page);
    closeNotif();
    switch (page) {
      case 'dashboard': return renderDashboard();
      case 'collabs': return renderCollabs();
      case 'calendar': return renderCalendar();
      case 'history': return renderHistory();
      case 'analytics': return renderAnalytics();
      case 'settings': return renderSettings();
      default: return renderDashboard();
    }
  }

  /* ---------------- Data helpers ---------------- */
  function computeStats(items) {
    const total = items.length;
    const active = items.filter((i) => !['Completed', 'Cancelled'].includes(i.status)).length;
    const deadlineSoon = items.filter((i) => {
      if (['Completed', 'Cancelled'].includes(i.status)) return false;
      const d = U.daysUntil(i.deadline);
      return d >= 0 && d <= 3;
    }).length;
    const completed = items.filter((i) => i.status === 'Completed').length;
    const pendingPayment = items.filter((i) => i.status === 'Waiting Payment').length;
    return { total, active, deadlineSoon, completed, pendingPayment, activeDelta: null };
  }

  function needsAttention(items) {
    return items.filter((i) => {
      if (['Completed', 'Cancelled'].includes(i.status)) return false;
      const d = U.daysUntil(i.deadline);
      return d <= 3 || i.status === 'Revision' || i.status === 'Waiting Payment';
    }).sort((a, b) => U.daysUntil(a.deadline) - U.daysUntil(b.deadline));
  }

  function upcoming(items) {
    return items.filter((i) => !['Completed', 'Cancelled'].includes(i.status))
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
  }

  function buildNotifications(items) {
    const notifs = [];
    items.forEach((i) => {
      if (['Completed', 'Cancelled'].includes(i.status)) return;
      const d = U.daysUntil(i.deadline);
      if (d === 1) notifs.push({ id: i.id, text: `Deadline ${U.escapeHtml(i.brand)} besok.` });
      if (d < 0) notifs.push({ id: i.id, text: `Campaign ${U.escapeHtml(i.brand)} sudah lewat deadline.` });
      if (i.status === 'Waiting Payment') notifs.push({ id: i.id, text: `Pembayaran dari ${U.escapeHtml(i.brand)} masih pending.` });
    });
    return notifs.slice(0, 12);
  }

  function applyFilters(items) {
    const f = state.filters;
    let out = items.slice();
    if (f.search) {
      const q = f.search.toLowerCase();
      out = out.filter((i) =>
        (i.brand || '').toLowerCase().includes(q) ||
        (i.contactPerson || '').toLowerCase().includes(q) ||
        (i.platform || '').toLowerCase().includes(q) ||
        (i.type || '').toLowerCase().includes(q) ||
        (i.notes || []).some((n) => n.text.toLowerCase().includes(q))
      );
    }
    if (f.status) out = out.filter((i) => U.effectiveStatus(i) === f.status);
    if (f.platform) out = out.filter((i) => i.platform === f.platform);
    if (f.type) out = out.filter((i) => i.type === f.type);
    if (f.sort === 'deadline') out.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
    else out.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return out;
  }

  /* ---------------- Page renders ---------------- */
  function renderDashboard() {
    const items = Storage.all();
    const ctx = {
      stats: computeStats(items),
      needsAttention: needsAttention(items).slice(0, 5),
      recent: items.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5),
      upcoming: upcoming(items),
    };
    els.pageRoot.innerHTML = Render.dashboardPage(ctx);
    refreshNotifBadge(items);
  }

  function renderCollabs() {
    const items = applyFilters(Storage.all());
    els.pageRoot.innerHTML = Render.collabsPage({ items, filters: state.filters });
    wireFilters();
  }

  function wireFilters() {
    const searchEl = document.getElementById('collabSearch');
    if (searchEl) {
      searchEl.addEventListener('input', U.debounce((e) => {
        state.filters.search = e.target.value;
        renderCollabs();
        document.getElementById('collabSearch').focus();
        const val = document.getElementById('collabSearch');
        if (val) val.setSelectionRange(val.value.length, val.value.length);
      }, 300));
    }
    ['filterStatus', 'filterPlatform', 'filterType', 'sortBy'].forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('change', (e) => {
        const map = { filterStatus: 'status', filterPlatform: 'platform', filterType: 'type', sortBy: 'sort' };
        state.filters[map[id]] = e.target.value;
        renderCollabs();
      });
    });
  }

  function renderDetail(id) {
    const item = Storage.get(id);
    if (!item) { route('collabs'); return; }
    state.page = 'detail';
    setActiveNav('collabs');
    els.pageRoot.innerHTML = Render.detailPage(item);
    const sel = document.getElementById('statusSelect');
    if (sel) sel.addEventListener('change', (e) => {
      Storage.update(id, { status: e.target.value });
      toast('Status updated');
      renderDetail(id);
    });
  }

  function renderCalendar() {
    const items = Storage.all();
    const year = state.calYear, month = state.calMonth;
    const first = new Date(year, month, 1);
    const startDow = first.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayStr = new Date().toISOString().slice(0, 10);
    const cells = [];
    for (let i = 0; i < startDow; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayItems = items.filter((it) => it.deadline === dateStr);
      const dots = [...new Set(dayItems.map((it) => U.deadlineUrgency(it.deadline, ['Completed','Cancelled'].includes(it.status))))];
      cells.push({ day: d, dateStr, isToday: dateStr === todayStr, dots });
    }
    const monthLabel = first.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    els.pageRoot.innerHTML = Render.calendarPage({ year, month, cells, monthLabel });
    if (state.calSelectedDay) {
      const dayItems = items.filter((it) => it.deadline === state.calSelectedDay);
      document.getElementById('calDayDetail').innerHTML = Render.calDayDetail(state.calSelectedDay, dayItems);
    }
  }

  function renderHistory() {
    const items = Storage.all().filter((i) => i.status === 'Completed');
    let filtered = items;
    if (state.historySearch) {
      const q = state.historySearch.toLowerCase();
      filtered = items.filter((i) => (i.brand || '').toLowerCase().includes(q) || (i.type||'').toLowerCase().includes(q));
    }
    const total = items.reduce((s, i) => s + (Number(i.fee) || 0), 0);
    const avg = items.length ? Math.round(total / items.length) : 0;
    els.pageRoot.innerHTML = Render.historyPage({ items: filtered, count: items.length, total, avg, search: state.historySearch });
    const searchEl = document.getElementById('historySearch');
    if (searchEl) searchEl.addEventListener('input', U.debounce((e) => {
      state.historySearch = e.target.value;
      renderHistory();
    }, 300));
  }

  function renderAnalytics() {
    const items = Storage.all();
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const dt = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ y: dt.getFullYear(), m: dt.getMonth(), label: dt.toLocaleDateString('en-GB', { month: 'short' }) });
    }
    const byMonth = months.map((mo) => ({
      label: mo.label,
      count: items.filter((i) => {
        const c = new Date(i.createdAt);
        return c.getFullYear() === mo.y && c.getMonth() === mo.m;
      }).length,
    }));
    const platforms = ['TikTok', 'Instagram', 'Shopee', 'YouTube', 'Other'];
    const byPlatform = platforms.map((p) => ({ label: p, count: items.filter((i) => i.platform === p).length }));
    const types = ['Endorsement', 'Paid Promote', 'Affiliate', 'Campaign', 'Product Exchange', 'Other'];
    const byType = types.map((t) => ({ label: t, count: items.filter((i) => i.type === t).length }));
    const totalEarnings = items.filter((i) => i.status === 'Completed').reduce((s, i) => s + (Number(i.fee) || 0), 0);
    els.pageRoot.innerHTML = Render.analyticsPage({ byMonth, byPlatform, byType, totalEarnings });
  }

  function renderSettings() {
    els.pageRoot.innerHTML = Render.settingsPage();
  }

  /* ---------------- Notifications ---------------- */
  function refreshNotifBadge(items) {
    items = items || Storage.all();
    const notifs = buildNotifications(items);
    const dots = document.querySelectorAll('.notif-dot');
    dots.forEach((d) => d.style.display = notifs.length ? 'block' : 'none');
  }

  function toggleNotif() {
    const items = Storage.all();
    const notifs = buildNotifications(items);
    els.notifPanel.innerHTML = Render.notifPanel(notifs);
    els.notifPanel.classList.toggle('open');
  }
  function closeNotif() { els.notifPanel && els.notifPanel.classList.remove('open'); }

  /* ---------------- Modal ---------------- */
  function openModal(html) {
    els.modalBox.innerHTML = html;
    els.modalOverlay.classList.add('open');
  }
  function closeModal() {
    els.modalOverlay.classList.remove('open');
  }

  function openAddCollab(existing) {
    state.editingId = existing ? existing.id : null;
    openModal(Render.addCollabModal(existing));
    const form = document.getElementById('collabForm');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const payload = {
        brand: fd.get('brand').trim(),
        contactPerson: fd.get('contactPerson').trim(),
        whatsapp: fd.get('whatsapp').trim(),
        type: fd.get('type'),
        platform: fd.get('platform'),
        deadline: fd.get('deadline'),
        fee: Number(fd.get('fee')) || 0,
        status: fd.get('status'),
      };
      const notesText = (fd.get('notesText') || '').trim();
      if (state.editingId) {
        Storage.update(state.editingId, payload);
        if (notesText) Storage.addNote(state.editingId, notesText);
        toast('Collaboration updated');
      } else {
        const created = Storage.create(payload);
        if (notesText) Storage.addNote(created.id, notesText);
        toast('Collaboration added');
      }
      closeModal();
      route(state.page === 'detail' ? 'collabs' : state.page);
    });
  }

  /* ---------------- Toast ---------------- */
  function toast(msg, type) {
    const el = document.createElement('div');
    el.className = 'toast' + (type === 'error' ? ' error' : '');
    el.textContent = msg;
    els.toastWrap.appendChild(el);
    setTimeout(() => { el.remove(); }, 2600);
  }

  /* ---------------- Global click delegation ---------------- */
  function wireGlobalEvents() {
    document.addEventListener('click', (e) => {
      const openId = e.target.closest('[data-open]');
      const navEl = e.target.closest('[data-nav]');
      const actionEl = e.target.closest('[data-action]');
      const calDay = e.target.closest('[data-cal-day]');

      if (openId && openId.getAttribute('data-open')) {
        const id = openId.getAttribute('data-open');
        location.hash = 'detail/' + id;
        renderDetail(id);
        return;
      }

      if (calDay) {
        state.calSelectedDay = calDay.getAttribute('data-cal-day');
        renderCalendar();
        return;
      }

      if (actionEl) {
        const action = actionEl.getAttribute('data-action');
        const id = actionEl.getAttribute('data-id');
        handleAction(action, id, actionEl);
        return;
      }

      // click outside modal box closes it
      if (e.target === els.modalOverlay) closeModal();

      // click outside notif panel closes it
      if (els.notifPanel && els.notifPanel.classList.contains('open')) {
        if (!e.target.closest('#notifPanel') && !e.target.closest('[data-action="toggleNotif"]')) {
          closeNotif();
        }
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { closeModal(); closeNotif(); }
    });
  }

  function handleAction(action, id, el) {
    switch (action) {
      case 'addCollab':
        openAddCollab(null);
        break;
      case 'editCollab':
        openAddCollab(Storage.get(id));
        break;
      case 'closeModal':
        closeModal();
        break;
      case 'toggleNotif':
        toggleNotif();
        break;
      case 'toggleCheck': {
        const checkId = el.getAttribute('data-check');
        Storage.toggleCheck(id, checkId);
        renderDetail(id);
        break;
      }
      case 'addNote': {
        const ta = document.getElementById('newNoteText');
        const text = ta.value.trim();
        if (!text) return;
        Storage.addNote(id, text);
        toast('Note added');
        renderDetail(id);
        break;
      }
      case 'deleteCollab':
        openModal(Render.confirmModal('Delete collaboration?', 'This cannot be undone. All notes and progress will be lost.', 'confirmDelete', id));
        break;
      case 'confirmDelete':
        Storage.remove(id);
        closeModal();
        toast('Collaboration deleted');
        route('collabs');
        break;
      case 'calPrev':
        state.calMonth--; if (state.calMonth < 0) { state.calMonth = 11; state.calYear--; }
        state.calSelectedDay = null;
        renderCalendar();
        break;
      case 'calNext':
        state.calMonth++; if (state.calMonth > 11) { state.calMonth = 0; state.calYear++; }
        state.calSelectedDay = null;
        renderCalendar();
        break;
      case 'calToday':
        state.calYear = new Date().getFullYear();
        state.calMonth = new Date().getMonth();
        state.calSelectedDay = new Date().toISOString().slice(0, 10);
        renderCalendar();
        break;
      case 'exportBackup': {
        const dataStr = Storage.exportJSON();
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dwi-dashboard-backup-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast('Backup exported');
        break;
      }
      case 'importBackup':
        document.getElementById('importFile').click();
        document.getElementById('importFile').onchange = (ev) => {
          const file = ev.target.files[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = () => {
            try {
              Storage.importJSON(reader.result);
              toast('Backup imported');
              route('dashboard');
            } catch (err) {
              toast('Invalid backup file', 'error');
            }
          };
          reader.readAsText(file);
        };
        break;
      case 'resetData':
        openModal(Render.confirmModal('Reset all data?', 'This will permanently delete every collaboration. This cannot be undone.', 'confirmReset'));
        break;
      case 'confirmReset':
        Storage.resetAll();
        closeModal();
        toast('All data has been reset');
        route('dashboard');
        break;
    }
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', App.init);
