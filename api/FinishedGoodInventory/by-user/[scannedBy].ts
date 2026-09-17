export const config = {
  maxDuration: 15,
};

export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, error: 'Method Not Allowed' }));
    return;
  }

  try {
    const { scannedBy } = req.query || {};
    const userId = scannedBy || '105';

    const mesResponse = await fetch(
      `http://mes.lienchau.vn:5092/api/FinishedGoodInventory/by-user/${encodeURIComponent(userId)}`,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      }
    );

    const responseText = await mesResponse.text();
    let responseData: any;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { message: responseText };
    }

    res.statusCode = mesResponse.status;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(responseData));
  } catch (error: any) {
    console.error('Error fetching from MES API (Vercel):', error);
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
