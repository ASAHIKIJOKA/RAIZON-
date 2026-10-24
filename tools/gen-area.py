# エリア別ページ(site/area/<slug>/index.html)を作る。業種別ページ(salon)のヘッダー・フッター・部品を、そのまま使う。
# 使い方: python3 tools/gen-area.py   (その後、 node scripts/build-osaka.js でサイトを組み立てる)
import os, re, json

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'site/industry/salon/index.html')
OUT = os.path.join(ROOT, 'site/area')
DAY = '2026-10-24'
PLACE = 'ChIJCeDAeu3fAGAR14m9L3ba058'
MAP = f'https://www.google.com/maps/search/?api=1&amp;query=RAIZON&amp;query_place_id={PLACE}'
REVIEW = f'https://search.google.com/local/writereview?placeid={PLACE}'

AREAS = [
    ('kosaka', '小阪', 'こさか', '小阪'),
    ('kawachikosaka', '河内小阪', 'かわちこさか', '河内小阪'),
    ('fuse', '布施', 'ふせ', '布施'),
    ('yaenosato', '八戸ノ里', 'やえのさと', '八戸ノ里'),
]

src = open(SRC, encoding='utf-8').read()
head_end = src.index('<main>')
foot_start = src.index('</main>')
HEAD = src[:head_end]
FOOT = src[foot_start:]

# フッターの業種別ナビの下に、エリアのナビを足す
AREA_NAV = '<nav class="ftr__sub" aria-label="エリア別のご案内"><span>エリア別のご案内</span>' + ''.join(f'<a href="../../area/{s}/">{n}</a>' for s, n, _, _ in AREAS) + '</nav>'
SUB_RE = re.compile(r'(<nav class="ftr__sub" aria-label="業種別のご案内">.*?</nav>)', re.S)
FOOT = SUB_RE.sub(lambda m: m.group(1) + '\n  ' + AREA_NAV, FOOT, count=1)

ICON_CHECK = '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5 9-10"/></svg>'
ICON_PHONE = '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/></svg>'
ICON_PIN = '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s7-6 7-11a7 7 0 10-14 0c0 5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>'
ICON_EDIT = '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16v4z"/></svg>'


def esc(t): return t.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')


def page(slug, name, yomi, label):
    title = f'{name}のホームページ制作｜制作費0円・月額9,800円｜RAIZON'
    desc = f'{name}（東大阪市）の個人事業主・中小企業・お店向けに、ホームページを制作費0円・月額9,800円（税抜）で制作します。東大阪市下小阪の事務所から、ご相談に伺います。'
    faq = [
        ('ホームページを持つのは、初めてです。何から始めればいいですか？', '「どんな仕事をしているか」を、ひとことで教えてください。載せる内容は、一緒に整理します。'),
        (f'{name}の近くなら、来てもらえますか？', 'はい、東大阪市内なら、伺ってご相談できます。遠方の方は、オンラインでも大丈夫です。'),
        ('総額は、いくらですか？', '初期制作費0円、月額9,800円（税抜）です。月払いの場合は、初回に契約手数料5,000円（税抜）がかかります。'),
    ]
    ld = [
        {"@context": "https://schema.org", "@type": "WebPage", "name": title, "description": desc, "url": f"__SITE__/area/{slug}/", "inLanguage": "ja", "dateModified": DAY,
         "isPartOf": {"@type": "WebSite", "name": "RAIZON", "url": "__SITE__/"}},
        {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "ホーム", "item": "__SITE__/"},
            {"@type": "ListItem", "position": 2, "name": f"{name}のホームページ制作", "item": f"__SITE__/area/{slug}/"}]},
        {"@context": "https://schema.org", "@type": "Service", "name": f"{name}のホームページ制作", "serviceType": "ホームページ制作",
         "provider": {"@type": "ProfessionalService", "name": "RAIZON", "telephone": "+81-80-6493-7744",
                      "address": {"@type": "PostalAddress", "postalCode": "577-0803", "addressRegion": "大阪府", "addressLocality": "東大阪市", "streetAddress": "下小阪5丁目7-20", "addressCountry": "JP"}},
         "areaServed": {"@type": "Place", "name": f"東大阪市{name}"},
         "offers": {"@type": "Offer", "priceCurrency": "JPY", "price": "9800", "description": "初期制作費0円・月額9,800円(税抜)・最低契約期間なし"}},
        {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
            {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in faq]},
    ]
    head = HEAD
    head = re.sub(r'<html lang="ja" data-path="[^"]+">', f'<html lang="ja" data-path="/area/{slug}/">', head)
    head = re.sub(r'<title>.*?</title>', f'<title>{esc(title)}</title>', head, count=1)
    head = re.sub(r'<meta name="description" content="[^"]*">', f'<meta name="description" content="{esc(desc)}">', head, count=1)
    kw = f'{name}ホームページ制作,{name} ホームページ,東大阪,東大阪市,ホームページ制作,格安ホームページ制作,月額制,サブスク,初期費用0円,RAIZON'
    head = head.replace('<meta property="og:title"', f'<meta name="keywords" content="{kw}">\n<meta property="og:title"', 1)
    head = re.sub(r'<meta property="og:title" content="[^"]*">', f'<meta property="og:title" content="{esc(title)}">', head, count=1)
    head = re.sub(r'<meta property="og:description" content="[^"]*">', f'<meta property="og:description" content="{esc(desc)}">', head, count=1)
    head = re.sub(r'<script type="application/ld\+json">.*?</script>', lambda m: '<script type="application/ld+json">' + json.dumps(ld, ensure_ascii=False, separators=(',', ':')) + '</script>', head, count=1, flags=re.S)
    others = ''.join(f'<a href="../../area/{s}/"><b>{n}</b><span>→</span></a>' for s, n, _, _ in AREAS if s != slug)
    main = f'''<main>
<section class="ip-hero">
  <div class="ip-hero__in">
    <div class="ip-hero__l">
      <nav class="ip-bc" aria-label="パンくずリスト"><a href="../../">ホーム</a><span>/</span><span>{name}のホームページ制作</span></nav>
      <div class="fv__lab">{label}（{yomi}）の事業者さんへ</div>
      <h1>{name}のホームページを、<br><span class="mk">制作費<b>0</b>円</span>で。</h1>
      <p class="fv__lead">東大阪市下小阪の事務所から、お店・会社のホームページづくりをお手伝いします。</p>
      <div class="ip-chips"><span class="tag-k">月額 9,800円（税抜）</span><span class="tag-k">最低契約期間なし</span><span class="tag-k">6ページ構成</span></div>
      <div class="fv__btns"><a class="btn" href="../../#contact">無料相談・資料請求<i>→</i></a><a class="btn btn--line" href="../../#price">料金を見る<i>→</i></a></div>
    </div>
    <div class="ip-hero__r"><div class="ip-circle"><img src="../../assets/illust-t/consult.webp" alt="打ち合わせのイラスト" width="752" height="588" decoding="async"></div><i class="ip-dot ip-dot--y" aria-hidden="true"></i></div>
  </div>
</section>
<section class="sec sec--tint"><div class="wrap">
  <div class="st"><div class="st__label">こんなお悩み</div><h2>こんなこと、ありませんか？</h2></div>
  <ul class="ip-i"><li><span class="ip-i__ic">{ICON_PIN}</span><b>地図や検索で、見つけてもらいたい</b><small>近くの方に、お店を知ってほしい</small></li><li><span class="ip-i__ic">{ICON_PHONE}</span><b>今のホームページが、スマホで見にくい</b><small>古くなって、作り直したい</small></li><li><span class="ip-i__ic">{ICON_EDIT}</span><b>更新したいのに、手が回らない</b><small>営業時間や料金を、すぐ直したい</small></li></ul>
  <p class="ip-ans">それ、<span class="mk2">RAIZONにおまかせください。</span></p>
</div></section>
<section class="sec"><div class="wrap">
  <div class="st"><div class="st__label">できること</div><h2>{name}の事業者さんに、RAIZONができること</h2></div>
  <ul class="ip-i"><li><span class="ip-i__ic">{ICON_CHECK}</span><b>ホームページの制作</b><small>スマホで見やすい6ページ構成</small></li><li><span class="ip-i__ic">{ICON_EDIT}</span><b>公開後の更新・修正</b><small>月4回まで、月額に含まれます</small></li><li><span class="ip-i__ic">{ICON_PIN}</span><b>Googleマップへの載せ方の相談</b><small>お店・会社の情報の整え方</small></li></ul>
  <p class="ip-note">文章や写真が、そろっていなくても大丈夫です。お聞きしながら、一緒に整理します。</p>
</div></section>
<section class="sec sec--gray"><div class="wrap">
  <div class="st"><div class="st__label">事務所</div><h2>下小阪の事務所から、伺います</h2></div>
  <p class="ip-note" style="margin-top:0">〒577-0803　大阪府東大阪市下小阪5丁目7-20<br>電話 <a href="tel:08064937744">080-6493-7744</a>（9:00〜19:00・月曜定休）<br>東大阪市内なら、伺ってご相談できます。遠方の方は、オンラインでも大丈夫です。</p>
  <p class="ip-note"><a href="{MAP}" target="_blank" rel="noopener">Googleマップで開く →</a>　<a href="{REVIEW}" target="_blank" rel="noopener">Googleでクチコミを書く →</a></p>
</div></section>
<section class="sec"><div class="wrap">
  <div class="st"><div class="st__label">ご利用の流れ</div><h2>3ステップで、公開まで</h2></div>
  <ol class="ip-s"><li><span>1</span><b>無料相談</b><small>お悩みを聞かせてください</small></li><li><span>2</span><b>制作</b><small>文章づくりも、お手伝いします</small></li><li><span>3</span><b>公開・更新</b><small>月4回まで、修正OK</small></li></ol>
  <div class="ip-price"><div><small>初期制作費</small><b>0<i>円</i></b></div><div><small>月額（税抜）</small><b>9,800<i>円</i></b></div><div><small>ページ数</small><b>6<i>ページ</i></b></div><div><small>最低契約期間</small><b>なし</b></div></div>
  <p class="ip-note">メールフォーム・Googleマップ・独自ドメイン・SSL・サーバー管理まで、月額に含まれます。<br>月払いの場合は、初回に契約手数料5,000円（税抜）がかかります。</p>
</div></section>
<section class="sec sec--tint"><div class="wrap ip-faq">
  <div class="st"><div class="st__label">よくある質問</div><h2>はじめての方へ</h2></div>
  <div class="ip-faq__l">{''.join(f'<details><summary>{esc(q)}</summary><p>{esc(a)}</p></details>' for q, a in faq)}</div>
</div></section>
<section class="cta"><div class="cta__in"><div class="cta__t"><h2><span class="inline">まずは、</span><span class="inline">話を聞かせてください</span></h2><p>相談したからといって、契約をすすめることはありません。</p><div class="cta__b"><a class="btn" href="../../#contact">無料相談・資料請求<i>→</i></a><a class="btn btn--o" href="../../#price">料金を見る<i>→</i></a></div></div><div class="cta__p cta__p--il"><div class="cta__c ip-cc"><img src="../../assets/illust-t/consult.webp" alt="打ち合わせのイラスト" width="752" height="588" loading="lazy" decoding="async"></div></div></div></section>
<section class="sec"><div class="wrap">
  <div class="st"><div class="st__label">ほかのエリア・業種</div><h2>ほかのご案内</h2></div>
  <div class="ip-o" style="grid-template-columns:repeat(auto-fit,minmax(160px,1fr))">{others}<a href="../../industry/factory/"><b>町工場・製造業</b><span>→</span></a><a href="../../industry/restaurant/"><b>飲食店</b><span>→</span></a><a href="../../industry/salon/"><b>美容室・サロン</b><span>→</span></a><a href="../../industry/clinic/"><b>整骨院・治療院</b><span>→</span></a></div>
  <p class="art__back"><a href="../../">← トップページへ</a></p>
</div></section>
'''
    return head + main + FOOT


for slug, name, yomi, label in AREAS:
    d = os.path.join(OUT, slug)
    os.makedirs(d, exist_ok=True)
    open(os.path.join(d, 'index.html'), 'w', encoding='utf-8').write(page(slug, name, yomi, label))
    print('wrote', slug)
