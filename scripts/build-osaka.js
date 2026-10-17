// 東大阪サイトを、ヘテムルへ上げる形(dist-osaka/)に組み立てる。
//   SITE_URL=https://example.com node scripts/build-osaka.js
// SITE_URL を指定すると公開用(検索に載せる・canonical・サイトマップあり)。
// 指定しないと、noindex のまま(公開前の確認用)。
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'dist-osaka');
const SITE = (process.env.SITE_URL || '').replace(/\/$/, '');

function copyTree(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const n of fs.readdirSync(src)) {
    if (n === '.DS_Store') continue;
    const s = path.join(src, n), d = path.join(dst, n);
    if (fs.statSync(s).isDirectory()) copyTree(s, d); else fs.copyFileSync(s, d);
  }
}
const DENY = 'Require all denied\n<IfModule !mod_authz_core.c>\nOrder deny,allow\nDeny from all\n</IfModule>\n';

fs.rmSync(OUT, { recursive: true, force: true });
copyTree(path.join(ROOT, 'site'), OUT);

// 公開用の index.html は、scratchpad の生成スクリプトではなく、site/index.html をそのまま使う。
// SITE_URL 指定時は、noindex を外し、canonical/OGP の絶対URLを入れる(下の置き換え)。
let html = fs.readFileSync(path.join(OUT, 'index.html'), 'utf8');
if (SITE) {
  html = html
    .replace(/<!--[^>]*公開前[^>]*-->\n?/, '')
    .replace('<meta name="robots" content="noindex, nofollow">', `<meta name="robots" content="index, follow">\n<link rel="canonical" href="${SITE}/">\n<meta property="og:url" content="${SITE}/">\n<meta property="og:image" content="${SITE}/assets/ogp.png">\n<meta name="twitter:card" content="summary_large_image">`);
  html = html.replace('"@type":"ProfessionalService"', `"@type":"ProfessionalService","url":"${SITE}/","image":"${SITE}/assets/ogp.png"`);
}
fs.writeFileSync(path.join(OUT, 'index.html'), html);

// コラム(site/column/): 公開用のとき、検索に載せる設定・canonical・絶対URLに切り替える
const colFiles = [];
(function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const n of fs.readdirSync(dir)) {
    const f = path.join(dir, n);
    if (fs.statSync(f).isDirectory()) walk(f); else if (n === 'index.html') colFiles.push(f);
  }
})(path.join(OUT, 'column'));
const colUrls = [];
for (const f of colFiles) {
  let h = fs.readFileSync(f, 'utf8');
  const pth = (h.match(/<html lang="ja" data-path="([^"]+)"/) || [])[1] || '/column/';
  const mod = (h.match(/"dateModified":"(\d{4}-\d{2}-\d{2})"/) || [])[1];
  colUrls.push({ pth, mod });
  if (SITE) {
    h = h.replace(/<!--[^>]*公開前[^>]*-->\n?/, '')
      .replace('<meta name="robots" content="noindex, nofollow">', `<meta name="robots" content="index, follow">\n<link rel="canonical" href="${SITE}${pth}">\n<meta property="og:url" content="${SITE}${pth}">\n<meta property="og:image" content="${SITE}/assets/ogp.png">`);
  }
  h = h.split('__SITE__').join(SITE);
  fs.writeFileSync(f, h);
}

// PHP(フォーム受付)と、メール送信の共通部品
copyTree(path.join(ROOT, 'osaka/api'), path.join(OUT, 'api'));
fs.mkdirSync(path.join(OUT, '_lib'), { recursive: true });
fs.copyFileSync(path.join(ROOT, 'heteml/_lib/mail.php'), path.join(OUT, '_lib/mail.php'));
fs.writeFileSync(path.join(OUT, '_lib/.htaccess'), DENY);
fs.mkdirSync(path.join(OUT, '_secrets'), { recursive: true });
fs.writeFileSync(path.join(OUT, '_secrets/.htaccess'), DENY);
const mailSec = path.join(ROOT, 'secrets/mail.json');
if (fs.existsSync(mailSec)) fs.copyFileSync(mailSec, path.join(OUT, '_secrets/mail.json'));

// robots.txt / sitemap.xml
if (SITE) {
  fs.writeFileSync(path.join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);
  const day = new Date().toISOString().slice(0, 10);
  const urls = [`  <url>\n    <loc>${SITE}/</loc>\n    <lastmod>${day}</lastmod>\n  </url>`].concat(colUrls.map((u) => `  <url>\n    <loc>${SITE}${u.pth}</loc>\n    <lastmod>${u.mod || day}</lastmod>\n  </url>`));
  fs.writeFileSync(path.join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`);
} else {
  fs.writeFileSync(path.join(OUT, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
}

fs.writeFileSync(path.join(OUT, '.htaccess'), `# ===== 東大阪サイト用 .htaccess =====
Options -Indexes
DirectoryIndex index.html
AddDefaultCharset UTF-8
RewriteEngine On

# www あり → www なしに統一(検索エンジンに、同じサイトが2つあると思われないように)
RewriteCond %{HTTP_HOST} ^www\\.(.+)$ [NC]
RewriteRule ^(.*)$ https://%1/$1 [R=301,L]

# HTTPSに統一
RewriteCond %{HTTPS} !=on
RewriteCond %{HTTP:X-Forwarded-Proto} !=https
RewriteRule ^(.*)$ https://%{HTTP_HOST}/$1 [R=301,L]

${SITE ? '' : '# 公開前: 検索エンジンに載せない\n<IfModule mod_headers.c>\n  Header set X-Robots-Tag "noindex, nofollow"\n</IfModule>\n'}
RewriteRule ^api/contact/?$ /api/contact.php [L]

<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/webp "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/x-icon "access plus 1 year"
  ExpiresByType text/css "access plus 30 days"
  ExpiresByType text/javascript "access plus 30 days"
  ExpiresByType application/javascript "access plus 30 days"
</IfModule>
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css text/javascript application/javascript application/json image/svg+xml application/xml
</IfModule>
`);
console.log(JSON.stringify({ out: OUT, site: SITE || '(未指定: noindex)', mailConfigured: fs.existsSync(path.join(OUT, '_secrets/mail.json')) }, null, 2));
