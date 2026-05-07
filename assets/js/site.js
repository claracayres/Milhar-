async function apiGet(path) {
  const response = await fetch('/api' + path, {
    headers: { Accept: 'application/json' },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'Erro ao carregar dados.');
  return payload.data;
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

function safeRichText(value) {
  return escapeHtml(value)
    .replace(/&lt;br\s*\/?&gt;/gi, '<br />')
    .replace(/&lt;em&gt;/gi, '<em>')
    .replace(/&lt;\/em&gt;/gi, '</em>');
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
const ICON_TOKEN_RE = new RegExp(ICON_TOKEN_PATTERN, 'gu');
const ICON_PREFIX_RE = new RegExp(`^(?:${ICON_TOKEN_PATTERN})`, 'u');
const FA_INLINE_RE = /\b(?:fa-(?:solid|regular|brands)\s+)?fa-[a-z0-9-]+\b/gi;

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

function iconHtml(value, fallback = DEFAULT_ICON, extraClass = '') {
  const classes = [iconClassFor(value, fallback), extraClass].filter(Boolean).join(' ');
  return `<i class="${escapeHtml(classes)}" aria-hidden="true"></i>`;
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

function iconTextHtml(value, fallback = DEFAULT_ICON) {
  const { icon, label } = splitIconText(value, fallback);
  const iconMarkup = iconHtml(icon, fallback, 'icon-inline');
  return label ? `${iconMarkup} ${escapeHtml(label)}` : iconMarkup;
}

function iconizeInlineText(value, fallback = DEFAULT_ICON) {
  return escapeHtml(value)
    .replace(FA_INLINE_RE, (token) => iconHtml(token, fallback, 'icon-inline'))
    .replace(ICON_TOKEN_RE, (token) => iconHtml(token, fallback, 'icon-inline'));
}

function starsHtml(value) {
  const raw = String(value ?? '');
  const count = Math.max(1, Math.min(5, (raw.match(/[\u2605\u{2B50}]/gu) || []).length || Number(raw) || 5));
  return Array.from({ length: count }, () => iconHtml('fa-star', 'fa-solid fa-star')).join('');
}

function formatPrice(value) {
  return 'R$ ' + Number(value || 0).toFixed(2).replace('.', ',');
}

function setText(selector, value) {
  if (value === undefined || value === null) return;
  const el = document.querySelector(selector);
  if (el) el.textContent = value;
}

function setRich(selector, value) {
  if (value === undefined || value === null) return;
  const el = document.querySelector(selector);
  if (el) el.innerHTML = safeRichText(value);
}

function setIconText(selector, value, fallback = DEFAULT_ICON) {
  if (value === undefined || value === null) return;
  const el = document.querySelector(selector);
  if (el) el.innerHTML = iconTextHtml(value, fallback);
}

function setIconizedText(selector, value, fallback = DEFAULT_ICON) {
  if (value === undefined || value === null) return;
  const el = document.querySelector(selector);
  if (el) el.innerHTML = iconizeInlineText(value, fallback);
}

function setMeta(name, value) {
  if (!value) return;
  const el = document.querySelector(`meta[name="${name}"]`);
  if (el) el.setAttribute('content', value);
}

function observeNewReveal(root = document) {
  root.querySelectorAll?.('.reveal').forEach((el) => revealObs.observe(el));
}

function applyLinks(links = {}) {
  if (links.ifood) {
    document.querySelectorAll('a[href*="ifood.com.br"]').forEach((link) => {
      link.href = links.ifood;
    });
  }

  if (links.whatsapp) {
    document.querySelectorAll('a[href*="wa.me/"]').forEach((link) => {
      link.href = links.whatsapp;
    });
  }

  if (links.instagram) {
    document.querySelectorAll('a[href*="instagram.com"]').forEach((link) => {
      link.href = links.instagram;
    });
  }

  if (links.instagramHandle) {
    document.querySelectorAll('.insta-handle').forEach((link) => {
      link.textContent = links.instagramHandle;
    });
  }
}

function renderSobreTags(tags = []) {
  if (!Array.isArray(tags) || !tags.length) return;
  const wrap = document.querySelector('.sobre-text-wrap > div.sobre-p');
  if (!wrap) return;

  wrap.innerHTML = tags.map((tag) => (
    `<span style="background:var(--papel-dk);border:1.5px dashed rgba(61,43,26,0.2);border-radius:4px;padding:.3rem .9rem;font-family:'Caveat',cursive;font-size:1rem;color:var(--cafe-lt)">${iconTextHtml(tag, 'fa-solid fa-wheat-awn')}</span>`
  )).join('');
}

function renderFeatures(features = []) {
  if (!Array.isArray(features) || !features.length) return;
  const wrap = document.querySelector('.feats');
  if (!wrap) return;

  wrap.innerHTML = features.map((feature) => (
    `<div class="feat"><span class="feat-emoji">${iconHtml(splitIconText(feature).icon)}</span> ${escapeHtml(splitIconText(feature).label || feature)}</div>`
  )).join('');
}

function renderTestimonials(items = []) {
  if (!Array.isArray(items) || !items.length) return;
  const grid = document.querySelector('.dep-grid');
  if (!grid) return;

  grid.innerHTML = items.slice(0, 6).map((item, index) => `
    <div class="dep-card reveal${index ? ` d${Math.min(index, 4)}` : ''}">
      <div class="dep-stars">${starsHtml(item.estrelas)}</div>
      <p class="dep-text">"${escapeHtml(item.texto || '')}"</p>
      <div class="dep-author">
        <div class="dep-avatar" style="border-color:${escapeHtml(item.cor || '#e8c96a')};background:${escapeHtml(item.fundo || '#fff9e0')};">${iconHtml(item.avatar, 'fa-solid fa-user')}</div>
        <div>
          <div class="dep-name">${escapeHtml(item.nome || '')}</div>
          <div class="dep-via">${iconizeInlineText(item.via || '', 'fa-solid fa-star')}</div>
        </div>
      </div>
    </div>
  `).join('');
  observeNewReveal(grid);
}

function renderInstagram(instagram = {}) {
  setIconizedText('.insta-title', instagram.title, 'fa-solid fa-camera-retro');

  const sub = document.querySelector('.insta-sub');
  const handle = document.querySelector('.insta-handle')?.textContent || '@milhare';
  if (sub && instagram.subtitle) {
    sub.innerHTML = `<a href="${escapeHtml(instagram.url || 'https://instagram.com/milhare')}" target="_blank" rel="noopener" class="insta-handle">${escapeHtml(handle)}</a> - ${escapeHtml(instagram.subtitle)}`;
  }

  if (Array.isArray(instagram.items) && instagram.items.length) {
    const grid = document.querySelector('.insta-grid');
    if (grid) {
      grid.innerHTML = instagram.items.slice(0, 12).map((item) => (
        `<div class="insta-item">${iconHtml(item, 'fa-solid fa-camera-retro')}</div>`
      )).join('');
    }
  }
}

function applySiteContent(content) {
  if (!content) return;

  if (content.seo?.title) document.title = content.seo.title;
  setMeta('description', content.seo?.description);

  applyLinks(content.links);

  setIconText('.hero-pre', content.hero?.pre, 'fa-solid fa-pen-nib');
  setRich('.hero-title', content.hero?.title);
  setText('.hero-handwritten', content.hero?.handwritten);
  setText('.hero-desc', content.hero?.description);

  setIconText('.sobre-kicker', content.sobre?.kicker, 'fa-solid fa-pen-nib');
  setRich('.sobre-title', content.sobre?.title);
  const sobreParagraphs = [...document.querySelectorAll('.sobre-text-wrap > p.sobre-p')];
  content.sobre?.paragraphs?.forEach((paragraph, index) => {
    if (sobreParagraphs[index]) sobreParagraphs[index].textContent = paragraph;
  });
  setText('.notebook-quote p', content.sobre?.quote ? `"${content.sobre.quote}"` : null);
  renderSobreTags(content.sobre?.tags);

  setIconText('.cardapio-kicker', content.cardapio?.kicker, 'fa-solid fa-wheat-awn');
  setText('.cardapio-title', content.cardapio?.title);
  setText('.cardapio-sub', content.cardapio?.subtitle);

  setIconText('.lim-kicker', content.limitada?.kicker, 'fa-solid fa-calendar-day');
  setRich('.lim-title', content.limitada?.title);
  setText('.lim-text', content.limitada?.text);

  setIconText('.pedir-kicker', content.pedir?.kicker, 'fa-solid fa-truck-fast');
  setRich('.pedir-title', content.pedir?.title);
  setText('.pedir-sub', content.pedir?.subtitle);
  setText('.ifood-text strong', content.pedir?.ifoodTitle);
  setRich('.ifood-text span', content.pedir?.ifoodText);
  setText('.pedir .reveal.d3 p', content.pedir?.whatsappText);
  renderFeatures(content.pedir?.features);

  renderTestimonials(content.depoimentos);
  renderInstagram({ ...(content.instagram || {}), url: content.links?.instagram });

  setText('.footer-brand p', content.footer?.description);
  const footerLines = document.querySelectorAll('.footer-bottom span');
  if (content.footer?.copyright && footerLines[0]) footerLines[0].innerHTML = iconizeInlineText(content.footer.copyright, 'fa-solid fa-wheat-awn');
  if (content.footer?.quote && footerLines[1]) footerLines[1].textContent = content.footer.quote;
}

async function loadSiteContent() {
  try {
    applySiteContent(await apiGet('/site'));
  } catch {
    // Mantem o HTML estatico como fallback quando a tabela ainda nao existe.
  }
}

const CAT_COLORS = {
  salgado: 'linear-gradient(90deg,#4A6741,#2d4228)',
  doce: 'linear-gradient(90deg,#e8c96a,#D9A441)',
  especial: 'linear-gradient(90deg,#C5622A,#8a3518)',
};

function renderCard(item, delay) {
  const topStyle = CAT_COLORS[item.categoria] || CAT_COLORS.especial;
  const badge = item.destaque
    ? `<div class="rc-badge">${iconTextHtml(item.badge_texto || 'fa-star especial', 'fa-solid fa-star')}</div>`
    : '';

  return `
    <div class="recipe-card reveal${delay ? ` d${delay}` : ''}" data-cat="${escapeHtml(item.categoria || 'especial')}">
      <div class="rc-top" style="background:${topStyle}"></div>
      ${badge}
      <div class="rc-body">
        <div class="rc-emoji">${iconHtml(item.emoji, item.categoria || 'especial')}</div>
        <div class="rc-name">${escapeHtml(item.nome)}</div>
        <div class="rc-desc">${escapeHtml(item.descricao || '')}</div>
      </div>
      <hr class="rc-rule" />
      <div class="rc-price-row">
        <div class="rc-price">${formatPrice(item.preco)}</div>
        <div class="rc-per">por unidade</div>
      </div>
    </div>`;
}

function renderFooterFlavors(items = []) {
  const footerLists = document.querySelectorAll('.footer-col ul');
  const flavorsList = footerLists[1];
  if (!flavorsList || !items.length) return;

  flavorsList.innerHTML = items.slice(0, 6).map((item) => (
    `<li><a href="#cardapio">${escapeHtml(item.nome)}</a></li>`
  )).join('');
}

async function loadMenu() {
  const grid = document.getElementById('menuGrid');
  try {
    const data = await apiGet('/cardapio');
    if (!data || !data.length) {
      grid.innerHTML = `<p style="grid-column:1/-1;text-align:center;font-family:Caveat,cursive;font-size:1.2rem;color:var(--cafe-lt);padding:2rem">${iconHtml('fa-wheat-awn', DEFAULT_ICON, 'icon-inline')} Nenhum item ainda.</p>`;
      return;
    }

    grid.innerHTML = data.map((item, i) => renderCard(item, (i % 3) + 1)).join('');
    observeNewReveal(grid);
    renderFooterFlavors(data);
    filterMenu(document.querySelector('.tab.active')?.dataset.filter || 'all');
  } catch {
    loadMenuStatic();
  }
}

function loadMenuStatic() {
  const items = [
    { nome: 'Pamonha Tradicional', emoji: 'fa-bowl-food', descricao: 'A clássica de sempre. Milho fresco, textura cremosa e aquele sabor que te leva pra casa da vó.', preco: 8, categoria: 'salgado', destaque: false },
    { nome: 'Pamonha de Queijo Meia Cura', emoji: 'fa-cheese', descricao: 'Queijo meia cura artesanal no centro. Derrete, puxa, abraça.', preco: 12, categoria: 'especial', destaque: true, badge_texto: 'fa-star mais pedida' },
    { nome: 'Pamonha de Coco Cremoso', emoji: 'fa-seedling', descricao: 'Leite de coco fresco na massa. Doce, delicada, cremosa.', preco: 10, categoria: 'doce', destaque: false },
    { nome: 'Romeu e Julieta', emoji: 'fa-heart', descricao: 'Goiabada cascão com queijo branco cremoso.', preco: 13, categoria: 'doce', destaque: false },
    { nome: 'Pamonha de Doce de Leite', emoji: 'fa-jar', descricao: 'Doce de leite artesanal no recheio. Derrete na boca, abraça o coração.', preco: 11, categoria: 'doce', destaque: false },
    { nome: 'Pamonha Assada', emoji: 'fa-fire', descricao: 'Casquinha caramelizada na brasa, por dentro cremosa.', preco: 14, categoria: 'especial', destaque: true, badge_texto: 'fa-fire exclusiva' },
  ];
  const grid = document.getElementById('menuGrid');
  grid.innerHTML = items.map((item, i) => renderCard(item, (i % 3) + 1)).join('');
  observeNewReveal(grid);
}

async function loadVendaDia() {
  try {
    const data = await apiGet('/venda-dia');
    if (data) renderVendaDia(data);
  } catch {
    // Mantem fallback do HTML.
  }
}

function renderVendaDia(vd) {
  const total = Number(vd.unidades_total || 1);
  const restantes = Math.max(0, total - (vd.unidades_vendidas || 0));
  const pct = Math.max(0, Math.min(100, (restantes / total) * 100));

  document.getElementById('heroSpecialName').textContent = vd.nome;
  document.getElementById('heroSpecialEmoji').innerHTML = iconHtml(vd.emoji, 'fa-solid fa-wheat-awn');
  document.getElementById('heroSpecialPrice').textContent = formatPrice(vd.preco);
  document.getElementById('heroSpecialUnits').textContent = restantes;

  const ingList = document.getElementById('heroSpecialIngredients');
  if (vd.ingredientes?.length) {
    ingList.innerHTML = vd.ingredientes.map((i) => `<li class="recipe-item">${escapeHtml(i)}</li>`).join('');
  }

  document.getElementById('specialEmoji').innerHTML = iconHtml(vd.emoji, 'fa-solid fa-wheat-awn');
  document.getElementById('specialName').textContent = vd.nome;
  document.getElementById('specialDesc').textContent = vd.descricao || '';
  document.getElementById('specialUnits').innerHTML = `${iconHtml(vd.emoji, 'fa-solid fa-wheat-awn', 'icon-inline')} ${restantes} unidades restantes`;
  document.getElementById('stockLabel').textContent = `${restantes} de ${total} unidades`;
  document.getElementById('stockBar').style.width = pct + '%';
}

const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => navbar.classList.toggle('scrolled', scrollY > 50), { passive: true });

document.getElementById('hamburger').addEventListener('click', () => {
  document.getElementById('mobileMenu').classList.add('open');
});
document.getElementById('menuClose').addEventListener('click', () => {
  document.getElementById('mobileMenu').classList.remove('open');
});

function closeMobile() {
  document.getElementById('mobileMenu').classList.remove('open');
}

const revealObs = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
}, { threshold: 0.1 });
observeNewReveal();

function filterMenu(filter) {
  document.querySelectorAll('.recipe-card').forEach((card) => {
    card.style.display = (filter === 'all' || card.dataset.cat === filter) ? '' : 'none';
  });
}

document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((item) => item.classList.remove('active'));
    tab.classList.add('active');
    filterMenu(tab.dataset.filter);
  });
});

function tick() {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 0);
  const diff = end - now;
  const fmt = (n) => String(Math.floor(n)).padStart(2, '0');
  document.getElementById('cdH').textContent = fmt(diff / 3600000);
  document.getElementById('cdM').textContent = fmt((diff % 3600000) / 60000);
  document.getElementById('cdS').textContent = fmt((diff % 60000) / 1000);
}
tick();
setInterval(tick, 1000);

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener('click', (event) => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (target) {
      event.preventDefault();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

loadSiteContent();
loadMenu();
loadVendaDia();
