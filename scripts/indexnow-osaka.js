// 東大阪サイトの全URL(sitemap.xml)を、検索エンジンへ通知する(IndexNow)。
//   SITE_URL=https://raizon-osaka.com node scripts/indexnow-osaka.js
// デプロイのたびに実行する(.github/workflows/deploy-osaka.yml)。失敗しても、デプロイ自体は止めない。
// 認証キーは、site/ に置いた「<キー>.txt」(中身がキーと同じファイル)から取る。
const fs = require('fs');
const path = require('path');

const OUT = path.resolve(__dirname, '..', 'dist-osaka');
const SITE = (process.env.SITE_URL || '').replace(/\/$/, '');

(async () => {
  if (!SITE) { console.log('SITE_URL が未設定のため、通知しません'); return; }
  const keyFile = fs.readdirSync(OUT).find((n) => /^[0-9a-f]{32}\.txt$/.test(n));
  if (!keyFile) { console.log('IndexNow のキーファイルが見つかりません'); return; }
  const key = keyFile.replace(/\.txt$/, '');
  const xml = fs.readFileSync(path.join(OUT, 'sitemap.xml'), 'utf8');
  const urlList = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  if (!urlList.length) { console.log('通知するURLがありません'); return; }
  const host = new URL(SITE).host;
  const r = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host, key, keyLocation: `${SITE}/${keyFile}`, urlList }),
  });
  console.log(`IndexNow: ${urlList.length}件を通知 → HTTP ${r.status}`);
})().catch((e) => { console.log('IndexNow の通知に失敗(デプロイは続行):', e.message); });
