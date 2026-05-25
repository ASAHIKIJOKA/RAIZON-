const FIREBASE_URL = 'https://parlor-minato-default-rtdb.firebaseio.com/raizon-blog/posts.json';
const FIREBASE_SECRET = 'pyx1oEgJdwLh7gg6031seevIZN6be8zWiCHzopEO';

module.exports = async function handler(req, res) {
  const today = new Date().toISOString().split('T')[0];

  let posts = [];
  try {
    const r = await fetch(`${FIREBASE_URL}?auth=${FIREBASE_SECRET}`);
    const data = await r.json();
    if (data && !data.error) {
      posts = Object.entries(data)
        .map(([id, post]) => ({ id, ...post }))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
  } catch (e) {
    // Firebase取得失敗時は静的ページのみ返す
  }

  const staticPages = [
    { loc: 'https://raizon-okinawa.com/', lastmod: today, changefreq: 'weekly', priority: '1.0' },
    { loc: 'https://raizon-okinawa.com/line', lastmod: today, changefreq: 'monthly', priority: '0.9' },
    { loc: 'https://raizon-okinawa.com/blog-list', lastmod: today, changefreq: 'weekly', priority: '0.8' },
  ];

  const urlTags = [
    ...staticPages,
    ...posts.map(p => ({
      loc: `https://raizon-okinawa.com/blog-post?id=${p.id}`,
      lastmod: (p.updatedAt || p.createdAt || today).split('T')[0],
      changefreq: 'monthly',
      priority: '0.6',
    })),
  ].map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlTags}
</urlset>`;

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
  res.status(200).send(xml);
};
