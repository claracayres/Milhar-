let db = null;
let currentUser = null;
let cardapioData = [];
let deleteTarget = null;
let ingredientes = [];

async function loadRuntimeConfig() {
  const response = await fetch('/api/config', { headers: { Accept: 'application/json' } });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'Erro ao carregar configuração.');
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

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }[ch]));
}

function jsString(value) {
  return String(value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\r?\n/g, ' ');
}

const DEFAULT_ICON = 'fa-solid fa-wheat-awn';
const CATEGORY_ICONS = {
  salgado: 'fa-solid fa-wheat-awn',
  doce: 'fa-solid fa-jar',
  especial: 'fa-solid fa-star',
};
const ICON_BY_TOKEN = {
  '\u{1F33D}': 'fa-solid fa-wheat-awn',
  '\u{1FAD5}': 'fa-solid fa-bowl-food',
  '\u{1F9C0}': 'fa-solid fa-cheese',
  '\u{1F525}': 'fa-solid fa-fire',
  '\u{1F36F}': 'fa-solid fa-jar',
  '\u{1F49C}': 'fa-solid fa-heart',
  '\u{1F965}': 'fa-solid fa-seedling',
  '\u270D': 'fa-solid fa-pen-nib',
  '\u270D\uFE0F': 'fa-solid fa-pen-nib',
  '\u{1F4C5}': 'fa-solid fa-calendar-day',
  '\u{1F69A}': 'fa-solid fa-truck-fast',
  '\u{1F4AC}': 'fa-solid fa-comment-dots',
  '\u{1F4F8}': 'fa-solid fa-camera-retro',
  '\u{2B50}': 'fa-solid fa-star',
  '\u2605': 'fa-solid fa-star',
  '\u{1F31F}': 'fa-solid fa-star',
  '\u{1F4E6}': 'fa-solid fa-box-open',
  '\u26A1': 'fa-solid fa-bolt',
  '\u2764\uFE0F': 'fa-solid fa-heart',
  '\u2764': 'fa-solid fa-heart',
  '\u270B': 'fa-solid fa-hand',
  '\u{1F33F}': 'fa-solid fa-leaf',
  '\u{1F464}': 'fa-solid fa-user',
  '\u{1F469}': 'fa-solid fa-user',
  '\u{1F468}': 'fa-solid fa-user',
  '\u{1F343}': 'fa-solid fa-leaf',
  '\u{1F33E}': 'fa-solid fa-seedling',
  '\u{1FAF6}': 'fa-solid fa-hand-holding-heart',
  '\u{1F37D}': 'fa-solid fa-utensils',
};
const FA_STYLE_CLASSES = new Set(['fa-solid', 'fa-regular', 'fa-brands']);
const ICON_TOKEN_PATTERN = Object.keys(ICON_BY_TOKEN)
  .sort((a, b) => b.length - a.length)
  .map((token) => token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  .join('|');
const ICON_PREFIX_RE = new RegExp(`^(?:${ICON_TOKEN_PATTERN})`, 'u');

function parseIconClass(value) {
  const classes = String(value ?? '').trim().split(/\s+/).filter(Boolean);
  if (!classes.length || !classes.every((cls) => /^fa-[a-z0-9-]+$/i.test(cls))) return null;

  const style = classes.find((cls) => FA_STYLE_CLASSES.has(cls)) || 'fa-solid';
  const names = classes.filter((cls) => !FA_STYLE_CLASSES.has(cls));
  if (!names.length) return null;

  return [style, ...names].join(' ');
}

function fallbackIconFor(fallback) {
  return CATEGORY_ICONS[fallback] || parseIconClass(fallback) || DEFAULT_ICON;
}

function iconClassFor(value, fallback = DEFAULT_ICON) {
  const raw = String(value ?? '').trim();
  const fallbackClass = fallbackIconFor(fallback);
  if (!raw) return fallbackClass;

  const first = raw.split(/\s+/)[0];
  return ICON_BY_TOKEN[raw]
    || ICON_BY_TOKEN[first]
    || parseIconClass(raw)
    || parseIconClass(first)
    || fallbackClass;
}

function iconHtml(value, fallback = DEFAULT_ICON) {
  return `<i class="${escapeHtml(iconClassFor(value, fallback))}" aria-hidden="true"></i>`;
}

function splitIconText(value, fallback = DEFAULT_ICON) {
  const text = String(value ?? '').trim();
  if (!text) return { icon: fallbackIconFor(fallback), label: '' };

  const parts = text.split(/\s+/);
  let consumed = 0;
  let iconSource = '';

  if (parts[0]?.startsWith('fa-')) {
    const iconParts = [];
    while (parts[consumed]?.startsWith('fa-')) {
      iconParts.push(parts[consumed]);
      consumed += 1;
    }
    iconSource = iconParts.join(' ');
  } else if (ICON_BY_TOKEN[parts[0]]) {
    iconSource = parts[0];
    consumed = 1;
  } else {
    const prefix = text.match(ICON_PREFIX_RE);
    if (prefix) {
      iconSource = prefix[0];
      return {
        icon: iconClassFor(iconSource, fallback),
        label: text.slice(iconSource.length).trim(),
      };
    }
  }

  return {
    icon: iconSource ? iconClassFor(iconSource, fallback) : fallbackIconFor(fallback),
    label: consumed ? parts.slice(consumed).join(' ') : text,
  };
}

function shortIconClass(iconClass) {
  return iconClass.replace(/^fa-solid\s+/, '');
}

function iconInputValue(value, fallback = DEFAULT_ICON) {
  return shortIconClass(iconClassFor(value, fallback));
}

function iconTextInputValue(value, fallback = DEFAULT_ICON) {
  const { icon, label } = splitIconText(value, fallback);
  const iconName = shortIconClass(icon);
  return label ? `${iconName} ${label}` : iconName;
}

function normalizeIconForStorage(value, fallback = DEFAULT_ICON) {
  const raw = String(value ?? '').trim();
  return iconInputValue(raw || fallback, fallback);
}

function normalizeIconTextForStorage(value, fallback = DEFAULT_ICON) {
  const raw = String(value ?? '').trim();
  if (!raw) return null;
  return iconTextInputValue(raw, fallback);
}

function formatPrice(value) {
  return 'R$ ' + Number(value || 0).toFixed(2).replace('.', ',');
}

function truncate(value, max = 60) {
  const text = String(value || '');
  return text.length > max ? text.slice(0, max) + '...' : text;
}

function formatAuthError(error) {
  const message = String(error?.message || '').toLowerCase();

  if (message.includes('email not confirmed')) {
    return 'E-mail ainda não confirmado no Supabase. Em Authentication > Users, confirme o usuário ou desative a confirmação de e-mail.';
  }

  if (message.includes('invalid login credentials')) {
    return 'E-mail ou senha incorretos, ou esse usuário foi criado em outro projeto Supabase.';
  }

  if (message.includes('signup disabled')) {
    return 'Login por e-mail/senha está desativado no Supabase Auth.';
  }

  return error?.message || 'Não foi possível entrar. Confira o usuário no Supabase Auth.';
}

function toast(msg, isError = false) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'show' + (isError ? ' error' : '');
  clearTimeout(el._t);
  el._t = setTimeout(() => { el.className = ''; }, 3000);
}

async function doLogin() {
  const email = document.getElementById('loginEmail').value.trim();
  const pass = document.getElementById('loginPass').value;
  const btn = document.getElementById('loginBtn');
  const err = document.getElementById('loginError');

  if (!db) {
    try {
      await loadRuntimeConfig();
    } catch (error) {
      err.textContent = error.message;
      err.style.display = 'block';
      return;
    }
  }

  if (!email || !pass) {
    err.textContent = 'Preencha e-mail e senha.';
    err.style.display = 'block';
    return;
  }

  btn.textContent = 'Entrando...';
  btn.disabled = true;
  const { data, error } = await db.auth.signInWithPassword({ email, password: pass });
  btn.textContent = 'Entrar';
  btn.disabled = false;

  if (error) {
    err.textContent = formatAuthError(error);
    err.style.display = 'block';
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

const TABS = {
  dashboard: { title: `${iconHtml('fa-chart-line')} Dashboard`, actions: '' },
  cardapio: {
    title: `${iconHtml('fa-wheat-awn')} Cardápio`,
    actions: `<button class="btn btn-terra btn-sm" onclick="openItemModal()">${iconHtml('fa-plus')} Novo item</button>`,
  },
  vendaDia: { title: `${iconHtml('fa-star')} Venda do Dia`, actions: '' },
};

document.querySelectorAll('[data-tab]').forEach((el) => {
  el.addEventListener('click', (event) => {
    event.preventDefault();
    switchTab(el.dataset.tab);
  });
});

function switchTab(name) {
  document.querySelectorAll('.tab-panel').forEach((panel) => panel.classList.remove('active'));
  document.querySelectorAll('[data-tab]').forEach((anchor) => anchor.classList.remove('active'));
  document.getElementById('panel-' + name)?.classList.add('active');
  document.querySelectorAll(`[data-tab="${name}"]`).forEach((anchor) => anchor.classList.add('active'));
  document.getElementById('topbarTitle').innerHTML = TABS[name]?.title || escapeHtml(name);
  document.getElementById('topbarActions').innerHTML = TABS[name]?.actions || '';
  if (name === 'vendaDia') loadVendaDiaForm();
}

async function loadAll() {
  await loadCardapio();
  await loadDashboard();
}

const CAT_LABELS = { salgado: 'Salgado', doce: 'Doce', especial: 'Especial' };
const CAT_COLORS = { salgado: '#4A6741', doce: '#D4943A', especial: '#C5622A' };

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

function renderCardapioTable(items) {
  const tbody = document.getElementById('cardapioTable');
  if (!items.length) {
    tbody.innerHTML = `<tr><td colspan="7">
      <div class="empty-state"><div class="empty-icon">${iconHtml('fa-wheat-awn')}</div>Nenhum item ainda. Clique em "Novo item".</div>
    </td></tr>`;
    return;
  }

  tbody.innerHTML = items.map((item) => {
    const category = item.categoria || 'salgado';
    const color = CAT_COLORS[category] || CAT_COLORS.salgado;
    return `
      <tr>
        <td><span class="item-icon">${iconHtml(item.emoji, category)}</span></td>
        <td>
          <strong style="font-size:.88rem">${escapeHtml(item.nome)}</strong>
          ${item.descricao ? `<div style="font-size:.75rem;color:var(--cafe-lt);margin-top:.15rem">${escapeHtml(truncate(item.descricao))}</div>` : ''}
        </td>
        <td>
          <span class="badge" style="background:${color}22;color:${color}">
            <span class="category-dot" style="background:${color}"></span>
            ${escapeHtml(CAT_LABELS[category] || category)}
          </span>
        </td>
        <td style="font-weight:500">${formatPrice(item.preco)}</td>
        <td>${item.destaque ? `<span class="badge badge-milho">${iconHtml('fa-star')} Sim</span>` : '<span class="badge badge-gray">-</span>'}</td>
        <td>
          <label class="toggle" style="margin:0">
            <input type="checkbox" ${item.ativo ? 'checked' : ''} onchange="toggleAtivo('${escapeHtml(jsString(item.id))}', this.checked)" />
            <span class="slider"></span>
          </label>
        </td>
        <td style="display:flex;gap:.4rem">
          <button class="btn btn-ghost btn-sm" onclick="openItemModal('${escapeHtml(jsString(item.id))}')" aria-label="Editar" title="Editar">${iconHtml('fa-pen-to-square')}</button>
          <button class="btn btn-danger btn-sm" onclick="openConfirmDelete('${escapeHtml(jsString(item.id))}','${escapeHtml(jsString(item.nome))}')" aria-label="Excluir" title="Excluir">${iconHtml('fa-trash')}</button>
        </td>
      </tr>
    `;
  }).join('');
}

function renderDashTable(items) {
  const tbody = document.getElementById('dashTable');
  if (!items.length) {
    tbody.innerHTML = '<tr class="loading-row"><td colspan="4">Nenhum item.</td></tr>';
    return;
  }

  tbody.innerHTML = items.slice(0, 8).map((item) => {
    const category = item.categoria || 'salgado';
    const color = CAT_COLORS[category] || CAT_COLORS.salgado;
    return `
      <tr>
        <td><span class="item-icon">${iconHtml(item.emoji, category)}</span> <strong style="font-size:.86rem">${escapeHtml(item.nome)}</strong></td>
        <td><span class="badge" style="background:${color}22;color:${color}">${escapeHtml(CAT_LABELS[category] || category)}</span></td>
        <td>${formatPrice(item.preco)}</td>
        <td>${item.ativo ? `<span class="badge badge-green">${iconHtml('fa-check')} Ativo</span>` : '<span class="badge badge-gray">Inativo</span>'}</td>
      </tr>
    `;
  }).join('');
}

function updateStats(items) {
  document.getElementById('statTotal').textContent = items.length;
  document.getElementById('statAtivos').textContent = items.filter((item) => item.ativo).length;
}

async function toggleAtivo(id, val) {
  try {
    await apiFetch(`/api/cardapio/${id}`, {
      method: 'PATCH',
      body: { ativo: val },
    });
    toast(val ? 'Item ativado' : 'Item desativado');
    const item = cardapioData.find((entry) => entry.id === id);
    if (item) item.ativo = val;
    updateStats(cardapioData);
  } catch (error) {
    toast('Erro ao atualizar: ' + error.message, true);
  }
}

function openItemModal(id) {
  const modal = document.getElementById('itemModal');
  if (id) {
    const item = cardapioData.find((entry) => entry.id === id);
    if (!item) return;
    document.getElementById('itemModalTitle').innerHTML = `${iconHtml('fa-pen-to-square')} Editar item`;
    document.getElementById('itemId').value = item.id;
    document.getElementById('itemNome').value = item.nome;
    document.getElementById('itemEmoji').value = iconInputValue(item.emoji, item.categoria);
    document.getElementById('itemDesc').value = item.descricao || '';
    document.getElementById('itemCategoria').value = item.categoria;
    document.getElementById('itemPreco').value = item.preco;
    document.getElementById('itemOrdem').value = item.ordem || 0;
    document.getElementById('itemBadge').value = item.badge_texto ? iconTextInputValue(item.badge_texto, 'fa-solid fa-star') : '';
    document.getElementById('itemAtivo').checked = item.ativo;
    document.getElementById('itemDestaque').checked = item.destaque;
  } else {
    document.getElementById('itemModalTitle').innerHTML = `${iconHtml('fa-plus')} Novo item`;
    ['itemId', 'itemNome', 'itemEmoji', 'itemDesc', 'itemBadge'].forEach((fieldId) => {
      document.getElementById(fieldId).value = '';
    });
    document.getElementById('itemCategoria').value = 'salgado';
    document.getElementById('itemPreco').value = '';
    document.getElementById('itemOrdem').value = cardapioData.length;
    document.getElementById('itemAtivo').checked = true;
    document.getElementById('itemDestaque').checked = false;
  }
  modal.classList.add('open');
}

function closeItemModal() {
  document.getElementById('itemModal').classList.remove('open');
}

function closeItemModalOutside(event) {
  if (event.target.id === 'itemModal') closeItemModal();
}

async function saveItem() {
  const id = document.getElementById('itemId').value;
  const nome = document.getElementById('itemNome').value.trim();
  const preco = parseFloat(document.getElementById('itemPreco').value);
  const categoria = document.getElementById('itemCategoria').value;

  if (!nome) {
    toast('Nome é obrigatório', true);
    return;
  }
  if (Number.isNaN(preco)) {
    toast('Preço inválido', true);
    return;
  }

  const payload = {
    nome,
    emoji: normalizeIconForStorage(document.getElementById('itemEmoji').value, categoria),
    descricao: document.getElementById('itemDesc').value.trim(),
    categoria,
    preco,
    ordem: parseInt(document.getElementById('itemOrdem').value, 10) || 0,
    badge_texto: normalizeIconTextForStorage(document.getElementById('itemBadge').value, 'fa-solid fa-star'),
    ativo: document.getElementById('itemAtivo').checked,
    destaque: document.getElementById('itemDestaque').checked,
  };

  try {
    await apiFetch(id ? `/api/cardapio/${id}` : '/api/cardapio', {
      method: id ? 'PATCH' : 'POST',
      body: payload,
    });
    toast('Item salvo com sucesso!');
    closeItemModal();
    loadCardapio();
  } catch (error) {
    toast('Erro ao salvar: ' + error.message, true);
  }
}

function openConfirmDelete(id, nome) {
  deleteTarget = id;
  document.getElementById('confirmName').textContent = nome;
  document.getElementById('confirmModal').classList.add('open');
}

function closeConfirmModal() {
  document.getElementById('confirmModal').classList.remove('open');
  deleteTarget = null;
}

function closeConfirmModalOutside(event) {
  if (event.target.id === 'confirmModal') closeConfirmModal();
}

async function confirmDelete() {
  if (!deleteTarget) return;
  try {
    await apiFetch(`/api/cardapio/${deleteTarget}`, { method: 'DELETE' });
    toast('Item excluído');
    closeConfirmModal();
    loadCardapio();
  } catch (error) {
    toast('Erro ao excluir: ' + error.message, true);
  }
}

document.getElementById('tagInput').addEventListener('keydown', (event) => {
  if ((event.key === 'Enter' || event.key === ',') && event.target.value.trim()) {
    event.preventDefault();
    addTag(event.target.value.trim());
    event.target.value = '';
  }
  if (event.key === 'Backspace' && !event.target.value && ingredientes.length) {
    ingredientes.pop();
    renderTags();
  }
});
document.getElementById('tagWrap').addEventListener('focusin', () => {
  document.getElementById('tagWrap').classList.add('focused');
});
document.getElementById('tagWrap').addEventListener('focusout', () => {
  document.getElementById('tagWrap').classList.remove('focused');
});

function addTag(value) {
  if (!ingredientes.includes(value)) {
    ingredientes.push(value);
    renderTags();
  }
}

function removeTag(index) {
  ingredientes.splice(index, 1);
  renderTags();
}

function renderTags() {
  document.getElementById('tagList').innerHTML = ingredientes.map((tag, index) => (
    `<span class="tag-chip">${escapeHtml(tag)}<button type="button" onclick="removeTag(${index})">x</button></span>`
  )).join('');
}

function adjustUnits(delta) {
  const input = document.getElementById('vdUnidadesTotal');
  input.value = Math.max(1, (parseInt(input.value, 10) || 40) + delta);
  syncUnitsDisplay();
}

function syncUnitsDisplay() {
  const val = parseInt(document.getElementById('vdUnidadesTotal').value, 10) || 40;
  document.getElementById('unitsDisplay').textContent = val;
  document.getElementById('vdMaxLabel').textContent = 'de ' + val;
  document.getElementById('vdStockFill').style.width = '100%';
}

async function loadVendaDiaForm() {
  const hoje = new Date().toISOString().split('T')[0];
  document.getElementById('vdData').value = hoje;

  let data = null;
  try {
    data = await apiFetch(`/api/venda-dia?date=${hoje}&admin=1`);
  } catch (error) {
    toast('Erro ao carregar venda do dia: ' + error.message, true);
  }

  if (data) {
    document.getElementById('vdNome').value = data.nome;
    document.getElementById('vdEmoji').value = iconInputValue(data.emoji, 'fa-solid fa-wheat-awn');
    document.getElementById('vdDesc').value = data.descricao || '';
    document.getElementById('vdPreco').value = data.preco || '';
    document.getElementById('vdAtivo').checked = data.ativo;
    document.getElementById('vdUnidadesTotal').value = data.unidades_total;
    ingredientes = data.ingredientes || [];
  } else {
    document.getElementById('vdNome').value = '';
    document.getElementById('vdEmoji').value = '';
    document.getElementById('vdDesc').value = '';
    document.getElementById('vdPreco').value = '';
    document.getElementById('vdAtivo').checked = true;
    document.getElementById('vdUnidadesTotal').value = 40;
    ingredientes = [];
  }

  renderTags();
  syncUnitsDisplay();
  loadVdHistory();
  updateVdStats(data);
}

function updateVdStats(vd) {
  if (vd) {
    const rest = vd.unidades_total - (vd.unidades_vendidas || 0);
    document.getElementById('statVd').textContent = truncate(vd.nome, 18);
    document.getElementById('statRest').textContent = rest + ' un.';
  } else {
    document.getElementById('statVd').textContent = 'Não definida';
    document.getElementById('statRest').textContent = '-';
  }
}

async function saveVendaDia() {
  const nome = document.getElementById('vdNome').value.trim();
  const preco = parseFloat(document.getElementById('vdPreco').value);
  const data = document.getElementById('vdData').value;

  if (!nome) {
    toast('Nome é obrigatório', true);
    return;
  }
  if (!data) {
    toast('Data é obrigatória', true);
    return;
  }

  const payload = {
    nome,
    emoji: normalizeIconForStorage(document.getElementById('vdEmoji').value, 'fa-solid fa-wheat-awn'),
    descricao: document.getElementById('vdDesc').value.trim(),
    preco: Number.isNaN(preco) ? null : preco,
    data,
    unidades_total: parseInt(document.getElementById('vdUnidadesTotal').value, 10) || 40,
    unidades_vendidas: 0,
    ativo: document.getElementById('vdAtivo').checked,
    ingredientes,
  };

  try {
    await apiFetch('/api/venda-dia', {
      method: 'POST',
      body: payload,
    });
    toast('Venda do dia salva!');
    loadVdHistory();
    loadDashboard();
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
  if (!data?.length) {
    tbody.innerHTML = '<tr class="loading-row"><td colspan="6">Nenhum registro ainda.</td></tr>';
    return;
  }

  tbody.innerHTML = data.map((vd) => {
    const rest = vd.unidades_total - (vd.unidades_vendidas || 0);
    return `<tr>
      <td>${escapeHtml(vd.data)}</td>
      <td><span class="item-icon">${iconHtml(vd.emoji, 'fa-solid fa-wheat-awn')}</span> ${escapeHtml(vd.nome)}</td>
      <td>${escapeHtml(vd.unidades_total)}</td>
      <td>${escapeHtml(vd.unidades_vendidas || 0)}</td>
      <td>${vd.ativo ? '<span class="badge badge-green">Ativo</span>' : '<span class="badge badge-gray">Inativo</span>'}</td>
      <td><button class="btn btn-ghost btn-sm" onclick="loadVdById('${escapeHtml(jsString(vd.id))}')" aria-label="Editar" title="Editar">${iconHtml('fa-pen-to-square')}</button></td>
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

  document.getElementById('vdNome').value = data.nome;
  document.getElementById('vdEmoji').value = iconInputValue(data.emoji, 'fa-solid fa-wheat-awn');
  document.getElementById('vdDesc').value = data.descricao || '';
  document.getElementById('vdPreco').value = data.preco || '';
  document.getElementById('vdData').value = data.data;
  document.getElementById('vdAtivo').checked = data.ativo;
  document.getElementById('vdUnidadesTotal').value = data.unidades_total;
  ingredientes = data.ingredientes || [];
  renderTags();
  syncUnitsDisplay();
  switchTab('vendaDia');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function loadDashboard() {
  const hoje = new Date().toISOString().split('T')[0];
  try {
    const vd = await apiFetch(`/api/venda-dia?date=${hoje}&admin=1`);
    updateVdStats(vd);
  } catch {
    updateVdStats(null);
  }
}

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
