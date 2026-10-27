const fs = require('fs');
const ph = (label) => `<div class="ph" aria-hidden="true"><span>${label}</span></div>`;
const IL = {work:'workweary_25562_color',waiter:'waiter_4304_color-1',hair:'hairdresser_25845_color',carpenter:'carpenter_20754_color',coat:'malewhitecoat_27579_color',clerk:'clerk_4237_color',youngM:'representative',consultM:'consult_15692_color',consultW:'consult_15709_color',consultM2:'consult_15719_color',creative:'creative_17623_color',wallet:'wallet_woman_8205_color',opW:'operator_guide_21265_color',opM:'operator_guide_21253_color',chatbot:'chatbot_21135_color',designW:'design_17597_color',mobile:'mobile_reservation_23570_color',wrench:'programming_icon_17567_color',chat:'chat_21151_color',ai:'ai_11772_color',mail:'mail_11207_color',prog:'programming_17549_color',form:'questionnaire_21373_color',inbox:'mail_11213_color',graph:'graph_17915_color',lock:'server_15162_color',lens:'business_point_17023_color',webinar:'webinar_2422_color'};
// 丸アイコン用: [顔の中心x%, y%, 拡大率]
// 背景が透明のイラスト(四角い枠なし)。assets/illust-t/ に、余白を切り落とした透明のWebPを置いている
const TI = {"design": [696, 554], "wallet": [710, 678], "consult": [752, 588], "chat": [800, 416], "bow": [440, 674]};
const tImg = (k, alt, cls) => { const t = TI[k]; return `<img class="ti ${cls||''}" src="assets/illust-t/${k}.webp" alt="${alt}" width="${t[0]}" height="${t[1]}" loading="lazy" decoding="async">`; };
const IW = {youngM:508}, IH = {youngM:635};
const FACE = {work:[50,35,2.4],waiter:[42,15,3.6],hair:[47,21,3.6],carpenter:[50,20,3.8],coat:[56,35,2.6],clerk:[50,18,3.8]};
const ill = (k, alt, cls) => { const f = cls==='il--face' && FACE[k]; const st = f ? ` style="transform:scale(${f[2]}) translate(${(50-f[0]).toFixed(1)}%,${(50-f[1]).toFixed(1)}%)"` : ''; return `<img class="il ${cls||''}"${st} src="assets/illust/${IL[k]}.webp" alt="${alt}" width="${IW[k]||1080}" height="${IH[k]||1080}" loading="lazy">`; };
const have = (k) => !!k && require('fs').existsSync('/Users/asahikijoka/Desktop/RAIZON-osaka/site/assets/illust/' + IL[k] + '.webp');
const frame = (cls, label, k0, alt, fit) => { const k = have(k0) ? k0 : null; return frame0(cls, label, k, alt, fit); };
const frame0 = (cls, label, k, alt, fit) => `<div class="frame ${cls}${k?' frame--il':''}">${k ? ill(k, alt||'', fit||'il--cover') : ph(label)}</div>`;
const st = (label, title) => `<div class="st"><div class="st__label">${label}</div><h2>${title}</h2></div>`;
const chunks = (arr) => arr.map(w => `<span class="inline">${w}</span>`).join('');
const arrow = '<i>→</i>';

const nav = [['#works','制作実績'],['#price','料金'],['#reason','選ばれる理由'],['#flow','導入の流れ'],['#faq','よくある質問'],['column/','コラム'],['#about','会社概要'],['#area','対応エリア']];
const navLinks = (extra) => nav.map(([h,l]) => `<a href="${h}"${h==='#works'?' data-nav="works"':''}>${l}</a>`).join('') + extra;

const ticker = ['東大阪のホームページ屋さん','制作費0円','月々9,800円','最低契約期間なし','ご相談は無料です'];
const tkHalf = [0,1].flatMap(() => ticker).map(t => `<span class="tk__i">${t}</span>`).join('');

const aruaru = [
  ['ホームページ、昔に知り合いが作ったきりやねん','町工場の社長','work'],
  ['電話番号変わったのに、まだ直せてへん','喫茶店のマスター','waiter'],
  ['スマホで見たら、字ぃ小さすぎて読まれへん','美容室のオーナー','hair'],
  ['作り直したいけど、何十万もかかるんやろ？','工務店の親方','carpenter'],
  ['更新のやり方、誰に聞いたらええかわからん','整骨院の院長','coat'],
  ['うちみたいな小さい店でも頼めるん？','開業したての店主','clerk']
];
const compare = [
  [['制作費用'],['0円'],['ツール代＋','自分の時間'],['高額に','なりやすい']],
  [['月額費用'],['9,800円','（税抜）'],['ツール','利用料'],['別途','保守契約']],
  [['デザイン'],['オリジナル'],['似た印象に','なりやすい'],['会社や','プランによる']],
  [['SSL・','サーバー'],['月額に','含まれる'],['自分で','管理'],['契約内容','による']],
  [['更新・修正'],['月4回まで','プラン内'],['自分で','対応'],['都度','見積もり']],
  [['契約期間'],['最低契約','期間なし'],['—'],['契約内容','による']],
  [['まとめ'],['作ったあとも','相談できる'],['手間は','自分持ち'],['納品後は','契約による']]
];
const areas = [
  ['東大阪市',['布施','小阪','八戸ノ里','若江岩田','河内花園','東花園','瓢箪山','石切','高井田','長田','鴻池']],
  ['周辺エリア',['大阪市','八尾市','その他の大阪府内','奈良県','京都府']],
  ['全国対応',['全国どこでも対応可能','遠方はオンラインでご相談']],
  ['業種',['町工場・製造業','飲食店','美容・サロン','整骨院・治療院','工務店・建設','士業','そのほか業種は問いません']]
];
const reasons = [
  ['01','テンプレートは使いません','既製のテンプレートに当てはめるのではなく、事業の内容やお客様、伝えたいことに合わせて一からデザインします。制作費0円でも、あなたの事業だけのホームページです。','イラスト：理由01（オリジナルデザインの制作例）','design','デザインをする女性のイラスト'],
  ['02','初期制作費が0円です','初期制作費は0円。月額料金で費用を管理しやすく、開業時など初期投資を抑えたい方にもご利用いただけます。公開後の月額料金や契約条件は、事前にすべてご説明します。','イラスト：理由02','wallet','財布を持つ男性のイラスト'],
  ['03','作ったあとも、気軽に聞けます','納品して終わりではありません。軽微な更新・修正のご依頼を通じて、公開後も関係を続けていきます。','イラスト：理由03','consult','電話で相談する女性のイラスト'],
  ['04','ホームページ以外のことも相談できます','公式LINE・業務システム・AI活用など、ホームページ以外のご相談もお受けします。月額プランには含まれず、内容を伺ったうえで別途お見積もりします。不要なサービスを売り込むことはありません。','イラスト：理由04','chat','チャットで相談するイラスト']
];
const features = [
  ['ホームページ制作','目的に合わせて、<span class="nb">オリジナルで制作</span>','オリジナルデザインで、目的に合わせたページ構成・導線設計を行います。スマホ最適化と文章作成サポートも含めて、ホームページを制作します。','イラスト：ホームページ制作','designW','デザインをする人のイラスト'],
  ['問い合わせ受付','メールフォームで、<span class="nb">問い合わせを受付</span>','メールフォームを設置して、お客様からのお問い合わせを受け付けます。Googleマップ連携・SNS連携・営業カレンダー・フォトギャラリーの設置にも対応します。','イラスト：問い合わせ受付','form','スマートフォンで入力するフォームのイラスト'],
  ['問い合わせ管理','届いた問い合わせを、<span class="nb">メールでお知らせ</span>','お問い合わせがあると、メールでお知らせします。内容を確認して、有効な問い合わせかどうかのチェックも行います。','イラスト：問い合わせ管理','inbox','メールを受信するイラスト'],
  ['アクセス分析','サイトの状況も、<span class="nb">分析結果もわかる</span>','アクセス解析を設置し、アクセス分析ツールを提供します。サイトの状況や分析結果も、あわせて確認できます。','イラスト：アクセス分析','graph','グラフと虫眼鏡のイラスト'],
  ['更新・修正','月4回の、<span class="nb">修正・更新に対応</span>','公開後も、月4回の修正・更新に対応します。承認後の修正・実装まで行います。','イラスト：更新・修正','wrench','歯車とレンチのイラスト'],
  ['公開・運用','ドメイン・SSL・サーバーも<span class="nb">おまかせ</span>','独自ドメインの取得、SSL対応（通信の暗号化）、サーバー管理まで対応します。','イラスト：公開・運用','lock','サーバーを管理する人のイラスト'],
  ['改善提案','SEO対策と、<span class="nb">改善提案</span>','SEO内部対策を行い、サイトの状況をもとに改善提案もします。なお、成果をお約束するものではありません。','イラスト：改善提案','lens','ひらめいた様子でパソコンを使う人のイラスト'],
  ['サポート','LINE・メールで相談、<span class="nb">セミナーも無料</span>','LINE・メールで、相談や更新の依頼ができます。無料オンラインセミナーにもご参加いただけます。','イラスト：サポート','webinar','オンラインセミナーのイラスト']
];
const steps = [
  ['01','お問い合わせ','フォームから、無料相談・資料請求をお申し込みください。','イラスト：お問い合わせ','mail','メールを送るイラスト'],
  ['02','ヒアリング・ご提案','ホームページの有無や事業の課題を伺い、制作内容と月額料金をご説明します。','イラスト：ヒアリング','consultM2','相談するイラスト'],
  ['03','制作・公開','ご契約・必要情報の受領後に制作し、内容をご確認いただいたうえで公開します。','イラスト：制作','prog','パソコンで制作するイラスト'],
  ['04','公開後のサポート','公開日から月額請求を開始。更新・修正のご依頼に対応します。','イラスト：サポート','opM','サポートするオペレーターのイラスト']
];
const faqGroups = [
  ['料金・契約',[
    ['初期費用は本当にかかりませんか？','初期制作費は0円です。月払いの場合のみ、初回の契約手数料5,000円（税抜）がかかります。月額9,800円（税抜）のお支払いは、ホームページの公開後から始まります。'],
    ['最低契約期間はありますか？','最低契約期間は設けていません。解約の条件やデータ・ドメインの扱いは、ご契約前にご説明します。'],
    ['ホームページ制作の費用は、どのくらいが相場ですか？','制作会社や内容によって、大きく異なります。制作時にまとまった費用がかかり、公開後の保守費用が別になる場合もあります。RAIZONは、初期制作費0円・月額9,800円（税抜）で、更新・修正までを含めたプランです。'],
    ['ホームページは何ページ作れますか？','6ページ構成で制作します。7ページ目以降のページ追加は、内容を伺ったうえで、別途お見積もりします。'],
    ['税込ではいくらになりますか？','月額9,800円（税抜）は、税込10,780円です。月払いの契約手数料5,000円（税抜）は税込5,500円、年払いの107,800円（税抜）は税込118,580円です。'],
    ['独自ドメインやサーバーの費用は、別にかかりますか？','独自ドメインの取得、SSL対応（通信の暗号化）、サーバー管理は、月額プランに含まれます。解約時のデータ・ドメインの扱いは、ご契約前にご説明します。'],
    ['月額料金の請求はいつから始まりますか？','ホームページの公開日から請求を開始します。制作期間中に月額料金は発生しません。'],
    ['年払いはありますか？','はい。年払いは、月額の12か月分のところ1か月分を割引した107,800円（税抜）で、初回の契約手数料も無料です。月々に直すと、約8,983円（税抜）です。'],
    ['年払いの途中で解約した場合、返金はありますか？','年払いは、1か月分を割り引いた金額での前払いのため、原則として、途中で解約された場合の返金はありません。ご契約前に、条件をご説明します。']]],
  ['制作',[
    ['格安だと、品質が心配です。大丈夫ですか？','制作費を0円にしている分、月額でご負担いただく形です。テンプレートに当てはめるのではなく、事業の内容に合わせてオリジナルでデザインします。公開前に内容をご確認いただき、ご納得のうえで公開します。'],
    ['個人事業主や、小さなお店でも頼めますか？','はい。個人事業主の方や、店舗・町工場など、小さな事業者さんのご相談を中心に承っています。ホームページ作りが初めての方も、お気軽にどうぞ。'],
    ['東大阪以外の場所でも頼めますか？','はい。大阪市・八尾市などの大阪府内はもちろん、奈良・京都をはじめ、全国から承っています。市外・遠方の方は、オンラインでご相談いただけます。'],
    ['相談だけでも大丈夫ですか？','はい。無料でご相談いただけます。相談したからといって、契約をすすめることはありません。'],
    ['ホームページを持っていなくても相談できますか？','はい。開業したばかりの方や、これからホームページを持ちたい方のご相談も承っています。'],
    ['古いホームページの見直しにも対応していますか？','はい。デザインが古い、スマートフォンで見にくい、情報が古いままといったホームページの整備にも対応します。']]],
  ['公開後',[
    ['公開後に内容を変更できますか？','軽微な更新・修正は、月4回までプランの範囲で対応します。新しいページの追加やデザイン全体の変更などは、別途お見積もりとなります。'],
    ['ホームページを作れば集客は増えますか？','集客の増加をお約束することはできません。情報発信の基盤を整え、公開後もお客さまに必要な改善を一緒に考えます。'],
    ['ホームページ以外のことも相談できますか？','はい、ご相談いただけます。公式LINE、業務システム、AI活用などは月額プランには含まれません。内容を伺ったうえで、別途お見積もりします。']]]
];
const faqJson = JSON.stringify(faqGroups.map(([label, items]) => ({ label, items })));

const mapQ = 'RAIZON%20%E5%A4%A7%E9%98%AA%E5%BA%9C%E6%9D%B1%E5%A4%A7%E9%98%AA%E5%B8%82%E4%B8%8B%E5%B0%8F%E9%98%AA5%E4%B8%81%E7%9B%AE7-20'; // Googleビジネスプロフィール「RAIZON 東大阪市」の店名＋住所
const mapQ_old = '%E5%A4%A7%E9%98%AA%E5%BA%9C%E6%9D%B1%E5%A4%A7%E9%98%AA%E5%B8%82%E4%B8%8B%E5%B0%8F%E9%98%AA5%E4%B8%81%E7%9B%AE7-20';
const field = (key, label, type, phd, ac, req) => `<label class="fm__f"><span class="fm__lab">${label}<span class="bdg${req?' bdg--req':''}">${req?'必須':'任意'}</span></span><input type="${type}" name="${key}" placeholder="${phd}" autocomplete="${ac}"><span class="fm__err" data-err="${key}"></span></label>`;
const cta = (title, title2, sub, photo, k, alt) => `<section class="cta"><div class="cta__in"><div class="cta__t"><h2><span class="inline">${title}</span><span class="inline">${title2}</span></h2><p>${sub}</p><div class="cta__b"><a class="btn" href="#contact">無料相談・資料請求${arrow}</a><a class="btn btn--o" href="#price">料金を見る${arrow}</a></div></div><div class="cta__p${k?' cta__p--il':''}">${k ? `<div class="cta__c">${ill(k, alt, 'il--contain')}</div>` : ph(photo)}</div></div></section>`;

const SITE = (process.env.SITE_URL || '').replace(/\/$/, '');
const TITLE = '東大阪のホームページ制作｜制作費0円・月額9,800円｜RAIZON';
const DESC = '東大阪市（小阪・布施・八戸ノ里・河内小阪）のホームページ制作会社RAIZON。個人事業主・中小企業向けに、初期制作費0円・月額9,800円（税抜）の月額制で制作します。月4回までの修正・更新込み、最低契約期間なし。Googleマップ対策のご相談もできます。';
const abs = (u) => SITE ? SITE + '/' + u : u;
const ld = [
  { '@context': 'https://schema.org', '@type': 'ProfessionalService', name: 'RAIZON', description: DESC,
    ...(SITE ? { url: SITE + '/', image: SITE + '/assets/ogp.png' } : {}),
    foundingDate: '2025-10', hasMap: 'https://www.google.com/maps/search/?api=1&query=RAIZON&query_place_id=ChIJCeDAeu3fAGAR14m9L3ba058', openingHoursSpecification: [{'@type': 'OpeningHoursSpecification', dayOfWeek: ['Sunday','Tuesday','Wednesday','Thursday','Friday','Saturday'], opens: '09:00', closes: '19:00'}], telephone: '+81-80-6493-7744',
    address: { '@type': 'PostalAddress', postalCode: '577-0803', addressRegion: '大阪府', addressLocality: '東大阪市', streetAddress: '下小阪5丁目7-20', addressCountry: 'JP' },
    areaServed: ['東大阪市', '大阪府', '奈良県', '京都府'],
    makesOffer: { '@type': 'Offer', name: 'ホームページ制作（月額プラン）', priceCurrency: 'JPY', price: '9800', description: '6ページ構成のホームページ制作。初期制作費0円・最低契約期間なし。価格は税抜。' } },
  { '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: faqGroups.flatMap(([, items]) => items.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } }))) }
];
// 制作イメージ(スマホ5台): 画像は Canva から書き出した高解像度版。並びは暗い・明るいが交互になるようにする
const SHOTS = [ // [ファイル名, 説明, 幅, 高さ, 色(d=黒系 / l=明るい系)]。黒系どうしが隣り合わないように並べる
  ['tenka', '理容室のホームページ（制作イメージ）', 500, 1003, 'd'],
  ['midori', '不動産会社のホームページ（制作イメージ）', 500, 1003, 'l'],
  ['izakaya', '居酒屋のホームページ（制作イメージ）', 500, 1001, 'd'],
  ['houkan', '訪問看護のホームページ（制作イメージ）', 500, 1002, 'l'],
  ['minato', '食堂のホームページ（制作イメージ）', 500, 1001, 'd'],
  ['english', '英会話教室のホームページ（制作イメージ）', 500, 1000, 'l'],
  ['cafe', 'カフェのホームページ（制作イメージ）', 500, 1002, 'd'],
  ['yamada', '製造業のホームページ（制作イメージ）', 500, 1004, 'l'],
  ['hair', '美容室のホームページ（制作イメージ）', 500, 1000, 'l']
];
const shotsHtml = (hide) => [...SHOTS, ...SHOTS].map(([k, alt, w, h, tone]) => `<div class="shots__i is-${tone}"><img src="assets/shots/${k}.webp" alt="${alt}" width="${w}" height="${h}" loading="lazy" decoding="async"></div>`).join('');
const colTop = fs.readdirSync('content/column').filter(f=>f.endsWith('.html')).map(f=>{const t=fs.readFileSync('content/column/'+f,'utf8');const g=k=>(t.match(new RegExp('^'+k+':\\s*(.+)$','m'))||[])[1];return {id:g('id'),title:g('title'),date:g('publishAt')};}).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,6).map(c=>`<li><a href="column/${c.id}/">${c.title}</a></li>`).join('');
const html = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${TITLE}</title>
<meta name="description" content="${DESC}">
${SITE ? '<meta name="robots" content="index, follow">' : '<!-- 公開前のため検索エンジンに載せない。SITE_URL を指定してビルドすると、この行は公開用になる -->\n<meta name="robots" content="noindex, nofollow">'}
${SITE ? `<link rel="canonical" href="${SITE}/">` : ''}
<meta property="og:type" content="website">
<meta property="og:locale" content="ja_JP">
<meta property="og:site_name" content="RAIZON">
<meta property="og:title" content="${TITLE}">
<meta name="keywords" content="東大阪,ホームページ制作,格安ホームページ制作,月額制,サブスク,初期費用0円,小阪,布施,八戸ノ里,河内小阪,個人事業主,中小企業,RAIZON">
<meta property="og:description" content="${DESC}">
${SITE ? `<meta property="og:url" content="${SITE}/">\n<meta property="og:image" content="${SITE}/assets/ogp.png">\n<meta name="twitter:card" content="summary_large_image">` : ''}
<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>
<link rel="icon" type="image/png" sizes="32x32" href="favicon-32.png?v=2">
<link rel="icon" type="image/png" sizes="48x48" href="favicon-48.png?v=2">
<link rel="icon" type="image/png" sizes="192x192" href="favicon-192.png?v=2">
<link rel="shortcut icon" href="favicon.ico?v=2">
<link rel="apple-touch-icon" href="apple-touch-icon.png?v=2">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&amp;display=swap" rel="stylesheet">
<link rel="stylesheet" href="style.css?v=80">
<script async src="https://www.googletagmanager.com/gtag/js?id=G-44W88GPXV5"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag("js",new Date());gtag("config","G-44W88GPXV5");</script>
<script type="text/javascript">(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","z1oezpeik6");</script>
</head>
<body id="top">
<header class="hd" id="hd">
  <div class="hd__in">
    <a class="hd__logo" href="#top" aria-label="RAIZON トップへ"><img src="assets/raizon-logo.webp" alt="RAIZON" width="69" height="48"></a>
    <nav class="hd__nav" aria-label="メインメニュー">${navLinks('<a class="hd__cta" href="#contact">無料相談・お問い合わせ</a>')}</nav>
    <button class="hd__btn" id="hdBtn" type="button" aria-label="メニューを開く" aria-expanded="false" aria-controls="hdPanel"><span></span><span></span><span></span></button>
  </div>
  <nav class="hd__panel" id="hdPanel" aria-label="スマートフォン用メニュー">${navLinks('<a class="hd__cta" href="#contact">無料相談・お問い合わせ</a>')}</nav>
</header>
<main>
<section class="fv">
  <div class="fv__in">
    <div class="fv__l">
      <div class="fv__lab">大阪府東大阪市のホームページ制作会社</div>
      <h1>東大阪の事業者さんに、<br><span class="mk">制作費<b>0</b>円</span>の<br>ホームページ制作を。</h1>
      <p class="fv__lead">個人事業主・中小企業のための、月額制のホームページ制作です。公開したあとの更新や修正も、気軽にご相談ください。</p>
      <div class="fv__price">
        <div class="pr"><span class="pr__k">月額</span><span class="pr__n">9,800</span><span class="pr__y">円</span><span class="pr__t">（税抜）</span></div>
        <div class="fv__tags"><span class="tag-k">初期制作費 0円</span><span class="tag-k">最低契約期間なし</span><span class="tag-t">税込 10,780円</span></div>
      </div>
      <div class="fv__btns"><a class="btn" href="#contact">無料相談・資料請求${arrow}</a><a class="btn btn--line" href="#price">料金を見る${arrow}</a></div>
    </div>
    <div class="fv__r"><noscript><style>.vis--wait .vis__pc,.vis--wait .vis__lid,.vis--wait .vis__sp{animation:none!important}</style></noscript><div class="vis vis--wait"><i class="vis__d1" aria-hidden="true"></i><i class="vis__d2" aria-hidden="true"></i><i class="vis__d3" aria-hidden="true"></i><div class="vis__pc" role="img" aria-label="パソコンで表示したホームページの制作イメージ"><span class="vis__lid"><img src="assets/mv-laptop-lid.webp" alt="ノートパソコンのイメージ" width="1199" height="667" fetchpriority="high"></span><i class="vis__shut" aria-hidden="true"></i><img class="vis__base" src="assets/mv-laptop-base.webp" alt="ノートパソコンの本体" width="1199" height="48" fetchpriority="high"></div><img class="vis__sp" src="assets/mv-phone.webp" alt="スマートフォンで表示したホームページの制作イメージ" width="474" height="959" fetchpriority="high"></div></div>
  </div>
</section>

<div class="tk" aria-hidden="true"><div class="mq">${tkHalf}${tkHalf}</div></div>

<section class="shots" aria-labelledby="shotsT">
  <div class="shots__in">
    <div class="shots__h"><div class="st__label" style="justify-content:center">制作イメージ</div><h2 id="shotsT">業種や雰囲気に合わせて、<span class="nb">一からデザインします</span></h2></div>
  </div>
  <div class="shots__v" role="group" aria-label="制作イメージ（横に流れます）"><div class="mq shots__m"><div class="shots__g">${shotsHtml(false)}</div><div class="shots__g" aria-hidden="true">${shotsHtml(true)}</div></div></div>
  <p class="shots__n">※掲載しているのは、制作実績と一部イメージ画像がございます。</p>
</section>

<section class="sec sec--tint">
  <div class="wrap">
    ${st('こんな声、よう聞きます','東大阪の事業者さん、こんなこと言うてません？')}
    <div class="aru">${aruaru.map(([t,w,k]) => `<div class="aru__c"><div class="bub" data-pop><div class="bub__in"><span class="bub__q" aria-hidden="true">「</span><span class="bub__t">${t}」</span></div></div><div class="aru__who"><div class="aru__ic">${ill(k,w+'のイラスト','il--face')}</div><span>${w}</span></div></div>`).join('')}</div>
    <div class="aru__bar"><p>それ、ぜんぶ<span class="mk2">RAIZONに相談してください。</span></p><a class="btn btn--white" href="#contact" style="min-width:220px">相談してみる${arrow}</a></div>
  </div>
</section>

<!-- 制作実績: 掲載許可が取れた会社だけ main.js の WORKS に追加する。0社のときはセクションごと非表示 -->
<section class="works" id="works" hidden>
  <div class="works__in">${st('制作実績','これまでに作ったホームページ')}</div>
  <div class="showcase" id="showcase" hidden><div class="mq mq--hover" id="showMq"></div></div>
  <div class="works__track" id="worksTrack"><div class="mq mq--hover" id="worksMq"></div></div>
  <div id="mockWrap" hidden>
    <div class="works__h"><h3>スマホで見ると、こんな感じです</h3><span>スマートフォンでも見やすく仕上げます。</span></div>
    <div class="mock"><div class="mq mq--hover" id="mockMq"></div></div>
  </div>
</section>

<section class="sec sec--gray" id="price">
  <div class="wrap">
    ${st('料金プラン','料金プランはひとつだけです')}
    <p class="pl__lead">お支払い方法は、<b>月払い</b>と<b>年払い</b>からお選びいただけます。</p>
    <div class="pl__six">
      <div class="pl__six__n"><b>6</b><small>ページ</small></div>
      <p class="pl__six__t"><b>構成のホームページを制作</b><span>事業に必要なページを、<span class="nb">6ページで</span>ご用意します</span></p>
      <div class="pl__six__pg" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></div>
    </div>
    <div class="plans plans--rc">
      <div class="pl__card pl__card--month">
        <div class="pl__ribbon">STANDARD<small>月払い</small></div>
        <div class="pl__rec pl__ghost" aria-hidden="true">★ おすすめ</div>
        <div class="pl__bubble">最初に大きなお金は、いりません！</div>
        <div class="pl__zero"><span>初期制作費</span><b>0<i>円</i></b></div>
        <div class="pl__plus" aria-hidden="true">＋</div>
        <div class="pr"><span class="pr__k">月額</span><span class="pr__n">9,800</span><span class="pr__y">円</span><span class="pr__t">（税抜）</span></div>
        <div class="pl__sub">税込 10,780円 ／ <span class="nb">最低契約期間なし</span></div>
        <div class="pl__save pl__ghost" aria-hidden="true">月払いにくらべて、1年で16,280円おトク（税込）</div>
        <dl class="rc" aria-label="月払いの内訳（1年間の目安）">
          <div><dt>初期制作費</dt><dd>0円</dd></div>
          <div><dt>契約手数料<small>（初回のみ）</small></dt><dd>5,000円</dd></div>
          <div><dt>月額<small>（公開日から）</small></dt><dd>9,800円 × 12か月</dd></div>
          <div class="rc__t"><dt>1年間の合計<small>（税抜）</small></dt><dd>122,600円<small>税込 134,860円</small></dd></div>
        </dl>
        <p class="pl__nudge">年払いなら、契約手数料が無料。<br class="sp">1年で<b>16,280円</b>おトクです<small>（税込）</small></p>
        <a class="btn btn--full" href="#contact">月払いで相談する${arrow}</a>
      </div>
      <div class="pl__card pl__card--year">
        <div class="pl__ribbon">STANDARD<small>年払い</small></div>
        <div class="pl__off" aria-hidden="true">1か月分<br><b>おトク！</b></div>
        <div class="pl__rec">おすすめ</div>
        <div class="pl__bubble">年払いは、契約手数料が無料！</div>
        <div class="pl__zero"><span>初期制作費</span><b>0<i>円</i></b></div>
        <div class="pl__plus" aria-hidden="true">＋</div>
        <div class="pr"><span class="pr__k">月々</span><span class="pr__n">8,983</span><span class="pr__y">円</span><span class="pr__t">（税抜）</span></div>
        <div class="pl__sub">年額 107,800円（税抜） ／ 税込 118,580円</div>
        <div class="pl__save">月払いにくらべて、1年で<b>16,280円</b>おトク<small>（税込）</small></div>
        <dl class="rc" aria-label="年払いの内訳">
          <div><dt>初期制作費</dt><dd>0円</dd></div>
          <div><dt>契約手数料<small>（初回）</small></dt><dd><s>5,000円</s> 無料</dd></div>
          <div><dt>年額<small>（12か月分から1か月分を割引）</small></dt><dd>107,800円</dd></div>
          <div class="rc__t"><dt>1年間の合計<small>（税抜）</small></dt><dd>107,800円<small>税込 118,580円</small></dd></div>
        </dl>
        <a class="btn btn--full" href="#contact">年払いで相談する${arrow}</a>
      </div>
    </div>
    <details class="inc">
      <summary><span class="inc__t"><b>プランに含まれるもの</b><small>ホームページの制作から、公開後の運用・改善まで</small></span><span class="inc__i" aria-hidden="true"></span></summary>
      <ul class="inc__l"><li>6ページ構成のホームページ制作</li><li>オリジナルデザイン</li><li>目的に合わせたページ構成・導線設計</li><li>スマホ最適化</li><li>文章作成サポート</li><li>フォトギャラリー設置</li><li>営業カレンダー設置</li><li>メールフォーム設置</li><li>Googleマップ連携</li><li>SNS連携</li><li>SEO内部対策</li><li>独自ドメイン取得</li><li>SSL対応（通信の暗号化）</li><li>サーバー管理</li><li>アクセス解析設置</li><li>アクセス分析ツールの提供</li><li>サイトの状況・分析結果の確認</li><li>問い合わせのメール通知</li><li>問い合わせの有効・無効チェック</li><li>改善提案</li><li>承認後の修正・実装</li><li>月4回の修正・更新</li><li>LINE・メールでの相談・更新依頼</li><li>無料オンラインセミナー</li></ul>
    </details>
    <details class="inc inc--pt">
      <summary><span class="inc__t"><b>料金のくわしい内訳</b><small>税込の金額・契約手数料・解約について</small></span><span class="inc__i" aria-hidden="true"></span></summary>
      <div class="pt">
        <div class="pt__w"><table class="pt__t">
          <thead><tr><th></th><th>月払い</th><th>年払い</th></tr></thead>
          <tbody>
            <tr><th>初期制作費</th><td>0円</td><td>0円</td></tr>
            <tr><th>契約手数料（初回）</th><td>5,000円<small>税込 5,500円</small></td><td>無料</td></tr>
            <tr><th>月額・年額</th><td>月額 9,800円<small>税込 10,780円</small></td><td>年額 107,800円<small>税込 118,580円（税抜で月々 約8,983円）</small></td></tr>
            <tr><th>お支払い</th><td>毎月</td><td>1年分を前払い</td></tr>
            <tr><th>最低契約期間</th><td>なし</td><td>なし</td></tr>
          </tbody>
        </table></div>
        <ul class="pt__n">
          <li><b>月額に含まれるもの：</b>6ページ構成のホームページ制作、独自ドメインの取得、SSL対応、サーバー管理、月4回の修正・更新など。上の「プランに含まれるもの」をご覧ください。</li>
          <li><b>月額に含まれないもの：</b>7ページ目以降のページ追加、デザイン全体の変更、公式LINE・業務システム・AI活用などのご相談は、内容を伺ったうえで、別途お見積もりします。</li>
          <li><b>解約について：</b>最低契約期間は設けていません。年払いは前払いのため、途中で解約された場合の返金は、原則としてありません。解約時のデータ・ドメインの扱いは、ご契約前にご説明します。</li>
          <li><b>月額料金のお支払い開始：</b>ホームページの公開日からです。制作期間中に、月額料金は発生しません。</li>
        </ul>
      </div>
    </details>
  </div>
</section>

<section class="sec">
  <div class="wrap">
    ${st('できること','月々の料金で、ここまでやります')}
    <div class="fcards" id="fcards">${features.map(([cat,t,body,p,k,alt],i) => `<button class="fc" type="button" data-i="${i}" aria-expanded="false" aria-controls="fd"><span class="fc__img">${frame('r-16-10',p,k,alt)}</span><span class="fc__cat">${cat}</span><strong class="fc__t">${t}</strong><span class="fc__more"><span class="fc__txt">詳しく見る</span><i aria-hidden="true"></i></span></button>`).join('')}</div>
    <script>window.FEATURES=${JSON.stringify(features.map(([cat,t,body]) => ({t:cat,b:body})))};</script>
  </div>
</section>

<section class="sec--gray cmp">
  <div class="cmp__in">
    <div class="st__label cmp__lab">比較</div>
    <h2 class="cmp__h"><span class="cmp__l">自分で作るか。</span><span class="cmp__l">制作会社に頼むか。</span><span class="cmp__l">公開後も<em>気軽に相談できるか。</em></span></h2>
    <div class="cmp__w">
      <table class="cmp__t">
        <colgroup><col class="c0"><col class="c1"><col class="c2"><col class="c3"></colgroup>
        <thead><tr><th></th><th class="me">RAIZON</th><th>${chunks(['自分で','作る'])}</th><th>${chunks(['一般的な','制作会社'])}</th></tr></thead>
        <tbody>${compare.map(([k,a,b,c]) => `<tr><th>${chunks(k)}</th><td class="me">${chunks(a)}</td><td>${chunks(b)}</td><td>${chunks(c)}</td></tr>`).join('')}</tbody>
      </table>
    </div>
    <p class="cmp__note">※自作・制作会社の内容は一般的な傾向です。</p>
  </div>
</section>

<section class="sec" id="reason">
  <div class="wrap">
    ${st('選ばれる理由','RAIZONに頼むと、何が違う？')}
    <div class="rs">${reasons.map(([n,t,b,p,k,alt]) => `<div class="rs__r"><div class="rs__fig">${tImg(k,alt)}</div><div class="rs__t"><div class="rs__no">理由 <b>${n}</b></div><h3>${t}</h3><p>${b}</p></div></div>`).join('')}</div>
  </div>
</section>

${cta('まずは、','話を聞かせてください','相談したからといって、契約をすすめることはありません。','イラスト：打ち合わせの様子','consultM','打ち合わせのイラスト')}

<section class="sec sec--gray" id="flow">
  <div class="wrap">
    ${st('導入の流れ','相談してから公開までの流れ')}
    <ol class="fl">${steps.map(([n,t,b,p,k,alt]) => `<li><span class="fl__n">${n}</span><h3>${t}</h3>${frame('r-4-3',p,k,alt)}<p>${b}</p></li>`).join('')}</ol>
  </div>
</section>

<section class="sec" id="faq">
  <div class="fq wrap">
    <div class="fq__l">
      ${st('よくある質問','よく聞かれること')}
      <div class="fq__tabs" role="tablist" id="faqTabs"></div>
    </div>
    <div class="fq__r" id="faqList">${faqGroups.flatMap(([, items]) => items.map(([q, a]) => `<div class="fq__s"><h3>${q}</h3><p>${a}</p></div>`)).join('')}</div>
  </div>
</section>

<section class="sec" id="column-top">
  <div class="wrap">
    ${st('コラム','東大阪でホームページを作る前に知っておきたいこと')}
    <ul class="ctop">${colTop}</ul>
    <p style="margin-top:16px"><a href="column/">コラム一覧を見る${arrow}</a>　<a href="area/kosaka/">小阪</a>・<a href="area/fuse/">布施</a>・<a href="area/yaenosato/">八戸ノ里</a>・<a href="area/kawachikosaka/">河内小阪</a>のホームページ制作</p>
  </div>
</section>

<section class="sec sec--tint" id="about">
  <div class="msg wrap">
    <div class="msg__fig">${tImg('bow','お辞儀をして、あいさつする男性のイラスト')}</div>
    <div>
      ${st('代表メッセージ','代表のあいさつ')}
      <div class="msg__t">
        <p>RAIZONは沖縄で始まりました。沖縄では、地元のお店のホームページや公式LINEづくりを手伝ってきました。結婚をきっかけに大阪に移り、今は東大阪を拠点にしています。</p>
        <p>場所が変わっても、相談される内容はあまり変わりません。「ホームページは欲しいけど、最初にまとまったお金は出しにくい」「作ったあと、誰に聞けばいいかわからない」。</p>
        <p>だから、初期制作費0円の月額制にしました。まずは事業の情報をきちんと載せられる場所を持ってもらいたいと思っています。</p>
        <p>ホームページを作れば必ずお客さんが増える、とは言いません。ただ、公開したあとも更新や相談に付き合い、必要なことがあれば一緒に考えます。</p>
        <p>ホームページのことで困ったときに、まず声をかけてもらえる存在でいたいと思っています。</p>
      </div>
    </div>
  </div>
  <div class="wrap about__ov">
    ${st('会社概要','RAIZONの会社概要')}
    <dl class="ab__i">
      <div><dt>屋号</dt><dd>RAIZON（ライゾン）</dd></div>
      <div><dt>事業内容</dt><dd>ホームページ制作・運用（月額制）</dd></div>
      <div><dt>所在地</dt><dd>〒577-0803　大阪府東大阪市下小阪5丁目7-20</dd></div>
      <div><dt>設立</dt><dd>2025年10月</dd></div>
      <div><dt>対応エリア</dt><dd>東大阪市・大阪府内、奈良・京都ほか全国（遠方はオンライン）</dd></div>
      <div><dt>電話</dt><dd><a href="tel:08064937744">080-6493-7744</a></dd></div>
      <div><dt>ご連絡</dt><dd><a href="#contact">お問い合わせフォーム</a>から承ります</dd></div>
    </dl>
  </div>
</section>

<section class="sec" id="area">
  <div class="area wrap">
    <div>
      ${st('対応エリア','事務所は東大阪の下小阪にあります')}
      <p class="area__lead">東大阪市内なら、お店や会社に伺ってのご相談もできます。奈良・京都をはじめ、全国どこでも対応可能です。遠方の方や、お忙しい方はオンラインでもどうぞ。</p>
      <p class="area__lead area__lead--s">近鉄奈良線・大阪線沿線（布施・河内小阪・八戸ノ里・若江岩田・河内花園・東花園・瓢箪山・石切）や、けいはんな線・大阪メトロ中央線沿線（長田・高井田）の事業者さんを中心に、大阪市・八尾市など、大阪府内のご相談もお受けしています。</p>
      <div class="area__g">${areas.map(([l,items]) => `<div><div class="area__lab">${l}</div><ul>${items.map(i => `<li>${i}</li>`).join('')}</ul></div>`).join('')}</div>
    </div>
    <div>
      <div class="map"><iframe title="RAIZON 事務所の地図" src="https://maps.google.com/maps?q=${mapQ}&amp;z=16&amp;output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe></div>
      <div class="map__f"><address><b>RAIZON</b>　〒577-0803 大阪府東大阪市下小阪5丁目7-20</address><a href="https://www.google.com/maps/search/?api=1&amp;query=RAIZON&amp;query_place_id=ChIJCeDAeu3fAGAR14m9L3ba058" target="_blank" rel="noopener">Googleマップで開く →</a><a href="https://search.google.com/local/writereview?placeid=ChIJCeDAeu3fAGAR14m9L3ba058" target="_blank" rel="noopener">Googleでクチコミを書く →</a></div><p class="ip-note" style="margin-top:14px">エリア別のご案内：<a href="area/kosaka/">小阪</a>　<a href="area/kawachikosaka/">河内小阪</a>　<a href="area/fuse/">布施</a>　<a href="area/yaenosato/">八戸ノ里</a></p>
    </div>
  </div>
</section>

<section class="sec sec--gray" id="contact">
  <div class="ct">
    ${st('お問い合わせ','お問い合わせフォーム')}
    <p class="ct__lead">無料相談・資料請求はこちらから。内容を確認のうえ、担当者よりご連絡します。</p>
    <div class="ct__card">
      <div class="done" id="done" role="status" hidden>
        <span class="done__ic">✓</span><h3>送信が完了しました</h3>
        <p>お問い合わせいただきありがとうございます。<br>内容を確認のうえ、担当者よりご連絡いたします。</p>
        <button type="button" id="again">続けて入力する</button>
      </div>
      <form class="fm" id="form" novalidate>
        <fieldset><legend>ご用件</legend><div class="fm__kinds">
          <label class="fm__kind"><input type="radio" name="kind" value="無料相談" checked>無料相談</label>
          <label class="fm__kind"><input type="radio" name="kind" value="資料請求">資料請求</label>
        </div></fieldset>
        <div class="fm__grid">
          ${field('company','会社名・屋号','text','例）株式会社〇〇','organization',false)}
          ${field('name','お名前','text','例）山田 太郎','name',true)}
          ${field('email','メールアドレス','email','例）info@example.com','email',true)}
          ${field('tel','電話番号','tel','例）06-0000-0000','tel',true)}
        </div>
        <label class="fm__f"><span class="fm__lab">ご予算<span class="bdg">任意</span></span>
          <select name="budget"><option value="">選択してください</option><option value="月額9,800円の基本プラン">月額9,800円の基本プラン</option><option value="追加ページ等も検討したい">追加ページ等も検討したい</option><option value="その他・別途相談したい">その他・別途相談したい</option><option value="未定">未定</option></select></label>
        <label class="fm__f"><span class="fm__lab">お問い合わせ内容<span class="bdg bdg--req">必須</span></span>
          <textarea name="message" rows="6" placeholder="ご相談内容をご記入ください"></textarea><span class="fm__err" data-err="message"></span></label>
        <div class="hp" aria-hidden="true"><label>website<input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>
        <div class="fm__agree"><label><input type="checkbox" name="agree"><span><a href="#privacy">プライバシーポリシー</a>に同意する</span></label><span class="fm__err" data-err="agree"></span></div>
        <span class="fm__fail" role="alert" id="fail"></span>
        <button class="fm__send" type="submit" id="send">入力内容を送信する</button>
      </form>
    </div>
  </div>
</section>

<section class="sec" id="privacy">
  <div class="pv">
    ${st('プライバシーポリシー','個人情報の取り扱いについて')}
    <div class="pv__b">
      <p>RAIZON（以下「当方」）は、当サイトでお預かりする個人情報を、以下の方針で適切に取り扱います。</p>
      <h3>1. 取得する情報</h3>
      <p>お問い合わせフォームでご入力いただく、ご用件、会社名・屋号、お名前、メールアドレス、電話番号、ご予算、お問い合わせ内容を取得します。このうち、ご用件・お名前・メールアドレス・電話番号・お問い合わせ内容は必須項目、会社名・屋号とご予算は任意項目です。</p>
      <h3>2. 利用目的</h3>
      <ul><li>お問い合わせ・資料請求への対応と、ご連絡のため</li><li>ご契約後の、サービス提供と連絡のため</li><li>サービスの改善の検討のため（個人を特定しない形に限ります）</li></ul>
      <h3>3. 第三者への提供</h3>
      <p>法令に基づく場合を除き、ご本人の同意なく、取得した個人情報を第三者に提供しません。</p>
      <h3>4. 業務の委託と外部サービス</h3>
      <p>当サイトの運営には、次の外部サービスを利用しています。いずれも、当サイトの提供に必要な範囲で利用しています。</p>
      <ul><li>ホスティング（サイトの配信と、フォームの受付）：GMOペパボ株式会社「ヘテムル」</li><li>メールの送受信：Google「Gmail」。フォームの内容は、当方の受信用メールに送られます</li><li>Webフォントの配信：Google Fonts。ページの表示時に、ブラウザからGoogleのサーバーへ、IPアドレス等が送信されます</li></ul>
      <p>アクセス解析：Google「Google アナリティクス」。サイトの利用状況を把握し、改善に役立てるため、Cookie等を通じて閲覧情報（閲覧ページ、閲覧環境、おおよその地域など。個人を特定しない形）を収集します。収集したデータはGoogleに送信されます。ブラウザの設定でCookieを無効にすることで、収集を拒否できます。詳しくは、<a href="https://policies.google.com/technologies/partner-sites?hl=ja" target="_blank" rel="noopener">Googleのポリシー</a>をご確認ください。当サイトでは、広告のための外部ツールは利用していません。</p>
      <p>画面の操作の分析：Microsoft「Microsoft Clarity」。サイトの使いやすさを改善するため、Cookie等を通じて、ページの閲覧・クリック・スクロールなどの操作の状況を、個人を特定しない形で記録・分析します。収集したデータはMicrosoftに送信されます。ブラウザの設定でCookieを無効にすることで、収集を拒否できます。詳しくは、<a href="https://privacy.microsoft.com/ja-jp/privacystatement" target="_blank" rel="noopener">Microsoftのプライバシーに関する声明</a>をご覧ください。</p>
      <h3>5. 安全管理</h3>
      <p>お預かりした情報は、不正なアクセス・紛失・漏えいを防ぐよう、適切に管理します。フォームの通信は暗号化（HTTPS）されます。</p>
      <h3>6. 保管期間</h3>
      <p>お問い合わせ内容は、対応の完了後、必要な期間のみ保管し、不要になった時点で削除します。</p>
      <h3>7. 開示・訂正・削除のご請求</h3>
      <p>ご自身の個人情報の開示・訂正・利用停止・削除をご希望の場合は、<a href="#contact">お問い合わせフォーム</a>からご連絡ください。ご本人であることを確認のうえ、対応します。</p>
      <h3>8. 方針の改定</h3>
      <p>この方針は、必要に応じて見直し、改定する場合があります。改定後は、このページに掲載します。</p>
      <p class="pv__d">制定日：2026年10月18日　事業者：RAIZON（大阪府東大阪市下小阪5丁目7-20）</p>
    </div>
  </div>
</section>
</main>

<footer class="ftr">
  <div class="ftr__in">
    <div class="ftr__l">
      <img src="assets/raizon-logo.webp" alt="RAIZON" width="91" height="64" loading="lazy">
      <p>ホームページ制作を通じて、事業の情報発信を支える。困ったときに気軽に相談できる、身近なパートナーを目指しています。</p>
      <address>〒577-0803　大阪府東大阪市下小阪5丁目7-20<br>電話 <a href="tel:08064937744">080-6493-7744</a></address>
      <dl class="ftr__meta"><div><dt>屋号</dt><dd>RAIZON</dd></div><div><dt>設立</dt><dd>2025年10月</dd></div></dl>
    </div>
    <nav aria-label="フッターメニュー">${nav.map(([h,l]) => `<a href="${h}"${h==='#works'?' data-nav="works"':''}>${l}</a>`).join('')}<a href="#contact">お問い合わせ</a><a href="#privacy">プライバシーポリシー</a></nav>
  </div>
  <nav class="ftr__sub" aria-label="業種別のご案内"><span>業種別のご案内</span><a href="industry/factory/">町工場・製造業</a><a href="industry/restaurant/">飲食店</a><a href="industry/salon/">美容室・サロン</a><a href="industry/clinic/">整骨院・治療院</a></nav><nav class="ftr__sub" aria-label="エリア別のご案内"><span>エリア別のご案内</span><a href="area/kosaka/">小阪</a><a href="area/kawachikosaka/">河内小阪</a><a href="area/fuse/">布施</a><a href="area/yaenosato/">八戸ノ里</a></nav>
  <div class="ftr__c">© 2026 RAIZON. All rights reserved.</div>
</footer>
<div class="sp-spacer"></div>
<div class="sp-cta"><a href="#price">料金を見る</a><a href="#contact">無料で相談する</a></div>
<script>window.FAQ=${faqJson};</script>
<script src="main.js?v=30"></script>
</body>
</html>
`;
fs.writeFileSync(require('path').join(__dirname, '..', 'site', 'index.html'), html);
console.log(html.length);
