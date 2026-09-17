export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');
  res.statusCode = 200;
  res.end(JSON.stringify({ status: 'ok', mes: 'http://mes.lienchau.vn:5092/api/FinishedGoodInventory' }));
}
