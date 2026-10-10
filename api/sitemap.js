const { getPublishedPosts } = require('./_firebase');

module.exports = async function handler(req, res) {
  const today = new Date().toISOString().split('T')[0];

  let posts = [];
  try {
    posts = await getPublishedPosts();
  } catch (e) {
    // Firebase取得失敗時は静的ページのみ返す
  }

  // lastmod は、実際に更新された日だけを書く(常に「今日」にすると、検索エンジンに信用されなくなる)
  const latestPost = posts.reduce((m, p) => { const d = (p.updatedAt || p.createdAt || '').split('T')[0]; return d > m ? d : m; }, '');
  const staticPages = [
    { loc: 'https://raizon-okinawa.com/' },
    { loc: 'https://raizon-okinawa.com/line' },
    { loc: 'https://raizon-okinawa.com/consult' },
    { loc: 'https://raizon-okinawa.com/blog-list', lastmod: latestPost || undefined },
  ];

  const urlTags = [
    ...staticPages,
    ...posts.map(p => ({
      loc: `https://raizon-okinawa.com/blog/${p.id}`,
      lastmod: (p.updatedAt || p.createdAt || '').split('T')[0] || undefined,
    })),
  ].map(u => `  <url>
    <loc>${u.loc}</loc>${u.lastmod ? `
    <lastmod>${u.lastmod}</lastmod>` : ''}
  </url>`).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlTags}
</urlset>`;

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
  res.status(200).send(xml);
};
