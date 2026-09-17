import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Proxy to MES FinishedGoodInventory API to prevent CORS & Mixed Content issues
  const handleInventoryPush = async (req: express.Request, res: express.Response) => {
    try {
      const payload = req.body;
      console.log('Pushing to MES API:', payload);

      const mesResponse = await fetch('http://mes.lienchau.vn:5092/api/FinishedGoodInventory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const responseText = await mesResponse.text();
      let responseData: any;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = { message: responseText };
      }

      if (!mesResponse.ok) {
        return res.status(mesResponse.status).json({
          success: false,
          error: `MES API returned status ${mesResponse.status}`,
          details: responseData,
        });
      }

      return res.status(200).json({
        success: true,
        data: responseData,
      });
    } catch (error: any) {
      console.error('Error forwarding to MES API:', error);
      return res.status(502).json({
        success: false,
        error: error.message || 'Không thể kết nối đến máy chủ MES',
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
