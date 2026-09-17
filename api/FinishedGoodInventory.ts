import type { IncomingMessage, ServerResponse } from 'http';

export const config = {
  maxDuration: 15,
};

export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, error: 'Method Not Allowed' }));
    return;
  }

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

    const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);

    const mesResponse = await fetch('http://mes.lienchau.vn:5092/api/FinishedGoodInventory', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: payloadString,
    });

    const responseText = await mesResponse.text();
    let responseData: any;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { message: responseText };
    }

    res.statusCode = mesResponse.status;
    res.setHeader('Content-Type', 'application/json');

    if (!mesResponse.ok) {
      res.end(
        JSON.stringify({
          success: false,
          error: `MES API returned status ${mesResponse.status}`,
          details: responseData,
        })
      );
      return;
    }

    res.end(
      JSON.stringify({
        success: true,
        data: responseData,
      })
    );
  } catch (error: any) {
    console.error('Error proxying to MES API:', error);
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
