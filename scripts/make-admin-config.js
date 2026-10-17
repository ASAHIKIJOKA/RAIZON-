// 管理画面のパスワードを決めて、secrets/admin.json を作る。
//   node scripts/make-admin-config.js
// パスワードは画面に表示されず、ファイルにも保存されない(保存されるのは暗号化した照合用の値だけ)。
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

function ask(q) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl._writeToOutput = (str) => { if (str.includes(q)) rl.output.write(str); };
    rl.question(q, (a) => { rl.close(); process.stdout.write('\n'); resolve(a); });
  });
}

(async () => {
  const a = await ask('新しい管理パスワード(12文字以上): ');
  if (a.length < 12) { console.error('12文字未満です。やり直してください。'); process.exit(1); }
  const b = await ask('もう一度入力: ');
  if (a !== b) { console.error('一致しません。やり直してください。'); process.exit(1); }
  const salt = crypto.randomBytes(16).toString('hex');
  const iter = 120000;
  const hash = crypto.pbkdf2Sync(a, salt, iter, 32, 'sha256').toString('hex');
  const dir = path.resolve(__dirname, '..', 'secrets');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'admin.json'), JSON.stringify({ salt, iter, hash }, null, 2));
  console.log('作成しました: secrets/admin.json');
})();
