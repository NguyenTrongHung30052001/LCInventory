import { requestMesServer } from './_lib/mesClient';

export const config = {
  maxDuration: 15,
};

export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  try {
    // Determine the target path on MES server from req.url
    // req.url is e.g. /api/FinishedGoodInventory/by-user/105
    let targetPath = req.url || '';
    if (!targetPath.startsWith('/api')) {
      targetPath = `/api${targetPath}`;
    }

    // Health check endpoint
    if (targetPath === '/api/health' || targetPath.startsWith('/api/health?')) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ status: 'ok', time: new Date().toISOString() }));
      return;
    }

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

    const result = await requestMesServer(
      targetPath,
      req.method || 'GET',
      payload
    );

    res.statusCode = result.status;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(result.data));
  } catch (error: any) {
    console.error('Error in catch-all MES proxy handler:', error);
    res.statusCode = 502;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        success: false,
        error: error.message || 'Không thể kết nối đến máy chủ MES (5092)',
      })
    );
  }
}
