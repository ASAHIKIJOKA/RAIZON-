// ========================================
// RAIZON Blog CMS - LocalStorage Based
// ========================================

const BlogCMS = {
  STORAGE_KEY: 'raizon_blog_posts',

  getAllPosts() {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  savePosts(posts) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(posts));
  },

  getPost(id) {
    return this.getAllPosts().find(p => p.id === id);
  },

  addPost(post) {
    const posts = this.getAllPosts();
    post.id = Date.now().toString();
    post.createdAt = new Date().toISOString();
    post.updatedAt = new Date().toISOString();
    posts.unshift(post);
    this.savePosts(posts);
    return post;
  },

  updatePost(id, updates) {
    const posts = this.getAllPosts();
    const idx = posts.findIndex(p => p.id === id);
    if (idx === -1) return null;
    posts[idx] = { ...posts[idx], ...updates, updatedAt: new Date().toISOString() };
    this.savePosts(posts);
    return posts[idx];
  },

  deletePost(id) {
    const posts = this.getAllPosts().filter(p => p.id !== id);
    this.savePosts(posts);
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
