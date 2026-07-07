const HOST = 'raizon-okinawa.com';
const INDEXNOW_KEY = 'e05e507884b16deb8e3fa6c6771abddc';

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  const urlList = Array.isArray(body?.urls) ? body.urls.filter(Boolean) : [];
  if (!urlList.length) {
    return res.status(400).json({ error: 'urls is required' });
  }

  try {
    const r = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host: HOST,
        key: INDEXNOW_KEY,
        keyLocation: `https://${HOST}/${INDEXNOW_KEY}.txt`,
        urlList,
      }),
    });
    res.status(200).json({ ok: true, status: r.status });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
};
