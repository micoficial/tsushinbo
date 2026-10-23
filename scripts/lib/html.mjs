import { SITE_NAME, OPERATOR, SOURCES, INDUSTRY_BY_CODE, PREFS, METRICS } from './meta.mjs';
import { esc, fmt, avgText } from './format.mjs';

export const ORIGIN = process.env.SITE_ORIGIN || 'https://micoficial.github.io';
export const BASE = process.env.SITE_BASE || '/tsushinbo/';
export const abs = (p) => `${ORIGIN}${BASE}${p}`;
export const href = (p) => `${BASE}${p}`;

const PREF = new Map(PREFS.map((p) => [p.code, p]));
export const prefOf = (code) => PREF.get(code);
export const indOf = (code) => INDUSTRY_BY_CODE.get(code);

export const companyPath = (id) => `c/${id}/`;
export const prefPath = (p, metric) => `ken/${p.slug}/${metric ? `${metric.slug}/` : ''}`;
export const indPath = (i, metric) => `gyoshu/${i.slug}/${metric ? `${metric.slug}/` : ''}`;
export const rankPath = (metric) => (metric ? `ranking/${metric.slug}/` : 'ranking/');

let ASSET_V = '1';
export const setAssetVersion = (v) => { ASSET_V = v; };
let BUILD = { sources: {}, built: '' };
export const setBuildInfo = (b) => { BUILD = b; };
export const buildInfo = () => BUILD;

export function grade(n, label = true) {
  if (!n) return '<span class="g g0" aria-label="評定なし">—</span>';
  return `<span class="g g${n}"${label ? ` aria-label="評定${n}"` : ''}>${n}</span>`;
}

export function breadcrumbs(items) {
  // items: [[name, path|null], ...]
  const li = items.map(([name, p], i) => (p != null && i < items.length - 1
    ? `<li><a href="${href(p)}">${esc(name)}</a></li>`
    : `<li aria-current="page">${esc(name)}</li>`)).join('');
  const ld = {
    '@type': 'BreadcrumbList',
    itemListElement: items.map(([name, p], i) => ({ '@type': 'ListItem', position: i + 1, name, ...(p != null ? { item: abs(p) } : {}) })),
  };
  return { html: `<nav class="bc" aria-label="現在地"><ol>${li}</ol></nav>`, ld };
}

export function sourceLine(short = false) {
  const s = BUILD.sources;
  const a = `出典：<a href="${SOURCES.positivedb.url}" rel="noopener">${SOURCES.positivedb.name}</a>（${esc(s.positivedb)}時点）`;
  const b = `<a href="${SOURCES.shokuba.url}" rel="noopener">${SOURCES.shokuba.name}</a>（${esc(s.shokuba)}時点）`;
  return short ? `${a}、${b}を加工して作成` : `${a}、${b}のデータをもとに${OPERATOR}が加工して作成。国（厚生労働省）が作成したものではありません。`;
}

export function shareButtons(url, text) {
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(text);
  const hatena = url.replace(/^https:\/\//, 's/');
  return `<div class="share" data-url="${esc(url)}">
<span class="share-l">シェア</span>
<a class="sh sh-x" href="https://x.com/intent/post?text=${t}&amp;url=${u}" target="_blank" rel="noopener">X</a>
<a class="sh sh-line" href="https://social-plugins.line.me/lineit/share?url=${u}" target="_blank" rel="noopener">LINE</a>
<a class="sh sh-hb" href="https://b.hatena.ne.jp/entry/${esc(hatena)}" target="_blank" rel="noopener">はてブ</a>
<button class="sh sh-copy" type="button">リンクをコピー</button>
</div>`;
}

export function layout({ title, description, path, body, ld = [], noindex = false, ogTitle }) {
  const canonical = abs(path);
  const graph = ld.length ? `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': ld }).replace(/</g, '\\u003c')}</script>` : '';
  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(canonical)}">
${noindex ? '<meta name="robots" content="noindex">\n' : ''}<meta property="og:type" content="website">
<meta property="og:site_name" content="${SITE_NAME}">
<meta property="og:title" content="${esc(ogTitle || title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:image" content="${abs('assets/og.png')}">
<meta property="og:locale" content="ja_JP">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#1f3f73">
<link rel="icon" href="${href('assets/favicon.svg')}" type="image/svg+xml">
<link rel="apple-touch-icon" href="${href('assets/icon-180.png')}">
<link rel="stylesheet" href="${href(`assets/style.css?v=${ASSET_V}`)}">
<script defer src="${href(`assets/app.js?v=${ASSET_V}`)}"></script>
${graph}
</head>
<body>
<header class="hd">
<div class="wrap hd-in">
<a class="logo" href="${href('')}"><span class="logo-m" aria-hidden="true">通</span><span>${SITE_NAME}</span></a>
<form class="sb" role="search" action="${href('search/')}" data-base="${BASE}">
<input class="sb-i" name="q" type="search" placeholder="会社名で検索（例：トヨタ）" autocomplete="off" aria-label="会社名で検索" enterkeyhint="search">
<div class="sb-r" hidden></div>
</form>
<nav class="nv" aria-label="メニュー"><a href="${href('ranking/')}">ランキング</a><a href="${href('ken/')}">都道府県</a><a href="${href('gyoshu/')}">業種</a><a href="${href('about/')}">使い方</a></nav>
</div>
</header>
<main class="wrap">
${body}
</main>
<footer class="ft">
<div class="wrap">
<p class="ft-src">${sourceLine()}</p>
<p>数値は各社が自ら公表したもので、集計の範囲・時点は会社ごとに異なります。誤りに気づいたときは、各社の公表元（上記データベース）をご確認ください。</p>
<nav class="ft-nv"><a href="${href('')}">トップ</a><a href="${href('ranking/')}">ランキング</a><a href="${href('ken/')}">都道府県から探す</a><a href="${href('gyoshu/')}">業種から探す</a><a href="${href('about/')}">このサイトについて</a><a href="${href('about/#privacy')}">プライバシー</a></nav>
<p class="ft-c">© ${new Date().getFullYear()} ${OPERATOR}　｜　データ更新：${esc(BUILD.built)}</p>
</div>
</footer>
</body>
</html>
`;
}

// 項目ごとの評定を小さく並べる（総合ランキング用）
const MINI = { zangyo: '残', yukyu: '有', ikukyu: '育', kinzoku: '勤', kanri: '女', chingin: '賃', rishoku: '新' };
export function miniGrades(c) {
  return `<span class="mg">${METRICS.filter((m) => c.m[m.key] && !c.m[m.key].invalid).map((m) => `<i class="g${c.m[m.key].grade}" title="${m.label}：評定${c.m[m.key].grade}">${MINI[m.key]}${c.m[m.key].grade}</i>`).join('')}</span>`;
}

// ランキング表
export function rankTable(rows, metric, { showPref = true, showInd = true, valueOf } = {}) {
  const tr = rows.map(({ c, rank }) => {
    const x = metric ? c.m[metric.key] : null;
    const meta = [showInd ? indOf(c.ind)?.short : '', showPref ? prefOf(c.pref)?.name : '', c.size ? c.size.replace('～', '〜') : ''].filter(Boolean).join('・');
    if (!metric) {
      return `<tr><td class="rt-n">${rank}</td><td class="rt-c"><a href="${href(companyPath(c.id))}">${esc(c.name)}</a><small>${esc(meta)}</small>${miniGrades(c)}</td><td class="rt-v rt-avg">${avgText(c.avg)}<small>${c.gradeCount}項目</small></td></tr>`;
    }
    return `<tr><td class="rt-n">${rank}</td><td class="rt-c"><a href="${href(companyPath(c.id))}">${esc(c.name)}</a><small>${esc(meta)}</small></td><td class="rt-v">${valueOf(metric.key, x)}</td><td class="rt-g">${grade(x.grade)}</td></tr>`;
  }).join('\n');
  const head = metric ? `<th>順位</th><th>会社</th><th>${esc(metric.short)}</th><th>評定</th>` : '<th>順位</th><th>会社（項目ごとの評定）</th><th>平均評定</th>';
  return `<div class="tw"><table class="rt"><thead><tr>${head}</tr></thead><tbody>
${tr}
</tbody></table></div>`;
}

// 会社ページ下の「似た会社」用の軽い一覧
export function companyLinks(list) {
  return `<ul class="cl cl-s">${list.map((c) => `<li><a href="${href(companyPath(c.id))}">${esc(c.name)}<small>${c.avg != null ? `平均評定 ${avgText(c.avg)}` : `${c.gradeCount}項目`}・${esc(c.size ? c.size.replace('～', '〜') : '')}</small></a></li>`).join('')}</ul>`;
}

// 会社の一覧（カード）
export function companyList(list) {
  return `<ul class="cl">${list.map((c) => {
    const meta = [indOf(c.ind)?.short, prefOf(c.pref)?.name, c.size ? c.size.replace('～', '〜') : ''].filter(Boolean).join('・');
    return `<li><a href="${href(companyPath(c.id))}"><span class="cl-n">${esc(c.name)}</span><span class="cl-m">${esc(meta)}</span>${c.avg != null ? `<span class="cl-a">平均評定 <b>${avgText(c.avg)}</b></span>` : `<span class="cl-a">${c.gradeCount}項目</span>`}</a></li>`;
  }).join('')}</ul>`;
}

export function pager(basePath, page, pages) {
  if (pages <= 1) return '';
  const link = (p, label = p) => (p === page ? `<span aria-current="page">${label}</span>` : `<a href="${href(p === 1 ? basePath : `${basePath}${p}/`)}">${label}</a>`);
  const items = [];
  for (let p = 1; p <= pages; p++) {
    if (p === 1 || p === pages || Math.abs(p - page) <= 2) items.push(link(p));
    else if (items[items.length - 1] !== '…') items.push('…');
  }
  return `<nav class="pg" aria-label="ページ">${items.join('')}</nav>`;
}
