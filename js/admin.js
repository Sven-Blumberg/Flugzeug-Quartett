const Admin = (() => {
  let editingId = null;
  const $ = id => document.getElementById(id);

  /* ─── Sidebar Toggle ─── */
  function toggle() {
    const sb = $('admin-sidebar');
    const bd = $('admin-backdrop');
    const open = sb.classList.toggle('open');
    bd.classList.toggle('active', open);
    if (open) { render(); if (typeof Game !== 'undefined' && Game.renderDeckMgr) Game.renderDeckMgr(); }
  }
  function close() {
    $('admin-sidebar').classList.remove('open');
    $('admin-backdrop').classList.remove('active');
  }

  /* ─── Render Card List ─── */
  function render() {
    const all = FlugzeugData.getAll();
    $('sidebar-count').textContent = `${all.length} Flugzeuge`;

    const sorted = [...all].sort((a,b) => {
      if (a.group !== b.group) return a.group.localeCompare(b.group);
      return a.number - b.number;
    });

    $('sidebar-cards').innerHTML = sorted.map(c => {
      const gc = GROUP_COLORS[c.group] || { bg: '#555' };
      return `<div class="sb-card">
        <div class="sb-card-head">
          <span class="sb-badge" style="background:${gc.bg}">${c.group}${c.number}</span>
          <span class="sb-emoji">${c.emoji || '✈️'}</span>
          <span class="sb-name">${c.name}</span>
        </div>
        <div class="sb-card-actions">
          <button class="sb-edit" onclick="Admin.openEdit('${c.id}')">✏️ Bearbeiten</button>
          <button class="sb-del" onclick="Admin.remove('${c.id}')">🗑️</button>
        </div>
      </div>`;
    }).join('');
  }

  /* ─── Add / Edit ─── */
  function openAdd() {
    editingId = null;
    $('modal-title').textContent = '✈️ Neues Flugzeug';
    $('aircraft-form').reset();
    $('form-id').value = '';
    $('edit-modal').classList.add('active');
  }

  function openEdit(id) {
    const c = FlugzeugData.getById(id);
    if (!c) return;
    editingId = id;
    $('modal-title').textContent = '✏️ Bearbeiten';
    $('form-id').value = c.id;
    $('form-name').value = c.name;
    $('form-emoji').value = c.emoji || '';
    $('form-group').value = c.group;
    $('form-number').value = c.number;
    $('form-category').value = c.category || '';
    $('form-wiki').value = c.wikiTitle || '';
    $('form-speed').value = c.stats.speed;
    $('form-range').value = c.stats.range;
    $('form-wingspan').value = c.stats.wingspan;
    $('form-length').value = c.stats.length;
    $('form-altitude').value = c.stats.altitude;
    $('form-firstFlight').value = c.stats.firstFlight;
    $('edit-modal').classList.add('active');
  }

  function closeEdit() { $('edit-modal').classList.remove('active'); editingId = null; }

  function save(e) {
    e.preventDefault();
    const aircraft = {
      id: editingId || ($('form-group').value.toUpperCase() + $('form-number').value + '_' + Date.now()),
      group: $('form-group').value.toUpperCase(),
      number: parseInt($('form-number').value),
      name: $('form-name').value.trim(),
      emoji: $('form-emoji').value.trim() || '✈️',
      category: $('form-category').value.trim(),
      wikiTitle: $('form-wiki').value.trim(),
      stats: {
        speed: parseFloat($('form-speed').value),
        range: parseFloat($('form-range').value),
        wingspan: parseFloat($('form-wingspan').value),
        length: parseFloat($('form-length').value),
        altitude: parseFloat($('form-altitude').value),
        firstFlight: parseInt($('form-firstFlight').value)
      }
    };
    if (editingId) FlugzeugData.update(editingId, aircraft);
    else FlugzeugData.add(aircraft);

    if (aircraft.wikiTitle) {
      ImageCache.fetchOne(aircraft);
    }
    closeEdit();
    render();
  }

  function remove(id) {
    const c = FlugzeugData.getById(id);
    if (!c || !confirm(`"${c.name}" wirklich löschen?`)) return;
    FlugzeugData.remove(id);
    render();
  }

  function resetData() {
    if (!confirm('Alle Änderungen verwerfen und Standarddaten laden?')) return;
    FlugzeugData.resetToDefault();
    render();
  }

  /* ─── Export / Import ─── */
  function openExport() {
    $('export-data').value = FlugzeugData.exportJSON();
    $('export-modal').classList.add('active');
  }
  function closeExport() { $('export-modal').classList.remove('active'); }
  function copyExport() {
    navigator.clipboard.writeText($('export-data').value)
      .then(() => alert('Kopiert!'))
      .catch(() => { $('export-data').select(); document.execCommand('copy'); alert('Kopiert!'); });
  }

  function openImport() {
    $('import-data').value = '';
    $('import-modal').classList.add('active');
  }
  function closeImport() { $('import-modal').classList.remove('active'); }
  function doImport() {
    const j = $('import-data').value.trim();
    if (!j) { alert('Bitte JSON einfügen!'); return; }
    try {
      FlugzeugData.importJSON(j);
      closeImport();
      render();
      ImageCache.fetchAll();
      alert('Import OK! ' + FlugzeugData.getAll().length + ' Karten geladen.');
    } catch(e) { alert('Fehler: ' + e.message); }
  }

  return {
    toggle, close, render,
    openAdd, openEdit, closeEdit, save, remove, resetData,
    openExport, closeExport, copyExport,
    openImport, closeImport, doImport
  };
})();
