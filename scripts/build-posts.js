// 記事ファイル(content/articles/*.html)を、サイトが読む api/_posts-static.json に変換する
// 使い方: node scripts/build-posts.js [--strict]
//   --strict : 警告もエラー扱いにする(自動投稿で使用。危険な表現・短すぎる記事を通さない)
// 記事ファイルの先頭に <!--meta ... --> で id / title / category / publishAt(YYYY-MM-DD, 日本時間10:00公開)を書く。
const fs = require('fs');
const path = require('path');

const strict = process.argv.includes('--strict');
const dir = path.join(__dirname, '..', 'content', 'articles');
const out = path.join(__dirname, '..', 'api', '_posts-static.json');
const CATEGORIES = ['お知らせ', 'AI活用', 'DX支援', 'LINE構築'];
// 根拠のない断定・数字の効果表現を防ぐ簡易チェック
const RISKY = [/\d+\s*[%％]/, /\d+倍/, /No\.?\s*1/i, /ナンバー\s*1/, /必ず(成功|売上|増)/, /絶対/, /100\s*%/, /確実に(売上|集客|増)/, /業界(最安|最高)/, /日本一|県内一|沖縄一/];

const files = fs.readdirSync(dir).filter(f => f.endsWith('.html')).sort();
const metaOf = f => { const m = fs.readFileSync(path.join(dir, f), 'utf8').match(/^<!--meta\r?\n([\s\S]*?)-->/); const o = {}; if (m) for (const l of m[1].split(/\r?\n/)) { const i = l.indexOf(':'); if (i > 0) o[l.slice(0, i).trim()] = l.slice(i + 1).trim(); } return o; };
const allIds = new Set(files.map(f => metaOf(f).id).filter(Boolean));

const posts = [], errors = [], warnings = [], seen = new Set();
for (const f of files) {
  const raw = fs.readFileSync(path.join(dir, f), 'utf8').replace(/\r\n/g, '\n');
  const m = raw.match(/^<!--meta\n([\s\S]*?)-->\n?/);
  if (!m) { errors.push(`${f}: 先頭の <!--meta ... --> がありません`); continue; }
  const meta = metaOf(f);
  const body = raw.slice(m[0].length).trim();
  const plain = body.replace(/<[^>]*>/g, '');

  if (!meta.id || !/^[A-Za-z0-9_-]{1,64}$/.test(meta.id)) errors.push(`${f}: id は必須(英数字・-・_ の64文字まで)`);
  else if (seen.has(meta.id)) errors.push(`${f}: id が重複しています (${meta.id})`); else seen.add(meta.id);
  if (!meta.title) errors.push(`${f}: title がありません`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(meta.publishAt || '')) errors.push(`${f}: publishAt は YYYY-MM-DD 形式`);
  if (!CATEGORIES.includes(meta.category)) errors.push(`${f}: category は ${CATEGORIES.join('/')} のいずれか`);
  if (plain.length < 900) warnings.push(`${f}: 本文が短めです(${plain.length}文字)`);
  const intro = ((body.match(/<p>([\s\S]*?)<\/p>/) || [])[1] || '').replace(/<[^>]*>/g, '');
  if (intro.length < 60 || intro.length > 130) warnings.push(`${f}: 冒頭の段落が${intro.length}文字です(目安は60〜120文字。検索結果の説明文になる)`);
  if (meta.title && meta.title.length > 45) warnings.push(`${f}: タイトルが${meta.title.length}文字です(目安は30〜40文字)`);
  if (!/よくある質問/.test(body)) warnings.push(`${f}: 「よくある質問」の見出しがありません`);
  if (!/lin\.ee\/fD0d4TS/.test(body)) warnings.push(`${f}: 相談用のLINEリンクがありません`);
  for (const re of RISKY) if (re.test(plain)) warnings.push(`${f}: 根拠が必要な表現の可能性 (${re})`);
  for (const l of body.match(/href="\/blog-post\?id=[^"]+"/g) || []) {
    const id = l.match(/id=([^"]+)"/)[1];
    if (!allIds.has(id)) errors.push(`${f}: 内部リンク先の記事がありません (${id})`);
  }
  posts.push({ id: meta.id, title: meta.title, category: meta.category, createdAt: new Date(meta.publishAt + 'T10:00:00+09:00').toISOString(), updatedAt: new Date(meta.publishAt + 'T10:00:00+09:00').toISOString(), body, source: 'file' });
}

warnings.forEach(w => console.log((strict ? 'エラー(strict): ' : '警告: ') + w));
if (errors.length || (strict && warnings.length)) { errors.forEach(e => console.error('エラー: ' + e)); process.exit(1); }
// 非表示にする記事id(DB側の旧記事など)。content/hidden-ids.json → api/_hidden-ids.json
const hiddenSrc = path.join(__dirname, '..', 'content', 'hidden-ids.json');
if (fs.existsSync(hiddenSrc)) fs.copyFileSync(hiddenSrc, path.join(__dirname, '..', 'api', '_hidden-ids.json'));
posts.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
fs.writeFileSync(out, JSON.stringify(posts, null, 1) + '\n', 'utf8');
const now = Date.now();
console.log(`OK: ${posts.length}件 → api/_posts-static.json (公開中 ${posts.filter(p => new Date(p.createdAt) <= now).length} / 予約 ${posts.filter(p => new Date(p.createdAt) > now).length})`);
posts.forEach(p => console.log(` - ${p.createdAt.slice(0, 10)} [${p.category}] ${p.title}`));
