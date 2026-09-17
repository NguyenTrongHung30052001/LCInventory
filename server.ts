import express from 'express';
import path from 'path';
import http from 'http';
import { createServer as createViteServer } from 'vite';

/**
 * Utility helper to communicate directly with MES Server (http://mes.lienchau.vn:5092)
 * using Node's standard `http` module to avoid dual-stack/undici ECONNREFUSED issues.
 * Automatically falls back to direct IP 113.161.240.40 if DNS lookup fails.
 */
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
  };

  return tryRequest('mes.lienchau.vn').catch((err) => {
    console.warn('DNS/Network issue on mes.lienchau.vn, falling back to 113.161.240.40...', err?.message);
    return tryRequest('113.161.240.40');
  });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // CORS middleware for local/preview
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // GET: Fetch inventory by user (scannedBy)
  // http://mes.lienchau.vn:5092/api/FinishedGoodInventory/by-user/{scannedBy}
  app.get('/api/FinishedGoodInventory/by-user/:scannedBy', async (req, res) => {
    try {
      const { scannedBy } = req.params;
      const result = await requestMesServer(
        `/api/FinishedGoodInventory/by-user/${encodeURIComponent(scannedBy)}`,
        'GET'
      );
      return res.status(result.status).json(result.data);
    } catch (error: any) {
      console.error('Error fetching inventory by user from MES API:', error);
      return res.status(502).json({
        success: false,
        error: error.message || 'Không thể kết nối đến máy chủ MES (5092)',
      });
    }
  });

  // PUT: Update inventory item by ID (quantity, unit, note)
  // http://mes.lienchau.vn:5092/api/FinishedGoodInventory/{id}
  app.put('/api/FinishedGoodInventory/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { quantity, unit, note } = req.body;
      const payload = {
        quantity: Number(quantity),
        unit: String(unit || ''),
        note: String(note || ''),
      };

      const result = await requestMesServer(
        `/api/FinishedGoodInventory/${encodeURIComponent(id)}`,
        'PUT',
        payload
      );
      return res.status(result.status).json(result.data);
    } catch (error: any) {
      console.error('Error updating inventory item on MES API:', error);
      return res.status(502).json({
        success: false,
        error: error.message || 'Không thể kết nối đến máy chủ MES (5092)',
      });
    }
  });

  // DELETE: Delete inventory item by ID
  // http://mes.lienchau.vn:5092/api/FinishedGoodInventory/{id}
  app.delete('/api/FinishedGoodInventory/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const result = await requestMesServer(
        `/api/FinishedGoodInventory/${encodeURIComponent(id)}`,
        'DELETE'
      );
      return res.status(result.status).json(result.data);
    } catch (error: any) {
      console.error('Error deleting inventory item on MES API:', error);
      return res.status(502).json({
        success: false,
        error: error.message || 'Không thể kết nối đến máy chủ MES (5092)',
      });
    }
  });

  // POST: Push finished good inventory ticket to MES
  // http://mes.lienchau.vn:5092/api/FinishedGoodInventory
  const handleInventoryPush = async (req: express.Request, res: express.Response) => {
    try {
      const payload = req.body;
      const result = await requestMesServer(
        '/api/FinishedGoodInventory',
        'POST',
        payload
      );

      if (result.status >= 200 && result.status < 300) {
        return res.status(200).json({
          success: true,
          data: result.data,
        });
      } else {
        return res.status(result.status).json({
          success: false,
          error: `MES API returned status ${result.status}`,
          details: result.data,
        });
      }
    } catch (error: any) {
      console.error('Error forwarding to MES API:', error);
      return res.status(502).json({
        success: false,
        error: error.message || 'Không thể kết nối đến máy chủ MES (5092)',
      });
    }
  };

  app.post('/api/FinishedGoodInventory', handleInventoryPush);
  app.post('/api/inventory', handleInventoryPush);

  // Vite middleware in dev or static files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
