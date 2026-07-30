/* ==========================================================================
   Storage — all persistence lives here (LocalStorage only, no backend)
   ========================================================================== */
const Storage = (function () {
  const KEY = 'dwi_dashboard_data_v1';

  const STATUS = {
    NEW: 'New',
    IN_PROGRESS: 'In Progress',
    REVISION: 'Revision',
    WAITING_UPLOAD: 'Waiting Upload',
    WAITING_PAYMENT: 'Waiting Payment',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
    OVERDUE: 'Overdue',
  };

  const CHECKLIST_TEMPLATE = [
    { id: 'brief', label: 'Brief received', done: false },
    { id: 'product', label: 'Product received', done: false },
    { id: 'created', label: 'Content created', done: false },
    { id: 'sent', label: 'Content sent to brand', done: false },
    { id: 'revision', label: 'Revision completed', done: false },
    { id: 'uploaded', label: 'Content uploaded', done: false },
    { id: 'paid', label: 'Payment received', done: false },
  ];

  function uid(prefix) {
    return (prefix || 'id') + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function defaultData() {
    return {
      meta: { createdAt: new Date().toISOString() },
      collaborations: [],
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) {
        const seeded = seedData();
        save(seeded);
        return seeded;
      }
      const parsed = JSON.parse(raw);
      if (!parsed.collaborations) return defaultData();
      return parsed;
    } catch (e) {
      console.error('Storage load failed', e);
      return defaultData();
    }
  }

  function save(data) {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('Storage save failed', e);
      return false;
    }
  }

  function seedData() {
    const today = new Date();
    const d = (offset) => {
      const dt = new Date(today);
      dt.setDate(dt.getDate() + offset);
      return dt.toISOString().slice(0, 10);
    };
    const mk = (o) => Object.assign({
      id: uid('collab'),
      contactPerson: '',
      whatsapp: '',
      notes: [],
      checklist: JSON.parse(JSON.stringify(CHECKLIST_TEMPLATE)),
      createdAt: new Date().toISOString(),
      completedAt: null,
    }, o);

    return {
      meta: { createdAt: new Date().toISOString() },
      collaborations: [
        mk({ brand: 'Wardah', type: 'Campaign', platform: 'TikTok', deadline: d(1), fee: 1500000, status: STATUS.IN_PROGRESS, contactPerson: 'Rani', whatsapp: '081234567890', notes: [{ ts: new Date().toISOString(), text: 'Brand minta revisi caption.' }] }),
        mk({ brand: 'Somethinc', type: 'Endorsement', platform: 'Instagram', deadline: d(3), fee: 900000, status: STATUS.NEW, contactPerson: 'Bagas' }),
        mk({ brand: 'Scarlett Whitening', type: 'Paid Promote', platform: 'TikTok', deadline: d(-1), fee: 750000, status: STATUS.WAITING_UPLOAD, contactPerson: 'Nadia' }),
        mk({ brand: 'Shopee Beauty', type: 'Affiliate', platform: 'Shopee', deadline: d(7), fee: 400000, status: STATUS.NEW, contactPerson: 'CS Shopee' }),
        mk({ brand: 'Erha', type: 'Campaign', platform: 'YouTube', deadline: d(-4), fee: 2000000, status: STATUS.WAITING_PAYMENT, contactPerson: 'Kevin', completedAt: d(-4) }),
        mk({ brand: 'MS Glow', type: 'Endorsement', platform: 'Instagram', deadline: d(-10), fee: 1200000, status: STATUS.COMPLETED, contactPerson: 'Yusuf', completedAt: d(-10) }),
        mk({ brand: 'Avoskin', type: 'Product Exchange', platform: 'Instagram', deadline: d(-20), fee: 0, status: STATUS.COMPLETED, contactPerson: 'Tia', completedAt: d(-20) }),
      ],
    };
  }

  function all() {
    return load().collaborations.slice();
  }

  function get(id) {
    return load().collaborations.find((c) => c.id === id) || null;
  }

  function create(payload) {
    const data = load();
    const item = Object.assign({
      id: uid('collab'),
      contactPerson: '',
      whatsapp: '',
      notes: [],
      checklist: JSON.parse(JSON.stringify(CHECKLIST_TEMPLATE)),
      createdAt: new Date().toISOString(),
      completedAt: null,
      fee: 0,
    }, payload);
    data.collaborations.unshift(item);
    save(data);
    return item;
  }

  function update(id, patch) {
    const data = load();
    const idx = data.collaborations.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    data.collaborations[idx] = Object.assign({}, data.collaborations[idx], patch);
    save(data);
    return data.collaborations[idx];
  }

  function remove(id) {
    const data = load();
    data.collaborations = data.collaborations.filter((c) => c.id !== id);
    save(data);
  }

  function addNote(id, text) {
    const data = load();
    const item = data.collaborations.find((c) => c.id === id);
    if (!item) return null;
    item.notes = item.notes || [];
    item.notes.unshift({ ts: new Date().toISOString(), text });
    save(data);
    return item;
  }

  function toggleCheck(id, checkId) {
    const data = load();
    const item = data.collaborations.find((c) => c.id === id);
    if (!item) return null;
    const ch = item.checklist.find((c) => c.id === checkId);
    if (ch) ch.done = !ch.done;
    save(data);
    return item;
  }

  function resetAll() {
    save(defaultData());
  }

  function exportJSON() {
    return JSON.stringify(load(), null, 2);
  }

  function importJSON(jsonString) {
    const parsed = JSON.parse(jsonString);
    if (!parsed || !Array.isArray(parsed.collaborations)) {
      throw new Error('Invalid backup file');
    }
    save(parsed);
  }

  return {
    STATUS, CHECKLIST_TEMPLATE, uid,
    all, get, create, update, remove,
    addNote, toggleCheck, resetAll,
    exportJSON, importJSON,
  };
})();
