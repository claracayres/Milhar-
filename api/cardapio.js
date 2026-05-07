const { getServiceClient, requireAdmin } = require('../lib/supabase');
const { cleanMenuPayload } = require('../lib/validators');
const { getUrl, methodNotAllowed, readJson, sendError, sendJson } = require('../lib/http');

module.exports = async function handler(req, res) {
  try {
    const client = getServiceClient();

    if (req.method === 'GET') {
      const url = getUrl(req);
      const admin = url.searchParams.get('admin') === '1';

      if (admin) await requireAdmin(req);

      let query = client
        .from('cardapio')
        .select('*')
        .order('ordem', { ascending: true })
        .order('criado_em', { ascending: true });

      if (!admin) {
        query = query.eq('ativo', true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return sendJson(res, 200, { data: data || [] });
    }

    if (req.method === 'POST') {
      await requireAdmin(req);
      const payload = cleanMenuPayload(await readJson(req));
      const { data, error } = await client
        .from('cardapio')
        .insert(payload)
        .select('*')
        .single();

      if (error) throw error;
      return sendJson(res, 201, { data });
    }

    return methodNotAllowed(res, ['GET', 'POST']);
  } catch (error) {
    return sendError(res, error);
  }
};
