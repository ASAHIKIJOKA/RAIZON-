# RAIZON サイト v5(複数ページ・絵が主役・文は短く)を書き出す
# 使い方: /opt/homebrew/bin/python3 scripts/build-v5.py  → index.html / line.html / web.html / system.html / v4/*.html を作る
# (出力先のパスは v4 と同じ。vercel.json の書き換え設定をそのまま使うため)
# イラストは .ph の枠(差し込み用)。一覧は AI経営.RAIZON/growth/site-v5/illustrations.md に出力する
import json, re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LINE = 'https://line.me/R/ti/p/%40154yajce'
DEMO = 'https://line.me/R/ti/p/%40400mmccb'
ILLS = []

CLARITY = '''<script>window.addEventListener('load',function(){setTimeout(function(){(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","vitwsmjicc");},2000);});</script>'''
INTER = 'https://fonts.googleapis.com/css2?family=Inter:wght@500;700;800;900&display=swap'
IMG_SVG = '<svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="1.6"/><path d="M4 18l5-5 4 4 3-3 4 4"/></svg>'


# Canvaで作った絵(assets-v5/illust/)。ファイルがある枠は、枠の代わりに絵を表示する
ART = {'LN-H': 'ln-hero', 'LN-1': 'ln-s1', 'LN-2': 'ln-s2', 'LN-3': 'ln-s3', 'LS-1': 's01', 'LS-2': 'u1-2', 'LS-3': 'u1-3', 'LS-4': 'u4-3', 'LS-5': 'ln-cust', 'LS-6': 'm03', 'D-01': 'd-01', 'D-02': 'd-02', 'D-03': 'd-03', 'D-04': 'd-04', 'D-05': 'd-05', 'D-06': 'd-06', 'M-00': 'm00', 'M-01': 'm01', 'M-02': 'm02', 'M-03': 'm03', 'U1-P': 'u1-phone', 'U1-1': 'u1-1', 'U1-2': 'u1-2', 'U1-3': 'u1-3', 'U2-1': 'u2-1', 'U2-2': 'u2-2', 'U2-3': 'u2-3', 'U3-1': 'u3-1', 'U3-2': 'u3-2', 'U3-3': 'u3-3', 'U4-1': 'u4-1', 'U4-2': 'u4-2', 'U4-3': 'u4-3', 'U2-P': 'u2-p', 'U3-P': 'u3-p', 'U4-P': 'u4-p', 'T-00': 'hero', 'T-10': 't10', 'T-20': 't20', 'S-01': 's01', 'S-02': 's02', 'S-03': 's03', 'S-04': 's04',
       'K-00': 'k-00', 'K-01': 'k-01', 'K-02': 'k-02', 'K-03': 'k-03',
       'I-1': 'i1-cut', 'I-2': 'i2-cut', 'I-3': 'i3-cut', 'I-4': 'i4-cut'}


def ph(id_, title, brief, cls=''):
    """イラスト差し込み枠。brief は描く内容(一覧に出力)。絵があれば絵を表示する"""
    f = ART.get(id_)
    done = bool(f and (ROOT / 'assets-v5' / 'illust' / f'{f}.webp').exists())
    ILLS.append((id_, title, brief, cls or 'sq', done))
    if done and id_ == 'T-00':
        return (f'<div class="art {cls}"><img src="/assets-v5/illust/hero-1100.webp" srcset="/assets-v5/illust/hero-640.webp 640w, /assets-v5/illust/hero-1100.webp 1100w" '
                f'sizes="(max-width:900px) 92vw, 760px" width="1100" height="733" alt="{title}" fetchpriority="high" decoding="async"></div>')
    if done:
        try:
            from PIL import Image as _I
            _w, _h = _I.open(ROOT / 'assets-v5' / 'illust' / f'{f}.webp').size
        except Exception:
            _w = _h = 0
        _dim = f' width="{_w}" height="{_h}"' if _w else ''
        _top = id_.endswith('-H')
        _ld = 'fetchpriority="high" decoding="async"' if _top else 'loading="lazy" decoding="async"'
        return f'<div class="art {cls}"><img src="/assets-v5/illust/{f}.webp"{_dim} alt="{title}" {_ld}></div>'
    return f'<div class="ph {cls}" role="img" aria-label="{title}" title="{brief}">{IMG_SVG}<div><b>{id_}</b><span>{title}</span></div></div>'


TRACK = ('<script async src="https://www.googletagmanager.com/gtag/js?id=G-F7SZDCFSH7"></script>\n'
         '<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag("js",new Date());gtag("config","G-F7SZDCFSH7");</script>\n'
         "<script>try{if(!localStorage.getItem('raizon_src')){var p=new URLSearchParams(location.search),r='';try{r=document.referrer?new URL(document.referrer).hostname:''}catch(e){}localStorage.setItem('raizon_src',[p.get('utm_source')||r||'direct',p.get('utm_medium')||'',p.get('utm_campaign')||'',location.pathname].join('|'))}}catch(e){}</script>")

PRELOAD = '<link rel="preload" as="image" href="/assets-v5/illust/hero-1100.webp" imagesrcset="/assets-v5/illust/hero-640.webp 640w, /assets-v5/illust/hero-1100.webp 1100w" imagesizes="(max-width:900px) 92vw, 760px" fetchpriority="high">'


def layout(path, title, desc, body, active='', ld=None):
    def a(h, t):
        return f'<a href="{h}"{" class=on" if h == active else ""}>{t}</a>'
    lds = ''.join(f'<script type="application/ld+json">{json.dumps(x, ensure_ascii=False)}</script>' for x in (ld or []))
    url = 'https://raizon-okinawa.com' + ('' if path == '/' else path)
    _on = ' class=on' if active in ('/service', '/line', '/web', '/system', '/ai') else ''
    dd = (f'<div class="dd"><a href="/service"{_on}>サービス<i class="dd-ar"></i></a><div class="dd-m"><a href="/service">サービス一覧</a><a href="/line">LINE公式アカウント構築</a>'
          '<a href="/system">業務システム・シフト管理</a><a href="/ai">AI活用支援</a></div></div>')
    nav = dd + a('/cases', '業種別の使い方') + a('/blog-list', 'ブログ') + a('/company', '会社概要')
    sub = ''.join(f'<a href="{h}">{t}</a>' for h, t in [('/service', 'サービス一覧'), ('/line', 'LINE公式アカウント構築'), ('/system', '業務システム・シフト管理'), ('/ai', 'AI活用支援')])
    spnav = (f'<details class="acc"{" open" if active in ("/service", "/line", "/web", "/system", "/ai") else ""}><summary>サービス</summary><div class="acc-b">{sub}</div></details>'
             + ''.join(a(h, t) for h, t in [('/cases', '業種別の使い方'), ('/blog-list', 'ブログ'), ('/company', '会社概要'), ('/consult', '無料WEB相談'), ('/contact', 'お問い合わせ')]))
    return f'''<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title}</title>
<meta name="description" content="{desc}">
<meta name="robots" content="index, follow">
<link rel="canonical" href="{url}">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:type" content="website">
<meta property="og:url" content="{url}">
<meta property="og:image" content="https://raizon-okinawa.com/ogp-logo.png">
<link rel="icon" type="image/png" href="/favicon-32.png?v=2" sizes="32x32">
<link rel="apple-touch-icon" href="/apple-touch-icon.png?v=2">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="{INTER}" media="print" onload="this.media='all'"><noscript><link rel="stylesheet" href="{INTER}"></noscript>
<link rel="stylesheet" href="/assets-v5/v5.css?v=71">
{lds}
{PRELOAD if path == '/' else ''}
{TRACK}
{CLARITY}
</head>
<body>
<header class="hd"><div class="hd-in">
<a href="/" class="hd-logo"><img src="/assets-v3/raizon-logo-240.webp" alt="RAIZON" width="240" height="170"><small>沖縄の事業者に、<br>デジタル担当者を。</small></a>
<nav class="hd-nav" aria-label="メインメニュー">{nav}</nav>
<div class="hd-cta"><a href="/consult" class="btn btn-o">無料WEB相談</a><a href="/contact" class="btn btn-g">お問い合わせ</a></div>
<button class="hd-tg" aria-label="メニューを開く" aria-expanded="false"><span></span><span></span><span></span></button>
</div></header>
<nav class="sp-nav" aria-label="スマホ用メニュー">{spnav}<a href="{LINE}" target="_blank" rel="noopener" class="btn btn-g">LINEで無料相談</a></nav>
<main>
{body}
</main>
<div class="mq" aria-hidden="true"><div class="mq-t"><span>CONNECT PEOPLE</span><span>CREATE YOUR LINE</span><span>CONNECT OKINAWA</span><span>CONNECT PEOPLE</span><span>CREATE YOUR LINE</span><span>CONNECT OKINAWA</span><span>CONNECT PEOPLE</span><span>CREATE YOUR LINE</span><span>CONNECT OKINAWA</span><span>CONNECT PEOPLE</span><span>CREATE YOUR LINE</span><span>CONNECT OKINAWA</span><span>CONNECT PEOPLE</span><span>CREATE YOUR LINE</span><span>CONNECT OKINAWA</span><span>CONNECT PEOPLE</span><span>CREATE YOUR LINE</span><span>CONNECT OKINAWA</span></div></div><section class="ctab"><div class="ctab-in"><div class="ctab-i"><img src="/assets-v5/illust/cta-cut.webp" alt="" loading="lazy"></div><div class="ctab-t"><small>FREE CONSULT</small><h2>お店に合うLINEを、<br>一緒につくりませんか？</h2><p>今の状況を伺い、画面を見ながらご提案します。相談は無料です。</p><div class="bs"><a class="btn btn-cw" href="/consult">無料WEB相談をする</a><a class="btn btn-wo" href="{LINE}" target="_blank" rel="noopener">LINEで相談する</a></div></div></div></section><div class="fz"><div class="fz-box">
<section class="cb2"><div class="eyb2">CONTACT</div><h2>お気軽にご相談ください</h2>
<div class="bt"><a class="d" href="/consult"><div><small>WEB CONSULT</small>無料WEB相談</div><span>→</span></a><a class="c" href="/contact"><div><small>CONTACT</small>無料で相談する</div><span>→</span></a></div></section>
<footer class="ft2"><div class="ft-in">
<div><a href="/" class="ft-logo"><img src="/assets-v3/raizon-logo-240.webp" alt="RAIZON" width="240" height="170" loading="lazy"></a>
<p>沖縄の事業者に、デジタル担当者を。<br>LINEを入口に、業務システム・AI活用まで。</p>
<p>RAIZON<br>本社：沖縄県中頭郡北谷町</p>
<div class="sns"><a href="https://www.instagram.com/raizon_okinawa/" target="_blank" rel="noopener" aria-label="Instagram"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="1" fill="currentColor"/></svg></a><a href="{LINE}" target="_blank" rel="noopener" aria-label="LINE"><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 3C6.5 3 2 6.6 2 11c0 3.9 3.5 7.2 8.3 7.9.3.1.8.2.9.5.1.3.1.7 0 1l-.1.9c0 .3-.2 1 .9.5s5.800-3.400 7.900-5.800C21.300 14.100 22 12.600 22 11c0-4.400-4.500-8-10-8z"/></svg></a></div></div>
<div class="ft-cols">
<div><b>サービス</b><a href="/service">サービス一覧</a><a href="/line">LINE公式アカウント構築</a><a href="/system">業務システム・シフト管理</a><a href="/ai">AI活用支援</a></div>
<div><b>使い方・情報</b><a href="/cases">業種別の使い方</a><a href="/blog-list">ブログ</a><a href="/service#price">料金プラン</a><a href="/#flow">ご利用の流れ</a><a href="/#faq">よくある質問</a></div>
<div><b>会社情報</b><a href="/company">会社概要</a><a href="/consult">無料WEB相談</a><a href="/contact">お問い合わせ</a></div>
</div></div>
<div class="ft-bt"><a href="/company#privacy">プライバシーポリシー</a><span>© RAIZON</span></div></footer>
</div></div>
<div class="wpop" id="wpop" role="dialog" aria-modal="true" aria-labelledby="wpop-t" hidden><div class="wpop-bg" data-wp-close></div><div class="wpop-card">
<button class="wpop-x" type="button" aria-label="閉じる" data-wp-close><i></i><i></i></button>
<div class="wpop-hd"><img src="/assets-v5/illust/cta-cut.webp" alt="" width="200" loading="lazy"><span class="wpop-badge">今なら無料</span></div>
<div class="wpop-eb">WELCOME TO RAIZON</div>
<h2 id="wpop-t">お店のLINE、<br><span class="mk">実際の画面</span>を<br>無料でお試し。</h2>
<p>予約・メニュー・クーポンの流れを、お客様と同じ目線で体験できます。友だち追加だけで、費用はかかりません。</p>
<ul class="wpop-pt"><li>初期費用0円</li><li>いつでも解除OK</li></ul>
<a class="btn btn-dg wpop-go" href="{DEMO}" target="_blank" rel="noopener" data-wp-close>デモ画面を無料で試す <span>→</span></a>
<button class="wpop-later" type="button" data-wp-close>あとで見る</button>
</div></div>
<div class="sp-cta"><a href="{DEMO}" target="_blank" rel="noopener" class="btn btn-o">デモを触る</a><a href="{LINE}" target="_blank" rel="noopener" class="btn btn-g">LINEで相談</a></div>
<script src="/assets-v5/v5.js?v=17" defer></script>
</body>
</html>
'''


# ---------- 部品 ----------
def page_hero(en, jp, ds, crumb):
    return f'''<section class="ph2"><div class="wrap">
<div class="crumb"><a href="/">トップ</a><i>／</i>{crumb}</div>
<h1>{en}</h1><div class="jp">{jp}</div>{f'<p class="ds">{ds}</p>' if ds else ''}
<div class="wm" aria-hidden="true">{en}</div></div></section>'''


def main(inner, cls=''):
    return f'<div class="main {cls}"><div class="wrap stack">{inner}</div></div>'


def about(en, jp, p1, p2=''):
    return f'<div class="card2 about"><div><div class="big">{en}</div><div class="sm">{jp}</div></div><div><p>{p1}</p>{f"<p>{p2}</p>" if p2 else ""}</div></div>'


def fc(eyb, h3, p, vis, more=None, tags=None, rev=False):
    return (f'<div class="card2 fc{" rev" if rev else ""}"><div class="fc-v">{vis}</div><div><div class="eyb">{eyb}</div><h3>{h3}</h3><p>{p}</p>'
            + (f'<ul>{"".join(f"<li>{t}</li>" for t in tags)}</ul>' if tags else '')
            + ((f'<a class="btn btn-dg btn-lg fc-btn" href="{more[0]}">{more[1]} →</a>' if len(more) > 2 else f'<a class="more" href="{more[0]}">{more[1]} →</a>') if more else '') + '</div></div>')


def sh(eyb, h2, p='', c=False):
    return f'<div class="sh{" c" if c else ""}"><div class="eyb2">{eyb}</div><h2>{h2}</h2>{f"<p>{p}</p>" if p else ""}</div>'


def q3(items, prefix):
    """お悩み・ポイント3つ(絵+見出し+一行)"""
    out = '<div class="q3">'
    for i, (t, d, brief) in enumerate(items, 1):
        out += f'<div class="it">{ph(f"{prefix}-{i:02d}", t, brief, "wide")}<b>{t}</b><p>{d}</p></div>'
    return out + '</div>'


def plans_html():
    P = [('LINE BASIC', 'LINE', '5,000', '5,500', '', ['LINE公式アカウントの構築', 'リッチメニュー・基本的な配信', '運用相談・改善相談'], False),
         ('LINE STANDARD', 'LINE＋ホームページ', '11,800', '12,980', '', ['BASICの内容すべて', 'ホームページの作成・更新', '予約・問い合わせの導線', '配信設計・顧客管理'], True),
         ('LINE PREMIUM', 'LINE＋HP＋システム', '23,800', '26,180', '〜', ['STANDARDの内容すべて', '業務システム（予約・顧客・シフト・請求など）', '自動化・改善ミーティング・AI活用相談'], False)]
    out = '<div class="plans">'
    for nm, ty, pr, tax, til, items, rec in P:
        out += (f'<div class="plan{" rec" if rec else ""}">{"<div class=rib>おすすめ</div>" if rec else ""}<div class="nm">{nm}</div><div class="ty">{ty}</div>'
                f'<div class="pr"><small>月額</small><b>{pr}</b><small>円{til}（税別）</small></div><div class="tax">税込 {tax}円{til}</div>'
                f'<ul>{"".join(f"<li>{i}</li>" for i in items)}</ul><a href="/contact" class="btn {"btn-g" if rec else "btn-o"}">このプランで相談する</a></div>')
    return out + '</div><p class="note">初期費用0円・最低契約期間なし。LINE公式アカウントの利用料（LINEヤフー株式会社）は別途かかります。PREMIUMの金額は、システムの内容によってお見積もりします。</p>'


CASES = [
    ('/assets-v3/case-building.jpg', ['LINE構築', 'シフト管理'], 'ビル管理会社様', 'シフト提出をLINEで。スタッフはスマホで提出、管理者は一覧で承認。', '/blog/case-shinya-facility'),
    ('/assets-v3/case2-photo.webp', ['ホームページ', 'LINE構築'], '理容室運営会社様（北谷町）', 'ホームページ・LINE・予約を、ひとつの流れに。', '/blog/case-tenkabito'),
    ('/assets-v3/case-parlor-minato.jpg', ['ホームページ'], '沖縄そば専門パーラー様', 'お店の魅力と場所を、迷わず届けるホームページに。', '/blog/case-parlor-minato'),
]


def cases_html(n=3):
    return '<div class="cases">' + ''.join(
        f'<a class="case" href="{u}"><div class="im" style="background-image:url({img})"></div><div class="bd"><div class="tg">{"".join(f"<span>{t}</span>" for t in tags)}</div><h3>{who}</h3><p>{txt}</p></div></a>'
        for img, tags, who, txt, u in CASES[:n]) + '</div>'


def posts_html(n=3):
    try:
        posts = json.loads((ROOT / 'api/_posts-static.json').read_text(encoding='utf-8'))
    except Exception:
        return ''
    posts = sorted(posts, key=lambda p: p.get('createdAt', ''), reverse=True)[:n]
    out = '<div class="posts">'
    for i, p in enumerate(posts, 1):
        out += (f'<a class="post" href="/blog/{p["id"]}">{ph(f"B-{i:02d}", "記事のサムネイル", "ブログ記事のサムネイル画像（16:9）。記事ごとに差し替え。", "wide")}'
                f'<div class="bd"><span class="tag">{p.get("category", "")}</span><b>{p["title"]}</b><time>{p.get("createdAt", "")[:10].replace("-", ".")}</time></div></a>')
    return out + '</div>'


def faq_html(items):
    return '<div class="faq">' + ''.join(f'<details><summary>{q}</summary><p>{a}</p></details>' for q, a in items) + '</div>'


def faq_ld(items):
    return {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
        {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": re.sub('<[^>]+>', '', a)}} for q, a in items]}



PH = '/assets-v5/photo/'


def _photo(name):
    return (PH + name + '.webp') if (ROOT / 'assets-v5' / 'photo' / (name + '.webp')).exists() else ''


def _card(head, color, rows, foot='予約する'):
    return (f'<div class="lp-card"><div class="lp-card-h" style="background:{color}">{head}</div><div class="lp-card-b">'
            + ''.join(f'<div><span>{a}</span><em>{b}</em></div>' for a, b in rows) + f'</div><div class="lp-card-f">{foot}</div></div>')


def _fcard(img, name, price, tag):
    return (f'<div class="lp-fc"><img src="{PH}{img}.webp" alt="" loading="lazy"><b>{name}</b><span>{tag}</span><em>{price}</em><div class="lp-card-f">注文する</div></div>')


def _car(items):
    return '<div class="lp-car-in">' + ''.join(items) + '</div>'


def _conf(head, lines):
    return f'<div class="lp-conf-h">✓ {head}</div><div class="lp-conf-b">' + '<br>'.join(lines) + '</div>'


def _cp(badge, title, sub, foot):
    return f'<span class="lp-cp-badge">{badge}</span><b>{title}</b><small>{sub}</small><div class="lp-card-f">{foot}</div>'


def _rows(items):
    out = ''
    for it in items:
        img = f'<img src="{PH}{it[3]}.webp" alt="">' if len(it) > 3 else ''
        out += f'<div class="lp-row">{img}<b>{it[0]}</b><span>{it[1]}</span>' + (f'<em>{it[2]}</em>' if it[2] else '') + '</div>'
    return out


def _dates(days):
    return '<div class="lp-dates">' + ''.join(f'<span>{n}<small>{w}</small></span>' for n, w in days) + '</div>'


def _slots(slots):
    return '<div class="lp-slots">' + ''.join(f'<span class="{"off" if o else ""}">{t}</span>' for t, o in slots) + '</div>'


def _sum(rows, btn):
    return '<dl class="lp-sum">' + ''.join(f'<div><dt>{a}</dt><dd>{b}</dd></div>' for a, b in rows) + f'</dl><div class="lp-btn">{btn}</div>'


def _steps(items):
    return ''.join(f'<div class="lp-st"><h4>{t}</h4>{h}</div>' for t, h in items)


def _demo_defs():
    D = []
    # ---- 美容室 ----
    cam = _car([_card('CUT', '#8A7767', [('レディース 60分', '¥5,500'), ('メンズ 45分', '¥4,400'), ('キッズ 30分', '¥3,300')]),
                _card('COLOR・PERM', '#B98F68', [('カラー 90分', '¥6,600'), ('パーマ 120分', '¥8,800'), ('縮毛矯正 150分', '¥13,200')]),
                _card('CARE', '#6F8F82', [('トリートメント', '¥3,300'), ('ヘッドスパ 30分', '¥4,400'), ('眉カット 15分', '¥1,100')])])
    D.append(dict(
        name='Atelier Hair salon', av='A', col='#5BC873', col2='#3B6FE0', title='ご予約',
        menu_img='/assets-v3/demo-salon-richmenu.webp', tiles=[],
        hello='友だち追加ありがとうございます。<br>下のメニューから、メニュー・ご予約・クーポンを試せます。',
        steps=_steps([('① メニューを選ぶ', _rows([('レディースカット', '60分', '¥5,500'), ('メンズカット', '45分', '¥4,400'), ('カラー', '90分', '¥6,600'), ('ヘッドスパ', '30分', '¥4,400')])),
                      ('② 担当を選ぶ', _rows([('おまかせ', '指名なし', ''), ('スタイリストA', 'トップスタイリスト', ''), ('スタイリストB', 'スタイリスト', '')])),
                      ('③ 日時を選ぶ', _dates([('17', '金'), ('18', '土'), ('19', '日'), ('20', '月'), ('21', '火')]) + _slots([('11:00', 1), ('13:00', 0), ('14:00', 0), ('15:30', 0), ('17:00', 0), ('18:30', 1)])),
                      ('④ 内容を確認', _sum([('日時', '5/18（土）14:00'), ('メニュー', 'レディースカット'), ('担当', 'スタイリストA'), ('料金', '¥5,500')], '予約を確定する'))]),
        ops=[['bot', 'HELLO'], ['wait', 1000],
             ['cap', 'MENU', 'カテゴリ別のカードで、料金と所要時間を表示'], ['tap', 16.7, 50], ['wait', 500], ['user', 'メニュー'], ['typing'], ['card', cam, 'lp-car'], ['wait', 1200], ['slide', -150], ['wait', 1400], ['slide', -276], ['wait', 1500],
             ['cap', 'RESERVE', 'メニュー → 担当 → 空き日時 → 確定。24時間受付'], ['tap', 50, 50], ['wait', 500], ['user', '予約'], ['typing'],
             ['bot', 'ご予約はこちらから。<br>メニュー・担当・日時を選べます。'], ['wait', 900], ['open'], ['wait', 400],
             ['step', 1], ['choose', 1, 0, 0], ['wait', 600], ['step', 2], ['choose', 2, 0, 1], ['wait', 600], ['step', 3], ['choose', 3, 0, 1], ['choose', 3, 1, 2], ['wait', 500], ['step', 4], ['wait', 1200], ['press'], ['wait', 250], ['close'], ['wait', 600],
             ['card', _conf('ご予約が確定しました', ['日時：5/18（土）14:00', 'メニュー：レディースカット（60分）', '担当：スタイリストA　¥5,500']), 'lp-conf'], ['wait', 2200],
             ['cap', 'COUPON', '初回10%OFFを配信。会計時にスタッフへ提示'], ['tap', 83.3, 50], ['wait', 500], ['user', 'クーポン'], ['typing'], ['card', _cp('10%OFF', '初回ご来店クーポン', '全メニュー対象・30日間有効', 'クーポンを使う'), 'lp-cp'], ['wait', 3000]],
        fl=['予約は24時間いつでも', 'クーポンを配信', '担当者を選んで予約']))
    # ---- 飲食店(モバイルオーダー) ----
    fcar = _car([_fcard('soba', '沖縄そば', '¥850', '人気No.1'), _fcard('taco', 'タコライス', '¥900', 'ボリューム'), _fcard('parfait', 'マンゴーパフェ', '¥780', 'デザート')])
    D.append(dict(
        name='Café Ryukyu', av='C', col='#F08A3C', col2='#C9531C', title='モバイルオーダー',
        menu_img='', tiles=[('メニュー', 'soba'), ('注文', 'taco'), ('クーポン', 'parfait')],
        hello='友だち追加ありがとうございます。<br>メニューの写真を見て、そのままモバイルオーダーできます。',
        steps=_steps([('① メニューを選ぶ', _rows([('沖縄そば', '', '¥850', 'soba'), ('タコライス', '', '¥900', 'taco'), ('マンゴーパフェ', '', '¥780', 'parfait')])),
                      ('② 受け取り方法', _rows([('店内でお召し上がり', 'お席にお持ちします', ''), ('テイクアウト', 'お待たせしません', '')])),
                      ('③ 受け取り時間', _slots([('18:00', 1), ('18:15', 0), ('18:30', 0), ('18:45', 0), ('19:00', 0), ('19:15', 1)]) + '<p class="lp-note">× は受付終了。空いている時間だけ選べます</p>'),
                      ('④ 内容を確認', _sum([('メニュー', 'タコライス ×1'), ('受け取り', 'テイクアウト 18:30'), ('お支払い', '店頭でお会計'), ('合計', '¥900')], '注文を確定する'))]),
        ops=[['bot', 'HELLO'], ['wait', 1000],
             ['cap', 'MENU', '写真つきのメニューで、料金をひと目で'], ['tap', 16.7, 50], ['wait', 500], ['user', 'メニュー'], ['typing'], ['card', fcar, 'lp-car'], ['wait', 1200], ['slide', -140], ['wait', 1300], ['slide', -270], ['wait', 1400],
             ['cap', 'ORDER', 'お店でも、テイクアウトでも。LINEだけで注文'], ['tap', 50, 50], ['wait', 500], ['user', '注文'], ['typing'],
             ['bot', 'ご注文はこちらから。<br>メニュー・受け取り方法・時間を選べます。'], ['wait', 900], ['open'], ['wait', 400],
             ['step', 1], ['choose', 1, 0, 1], ['wait', 600], ['step', 2], ['choose', 2, 0, 1], ['wait', 600], ['step', 3], ['choose', 3, 1, 2], ['wait', 600], ['step', 4], ['wait', 1200], ['press'], ['wait', 250], ['close'], ['wait', 600],
             ['card', _conf('ご注文を受け付けました', ['受け取り：18:30（テイクアウト）', 'タコライス ×1　¥900', '注文番号：A-12']), 'lp-conf'], ['wait', 2200],
             ['cap', 'COUPON', '雨の日10%OFFを配信。会計時に提示'], ['tap', 83.3, 50], ['wait', 500], ['user', 'クーポン'], ['typing'], ['card', _cp('10%OFF', '雨の日クーポン', 'ご注文の合計から・本日限り', 'クーポンを使う'), 'lp-cp'], ['wait', 3000]],
        fl=['メニューを写真で見られる', 'テイクアウトも注文OK', '雨の日クーポンを配信']))
    # ---- ビル管理 ----
    D.append(dict(
        name='ビル管理 シフト', av='B', col='#3F86F2', col2='#1D4E89', title='シフト提出',
        menu_img='', tiles=[('シフト提出', 'il:u3-1'), ('予定の確認', 'il:d-04'), ('お知らせ', 'il:u3-3')],
        hello='お疲れさまです。<br>シフトの提出は、このLINEからできます。',
        steps=_steps([('① 日付を選ぶ', _dates([('10', '月'), ('11', '火'), ('12', '水'), ('13', '木'), ('14', '金')]) + '<p class="lp-note">希望する日を選んでください</p>'),
                      ('② 勤務を選ぶ', _rows([('早番', '6:00〜14:00', ''), ('日勤', '9:00〜18:00', ''), ('遅番', '13:00〜22:00', ''), ('夜勤', '22:00〜翌6:00', '')])),
                      ('③ 内容を確認', _sum([('日付', '11/12（水）'), ('勤務', '日勤 9:00〜18:00'), ('現場', '本館 清掃'), ('通知', '管理者へ送信')], '提出する'))]),
        ops=[['bot', 'HELLO'], ['wait', 1000],
             ['cap', 'SUBMIT', '日付と勤務を選ぶだけ。紙・口頭・個別連絡を一本化'], ['tap', 16.7, 50], ['wait', 500], ['user', 'シフト提出'], ['typing'],
             ['bot', '提出フォームを開きます。<br>希望する日と勤務を選んでください。'], ['wait', 900], ['open'], ['wait', 400],
             ['step', 1], ['choose', 1, 0, 2], ['wait', 600], ['step', 2], ['choose', 2, 0, 1], ['wait', 600], ['step', 3], ['wait', 1200], ['press'], ['wait', 250], ['close'], ['wait', 600],
             ['card', _conf('シフトを提出しました', ['11/12（水）日勤 9:00〜18:00', '管理者へ通知しました']), 'lp-conf'], ['wait', 2200],
             ['cap', 'NOTICE', '承認されたら、LINEですぐ通知'], ['tap', 83.3, 50], ['wait', 500], ['user', 'お知らせ'], ['typing'],
             ['card', _cp('確定', '11月のシフトが確定しました', '12日(水) 日勤 9:00〜18:00 本館', '予定を見る'), 'lp-cp'], ['wait', 3000]],
        fl=['スマホでかんたん提出', '管理者は一覧で承認', '提出・欠勤をすぐ通知']))
    # ---- 整体 ----
    D.append(dict(
        name='整体 Lumina', av='L', col='#2AA7A3', col2='#17766F', title='問診・ご予約',
        menu_img='', tiles=[('問診票', 'il:u4-1'), ('ご予約', 'il:u4-2'), ('お知らせ', 'il:u4-3')],
        hello='友だち追加ありがとうございます。<br>来院前に問診票を入力できます。そのままご予約もどうぞ。',
        steps=_steps([('① お悩みを選ぶ', _rows([('肩こり', '首・肩まわり', ''), ('腰痛', '腰・骨盤まわり', ''), ('頭痛', '首こり由来など', ''), ('その他', 'ご相談ください', '')])),
                      ('② 日時を選ぶ', _dates([('17', '金'), ('18', '土'), ('19', '日'), ('20', '月'), ('21', '火')]) + _slots([('10:00', 1), ('11:30', 0), ('14:00', 0), ('15:30', 0), ('17:00', 0), ('18:30', 1)])),
                      ('③ 内容を確認', _sum([('お悩み', '肩こり'), ('日時', '5/18（土）14:00'), ('問診', '入力済み'), ('担当', 'おまかせ')], '予約を確定する'))]),
        ops=[['bot', 'HELLO'], ['wait', 1000],
             ['cap', 'QUESTION', '来院前に問診を入力。当日の受付がスムーズに'], ['tap', 16.7, 50], ['wait', 500], ['user', '問診票'], ['typing'],
             ['bot', 'ご予約と一緒に、<br>お悩みをお聞かせください。'], ['wait', 900], ['open'], ['wait', 400],
             ['step', 1], ['choose', 1, 0, 0], ['wait', 600], ['step', 2], ['choose', 2, 0, 1], ['choose', 2, 1, 2], ['wait', 600], ['step', 3], ['wait', 1200], ['press'], ['wait', 250], ['close'], ['wait', 600],
             ['card', _conf('ご予約が確定しました', ['日時：5/18（土）14:00', 'お悩み：肩こり（問診入力済み）']), 'lp-conf'], ['wait', 2200],
             ['cap', 'REMIND', '前日にリマインド。通院のうっかりを防ぐ'], ['tap', 83.3, 50], ['wait', 500], ['user', 'お知らせ'], ['typing'],
             ['card', _cp('明日', 'ご来院のお知らせ', '5/18（土）14:00 ・ 保険証をお持ちください', '予約を確認'), 'lp-cp'], ['wait', 3000]],
        fl=['来院前に問診を入力', '前日にリマインド', '休診日をお知らせ']))
    return D


DEMOS = _demo_defs()


def lp_demo(k=0):
    """LINEのトーク画面から動く画面(公開中サイトのヒーローと同じ流れ)。業種ごとに内容・写真・色が違う。スマホは約318×641(実機比率)"""
    d = DEMOS[k]
    ops = [[(d['hello'] if (o[0] == 'bot' and o[1] == 'HELLO') else o[1]) if i == 1 and o[0] == 'bot' else v for i, v in enumerate(o)] for o in d['ops']]
    if d['menu_img']:
        menu = f'<div class="lp-menu img"><img src="{d["menu_img"]}" alt="" width="1000" height="675"><span class="lp-tap"></span></div>'
    else:
        tl = ''
        for lab, ph_ in d['tiles']:
            if ph_.startswith('il:'):
                tl += f'<div class="lp-tile il"><img src="/assets-v5/illust/{ph_[3:]}.webp" alt="" loading="lazy"><b>{lab}</b></div>'
                continue
            src = _photo(ph_)
            im = f'<img src="{src}" alt="" loading="lazy">' if src else '<i class="nophoto"></i>'
            tl += f'<div class="lp-tile">{im}<b>{lab}</b></div>'
        menu = f'<div class="lp-menu"><div class="lp-tiles">{tl}</div><span class="lp-tap"></span></div>'
    return (f'<div class="lp dm" data-lp data-script=\'{json.dumps(ops, ensure_ascii=False).replace(chr(39), "&#39;")}\' style="--c1:{d["col"]};--c2:{d["col2"]}"><div class="lp-bg"></div>'
            f'<div class="lp-chips"><span class="lp-fl f1"><i style="background:var(--c1)"></i>{d["fl"][0]}</span><span class="lp-fl f2"><i style="background:var(--c2)"></i>{d["fl"][1]}</span><span class="lp-fl f3"><i style="background:#F2A93B"></i>{d["fl"][2]}</span></div>'
            f'<div class="lp-wrap"><div class="lp-stage"><div class="lp-ph"><div class="lp-top"><span>9:41</span><i></i><em></em></div>'
            f'<div class="lp-screen"><div class="lp-head"><span class="lp-av">{d["av"]}</span><div><div class="lp-name">{d["name"]}</div><div class="lp-sub">公式アカウント（デモ）</div></div></div>'
            f'<div class="lp-chat"><div class="lp-msgs"></div></div>{menu}'
            f'<div class="lp-sheet"><div class="lp-sheet-top"><span>{d["title"]}</span><i class="lp-dots"><u></u><u></u><u></u><u></u></i></div><div class="lp-sheet-body">{d["steps"]}</div></div>'
            f'</div></div><div class="lp-cap sw"><b></b><span></span></div></div></div>'
            f'<a class="lp-cta" href="{DEMO}" target="_blank" rel="noopener"><small>実際の画面を</small><b>触ってみる</b></a></div>')


def tabs(items, prefix):
    """業種別の使い方(チップで切り替え)。items = [(業種, お困りごと, [(見出し,一行)x3], 絵の説明)]"""
    chips = ''.join(f'<button type="button"{" class=on" if i == 0 else ""}>{n}</button>' for i, (n, *_r) in enumerate(items))
    panes = ''
    for i, (n, worry, steps, brief) in enumerate(items):
        minis = ''.join(f'<div class="mini"><span class="no">{k:02d}</span>{ph(f"{prefix}{i + 1}-{k}", t, d, "sm")}<b>{t}</b><span>{d}</span></div>' for k, (t, d) in enumerate(steps, 1))
        panes += (f'<div class="uc{" on" if i == 0 else ""}"><div class="l"><div class="lb">よくあるお困りごと</div><div class="t">{worry}</div><div class="minis">{minis}</div></div>'
                  + (f'<div class="r demo">{lp_demo(i)}</div></div>' if i < len(DEMOS) else f'<div class="r">{ph(f"{prefix}{i + 1}-P", f"{n}のLINE画面", brief, "tall")}</div></div>'))
    return f'<div data-tabs><div class="chips">{chips}</div>{panes}</div>'


USE = [
    ('美容室・サロン', '電話やDMで予約を取っていて、施術中に出られず取りこぼしている。一度来たお客様が、次にいつ来るのか分からない。',
     [('LINEで予約', 'メニュー・日時をタップで選ぶ'), ('前日にリマインド', '自動でお知らせ。うっかりを防ぐ'), ('次回クーポン', '来店後に届けて、リピートへ')],
     'スマホ画面のイメージ。リッチメニュー（予約・メニュー・クーポン・アクセス）と、美容室の写真を使ったトーク画面。'),
    ('飲食店', 'メニューや営業時間の問い合わせが、電話で何度も来る。テイクアウトの案内も、紙とSNSでバラバラ。',
     [('メニューを見せる', 'リッチメニューから、写真つきで'), ('営業時間を自動返信', '夜や休みの問い合わせにも'), ('お得な配信', '雨の日クーポンなどを必要な人に')],
     'スマホ画面のイメージ。飲食店のメニュー写真が並ぶリッチメニューと、クーポンのトーク画面。'),
    ('ビル管理・清掃', 'スタッフのシフトが、紙・口頭・LINEでバラバラに届き、集計に時間がかかる。',
     [('スマホでシフト提出', 'スタッフはタップで希望を送る'), ('管理者は一覧で承認', '提出状況をまとめて確認'), ('通知も自動', '提出・欠勤をすぐ把握')],
     'スマホ画面のイメージ。シフト提出画面（日付のカレンダーと「提出する」ボタン）。'),
    ('整体・治療院', '初めての方の問診や予約が、電話中心。通院が空くと、そのまま来なくなってしまう。',
     [('LINEで予約・問診', '来院前に入力してもらう'), ('通院のリマインド', '次の予約を忘れない'), ('お知らせ配信', '休診日や季節のケアを案内')],
     'スマホ画面のイメージ。整体院のリッチメニュー（予約・問診・アクセス）と、リマインドのトーク。'),
]

ORG = {"@context": "https://schema.org", "@type": "LocalBusiness", "name": "RAIZON", "url": "https://raizon-okinawa.com/", "image": "https://raizon-okinawa.com/assets-v3/raizon-logo.png",
       "telephone": "080-6493-7744", "priceRange": "¥5,000〜（税別）",
       "address": {"@type": "PostalAddress", "addressRegion": "沖縄県", "addressLocality": "中頭郡北谷町", "addressCountry": "JP"}, "areaServed": "沖縄県"}

PAGES = {}

# ========== サービス4ページ ==========
AI_PRICE = '''<div class="plans" style="grid-template-columns:minmax(0,520px);justify-content:center"><div class="plan rec"><div class="rib">料金</div><div class="nm">AI活用支援</div><div class="ty">月額ではなく、人数に応じた料金です</div>
<div class="pr"><small>1名</small><b>5,000</b><small>円〜</small></div>
<ul><li>お店・会社の業務に合わせた、AIの使い方のご相談</li><li>文章の下書き・情報の整理・マニュアル作りなど</li><li>入力してよい情報など、使い方のルールづくり</li></ul><a href="/contact" class="btn btn-g">AI活用について相談する</a></div></div>
<p class="note" style="text-align:center">内容や進め方は、無料相談でご説明します。</p>'''


def service_page(path, fname, title, desc, en, jp, ds, crumb, ab, feats, worries, prefix, faq, price=None):
    body = page_hero(en, jp, ds, crumb) + main(
        about(*ab)
        + ''.join(fc(e, h, p, ph(f'{prefix}-{i + 1:02d}', t, b), None, tg, i % 2 == 1) for i, (e, h, p, t, b, tg) in enumerate(feats))
        + sh('PROBLEM', 'こんなお悩みはありませんか？') + q3(worries, prefix + 'P')
    ) + f'''<div class="main w"><div class="wrap">{sh('PRICE', '料金', '', True)}{price or plans_html()}</div></div>
<div class="main"><div class="wrap">{sh('FAQ', 'よくあるご質問', '', True)}{faq_html(faq)}</div></div>'''
    PAGES[path] = (fname, title, desc, body, path, [faq_ld(faq)])


LINE_FAQ = [
    ('LINE公式アカウントを、まだ持っていなくても大丈夫ですか？', 'はい。開設からご一緒します。アカウントはお客様の名義で作り、お客様のものとして残ります。'),
    ('今のアカウントを、そのまま使えますか？', '使えます。今の友だちはそのままに、リッチメニューや予約の仕組みを見直します。'),
    ('LINE社の利用料は、別にかかりますか？', 'はい。LINE公式アカウントの月額の利用料（プランにより0円〜）は、お客様からLINEヤフー株式会社へ直接お支払いいただきます。'),
]
service_page('/line', 'line.html', '沖縄のLINE公式アカウント構築｜月額5,000円〜・初期費用0円 | RAIZON',
             '沖縄の事業者向けLINE公式アカウント構築・運用。リッチメニュー、予約受付とリマインド、クーポン・スタンプまで。初期費用0円・月額5,000円（税別）〜。',
             'LINE', 'LINE公式アカウント構築', '', 'LINE公式アカウント構築',
             ('About', 'LINE構築について', 'メニュー・予約・クーポンを、LINEひとつに。お客様はタップするだけ、お店は自動で。', '開設から、毎月の改善まで一緒に進めます。'),
             [('RICH MENU', 'リッチメニュー', 'メニュー・予約・クーポンのボタンを、常に表示。', 'スマホのリッチメニューをタップする指', 'スマホ画面の下半分に6分割のメニュー。「予約」ボタンを指がタップし、波紋が広がる。', ['タブ切り替え', '1タップで予約・地図・電話']),
              ('RESERVATION', '予約の受付とリマインド', '選ぶだけで予約。前日のお知らせは自動。', 'カレンダーと、自動で届くリマインド', '大きなカレンダーの1日に丸印。そこからスマホへ「明日のご予約のお知らせ」の通知が飛ぶ。', ['空き時間だけ表示', '前日・直前の通知']),
              ('COUPON', 'クーポン・スタンプ', '友だち追加から来店まで、自動で順番に届ける。', 'クーポンを受け取って喜ぶお客様', 'スマホから「10%OFF」のクーポン券とスタンプカードが飛び出し、笑顔の女性が受け取る。', ['初回クーポン', 'スタンプカード'])],
             [('予約の電話に出られない', '営業中は手が離せない。', '電話が鳴っているが出られず、困った顔の美容師。スマホには不在着信。'), ('問い合わせがバラバラ', '電話・SNS・メールに分散。', '電話・Instagram・メール・LINEのアイコンが散らかって、頭を抱える店主。'), ('リピートにつながらない', '次の来店のきっかけがない。', 'お客様の背中が遠ざかっていくイラスト。手元の名刺がぽつんと残る。')], 'L', LINE_FAQ)

WEB_FAQ = [
    ('買い切りの制作と、何が違いますか？', '最初にまとまった費用がかからず、公開後の更新や改善も月額に含まれます。'),
    ('ドメイン（〇〇.com など）は、誰の名義になりますか？', 'お客様の名義で取得することをおすすめしています。ご契約が終わっても、ドメインはお客様の手元に残ります。'),
    ('解約したら、ホームページはどうなりますか？', '通算3年以上ご利用のお客様には、ホームページのデータを譲渡できます。3年未満の場合は、契約の終了日で公開を停止します。'),
]
SYS_FAQ = [
    ('既製のシフト管理アプリと、何が違いますか？', '既製のアプリで足りる場合は、それが一番手軽です。お店独自のルールがある場合や、LINEと一体で整えたい場合に、専用の仕組みが向いています。'),
    ('スタッフ全員が、スマホを使いこなせるか心配です。', '画面はシンプルにし、使い方の説明もお手伝いします。一部のスタッフから使い始めることもできます。'),
    ('費用はどのくらいですか？', '月額23,800円（税別）からです。作るものの内容によってお見積もりします。初期費用は0円です。'),
]
service_page('/system', 'system.html', '業務システム・シフト管理アプリの制作｜沖縄の中小企業向け | RAIZON',
             '沖縄の中小企業・店舗向けに、シフト提出・予約管理・顧客管理などの業務システムを制作します。月額23,800円（税別）〜。',
             'SYSTEM', '業務システム・シフト管理', '', '業務システム',
             ('About', '業務システムについて', 'シフト提出、予約管理、顧客管理など、毎日の「面倒な作業」を、お店や会社のやり方に合わせた仕組みにします。', 'LINEとも連携できます。'),
             [('SHIFT', 'シフト提出・管理', 'スタッフはスマホで提出、管理者は一覧で承認。', 'スマホでシフトを出し、PCで承認', '左にスマホを持つスタッフ、右にPCの管理者。間を「提出」「承認」の矢印が行き来する。', ['提出・承認・欠勤申請', '通知']),
              ('CUSTOMER', '予約管理・顧客管理', '来店履歴やメモを残して、次の提案へ。', '顧客カードが並ぶ管理画面', 'タブレットに顧客のカードが並び、1枚に「来店3回」のメモ。横に予約カレンダー。', ['予約の一覧', 'タグで分類']),
              ('AUTOMATION', '自動化・AIの活用', '転記や集計、定型の連絡を自動に。', '歯車が回って、作業が自動で進む', '大小の歯車がかみ合い、書類やメッセージが自動で出てくる。人はコーヒーを飲んで見守る。', ['定型連絡', '集計・帳票'])],
             [('シフトの集計が大変', '紙・口頭・LINEでバラバラ。', '紙・付箋・スマホのメッセージに埋もれる管理者。'), ('予約と顧客が分かれている', '探すのに時間がかかる。', '電話・ノート・Excelの3つに引っ張られている人。'), ('同じ入力をくり返す', '転記や集計が手作業。', '同じ書類を何度も書き写している人。時計が進んでいる。')], 'S', SYS_FAQ)

AI_FAQ = [
    ('AIに詳しくなくても大丈夫ですか？', '大丈夫です。今の業務をお聞きしながら、AIが役に立ちそうな場面を一緒に探します。'),
    ('AIに、お客様の情報を入れても大丈夫ですか？', '個人情報や社外秘の情報の扱いにはルールが必要です。入力してよい情報・いけない情報の決め方から、ご一緒します。'),
    ('料金はいくらですか？', '1名あたり5,000円〜です（月額ではありません）。内容や進め方は、無料相談でご説明します。'),
    ('AIが作った文章を、そのまま使って大丈夫ですか？', '下書きとして使い、最後は人が確認することをおすすめしています。確認のポイントもお伝えします。'),
]
service_page('/ai', 'v4/ai.html', 'AI活用支援｜文章作成・業務の整理を、沖縄の中小企業に | RAIZON',
             '沖縄の中小企業・店舗向けのAI活用支援。お知らせ文の下書き、問い合わせの整理、マニュアル作りなど、業務がラクになる使い方を一緒に見つけます。',
             'AI', 'AI活用支援', '', 'AI活用支援',
             ('About', 'AI活用について', 'AIを使うことが目的ではなく、業務がラクになることが目的。「ここなら使える」という場面から、一緒に始めます。', '使い方のルールづくりもご一緒します。'),
             [('WRITING', '文章の下書き', 'お知らせやSNSの文章を、短い時間で。', 'AIと一緒に文章をつくる', 'パソコンの前で店主とAIキャラクターが、吹き出しを一緒に組み立てている。', ['お知らせ', 'SNS投稿']),
              ('ORGANIZE', '情報の整理', '問い合わせやメモを、整理して見える化。', '散らかったメモが、すっきり整う', '付箋やメモが、AIの手で整った一覧表になっていく。', ['FAQづくり', 'マニュアル']),
              ('RULES', '使い方のルール', '入れてよい情報・確認の方法を決める。', '安心して使うための約束', 'チェックリストとハンコ。AIキャラクターと店主が一緒に確認している。', ['情報の扱い', '確認フロー'])],
             [('何に使えばいいか分からない', '使える場面が見えない。', '「？」を頭に浮かべて、AIの画面を眺める人。'), ('書くのに時間がかかる', '文章づくりが後回し。', '白紙の画面を前に、時計だけが進む。'), ('情報漏えいが心配', 'ルールがない。', '鍵のアイコンと、不安そうな店主。')], 'A', AI_FAQ, AI_PRICE)

# ========== 料金のFAQ(トップ・サービスで使用) ==========
PRICE_FAQ = [
    ('初期費用はかかりますか？', 'かかりません。LINE・システムの構築にかかる初期費用は0円です。'),
    ('支払い方法を教えてください。', '初回は、1か月分の利用料を銀行振込でお支払いいただきます。2か月目からは、月払い（毎月27日にクレジットカード／デビットカードで引き落とし）か、年払い（12か月分を銀行振込）をお選びいただけます。'),
    ('途中でプランを変えられますか？', 'はい。上位・下位のプランへの変更をご相談ください。変更後の料金は、原則として変更した月の翌月分から適用します。'),
    ('解約はいつでもできますか？', 'はい。最低契約期間はありません。解約したい月の前月末日までにご連絡いただければ、その月の末日で終了します。'),
    ('LINE公式アカウントの利用料は含まれますか？', '含まれません。LINE公式アカウントの利用料は、お客様からLINEヤフー株式会社へ直接お支払いいただきます。'),
]

# ========== 導入事例 ==========
cases_body = page_hero('USE CASE', '導入事例・業種別の使い方', '業種ごとのおすすめの使い方と、導入事例を紹介します。', '導入事例') + main(
    sh('BY INDUSTRY', '業種別、おすすめの使い方', '同じLINEでも、業種によって効く使い方は違います。近い業種を選んでください。') + tabs(USE, 'U')
    + sh('CASE STUDY', '導入事例') + cases_html(3))
PAGES['/cases'] = ('v4/cases.html', '導入事例｜LINE構築・シフト管理 | RAIZON',
                   'RAIZONの導入事例と、業種別のおすすめの使い方。ビル管理会社のシフト提出、理容室のホームページ・LINE・予約など。', cases_body, '/cases')

# ========== 会社概要 ==========
company_body = page_hero('COMPANY', '会社概要', '沖縄の事業者に、デジタル担当者を。', '会社概要') + main(
    fc('MISSION', 'デジタルで変える。<br>働き方も、<br>仕組みも、<br>売り方も。', 'LINE・業務システム・AI。会社の「もっとラクにしたい」を、全体を見ながら仕組みにします。', ph('M-00', '北谷の海辺で、ノートPCで働く人', '北谷町の海辺（観覧車と海が遠くに見える）を背景に、カフェでノートPCを開く人物。明るい昼の光。'))
    + q3([('相談しやすい', '専門用語を使わず、わかる言葉で。', '店主と担当者が、お店のカウンターで笑顔で話している。'), ('小さく始める', '効果の大きいところから、一段ずつ。', '小さな苗が少しずつ大きくなる3コマ。'), ('作って終わりにしない', '使い始めてからが本番。', '歯車と、毎月のカレンダー。')], 'M')
    + '<div class="sh" id="profile"><div class="eyb2">PROFILE</div><h2>会社概要</h2></div>'
    + '''<table class="tbl prof"><tr><th>会社名</th><td>RAIZON（ライゾン）</td></tr><tr><th>本社</th><td>沖縄県中頭郡北谷町</td></tr>
<tr><th>事業内容</th><td>LINE公式アカウントの構築・運用支援／業務システム開発／AI活用支援</td></tr><tr><th>対応エリア</th><td>沖縄県内を中心に全国（オンライン対応）</td></tr>
<tr><th>お問い合わせ</th><td>LINE（24時間受付）／お問い合わせフォーム／TEL 080-6493-7744</td></tr></table>'''
    + '<div id="privacy">' + sh('PRIVACY', 'プライバシーポリシー') + '''<div class="box policy"><p>RAIZON（以下「当方」）は、当サイトでお預かりする個人情報を、以下の方針で適切に取り扱います。</p>
<h3>1. 取得する情報</h3><p>お問い合わせフォームでご入力いただく、お名前、会社名・屋号、メールアドレス、電話番号、ご興味のあるサービス、お問い合わせ内容を取得します。このうち、お名前・メールアドレス・電話番号・お問い合わせ内容は必須項目です。</p>
<h3>2. 利用目的</h3><ul><li>お問い合わせ・ご相談への対応と、ご連絡のため</li><li>ご契約後の、サービス提供と連絡のため</li><li>サービスの改善の検討のため（個人を特定しない形に限ります）</li></ul>
<h3>3. 第三者への提供</h3><p>法令に基づく場合を除き、ご本人の同意なく、取得した個人情報を第三者に提供しません。</p>
<h3>4. 業務の委託と外部サービス</h3><p>当サイトの運営には、次の外部サービスを利用しています。いずれも、当サイトの提供に必要な範囲で利用しています。</p>
<ul><li>ホスティング（サイトの配信）：Vercel Inc.</li><li>メールの送受信：Google「Gmail」。フォームの内容は、当方の受信用メールに送られます</li><li>Webフォントの配信：Google Fonts。ページの表示時に、ブラウザからGoogleのサーバーへ、IPアドレス等が送信されます</li><li>アクセス解析：Google「Google アナリティクス」（ブログのページ）。サイトの利用状況を把握し、改善に役立てるため、Cookie等を通じて閲覧情報（閲覧ページ、閲覧環境、おおよその地域など。個人を特定しない形）を収集します。収集したデータはGoogleに送信されます。ブラウザの設定でCookieを無効にすることで、収集を拒否できます。詳しくは、Googleのポリシーをご確認ください</li><li>画面の操作の分析：Microsoft「Microsoft Clarity」。サイトの使いやすさを改善するため、Cookie等を通じて、ページの閲覧・クリック・スクロールなどの操作の状況を、個人を特定しない形で記録・分析します。収集したデータはMicrosoftに送信されます。ブラウザの設定でCookieを無効にすることで、収集を拒否できます。詳しくは、Microsoftのプライバシーに関する声明をご覧ください</li></ul>
<h3>5. 安全管理</h3><p>お預かりした情報は、不正なアクセス・紛失・漏えいを防ぐよう、適切に管理します。フォームの通信は暗号化（HTTPS）されます。</p>
<h3>6. 保管期間</h3><p>お問い合わせ内容は、対応の完了後、必要な期間のみ保管し、不要になった時点で削除します。</p>
<h3>7. 開示・訂正・削除のご請求</h3><p>ご自身の個人情報の開示・訂正・利用停止・削除をご希望の場合は、<a href="/contact">お問い合わせフォーム</a>からご連絡ください。ご本人であることを確認のうえ、対応します。</p>
<h3>8. 方針の改定</h3><p>この方針は、必要に応じて見直し、改定する場合があります。改定後は、このページに掲載します。</p>
<p class="note">事業者：RAIZON（沖縄県中頭郡北谷町）</p></div></div>''')
PAGES['/company'] = ('v4/company.html', '会社概要｜沖縄・北谷町のデジタル担当者 RAIZON',
                     'RAIZON（ライゾン）の会社概要。沖縄県北谷町を拠点に、LINE公式アカウント構築、業務システム開発、AI活用支援を行っています。', company_body, '/company', [ORG])

# ========== お問い合わせ ==========
contact_body = f'''<section class="main" style="padding-top:110px"><div class="wrap"><div class="ct">
<div class="eyb">CONTACT</div><h2>お問い合わせ</h2>
<p class="ld">無料相談のご予約も、ざっくりしたご質問も歓迎です。2営業日以内にご返信します。</p>
<div class="lnbox"><h3>LINEで相談する</h3><p>友だち追加のあと、トーク画面にご相談内容をひと言送るだけ。かしこまった文面は不要です。</p><a class="btn btn-g" href="{LINE}" target="_blank" rel="noopener">友だち追加して相談する →</a></div>
<div class="dv">LINEを使っていない場合は、下のメールフォームからご連絡ください。</div>
<form id="cform" class="form" novalidate><h3>メールで問い合わせる</h3>
<div class="row"><label>お名前<span class="rq">必須</span><input name="name" maxlength="100" autocomplete="name" placeholder="山田 太郎"></label>
<label>会社名・屋号<input name="company" maxlength="200" autocomplete="organization" placeholder="株式会社〇〇"></label></div>
<div class="row"><label>メールアドレス<span class="rq">必須</span><input name="email" type="email" maxlength="200" autocomplete="email"></label>
<label>電話番号<span class="rq">必須</span><input name="phone" type="tel" maxlength="40" autocomplete="tel"></label></div>
<label>ご興味のあるサービス<select name="services"><option value="">選んでください</option><option>LINE公式アカウント</option><option>業務システム・シフト管理</option><option>AI活用</option><option>まだ分からない</option></select></label>
<label>ご相談内容<span class="rq">必須</span><textarea name="message" maxlength="5000" placeholder="例）予約の電話が多くて困っています"></textarea></label>
<input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
<button class="btn btn-g" type="submit">送信する</button><p id="fmsg" role="status"></p></form>
<p class="note" style="text-align:center">お電話：080-6493-7744（9:00〜22:00）</p>
</div></div></section>'''
PAGES['/contact'] = ('v4/contact.html', 'お問い合わせ｜無料相談 | RAIZON', 'RAIZONへのお問い合わせ。LINE公式アカウント構築、業務システム、AI活用のご相談は無料です。', contact_body, '')



# ========== トップ・サービス(参考サイトの構成) ==========
def secw(inner, id_='', cls=''):
    return f'<section class="sec {cls}"{f" id={id_}" if id_ else ""}><div class="wrap">{inner}</div></section>'

def tile(n, id_, title, brief):
    return f'<div class="tile"><span class="num">{n}</span>{ph(id_, title, brief)}</div>'

SERVICES = [
    ('LINE OFFICIAL ACCOUNT', 'LINE公式アカウント構築', '/line', 'メニュー・予約・クーポン・配信を、LINEひとつにまとめます。お客様はタップするだけ、お店は自動で。',
     ['リッチメニュー', '予約とリマインド', 'クーポン・スタンプ'], '月額5,000円〜（税別）', 'スマホのリッチメニューをタップする指', 'スマホ画面の下半分に6分割のメニュー。「予約」ボタンを指がタップし、波紋が広がる。アイソメトリック（斜め上から見た）風の線画＋緑のアクセント。'),
    ('SYSTEM', '業務システム・シフト管理', '/system', 'シフト提出、予約・顧客管理など、紙・Excel・電話の作業を、スマホでできる仕組みに。',
     ['シフト提出', '予約・顧客管理', '自動化'], '月額23,800円〜（税別）', '書類がスマホの一覧にまとまる', '机の上の紙・付箋・電話が渦を描いてスマホに吸い込まれ、整った一覧表になる。アイソメトリック風。'),
    ('AI', 'AI活用支援', '/ai', '文章の下書き、問い合わせの整理、マニュアル作り。業務がラクになる使い方を、一緒に見つけます。',
     ['文章の下書き', '情報の整理', '使い方のルール'], '1名 5,000円〜', '店主とAIアシスタント', 'カウンターで、店主とやさしい丸いAIキャラクターがハイタッチ。まわりに文章・グラフのアイコン。アイソメトリック風。'),
]

def svc_cards():
    out = '<div class="sv2 sv3">'
    for i, (e, t, u, d, tags, price, tt, br) in enumerate(SERVICES, 1):
        out += (f'<div class="svc">{tile(f"{i:02d}", f"S-{i:02d}", tt, br)}<div class="no">SERVICE {i:02d}</div><h3>{t}</h3><p>{d}</p>'
                f'<div class="pills">{"".join(f"<span>{x}</span>" for x in tags)}</div>'
                f'<div class="pp"><i>料金</i>{price}</div><div class="lk"><a href="{u}">詳しく見る ›</a></div></div>')
    return out + '</div>'

DOES_LINK = ['/line', '/line', '/line', '/system', '/line', '/ai']
DOES = [('リッチメニュー', 'スマホのトーク画面の下に、予約・メニュー・クーポンのボタン。'), ('予約とリマインド', '選ぶだけで予約。前日のお知らせは自動で届く。'),
        ('クーポン・スタンプ', '友だち追加から来店まで、自動で順番に届ける。'), ('シフト提出・管理', 'スタッフはスマホで提出、管理者は一覧で承認。'),
        ('顧客管理・配信', '来店履歴やメモを残し、必要な人にだけ届ける。'), ('AI活用支援', '文章の下書きや情報の整理を、AIでラクに。')]

IND_COL = ['美容・サロン', '飲食店', 'ビル管理・清掃', '整体・治療院']
FLOW4 = [('無料相談（オンライン）', '今のお困りごとや、お店のことを伺います。費用はかかりません。'),
         ('ご提案・お見積もり', '必要なものだけを、画面を見ながらご提案します。その場で決めなくて大丈夫です。'),
         ('お申し込み・構築', '内容と料金、規約をご確認のうえお申し込み。LINE・HP・システムを作ります。'),
         ('運用開始・毎月の改善', '使い始めてからも、配信の改善・更新・機能の追加まで、毎月一緒に育てます。')]

FAQ_TABS = [('料金・契約', PRICE_FAQ), ('サービス', LINE_FAQ[:2] + SYS_FAQ[:1] + AI_FAQ[:1]),
            ('はじめての方', [('デジタルに詳しくなくても大丈夫ですか？', 'もちろん大丈夫です。「何をしたらいいかわからない」という段階からご相談ください。画面を見ながら、わかる言葉でご説明します。'),
                              ('LINEだけでも相談できますか？', 'はい。LINE公式アカウントだけのご相談もできます（LINE BASIC 月額5,000円・税別〜）。'),
                              ('相談したら、契約しないといけませんか？', 'いいえ。まずは今のお悩みをお聞かせください。必要なものがなければ、無理におすすめすることはありません。')])]
ALL_FAQ = [x for _, g in FAQ_TABS for x in g]


def faq_tabs():
    t = '<div class="ftabs">' + ''.join(f'<button type="button"{" class=on" if i == 0 else ""}>{n}</button>' for i, (n, _) in enumerate(FAQ_TABS)) + '</div>'
    b = ''.join(f'<div class="fbox{" on" if i == 0 else ""}">' + ''.join(f'<details><summary>{q}</summary><p>{a}</p></details>' for q, a in g) + '</div>' for i, (_, g) in enumerate(FAQ_TABS))
    return f'<div data-ftabs>{t}{b}</div>'


def column3():
    try:
        posts = json.loads((ROOT / 'api/_posts-static.json').read_text(encoding='utf-8'))
    except Exception:
        return ''
    posts = sorted(posts, key=lambda p: p.get('createdAt', ''), reverse=True)[:3]
    def ex(b):
        m = re.search(r'<p[^>]*>([\s\S]*?)</p>', b or '')
        t = re.sub(r'<[^>]+>', '', m.group(1) if m else (b or '')).strip()
        return re.sub(r'\s+', ' ', t)[:110]
    return '<div class="col3">' + ''.join(
        f'<a class="cl" href="/blog/{p["id"]}"><div class="mt"><time>{p.get("createdAt", "")[:10].replace("-", ".")}</time><span class="gt">{p.get("category", "")}</span></div><h3>{p["title"]}</h3><p>{ex(p.get("body"))}</p><span class="rm">READ MORE ›</span></a>'
        for p in posts) + '</div>'


def contact_form(small=False):
    return f'''<form id="cform" class="form{' s' if small else ''}" novalidate>
<div class="row"><label>お名前<span class="rq">必須</span><input name="name" maxlength="100" autocomplete="name" placeholder="山田 太郎"></label>
<label>会社名・屋号<span class="rq">必須</span><input name="company" maxlength="200" autocomplete="organization" placeholder="株式会社〇〇"></label></div>
<div class="row"><label>メールアドレス<span class="rq">必須</span><input name="email" type="email" maxlength="200" autocomplete="email" placeholder="you@example.com"></label>
<label>電話番号<span class="rq">必須</span><input name="phone" type="tel" maxlength="40" autocomplete="tel"></label></div>
<label>ご相談内容<span class="rq">必須</span><select name="services"><option value="">選んでください</option><option>無料WEB相談の予約</option><option>LINE公式アカウント</option><option>業務システム・シフト管理</option><option>AI活用</option><option>まだ分からない</option></select></label>
<label>お問い合わせ内容<span class="rq">必須</span><textarea name="message" maxlength="5000" placeholder="今のお困りごとや、相談したいことをご記入ください。"></textarea></label>
<input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
<p class="note" style="text-align:center;margin:0 0 16px">通常1営業日以内にご返信します。</p>
<button class="btn btn-g" type="submit">送信する →</button><p id="fmsg" role="status"></p></form>'''


top = f'''<section class="hero"><div class="hero-in">
<div class="hero-t"><div class="eyb">LINE × HOMEPAGE × DX / RAIZON</div>
<h1><span class="gr">集客も、予約も、</span><br>面倒な業務も。<br><span class="mk">まずはLINEから。</span></h1>
<p class="sub">沖縄の事業者の、デジタル担当者です。<br>LINEを入口に、業務システム・AI活用まで。</p></div>
<div class="hero-v">{ph('T-00', 'LINEの画面（スマホ3台）', '大きなスマホ1台＋左右に小さなスマホ2台が並ぶ。画面はお店のLINEのトーク／リッチメニュー／予約確定。やわらかい影、背景は薄いグレー。', 'hero-v')}<div class="cap">LINE画面は活用イメージです。</div></div>
<div class="hero-b"><div class="bs"><a href="/consult" class="btn btn-lg btn-dg">無料WEB相談をする →</a><a href="{LINE}" target="_blank" rel="noopener" class="btn btn-lg btn-w">LINEで相談する →</a></div></div>
</div></section>
<div class="pg">
''' + secw(fc('DEMO', 'シフト管理アプリを、<br>実際に触ってみる。',
               'スタッフはスマホでシフトを提出し、管理者はパソコンで一覧・申請を確認。お店のシフト作成の手間を減らす、業務システムのデモです。登録は不要で、その場で試せます。',
               '<div class="art"><img src="/assets-v5/illust/shift-demo.webp" width="1500" height="875" alt="シフト管理アプリのデモ画面（パソコンの管理画面とスマホの提出画面）" loading="lazy" decoding="async"></div>',
               ('/demo/shift/', 'シフト管理のデモを触ってみる', 'btn'), ['ブラウザで動く', '登録不要', 'データは端末内のみ'])
           + '<p class="caption">デモはサンプルデータです。入力した内容は、お使いのブラウザの中だけに保存され、他の人には見えません。名前はすべて架空です。</p>', 'shiftdemo') \
    + secw(sh('SERVICE', 'サービス', 'LINEを入口に、業務システム・AI活用まで。ひとつの窓口で、単体のご依頼も可能です。') + svc_cards() + '<div class="lk"><a href="/service">サービスの詳細を見る ›</a><a href="/cases">業種別の使い方を見る ›</a></div>', 'service') \
    + secw(sh('WHAT WE DO', 'RAIZONができること', '設計・構築から、日々の改善まで。お店の「面倒」を、仕組みにします。')
           + '<div class="scw"><div class="scn"><button type="button" aria-label="前へ" data-d="-1">‹</button><button type="button" aria-label="次へ" data-d="1">›</button></div><div class="sc">'
           + ''.join(f'<a class="it" href="{DOES_LINK[i - 1]}">{ph(f"D-{i:02d}", t, d + " 画面のスクリーンショット風の絵。", "sm")}<b>{t}</b><div class="mr">詳しく見る</div></a>' for i, (t, d) in enumerate(DOES, 1))
           + '</div></div><p class="caption">画像は制作例・デモ画面のイメージです。対応範囲は、ご契約のプランにより異なります。</p>') \
    + secw('<div class="card2 ft2c"><div>' + ph('T-10', 'スマホを持つ店主（LINE画面つき）', 'スマホ2台が重なり、画面にお店のLINEのトークとメニュー。やわらかい影。') + '</div><div><div class="eyb">FEATURE</div><h3>RAIZONに任せると、<br>何が変わるか。</h3><p class="ds2">LINE・システム・AIを、ひとつの窓口で。作った人がそのまま毎月回すから、設計の意図が薄まらないまま改善が積み上がります。</p><ul class="ck"><li><b>ひとつの窓口で一括</b><br>LINE・システム・AIまで、引き継ぎロスがありません</li><li><b>初期費用0円・最低契約期間なし</b><br>必要なところから、一段ずつ</li><li><b>作って終わりにしない</b><br>使い始めてからも、毎月の改善まで一緒に</li></ul></div></div>') \
    + secw('<div class="indw"><div class="indhint" aria-hidden="true"><span>横にスクロールできます</span><i></i></div><div class="indimg" data-ind><img src="/assets-v5/illust/ind.webp" alt="業種ごとのLINE公式アカウント画面（オンラインスクール・美容サロン・住宅不動産・採用）" loading="lazy"></div><div class="indb"><div><h3>あなたの業種では、<em>どう使える</em>のか。</h3><p>業種ごとに、おすすめの使い方と実際のLINE画面をご覧いただけます。</p></div><a class="btn btn-or" href="/cases">業種別の使い方を見る →</a></div></div>') \
    + secw(sh('FLOW', '相談から、<br>運用開始まで。', '初回相談はオンラインで。') + '<div class="fl4">' + ''.join(f'<div><div class="st">STEP {i:02d}</div><h3>{t}</h3><p>{d}</p></div>' for i, (t, d) in enumerate(FLOW4, 1)) + f'</div><div class="cc"><a class="btn btn-dg btn-lg" href="/consult">無料相談する（オンライン） →</a></div>', 'flow') \
    + secw(sh('COLUMN', 'コラム記事', 'LINE・業務のデジタル化について、実務ベースで発信しています。') + column3() + '<a class="btn btn-ol" href="/blog-list">コラム一覧を見る →</a>') \
    + secw(f'<div class="fq-t">ご質問・ご相談、<br>いつでも。</div><p class="ld" style="font-size:14px;color:var(--body);margin-top:10px">料金・契約・サービスについて、よくいただくご質問をまとめました。</p>' + faq_tabs(), 'faq') \
    + secw('<div class="ct2"><div><div class="eyb2" style="font-size:12.5px;font-weight:800;letter-spacing:.16em;color:var(--gd)">CONTACT</div><h2>まずは<br>現状を聞かせてください。</h2><p class="ld">無料相談のご予約も、ざっくりしたご質問も、このフォームからどうぞ。通常1営業日以内にご返信します。</p>' + ph('T-20', 'メールが届くイラスト', '封筒から書類が出ている、アイソメトリック風の小さな絵。') + f'<div class="lnb"><a class="btn btn-g" href="{LINE}" target="_blank" rel="noopener">LINEで相談する →</a></div><div class="dv">LINEを使っていない場合は、メールフォームからどうぞ。</div></div><div>' + contact_form(True) + '</div></div>', 'contact') \
    + '</div>'
PAGES['/'] = ('index.html', '沖縄のLINE公式アカウント構築｜月額5,000円〜 RAIZON',
              'RAIZONは沖縄の事業者向けデジタル担当者。LINEを入口に、業務システム・AI活用まで。初期費用0円・月額5,000円（税別）〜。', top, '', [ORG, faq_ld(ALL_FAQ)])

# ---- サービス一覧ページ(参考サイトのサービスページと同じ作り) ----
def sv_feat(i, e, t, u, d, tags, price, tt, br):
    vis = f'<div class="tile">{"<span class=num>%02d</span>" % i}{ph(f"S-{i:02d}", tt, br)}</div>'
    txt = (f'<div><div class="eyb">{e}</div><h3>{t}</h3><p>{d}</p><div class="pills">{"".join(f"<span>{x}</span>" for x in tags)}</div>'
           f'<div class="pp"><i>料金</i>{price}</div><div class="lk" style="margin-top:22px"><a class="btn btn-dg btn-lg" style="border:0;padding:0 36px;height:60px;font-size:16px" href="{u}">{t}を見る →</a></div></div>')
    return f'<div class="card2 fc{" rev" if i % 2 == 0 else ""}"><div class="fc-v">{vis}</div>{txt}</div>' if i % 2 == 1 else f'<div class="card2 fc rev"><div class="fc-v">{vis}</div>{txt}</div>'

service_body = page_hero('SERVICE', 'サービス', '', 'サービス') + main(
    about('About', 'RAIZONのサービスについて', 'RAIZONは、LINEを軸にしたデジタル担当者です。予約も、問い合わせも、毎日の業務も、ひとつの仕組みにまとめます。', '作って終わりにせず、毎月の改善まで伴走します。')
    + ''.join(sv_feat(i, *x) for i, x in enumerate(SERVICES, 1))
    + '<div id="price">' + sh('PRICE', '料金プラン', '初期費用0円・最低契約期間なし。必要なところから、一段ずつ。') + plans_html() + '</div>'
    + '<div class="bn"><h3>どのサービスが合うか迷ったら</h3><p>無料相談（オンライン）で、現状のお困りごとからお気軽にご相談ください。</p><div class="bs"><a class="btn btn-or" href="/consult">無料相談に申し込む →</a><a class="btn btn-bk" href="/contact">お問い合わせ →</a></div></div>')
PAGES['/service'] = ('v4/service.html', 'サービス｜LINE構築・業務システム・AI活用 | RAIZON',
                     'RAIZONのサービス一覧。LINE公式アカウント構築、業務システム・シフト管理、AI活用支援。初期費用0円・月額5,000円（税別）〜。', service_body, '/service')


# ========== /line を、参考(LAYRのサービス詳細)の構成に ==========
def lsec(no, en, h2, inner, cls=''):
    return f'<section class="sec {cls}"><div class="wrap"><div class="sh"><div class="eyb2">{no} / {en}</div><h2>{h2}</h2></div>{inner}</div></section>'

LN_STATS = [('0', '円', '初期費用'), ('5,000', '円〜', '月額（税別）'), ('0', 'か月', '最低契約期間'), ('0', '円', 'ご相談料')]
LN_PROB = [('予約の電話に出られない', '施術中・調理中は手が離せず、出られなかった予約は他のお店へ流れてしまいます。'),
           ('問い合わせがバラバラに届く', '電話・SNS・メール・LINE。確認するだけで時間がかかり、返信も遅れがちです。'),
           ('友だちが増えても、来店につながらない', '友だち追加のあとに、次の来店のきっかけを届けられていません。')]
LN_SOL = [('予約が、自動で入る', 'お客様はタップで予約。確定と前日のお知らせは自動です。', 'LN-1', 'LINEから予約が入り、確認の通知が届くお店'),
          ('必要な人に、必要な連絡を', '新規・常連・誕生月など、お客様ごとに届け方を変えられます。', 'LN-2', ''),
          ('開設から改善まで、おまかせ', '作って終わりにせず、毎月一緒に育てます。ひとつの窓口で完結します。', 'LN-3', '')]
LN_SUP = [('リッチメニュー', 'トーク画面の下に、予約・メニュー・クーポンのボタンを常に表示。タブ切り替えで、たくさんの案内も整理できます。', 'LS-1'),
          ('予約とリマインド', 'メニュー・担当・日時を選ぶだけ。確定のお知らせと、前日のリマインドは自動で届きます。', 'LS-2'),
          ('クーポン・スタンプ', '友だち追加の初回クーポンから、来店後のスタンプまで。お客様の流れに合わせて届けます。', 'LS-3'),
          ('配信・ステップ配信', '全員へのお知らせから、友だち追加後の自動配信まで。内容と頻度の設計もご相談ください。', 'LS-4'),
          ('顧客管理・タグ', '来店履歴やメモを残し、タグでお客様を分類。必要な人にだけ届けられます。', 'LS-5'),
          ('毎月の改善', '配信の反応を見ながら、メニューや文面を見直します。使い始めてからが本番です。', 'LS-6')]
LN_APR = [('開設・初期設定', 'アカウントの開設から、あいさつ・リッチメニュー・自動応答まで。', ['お客様名義で開設', 'デザイン', '自動応答']),
          ('予約・配信の設計', '予約の流れ、クーポン、ステップ配信を、お店に合わせて設計します。', ['予約・リマインド', 'クーポン', 'ステップ配信']),
          ('運用・毎月の改善', '配信の改善、更新、機能の追加まで、毎月一緒に育てます。', ['配信の改善', '更新・追加', '相談し放題'])]
LN_FAQ_TABS = [('料金・契約', PRICE_FAQ), ('構築・運用', LINE_FAQ + [('配信の文章は、作ってもらえますか？', 'はい。配信の内容や頻度の設計から、文章の作成までご相談いただけます。')])]


# ========== /line /web /system /ai(作り込み版) ==========
def lpage(path, fname, title, desc, eyebrow, crumb, h1a, h1b, sub, key, imgs, stats, prob, sol, sup, apr, price, faqtabs):
    for k, f in imgs.items():
        ART[f'{key}-{k}'] = f
    ART[f'{key}-FQ'] = 'faq'
    hero = (f'<section class="lhero"><div class="lhero-in"><div><div class="crumb"><a href="/">トップ</a><i>／</i><a href="/service">サービス</a><i>／</i>{crumb}</div>'
            f'<div class="eyb" style="margin-top:22px">{eyebrow}</div><h1 class="lnh1">{h1a}<br><span class="mk">{h1b}</span></h1><p class="ds">{sub}</p>'
            f'<div class="bs lnh-bs"><a class="btn btn-or btn-lg" href="/consult">無料WEB相談をする →</a><a class="btn btn-w btn-lg" href="{LINE}" target="_blank" rel="noopener">LINEで相談する →</a></div>'
            f'<div class="badges"><span>初期費用0円</span><span>縛りなし</span><span>相談無料</span></div></div>'
            f'<div class="lhero-v">{ph(f"{key}-H", crumb + "のイメージ", crumb, "")}</div></div></section>')
    stats_h = '<div class="stats">' + ''.join(f'<div class="st"><img class="ic" src="/assets-v4/icons-line/{ic}.svg" alt="" width="44" height="44"><span class="lb">{l}</span><b>{n}<small>{u}</small></b></div>' for (n, u, l), ic in zip(stats, ['coins', 'cal', 'shield', 'chat'])) + '</div>'
    prob_h = '<div class="pb3">' + ''.join(f'<div class="pbc"><img class="ic" src="/assets-v4/icons-line/{ic}.svg" alt="" width="52" height="52"><h3>{t}</h3><p>{d}</p></div>' for (t, d), ic in zip(prob, ['clock', 'chat', 'note'])) + '</div><p class="mid">こういったお悩みを、まるごと解決します。</p>'
    # 緑の帯: こんな方に、RAIZONが応えます(4カード)
    need_h = ('<section class="gband"><div class="wrap"><div class="gh"><small>NEEDS</small><h2>こんなご要望に、<br><span class="mk">RAIZONが応えます。</span></h2><p>ご要望に合わせて、必要なものだけをご提案します。</p></div><div class="nd4">'
              + ''.join(f'<div class="ndc"><b>{t}</b><p>{d}</p><div class="pills"><span>初期費用0円</span><span>縛りなし</span></div></div>' for t, d in sup[:4]) + '</div></div></section>')
    # 3つのポイント(大きな絵と番号)
    pts = ''.join(f'<div class="pt{" rev" if i % 2 == 0 else ""}"><div class="pt-v"><span class="pt-n">0{i}</span>{ph(f"{key}-S{i}", t, t, "wide")}</div><div class="pt-t"><small>POINT 0{i}</small><h3>{t}</h3><p>{d}</p></div></div>' for i, (t, d) in enumerate(sol, 1))
    pt_h = '<div class="pts">' + pts + '</div>'
    sup_h = '<div class="sup6">' + ''.join(f'<div class="sup">{ph(f"{key}-U{i}", t, t, "wide")}<details><summary><b>{t}</b><span>詳しく見る</span></summary><p>{d}</p></details></div>' for i, (t, d) in enumerate(sup, 1)) + '</div><p class="caption">画像は活用イメージです。内容はご契約のプランにより異なります。</p>'
    # 緑の帯: 5つのステップ
    st5 = [('無料相談', '今の状況を伺います。'), ('ご提案・お見積もり', '必要なものだけをご提案します。'), ('お申し込み', '内容と規約をご確認のうえ、お申し込み。'), ('構築・制作', '途中で画面を確認していただけます。'), ('運用開始・改善', '使い始めてからも、毎月一緒に育てます。')]
    step_h = ('<section class="gband"><div class="wrap"><div class="gh"><small>FLOW</small><h2>ご相談から、運用まで。<br><span class="mk">5つのステップ。</span></h2></div><div class="stp5">'
              + ''.join(f'<div class="stc"><span class="sn">0{i}</span><b>{t}</b><p>{d}</p></div>' for i, (t, d) in enumerate(st5, 1)) + '</div></div></section>')
    faq_h = ('<div class="faqw"><div class="faqw-v">' + ph(f"{key}-FQ", "ご質問", "ご質問", "") + '</div><div><div data-ftabs><div class="ftabs">'
             + ''.join(f'<button type="button"{" class=on" if i == 0 else ""}>{n}</button>' for i, (n, _) in enumerate(faqtabs)) + '</div>'
             + ''.join(f'<div class="fbox{" on" if i == 0 else ""}">' + ''.join(f'<details><summary>{q}</summary><p>{a}</p></details>' for q, a in g) + '</div>' for i, (_, g) in enumerate(faqtabs)) + '</div></div></div>')
    form_h = '<div class="ct2s"><div><div class="eyb2" style="font-size:12.5px;font-weight:800;letter-spacing:.16em;color:var(--gd)">CONTACT</div><h2>無料相談の<br>お申し込み</h2><p class="ld">お店の状況を、ひとこと教えてください。通常1営業日以内にご返信します。</p></div><div>' + contact_form(True) + '</div></div>'
    body = hero + '<div class="pg">' \
      + lsec('01', 'DATA', '数字で見る、RAIZONの' + crumb, stats_h) \
      + lsec('02', 'PROBLEM', 'こんな状態になっていませんか？', prob_h) \
      + need_h \
      + lsec('03', 'POINT', 'RAIZONが大切にする<br>3つのポイント', pt_h) \
      + lsec('04', 'SUPPORT', '構築から運用まで、RAIZONに。', sup_h) \
      + lsec('05', 'APPROACH', '3つの進め方で解決します', '<div class="apr3">' + ''.join(f'<div class="apc"><span class="n">{i:02d}</span><h3>{t}</h3><p>{d}</p><div class="pills">' + ''.join(f'<span>{x}</span>' for x in tg) + '</div></div>' for i, (t, d, tg) in enumerate(apr, 1)) + '</div>') \
      + lsec('06', 'PLAN', '料金', price) \
      + step_h \
      + lsec('07', 'FAQ', 'ご質問・ご相談、いつでも。', faq_h) \
      + '<section class="sec" id="contact"><div class="wrap">' + form_h.replace('<h2>無料相談の<br>お申し込み</h2>', '<h2>まずは<br>現状を聞かせてください。</h2>') + '</div></section></div>'
    PAGES[path] = (fname, title, desc, body, path, [faq_ld([x for _, g in faqtabs for x in g])])


def _apr(a, b, c):
    return [(a[0], a[1], a[2]), (b[0], b[1], b[2]), (c[0], c[1], c[2])]

lpage('/system', 'system.html', '業務システム・シフト管理アプリの制作｜沖縄の中小企業向け | RAIZON',
      '沖縄の中小企業・店舗向けに、シフト提出・予約管理・顧客管理などの業務システムを制作します。月額23,800円（税別）〜。',
      'SYSTEM', '業務システム', '紙・Excel・電話を、', 'スマホでできる仕組みに。', 'シフト提出、予約・顧客管理など、毎日の「面倒な作業」を、お店や会社のやり方に合わせて仕組みにします。', 'SY',
      {'H': 's03', 'S1': 'u3-1', 'S2': 'u3-2', 'S3': 'u3-3', 'U1': 'd-04', 'U2': 'u3-2', 'U3': 'u4-1', 'U4': 'd-05', 'U5': 's03', 'U6': 'm03'},
      [('0', '円', '初期費用'), ('23,800', '円〜', '月額（税別）'), ('なし', '', '最低契約期間'), ('無料', '', 'ご相談')],
      [('シフトの集計が大変', '希望が紙・口頭・LINEでバラバラに届き、まとめるだけで一苦労です。'), ('予約と顧客が分かれている', '電話とノート、Excel。お客様の履歴を探すのに時間がかかります。'), ('同じ入力をくり返している', '転記や集計を、毎日・毎月、手作業でくり返しています。')],
      [('スマホで提出、一覧で承認', 'スタッフはスマホで提出、管理者は一覧で確認・承認できます。'), ('情報が一か所に', '予約・顧客・シフトの情報が、ひとつにまとまります。'), ('作業が自動で進む', '転記や集計、定型の連絡を、できるところから自動に。')],
      [('シフト提出・管理', 'スマホから提出、欠勤の申請。提出時に管理者へ通知。'), ('承認・一覧', '提出状況を一覧で確認し、まとめて承認します。'), ('通知', '提出・申請があると、すぐ気づけます。'), ('予約・顧客管理', '来店履歴やメモを残し、タグで分類できます。'), ('自動化', '定型の連絡や、集計・帳票の作成を自動で。'), ('毎月の改善', '使い勝手を見ながら、機能を育てていきます。')],
      [('業務を聞く', '毎日・毎月の作業を、一緒に書き出します。', ['作業の洗い出し', '優先順位']), ('作る・試す', '必要なところから作り、実際の業務で試します。', ['小さく始める', '画面の確認']), ('定着・改善', '使い方の説明と、毎月の改善をお手伝いします。', ['スタッフ説明', '機能の追加'])],
      plans_html(), [('料金・契約', PRICE_FAQ), ('システムについて', SYS_FAQ)])

lpage('/ai', 'v4/ai.html', 'AI活用支援｜文章作成・業務の整理を、沖縄の中小企業に | RAIZON',
      '沖縄の中小企業・店舗向けのAI活用支援。お知らせ文の下書き、問い合わせの整理、マニュアル作りなど、業務がラクになる使い方を一緒に見つけます。',
      'AI', 'AI活用支援', 'AIを使うことが目的じゃない。', '業務がラクになることが目的。', '文章の下書き、情報の整理、マニュアル作り。「ここなら使える」という場面から、一緒に始めます。', 'AX',
      {'H': 's04', 'S1': 'm01', 'S2': 'm02', 'S3': 'm03', 'U1': 'd-06', 'U2': 'u1-1', 'U3': 'm02', 'U4': 'ln-cust', 'U5': 'm01', 'U6': 'm03'},
      [('5,000', '円〜', '1名あたり'), ('なし', '', '最低契約期間'), ('無料', '', 'ご相談'), ('ルール', 'づくり', 'も一緒に')],
      [('何に使えばいいか分からない', 'AIが役に立つ場面が、見えていません。'), ('書くのに時間がかかる', 'お知らせやSNSの文章づくりが、後回しになっています。'), ('情報の扱いが心配', '入れてよい情報の、ルールがありません。')],
      [('使える場面が見つかる', '今の業務をお聞きして、AIが役に立つ場面を探します。'), ('文章づくりが速くなる', 'お知らせやSNSの下書きを、短い時間で。'), ('安心して使える', '入力してよい情報や、確認の方法を決めます。')],
      [('文章の下書き', 'お知らせ・SNS・返信の下書きを、AIでさっと。'), ('情報の整理', '問い合わせやメモを整理して、見える化します。'), ('マニュアル・FAQ', '手順書やよくある質問を、整えます。'), ('アイデア出し', 'メニュー名やイベントの企画の候補出しに。'), ('使い方のルール', '入れてよい情報・確認の方法を決めます。'), ('定着サポート', 'スタッフの皆さまへの説明も、お手伝いします。')],
      [('業務を聞く', '毎日の作業を、一緒に書き出します。', ['作業の洗い出し']), ('試す・ルール', '効果が大きく、リスクが小さい場面から試します。', ['小さく試す', 'ルールづくり']), ('定着させる', '使い方の説明と、確認の方法をお伝えします。', ['スタッフ説明', '確認ポイント'])],
      AI_PRICE, [('料金・契約', [('料金はいくらですか？', '1名あたり5,000円〜です（月額ではありません）。内容や進め方は、無料相談でご説明します。')] + PRICE_FAQ[2:4]), ('AIについて', AI_FAQ)])


lpage('/line', 'line.html', '沖縄のLINE公式アカウント構築｜月額5,000円〜・初期費用0円 | RAIZON',
      '沖縄の事業者向けLINE公式アカウント構築・運用。リッチメニュー、予約受付とリマインド、クーポン・スタンプ、配信まで。初期費用0円・月額5,000円（税別）〜。',
      'LINE OFFICIAL ACCOUNT', 'LINE公式アカウント構築', 'LINEを活用し、', '集客と予約を、ラクに。', 'メニュー・予約・クーポン・配信を、LINEひとつに。沖縄の事業者向けに、開設から毎月の改善まで、ひとつの窓口でお手伝いします。', 'LN',
      {'H': 'ln-hero', 'S1': 'ln-s1', 'S2': 'ln-s2', 'S3': 'ln-s3', 'U1': 's01', 'U2': 'u1-2', 'U3': 'u1-3', 'U4': 'u4-3', 'U5': 'ln-cust', 'U6': 'm03'},
      LN_STATS, LN_PROB, [(t, d) for t, d, _i, _b in LN_SOL], [(t, d) for t, d, _i in LN_SUP], LN_APR, plans_html(), LN_FAQ_TABS)

# ========== 無料WEB相談 ==========
CONSULT_FAQ = [
    ('準備するものはありますか？', '特にありません。あれば、お店のInstagramやホームページのURL、今困っていること（予約の電話が多い、など）を教えてください（任意）。'),
    ('パソコンがなくても参加できますか？', 'スマホだけで参加できます。予約のあとに届くメールのリンクを押すだけです（Google Meetのアプリが必要な場合があります）。'),
    ('LINE公式アカウントを、まだ持っていなくても相談できますか？', 'はい。アカウントの作り方から、ご一緒します。'),
    ('費用はいくらかかりますか？', '相談は無料です。導入する場合は、月額5,000円（税別）〜で、初期費用は0円、最低契約期間もありません。LINE公式アカウントの利用料（LINE社）は別途かかります。'),
]
consult_body = page_hero('CONSULT', '無料WEB相談', 'お店のLINEを、画面を見ながら。Google Meetで行います。', '無料WEB相談') + main(
    fc('WEB CONSULT', 'お店のLINE、<br>画面を見ながら一緒に。', '「うちの店だと、どう使えるの？」を、実際の画面をお見せしながら、一緒に考えます。', ph('K-00', 'ビデオ通話で相談する店主と担当者', 'ノートPCのビデオ通話で、店主とRAIZONの担当者が笑顔で話している。横にスマホのLINE画面。'), None, ['無料', 'オンライン', 'スマホでOK'])
    + sh('FLOW', '当日は、こんな流れです')
    + q3([('お店の今を聞く', '業種・困りごと・今のLINEの使い方。', '店主が身ぶりを交えて、お店の様子を話している。'),
          ('画面を見て提案', 'メニュー・予約・クーポンを、実際の画面で。', '画面共有で、LINEのリッチメニューを一緒に見ている。'),
          ('費用と進め方', '月額5,000円〜（税別）、初期費用0円。', '料金カードを3枚並べて説明している。')], 'K')
    + f'''<div class="card2 about"><div><div class="big" style="font-size:44px">BOOKING</div><div class="sm">日時を選んで、予約する</div></div><div><p>日時を選んで予約すると、確定のご連絡とGoogle Meetのリンクが、LINEで届きます。<b>平日 18:30以降／土日 21:00まで</b>の中から選べます。</p><p style="margin-top:22px"><a class="btn btn-g btn-lg" href="{DEMO}" target="_blank" rel="noopener">LINEで、日程を相談する →</a></p><p class="note">※予約の受付ページを準備中です。それまでは、LINEでご希望の日時をお送りください（24時間受付）。</p></div></div>'''
    + sh('FAQ', 'よくあるご不安') + faq_html(CONSULT_FAQ))
PAGES['/consult'] = ('consult.html', '無料WEB相談｜お店のLINEを、画面を見ながら | RAIZON',
                     'Google Meetで行う、無料WEB相談。お店のLINEを、画面を見ながら一緒に考えます。', consult_body, '', [faq_ld(CONSULT_FAQ)])

for path, (fname, title, desc, body, active, *rest) in PAGES.items():
    p = ROOT / fname
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(layout(path, title, desc, body, active, rest[0] if rest else None), encoding='utf-8')
    print('wrote', fname)

doc = ROOT.parent / 'AI経営.RAIZON' / 'growth' / 'site-v5' / 'illustrations.md'
doc.parent.mkdir(parents=True, exist_ok=True)
seen = set(); lines = []
for i, t, d, c, dn in ILLS:
    if i in seen: continue
    seen.add(i); lines.append(f'| {i} | {"✅ " if dn else ""}{t} | {c} | {"（Canvaで作成済み・差し込み済み）" if dn else d} |')
doc.write_text('# サイトv5 イラスト一覧(差し込み枠)\n\n'
               'テイスト: フラットで明るい線と面のイラスト。色はLINEグリーン(#06C755)・チャコール(#26292D)・白を基本に、差し色は少なめ。人物はやさしい表情。文字・数字・実在のロゴは入れない。背景透過のPNG/WebP。\n'
               '比率: sq=1:1(1200×1200) / wide=16:9(1600×900) / hero-v=5:4(1500×1200) / tall=3:4(1200×1600) / sm=4:3(800×600)\n\n'
               '| ID | 内容 | 比率 | 描くもの(指示) |\n|---|---|---|---|\n' + '\n'.join(lines) + '\n', encoding='utf-8')
print('illustrations:', len(lines))

# ブログ(API が HTML を作るページ)用の共通ヘッダー・フッターを書き出す
_full = layout('/blog-list', 'x', 'x', '@@BODY@@', '/blog-list')
_hd = _full.split('<body>\n', 1)[1].split('<main>\n', 1)[0]
_ft = _full.split('</main>\n', 1)[1].split('</body>', 1)[0]
(ROOT / 'api' / '_v5-shell.json').write_text(json.dumps({'header': _hd, 'footer': _ft}, ensure_ascii=False), encoding='utf-8')
print('wrote api/_v5-shell.json')
