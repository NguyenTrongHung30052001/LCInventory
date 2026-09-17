import express from 'express';
import path from 'path';
import http from 'http';
import { createServer as createViteServer } from 'vite';

// Persistent keep-alive agent to reuse TCP sockets and avoid handshake latency
const mesAgent = new http.Agent({
  keepAlive: true,
  keepAliveMsecs: 60000,
  maxSockets: 64,
  maxFreeSockets: 32,
  timeout: 8000,
});

// Fast DNS cache: cache resolved IP to avoid thread-pool dns.lookup latency
let cachedHost = '113.161.240.40'; // Verified direct IP for mes.lienchau.vn

// In-memory cache for GET inventory requests with fast invalidation on mutations
interface CacheEntry {
  data: any;
  status: number;
  timestamp: number;
}
const inventoryCache = new Map<string, CacheEntry>();
const inFlightRequests = new Map<string, Promise<{ status: number; text: string; data: any }>>();
const CACHE_TTL_MS = 6000; // 6 seconds cache for instant response

function invalidateInventoryCache(scannedBy?: string) {
  if (scannedBy) {
    inventoryCache.delete(scannedBy);
  } else {
    inventoryCache.clear();
  }
}

/**
 * High-performance helper to communicate with MES Server (http://mes.lienchau.vn:5092)
 * Uses persistent TCP connection pooling (keep-alive) and direct IP routing
 * to achieve sub-100ms response times.
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
        Connection: 'keep-alive',
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
          agent: mesAgent,
          timeout: 8000,
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

      // Disable Nagle's algorithm for minimal packet transmission latency
      req.setNoDelay(true);

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

  // Fast direct IP path first (with Host header), fallback to hostname if needed
  return tryRequest(cachedHost).catch((err) => {
    console.warn(`Direct IP ${cachedHost} failed, falling back to mes.lienchau.vn...`, err?.message);
    return tryRequest('mes.lienchau.vn').then((res) => {
      // If hostname works, reset to hostname
      cachedHost = 'mes.lienchau.vn';
      return res;
    });
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

  // GET: Fetch inventory by user (scannedBy) with high-speed memory caching & deduplication
  // http://mes.lienchau.vn:5092/api/FinishedGoodInventory/by-user/{scannedBy}
  app.get('/api/FinishedGoodInventory/by-user/:scannedBy', async (req, res) => {
    try {
      const { scannedBy } = req.params;
      const isFresh = req.query.fresh === 'true';
      const now = Date.now();

      // Return fast cached response if within TTL and not forcing fresh
      if (!isFresh) {
        const cached = inventoryCache.get(scannedBy);
        if (cached && now - cached.timestamp < CACHE_TTL_MS) {
          return res.status(cached.status).json(cached.data);
        }
      }

      // In-flight promise deduplication to prevent duplicate network calls
      let pending = inFlightRequests.get(scannedBy);
      if (!pending) {
        pending = requestMesServer(
          `/api/FinishedGoodInventory/by-user/${encodeURIComponent(scannedBy)}`,
          'GET'
        ).finally(() => {
          inFlightRequests.delete(scannedBy);
        });
        inFlightRequests.set(scannedBy, pending);
      }

      const result = await pending;

      // Cache valid results
      if (result.status >= 200 && result.status < 300) {
        inventoryCache.set(scannedBy, {
          data: result.data,
          status: result.status,
          timestamp: Date.now(),
        });
      }

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

      // Invalidate cache immediately on write
      invalidateInventoryCache();

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

      // Invalidate cache immediately on write
      invalidateInventoryCache();

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

      // Invalidate cache immediately on new ticket
      invalidateInventoryCache();

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
