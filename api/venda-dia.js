const { getServiceClient, requireAdmin } = require('../lib/supabase');
const { cleanVendaDiaPayload } = require('../lib/validators');
const { getUrl, methodNotAllowed, readJson, sendError, sendJson } = require('../lib/http');

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

module.exports = async function handler(req, res) {
  try {
    const client = getServiceClient();

    if (req.method === 'GET') {
      const url = getUrl(req);
      const historyLimit = Number.parseInt(url.searchParams.get('history') || '', 10);
      const admin = url.searchParams.get('admin') === '1' || Number.isFinite(historyLimit);

      if (admin) await requireAdmin(req);

      if (Number.isFinite(historyLimit)) {
        const limit = Math.max(1, Math.min(historyLimit, 30));
        const { data, error } = await client
          .from('venda_dia')
          .select('*')
          .order('data', { ascending: false })
          .order('criado_em', { ascending: false })
          .limit(limit);

        if (error) throw error;
        return sendJson(res, 200, { data: data || [] });
      }

      const date = url.searchParams.get('date') || todayIso();
      let query = client.from('venda_dia').select('*').eq('data', date);

      if (!admin) {
        query = query.eq('ativo', true);
      }

      const { data, error } = await query
        .order('criado_em', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return sendJson(res, 200, { data: data || null });
    }

    if (req.method === 'POST') {
      await requireAdmin(req);
      const payload = cleanVendaDiaPayload(await readJson(req));
      const { data, error } = await client
        .from('venda_dia')
        .upsert(payload, { onConflict: 'data' })
        .select('*')
        .single();

      if (error) throw error;
      return sendJson(res, 200, { data });
    }

    return methodNotAllowed(res, ['GET', 'POST']);
  } catch (error) {
    return sendError(res, error);
  }
};
