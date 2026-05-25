// ========================================
// RAIZON Blog CMS - Firebase REST API
// ========================================

const BlogCMS = {
  DB: 'https://parlor-minato-default-rtdb.firebaseio.com/raizon-blog/posts',
  SECRET: 'pyx1oEgJdwLh7gg6031seevIZN6be8zWiCHzopEO',

  async getAllPosts() {
    try {
      const res = await fetch(`${this.DB}.json?auth=${this.SECRET}`);
      const data = await res.json();
      if (!data) return [];
      return Object.entries(data)
        .map(([id, post]) => ({ ...post, id }))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (e) {
      console.error('Failed to fetch posts', e);
      return [];
    }
  },

  async getPost(id) {
    try {
      const res = await fetch(`${this.DB}/${id}.json?auth=${this.SECRET}`);
      const data = await res.json();
      if (!data) return null;
      return { ...data, id };
    } catch (e) {
      console.error('Failed to fetch post', e);
      return null;
    }
  },

  async addPost(post) {
    const id = Date.now().toString();
    const now = new Date().toISOString();
    const newPost = { ...post, createdAt: post.createdAt || now, updatedAt: now };
    await fetch(`${this.DB}/${id}.json?auth=${this.SECRET}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPost)
    });
    return { ...newPost, id };
  },

  async updatePost(id, updates) {
    const patchData = { ...updates, updatedAt: new Date().toISOString() };
    await fetch(`${this.DB}/${id}.json?auth=${this.SECRET}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patchData)
    });
    return { ...patchData, id };
  },

  async deletePost(id) {
    await fetch(`${this.DB}/${id}.json?auth=${this.SECRET}`, {
      method: 'DELETE'
    });
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
