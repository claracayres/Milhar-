const { createClient } = require('@supabase/supabase-js');
const { httpError } = require('./http');

let serviceClient;

function readEnv(names) {
  for (const name of names) {
    const value = process.env[name];
    if (value) return value;
  }
  return '';
}

function getSupabaseConfig({ requireService = false } = {}) {
  const config = {
    url: readEnv(['SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL']),
    anonKey: readEnv(['SUPABASE_ANON_KEY', 'NEXT_PUBLIC_SUPABASE_ANON_KEY']),
    serviceRoleKey: readEnv(['SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_SERVICE_KEY']),
  };

  const missing = [];
  if (!config.url) missing.push('SUPABASE_URL');
  if (!config.anonKey) missing.push('SUPABASE_ANON_KEY');
  if (requireService && !config.serviceRoleKey) missing.push('SUPABASE_SERVICE_ROLE_KEY');

  if (missing.length) {
    throw httpError(500, 'Variaveis de ambiente ausentes.', { missing });
  }

  return config;
}

function getServiceClient() {
  if (!serviceClient) {
    const { url, serviceRoleKey } = getSupabaseConfig({ requireService: true });
    serviceClient = createClient(url, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return serviceClient;
}

function getAdminEmails() {
  return readEnv(['ADMIN_EMAILS', 'SUPABASE_ADMIN_EMAILS'])
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

async function requireAdmin(req) {
  const header = req.headers.authorization || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    throw httpError(401, 'Login necessario.');
  }

  const { data, error } = await getServiceClient().auth.getUser(match[1]);
  if (error || !data.user) {
    throw httpError(401, 'Sessao invalida ou expirada.');
  }

  const allowedEmails = getAdminEmails();
  if (!allowedEmails.length) {
    throw httpError(403, 'ADMIN_EMAILS nao configurado no backend.');
  }

  const userEmail = (data.user.email || '').toLowerCase();
  if (!allowedEmails.includes(userEmail)) {
    throw httpError(403, 'Usuario sem permissao de administrador.');
  }

  return data.user;
}

module.exports = {
  getServiceClient,
  getSupabaseConfig,
  requireAdmin,
};
