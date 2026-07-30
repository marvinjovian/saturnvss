/* ==========================================================================
   Render — pure-ish functions that turn data into HTML strings
   ========================================================================== */
const Render = (function () {
  const U = Utils;

  function statusBadge(item) {
    const st = U.effectiveStatus(item);
    return `<span class="badge ${U.statusClass(st)}">${st}</span>`;
  }

  function brandAvatar(brand, cls) {
    return `<div class="brand-avatar ${cls || ''}">${U.icon ? U.initials(brand) : ''}</div>`;
  }

  /* ---------------- Stat cards ---------------- */
  function statCards(stats) {
    const defs = [
      { label: 'Total Collaboration', value: stats.total, icon: 'collab', color: '#F3A9C4', bg: '#FCE7EF', delta: null },
      { label: 'Active', value: stats.active, icon: 'flag', color: '#9B7FD4', bg: '#F1EAFB', delta: stats.activeDelta },
      { label: 'Deadline Soon', value: stats.deadlineSoon, icon: 'calendar', color: '#E8A85C', bg: '#FDEFE0', delta: null },
      { label: 'Completed', value: stats.completed, icon: 'check', color: '#6FBF8B', bg: '#E4F5EA', delta: null },
      { label: 'Pending Payment', value: stats.pendingPayment, icon: 'wallet', color: '#A97C6B', bg: '#F1E7E1', delta: null },
    ];
    return defs.map((d) => `
      <div class="stat-card fade-in">
        <div class="stat-icon" style="background:${d.bg};color:${d.color}">${U.icon(d.icon)}</div>
        <div class="stat-value">${d.value}</div>
        <div class="stat-label">${d.label}</div>
        ${d.delta ? `<div class="stat-delta">${d.delta}</div>` : ''}
      </div>
    `).join('');
  }

  /* ---------------- Needs attention ---------------- */
  function needsAttentionList(items) {
    if (!items.length) {
      return `<div class="empty-mini">Nothing urgent right now 🌸<br>You're all caught up.</div>`;
    }
    return items.map((item) => {
      const urgency = U.deadlineUrgency(item.deadline, false);
      return `
      <div class="attn-item" data-open="${item.id}">
        <div class="brand-avatar">${U.initials(item.brand)}</div>
        <div class="attn-main">
          <div class="attn-brand">${U.escapeHtml(item.brand)}</div>
          <div class="attn-meta">${U.escapeHtml(item.type)} · ${U.escapeHtml(item.platform)}</div>
        </div>
        <div class="attn-right">
          <span class="deadline-chip deadline-${urgency}">${U.deadlineLabel(item.deadline, false)}</span>
          <div class="fee-text">${U.rupiah(item.fee)}</div>
        </div>
      </div>`;
    }).join('');
  }

  /* ---------------- Recent collaborations (desktop table + mobile cards) ---------------- */
  function collabTableRows(items, opts) {
    opts = opts || {};
    if (!items.length) return '';
    return items.map((item) => `
      <div class="collab-row desktop-only" data-open="${item.id}">
        <div class="collab-brand-cell">
          <div class="brand-avatar">${U.initials(item.brand)}</div>
          <div>
            <div class="name">${U.escapeHtml(item.brand)}</div>
            <div class="sub">${U.escapeHtml(item.type)}</div>
          </div>
        </div>
        <div class="cell-muted">${U.escapeHtml(item.platform)}</div>
        <div class="cell-muted">${U.formatDate(item.deadline)}</div>
        <div class="cell-fee">${U.rupiah(item.fee)}</div>
        <div>${statusBadge(item)}</div>
        <div class="desktop-only" style="text-align:right;">
          <button class="btn btn-ghost btn-sm" data-open="${item.id}">View</button>
        </div>
      </div>
    `).join('');
  }

  function collabMobileCards(items) {
    if (!items.length) return '';
    return items.map((item) => `
      <div class="mobile-collab-card mobile-only" data-open="${item.id}">
        <div class="mcc-top">
          <div class="brand-avatar">${U.initials(item.brand)}</div>
          <div class="mcc-brand">${U.escapeHtml(item.brand)}</div>
          ${statusBadge(item)}
        </div>
        <div class="mcc-meta-row"><span>${U.escapeHtml(item.type)} · ${U.escapeHtml(item.platform)}</span><span>${U.rupiah(item.fee)}</span></div>
        <div class="mcc-meta-row"><span>Deadline</span><span>${U.formatDate(item.deadline)}</span></div>
      </div>
    `).join('');
  }

  function collabListBlock(items) {
    return `
      <div class="collab-table-head desktop-only">
        <div>Brand</div><div>Platform</div><div>Deadline</div><div>Fee</div><div>Status</div><div></div>
      </div>
      ${collabTableRows(items)}
      ${collabMobileCards(items)}
    `;
  }

  /* ---------------- Dashboard page ---------------- */
  function dashboardPage(ctx) {
    return `
      <div class="page-header">
        <h1 class="page-title">Dashboard</h1>
        <p class="page-desc desktop-only">Everything you're working on, at a glance.</p>
      </div>

      <div class="stats-row desktop-only">${statCards(ctx.stats)}</div>
      <div class="stats-scroll mobile-only">${statCards(ctx.stats)}</div>

      <div class="dash-grid">
        <div>
          <div class="card" style="margin-bottom:18px;">
            <div class="section-title">Needs Attention</div>
            ${needsAttentionList(ctx.needsAttention)}
          </div>
          <div class="card">
            <div class="section-title">
              Recent Collaborations
              <button class="btn btn-outline btn-sm" data-nav="collabs">See all</button>
            </div>
            ${ctx.recent.length ? collabListBlock(ctx.recent) : `<div class="empty-mini">No collaborations yet 🌸</div>`}
          </div>
        </div>
        <div>
          <div class="card">
            <div class="section-title">Upcoming Deadlines</div>
            ${upcomingMini(ctx.upcoming)}
          </div>
        </div>
      </div>
    `;
  }

  function upcomingMini(items) {
    if (!items.length) return `<div class="empty-mini">No upcoming deadlines.</div>`;
    return items.slice(0, 6).map((item) => {
      const urgency = U.deadlineUrgency(item.deadline, false);
      return `
      <div class="attn-item" data-open="${item.id}" style="padding:10px 8px;">
        <div class="brand-avatar" style="width:34px;height:34px;font-size:12px;">${U.initials(item.brand)}</div>
        <div class="attn-main">
          <div class="attn-brand" style="font-size:13px;">${U.escapeHtml(item.brand)}</div>
          <div class="attn-meta">${U.formatDate(item.deadline)}</div>
        </div>
        <span class="deadline-chip deadline-${urgency}">${U.deadlineLabel(item.deadline, false)}</span>
      </div>`;
    }).join('');
  }

  /* ---------------- Collaboration Management page ---------------- */
  function collabsPage(ctx) {
    return `
      <div class="page-header">
        <h1 class="page-title">Kerja Sama</h1>
        <p class="page-desc">All your brand collaborations in one place.</p>
      </div>
      <div class="toolbar">
        <div class="search-box">${U.icon('search')}<input id="collabSearch" placeholder="Search brand, PIC, notes..." value="${U.escapeHtml(ctx.filters.search || '')}"></div>
        <select class="filter-select" id="filterStatus">
          <option value="">All Status</option>
          ${Object.values(Storage.STATUS).map((s) => `<option value="${s}" ${ctx.filters.status === s ? 'selected' : ''}>${s}</option>`).join('')}
        </select>
        <select class="filter-select" id="filterPlatform">
          <option value="">All Platforms</option>
          ${['TikTok', 'Instagram', 'Shopee', 'YouTube', 'Other'].map((p) => `<option value="${p}" ${ctx.filters.platform === p ? 'selected' : ''}>${p}</option>`).join('')}
        </select>
        <select class="filter-select" id="filterType">
          <option value="">All Types</option>
          ${['Endorsement', 'Paid Promote', 'Affiliate', 'Campaign', 'Product Exchange', 'Other'].map((t) => `<option value="${t}" ${ctx.filters.type === t ? 'selected' : ''}>${t}</option>`).join('')}
        </select>
        <select class="filter-select" id="sortBy">
          <option value="deadline" ${ctx.filters.sort === 'deadline' ? 'selected' : ''}>Sort by Deadline</option>
          <option value="latest" ${ctx.filters.sort === 'latest' ? 'selected' : ''}>Sort by Latest</option>
        </select>
        <div class="toolbar-spacer desktop-only"></div>
        <button class="btn btn-primary desktop-only" data-action="addCollab">${U.icon('plus')} Add Collaboration</button>
      </div>
      <div class="card">
        ${ctx.items.length ? collabListBlock(ctx.items) : emptyState()}
      </div>
    `;
  }

  /* ---------------- Detail page ---------------- */
  function detailPage(item) {
    const pct = U.progressPct(item.checklist);
    const st = U.effectiveStatus(item);
    return `
      <div class="page-header">
        <button class="btn btn-outline btn-sm" data-nav="collabs">${U.icon('chevronLeft')} Back</button>
      </div>
      <div class="detail-header">
        <div class="detail-header-left">
          <div class="brand-avatar detail-brand-avatar">${U.initials(item.brand)}</div>
          <div>
            <h2 class="detail-name">${U.escapeHtml(item.brand)}</h2>
            <div class="detail-sub">
              ${statusBadge(item)}
              <span>Deadline: ${U.formatDate(item.deadline)}</span>
              <span>${U.rupiah(item.fee)}</span>
            </div>
          </div>
        </div>
        <div style="display:flex;gap:8px;">
          <select class="filter-select" id="statusSelect">
            ${Object.values(Storage.STATUS).filter(s=>s!=='Overdue').map((s) => `<option value="${s}" ${item.status === s ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
          <button class="btn btn-danger btn-sm" data-action="deleteCollab" data-id="${item.id}">${U.icon('trash')}</button>
        </div>
      </div>

      <div class="detail-grid">
        <div>
          <div class="card" style="margin-bottom:18px;">
            <div class="section-title">Collaboration Information</div>
            <div class="info-list">
              <div class="info-row"><span class="k">Brand</span><span class="v">${U.escapeHtml(item.brand)}</span></div>
              <div class="info-row"><span class="k">PIC</span><span class="v">${U.escapeHtml(item.contactPerson || '-')}</span></div>
              <div class="info-row"><span class="k">WhatsApp</span><span class="v">${U.escapeHtml(item.whatsapp || '-')}</span></div>
              <div class="info-row"><span class="k">Platform</span><span class="v">${U.escapeHtml(item.platform)}</span></div>
              <div class="info-row"><span class="k">Type</span><span class="v">${U.escapeHtml(item.type)}</span></div>
              <div class="info-row"><span class="k">Deadline</span><span class="v">${U.formatDate(item.deadline)}</span></div>
              <div class="info-row"><span class="k">Fee</span><span class="v">${U.rupiah(item.fee)}</span></div>
            </div>
          </div>

          <div class="card">
            <div class="section-title">Notes &amp; History</div>
            <div class="notes-list">
              ${(item.notes && item.notes.length) ? item.notes.map((n) => `
                <div class="note-item">
                  <div class="note-ts">${U.formatDateTime(n.ts)}</div>
                  <div class="note-text">${U.escapeHtml(n.text)}</div>
                </div>`).join('') : `<div class="empty-mini">No notes yet.</div>`}
            </div>
            <div class="note-input-row">
              <textarea id="newNoteText" placeholder="Add a note, e.g. 'Brand minta revisi caption.'"></textarea>
              <button class="btn btn-primary" data-action="addNote" data-id="${item.id}">Add</button>
            </div>
          </div>
        </div>

        <div>
          <div class="card">
            <div class="section-title">Progress</div>
            <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
            <div class="progress-pct">${pct}%</div>
            <div class="checklist">
              ${item.checklist.map((c) => `
                <div class="check-item ${c.done ? 'checked' : ''}" data-action="toggleCheck" data-id="${item.id}" data-check="${c.id}">
                  <div class="check-box">${U.icon('check')}</div>
                  <div class="check-label">${U.escapeHtml(c.label)}</div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /* ---------------- Calendar page ---------------- */
  function calendarPage(ctx) {
    const { year, month, cells, monthLabel } = ctx;
    const dow = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return `
      <div class="page-header">
        <h1 class="page-title">Calendar</h1>
        <p class="page-desc">Every deadline, mapped out.</p>
      </div>
      <div class="card">
        <div class="calendar-head">
          <h3 class="display" style="font-size:19px;">${monthLabel}</h3>
          <div class="calendar-nav">
            <button class="btn btn-outline btn-sm" data-action="calPrev">${U.icon('chevronLeft')}</button>
            <button class="btn btn-outline btn-sm" data-action="calToday">Today</button>
            <button class="btn btn-outline btn-sm" data-action="calNext">${U.icon('chevronRight')}</button>
          </div>
        </div>
        <div class="cal-grid">
          ${dow.map((d) => `<div class="cal-dow">${d}</div>`).join('')}
          ${cells.map((c) => {
            if (!c) return `<div class="cal-cell empty"></div>`;
            const isToday = c.isToday ? 'today' : '';
            return `
            <div class="cal-cell ${isToday}" data-cal-day="${c.dateStr}">
              <div class="cal-daynum">${c.day}</div>
              <div class="cal-dot-row">${c.dots.map((u) => `<div class="cal-dot ${u}"></div>`).join('')}</div>
            </div>`;
          }).join('')}
        </div>
      </div>
      <div id="calDayDetail"></div>
    `;
  }

  function calDayDetail(dateStr, items) {
    if (!items.length) return '';
    return `
      <div class="card fade-in" style="margin-top:18px;">
        <div class="section-title">${U.formatDate(dateStr, { day: '2-digit', month: 'long', year: 'numeric' })}</div>
        ${collabListBlock(items)}
      </div>
    `;
  }

  /* ---------------- History page ---------------- */
  function historyPage(ctx) {
    return `
      <div class="page-header">
        <h1 class="page-title">History</h1>
        <p class="page-desc">Completed collaborations and earnings.</p>
      </div>
      <div class="history-stats">
        <div class="card"><div class="stat-label">Total Completed</div><div class="stat-value">${ctx.count}</div></div>
        <div class="card"><div class="stat-label">Total Earnings</div><div class="earnings-big">${U.rupiah(ctx.total)}</div></div>
        <div class="card"><div class="stat-label">Average Collaboration</div><div class="stat-value" style="font-size:20px;">${U.rupiah(ctx.avg)}</div></div>
      </div>
      <div class="toolbar">
        <div class="search-box">${U.icon('search')}<input id="historySearch" placeholder="Search completed collaborations..." value="${U.escapeHtml(ctx.search || '')}"></div>
      </div>
      <div class="card">
        ${ctx.items.length ? collabListBlock(ctx.items) : `<div class="empty-mini">No completed collaborations yet.</div>`}
      </div>
    `;
  }

  /* ---------------- Analytics page ---------------- */
  function analyticsPage(ctx) {
    const maxMonth = Math.max(1, ...ctx.byMonth.map((m) => m.count));
    const maxPlat = Math.max(1, ...ctx.byPlatform.map((p) => p.count));
    const maxType = Math.max(1, ...ctx.byType.map((t) => t.count));
    return `
      <div class="page-header">
        <h1 class="page-title">Analytics</h1>
        <p class="page-desc">A quiet look at how your work is going.</p>
      </div>
      <div class="analytics-grid">
        <div class="card">
          <div class="section-title">Collaboration Overview (last 6 months)</div>
          <div class="bar-chart">
            ${ctx.byMonth.map((m) => `
              <div class="bar-col">
                <div class="bar-fill" style="height:${(m.count / maxMonth) * 100}%"></div>
                <div class="bar-label">${m.label}</div>
              </div>`).join('')}
          </div>
        </div>
        <div class="card">
          <div class="section-title">Platform Performance</div>
          ${ctx.byPlatform.map((p) => `
            <div class="hbar-row">
              <div class="hbar-label">${p.label}</div>
              <div class="hbar-track"><div class="hbar-fill" style="width:${(p.count / maxPlat) * 100}%"></div></div>
              <div class="hbar-val">${p.count}</div>
            </div>`).join('')}
        </div>
        <div class="card">
          <div class="section-title">Collaboration Type</div>
          ${ctx.byType.map((t) => `
            <div class="hbar-row">
              <div class="hbar-label">${t.label}</div>
              <div class="hbar-track"><div class="hbar-fill" style="width:${(t.count / maxType) * 100}%;background:var(--accent);"></div></div>
              <div class="hbar-val">${t.count}</div>
            </div>`).join('')}
        </div>
        <div class="card">
          <div class="section-title">Earnings</div>
          <div class="earnings-big">${U.rupiah(ctx.totalEarnings)}</div>
          <div class="cell-muted" style="margin-top:6px;">Recorded from completed collaborations</div>
        </div>
      </div>
    `;
  }

  /* ---------------- Settings page ---------------- */
  function settingsPage() {
    return `
      <div class="page-header">
        <h1 class="page-title">Settings</h1>
        <p class="page-desc">Backup, restore, or reset your data.</p>
      </div>
      <div class="card" style="max-width:520px;">
        <div class="section-title">Backup Data</div>
        <p class="cell-muted" style="margin-bottom:14px;">Your data lives only in this browser. Export it regularly so you never lose a collaboration.</p>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <button class="btn btn-primary" data-action="exportBackup">${U.icon('backup')} Export Backup</button>
          <button class="btn btn-outline" data-action="importBackup">Import Backup</button>
          <input type="file" id="importFile" accept="application/json" style="display:none;">
        </div>
      </div>
      <div class="card" style="max-width:520px;margin-top:18px;">
        <div class="section-title">Danger Zone</div>
        <button class="btn btn-danger" data-action="resetData">${U.icon('trash')} Reset All Data</button>
      </div>
    `;
  }

  /* ---------------- Shared bits ---------------- */
  function emptyState() {
    return `
      <div class="empty-state">
        <svg viewBox="0 0 200 200" fill="none"><g stroke="#E889AC" stroke-width="1.4" stroke-linecap="round"><path d="M100 190 C100 140 96 100 100 40"/><path d="M100 40 C70 45 55 65 50 90 C75 90 92 70 100 40Z"/><path d="M100 40 C130 45 145 65 150 90 C125 90 108 70 100 40Z"/></g></svg>
        <h3>No collaborations yet 🌸</h3>
        <p>Your next collaboration can start here.</p>
        <button class="btn btn-primary" data-action="addCollab">${U.icon('plus')} Add Collaboration</button>
      </div>
    `;
  }

  function addCollabModal(existing) {
    const isEdit = !!existing;
    const v = existing || {};
    return `
      <div class="modal-header">
        <h3 class="modal-title">${isEdit ? 'Edit Collaboration' : 'Add Collaboration'}</h3>
        <button class="modal-close" data-action="closeModal">${U.icon('x')}</button>
      </div>
      <form id="collabForm">
        <div class="form-grid">
          <div class="form-field full"><label>Brand</label><input required name="brand" value="${U.escapeHtml(v.brand || '')}" placeholder="e.g. Wardah"></div>
          <div class="form-field"><label>Contact Person</label><input name="contactPerson" value="${U.escapeHtml(v.contactPerson || '')}" placeholder="PIC name"></div>
          <div class="form-field"><label>WhatsApp</label><input name="whatsapp" value="${U.escapeHtml(v.whatsapp || '')}" placeholder="08xxxxxxxxxx"></div>
          <div class="form-field">
            <label>Type</label>
            <select name="type">
              ${['Endorsement', 'Paid Promote', 'Affiliate', 'Campaign', 'Product Exchange', 'Other'].map((t) => `<option ${v.type === t ? 'selected' : ''}>${t}</option>`).join('')}
            </select>
          </div>
          <div class="form-field">
            <label>Platform</label>
            <select name="platform">
              ${['TikTok', 'Instagram', 'Shopee', 'YouTube', 'Other'].map((t) => `<option ${v.platform === t ? 'selected' : ''}>${t}</option>`).join('')}
            </select>
          </div>
          <div class="form-field"><label>Deadline</label><input required type="date" name="deadline" value="${v.deadline || ''}"></div>
          <div class="form-field"><label>Fee (Rp)</label><input required type="number" min="0" name="fee" value="${v.fee || ''}" placeholder="1500000"></div>
          <div class="form-field full">
            <label>Status</label>
            <select name="status">
              ${Object.values(Storage.STATUS).filter(s=>s!=='Overdue').map((s) => `<option ${v.status === s ? 'selected' : ''}>${s}</option>`).join('')}
            </select>
          </div>
          <div class="form-field full"><label>Notes</label><textarea name="notesText" placeholder="Additional notes...">${U.escapeHtml(v.initialNote || '')}</textarea></div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline" data-action="closeModal">Cancel</button>
          <button type="submit" class="btn btn-primary">Save Collaboration</button>
        </div>
      </form>
    `;
  }

  function confirmModal(title, message, confirmAction, confirmId) {
    return `
      <div class="modal-header">
        <h3 class="modal-title">${title}</h3>
        <button class="modal-close" data-action="closeModal">${U.icon('x')}</button>
      </div>
      <p class="cell-muted" style="margin-bottom:20px;">${message}</p>
      <div class="modal-footer">
        <button class="btn btn-outline" data-action="closeModal">Cancel</button>
        <button class="btn btn-danger" data-action="${confirmAction}" data-id="${confirmId || ''}">Confirm</button>
      </div>
    `;
  }

  function notifPanel(notifs) {
    if (!notifs.length) return `<div class="empty-mini">No notifications 🌸</div>`;
    return notifs.map((n) => `
      <div class="notif-item" data-open="${n.id || ''}">
        <span class="dot">🌸</span><span>${n.text}</span>
      </div>
    `).join('');
  }

  return {
    dashboardPage, collabsPage, detailPage, calendarPage, calDayDetail,
    historyPage, analyticsPage, settingsPage, addCollabModal, confirmModal,
    notifPanel, emptyState, collabListBlock,
  };
})();
