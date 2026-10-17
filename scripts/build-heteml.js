// ヘテムル(ムームーサーバー)用に、サイト一式を dist-heteml/ に書き出す。
//   node scripts/build-heteml.js
// ・静的ファイルをコピー
// ・Vercel のサーバー処理だった ブログ一覧/記事/サイトマップ は、ここで静的HTMLにする
// ・URLの振り分け(vercel.json) は .htaccess に書き直す
// ・フォーム(/api/contact など)は、試験中は Vercel 側の API を呼ぶ(PHP化は次の段階)
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'dist-heteml');
const SITE = 'https://raizon-okinawa.com';

// 本番へ渡さないもの
const EXCLUDE = new Set(['api', 'content', 'scripts', 'site', 'node_modules', 'dist-heteml', 'vercel.json', 'package.json', 'package-lock.json', 'project.json', '.git', '.gitignore', '.vercel', '.DS_Store', 'heteml', 'secrets']);

function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const name of fs.readdirSync(src)) {
    if (src === ROOT && EXCLUDE.has(name)) continue;
    if (name === '.DS_Store') continue;
    const s = path.join(src, name), d = path.join(dst, name);
    const st = fs.statSync(s);
    if (st.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

// フォーム(contact/apply)は、PHP化するまで Vercel 側の API を呼ぶ。ブログ(posts/admin-posts)はこのサーバーのPHPを呼ぶ
function repointApis(file) {
  let s = fs.readFileSync(file, 'utf8');
  const before = s;
  s = s.replace(/(['"`])\/api\/(?!)/g, `$1${SITE}/api/$2`);
  if (s !== before) fs.writeFileSync(file, s);
  return s !== before;
}

function walk(dir, cb) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) walk(p, cb); else cb(p);
  }
}

const SRC = path.join(ROOT, 'heteml');

function copyTree(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const name of fs.readdirSync(src)) {
    if (name === '.DS_Store') continue;
    const s2 = path.join(src, name), d2 = path.join(dst, name);
    if (fs.statSync(s2).isDirectory()) copyTree(s2, d2); else fs.copyFileSync(s2, d2);
  }
}

const DENY = 'Require all denied\n<IfModule !mod_authz_core.c>\nOrder deny,allow\nDeny from all\n</IfModule>\n';

(async () => {
  fs.rmSync(OUT, { recursive: true, force: true });
  copyDir(ROOT, OUT);

  // 1) フォームの API 呼び出しを書き換え
  const changed = [];
  walk(OUT, (p) => { if (/\.(html|js)$/.test(p) && repointApis(p)) changed.push(path.relative(OUT, p)); });

  // 2) ブログ(PHP)を組み込む
  copyTree(SRC, OUT);
  for (const d of ['blog', '_blog-list.html']) fs.rmSync(path.join(OUT, d), { recursive: true, force: true });

  // 記事の元データ(ファイル管理の記事)と、取り下げ記事の一覧
  fs.mkdirSync(path.join(OUT, '_seed'), { recursive: true });
  fs.copyFileSync(path.join(ROOT, 'api/_posts-static.json'), path.join(OUT, '_seed/posts.json'));
  fs.copyFileSync(path.join(ROOT, 'api/_hidden-ids.json'), path.join(OUT, '_seed/hidden-ids.json'));

  // 表示用の共通部品(ヘッダー・フッター・記事ページのCSS)を、いまのNode版のテンプレートから切り出す
  const postJs = fs.readFileSync(path.join(ROOT, 'api/blog-post.js'), 'utf8');
  const cut = (from, to, includeTo) => {
    const a = postJs.indexOf(from); const b = postJs.indexOf(to, a);
    if (a < 0 || b < 0) throw new Error('template marker not found: ' + from);
    return postJs.slice(a, b + (includeTo ? to.length : 0));
  };
  fs.mkdirSync(path.join(OUT, '_tpl'), { recursive: true });
  fs.writeFileSync(path.join(OUT, '_tpl/header.html'), cut('<header class="rz3-header">', '</header>', true));
  fs.writeFileSync(path.join(OUT, '_tpl/footer.html'), cut('<footer class="rz3-footer">', '<script src="/site-v3.js?v=2"></script>', true));
  fs.writeFileSync(path.join(OUT, '_tpl/post-style.html'), cut('<style>', '</style>', true));

  // 管理パスワードの設定(secrets/admin.json は make-admin-config.js で作る。リポジトリには入れない)
  const sec = path.join(ROOT, 'secrets/admin.json');
  let adminConfigured = false, mailConfigured = false;
  fs.mkdirSync(path.join(OUT, '_secrets'), { recursive: true });
  if (fs.existsSync(sec)) { fs.copyFileSync(sec, path.join(OUT, '_secrets/admin.json')); adminConfigured = true; }
  const mailSec = path.join(ROOT, 'secrets/mail.json');
  if (fs.existsSync(mailSec)) { fs.copyFileSync(mailSec, path.join(OUT, '_secrets/mail.json')); mailConfigured = true; }

  // 外から見せないフォルダ
  for (const d of ['_lib', '_seed', '_tpl', '_secrets']) {
    if (fs.existsSync(path.join(OUT, d))) fs.writeFileSync(path.join(OUT, d, '.htaccess'), DENY);
  }

  // 3) .htaccess
  fs.writeFileSync(path.join(OUT, '.htaccess'), htaccess());

  console.log(JSON.stringify({ out: OUT, apiRewritten: changed, adminConfigured, mailConfigured }, null, 2));
})();

function htaccess() {
  return `# ===== ヘテムル用 .htaccess（vercel.json の内容を書き直したもの）=====
Options -Indexes
DirectoryIndex index.html
AddDefaultCharset UTF-8
RewriteEngine On

# 試験用の仮URL(heteml.net)は検索エンジンに載せない
<IfModule mod_headers.c>
  <If "%{HTTP_HOST} =~ /heteml\\.net$/">
    Header set X-Robots-Tag "noindex, nofollow"
  </If>
  <FilesMatch "\\.pdf$">
    Header set X-Robots-Tag "noindex, nofollow"
  </FilesMatch>
</IfModule>

# www → www なし
RewriteCond %{HTTP_HOST} ^www\\.raizon-okinawa\\.com$ [NC]
RewriteRule ^(.*)$ ${SITE}/$1 [R=301,L]

# /index.html → /
RewriteCond %{THE_REQUEST} \\s/index\\.html[\\s?]
RewriteRule ^index\\.html$ / [R=301,L]

# 旧ページ → トップ内アンカー
RewriteRule ^service\\.html$ /#service [R=301,L,NE]
RewriteRule ^pricing\\.html$ /#price [R=301,L,NE]
RewriteRule ^cases\\.html$ /#case [R=301,L,NE]
RewriteRule ^company\\.html$ /#company [R=301,L,NE]
RewriteRule ^contact\\.html$ /#contact [R=301,L,NE]
RewriteRule ^faq\\.html$ /#faq [R=301,L,NE]

# ブログ: /blog-list.html → /blog-list (外から来た時だけ)
RewriteCond %{THE_REQUEST} \\s/blog-list\\.html[\\s?]
RewriteRule ^blog-list\\.html$ /blog-list [R=301,L]
RewriteRule ^blog-post\\.html$ /blog-list [R=301,L]

# きれいなURL(内部でPHP・HTMLのファイルを返す)
RewriteRule ^blog-list/?$ /blog-list.php [L,QSA]
RewriteRule ^blog/([A-Za-z0-9_-]+)/?$ /blog-post.php?id=$1 [L]
RewriteRule ^sitemap\\.xml$ /sitemap.php [L]
RewriteRule ^api/(posts|admin-posts|contact|apply)/?$ /api/$1.php [L,QSA]
RewriteRule ^(line|links|consult|web|system|apply|terms)/?$ /$1.html [L]

# 管理画面は検索に載せない
<IfModule mod_headers.c>
  <FilesMatch "^admin\\.html$">
    Header set X-Robots-Tag "noindex, nofollow"
  </FilesMatch>
</IfModule>

# 管理APIにパスワードのヘッダーを渡す(サーバーの設定で消されないように)
<IfModule mod_setenvif.c>
  SetEnvIf x-admin-password "(.+)" HTTP_X_ADMIN_PASSWORD=$1
</IfModule>

# 規約PDFなどの法務ファイルは検索に載せない
<IfModule mod_headers.c>
  <FilesMatch "\\.pdf$">
    Header set X-Robots-Tag "noindex, nofollow"
  </FilesMatch>
  <IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType image/webp "access plus 30 days"
    ExpiresByType image/png "access plus 30 days"
  </IfModule>
</IfModule>
`;
}
