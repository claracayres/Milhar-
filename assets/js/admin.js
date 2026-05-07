let db = null;

  async function loadRuntimeConfig() {
const response = await fetch('/api/config', { headers: { Accept: 'application/json' } });
const payload = await response.json().catch(() => ({}));
if (!response.ok) throw new Error(payload.error || 'Erro ao carregar configuracao.');
 db = supabase.createClient(payload.data.supabaseUrl, payload.data.supabaseAnonKey);
  }

  async function getAccessToken() {
if (!db) return null;
const { data: { session } } = await db.auth.getSession();
return session?.access_token || null;
  }

  async function apiFetch(path, options = {}) {
const token = await getAccessToken();
const headers = {
  Accept: 'application/json',
  ...(options.body ? { 'Content-Type': 'application/json' } : {}),
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
  ...(options.headers || {}),
};
 const response = await fetch(path, {
  ...options,
  headers,
  body: options.body && typeof options.body !== 'string'
    ? JSON.stringify(options.body)
    : options.body,
});
 const payload = await response.json().catch(() => ({}));
if (!response.ok) throw new Error(payload.error || 'Erro no backend.');
return Object.prototype.hasOwnProperty.call(payload, 'data') ? payload.data : payload;
  }

  /* ── state ── */
  let currentUser  = null;
  let cardapioData = [];
  let deleteTarget = null;
  let ingredientes = [];

  /* ════════════════════════════════════
 TOAST
  ════════════════════════════════════ */
  function toast(msg, isError = false) {
const el = document.getElementById('toast');
el.textContent = msg;
el.className   = 'show' + (isError ? ' error' : '');
clearTimeout(el._t);
el._t = setTimeout(() => el.className = '', 3000);
  }

  /* ════════════════════════════════════
 AUTH
  ════════════════════════════════════ */
  async function doLogin() {
const email = document.getElementById('loginEmail').value.trim();
const pass  = document.getElementById('loginPass').value;
const btn   = document.getElementById('loginBtn');
const err   = document.getElementById('loginError');
 if (!db) {
  try {
    await loadRuntimeConfig();
  } catch (error) {
    err.textContent = error.message;
    err.style.display = 'block';
    return;
  }
}
 if (!email || !pass) { err.textContent = 'Preencha e-mail e senha.'; err.style.display='block'; return; }
 btn.textContent = 'Entrando...'; btn.disabled = true;
const { data, error } = await db.auth.signInWithPassword({ email, password: pass });
btn.textContent = 'Entrar'; btn.disabled = false;
 if (error) {
  err.textContent = 'E-mail ou senha incorretos.'; err.style.display = 'block';
} else {
  initApp(data.user);
}
  }

  async function doLogout() {
await db.auth.signOut();
location.reload();
  }

  async function checkSession() {
if (!db) await loadRuntimeConfig();
const { data: { session } } = await db.auth.getSession();
if (session?.user) initApp(session.user);
  }

  function initApp(user) {
currentUser = user;
document.getElementById('loginScreen').style.display = 'none';
document.getElementById('userEmail').textContent = user.email;
loadAll();
  }

  /* ════════════════════════════════════
 TABS
  ════════════════════════════════════ */
  const TABS = {
dashboard: { title: 'Dashboard', actions: '' },
cardapio:  { title: '🌽 Cardápio', actions: '<button class="btn btn-terra btn-sm" onclick="openItemModal()">+ Novo item</button>' },
vendaDia:  { title: '⭐ Venda do Dia', actions: '' },
  };

  document.querySelectorAll('[data-tab]').forEach(el => {
el.addEventListener('click', e => {
  e.preventDefault();
  switchTab(el.dataset.tab);
});
  });

  function switchTab(name) {
document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
document.querySelectorAll('[data-tab]').forEach(a => a.classList.remove('active'));
document.getElementById('panel-' + name)?.classList.add('active');
document.querySelectorAll(`[data-tab="${name}"]`).forEach(a => a.classList.add('active'));
document.getElementById('topbarTitle').textContent = TABS[name]?.title || name;
document.getElementById('topbarActions').innerHTML = TABS[name]?.actions || '';
if (name === 'vendaDia') loadVendaDiaForm();
  }

  /* ════════════════════════════════════
 LOAD ALL
  ════════════════════════════════════ */
  async function loadAll() {
await loadCardapio();
await loadDashboard();
  }

  /* ════════════════════════════════════
 CARDÁPIO CRUD
  ════════════════════════════════════ */
  async function loadCardapio() {
try {
  const data = await apiFetch('/api/cardapio?admin=1');
  cardapioData = data || [];
  renderCardapioTable(cardapioData);
  renderDashTable(cardapioData);
  updateStats(cardapioData);
} catch (error) {
  toast('Erro ao carregar cardápio: ' + error.message, true);
}
  }

  const CAT_LABELS = { salgado: 'Salgado', doce: 'Doce', especial: 'Especial' };
  const CAT_COLORS = { salgado: '#4A6741', doce: '#D4943A', especial: '#C5622A' };

  function renderCardapioTable(items) {
const tbody = document.getElementById('cardapioTable');
if (!items.length) {
  tbody.innerHTML = `<tr><td colspan="7">
    <div class="empty-state"><div class="empty-icon">🌽</div>Nenhum item ainda. Clique em "Novo item".</div>
  </td></tr>`;
  return;
}
tbody.innerHTML = items.map(item => `
  <tr>
    <td style="font-size:1.4rem">${item.emoji || '🌽'}</td>
    <td>
      <strong style="font-size:.88rem">${item.nome}</strong>
      ${item.descricao ? `<div style="font-size:.75rem;color:var(--cafe-lt);margin-top:.15rem">${item.descricao.substring(0,60)}${item.descricao.length>60?'…':''}</div>` : ''}
    </td>
    <td>
      <span class="badge" style="background:${CAT_COLORS[item.categoria]}22;color:${CAT_COLORS[item.categoria]}">
        <span class="category-dot" style="background:${CAT_COLORS[item.categoria]}"></span>
        ${CAT_LABELS[item.categoria] || item.categoria}
      </span>
    </td>
    <td style="font-weight:500">R$ ${Number(item.preco).toFixed(2).replace('.',',')}</td>
    <td>${item.destaque ? '<span class="badge badge-milho">⭐ Sim</span>' : '<span class="badge badge-gray">—</span>'}</td>
    <td>
      <label class="toggle" style="margin:0">
        <input type="checkbox" ${item.ativo ? 'checked' : ''} onchange="toggleAtivo('${item.id}', this.checked)" />
        <span class="slider"></span>
      </label>
    </td>
    <td style="display:flex;gap:.4rem">
      <button class="btn btn-ghost btn-sm" onclick="openItemModal('${item.id}')">✏️</button>
      <button class="btn btn-danger btn-sm" onclick="openConfirmDelete('${item.id}','${item.nome.replace(/'/g,"\\'")}')">🗑</button>
    </td>
  </tr>
`).join('');
  }

  function renderDashTable(items) {
const tbody = document.getElementById('dashTable');
if (!items.length) { tbody.innerHTML = '<tr class="loading-row"><td colspan="4">Nenhum item.</td></tr>'; return; }
tbody.innerHTML = items.slice(0, 8).map(item => `
  <tr>
    <td>${item.emoji || '🌽'} <strong style="font-size:.86rem">${item.nome}</strong></td>
    <td><span class="badge" style="background:${CAT_COLORS[item.categoria]}22;color:${CAT_COLORS[item.categoria]}">${CAT_LABELS[item.categoria]||item.categoria}</span></td>
    <td>R$ ${Number(item.preco).toFixed(2).replace('.',',')}</td>
    <td>${item.ativo ? '<span class="badge badge-green">✓ Ativo</span>' : '<span class="badge badge-gray">Inativo</span>'}</td>
  </tr>
`).join('');
  }

  function updateStats(items) {
document.getElementById('statTotal').textContent  = items.length;
document.getElementById('statAtivos').textContent = items.filter(i => i.ativo).length;
  }

  /* toggle ativo inline */
  async function toggleAtivo(id, val) {
try {
  await apiFetch(`/api/cardapio/${id}`, {
    method: 'PATCH',
    body: { ativo: val },
  });
  toast(val ? '✓ Item ativado' : 'Item desativado');
  const item = cardapioData.find(i => i.id === id);
  if (item) item.ativo = val;
  updateStats(cardapioData);
} catch (error) {
  toast('Erro ao atualizar: ' + error.message, true);
}
  }

  /* ── MODAL ITEM ── */
  function openItemModal(id) {
const modal = document.getElementById('itemModal');
if (id) {
  const item = cardapioData.find(i => i.id === id);
  if (!item) return;
  document.getElementById('itemModalTitle').textContent = '✏️ Editar item';
  document.getElementById('itemId').value       = item.id;
  document.getElementById('itemNome').value     = item.nome;
  document.getElementById('itemEmoji').value    = item.emoji || '';
  document.getElementById('itemDesc').value     = item.descricao || '';
  document.getElementById('itemCategoria').value= item.categoria;
  document.getElementById('itemPreco').value    = item.preco;
  document.getElementById('itemOrdem').value    = item.ordem || 0;
  document.getElementById('itemBadge').value    = item.badge_texto || '';
  document.getElementById('itemAtivo').checked  = item.ativo;
  document.getElementById('itemDestaque').checked = item.destaque;
} else {
  document.getElementById('itemModalTitle').textContent = '+ Novo item';
  ['itemId','itemNome','itemEmoji','itemDesc','itemBadge'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('itemCategoria').value = 'salgado';
  document.getElementById('itemPreco').value  = '';
  document.getElementById('itemOrdem').value  = cardapioData.length;
  document.getElementById('itemAtivo').checked    = true;
  document.getElementById('itemDestaque').checked = false;
}
modal.classList.add('open');
  }

  function closeItemModal()            { document.getElementById('itemModal').classList.remove('open'); }
  function closeItemModalOutside(e)    { if (e.target.id === 'itemModal') closeItemModal(); }

  async function saveItem() {
const id       = document.getElementById('itemId').value;
const nome     = document.getElementById('itemNome').value.trim();
const preco    = parseFloat(document.getElementById('itemPreco').value);
if (!nome) { toast('Nome é obrigatório', true); return; }
if (isNaN(preco)) { toast('Preço inválido', true); return; }
 const payload = {
  nome,
  emoji:       document.getElementById('itemEmoji').value.trim() || '🌽',
  descricao:   document.getElementById('itemDesc').value.trim(),
  categoria:   document.getElementById('itemCategoria').value,
  preco,
  ordem:       parseInt(document.getElementById('itemOrdem').value) || 0,
  badge_texto: document.getElementById('itemBadge').value.trim() || null,
  ativo:       document.getElementById('itemAtivo').checked,
  destaque:    document.getElementById('itemDestaque').checked,
};
 try {
  await apiFetch(id ? `/api/cardapio/${id}` : '/api/cardapio', {
    method: id ? 'PATCH' : 'POST',
    body: payload,
  });
  toast('✓ Item salvo com sucesso!');
  closeItemModal();
  loadCardapio();
} catch (error) {
  toast('Erro ao salvar: ' + error.message, true);
}
  }

  /* ── DELETE ── */
  function openConfirmDelete(id, nome) {
deleteTarget = id;
document.getElementById('confirmName').textContent = nome;
document.getElementById('confirmModal').classList.add('open');
  }
  function closeConfirmModal()           { document.getElementById('confirmModal').classList.remove('open'); deleteTarget = null; }
  function closeConfirmModalOutside(e)   { if (e.target.id === 'confirmModal') closeConfirmModal(); }

  async function confirmDelete() {
if (!deleteTarget) return;
try {
  await apiFetch(`/api/cardapio/${deleteTarget}`, { method: 'DELETE' });
  toast('🗑 Item excluído');
  closeConfirmModal();
  loadCardapio();
} catch (error) {
  toast('Erro ao excluir: ' + error.message, true);
}
  }

  /* ════════════════════════════════════
 VENDA DO DIA
  ════════════════════════════════════ */

  // tag input (ingredientes)
  document.getElementById('tagInput').addEventListener('keydown', e => {
if ((e.key === 'Enter' || e.key === ',') && e.target.value.trim()) {
  e.preventDefault();
  addTag(e.target.value.trim());
  e.target.value = '';
}
if (e.key === 'Backspace' && !e.target.value && ingredientes.length) {
  ingredientes.pop(); renderTags();
}
  });
  document.getElementById('tagWrap').addEventListener('focusin',  () => document.getElementById('tagWrap').classList.add('focused'));
  document.getElementById('tagWrap').addEventListener('focusout', () => document.getElementById('tagWrap').classList.remove('focused'));

  function addTag(v) { if (!ingredientes.includes(v)) { ingredientes.push(v); renderTags(); } }
  function removeTag(i) { ingredientes.splice(i, 1); renderTags(); }
  function renderTags() {
document.getElementById('tagList').innerHTML = ingredientes.map((t, i) =>
  `<span class="tag-chip">${t}<button type="button" onclick="removeTag(${i})">×</button></span>`
).join('');
  }

  function adjustUnits(delta) {
const inp = document.getElementById('vdUnidadesTotal');
inp.value = Math.max(1, (parseInt(inp.value) || 40) + delta);
syncUnitsDisplay();
  }

  function syncUnitsDisplay() {
const val = parseInt(document.getElementById('vdUnidadesTotal').value) || 40;
document.getElementById('unitsDisplay').textContent  = val;
document.getElementById('vdMaxLabel').textContent    = 'de ' + val;
document.getElementById('vdStockFill').style.width   = '100%';
  }

  async function loadVendaDiaForm() {
// set today's date
document.getElementById('vdData').value = new Date().toISOString().split('T')[0];
 const hoje = new Date().toISOString().split('T')[0];
let data = null;
try {
  data = await apiFetch(`/api/venda-dia?date=${hoje}&admin=1`);
} catch (error) {
  toast('Erro ao carregar venda do dia: ' + error.message, true);
}
 if (data) {
  document.getElementById('vdNome').value  = data.nome;
  document.getElementById('vdEmoji').value = data.emoji || '';
  document.getElementById('vdDesc').value  = data.descricao || '';
  document.getElementById('vdPreco').value = data.preco || '';
  document.getElementById('vdAtivo').checked = data.ativo;
  document.getElementById('vdUnidadesTotal').value = data.unidades_total;
  ingredientes = data.ingredientes || [];
  renderTags();
  syncUnitsDisplay();
} else {
  document.getElementById('vdNome').value  = '';
  document.getElementById('vdEmoji').value = '';
  document.getElementById('vdDesc').value  = '';
  document.getElementById('vdPreco').value = '';
  document.getElementById('vdAtivo').checked = true;
  document.getElementById('vdUnidadesTotal').value = 40;
  ingredientes = [];
  renderTags();
  syncUnitsDisplay();
}
 loadVdHistory();
updateVdStats(data);
  }

  function updateVdStats(vd) {
if (vd) {
  const rest = vd.unidades_total - (vd.unidades_vendidas || 0);
  document.getElementById('statVd').textContent   = vd.nome.substring(0, 18) + '…';
  document.getElementById('statRest').textContent = rest + ' un.';
} else {
  document.getElementById('statVd').textContent   = 'Não definida';
  document.getElementById('statRest').textContent = '—';
}
  }

  async function saveVendaDia() {
const nome  = document.getElementById('vdNome').value.trim();
const preco = parseFloat(document.getElementById('vdPreco').value);
const data  = document.getElementById('vdData').value;
if (!nome) { toast('Nome é obrigatório', true); return; }
if (!data) { toast('Data é obrigatória', true); return; }
 const payload = {
  nome,
  emoji:            document.getElementById('vdEmoji').value.trim() || '🌽',
  descricao:        document.getElementById('vdDesc').value.trim(),
  preco:            isNaN(preco) ? null : preco,
  data,
  unidades_total:   parseInt(document.getElementById('vdUnidadesTotal').value) || 40,
  unidades_vendidas:0,
  ativo:            document.getElementById('vdAtivo').checked,
  ingredientes,
};
 try {
  await apiFetch('/api/venda-dia', {
    method: 'POST',
    body: payload,
  });
  toast('✓ Venda do dia salva!');
  loadVdHistory();
} catch (error) {
  toast('Erro: ' + error.message, true);
}
  }

  async function loadVdHistory() {
let data = [];
try {
  data = await apiFetch('/api/venda-dia?history=7');
} catch (error) {
  toast('Erro ao carregar histórico: ' + error.message, true);
}
const tbody = document.getElementById('vdHistory');
if (!data?.length) { tbody.innerHTML = '<tr class="loading-row"><td colspan="6">Nenhum registro ainda.</td></tr>'; return; }
tbody.innerHTML = data.map(vd => {
  const rest = vd.unidades_total - (vd.unidades_vendidas || 0);
  return `<tr>
    <td>${vd.data}</td>
    <td>${vd.emoji || '🌽'} ${vd.nome}</td>
    <td>${vd.unidades_total}</td>
    <td>${vd.unidades_vendidas || 0}</td>
    <td>${vd.ativo ? '<span class="badge badge-green">Ativo</span>' : '<span class="badge badge-gray">Inativo</span>'}</td>
    <td><button class="btn btn-ghost btn-sm" onclick="loadVdById('${vd.id}')">✏️</button></td>
  </tr>`;
}).join('');
  }

  async function loadVdById(id) {
let data = null;
try {
  data = await apiFetch(`/api/venda-dia/${id}`);
} catch (error) {
  toast('Erro ao carregar registro: ' + error.message, true);
}
if (!data) return;
document.getElementById('vdNome').value  = data.nome;
document.getElementById('vdEmoji').value = data.emoji || '';
document.getElementById('vdDesc').value  = data.descricao || '';
document.getElementById('vdPreco').value = data.preco || '';
document.getElementById('vdData').value  = data.data;
document.getElementById('vdAtivo').checked = data.ativo;
document.getElementById('vdUnidadesTotal').value = data.unidades_total;
ingredientes = data.ingredientes || [];
renderTags();
syncUnitsDisplay();
switchTab('vendaDia');
window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ════════════════════════════════════
 DASHBOARD
  ════════════════════════════════════ */
  async function loadDashboard() {
const hoje = new Date().toISOString().split('T')[0];
try {
  const vd = await apiFetch(`/api/venda-dia?date=${hoje}&admin=1`);
  updateVdStats(vd);
} catch {
  updateVdStats(null);
}
  }

  /* ════════════════════════════════════
 INIT
  ════════════════════════════════════ */
  async function bootAdmin() {
try {
  await loadRuntimeConfig();
  await checkSession();
} catch (error) {
  const err = document.getElementById('loginError');
  err.textContent = error.message;
  err.style.display = 'block';
} finally {
  syncUnitsDisplay();
}
  }

  bootAdmin();
