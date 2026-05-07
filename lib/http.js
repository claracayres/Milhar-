const MAX_BODY_BYTES = 1024 * 1024;

function getUrl(req) {
  return new URL(req.url || '/', `https://${req.headers.host || 'localhost'}`);
}

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.end(JSON.stringify(payload));
}

function methodNotAllowed(res, methods) {
  res.setHeader('Allow', methods.join(', '));
  return sendJson(res, 405, { error: 'Metodo nao permitido.' });
}

function httpError(statusCode, message, details) {
  const error = new Error(message);
  error.statusCode = statusCode;
  if (details) error.details = details;
  return error;
}

function normalizeBackendError(error) {
  const message = String(error?.message || '');
  const code = String(error?.code || '');

  if (
    code === '42P01'
    || code === 'PGRST205'
    || message.includes('does not exist')
    || message.toLowerCase().includes('could not find the table')
  ) {
    return httpError(
      500,
      'Tabela nao encontrada no Supabase. Rode supabase/setup.sql ou supabase/add_site_content.sql no SQL Editor.',
      { code: code || 'missing_table' },
    );
  }

  if (message.toLowerCase().includes('invalid api key')) {
    return httpError(
      500,
      'Chave do Supabase invalida. Confira SUPABASE_ANON_KEY e SUPABASE_SERVICE_ROLE_KEY.',
      { code: 'invalid_supabase_key' },
    );
  }

  if (message.toLowerCase().includes('invalid url')) {
    return httpError(
      500,
      'SUPABASE_URL invalida. Use apenas https://seu-projeto.supabase.co.',
      { code: 'invalid_supabase_url' },
    );
  }

  return error;
}

function sendError(res, error) {
  const normalized = normalizeBackendError(error);
  const statusCode = normalized.statusCode || normalized.status || 500;
  if (statusCode >= 500) {
    console.error(normalized);
  }

  return sendJson(res, statusCode, {
    error: normalized.message || 'Erro no backend.',
    ...(normalized.details ? { details: normalized.details } : {}),
  });
}

async function readJson(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    return req.body;
  }

  if (typeof req.body === 'string') {
    return req.body.trim() ? JSON.parse(req.body) : {};
  }

  if (Buffer.isBuffer(req.body)) {
    const body = req.body.toString('utf8');
    return body.trim() ? JSON.parse(body) : {};
  }

  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) {
      throw httpError(413, 'Payload grande demais.');
    }
    chunks.push(chunk);
  }

  const body = Buffer.concat(chunks).toString('utf8');
  return body.trim() ? JSON.parse(body) : {};
}

function getLastPathSegment(req) {
  const segments = getUrl(req).pathname.split('/').filter(Boolean);
  return decodeURIComponent(segments[segments.length - 1] || '');
}

module.exports = {
  getLastPathSegment,
  getUrl,
  httpError,
  methodNotAllowed,
  normalizeBackendError,
  readJson,
  sendError,
  sendJson,
};
