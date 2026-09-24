// ========================================
// RAIZON Blog CMS - サーバーAPI経由
//   読み取り: GET  /api/posts            (公開)
//   書き込み: POST /api/admin-posts      (管理パスワード必須)
// Firebase の認証情報はブラウザに置かない(サーバーの環境変数のみ)。
// ========================================

const BlogCMS = {
  ADMIN_KEY: 'raizon_admin_pw',

  // ---- 管理パスワード(ログイン中のタブ内のみ保持) ----
  getAdminPassword() {
    try { return sessionStorage.getItem(this.ADMIN_KEY) || ''; } catch (e) { return ''; }
  },
  setAdminPassword(pw) {
    try { sessionStorage.setItem(this.ADMIN_KEY, pw); } catch (e) { /* 保存できない環境では毎回入力 */ }
  },
  clearAdminPassword() {
    try { sessionStorage.removeItem(this.ADMIN_KEY); } catch (e) { /* noop */ }
  },

  async adminRequest(payload, password) {
    const res = await fetch('/api/admin-posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-password': password !== undefined ? password : this.getAdminPassword()
      },
      body: JSON.stringify(payload)
    });
    if (res.status === 401) this.clearAdminPassword();
    if (!res.ok) throw new Error(`admin request failed: ${res.status}`);
    return res.json();
  },

  async verifyAdmin(password) {
    try {
      await this.adminRequest({ action: 'verify' }, password);
      return true;
    } catch (e) {
      return false;
    }
  },

  // ---- 読み取り ----
  async getAllPosts() {
    try {
      const res = await fetch('/api/posts');
      if (!res.ok) throw new Error(res.status);
      return await res.json();
    } catch (e) {
      console.error('Failed to fetch posts', e);
      return [];
    }
  },

  async getPost(id) {
    try {
      const res = await fetch(`/api/posts?id=${encodeURIComponent(id)}`);
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      console.error('Failed to fetch post', e);
      return null;
    }
  },

  // ---- 管理画面用(予約中の記事も含む。パスワード必須) ----
  getAllPostsAdmin() {
    return this.adminRequest({ action: 'list' });
  },

  async getPostAdmin(id) {
    const posts = await this.getAllPostsAdmin();
    return posts.find(p => p.id === id) || null;
  },

  // 記事の一括登録(予約投稿)。posts: [{title, body, category, createdAt(ISO), thumbnail?}]
  importPosts(posts) {
    return this.adminRequest({ action: 'import', posts });
  },

  isScheduled(post) {
    return !!post.createdAt && new Date(post.createdAt).getTime() > Date.now();
  },

  // タイトルとカテゴリからサムネイル(SVG)を生成
  svgThumbnail(title, category) {
    const themes = {
      'LINE構築': { colors: ['#065f46', '#06C755', '#6ee7b7'], icon: 'LINE' },
      'AI活用': { colors: ['#1e3a5f', '#2563eb', '#60a5fa'], icon: 'AI' },
      'DX支援': { colors: ['#134e4a', '#0d9488', '#5eead4'], icon: 'DX' },
      '制作実績': { colors: ['#7c2d12', '#ea580c', '#fdba74'], icon: 'WORK' },
      'お知らせ': { colors: ['#334155', '#64748b', '#cbd5e1'], icon: 'NEWS' }
    };
    const t = themes[category] || themes['お知らせ'];
    const esc = v => String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const line1 = title.length > 26 ? title.substring(0, 26) : title;
    const line2 = title.length > 26 ? title.substring(26, 52) : '';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450">
      <defs><linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${t.colors[0]}"/><stop offset="50%" style="stop-color:${t.colors[1]}"/><stop offset="100%" style="stop-color:${t.colors[2]}"/>
      </linearGradient></defs>
      <rect width="800" height="450" fill="url(#bg)"/>
      <circle cx="650" cy="120" r="120" fill="rgba(255,255,255,0.06)"/>
      <circle cx="150" cy="350" r="60" fill="rgba(255,255,255,0.05)"/>
      <text x="680" y="180" text-anchor="middle" fill="rgba(255,255,255,0.12)" font-size="120" font-weight="bold" font-family="sans-serif">${t.icon}</text>
      <text x="40" y="36" fill="rgba(255,255,255,0.6)" font-size="14" font-weight="bold" font-family="sans-serif">RAIZON Blog</text>
      <text x="40" y="400" fill="white" font-size="28" font-weight="bold" font-family="sans-serif">${esc(line1)}</text>
      <text x="40" y="435" fill="rgba(255,255,255,0.8)" font-size="22" font-weight="bold" font-family="sans-serif">${esc(line2)}</text>
    </svg>`;
    return 'data:image/svg+xml,' + encodeURIComponent(svg);
  },

  // ---- 書き込み(管理画面のみ) ----
  addPost(post) {
    return this.adminRequest({ action: 'add', post });
  },

  updatePost(id, updates) {
    return this.adminRequest({ action: 'update', id, post: updates });
  },

  // 指定IDで丸ごと保存(初期記事の投入用)
  putPost(id, post) {
    return this.adminRequest({ action: 'put', id, post });
  },

  async deletePost(id) {
    await this.adminRequest({ action: 'delete', id });
  },

  formatDate(isoString) {
    const d = new Date(isoString);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  },

  truncate(text, len) {
    // 冒頭の段落(<p>)を優先し、改行や余分な空白は詰める
    const p = text.match(/<p[^>]*>([\s\S]*?)<\/p>/);
    const plain = (p ? p[1] : text).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    return plain.length > len ? plain.substring(0, len) + '...' : plain;
  }
};
