import http from 'http';

export const config = {
  maxDuration: 15,
};

function requestMesServer(
  targetPath: string,
  method: string,
  bodyData?: any,
  contentType: string = 'application/json'
): Promise<{ status: number; text: string; data: any }> {
  const tryRequest = (hostname: string) => {
    return new Promise<{ status: number; text: string; data: any }>((resolve, reject) => {
      const postData =
        bodyData != null
          ? typeof bodyData === 'string'
            ? bodyData
            : JSON.stringify(bodyData)
          : null;

      const headers: Record<string, string | number> = {
        Host: 'mes.lienchau.vn:5092',
        Accept: 'application/json',
      };

      if (postData != null) {
        headers['Content-Type'] = contentType;
        headers['Content-Length'] = Buffer.byteLength(postData);
      }

      const req = http.request(
        {
          hostname,
          port: 5092,
          path: targetPath,
          method,
          headers,
          timeout: 10000,
        },
        (res) => {
          let text = '';
          res.on('data', (chunk) => {
            text += chunk;
          });
          res.on('end', () => {
            let parsed: any;
            try {
              parsed = JSON.parse(text);
            } catch {
              parsed = { message: text };
            }
            resolve({
              status: res.statusCode || 200,
              text,
              data: parsed,
            });
          });
        }
      );

      req.on('error', reject);

      req.on('timeout', () => {
        req.destroy(new Error('Kết nối máy chủ MES (5092) bị quá thời gian'));
      });

      if (postData != null) {
        req.write(postData);
      }
      req.end();
    });
  };

  return tryRequest('mes.lienchau.vn').catch((err) => {
    console.warn('Fallback to direct IP 113.161.240.40 due to:', err.message);
    return tryRequest('113.161.240.40');
  });
}

export default async function handler(req: any, res: any) {
  try {
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

    let id = req.query?.id;
    if (!id && req.url) {
      const match = req.url.match(/FinishedGoodInventory\/([^?&#/]+)/);
      if (match) id = match[1];
    }

    if (!id) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: false, error: 'Thiếu ID bản ghi cần thao tác' }));
      return;
    }

    // DELETE
    if (req.method === 'DELETE') {
      const result = await requestMesServer(
        `/api/FinishedGoodInventory/${encodeURIComponent(id)}`,
        'DELETE'
      );

      res.statusCode = result.status;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(result.data));
      return;
    }

    // PUT
    if (req.method === 'PUT') {
      let payload = req.body;
      if (!payload && req.readable && req.method !== 'GET') {
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
    }

    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, error: 'Method Not Allowed' }));
  } catch (error: any) {
    console.error('Error handling inventory by ID (Vercel):', error);
    res.statusCode = 502;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        success: false,
        error: error?.message || 'Không thể kết nối đến máy chủ MES (5092)',
        details: String(error),
      })
    );
  }
}
