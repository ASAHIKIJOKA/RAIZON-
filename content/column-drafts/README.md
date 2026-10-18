# コラムの下書き置き場(公開されない)

- ここにあるファイルは、`node tools/build-column.js` で**読み込まれません**(公開されません)。
- **公開の手順:**
  1. 記事ごとの**サムネイル画像を、オーナーに要求する**(AIは、サムネイルを作らない)。
  2. 届いた画像を `site/assets/column/<記事のid>.webp`(1200×630)に変換して置く。
  3. 記事の先頭のメタ情報に、`thumbnail: assets/column/<記事のid>.webp` を足す。
  4. ファイルを `content/column/` に移して、`node tools/build-column.js` を実行する。
  5. GitHubに保存して、プルリクエストをマージする。
