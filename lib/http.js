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

function sendError(res, error) {
  const statusCode = error.statusCode || error.status || 500;
  if (statusCode >= 500) {
    console.error(error);
  }

  return sendJson(res, statusCode, {
    error: statusCode >= 500 ? 'Erro interno no backend.' : error.message,
    ...(error.details ? { details: error.details } : {}),
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
  readJson,
  sendError,
  sendJson,
};
