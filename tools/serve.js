// 手元で確認するための簡単なサーバー。
//   node tools/serve.js [公開するフォルダ] [ポート]
// 例: node tools/serve.js . 5199  →  http://localhost:5199/site/
const http = require('http'), fs = require('fs'), path = require('path');
const root = path.resolve(process.argv[2] || path.join(__dirname, '..'));
const port = Number(process.argv[3] || 5199);
const types = { '.html': 'text/html;charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.txt': 'text/plain;charset=utf-8', '.xml': 'application/xml' };
http.createServer((q, r) => {
  let p = decodeURIComponent(q.url.split('?')[0]);
  if (p.endsWith('/')) p += 'index.html';
  const f = path.join(root, p);
  if (!f.startsWith(root)) { r.writeHead(403); return r.end('403'); }
  fs.readFile(f, (e, d) => {
    if (e) { r.writeHead(404); return r.end('404'); }
    r.writeHead(200, { 'Content-Type': types[path.extname(p)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    r.end(d);
  });
}).listen(port, '127.0.0.1', () => console.log('serving ' + root + ' on http://localhost:' + port));
