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
    const plain = text.replace(/<[^>]*>/g, '');
    return plain.length > len ? plain.substring(0, len) + '...' : plain;
  }
};
