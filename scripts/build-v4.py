# RAIZON サイト v4(複数ページ構成)を書き出す
# 使い方: /opt/homebrew/bin/python3 scripts/build-v4.py (Python 3.12以上)  → index.html と v4/*.html を作る(文章はこのファイルで直す)
# イラストは .ill の枠(差し込み用)。一覧は growth/site-v4/illustrations.md に出力する
import json, re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT
LINE = 'https://line.me/R/ti/p/%40154yajce'
DEMO = 'https://line.me/R/ti/p/%40400mmccb'
ILLS = []

NAV = [('/line', 'LINE構築'), ('/web', 'ホームページ'), ('/system', '業務システム'), ('/ai', 'AI活用'),
       ('/price', '料金'), ('/cases', '導入事例'), ('/flow', 'ご利用の流れ'), ('/company', '会社概要')]

CLARITY = '''<script>window.addEventListener('load',function(){setTimeout(function(){(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","vitwsmjicc");},2000);});</script>'''
INTER = 'https://fonts.googleapis.com/css2?family=Inter:wght@500;700;800;900&display=swap'


def ill(id_, title, desc, cls=''):
    ILLS.append((id_, title, desc))
    return f'<div class="ill {cls}" role="img" aria-label="{title}"><span class="tag">ILLUSTRATION {id_}</span><b>{title}</b><small>{desc}</small></div>'


def icon(name):
    return f'/assets-v4/icons/{name}.webp'


def layout(path, title, desc, body, active='', ld=None, robots='noindex, nofollow'):
    nav = ''.join(f'<a href="{h}"{" class=\"on\"" if h == active else ""}>{t}</a>' for h, t in NAV)
    spnav = ''.join(f'<a href="{h}">{t}</a>' for h, t in NAV)
    lds = ''.join(f'<script type="application/ld+json">{json.dumps(x, ensure_ascii=False)}</script>' for x in (ld or []))
    url = 'https://raizon-okinawa.com' + ('' if path == '/' else path)
    return f'''<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title}</title>
<meta name="description" content="{desc}">
<meta name="robots" content="{robots}">
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
<link rel="stylesheet" href="/assets-v4/v4.css?v=1">
{lds}
{CLARITY}
</head>
<body>
<header class="hd">
  <div class="hd-in">
    <a href="/" class="hd-logo"><img src="/assets-v3/raizon-logo-240.webp" alt="RAIZON" width="240" height="170"></a>
    <nav class="hd-nav" aria-label="メインメニュー">{nav}</nav>
    <div class="hd-cta"><a href="/contact" class="btn btn-o btn-sm">お問い合わせ</a><a href="{LINE}" target="_blank" rel="noopener" class="btn btn-g btn-sm">LINEで無料相談</a></div>
    <button class="hd-tg" aria-label="メニューを開く" aria-expanded="false"><span></span><span></span><span></span></button>
  </div>
</header>
<nav class="sp-nav" aria-label="スマホ用メニュー">{spnav}<a href="/faq">よくある質問</a><a href="/blog-list">ブログ</a><a href="/contact">お問い合わせ</a><a href="{LINE}" target="_blank" rel="noopener" class="btn btn-g">LINEで無料相談</a></nav>
<main>
{body}
</main>
<footer class="ft">
  <div class="wrap">
    <div class="ft-in">
      <div>
        <a href="/" class="ft-logo"><img src="/assets-v3/raizon-logo-240.webp" alt="RAIZON" width="240" height="170" loading="lazy"></a>
        <p style="margin-top:18px;color:#fff;font-weight:800;">沖縄の事業者に、デジタル担当者を。</p>
        <p>LINEを入口に、ホームページ・業務システム・AI活用まで。<br>会社の「もっとラクにしたい」を、一緒に仕組みにします。</p>
        <p>本社：沖縄県中頭郡北谷町字砂辺301-7<br>支店：大阪府東大阪市</p>
      </div>
      <div class="ft-cols">
        <div><b>SERVICE</b><a href="/line">LINE公式アカウント構築</a><a href="/web">ホームページ制作</a><a href="/system">業務システム・シフト管理</a><a href="/ai">AI活用支援</a></div>
        <div><b>INFO</b><a href="/price">料金プラン</a><a href="/cases">導入事例</a><a href="/flow">ご利用の流れ</a><a href="/faq">よくある質問</a><a href="/blog-list">ブログ</a></div>
        <div><b>COMPANY</b><a href="/company">会社概要</a><a href="/contact">お問い合わせ</a><a href="/consult">無料WEB相談</a><a href="{LINE}" target="_blank" rel="noopener">LINEで相談</a></div>
      </div>
    </div>
    <div class="ft-bt"><span>© RAIZON</span><span><a href="/company#privacy">プライバシーポリシー</a></span></div>
  </div>
</footer>
<div class="sp-cta"><a href="{DEMO}" target="_blank" rel="noopener" class="btn btn-o">デモを触る</a><a href="{LINE}" target="_blank" rel="noopener" class="btn btn-g">LINEで相談</a></div>
<script src="/assets-v4/v4.js?v=1" defer></script>
</body>
</html>
'''


def sec(cls, inner, id_=''):
    return f'<section class="sec {cls}"{f" id=\"{id_}\"" if id_ else ""}><div class="wrap">{inner}</div></section>'


def head(eb, h2, lead='', center=False):
    return f'<div class="{"center " if center else ""}rv"><div class="eb">{eb}</div><h2 class="h2">{h2}</h2>{f"<p class=\"lead\">{lead}</p>" if lead else ""}</div>'


def phone():
    return '''<div class="phone"><div class="scr">
<div class="bar"><i>A</i><div>Atelier Hair salon<small>公式アカウント（デモ）</small></div></div>
<div class="chat">
<div class="b">友だち追加ありがとうございます！下のメニューから、ご予約・クーポンをどうぞ。</div>
<div class="b me">予約</div>
<div class="b card"><b>✓ ご予約が確定しました</b><span>5/18（土）14:00<br>レディースカット／スタイリストA</span></div>
<div class="b">前日にリマインドをお送りします🌿</div>
</div>
<div class="rm"></div>
</div></div>'''


def cta_band():
    return sec('', f'''<div class="cta rv"><h2>まずは、今の「面倒」を<br>聞かせてください。</h2>
<p>相談・お見積もりは無料です。営業はしません。LINEで、ひとこと送るだけで大丈夫です。</p>
<div class="bs"><a href="{LINE}" target="_blank" rel="noopener" class="btn btn-g">LINEで無料相談 <span class="ar">→</span></a><a href="/consult" class="btn btn-w">無料WEB相談（30分）</a><a href="{DEMO}" target="_blank" rel="noopener" class="btn btn-ow">デモLINEを触る</a></div></div>''')


def plans_html():
    P = [('LINE BASIC', 'LINE', 1, '5,000', '5,500', ['LINE公式アカウントの構築', 'リッチメニュー', '基本的な配信', '運用相談・改善相談'], False),
         ('LINE STANDARD', 'LINE＋ホームページ', 2, '11,800', '12,980', ['BASICの内容すべて', 'ホームページの作成・更新', '予約・問い合わせの導線', '配信設計・顧客管理', '改善提案'], True),
         ('LINE PREMIUM', 'LINE＋HP＋システム', 3, '23,800', '26,180', ['STANDARDの内容すべて', '業務システム（予約・顧客・シフト・請求など）', '業務の自動化・連携', '定期的な改善ミーティング', 'AIなどのデジタル活用相談'], False)]
    out = '<div class="plans">'
    for nm, ty, k, pr, tax, items, rec in P:
        blocks = ''.join(f'<span class="{c}{" on" if i < k else ""}">{"＋" if i else ""}{t}</span>' for i, (t, c) in enumerate([('LINE', 'l'), ('HP', 'w'), ('システム', 's')]))
        til = '〜' if k == 3 else ''
        out += f'''<div class="plan rv{" rec" if rec else ""}">{"<div class=\"rib\">おすすめ</div>" if rec else ""}<div class="nm">{nm}</div><div class="ty">{ty}</div><div class="blocks">{blocks}</div>
<div class="pr"><small>月額</small><b>{pr}</b><small>円{til}（税別）</small></div><div class="tax">税込 {tax}円{til}</div>
<ul>{''.join(f"<li>{i}</li>" for i in items)}</ul><a href="/contact" class="btn {"btn-g" if rec else "btn-o"}">このプランで相談する</a></div>'''
    out += '</div><p class="note">初期費用0円・最低契約期間なし。解約は、解約したい月の前月末日までにご連絡ください。LINE公式アカウントの利用料（LINEヤフー株式会社）は別途かかります。PREMIUMの金額は、システムの内容によってお見積もりします。</p>'
    return out


CASES = [
    ('/assets-v3/case-building.jpg', ['LINE構築', 'シフト管理'], 'ビル管理会社様', '「シフト提出を、LINEで。」スタッフはスマホで提出、管理者は一覧で承認。集計と確認の手間を減らしました。', '/blog/case-shinya-facility'),
    ('/assets-v3/case2-photo.webp', ['ホームページ', 'LINE構築', '予約'], '理容室運営会社様（北谷町）', '「予約も顧客管理も、LINEで。」ホームページ・LINE・予約を一つの流れにつなげました。', '/blog/case-tenkabito'),
    ('/assets-v3/case-parlor-minato.jpg', ['ホームページ'], '沖縄そば専門パーラー様', '「お店の魅力と場所を、迷わず届ける。」ドライブ中の方も迷わず来店できるホームページに。', '/blog/case-parlor-minato'),
]


def cases_html(n=3):
    return '<div class="cases">' + ''.join(
        f'<a class="case rv" href="{u}"><div class="ph" style="background-image:url({img})"></div><div class="bd"><div class="tg">{"".join(f"<span>{t}</span>" for t in tags)}</div><h3>{who}</h3><p>{txt}</p><span class="go">事例を読む →</span></div></a>'
        for img, tags, who, txt, u in CASES[:n]) + '</div>'


def faq_html(items):
    return '<div class="faq">' + ''.join(f'<details class="rv"><summary>{q}</summary><p>{a}</p></details>' for q, a in items) + '</div>'


def faq_ld(items):
    return {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
        {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": re.sub('<[^>]+>', '', a)}} for q, a in items]}


def ph_hero(crumb, eb, h1, sub, chips, vis):
    return f'''<section class="ph-hero"><div class="wrap ph-hero-in">
<div class="rv"><div class="crumb"><a href="/">ホーム</a> ＞ {crumb}</div><div class="eb" style="margin-top:18px;">{eb}</div><h1>{h1}</h1><p class="sub">{sub}</p>
<div class="chips">{"".join(f"<span>{c}</span>" for c in chips)}</div>
<div class="hero-ctas"><a href="{LINE}" target="_blank" rel="noopener" class="btn btn-g">LINEで無料相談 <span class="ar">→</span></a><a href="/price" class="btn btn-o">料金を見る</a></div></div>
<div class="rv">{vis}</div></div></section>'''


def feat(no, h3, p, items, vis, more=None):
    return f'''<div class="feat"><div class="feat-vis rv">{vis}</div><div class="rv"><div class="feat-no">{no}</div><h3>{h3}</h3><p>{p}</p><ul>{"".join(f"<li>{i}</li>" for i in items)}</ul>{f"<a class=\"more\" href=\"{more[0]}\">{more[1]} →</a>" if more else ""}</div></div>'''


def icons_html(items):
    return '<div class="icons">' + ''.join(f'<div class="icon-it rv"><img src="{icon(ic)}" alt="" width="48" height="48" loading="lazy"><div><b>{t}</b><span>{d}</span></div></div>' for ic, t, d in items) + '</div>'


def cards_html(items, start=1):
    return '<div class="cards">' + ''.join(f'<div class="card rv"><img class="ico" src="{icon(ic)}" alt="" width="56" height="56" loading="lazy"><div class="no">POINT {i:02d}</div><h3>{t}</h3><p>{d}</p>{f"<div class=\"who\">{w}</div>" if w else ""}</div>' for i, (ic, t, d, w) in enumerate(items, start)) + '</div>'


def posts_html():
    try:
        posts = json.loads((ROOT / 'api/_posts-static.json').read_text(encoding='utf-8'))
    except Exception:
        return ''
    posts = sorted(posts, key=lambda p: p.get('createdAt', ''), reverse=True)[:3]
    return '<div class="posts">' + ''.join(f'<a class="post rv" href="/blog/{p["id"]}"><span class="ct">{p.get("category","")}</span><b>{p["title"]}</b><time>{p.get("createdAt","")[:10].replace("-", ".")}</time></a>' for p in posts) + '</div>'


ORG = {"@context": "https://schema.org", "@type": "LocalBusiness", "name": "RAIZON", "url": "https://raizon-okinawa.com/", "image": "https://raizon-okinawa.com/assets-v3/raizon-logo.png",
       "telephone": "080-6493-7744", "priceRange": "¥5,000〜（税別）",
       "address": {"@type": "PostalAddress", "addressRegion": "沖縄県", "addressLocality": "中頭郡北谷町", "streetAddress": "字砂辺301-7", "addressCountry": "JP"},
       "areaServed": "沖縄県"}

# ========== トップ ==========
TOP_FAQ = [
    ('デジタルに詳しくなくても大丈夫ですか？', 'もちろん大丈夫です。「何をしたらいいかわからない」という段階からご相談ください。画面を見ながら、わかる言葉でご説明します。'),
    ('LINEだけでも相談できますか？', 'はい。LINE公式アカウントだけのご相談もできます（LINE BASIC 月額5,000円・税別〜）。必要に応じて、ホームページやシステムもご提案します。'),
    ('契約期間の縛りはありますか？', 'ありません。最低契約期間はなく、解約したい月の前月末日までにご連絡いただければ、その月の末日で終了します。'),
    ('初期費用はかかりますか？', 'かかりません。LINE・ホームページ・システムの構築にかかる初期費用は0円です。'),
    ('相談したら、契約しないといけませんか？', 'いいえ。まずは今のお悩みをお聞かせください。必要なものがなければ、無理におすすめすることはありません。'),
]
top = f'''<section class="hero"><div class="wrap hero-in">
<div class="rv"><span class="badge">沖縄の事業者の、デジタル担当者</span>
<h1>集客も、予約も、<br>面倒な業務も。<br><em>まずは</em><span class="ic" aria-hidden="true"></span><em>LINEから。</em></h1>
<p class="sub">LINE公式アカウントを入口に、ホームページ・業務システム・AI活用まで。<br>会社の「もっとラクにしたい」を、一緒に仕組みにします。</p>
<div class="hero-ctas"><a href="{DEMO}" target="_blank" rel="noopener" class="btn btn-g">デモLINEを触ってみる <span class="ar">→</span></a><a href="/contact" class="btn btn-o">うちの場合、何ができる？</a></div>
<p class="hero-note">初期費用0円・月額5,000円（税別）〜・契約期間の縛りなし</p></div>
<div class="hero-vis rv">{phone()}<div class="float-chip" style="left:2%;top:18%"><i>✓</i>予約は24時間いつでも</div><div class="float-chip" style="right:0;top:52%"><i>⏰</i>前日リマインドも自動</div><div class="float-chip" style="left:6%;bottom:10%"><i>🎁</i>クーポンで、また来店</div></div>
</div></section>
<div class="strip"><div class="wrap strip-in"><span><img src="{icon('house')}" alt="" width="30" height="30">美容室・サロン</span><span><img src="{icon('note')}" alt="" width="30" height="30">飲食店</span><span><img src="{icon('heart')}" alt="" width="30" height="30">整体・治療院</span><span><img src="{icon('building')}" alt="" width="30" height="30">ビル管理・清掃</span><span><img src="{icon('shield')}" alt="" width="30" height="30">医療・介護</span><span><img src="{icon('globe')}" alt="" width="30" height="30">観光・不動産</span></div></div>

{sec('', head('ALL IN ONE', 'お店と会社の毎日に、<br>必要な仕組みは<em>全部ここに。</em>', 'LINE、ホームページ、予約、顧客管理、シフト、AI。ばらばらに頼むと、つながらず、手間も費用も増えます。RAIZONは、ひとつの窓口で、まとめて設計します。', True) + f"""<div class="hub rv"><div class="hub-c">RAIZON<small>デジタル担当者</small></div>
<div class="hub-n" style="left:16%;top:14%"><img src="{icon('chat')}" alt="" width="40" height="40">LINE公式アカウント</div>
<div class="hub-n" style="left:84%;top:14%"><img src="{icon('web')}" alt="" width="40" height="40">ホームページ</div>
<div class="hub-n" style="left:8%;top:50%"><img src="{icon('cal')}" alt="" width="40" height="40">予約管理</div>
<div class="hub-n" style="left:92%;top:50%"><img src="{icon('note')}" alt="" width="40" height="40">顧客管理</div>
<div class="hub-n" style="left:16%;top:86%"><img src="{icon('clock')}" alt="" width="40" height="40">シフト管理</div>
<div class="hub-n" style="left:84%;top:86%"><img src="{icon('bot')}" alt="" width="40" height="40">AI活用</div></div>""")}

<section class="sec sec-green"><div class="bigshape" aria-hidden="true"></div><div class="bigshape2" aria-hidden="true"></div><div class="wrap">
{head('WHAT CHANGES', '面倒をゼロにして、<br>本業に集中できること。', '')}
{cards_html([
  ('ph', '予約の電話が減る', 'お客様はLINEからタップで予約。営業中に電話に出られなくても、予約を逃しません。', '美容室・サロン・整体などに'),
  ('chat', '問い合わせに、24時間こたえる', 'よくある質問・営業時間・場所は、自動で返信。夜や休みの日の問い合わせにも、すぐに答えられます。', 'すべての業種に'),
  ('heart', 'また来てもらえる仕組み', 'ご来店のお礼、次回のクーポン、スタンプカード。忘れられない仕組みで、リピートにつなげます。', '飲食店・サロンなどに'),
  ('chartup', '集計・転記が減る', '予約・顧客・シフトの情報が一か所にまとまり、ノートやExcelへの書き写しが減ります。', '事務作業が多い会社に'),
  ('mail', 'スタッフへの連絡が、まとまる', 'シフトの締め切り、確定のお知らせ、欠勤の連絡。バラバラだった連絡を、仕組みにまとめます。', 'シフト勤務の会社に'),
  ('gear', '更新も改善も、まかせられる', '営業時間やメニューの変更、配信の改善まで。作って終わりにせず、毎月一緒に育てます。', '時間がない方に'),
])}
</div></section>

<section class="sec sec-dark"><div class="wrap">
{head('FEATURES', 'お店と会社のための機能が、<br><em>ひとつに</em>詰まっています。', 'LINEを入口に、必要なところから一段ずつ。全部を一度に始める必要はありません。')}
{feat('01', 'LINE公式アカウント<br>「お客様の入口」をつくる', 'メニュー・予約・クーポンを、LINEひとつに。お客様は、いつものLINEから、タップするだけで予約やお問い合わせができます。', ['リッチメニュー（タブ切り替えにも対応）', '予約の受付と、前日のリマインド', 'クーポン・スタンプカード', '自動応答・ステップ配信'], phone(), ('/line', 'LINE公式アカウント構築を見る'))}
{feat('02', 'ホームページ<br>「探される」から「選ばれる」へ', '検索やSNSから来た人が、迷わずLINEや予約に進めるホームページ。初期費用0円、月額で作って、更新もおまかせいただけます。', ['スマホで見やすく、表示が速い', 'LINE・予約への導線を設計', '営業時間・メニューの更新もおまかせ', '3年以上のご利用で譲渡'], ill('T-02', 'ホームページを見て、LINEで予約する人', 'スマホでお店のホームページを見ている女性。画面からLINEのアイコンへ矢印がのび、「予約完了」のチェックマーク。背景に沖縄らしい街並み（赤瓦・シーサーは控えめ）。', 'sq'), ('/web', 'ホームページ制作を見る'))}
{feat('03', '業務システム<br>「面倒な作業」を仕組みに', 'シフト提出、予約管理、顧客管理、請求。紙・Excel・電話でやっている作業を、お店や会社のやり方に合わせて仕組みにします。', ['シフトの提出・承認・欠勤連絡', '予約・顧客の一覧と履歴', '提出や申請の自動通知', 'LINEとの連携'], ill('T-03', 'シフト表と格闘していた人が、スマホで一瞬で確認', '左側に紙のシフト表と電話に囲まれて困っている管理者、右側でスマホの一覧画面を見て笑顔になった同じ人。ビフォー・アフターの2コマ構成。', 'sq'), ('/system', '業務システムを見る'))}
{feat('04', 'AI活用<br>「使える場面」から一緒に', '文章の下書き、問い合わせの整理、情報のまとめ。AIを使うことが目的ではなく、業務がラクになる使い方を、一緒に見つけます。', ['お知らせ・SNS文章の下書き', '問い合わせ内容の整理・分類', '社内マニュアルやFAQの作成', '使い方の説明と、ルールづくり'], ill('T-04', 'AIと相談しながら仕事を進めるお店の人', 'カウンターでノートPCに向かう店主の横に、やわらかい形のAIアシスタント（丸いキャラクター、顔は簡単な点と線）。吹き出しに文章の下書き。', 'sq'), ('/ai', 'AI活用支援を見る'))}
{icons_html([
  ('chat', 'リッチメニュー', 'タブ切り替え・画像デザインまで'),
  ('cal', '予約受付', '空いている時間だけ選べる'),
  ('bell', 'リマインド', '前日・直前に自動でお知らせ'),
  ('tix', 'クーポン', '初回・再来店のきっかけに'),
  ('star', 'スタンプカード', 'LINEでためて、また来店'),
  ('mail', 'ステップ配信', '友だち追加から順番に案内'),
  ('note', '顧客管理', 'タグ・履歴・メモを一か所に'),
  ('web', 'ホームページ', '作成・更新・速さの改善'),
  ('clock', 'シフト管理', '提出・承認・欠勤連絡'),
  ('chartup', '集計・レポート', '友だち数や予約数を見える化'),
  ('bot', 'AI活用', '文章作成・情報整理'),
  ('shield', '安心の運用', '権限・パスワードの管理'),
])}
</div></section>

{sec('', head('PRICE', '必要なところから、<em>一段ずつ。</em>', 'LINEから始めて、ホームページ、業務システムへ。お店の成長に合わせて、いつでも上のプランに切り替えられます。', True) + plans_html() + '<div class="center" style="margin-top:28px"><a href="/price" class="btn btn-o">料金の詳しい説明を見る <span class="ar">→</span></a></div>')}

{sec('sec-gray', head('CASE STUDY', '導入事例', '業種も、困りごとも、さまざまです。実際に一緒につくった仕組みをご紹介します。', True) + cases_html() + '<div class="center" style="margin-top:28px"><a href="/cases" class="btn btn-o">導入事例をもっと見る <span class="ar">→</span></a></div>')}

<section class="sec sec-dark"><div class="wrap">
{head('INDUSTRY', 'RAIZONは、あらゆる<br>お店と会社に<em>フィットします。</em>', '', True)}
<div class="inds">
<div class="ind rv"><div class="ph" style="background-image:url(/assets-v3/ind-beauty.webp)"></div><div class="bd"><b>美容室・サロン</b><p>予約・リマインド・次回クーポンで、リピートの仕組みを。</p></div></div>
<div class="ind rv"><div class="ph" style="background-image:url(/assets-v3/ind-food.webp)"></div><div class="bd"><b>飲食店</b><p>メニュー・営業時間・テイクアウトの案内を、LINEで。</p></div></div>
<div class="ind rv"><div class="ph" style="background-image:url(/assets-v3/ind-build.webp)"></div><div class="bd"><b>ビル管理・建設</b><p>シフト提出や現場の連絡を、スマホで完結。</p></div></div>
<div class="ind rv"><div class="ph" style="background-image:url(/assets-v3/ind-estate.webp)"></div><div class="bd"><b>不動産・観光</b><p>問い合わせの自動応答と、物件・施設の案内を。</p></div></div>
</div></div></section>

{sec('', head('FLOW', 'ご相談から、使いはじめるまで', '', True) + '<div class="flow"><div class="rv"><b>無料相談</b><p>LINEまたはWEB相談で、今の困りごとをお聞きします。</p></div><div class="rv"><b>ご提案</b><p>必要なものだけを、画面を見ながらご提案します。</p></div><div class="rv"><b>お申し込み</b><p>内容と料金にご納得いただいてから、お申し込みです。</p></div><div class="rv"><b>構築</b><p>アカウントやページを作り、一緒に確認します。</p></div><div class="rv"><b>運用・改善</b><p>使いながら、毎月一緒に改善します。</p></div></div><div class="center" style="margin-top:28px"><a href="/flow" class="btn btn-o">ご利用の流れを詳しく <span class="ar">→</span></a></div>')}

{sec('sec-gray', head('FAQ', 'よくあるご質問', '', True) + faq_html(TOP_FAQ) + '<div class="center" style="margin-top:28px"><a href="/faq" class="btn btn-o">質問をもっと見る <span class="ar">→</span></a></div>')}

{sec('', head('BLOG', 'デジタル活用のヒント', 'LINE公式アカウントの使い方や、業務をラクにするヒントを発信しています。') + posts_html() + '<div style="margin-top:24px"><a href="/blog-list" class="btn btn-o">記事一覧へ <span class="ar">→</span></a></div>')}

{cta_band()}
'''

PAGES = {}
PAGES['/'] = ('index.html', '沖縄のLINE公式アカウント構築・ホームページ制作｜月額5,000円〜 RAIZON',
              'RAIZONは沖縄の事業者向けデジタル担当者。LINEを入口に、ホームページ・業務システム・AI活用まで、会社の「もっとラクにしたい」を一緒に仕組みにします。初期費用0円・月額5,000円（税別）〜。',
              top, '', [ORG, faq_ld(TOP_FAQ)])

# ========== LINE構築 ==========
LINE_FAQ = [
    ('LINE公式アカウントを、まだ持っていなくても大丈夫ですか？', 'はい。アカウントの開設から、ご一緒します。アカウントはお客様の名義で作り、お客様のものとして残ります。'),
    ('今のアカウントを、そのまま使えますか？', '使えます。今の友だちはそのままに、リッチメニューやあいさつ、予約の仕組みを見直します。'),
    ('LINE社の利用料は、別にかかりますか？', 'はい。LINE公式アカウントの月額の利用料（プランにより0円〜）は、お客様からLINEヤフー株式会社へ直接お支払いいただきます。'),
    ('どのくらいで使い始められますか？', '内容によって変わります。基本的な設定なら、資料や写真をいただいてから、短期間で始められます。'),
    ('配信の文章は、作ってもらえますか？', 'はい。配信の内容や頻度の設計から、文章の作成までご相談いただけます。'),
]
line_body = ph_hero('LINE公式アカウント構築', 'LINE', '沖縄のLINE公式アカウント構築は、<br><em>RAIZON</em>へ。', 'メニュー・予約・クーポンを、LINEひとつに。お客様はタップするだけ、お店は自動で。開設から、毎月の改善まで一緒に進めます。', ['初期費用0円', '月額5,000円（税別）〜', '予約・リマインド', 'クーポン・スタンプ', '縛りなし'], phone()) + \
    sec('', head('PROBLEM', 'こんなお悩みはありませんか？', '', True) + cards_html([
        ('ph', '営業中に、予約の電話に出られない', '施術中や調理中に鳴る電話。出られなかった予約は、そのまま他のお店へ。', ''),
        ('chat', '問い合わせが、あちこちに届く', '電話・Instagram・メール・LINE。確認するだけで時間がかかる。', ''),
        ('star', 'リピートにつながらない', '一度来たお客様に、次の来店のきっかけを届けられていない。', ''),
    ])) + \
    f'<section class="sec sec-dark"><div class="wrap">{head("WHAT YOU CAN DO", "LINE公式アカウントで、<em>できること</em>")}' + \
    feat('01', 'リッチメニュー', 'トーク画面の下に、メニュー・予約・クーポンなどのボタンを常に表示。タブ切り替えで、たくさんの案内も整理できます。', ['お店の雰囲気に合わせた画像デザイン', 'タブ切り替え（2〜4タブ）', '予約・地図・電話へ1タップ'], ill('L-01', 'スマホのリッチメニューをタップする指', 'スマホ画面の下半分に6分割のメニュー。そのうち「予約」ボタンを指がタップし、波紋が広がる。シンプルな線画＋緑のアクセント。', 'sq')) + \
    feat('02', '予約の受付とリマインド', 'お客様は、メニュー・担当・日時を選ぶだけ。確定のお知らせと、前日のリマインドは自動で届きます。', ['空いている時間だけ選べる', '前日・直前のリマインド', 'お店側は一覧で確認・承認'], ill('L-02', 'カレンダーと、自動で届くリマインド', '大きなカレンダーの1日に丸印。そこからスマホへ「明日のご予約のお知らせ」の通知が飛ぶ。時計のアイコンを添える。', 'sq')) + \
    feat('03', 'クーポン・スタンプ・ステップ配信', '友だち追加のお礼、初回クーポン、来店後のお礼とスタンプ。お客様の流れに合わせて、自動で順番に届けます。', ['初回・再来店クーポン', 'スタンプカード', '友だち追加からの自動配信'], ill('L-03', 'クーポンとスタンプカードを受け取って喜ぶお客様', 'スマホから「10%OFF」のクーポン券とスタンプカードが飛び出し、それを受け取って笑顔の女性。紙吹雪は控えめ。', 'sq')) + \
    '</div></section>' + \
    sec('sec-gray', head('PRICE', 'LINE公式アカウント構築の料金', '', True) + plans_html()) + \
    sec('', head('CASE', '導入事例', '', True) + cases_html(2)) + \
    sec('sec-gray', head('FAQ', 'よくあるご質問', '', True) + faq_html(LINE_FAQ)) + cta_band()
PAGES['/line'] = ('line.html', '沖縄のLINE公式アカウント構築｜月額5,000円〜・初期費用0円 | RAIZON',
                  '沖縄の事業者向けLINE公式アカウント構築・運用。リッチメニュー、予約受付とリマインド、クーポン・スタンプ、ステップ配信まで。初期費用0円・月額5,000円（税別）〜。', line_body, '/line', [faq_ld(LINE_FAQ)])

# ========== ホームページ ==========
WEB_FAQ = [
    ('買い切りの制作と、何が違いますか？', '最初にまとまった費用がかからず、公開後の更新や改善も月額に含まれます。作って終わりではなく、お店の変化に合わせて育てられます。'),
    ('ホームページだけをお願いできますか？', 'ホームページは、LINE公式アカウントと組み合わせたSTANDARDプラン（月額11,800円・税別）でご提供しています。ホームページ単体のご希望は、ご相談ください。'),
    ('ドメイン（〇〇.com など）は、誰の名義になりますか？', 'お客様の名義で取得することをおすすめしています。ご契約が終わっても、ドメインはお客様の手元に残ります。'),
    ('解約したら、ホームページはどうなりますか？', '通算3年以上ご利用のお客様には、ホームページのデータを譲渡できます。3年未満の場合は、契約の終了日で公開を停止します。'),
    ('写真や文章は、用意しないといけませんか？', 'お手元の写真や、お店の説明をいただければ、文章はこちらで整えます。写真が少ない場合も、ご相談ください。'),
]
web_body = ph_hero('ホームページ制作', 'WEB SITE', '沖縄のホームページ制作は、<br>月額で、<em>LINEと一緒に。</em>', '作って終わりのホームページではなく、予約や問い合わせにつながる「入口」として、作って、育てます。', ['初期費用0円', '月額11,800円（税別）〜', '更新もおまかせ', 'LINE・予約と連携', '3年で譲渡'], ill('W-00', 'パソコンとスマホに映る、お店のホームページ', 'ノートPCとスマホが並び、どちらにも同じお店のホームページ（写真・見出し・「LINEで予約」ボタン）。PCの横に観葉植物、背景はやわらかい緑。', 'sq')) + \
    sec('', head('PROBLEM', 'こんなお悩みはありませんか？', '', True) + cards_html([
        ('web', 'ホームページがない・古い', '何年も更新していない、スマホで見ると文字が小さい。', ''),
        ('gear', '自分では直せない', '営業時間やメニューを変えたいのに、更新の方法がわからない。', ''),
        ('coins', '最初の費用が高い', '制作会社に頼むと、最初に数十万円かかると言われた。', ''),
    ])) + \
    f'<section class="sec sec-dark"><div class="wrap">{head("FEATURE", "RAIZONのホームページ制作")}' + \
    feat('01', '初期費用0円・月額制', 'まとまった費用をかけずに始められます。作成も、その後の更新も、月額に含まれます。', ['作成費0円', '更新・修正も月額に', '最低契約期間なし'], ill('W-01', '大きな初期費用の請求書が消えて、小さな月額カードになる', '左に「¥300,000」と書かれた大きな請求書（×印）、右に小さな「月額」のカードとカレンダー。お財布を持った店主が安心した表情。', 'sq')) + \
    feat('02', 'LINE・予約と一体で設計', 'ホームページを見た人が、LINEの友だち追加や予約へ、迷わず進めるように作ります。', ['目立つ「LINEで予約」ボタン', 'Googleマップ・電話への導線', 'SNSとのつながり'], ill('W-02', 'ホームページ→LINE→予約の3ステップ', '3つの画面（ホームページ、LINEのトーク、予約完了）が左から右へ矢印でつながる。最後の画面に大きなチェック。', 'sq')) + \
    feat('03', 'スマホで見やすく、表示が速い', 'お客様の多くはスマホで見ます。スマホでの見やすさと、表示の速さを優先し、検索で見つかりやすい構成にします。', ['スマホ最優先のデザイン', '軽くて速い表示', '地域名・業種での検索を意識'], ill('W-03', '検索結果の上の方に、自分のお店が出てくる', 'スマホの検索画面に「沖縄 美容室」の検索窓。結果の一番上のカードが光っていて、虫眼鏡のアイコン。', 'sq')) + \
    '</div></section>' + \
    sec('sec-gray', head('PRICE', 'ホームページ制作の料金', '', True) + plans_html()) + \
    sec('', head('CASE', '制作事例', '', True) + cases_html(3)) + \
    sec('sec-gray', head('FAQ', 'よくあるご質問', '', True) + faq_html(WEB_FAQ)) + cta_band()
PAGES['/web'] = ('web.html', '沖縄のホームページ制作｜月額11,800円〜・初期費用0円・LINE連携 | RAIZON',
                 '沖縄の事業者向けのホームページ制作。初期費用0円、月額11,800円（税別）〜で、作成から更新、予約・問い合わせの導線、LINE公式アカウントとの連携まで。', web_body, '/web', [faq_ld(WEB_FAQ)])

# ========== 業務システム ==========
SYS_FAQ = [
    ('既製のシフト管理アプリと、何が違いますか？', '既製のアプリで足りる場合は、それが一番手軽です。お店独自のルールがある場合や、LINE・ホームページと一体で整えたい場合に、専用の仕組みが向いています。'),
    ('スタッフ全員が、スマホを使いこなせるか心配です。', '画面はシンプルにし、使い方の説明もお手伝いします。一部のスタッフから使い始めることもできます。'),
    ('スタッフやお客様の情報は、安全に扱われますか？', '権限とパスワードの管理を徹底し、お預かりした情報は、サービスの提供のためにのみ使います。医療・介護など配慮が必要な情報を扱う場合は、事前にご相談ください。'),
    ('解約したら、システムはどうなりますか？', 'お客様の環境に組み込んだ仕組みは、そのまま使い続けられます。RAIZONが製作し、RAIZONの環境で動くアプリは、停止または料金のご相談となります。データはご希望によりお渡しします。'),
    ('費用はどのくらいですか？', '月額23,800円（税別）からです。作るものの内容によってお見積もりします。初期費用は0円です。'),
]
sys_body = ph_hero('業務システム・シフト管理', 'SYSTEM', '紙・Excel・電話の作業を、<br><em>業務システム</em>でラクに。', 'シフト提出、予約管理、顧客管理など、毎日の「面倒な作業」を、お店や会社のやり方に合わせた仕組みにします。', ['シフト提出・管理', '予約・顧客管理', 'LINEと連携', '初期費用0円', '月額23,800円（税別）〜'], ill('S-00', '散らかった書類が、スマホの一覧にすっきりまとまる', '机の上の紙の束・付箋・電話が、渦を描いてスマホの画面に吸い込まれ、整った一覧表になる。', 'sq')) + \
    sec('', head('PROBLEM', 'こんな作業に、時間を取られていませんか？', '', True) + cards_html([
        ('clock', 'シフトの集計に時間がかかる', '希望が紙・口頭・LINEでバラバラに届き、まとめるだけで一苦労。', ''),
        ('note', '予約と顧客の情報が分かれている', '電話とノート、Excel。お客様の履歴を探すのに時間がかかる。', ''),
        ('gear', '同じ入力をくり返している', '転記や集計を、毎日・毎月、手作業でくり返している。', ''),
    ])) + \
    f'<section class="sec sec-dark"><div class="wrap">{head("SOLUTION", "つくれるもの")}' + \
    feat('01', 'シフト提出・管理', 'スタッフはスマホから希望を提出し、管理者は一覧で確認・承認。欠勤の申請や、提出時の通知もまとめて。', ['提出・承認・欠勤申請', '提出状況の一覧', '提出時に管理者へ通知'], ill('S-01', 'スタッフがスマホでシフトを出し、管理者がPCで承認', '左にスマホを持った清掃スタッフ（制服）、右にPCの前の管理者。間を「提出」「承認」の矢印が行き来する。', 'sq'), ('/blog/shift-submission-line-web-app', 'シフト提出の仕組みを詳しく')) + \
    feat('02', '予約管理・顧客管理', 'LINEからの予約を一覧で管理し、来店履歴やメモを残せます。次の提案やリピートに活かせます。', ['予約の一覧・承認', '来店履歴・メモ', 'タグで顧客を分類'], ill('S-02', '顧客カードがきれいに並ぶ管理画面', 'タブレットに顧客のカードが並び、1枚に「来店3回」「好み：短め」のメモ。横に予約カレンダー。', 'sq')) + \
    feat('03', '自動化・AIの活用', '転記や集計、定型の連絡を、できるところから自動に。文章作成などにはAIも使います。', ['定型の連絡を自動で', '集計・帳票の作成', 'AIで文章の下書き'], ill('S-03', '歯車が回って、作業が自動で進む', '大小の歯車がかみ合って回り、その先から書類やメッセージが自動で出てくる。人はコーヒーを飲んで見守っている。', 'sq')) + \
    '</div></section>' + \
    sec('sec-gray', head('CASE', '導入事例：ビル管理会社様', '', True) + '<div class="two"><div class="box rv"><h3>課題</h3><p>スタッフのシフト提出が個別のやり取りで、確認や集計に手間がかかっていました。</p></div><div class="box rv"><h3>つくったもの</h3><p>スタッフはスマホでシフトを提出・欠勤を申請、管理者は一覧で承認。提出や申請があると、管理者にメールで通知します。</p></div></div><div class="center" style="margin-top:24px"><a class="btn btn-o" href="/blog/case-shinya-facility">事例を読む <span class="ar">→</span></a></div>') + \
    sec('', head('PRICE', '業務システムの料金', '', True) + plans_html()) + \
    sec('sec-gray', head('FAQ', 'よくあるご質問', '', True) + faq_html(SYS_FAQ)) + cta_band()
PAGES['/system'] = ('system.html', '業務システム・シフト管理アプリの制作｜沖縄の中小企業向け | RAIZON',
                    '沖縄の中小企業・店舗向けに、シフト提出・予約管理・顧客管理などの業務システムを制作します。LINEと連携し、紙・Excel・電話の作業を減らします。月額23,800円（税別）〜。', sys_body, '/system', [faq_ld(SYS_FAQ)])

# ========== AI活用 ==========
AI_FAQ = [
    ('AIに詳しくなくても大丈夫ですか？', '大丈夫です。今の業務をお聞きしながら、AIが役に立ちそうな場面を一緒に探します。'),
    ('AIに、お客様の情報を入れても大丈夫ですか？', '個人情報や社外秘の情報の扱いには、ルールが必要です。入力してよい情報・いけない情報の決め方から、ご一緒します。'),
    ('どのプランで相談できますか？', 'AIの活用相談は、LINE PREMIUM（月額23,800円・税別〜）に含まれます。まずは無料相談で、何ができそうかをお話しします。'),
    ('AIが作った文章を、そのまま使って大丈夫ですか？', '下書きとして使い、最後は人が確認することをおすすめしています。確認のポイントもお伝えします。'),
]
ai_body = ph_hero('AI活用支援', 'AI', 'AIを使うことが<br>目的じゃない。<br><em>業務がラクになる</em>ことが目的。', '文章の下書き、問い合わせの整理、マニュアル作り。「ここなら使える」という場面から、一緒に始めます。', ['文章作成', '情報の整理', 'マニュアル・FAQ', '使い方のルールづくり'], ill('A-00', 'AIアシスタントと一緒に働く小さなお店', '小さなお店のカウンターで、店主とやさしい丸い形のAIキャラクターがハイタッチ。周りに文章・グラフ・チェックリストのアイコンが浮かぶ。', 'sq')) + \
    sec('', head('USE CASE', 'こんな場面で、使えます', '', True) + cards_html([
        ('note', 'お知らせ・SNSの文章', 'キャンペーンや休業のお知らせ、Instagramの投稿文の下書きを、短い時間で。', ''),
        ('qa', '問い合わせの整理', 'よくある質問をまとめ、自動応答やFAQの文章を作ります。', ''),
        ('book', 'マニュアル・手順書', 'スタッフ向けの手順書や、新人さんの教育資料を整えます。', ''),
        ('chartup', '情報のまとめ', '売上や予約のメモから、気づきや次の打ち手を整理します。', ''),
        ('mail', 'メール・返信の下書き', 'お客様や取引先への返信を、ていねいな文章に整えます。', ''),
        ('bulb', 'アイデア出し', 'メニュー名、イベントの企画、キャッチコピーの候補出しに。', ''),
    ])) + \
    sec('sec-gray', head('HOW', '進め方', '', True) + '<div class="flow"><div class="rv"><b>業務を聞く</b><p>毎日・毎月の作業を、一緒に書き出します。</p></div><div class="rv"><b>使える場面を選ぶ</b><p>効果が大きく、リスクが小さいところから。</p></div><div class="rv"><b>試す</b><p>実際の業務で試し、使い方を調整します。</p></div><div class="rv"><b>ルールを決める</b><p>入力してよい情報、確認の方法を決めます。</p></div><div class="rv"><b>定着させる</b><p>スタッフの皆さまへの説明もお手伝いします。</p></div></div>') + \
    sec('', head('FAQ', 'よくあるご質問', '', True) + faq_html(AI_FAQ)) + cta_band()
PAGES['/ai'] = ('v4/ai.html', 'AI活用支援｜文章作成・業務の整理を、沖縄の中小企業に | RAIZON',
                '沖縄の中小企業・店舗向けのAI活用支援。お知らせ文の下書き、問い合わせの整理、マニュアル作りなど、業務がラクになる使い方を一緒に見つけます。', ai_body, '/ai', [faq_ld(AI_FAQ)])

# ========== 料金 ==========
PRICE_FAQ = [
    ('初期費用はかかりますか？', 'かかりません。LINE・ホームページ・システムの構築にかかる初期費用は0円です。'),
    ('支払い方法を教えてください。', '初回は、1か月分の利用料を銀行振込でお支払いいただきます。2か月目からは、月払い（毎月27日にクレジットカード／デビットカードで引き落とし）か、年払い（12か月分を銀行振込）をお選びいただけます。'),
    ('途中でプランを変えられますか？', 'はい。上位・下位のプランへの変更をご相談ください。変更後の料金は、原則として変更した月の翌月分から適用します。'),
    ('解約はいつでもできますか？', 'はい。最低契約期間はありません。解約したい月の前月末日までにご連絡いただければ、その月の末日で終了します。'),
    ('LINE公式アカウントの利用料は含まれますか？', '含まれません。LINE公式アカウントの利用料は、お客様からLINEヤフー株式会社へ直接お支払いいただきます。'),
]
price_body = ph_hero('料金プラン', 'PRICE', '必要なところから、<br><em>一段ずつ。</em>', 'LINEから始めて、ホームページ、業務システムへ。初期費用0円、最低契約期間なし。いつでも上のプランに切り替えられます。', ['初期費用0円', '最低契約期間なし', '表示は税別'], ill('P-00', '階段を一段ずつのぼる店主', '3段の階段（LINE・ホームページ・システムのアイコンが各段に）を、店主が笑顔で一段ずつのぼっている。頂上に小さな旗。', 'sq')) + \
    sec('', head('PLAN', '3つのプラン', '', True) + plans_html()) + \
    sec('sec-gray', head('COMPARE', 'プランの違い', '', True) + '''<div class="rv" style="overflow-x:auto;margin-top:32px"><table class="tbl" style="min-width:640px"><tr><th></th><th>BASIC</th><th>STANDARD</th><th>PREMIUM</th></tr>
<tr><th>LINE公式アカウントの構築</th><td>✓</td><td>✓</td><td>✓</td></tr><tr><th>リッチメニュー・基本的な配信</th><td>✓</td><td>✓</td><td>✓</td></tr><tr><th>運用相談・改善相談</th><td>✓</td><td>✓</td><td>✓</td></tr>
<tr><th>ホームページの作成・更新</th><td>—</td><td>✓</td><td>✓</td></tr><tr><th>予約・問い合わせの導線</th><td>—</td><td>✓</td><td>✓</td></tr><tr><th>配信設計・顧客管理</th><td>—</td><td>✓</td><td>✓</td></tr>
<tr><th>業務システム（予約・顧客・シフト・請求など）</th><td>—</td><td>—</td><td>✓</td></tr><tr><th>業務の自動化・連携</th><td>—</td><td>—</td><td>✓</td></tr><tr><th>定期的な改善ミーティング・AI活用相談</th><td>—</td><td>—</td><td>✓</td></tr>
<tr><th>月額（税別）</th><td><b>5,000円</b></td><td><b>11,800円</b></td><td><b>23,800円〜</b></td></tr></table></div>''') + \
    sec('', head('PAYMENT', 'お支払いについて', '', True) + '<div class="two"><div class="box rv"><h3>はじめのお支払い</h3><p>1か月分の利用料を、銀行振込でお支払いいただきます（日割りはしません）。お振込みを確認してから、サービスを開始します。</p></div><div class="box rv"><h3>2か月目から</h3><p>月払い：毎月27日に、クレジットカードまたは銀行のデビットカードで引き落とし（Square）。<br>年払い：12か月分を銀行振込（割引はありません）。</p></div><div class="box rv"><h3>解約</h3><p>最低契約期間はありません。解約したい月の前月末日までにご連絡ください。</p></div><div class="box rv"><h3>終了したとき</h3><p>LINE公式アカウントはお客様の手元に残ります。ホームページは通算3年以上のご利用で譲渡できます。詳しくは利用規約をご確認ください。</p></div></div>') + \
    sec('sec-gray', head('FAQ', '料金のご質問', '', True) + faq_html(PRICE_FAQ)) + cta_band()
PAGES['/price'] = ('v4/price.html', '料金プラン｜月額5,000円〜・初期費用0円・縛りなし | RAIZON',
                   'RAIZONの料金プラン。LINE BASIC 月額5,000円、LINE STANDARD（LINE＋ホームページ）11,800円、LINE PREMIUM（＋業務システム）23,800円〜（いずれも税別）。初期費用0円・最低契約期間なし。', price_body, '/price', [faq_ld(PRICE_FAQ)])

# ========== 導入事例 ==========
cases_body = ph_hero('導入事例', 'CASE STUDY', '一緒につくった、<br><em>仕組み</em>の話。', '業種も、困りごとも、さまざまです。どんな課題を、どんな仕組みで解決したのかをご紹介します。', ['ビル管理', '理容室', '飲食店'], ill('C-00', 'いろいろな業種の人が、スマホを見て笑顔', '美容師・飲食店の店主・作業着の管理者・介護スタッフが横一列に並び、それぞれスマホを見て笑顔。背景に緑の円。', 'wide')) + \
    sec('', cases_html(3)) + \
    sec('sec-gray', head('YOUR CASE', '次は、あなたのお店の番です', 'まだ事例がない業種でも大丈夫です。今の困りごとから、一緒に考えます。', True) + '<div class="center rv" style="margin-top:24px"><a class="btn btn-g" href="/contact">相談してみる <span class="ar">→</span></a></div>') + cta_band()
PAGES['/cases'] = ('v4/cases.html', '導入事例｜LINE構築・ホームページ・シフト管理 | RAIZON',
                   'RAIZONの導入事例。ビル管理会社のシフト提出、理容室のホームページ・LINE・予約、沖縄そばパーラーのホームページ制作など。', cases_body, '/cases')

# ========== ご利用の流れ ==========
flow_steps = [
    ('無料相談', 'LINEで、ひとこと送るか、無料WEB相談（30分・Google Meet）をご予約ください。今の困りごとや、お店のことをお聞きします。', '相談は無料。営業はしません。'),
    ('ご提案・お見積もり', '必要なものだけを、画面を見ながらご提案します。PREMIUMの場合は、システムの内容でお見積もりします。', 'その場で決める必要はありません。'),
    ('お申し込み', '内容と料金、利用規約をご確認のうえ、申込フォームからお申し込みください。当社から承諾のご連絡をした時点で、ご契約が成立します。', '初回は1か月分を銀行振込。'),
    ('構築・制作', 'LINE公式アカウントの設定、ホームページやシステムの制作を進めます。途中で、実際の画面を見ながら確認していただけます。', '写真や文章のご用意もサポートします。'),
    ('運用開始・改善', '使い始めたあとも、配信の改善、更新、機能の追加まで、毎月一緒に育てます。', '2か月目からは月払い（カード）か年払い（振込）。'),
]
flow_body = ph_hero('ご利用の流れ', 'FLOW', 'ご相談から、<br><em>使いはじめるまで。</em>', 'はじめての方でも、迷わないように。ひとつずつ、一緒に進めます。', ['相談無料', '営業なし', '縛りなし'], ill('F-00', '地図の道を、店主とRAIZONの担当者が並んで歩く', 'ゆるやかな道に1〜5の旗が立ち、店主とRAIZONの担当者（ノートPCを持つ）が並んで歩いている。ゴールに開店中のお店。', 'wide')) + \
    sec('', ''.join(f'<div class="feat" style="margin-top:{0 if i == 0 else 56}px"><div class="feat-vis rv">{ill(f"F-{i+1:02d}", f"STEP {i+1}：{t}", d2, "wide")}</div><div class="rv"><div class="feat-no">STEP {i+1}</div><h3>{t}</h3><p>{d}</p><ul><li>{n}</li></ul></div></div>' for i, (t, d, n), d2 in zip(range(5), flow_steps, [
        'ノートPCのビデオ通話で、店主とRAIZONの担当者が笑顔で話している。画面の横にLINEのトーク画面。',
        'ホワイトボードに「LINE」「HP」「システム」のカードを並べて、担当者が説明し、店主がうなずいている。',
        'スマホの申込フォームにチェックを入れ、「申し込む」ボタンを押す指。横に規約の書類のアイコン。',
        '画面のデザインを組み立てている作業の様子。パーツ（ボタン・写真・メニュー）がブロックのように積み上がる。',
        '公開されたLINEとホームページを見て、店主と担当者がハイタッチ。グラフが右肩上がり（数字は入れない）。'])) ) + cta_band()
PAGES['/flow'] = ('v4/flow.html', 'ご利用の流れ｜無料相談から運用まで | RAIZON',
                  'RAIZONのご利用の流れ。無料相談、ご提案、お申し込み、構築・制作、運用開始・改善まで。初回は1か月分を銀行振込、2か月目からは月払い（カード）か年払い（振込）。', flow_body, '/flow')

# ========== 会社概要 ==========
company_body = ph_hero('会社概要', 'COMPANY', '沖縄の事業者に、<br><em>デジタル担当者</em>を。', '小さな会社やお店には、デジタルの担当者がいないことがほとんどです。RAIZONは、その「担当者」として、一緒に考え、一緒に手を動かします。', ['北谷町が拠点', '相談しやすい', 'ワンストップ'], ill('M-00', '海の見える北谷の街と、ノートPCで働く人', '北谷町の海辺（観覧車や海が遠くに見える）を背景に、カフェのテーブルでノートPCを開く人物。明るい昼の光。', 'wide')) + \
    sec('', head('MISSION', 'デジタルで変える。<br>働き方も、仕組みも、売り方も。', 'LINE・ホームページ・業務システム・AI。どれか一つを売るのではなく、会社の「もっとラクにしたい」を、全体を見ながら仕組みにします。', True) + cards_html([
        ('chat', '相談しやすい', '専門用語を使わず、わかる言葉で。小さなことでも、気軽に相談できる担当者でいます。', ''),
        ('rocket', '小さく始める', '全部を一度に作らず、効果の大きいところから。必要になったら、一段ずつ広げます。', ''),
        ('thumb', '作って終わりにしない', '使い始めてからが本番。毎月の改善で、一緒に育てます。', ''),
    ])) + \
    sec('sec-gray', head('PROFILE', '会社概要', '', True) + '''<table class="tbl rv"><tr><th>会社名</th><td>RAIZON（ライゾン）</td></tr><tr><th>代表</th><td>喜如嘉 朝陽</td></tr><tr><th>本社</th><td>沖縄県中頭郡北谷町字砂辺301-7</td></tr><tr><th>支店</th><td>大阪府東大阪市</td></tr>
<tr><th>事業内容</th><td>LINE公式アカウントの構築・運用支援／ホームページ制作／業務システム開発／AI活用支援</td></tr><tr><th>対応エリア</th><td>沖縄県内を中心に全国（オンライン対応）</td></tr>
<tr><th>お問い合わせ</th><td>LINE（24時間受付）／お問い合わせフォーム／TEL 080-6493-7744</td></tr></table>''', 'profile') + \
    sec('', head('PRIVACY', 'プライバシーポリシー') + '<div class="box rv" style="margin-top:24px"><p>RAIZONは、お問い合わせやご相談でお預かりした個人情報（お名前・連絡先・ご相談内容など）を、ご連絡・ご提案・サービスの提供のためにのみ使います。法令に定める場合を除き、ご本人の同意なく第三者に提供しません。サイトの改善のため、アクセス解析ツール（Microsoft Clarity 等）を使っています。個人情報の開示・訂正・削除のご希望は、お問い合わせ窓口までご連絡ください。</p></div>', 'privacy') + cta_band()
PAGES['/company'] = ('v4/company.html', '会社概要｜沖縄・北谷町のデジタル担当者 RAIZON',
                     'RAIZON（ライゾン）の会社概要。沖縄県北谷町を拠点に、LINE公式アカウント構築、ホームページ制作、業務システム開発、AI活用支援を行っています。', company_body, '/company', [ORG])

# ========== よくある質問 ==========
ALL_FAQ = TOP_FAQ + [q for q in PRICE_FAQ if q[0] not in ('初期費用はかかりますか？',)] + LINE_FAQ[:3] + WEB_FAQ[:4] + SYS_FAQ[:3] + AI_FAQ[:2]
faq_body = ph_hero('よくある質問', 'FAQ', 'よくある<br><em>ご質問</em>', '料金・契約・サービスの内容について、よくいただくご質問をまとめました。', ['料金・契約', 'LINE', 'ホームページ', 'システム', 'AI'], ill('Q-00', 'はてなマークが電球に変わる', '大きな「？」マークが、店主が見つめるうちに光る電球に変わっていく3コマ。シンプルで明るいタッチ。', 'sq')) + \
    sec('', faq_html(ALL_FAQ)) + cta_band()
PAGES['/faq'] = ('v4/faq.html', 'よくある質問｜料金・契約・サービスについて | RAIZON',
                 'RAIZONへのよくある質問。初期費用、支払い方法、解約、LINE公式アカウント、ホームページ、業務システム、AI活用について。', faq_body, '', [faq_ld(ALL_FAQ)])

# ========== お問い合わせ ==========
contact_body = ph_hero('お問い合わせ', 'CONTACT', 'まずは、今の「面倒」を<br><em>聞かせてください。</em>', '相談・お見積もりは無料です。営業はしません。2営業日以内にご連絡します。お急ぎの方は、LINEが便利です。', ['相談無料', '2営業日以内に返信', 'LINEは24時間受付'], ill('K-00', 'メッセージを送ると、笑顔で返事が返ってくる', 'スマホから紙飛行機のメッセージが飛び、向こう側でRAIZONの担当者が笑顔で受け取って返事を書いている。', 'sq')) + \
    sec('', f'''<form id="cform" class="form rv" novalidate>
<label>お名前<span class="rq">必須</span><input name="name" maxlength="100" autocomplete="name"></label>
<label>会社名・屋号<input name="company" maxlength="200" autocomplete="organization"></label>
<label>メールアドレス<span class="rq">必須</span><input name="email" type="email" maxlength="200" autocomplete="email"></label>
<label>電話番号<span class="rq">必須</span><input name="phone" type="tel" maxlength="40" autocomplete="tel"></label>
<label>ご興味のあるサービス<select name="services"><option value="">選んでください</option><option>LINE公式アカウント</option><option>ホームページ</option><option>業務システム・シフト管理</option><option>AI活用</option><option>まだ分からない</option></select></label>
<label>ご相談内容<span class="rq">必須</span><textarea name="message" maxlength="5000" placeholder="例）予約の電話が多くて困っています"></textarea></label>
<input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
<button class="btn btn-g" type="submit">送信する</button><p id="fmsg" role="status"></p>
<p class="note" style="text-align:center">LINEでのご相談は <a href="{LINE}" target="_blank" rel="noopener">こちら</a>（24時間受付）。お電話：080-6493-7744（9:00〜22:00）</p></form>''') + ''
PAGES['/contact'] = ('v4/contact.html', 'お問い合わせ｜無料相談 | RAIZON', 'RAIZONへのお問い合わせ。LINE公式アカウント構築、ホームページ制作、業務システム、AI活用のご相談は無料です。', contact_body, '')

for path, (fname, title, desc, body, active, *rest) in PAGES.items():
    ld = rest[0] if rest else None
    p = OUT / fname
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(layout(path, title, desc, body, active, ld), encoding='utf-8')
    print('wrote', fname)

doc = ROOT.parent / 'AI経営.RAIZON' / 'growth' / 'site-v4' / 'illustrations.md'
doc.parent.mkdir(parents=True, exist_ok=True)
seen = set(); lines = []
for i, t, d in ILLS:
    if i in seen: continue
    seen.add(i); lines.append(f'| {i} | {t} | {d} |')
doc.write_text('# サイトv4 イラスト一覧(差し込み枠)\n\n'
               'テイスト: フラットで明るい線と面のイラスト。色はLINEグリーン(#06C755)・チャコール(#26292D)・白を基本に、差し色は少なめ。人物はやさしい表情、顔は簡略化。文字・数字・実在のロゴは入れない。\n'
               'サイズ: 正方形の枠は1200×1200px、横長(wide)は1600×900px。PNG(背景透過)かWebP。\n\n'
               '| ID | 内容 | 描くもの(指示) |\n|---|---|---|\n' + '\n'.join(lines) + '\n', encoding='utf-8')
print('illustrations:', len(lines))
