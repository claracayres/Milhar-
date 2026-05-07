const { getSupabaseConfig } = require('../lib/supabase');
const { sendError, sendJson } = require('../lib/http');

module.exports = async function handler(req, res) {
  try {
    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET');
      return sendJson(res, 405, { error: 'Metodo nao permitido.' });
    }

    const { url, anonKey } = getSupabaseConfig();
    return sendJson(res, 200, {
      data: {
        supabaseUrl: url,
        supabaseAnonKey: anonKey,
      },
    });
  } catch (error) {
    return sendError(res, error);
  }
};
