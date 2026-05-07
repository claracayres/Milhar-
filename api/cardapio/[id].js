const { getServiceClient, requireAdmin } = require('../../lib/supabase');
const { cleanMenuPayload } = require('../../lib/validators');
const {
  getLastPathSegment,
  methodNotAllowed,
  readJson,
  sendError,
  sendJson,
} = require('../../lib/http');

module.exports = async function handler(req, res) {
  try {
    await requireAdmin(req);

    const id = getLastPathSegment(req);
    if (!id) return sendJson(res, 400, { error: 'ID obrigatorio.' });

    const client = getServiceClient();

    if (req.method === 'GET') {
      const { data, error } = await client.from('cardapio').select('*').eq('id', id).single();
      if (error) throw error;
      return sendJson(res, 200, { data });
    }

    if (req.method === 'PATCH') {
      const payload = cleanMenuPayload(await readJson(req), { partial: true });
      const { data, error } = await client
        .from('cardapio')
        .update(payload)
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw error;
      return sendJson(res, 200, { data });
    }

    if (req.method === 'DELETE') {
      const { error } = await client.from('cardapio').delete().eq('id', id);
      if (error) throw error;
      return sendJson(res, 200, { data: { id } });
    }

    return methodNotAllowed(res, ['GET', 'PATCH', 'DELETE']);
  } catch (error) {
    return sendError(res, error);
  }
};
