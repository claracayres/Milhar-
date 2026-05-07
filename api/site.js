const { getServiceClient } = require('../lib/supabase');
const { getUrl, methodNotAllowed, sendError, sendJson } = require('../lib/http');

module.exports = async function handler(req, res) {
  try {
    if (req.method !== 'GET') {
      return methodNotAllowed(res, ['GET']);
    }

    const id = getUrl(req).searchParams.get('id') || 'homepage';
    const { data, error } = await getServiceClient()
      .from('site_content')
      .select('data')
      .eq('id', id)
      .eq('ativo', true)
      .maybeSingle();

    if (error) throw error;
    return sendJson(res, 200, { data: data?.data || null });
  } catch (error) {
    return sendError(res, error);
  }
};
