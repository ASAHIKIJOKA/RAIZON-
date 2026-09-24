// ========================================
// 定期処理(Vercel Cron): 直近に公開された記事を検索エンジンへ通知(IndexNow)
// 予約投稿は公開日が来ると自動で表示されるため、公開されたタイミングで通知する。
// 認証情報は不要。1日1回(vercel.json の crons)。
// ========================================

const { getPublishedPosts } = require('./_firebase');

const HOST = 'raizon-okinawa.com';
const INDEXNOW_KEY = 'e05e507884b16deb8e3fa6c6771abddc';
const WINDOW_MS = 26 * 60 * 60 * 1000; // 1日1回の実行 + 余裕

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const cutoff = Date.now() - WINDOW_MS;
    const recent = (await getPublishedPosts()).filter(p => new Date(p.createdAt).getTime() >= cutoff);
    if (recent.length === 0) return res.status(200).json({ ok: true, notified: 0 });

    const urlList = [`https://${HOST}/blog-list`, ...recent.map(p => `https://${HOST}/blog-post?id=${p.id}`)];
    const r = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ host: HOST, key: INDEXNOW_KEY, keyLocation: `https://${HOST}/${INDEXNOW_KEY}.txt`, urlList }),
    });
    return res.status(200).json({ ok: true, notified: recent.length, status: r.status });
  } catch (e) {
    console.error('cron-indexnow error:', e.message);
    return res.status(500).json({ error: 'server error' });
  }
};
