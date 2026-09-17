import { requestMesServer } from '../_lib/mesClient';

export const config = {
  maxDuration: 15,
};

export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PUT,DELETE,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  const { id } = req.query || {};
  if (!id) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, error: 'Missing ID parameter' }));
    return;
  }

  // DELETE
  if (req.method === 'DELETE') {
    try {
      const result = await requestMesServer(
        `/api/FinishedGoodInventory/${encodeURIComponent(id)}`,
        'DELETE'
      );

      res.statusCode = result.status;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(result.data));
      return;
    } catch (error: any) {
      console.error('Error deleting from MES API (Vercel):', error);
      res.statusCode = 502;
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          success: false,
          error: error.message || 'Không thể kết nối đến máy chủ MES (5092)',
        })
      );
      return;
    }
  }

  // PUT
  if (req.method === 'PUT') {
    try {
      let payload = req.body;
      if (!payload && req.readable) {
        const chunks: Buffer[] = [];
        for await (const chunk of req) {
          chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
        }
        const rawStr = Buffer.concat(chunks).toString('utf-8');
        try {
          payload = JSON.parse(rawStr);
        } catch {
          payload = rawStr;
        }
      }

      const { quantity, unit, note } = payload || {};
      const updatePayload = {
        quantity: Number(quantity),
        unit: String(unit || ''),
        note: String(note || ''),
      };

      const result = await requestMesServer(
        `/api/FinishedGoodInventory/${encodeURIComponent(id)}`,
        'PUT',
        updatePayload
      );

      res.statusCode = result.status;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(result.data));
      return;
    } catch (error: any) {
      console.error('Error updating to MES API (Vercel):', error);
      res.statusCode = 502;
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          success: false,
          error: error.message || 'Không thể kết nối đến máy chủ MES (5092)',
        })
      );
      return;
    }
  }

  res.statusCode = 405;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ success: false, error: 'Method Not Allowed' }));
}
