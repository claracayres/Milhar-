async function apiGet(path) {
  const response = await fetch('/api' + path, {
    headers: { Accept: 'application/json' },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'Erro ao carregar dados.');
  return payload.data;
}
 function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }[ch]));
}
 function formatPrice(value) {
  return 'R$ ' + Number(value || 0).toFixed(2).replace('.', ',');
}
 /* ── cores por categoria ── */
const CAT_COLORS = {
  salgado:  'linear-gradient(90deg,#4A6741,#2d4228)',
  doce:     'linear-gradient(90deg,#e8c96a,#D9A441)',
  especial: 'linear-gradient(90deg,#C5622A,#8a3518)',
};
 /* ── render de um card ── */
function renderCard(item, delay) {
  const topStyle = CAT_COLORS[item.categoria] || CAT_COLORS.especial;
  const badge = item.destaque
    ? `<div class="rc-badge">${escapeHtml(item.badge_texto || '⭐ especial')}</div>` : '';
  return `
    <div class="recipe-card reveal${delay ? ' d'+delay : ''}" data-cat="${escapeHtml(item.categoria || 'especial')}">
      <div class="rc-top" style="background:${topStyle}"></div>
      ${badge}
      <div class="rc-body">
        <div class="rc-emoji">${escapeHtml(item.emoji || '🌽')}</div>
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
 /* ── carrega cardápio do Supabase ── */
async function loadMenu() {
  const grid = document.getElementById('menuGrid');
  try {
    const data = await apiGet('/cardapio');
    if (!data || !data.length) {
      grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;font-family:Caveat,cursive;font-size:1.2rem;color:var(--cafe-lt);padding:2rem">Nenhum item ainda. 🌽</p>';
      return;
    }
    grid.innerHTML = data.map((item, i) => renderCard(item, (i % 3) + 1)).join('');
    grid.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));
    filterMenu(document.querySelector('.tab.active')?.dataset.filter || 'all');
  } catch {
    loadMenuStatic();
  }
}
 /* ── fallback estático ── */
function loadMenuStatic() {
  const items = [
    { nome:'Pamonha Tradicional',        emoji:'🫕', descricao:'A clássica de sempre. Milho fresco, textura cremosa e aquele sabor que te leva pra casa da vó.', preco:8,  categoria:'salgado',  destaque:false },
    { nome:'Pamonha de Queijo Meia Cura', emoji:'🧀', descricao:'Queijo meia cura artesanal no centro. Derrete, puxa, abraça.',                                  preco:12, categoria:'especial', destaque:true,  badge_texto:'⭐ mais pedida' },
    { nome:'Pamonha de Coco Cremoso',    emoji:'🥥', descricao:'Leite de coco fresco na massa. Doce, delicada, cremosa.',                                        preco:10, categoria:'doce',     destaque:false },
    { nome:'Romeu e Julieta',            emoji:'💜', descricao:'Goiabada cascão com queijo branco cremoso.',                                                     preco:13, categoria:'doce',     destaque:false },
    { nome:'Pamonha de Doce de Leite',   emoji:'🍯', descricao:'Doce de leite artesanal no recheio. Derrete na boca, abraça o coração.',                        preco:11, categoria:'doce',     destaque:false },
    { nome:'Pamonha Assada',             emoji:'🔥', descricao:'Casquinha caramelizada na brasa, por dentro cremosa.',                                           preco:14, categoria:'especial', destaque:true,  badge_texto:'🔥 exclusiva' },
  ];
  const grid = document.getElementById('menuGrid');
  grid.innerHTML = items.map((item, i) => renderCard(item, (i % 3) + 1)).join('');
  grid.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));
}
 /* ── carrega venda do dia ── */
async function loadVendaDia() {
  try {
    const data = await apiGet('/venda-dia');
    if (data) renderVendaDia(data);
  } catch { /* mantém fallback do HTML */ }
}
 function renderVendaDia(vd) {
  const restantes = vd.unidades_total - (vd.unidades_vendidas || 0);
  const pct = Math.max(0, Math.min(100, (restantes / vd.unidades_total) * 100));
  const preco = 'R$ ' + Number(vd.preco || 0).toFixed(2).replace('.', ',');
   document.getElementById('heroSpecialName').textContent  = vd.nome;
  document.getElementById('heroSpecialEmoji').textContent = vd.emoji || '🌽';
  document.getElementById('heroSpecialPrice').textContent = preco;
  document.getElementById('heroSpecialUnits').textContent = restantes;
   const ingList = document.getElementById('heroSpecialIngredients');
  if (vd.ingredientes?.length) {
    ingList.innerHTML = vd.ingredientes.map(i => `<li class="recipe-item">${escapeHtml(i)}</li>`).join('');
  }
   document.getElementById('specialEmoji').textContent = vd.emoji || '🌽';
  document.getElementById('specialName').textContent  = vd.nome;
  document.getElementById('specialDesc').textContent  = vd.descricao || '';
  document.getElementById('specialUnits').textContent = `🌽 ${restantes} unidades restantes`;
  document.getElementById('stockLabel').textContent   = `${restantes} de ${vd.unidades_total} unidades`;
  document.getElementById('stockBar').style.width     = pct + '%';
}
 /* ── UI ── */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => navbar.classList.toggle('scrolled', scrollY > 50), { passive: true });
 document.getElementById('hamburger').addEventListener('click', () => document.getElementById('mobileMenu').classList.add('open'));
document.getElementById('menuClose').addEventListener('click',  () => document.getElementById('mobileMenu').classList.remove('open'));
function closeMobile() { document.getElementById('mobileMenu').classList.remove('open'); }
 const revealObs = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.1 });
document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));
 function filterMenu(f) {
  document.querySelectorAll('.recipe-card').forEach(card => {
    card.style.display = (f === 'all' || card.dataset.cat === f) ? '' : 'none';
  });
}
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    filterMenu(tab.dataset.filter);
  });
});
 function tick() {
  const now = new Date(), end = new Date(now);
  end.setHours(23,59,59,0);
  const d = end - now, fmt = n => String(Math.floor(n)).padStart(2,'0');
  document.getElementById('cdH').textContent = fmt(d / 3600000);
  document.getElementById('cdM').textContent = fmt((d % 3600000) / 60000);
  document.getElementById('cdS').textContent = fmt((d % 60000) / 1000);
}
tick(); setInterval(tick, 1000);
 document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const t = document.querySelector(a.getAttribute('href'));
    if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth' }); }
  });
});
 // ── INIT ──
loadMenu();
loadVendaDia();
