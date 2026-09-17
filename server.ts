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

  // GET: Fetch inventory by user (scannedBy)
  app.get('/api/FinishedGoodInventory/by-user/:scannedBy', async (req, res) => {
    try {
      const { scannedBy } = req.params;
      const mesResponse = await fetch(`http://mes.lienchau.vn:5092/api/FinishedGoodInventory/by-user/${encodeURIComponent(scannedBy)}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      const responseText = await mesResponse.text();
      let responseData: any;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = { message: responseText };
      }

      return res.status(mesResponse.status).json(responseData);
    } catch (error: any) {
      console.error('Error fetching inventory by user from MES API:', error);
      return res.status(502).json({
        success: false,
        error: error.message || 'Không thể kết nối đến máy chủ MES',
      });
    }
  });

  // PUT: Update inventory item by ID (quantity, unit, note)
  app.put('/api/FinishedGoodInventory/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { quantity, unit, note } = req.body;

      const mesResponse = await fetch(`http://mes.lienchau.vn:5092/api/FinishedGoodInventory/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quantity: Number(quantity),
          unit: String(unit || ''),
          note: String(note || ''),
        }),
      });

      const responseText = await mesResponse.text();
      let responseData: any;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = { message: responseText };
      }

      return res.status(mesResponse.status).json(responseData);
    } catch (error: any) {
      console.error('Error updating inventory item on MES API:', error);
      return res.status(502).json({
        success: false,
        error: error.message || 'Không thể kết nối đến máy chủ MES',
      });
    }
  });

  // DELETE: Delete inventory item by ID
  app.delete('/api/FinishedGoodInventory/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const mesResponse = await fetch(`http://mes.lienchau.vn:5092/api/FinishedGoodInventory/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });

      const responseText = await mesResponse.text();
      let responseData: any;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = { message: responseText };
      }

      return res.status(mesResponse.status).json(responseData);
    } catch (error: any) {
      console.error('Error deleting inventory item on MES API:', error);
      return res.status(502).json({
        success: false,
        error: error.message || 'Không thể kết nối đến máy chủ MES',
      });
    }
  });

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
