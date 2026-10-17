// フォームの通知メールを送るための設定を作る(secrets/mail.json)。
//   node scripts/make-mail-config.js
// Gmailの「アプリパスワード」(16文字)を入力する。入力は画面に出ない。
// いまVercelで使っているもの(GMAIL_APP_PASSWORD)と同じでも、新しく作ったものでもよい。
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
  const pass = (await ask('Gmailのアプリパスワード(16文字。空白は入れても入れなくてもよい): ')).replace(/\s+/g, '');
  if (pass.length !== 16) { console.error('16文字ではありません。やり直してください。'); process.exit(1); }
  const dir = path.resolve(__dirname, '..', 'secrets');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'mail.json'), JSON.stringify({ user: 'raizon.asahi@gmail.com', pass }, null, 2));
  console.log('作成しました: secrets/mail.json');
})();
