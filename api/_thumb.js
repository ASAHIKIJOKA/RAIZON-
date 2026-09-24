// 記事のサムネイル(SVG)を生成する。サムネイルが未設定の記事に使う。
const THEMES = {
  'LINE構築': { colors: ['#065f46', '#06C755', '#6ee7b7'], icon: 'LINE' },
  'AI活用': { colors: ['#1e3a5f', '#2563eb', '#60a5fa'], icon: 'AI' },
  'DX支援': { colors: ['#134e4a', '#0d9488', '#5eead4'], icon: 'DX' },
  '制作実績': { colors: ['#7c2d12', '#ea580c', '#fdba74'], icon: 'WORK' },
  'お知らせ': { colors: ['#334155', '#64748b', '#cbd5e1'], icon: 'NEWS' },
};
const esc = v => String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function svgThumbnail(title, category) {
  const t = THEMES[category] || THEMES['お知らせ'];
  const line1 = title.length > 26 ? title.substring(0, 26) : title;
  const line2 = title.length > 26 ? title.substring(26, 52) : '';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450"><defs><linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:${t.colors[0]}"/><stop offset="50%" style="stop-color:${t.colors[1]}"/><stop offset="100%" style="stop-color:${t.colors[2]}"/></linearGradient></defs><rect width="800" height="450" fill="url(#bg)"/><circle cx="650" cy="120" r="120" fill="rgba(255,255,255,0.06)"/><circle cx="150" cy="350" r="60" fill="rgba(255,255,255,0.05)"/><text x="680" y="180" text-anchor="middle" fill="rgba(255,255,255,0.12)" font-size="120" font-weight="bold" font-family="sans-serif">${t.icon}</text><text x="40" y="36" fill="rgba(255,255,255,0.6)" font-size="14" font-weight="bold" font-family="sans-serif">RAIZON Blog</text><text x="40" y="400" fill="white" font-size="28" font-weight="bold" font-family="sans-serif">${esc(line1)}</text><text x="40" y="435" fill="rgba(255,255,255,0.8)" font-size="22" font-weight="bold" font-family="sans-serif">${esc(line2)}</text></svg>`;
  return 'data:image/svg+xml,' + encodeURIComponent(svg);
}

module.exports = { svgThumbnail };
