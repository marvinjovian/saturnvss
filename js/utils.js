/* ==========================================================================
   Utils — formatting, date math, small helpers
   ========================================================================== */
const Utils = (function () {
  function rupiah(n) {
    n = Number(n) || 0;
    return 'Rp' + n.toLocaleString('id-ID');
  }

  function dateOnly(d) {
    const dt = (d instanceof Date) ? d : new Date(d);
    dt.setHours(0, 0, 0, 0);
    return dt;
  }

  function daysUntil(deadline) {
    const today = dateOnly(new Date());
    const dl = dateOnly(deadline);
    return Math.round((dl - today) / 86400000);
  }

  function formatDate(d, opts) {
    if (!d) return '-';
    const dt = new Date(d);
    return dt.toLocaleDateString('en-GB', opts || { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function formatDateTime(d) {
    const dt = new Date(d);
    const datePart = dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
    const timePart = dt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    return `${datePart} — ${timePart}`;
  }

  function deadlineUrgency(deadline, isDone) {
    if (isDone) return 'normal';
    const dU = daysUntil(deadline);
    if (dU < 0) return 'overdue';
    if (dU === 0) return 'urgent';
    if (dU <= 1) return 'urgent';
    if (dU <= 3) return 'warning';
    return 'normal';
  }

  function deadlineLabel(deadline, isDone) {
    const dU = daysUntil(deadline);
    if (!isDone) {
      if (dU < 0) return `Overdue ${Math.abs(dU)}d`;
      if (dU === 0) return 'Today';
      if (dU === 1) return 'Tomorrow';
      return `${dU} days`;
    }
    return formatDate(deadline);
  }

  // Effective status: auto-flip to Overdue when deadline passed and not done
  function effectiveStatus(item) {
    const doneStates = ['Completed', 'Cancelled'];
    if (doneStates.includes(item.status)) return item.status;
    const dU = daysUntil(item.deadline);
    if (dU < 0) return 'Overdue';
    return item.status;
  }

  function statusClass(status) {
    return 'badge-' + status.toLowerCase().replace(/\s+/g, '-');
  }

  function initials(name) {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    return parts.slice(0, 2).map((p) => p[0].toUpperCase()).join('');
  }

  function progressPct(checklist) {
    if (!checklist || !checklist.length) return 0;
    const done = checklist.filter((c) => c.done).length;
    return Math.round((done / checklist.length) * 100);
  }

  function debounce(fn, wait) {
    let t;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait || 250);
    };
  }

  function icon(name, cls) {
    const icons = {
      home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/>',
      collab: '<path d="M20.8 20.5c0-3.6-2.9-6-6.8-6h-4c-3.9 0-6.8 2.4-6.8 6"/><circle cx="12" cy="8" r="4"/>',
      calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 10h18"/>',
      history: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>',
      analytics: '<path d="M4 20V10M12 20V4M20 20v-7"/>',
      settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21a2 2 0 1 1-4 0v-.2a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H3a2 2 0 1 1 0-4h.2a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.6V3a2 2 0 1 1 4 0v.2a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.6 1H21a2 2 0 1 1 0 4h-.2a1.7 1.7 0 0 0-1.6 1z"/>',
      backup: '<path d="M12 3v12m0 0-4-4m4 4 4-4"/><path d="M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4"/>',
      search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
      bell: '<path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6"/><path d="M10 21a2 2 0 0 0 4 0"/>',
      plus: '<path d="M12 5v14M5 12h14"/>',
      check: '<path d="M20 6 9 17l-5-5"/>',
      x: '<path d="M18 6 6 18M6 6l12 12"/>',
      chevronRight: '<path d="m9 18 6-6-6-6"/>',
      chevronLeft: '<path d="m15 18-6-6 6-6"/>',
      trash: '<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6"/>',
      wallet: '<path d="M20 12V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-4"/><path d="M20 12h-4a2 2 0 1 0 0 4h4"/>',
      flag: '<path d="M4 22V4"/><path d="M4 4h11l-1.5 4L15 12H4"/>',
    };
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" class="${cls || ''}">${icons[name] || ''}</svg>`;
  }

  function escapeHtml(s) {
    if (s == null) return '';
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  return {
    rupiah, formatDate, formatDateTime, daysUntil, deadlineUrgency, deadlineLabel,
    effectiveStatus, statusClass, initials, progressPct, debounce, icon, escapeHtml,
  };
})();
