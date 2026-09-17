import http from 'http';

/**
 * Direct HTTP request helper for MES server (http://mes.lienchau.vn:5092)
 * Avoids Node 18/20 fetch dual-stack / undici connection refused bugs.
 */
export function requestMesServer(
  targetPath: string,
  method: string,
  bodyData?: any,
  contentType: string = 'application/json'
): Promise<{ status: number; text: string; data: any }> {
  return new Promise((resolve, reject) => {
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
        hostname: 'mes.lienchau.vn',
        port: 5092,
        path: targetPath,
        method: method,
        headers: headers,
        timeout: 12000,
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

    req.on('error', (err) => {
      reject(err);
    });

    req.on('timeout', () => {
      req.destroy(new Error('Kết nối máy chủ MES (5092) bị quá thời gian quy định'));
    });

    if (postData != null) {
      req.write(postData);
    }
    req.end();
  });
}
