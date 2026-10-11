# サービス紹介ページ(/web・/system)を、consult.html と同じヘッダー・フッターで作る
# 使い方: python3 scripts/build-service-pages.py  → web.html / system.html を書き出す(内容はこのファイルを直す)
import json, re, html as H
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
base = (ROOT / 'consult.html').read_text(encoding='utf-8')
head_end = base.index('</head>')
body_start = base.index('<body class="rz3">')
main_start = base.index('<main>')
main_end = base.index('</main>') + len('</main>')

LINE_URL = 'https://line.me/R/ti/p/%40154yajce'
ORG = {"@type": "LocalBusiness", "name": "RAIZON", "url": "https://raizon-okinawa.com/",
       "address": {"@type": "PostalAddress", "addressRegion": "沖縄県", "addressLocality": "中頭郡北谷町", "streetAddress": "字砂辺301-7", "addressCountry": "JP"},
       "telephone": "080-6493-7744"}


def faq_html(faqs):
    return '\n'.join(f'      <details><summary>{q}</summary><p>{a}</p></details>' for q, a in faqs)


def page(slug, title, desc, h1, eyebrow, lead, badges, sections, faqs, service_name, service_type, price, ogt):
    url = f'https://raizon-okinawa.com/{slug}'
    ld = [
        {"@context": "https://schema.org", "@type": "Service", "name": service_name, "serviceType": service_type,
         "areaServed": {"@type": "AdministrativeArea", "name": "沖縄県"}, "provider": ORG, "url": url,
         "offers": {"@type": "Offer", "priceCurrency": "JPY", "price": price, "description": "月額(税別)。初期費用0円・最低契約期間なし"}},
        {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
            {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": re.sub('<[^>]+>', '', a)}} for q, a in faqs]},
        {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "ホーム", "item": "https://raizon-okinawa.com/"},
            {"@type": "ListItem", "position": 2, "name": service_name, "item": url}]},
    ]
    head = base[:head_end]
    head = re.sub(r'<title>.*?</title>', f'<title>{title}</title>', head, flags=re.S)
    head = re.sub(r'<meta name="description" content="[^"]*">', f'<meta name="description" content="{desc}">', head)
    head = re.sub(r'<link rel="canonical" href="[^"]*">', f'<link rel="canonical" href="{url}">', head)
    head = re.sub(r'<meta property="og:title" content="[^"]*">', f'<meta property="og:title" content="{ogt}">', head)
    head = re.sub(r'<meta property="og:description" content="[^"]*">', f'<meta property="og:description" content="{desc}">', head)
    head = re.sub(r'<meta property="og:url" content="[^"]*">', f'<meta property="og:url" content="{url}">', head)
    head = re.sub(r'<script type="application/ld\+json">.*?</script>',
                  '<script type="application/ld+json">\n' + json.dumps(ld, ensure_ascii=False) + '\n</script>', head, count=1, flags=re.S)
    badges_html = ''.join(f'<li>{b}</li>' for b in badges)
    main = f'''<main>
<nav aria-label="パンくずリスト" style="padding:20px 40px 0;"><div class="wrap" style="max-width:920px;font-size:13px;color:#6B7280;"><a href="/" style="color:#6B7280;">ホーム</a> ＞ {service_name}</div></nav>
<section style="padding:40px 40px 56px;">
  <div class="wrap" style="max-width:920px;">
    <div class="rz3-eyebrow">{eyebrow}</div>
    <h1 class="rz3-consult-h1">{h1}</h1>
    <p style="margin:24px 0 0;font-size:17px;line-height:2;color:#374151;">{lead}</p>
    <ul class="rz3-consult-badges">{badges_html}</ul>
    <div style="margin-top:36px;display:flex;flex-wrap:wrap;gap:14px;">
      <a href="{LINE_URL}" target="_blank" rel="noopener" class="btn btn-line">LINEで無料相談する →</a>
      <a href="/consult" class="btn btn-line-outline">無料WEB相談（30分）を見る</a>
    </div>
  </div>
</section>
{sections}
<section style="padding:70px 40px;">
  <div class="wrap" style="max-width:920px;">
    <div class="rz3-eyebrow green">FAQ</div>
    <h2 class="rz3-h2">よくあるご質問</h2>
    <div class="rz3-consult-faq">
{faq_html(faqs)}
    </div>
  </div>
</section>
<section style="padding:40px 40px 120px;">
  <div class="wrap" style="max-width:920px;">
    <div class="rz3-consult-book">
      <div class="rz3-eyebrow" style="color:#06C755;">CONTACT</div>
      <h2 class="rz3-h2" style="margin-top:12px;">まずは、今の困りごとを聞かせてください</h2>
      <p style="margin:16px 0 0;font-size:15px;line-height:1.9;color:#374151;">相談・お見積もりは無料です。営業はしません。LINEで、ひとこと送るだけで大丈夫です。</p>
      <div style="margin-top:24px;display:flex;flex-wrap:wrap;gap:12px;">
        <a href="{LINE_URL}" target="_blank" rel="noopener" class="btn btn-line">LINEで無料相談する →</a>
        <a href="/#price" class="btn btn-line-outline">料金プランを見る</a>
      </div>
      <p style="margin:18px 0 0;font-size:13px;line-height:1.9;color:#6B7280;">ほかのサービス：<a href="/line">LINE公式アカウント構築</a>／<a href="/web">ホームページ制作</a>／<a href="/system">業務システム・シフト管理</a></p>
    </div>
  </div>
</section>
</main>'''
    out = head + base[head_end:main_start] + main + base[main_end:]
    (ROOT / f'{slug}.html').write_text(out, encoding='utf-8')
    print('wrote', slug)


def sec(eyebrow, h2, inner, green=False):
    return f'''<section style="padding:70px 40px;">
  <div class="wrap" style="max-width:920px;">
    <div class="rz3-eyebrow{' green' if green else ''}">{eyebrow}</div>
    <h2 class="rz3-h2">{h2}</h2>
    {inner}
  </div>
</section>'''


def steps(items):
    return '<div class="rz3-consult-steps">' + ''.join(
        f'<div class="rz3-consult-step"><span class="rz3-consult-min">{n}</span><div><b>{t}</b><p>{d}</p></div></div>' for n, t, d in items) + '</div>'


def bullets(items):
    return '<ul style="margin:24px 0 0;padding:0;list-style:none;display:grid;gap:10px;">' + ''.join(
        f'<li style="background:#FFFFFF;border:1px solid #E5E9F0;border-radius:14px;padding:14px 18px;font-size:15px;line-height:1.8;">{i}</li>' for i in items) + '</ul>'


def price_box(rows, note):
    cards = ''.join(f'<div style="background:#FFFFFF;border:1px solid #E5E9F0;border-radius:18px;padding:18px 20px;"><div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:baseline;gap:4px 12px;"><b style="font-size:16px;">{a}</b><span style="font-family:Inter,sans-serif;font-weight:800;font-size:22px;color:#111827;">{b}<small style="font-size:12px;color:#6B7280;font-weight:700;">（税別）</small></span></div><p style="margin:8px 0 0;font-size:14px;line-height:1.8;color:#4B5563;">{c}</p></div>' for a, b, c in rows)
    return f'<div style="margin-top:24px;display:grid;gap:12px;">{cards}</div><p style="margin:12px 0 0;font-size:13px;line-height:1.8;color:#6B7280;">{note}</p>'


PRICE_NOTE = '表示は税別です（税込：BASIC 5,500円／STANDARD 12,980円／PREMIUM 26,180円〜）。初期費用0円・最低契約期間なし。LINE公式アカウントの利用料（LINEヤフー株式会社）は別途かかります。<a href="/#price">料金プランの詳細</a>'

# ---------- /web ホームページ制作 ----------
page(
    'web',
    '沖縄のホームページ制作｜月額11,800円〜・初期費用0円・LINE連携 | RAIZON',
    '沖縄の事業者向けのホームページ制作。初期費用0円、月額11,800円（税別）〜で、作成から更新、予約・問い合わせの導線、LINE公式アカウントとの連携まで。北谷町のRAIZON。',
    '沖縄のホームページ制作は、<br>月額で、<span style="color:#146EF5;">LINEと一緒に</span>。',
    'WEB SITE',
    '作って終わりのホームページではなく、予約や問い合わせにつながる「入口」として、作って、育てます。<br>初期費用0円、月額11,800円（税別）から。更新もおまかせいただけます。',
    ['初期費用0円', '月額11,800円（税別）〜', '更新もおまかせ', 'LINE・予約と連携', '最低契約期間なし'],
    '\n'.join([
        sec('PROBLEM', 'こんなお悩みはありませんか？', bullets([
            'ホームページがない、または何年も更新していない',
            'スマホで見ると、文字が小さくて読みにくい',
            '営業時間やメニューを変えたいのに、自分では直せない',
            'ホームページを見た人が、予約や問い合わせにつながっていない',
            '制作会社に頼むと、最初に数十万円かかると言われた'])),
        sec('FEATURE', 'RAIZONのホームページ制作', bullets([
            '<b>初期費用0円・月額制</b>：まとまった費用をかけずに始められます。作成も、その後の更新も、月額に含まれます。',
            '<b>LINE・予約と一体で設計</b>：ホームページを見た人が、LINEの友だち追加や予約へ、迷わず進めるように作ります。',
            '<b>スマホで見やすく、表示が速い</b>：お客様の多くはスマホで見ます。スマホでの見やすさと、表示の速さを優先します。',
            '<b>Googleで探されることも考えて作る</b>：地域名・業種で検索されたときに見つかりやすい構成にします。',
            '<b>3年以上のご利用で譲渡</b>：通算3年以上ご利用いただいたお客様には、ホームページのデータを譲渡できます（詳しくは利用規約に定めます）。']), green=True),
        sec('PRICE', '料金', price_box([
            ('LINE STANDARD｜LINE＋ホームページ', '月額11,800円', 'LINE公式アカウントの構築・運用に加えて、ホームページの作成・更新、予約・問い合わせの導線、配信設計・顧客管理'),
            ('LINE PREMIUM｜LINE＋HP＋システム', '月額23,800円〜', 'STANDARDに加えて、予約管理・顧客管理などの業務システム（<a href="/system">業務システム</a>）')], PRICE_NOTE)),
        sec('CASE', '制作事例', bullets([
            '<b>理容室運営会社様（北谷町）</b>：ホームページ・LINE・予約システムを一つの流れにつなげ、予約から顧客管理までを仕組みにしました。<a href="/blog/case-tenkabito">事例を読む</a>',
            '<b>沖縄そば専門パーラー様</b>：お店の雰囲気と場所が伝わり、ドライブ中の方も迷わず来店できるホームページを制作しました。<a href="/blog/case-parlor-minato">事例を読む</a>'])),
        sec('FLOW', '制作の流れ', steps([
            ('1', '無料相談', 'LINEまたはWEB相談で、お店のこと、困っていることをお聞きします。'),
            ('2', 'ご提案', 'ページの構成と、LINE・予約とのつなぎ方をご提案します。'),
            ('3', '制作', '写真や文章をいただき、制作します。途中で画面を見ながら確認していただけます。'),
            ('4', '公開', '内容を確認していただいてから、公開します。'),
            ('5', '更新・改善', '営業時間やメニューの変更など、公開後の更新もおまかせください。')]), green=True),
    ]),
    [
        ('買い切りの制作と、何が違いますか？', '最初にまとまった費用がかからず、公開後の更新や改善も月額に含まれます。作って終わりではなく、お店の変化に合わせて育てられます。'),
        ('ホームページだけをお願いできますか？', 'ホームページは、LINE公式アカウントと組み合わせたSTANDARDプラン（月額11,800円・税別）でご提供しています。お客様をLINEや予約につなげるところまでを、一緒に設計します。'),
        ('ドメイン（〇〇.com など）は、誰の名義になりますか？', 'お客様の名義で取得することをおすすめしています。ご契約が終わっても、ドメインはお客様の手元に残ります。'),
        ('解約したら、ホームページはどうなりますか？', '通算3年以上ご利用のお客様には、ホームページのデータを譲渡できます。3年未満の場合は、契約の終了日で公開を停止します。解約は、解約したい月の前月末日までにご連絡ください。'),
        ('写真や文章は、用意しないといけませんか？', 'お手元の写真や、お店の説明をいただければ、文章はこちらで整えます。写真が少ない場合も、ご相談ください。'),
    ],
    '沖縄のホームページ制作', 'ホームページ制作', '11800',
    '沖縄のホームページ制作｜月額11,800円〜 | RAIZON',
)

# ---------- /system 業務システム・シフト管理 ----------
page(
    'system',
    '業務システム・シフト管理アプリの制作｜沖縄の中小企業向け | RAIZON',
    '沖縄の中小企業・店舗向けに、シフト提出・予約管理・顧客管理などの業務システムを制作します。LINEと連携し、紙・Excel・電話の作業を減らします。月額23,800円（税別）〜、初期費用0円。',
    '紙・Excel・電話の作業を、<br><span style="color:#146EF5;">業務システム</span>でラクに。',
    'SYSTEM',
    'シフト提出、予約管理、顧客管理など、毎日の「面倒な作業」を、お店や会社のやり方に合わせた仕組みにします。<br>LINEと連携して、スタッフもお客様も使いやすく。',
    ['シフト提出・管理', '予約・顧客管理', 'LINEと連携', '初期費用0円', '月額23,800円（税別）〜'],
    '\n'.join([
        sec('PROBLEM', 'こんな作業に、時間を取られていませんか？', bullets([
            'スタッフのシフト希望が、紙・口頭・LINEでバラバラに届き、集計に時間がかかる',
            '予約の管理が、電話とノートやExcelに分かれている',
            'お客様の情報が、担当者の頭の中やメモにしかない',
            '同じ入力や転記を、毎日・毎月くり返している',
            '既製のアプリを試したが、お店のルールに合わなかった'])),
        sec('SOLUTION', 'つくれるもの', bullets([
            '<b>シフト提出・管理</b>：スタッフがスマホから希望を提出し、管理者が一覧で確認・承認。欠勤の申請や、提出時の通知も。<a href="/blog/shift-submission-line-web-app">シフト提出の仕組みを詳しく見る</a>',
            '<b>予約管理・顧客管理</b>：LINEからの予約を一覧で管理し、来店履歴やメモを残せます。',
            '<b>LINEとの連携</b>：お知らせ・リマインド・確認の連絡を、LINEで自動で届けます。',
            '<b>毎日のくり返し作業の自動化</b>：転記や集計、定型の連絡を、できるところから自動にします。',
            '<b>AIの活用</b>：文章の下書きや情報の整理など、業務に合う使い方をご提案します。']), green=True),
        sec('CASE', '導入事例：ビル管理会社様のシフト提出', bullets([
            '<b>課題</b>：スタッフのシフト提出が個別のやり取りで、確認や集計に手間がかかっていた。',
            '<b>つくったもの</b>：スタッフはスマホでシフトを提出・欠勤を申請、管理者は一覧で承認。提出や申請があると、管理者にメールで通知。',
            '<b>ポイント</b>：LINEは「お知らせ」、Webアプリは「管理」と役割を分け、日常の業務に合わせて設計しました。<a href="/blog/case-shinya-facility">事例を読む</a>'])),
        sec('PRICE', '料金', price_box([
            ('LINE PREMIUM｜LINE＋HP＋システム', '月額23,800円〜', 'LINE公式アカウントとホームページに加えて、業務システムの設計・構築・運用、業務の自動化・連携、定期的な改善ミーティング。金額は、システムの内容によってお見積もりします。')], PRICE_NOTE)),
        sec('FLOW', '導入の流れ', steps([
            ('1', '今の流れを聞く', '紙・Excel・電話など、今どのように作業しているかをお聞きします。'),
            ('2', '必要なものを決める', '全部を一度に作らず、効果の大きいところから、必要な機能を決めます。'),
            ('3', '作って、試す', '少人数で試していただき、使いにくいところを直します。'),
            ('4', '本番で使う', 'スタッフの皆さまへの説明もお手伝いします。'),
            ('5', '改善を続ける', '使いながら、ルールの変化に合わせて改善します。')]), green=True),
    ]),
    [
        ('既製のシフト管理アプリと、何が違いますか？', '既製のアプリで足りる場合は、それが一番手軽です。お店独自のルールがある場合や、LINE・ホームページと一体で整えたい場合に、専用の仕組みが向いています。どちらが合うかも、ご相談の中で一緒に考えます。'),
        ('スタッフ全員が、スマホを使いこなせるか心配です。', '画面はシンプルにし、使い方の説明もお手伝いします。一部のスタッフから使い始めることもできます。'),
        ('スタッフやお客様の情報は、安全に扱われますか？', '権限の管理とパスワードの管理を徹底し、お預かりした情報は、サービスの提供のためにのみ使います。医療・介護など配慮が必要な情報を扱う場合は、事前にご相談ください。'),
        ('解約したら、システムはどうなりますか？', 'お客様の環境（お客様のアカウントやツール）に組み込んだ仕組みは、そのまま使い続けられます。RAIZONが製作し、RAIZONの環境で動くアプリは、停止または料金のご相談となります。データはご希望によりお渡しします。'),
        ('費用はどのくらいですか？', '月額23,800円（税別）からです。作るものの内容によってお見積もりします。初期費用は0円です。'),
    ],
    '業務システム・シフト管理', '業務システム開発', '23800',
    '業務システム・シフト管理アプリの制作 | RAIZON',
)
