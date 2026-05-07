const { httpError } = require('./http');

const CATEGORIES = new Set(['salgado', 'doce', 'especial']);

function has(input, key) {
  return Object.prototype.hasOwnProperty.call(input, key);
}

function text(value, field, { max = 255, required = false, fallback = null } = {}) {
  if (value === undefined || value === null) {
    if (required) throw httpError(400, `${field} e obrigatorio.`);
    return fallback;
  }

  const out = String(value).trim();
  if (required && !out) throw httpError(400, `${field} e obrigatorio.`);
  return out ? out.slice(0, max) : fallback;
}

function bool(value, fallback = false) {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return ['1', 'true', 'sim', 'yes'].includes(value.toLowerCase());
  return Boolean(value);
}

function number(value, field, { required = false, fallback = null, min = null } = {}) {
  if (value === undefined || value === null || value === '') {
    if (required) throw httpError(400, `${field} e obrigatorio.`);
    return fallback;
  }

  const out = Number(value);
  if (!Number.isFinite(out)) throw httpError(400, `${field} invalido.`);
  if (min !== null && out < min) throw httpError(400, `${field} deve ser maior ou igual a ${min}.`);
  return out;
}

function integer(value, field, { fallback = 0, min = null } = {}) {
  const out = Number.parseInt(value, 10);
  if (!Number.isFinite(out)) return fallback;
  if (min !== null && out < min) throw httpError(400, `${field} deve ser maior ou igual a ${min}.`);
  return out;
}

function cleanMenuPayload(input, { partial = false } = {}) {
  const payload = {};

  if (!partial || has(input, 'nome')) {
    payload.nome = text(input.nome, 'nome', { max: 120, required: !partial });
  }

  if (!partial || has(input, 'emoji')) {
    payload.emoji = text(input.emoji, 'emoji', { max: 16, fallback: '🌽' });
  }

  if (!partial || has(input, 'descricao')) {
    payload.descricao = text(input.descricao, 'descricao', { max: 600, fallback: '' });
  }

  if (!partial || has(input, 'categoria')) {
    const categoria = text(input.categoria, 'categoria', {
      max: 24,
      required: !partial,
      fallback: 'salgado',
    });
    if (!CATEGORIES.has(categoria)) throw httpError(400, 'categoria invalida.');
    payload.categoria = categoria;
  }

  if (!partial || has(input, 'preco')) {
    payload.preco = number(input.preco, 'preco', { required: !partial, min: 0 });
  }

  if (!partial || has(input, 'ordem')) {
    payload.ordem = integer(input.ordem, 'ordem', { fallback: 0 });
  }

  if (!partial || has(input, 'badge_texto')) {
    payload.badge_texto = text(input.badge_texto, 'badge_texto', { max: 80, fallback: null });
  }

  if (!partial || has(input, 'ativo')) {
    payload.ativo = bool(input.ativo, true);
  }

  if (!partial || has(input, 'destaque')) {
    payload.destaque = bool(input.destaque, false);
  }

  if (partial && !Object.keys(payload).length) {
    throw httpError(400, 'Nenhum campo enviado para atualizar.');
  }

  return payload;
}

function cleanIngredients(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item).trim())
    .filter(Boolean)
    .slice(0, 12)
    .map((item) => item.slice(0, 80));
}

function cleanVendaDiaPayload(input, { partial = false } = {}) {
  const payload = {};

  if (!partial || has(input, 'nome')) {
    payload.nome = text(input.nome, 'nome', { max: 120, required: !partial });
  }

  if (!partial || has(input, 'emoji')) {
    payload.emoji = text(input.emoji, 'emoji', { max: 16, fallback: '🌽' });
  }

  if (!partial || has(input, 'descricao')) {
    payload.descricao = text(input.descricao, 'descricao', { max: 700, fallback: '' });
  }

  if (!partial || has(input, 'preco')) {
    payload.preco = number(input.preco, 'preco', { fallback: null, min: 0 });
  }

  if (!partial || has(input, 'data')) {
    const data = text(input.data, 'data', { max: 10, required: !partial });
    if (data && !/^\d{4}-\d{2}-\d{2}$/.test(data)) throw httpError(400, 'data invalida.');
    payload.data = data;
  }

  if (!partial || has(input, 'unidades_total')) {
    payload.unidades_total = integer(input.unidades_total, 'unidades_total', {
      fallback: 40,
      min: 1,
    });
  }

  if (!partial || has(input, 'unidades_vendidas')) {
    payload.unidades_vendidas = integer(input.unidades_vendidas, 'unidades_vendidas', {
      fallback: 0,
      min: 0,
    });
  }

  if (!partial || has(input, 'ativo')) {
    payload.ativo = bool(input.ativo, true);
  }

  if (!partial || has(input, 'ingredientes')) {
    payload.ingredientes = cleanIngredients(input.ingredientes);
  }

  const total = payload.unidades_total ?? input.unidades_total;
  const sold = payload.unidades_vendidas ?? input.unidades_vendidas;
  if (total !== undefined && sold !== undefined && Number(sold) > Number(total)) {
    throw httpError(400, 'unidades_vendidas nao pode ser maior que unidades_total.');
  }

  if (partial && !Object.keys(payload).length) {
    throw httpError(400, 'Nenhum campo enviado para atualizar.');
  }

  return payload;
}

module.exports = {
  cleanMenuPayload,
  cleanVendaDiaPayload,
};
