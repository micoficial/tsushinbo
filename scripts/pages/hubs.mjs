import { METRICS, PREFS, INDUSTRIES, SITE_NAME, BAND_NAME, RANK_BAND_LABEL, SOURCES, OPERATOR, OPERATOR_ID, CONTACT } from '../lib/meta.mjs';
import { esc, fmt, comma, avgText } from '../lib/format.mjs';
import { layout, breadcrumbs, href, abs, rankTable, companyList, pager, grade, companyPath, prefPath, indPath, rankPath, prefOf, indOf, buildInfo, sourceLine, shareButtons } from '../lib/html.mjs';
import { valueShort, medianShort } from '../lib/text.mjs';

export const OVERALL = {
  key: 'sougou', slug: 'sougou', short: '総合', label: '働きやすさ総合',
  rankTitle: '働きやすさ総合ランキング（ホワイト企業ランキング）',
  rankLead: '公表している項目の評定（5段階）の平均が高い順（5項目以上を公表している会社が対象）',
};
const YEAR = new Date().getFullYear();
const ALL = [OVERALL, ...METRICS];

const metricLinks = (pathOf, current) => `<nav class="chips" aria-label="指標">${ALL.map((m) => (m === current
  ? `<span aria-current="page">${esc(m.short)}</span>`
  : `<a href="${href(pathOf(m))}">${esc(m.short)}</a>`)).join('')}</nav>`;

// 読み違えやすい指標の説明
const DEFS = {
  zangyo: 'この「残業時間」は国の定義にしたがい、1年間の総労働時間から法定労働時間（週40時間）を引いて月平均にした値です。所定の勤務時間が短い会社（1日7時間半など）は、所定を超えて働いても0時間になることがあります。「0時間」は残業がまったくないという意味ではありません。各社のページに会社の注記を載せています。',
  ikukyu: '育児休業の取得率は「その年度に子が生まれた人」に対する「その年度に育休を始めた人」の割合です。年度がずれるため100%を超えることがあり、ここでは100%として並べています。取得日数の長さは含みません。',
  yukyu: '有給休暇の取得率は、付与された日数に対して取得した日数の割合です。繰り越した日数の扱いにより100%を超えることがあり、ここでは100%として並べています。',
  chingin: '男女の賃金の差異は、男性の平均賃金を100としたときの女性の平均賃金です。役職や勤続年数の違いも含んだ数字で、同じ仕事での賃金の差を表すものではありません。',
  rishoku: 'しょくばらぼに公表された、直近3年度の新卒者等の採用者数と離職者数の合計から計算した目安です（採用が10人以上の会社のみ）。',
};
const metricDef = (m) => (DEFS[m.key] ? `<p class="def">${DEFS[m.key]}</p>` : '');

// ===== トップ =====
export function renderTop(ctx) {
  const info = buildInfo();
  const sample = ctx.sample;
  const tiles = ALL.map((m) => {
    const rows = m === OVERALL ? ctx.overallByBand.L.slice(0, 3).map((c, i) => ({ c, rank: i + 1 })) : ctx.national[m.key].L.slice(0, 3);
    return `<li class="tile"><a class="tile-h" href="${href(rankPath(m === OVERALL ? OVERALL : m))}">${esc(m === OVERALL ? '総合（ホワイト企業）' : m.rankTitle.replace('ランキング', ''))}</a>
<ol>${rows.map(({ c, rank }) => `<li><span>${rank}</span><a href="${href(companyPath(c.id))}">${esc(c.name)}</a><em>${m === OVERALL ? avgText(c.avg) : valueShort(m.key, c.m[m.key])}</em></li>`).join('')}</ol></li>`;
  }).join('');
  const body = `<section class="hero">
<p class="hero-k">無料・登録なし・${comma(ctx.published.length)}社</p>
<h1>会社の<span>通信簿</span></h1>
<p class="hero-l">残業時間・有給取得率・男性の育休・勤続年数・離職率。会社が国のデータベースで公表している「働きやすさの数字」を、同じ業種・同じ規模の会社と比べて<b>5段階の評定</b>にしました。</p>
<form class="sb sb-big" role="search" action="${href('search/')}">
<input class="sb-i" name="q" type="search" placeholder="会社名を入れてください（例：トヨタ自動車）" autocomplete="off" aria-label="会社名で検索" enterkeyhint="search">
<div class="sb-r" hidden></div>
</form>
<p class="hero-ex">よく見られている会社：${ctx.featured.map((c) => `<a href="${href(companyPath(c.id))}">${esc(c.name.replace(/株式会社/g, ''))}</a>`).join('')}</p>
</section>
${sample ? `<section class="card sample"><h2>通信簿の見本：<a href="${href(companyPath(sample.id))}">${esc(sample.name)}</a></h2>
<div class="sample-g">${METRICS.filter((m) => sample.m[m.key] && !sample.m[m.key].invalid).map((m) => `<div><span>${esc(m.label)}</span>${grade(sample.m[m.key].grade)}<small>${valueShort(m.key, sample.m[m.key])}</small></div>`).join('')}</div>
<p class="note">5＝同じ業種・規模の上位7%、3＝真ん中、1＝下位7%。学校の通信簿と同じ相対評価です。</p></section>` : ''}
<section class="sec"><h2>ランキング（大企業の上位3社）</h2><ul class="tiles">${tiles}</ul><p class="more"><a href="${href('ranking/')}">すべてのランキングを見る（中堅・中小企業、都道府県別、業種別も）</a></p></section>
<section class="sec"><h2>都道府県から探す</h2>${prefGrid(ctx)}</section>
<section class="sec"><h2>業種から探す</h2>${indGrid(ctx)}</section>
<section class="card why"><h2>なぜ無料なのか</h2>
<p>就職四季報のような有料の本や、口コミサイトの有料会員でしか見られないと思われがちな「残業時間」「有給の取得率」「新卒の離職」などの数字は、実は多くの会社が国のデータベースで公表しています。ただ、国のサイトは1社ずつしか見られず、ほかの会社と比べにくいのが難点でした。</p>
<p>${SITE_NAME}は、そのデータ（${comma(ctx.counts.positivedbRows)}社分）をAIで整理し、業種・規模が同じ会社の中での位置を自動で計算して、5段階の評定にしています。人の手で調べて書く代わりにAIとプログラムで処理しているので、無料で、新しいデータが出るたびに作り直せます。</p>
<p class="more"><a href="${href('about/')}">データと評定のつけ方をくわしく見る</a></p></section>
<p class="updated">データ：${esc(info.sources.positivedb)}・${esc(info.sources.shokuba)}時点（${esc(info.built)}に更新）</p>`;
  const ld = [{
    '@type': 'WebSite', name: SITE_NAME, url: abs(''), inLanguage: 'ja',
    potentialAction: { '@type': 'SearchAction', target: `${abs('search/')}?q={search_term_string}`, 'query-input': 'required name=search_term_string' },
  }];
  return layout({
    title: `${SITE_NAME}｜残業時間・有給取得率・育休・離職率を公的データで5段階評定（無料）`,
    description: `会社の残業時間・有給休暇取得率・男性の育休取得率・平均勤続年数・新卒の離職などを、国の公開データから${comma(ctx.published.length)}社分まとめて5段階で評定。ホワイト企業ランキング、都道府県別・業種別ランキングも。無料・登録不要。`,
    path: '', body, ld,
  });
}

function prefGrid(ctx) {
  return `<ul class="grid">${PREFS.map((p) => `<li><a href="${href(prefPath(p))}">${esc(p.short)}<small>${comma((ctx.byPref.get(p.code) || []).length)}</small></a></li>`).join('')}</ul>`;
}
function indGrid(ctx) {
  return `<ul class="grid grid-w">${INDUSTRIES.filter((i) => (ctx.byInd.get(i.code) || []).length).map((i) => `<li><a href="${href(indPath(i))}">${esc(i.short)}<small>${comma((ctx.byInd.get(i.code) || []).length)}</small></a></li>`).join('')}</ul>`;
}

// ===== ランキング一覧 =====
export function renderRankingIndex(ctx) {
  const bc = breadcrumbs([['トップ', ''], ['ランキング', null]]);
  const body = `${bc.html}
<header class="ph"><h1>働きやすさランキング一覧</h1>
<p class="lead">会社が国のデータベースで公表した数字をもとにしたランキングです。大企業（1001人以上）・中堅企業（301〜1000人）・中小企業（101〜300人）に分けて並べています。</p></header>
<section class="sec"><h2>全国のランキング</h2><ul class="links-l">${ALL.map((m) => `<li><a href="${href(rankPath(m))}">${esc(m.rankTitle)}</a><small>${esc(m.rankLead)}</small></li>`).join('')}</ul></section>
<section class="sec"><h2>都道府県別のランキング</h2>${prefGrid(ctx)}</section>
<section class="sec"><h2>業種別のランキング</h2>${indGrid(ctx)}</section>`;
  return layout({
    title: `働きやすさランキング一覧｜ホワイト企業・残業・有給・育休・離職｜${SITE_NAME}`,
    description: '残業が少ない会社、有給取得率が高い会社、男性の育休取得率が高い会社などのランキング一覧。国の公開データをもとに、大企業・中堅・中小企業別、都道府県別、業種別に掲載。',
    path: 'ranking/', body, ld: [bc.ld],
  });
}

// ===== 全国ランキング（指標ごと） =====
export function renderRanking(ctx, m) {
  const isAll = m === OVERALL;
  const bc = breadcrumbs([['トップ', ''], ['ランキング', 'ranking/'], [m.rankTitle, null]]);
  const bands = ['L', 'M', 'S'];
  const sections = bands.map((b) => {
    const rows = isAll ? ctx.overallByBand[b].slice(0, 100).map((c, i) => ({ c, rank: i + 1 })) : ctx.national[m.key][b].slice(0, 100);
    const total = isAll ? ctx.overallByBand[b].length : ctx.national[m.key][b].length;
    if (!rows.length) return '';
    return `<section class="sec" id="${b}"><h2>${BAND_NAME[b]}（${RANK_BAND_LABEL[b]}）の${esc(m.rankTitle.replace(/（.*）/, ''))}</h2>
<p class="note">対象：${comma(total)}社。上位${rows.length}社を表示。</p>
${rankTable(rows, isAll ? null : m, { valueOf: valueShort })}</section>`;
  }).join('\n');
  const top3 = (isAll ? ctx.overallByBand.L.slice(0, 3) : ctx.national[m.key].L.slice(0, 3).map((r) => r.c)).map((c) => c.name).join('、');
  const body = `${bc.html}
<header class="ph"><p class="eyebrow">${YEAR}年版・公的データ</p><h1>${esc(m.rankTitle)}</h1>
<p class="lead">${esc(m.rankLead)}に並べました。数値は各社が国のデータベース（${esc(SOURCES.positivedb.name)}・しょくばらぼ）で公表したものです。大企業の1位は${esc(top3.split('、')[0] || '—')}でした。</p>
<nav class="jump"><a href="#L">大企業</a><a href="#M">中堅企業</a><a href="#S">中小企業</a></nav></header>
${metricLinks(rankPath, m)}
${metricDef(m)}
${sections}
<section class="card"><h2>都道府県・業種で絞りこむ</h2>
<p class="sub">都道府県別</p><ul class="grid">${PREFS.map((p) => `<li><a href="${href(prefPath(p, m))}">${esc(p.short)}</a></li>`).join('')}</ul>
<p class="sub">業種別</p><ul class="grid grid-w">${INDUSTRIES.filter((i) => (ctx.byInd.get(i.code) || []).length).map((i) => `<li><a href="${href(indPath(i, m))}">${esc(i.short)}</a></li>`).join('')}</ul></section>
${shareButtons(abs(rankPath(m)), `${m.rankTitle}（${YEAR}年版）大企業のトップ3：${top3}`)}
${rankNotes(m)}`;
  return layout({
    title: `${m.rankTitle}【${YEAR}年版】大企業・中堅・中小別｜${SITE_NAME}`,
    description: `${m.rankLead}。国の公開データをもとに大企業・中堅企業・中小企業に分けて上位100社ずつ掲載。大企業のトップ3は${top3}。`,
    path: rankPath(m), body, ld: [bc.ld, itemList(isAll ? ctx.overallByBand.L.slice(0, 10) : ctx.national[m.key].L.slice(0, 10).map((r) => r.c))],
  });
}

function itemList(list) {
  return { '@type': 'ItemList', itemListElement: list.map((c, i) => ({ '@type': 'ListItem', position: i + 1, url: abs(companyPath(c.id)), name: c.name })) };
}

function rankNotes(m) {
  return `<section class="card"><h2>このランキングについて</h2>
<ul class="ul">
<li>${esc(m.rankLead)}です。同じ値の会社は同じ順位にし、従業員の多い順に並べています。</li>
<li>対象は従業員101人以上の会社です（100人以下の会社は値のばらつきが大きいため、ランキングからは外しています。各社のページでは評定を見られます）。</li>
<li>数値は会社が自ら公表したもので、集計の範囲（正社員のみ、など）や時点は会社ごとに異なります。公表していない会社は載っていません。</li>
<li>${sourceLine(true)}。</li>
</ul></section>`;
}

// ===== 都道府県 =====
export function renderPrefIndex(ctx) {
  const bc = breadcrumbs([['トップ', ''], ['都道府県から探す', null]]);
  const body = `${bc.html}<header class="ph"><h1>都道府県から探す</h1><p class="lead">本社がある都道府県ごとに、働きやすさの数字を公表している会社の通信簿をまとめました。</p></header>
<section class="sec">${prefGrid(ctx)}</section>`;
  return layout({ title: `都道府県別 働きやすい会社・ホワイト企業ランキング｜${SITE_NAME}`, description: '47都道府県ごとに、残業時間・有給取得率・育休取得率などを公表している会社のランキングと一覧。国の公開データから無料で。', path: 'ken/', body, ld: [bc.ld] });
}

function statsTable(ctx, list, label) {
  const rows = METRICS.map((m) => {
    const local = ctx.medianOf(list, m.key);
    const nat = ctx.nationalMedian[m.key];
    return `<tr><th>${esc(m.name)}</th><td>${local.n ? medianShort(m.key, local.median) : '—'}</td><td>${medianShort(m.key, nat)}</td><td>${comma(local.n)}社</td></tr>`;
  }).join('');
  return `<div class="tw"><table class="dt"><caption>${esc(label)}と全国の比較（中央値）</caption><thead><tr><th>項目</th><th>${esc(label)}</th><th>全国</th><th>公表社数</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

function topByMetric(ctx, list, pathOf, area) {
  return METRICS.map((m) => {
    const rows = ctx.rankWithin(list, m).slice(0, 5);
    if (!rows.length) return '';
    return `<div class="mini"><h3><a href="${href(pathOf(m))}">${esc(area)}の${esc(m.rankTitle)}</a></h3>
<ol>${rows.map(({ c, rank }) => `<li><span>${rank}</span><a href="${href(companyPath(c.id))}">${esc(c.name)}</a><em>${valueShort(m.key, c.m[m.key])}</em></li>`).join('')}</ol></div>`;
  }).join('');
}

export function renderPref(ctx, p) {
  const list = ctx.byPref.get(p.code) || [];
  const rankable = list.filter(ctx.isRankable);
  const overall = rankable.filter(ctx.isOverallRankable).sort(ctx.compareOverall);
  const bc = breadcrumbs([['トップ', ''], ['都道府県', 'ken/'], [p.name, null]]);
  const top = overall.slice(0, 20).map((c, i) => ({ c, rank: i + 1 }));
  const inds = INDUSTRIES.map((i) => [i, list.filter((c) => c.ind === i.code).length]).filter(([, n]) => n).sort((a, b) => b[1] - a[1]);
  const body = `${bc.html}
<header class="ph"><p class="eyebrow">${YEAR}年版・公的データ</p><h1>${esc(p.name)}の会社の通信簿</h1>
<p class="lead">${esc(p.name)}に本社がある会社のうち、残業時間・有給取得率・育休取得率などを公表している${comma(list.length)}社の通信簿です。${top[0] ? `働きやすさ総合の1位は${esc(top[0].c.name)}でした。` : ''}</p></header>
${metricLinks((m) => prefPath(p, m), null)}
<section class="sec"><h2>${esc(p.name)}の働きやすさ総合ランキング（ホワイト企業ランキング）</h2>
${top.length ? rankTable(top, null, { showPref: false }) : '<p>5項目以上を公表している従業員101人以上の会社がまだありません。</p>'}
${overall.length > 20 ? `<p class="more"><a href="${href(prefPath(p, OVERALL))}">${esc(p.name)}の総合ランキングをもっと見る（${comma(overall.length)}社）</a></p>` : ''}</section>
<section class="sec"><h2>項目ごとのランキング</h2><div class="minis">${topByMetric(ctx, rankable, (m) => prefPath(p, m), p.name)}</div></section>
<section class="card"><h2>${esc(p.name)}の数字</h2>${statsTable(ctx, list, p.name)}</section>
<section class="card"><h2>${esc(p.name)}の会社を業種から見る</h2><ul class="grid grid-w">${inds.map(([i, n]) => `<li><a href="${href(indPath(i))}">${esc(i.short)}<small>${comma(n)}</small></a></li>`).join('')}</ul>
<p class="more"><a href="${href(`ken/${p.slug}/list/`)}">${esc(p.name)}の会社をすべて見る（${comma(list.length)}社）</a></p></section>
${shareButtons(abs(prefPath(p)), `${p.name}の働きやすい会社ランキング${top[0] ? `：1位は${top[0].c.name}` : ''}`)}`;
  return layout({
    title: `${p.name}の働きやすい会社・ホワイト企業ランキング【${YEAR}年】残業・有給・育休｜${SITE_NAME}`,
    description: `${p.name}の会社${comma(list.length)}社の残業時間・有給取得率・男性の育休取得率・勤続年数などを国の公開データで比較。${top[0] ? `総合1位は${top[0].c.name}。` : ''}ホワイト企業を探す就職・転職の参考に。`,
    path: prefPath(p), body, ld: [bc.ld, itemList(top.slice(0, 10).map((r) => r.c))],
  });
}

export function renderAreaMetric(ctx, area, m, kind) {
  // kind: 'pref' | 'ind'
  const isPref = kind === 'pref';
  const list = (isPref ? ctx.byPref.get(area.code) : ctx.byInd.get(area.code)) || [];
  const rankable = list.filter(ctx.isRankable);
  const name = isPref ? area.name : area.short;
  const pathOf = (mm) => (isPref ? prefPath(area, mm) : indPath(area, mm));
  let rows;
  if (m === OVERALL) rows = rankable.filter(ctx.isOverallRankable).sort(ctx.compareOverall).slice(0, 100).map((c, i) => ({ c, rank: i + 1 }));
  else rows = ctx.rankWithin(rankable, m).slice(0, 100);
  const bc = breadcrumbs([['トップ', ''], [isPref ? '都道府県' : '業種', isPref ? 'ken/' : 'gyoshu/'], [name, pathOf(null)], [m.rankTitle.replace(/（.*）/, ''), null]]);
  const title = `${name}の${m.rankTitle.replace(/（.*）/, '')}${m === OVERALL ? '・ホワイト企業' : ''}【${YEAR}年】`;
  const body = `${bc.html}
<header class="ph"><p class="eyebrow">${YEAR}年版・公的データ</p><h1>${esc(name)}の${esc(m.rankTitle)}</h1>
<p class="lead">${esc(isPref ? `${name}に本社がある` : `${area.name}の`)}会社（従業員101人以上）を、${esc(m.rankLead)}に並べました。${rows[0] ? `1位は${esc(rows[0].c.name)}です。` : ''}</p></header>
${metricLinks(pathOf, m)}
${metricDef(m)}
${rows.length ? rankTable(rows, m === OVERALL ? null : m, { showPref: !isPref, showInd: isPref, valueOf: valueShort }) : '<p class="card">この条件で公表している会社がまだありません。</p>'}
<p class="more"><a href="${href(pathOf(null))}">${esc(name)}の会社の通信簿トップへ</a>／<a href="${href(rankPath(m))}">全国の${esc(m.rankTitle.replace(/（.*）/, ''))}</a></p>
${shareButtons(abs(pathOf(m)), `${name}の${m.rankTitle.replace(/（.*）/, '')}${rows[0] ? `：1位は${rows[0].c.name}` : ''}`)}
${rankNotes(m)}`;
  return layout({
    title: `${title}｜${SITE_NAME}`,
    description: `${name}の${m.rankTitle.replace(/（.*）/, '')}。${m.rankLead}。${rows[0] ? `1位は${rows[0].c.name}。` : ''}国の公開データをもとに無料で掲載。`,
    path: pathOf(m), body, ld: [bc.ld, itemList(rows.slice(0, 10).map((r) => r.c))],
  });
}

export function renderAreaList(ctx, area, kind, page, perPage) {
  const isPref = kind === 'pref';
  const list = (isPref ? ctx.byPref.get(area.code) : ctx.byInd.get(area.code)) || [];
  const name = isPref ? area.name : area.short;
  const base = isPref ? `ken/${area.slug}/list/` : `gyoshu/${area.slug}/list/`;
  const pages = Math.max(1, Math.ceil(list.length / perPage));
  const items = list.slice((page - 1) * perPage, page * perPage);
  const path = page === 1 ? base : `${base}${page}/`;
  const bc = breadcrumbs([['トップ', ''], [isPref ? '都道府県' : '業種', isPref ? 'ken/' : 'gyoshu/'], [name, isPref ? prefPath(area) : indPath(area)], [`すべての会社${page > 1 ? `（${page}ページ目）` : ''}`, null]]);
  const body = `${bc.html}<header class="ph"><h1>${esc(name)}の会社一覧${page > 1 ? `（${page}/${pages}）` : ''}</h1>
<p class="lead">${esc(name)}の会社のうち、働きやすさの数字を公表している${comma(list.length)}社を、平均評定の高い順に並べています。</p></header>
${companyList(items)}
${pager(base, page, pages)}`;
  return layout({ title: `${name}の会社一覧${page > 1 ? `（${page}ページ目）` : ''}｜${SITE_NAME}`, description: `${name}の会社${comma(list.length)}社の通信簿（残業・有給・育休・勤続年数など）の一覧${page > 1 ? `（${page}ページ目）` : ''}。`, path, body, ld: [bc.ld] });
}

// ===== 業種 =====
export function renderIndIndex(ctx) {
  const bc = breadcrumbs([['トップ', ''], ['業種から探す', null]]);
  const body = `${bc.html}<header class="ph"><h1>業種から探す</h1><p class="lead">業種ごとに、働きやすさの数字を公表している会社の通信簿をまとめました。</p></header>
<section class="sec">${indGrid(ctx)}</section>
<section class="card"><h2>業種ごとの数字（中央値）</h2><div class="tw"><table class="dt"><thead><tr><th>業種</th>${METRICS.slice(0, 4).map((m) => `<th>${esc(m.short)}</th>`).join('')}<th>社数</th></tr></thead><tbody>
${INDUSTRIES.filter((i) => (ctx.byInd.get(i.code) || []).length).map((i) => { const l = ctx.byInd.get(i.code); return `<tr><th><a href="${href(indPath(i))}">${esc(i.short)}</a></th>${METRICS.slice(0, 4).map((m) => `<td>${medianShort(m.key, ctx.medianOf(l, m.key).median)}</td>`).join('')}<td>${comma(l.length)}</td></tr>`; }).join('')}
</tbody></table></div></section>`;
  return layout({ title: `業種別 働きやすい会社・ホワイト企業ランキング｜${SITE_NAME}`, description: '建設業・製造業・IT・医療福祉など業種ごとに、残業時間・有給取得率・育休取得率などを国の公開データで比較したランキングと一覧。', path: 'gyoshu/', body, ld: [bc.ld] });
}

export function renderInd(ctx, ind) {
  const list = ctx.byInd.get(ind.code) || [];
  const rankable = list.filter(ctx.isRankable);
  const overall = rankable.filter(ctx.isOverallRankable).sort(ctx.compareOverall);
  const top = overall.slice(0, 20).map((c, i) => ({ c, rank: i + 1 }));
  const bc = breadcrumbs([['トップ', ''], ['業種', 'gyoshu/'], [ind.short, null]]);
  const prefs = PREFS.map((p) => [p, list.filter((c) => c.pref === p.code).length]).filter(([, n]) => n);
  const body = `${bc.html}
<header class="ph"><p class="eyebrow">${YEAR}年版・公的データ</p><h1>${esc(ind.short)}の会社の通信簿</h1>
<p class="lead">${esc(ind.name)}の会社のうち、残業時間・有給取得率・育休取得率などを公表している${comma(list.length)}社の通信簿です。${top[0] ? `働きやすさ総合の1位は${esc(top[0].c.name)}でした。` : ''}</p></header>
${metricLinks((m) => indPath(ind, m), null)}
<section class="sec"><h2>${esc(ind.short)}の働きやすさ総合ランキング（ホワイト企業ランキング）</h2>
${top.length ? rankTable(top, null, { showInd: false }) : '<p>5項目以上を公表している従業員101人以上の会社がまだありません。</p>'}
${overall.length > 20 ? `<p class="more"><a href="${href(indPath(ind, OVERALL))}">${esc(ind.short)}の総合ランキングをもっと見る（${comma(overall.length)}社）</a></p>` : ''}</section>
<section class="sec"><h2>項目ごとのランキング</h2><div class="minis">${topByMetric(ctx, rankable, (m) => indPath(ind, m), ind.short)}</div></section>
<section class="card"><h2>${esc(ind.short)}の数字</h2>${statsTable(ctx, list, ind.short)}</section>
<section class="card"><h2>${esc(ind.short)}の会社を都道府県から見る</h2><ul class="grid">${prefs.map(([p, n]) => `<li><a href="${href(prefPath(p))}">${esc(p.short)}<small>${comma(n)}</small></a></li>`).join('')}</ul>
<p class="more"><a href="${href(`gyoshu/${ind.slug}/list/`)}">${esc(ind.short)}の会社をすべて見る（${comma(list.length)}社）</a></p></section>
${shareButtons(abs(indPath(ind)), `${ind.short}の働きやすい会社ランキング${top[0] ? `：1位は${top[0].c.name}` : ''}`)}`;
  return layout({
    title: `${ind.short}の働きやすい会社・ホワイト企業ランキング【${YEAR}年】残業・有給・育休｜${SITE_NAME}`,
    description: `${ind.name}の会社${comma(list.length)}社の残業時間・有給取得率・男性の育休取得率・勤続年数などを国の公開データで比較。${top[0] ? `総合1位は${top[0].c.name}。` : ''}`,
    path: indPath(ind), body, ld: [bc.ld, itemList(top.slice(0, 10).map((r) => r.c))],
  });
}

// ===== 検索・このサイトについて・404 =====
export function renderSearch() {
  const bc = breadcrumbs([['トップ', ''], ['検索', null]]);
  const body = `${bc.html}<header class="ph"><h1>会社を検索</h1></header>
<form class="sb sb-big sb-page" role="search" action="${href('search/')}"><input class="sb-i" name="q" type="search" placeholder="会社名を入れてください" autocomplete="off" aria-label="会社名で検索" enterkeyhint="search"><div class="sb-r" hidden></div></form>
<div id="results" class="results" aria-live="polite"></div>
<p class="note">見つからないときは、「株式会社」を外したり、一部だけ（例：「トヨタ」）で探してください。働きやすさの数字を国のデータベースで公表していない会社は載っていません。</p>`;
  return layout({ title: `会社を検索｜${SITE_NAME}`, description: '会社名から、残業時間・有給取得率・育休取得率などの通信簿を検索できます。', path: 'search/', body, ld: [bc.ld], noindex: true });
}

export function render404() {
  const body = `<header class="ph"><h1>ページが見つかりません</h1><p class="lead">URLが変わったか、データの更新で会社のページがなくなった可能性があります。会社名で探してみてください。</p></header>
<form class="sb sb-big sb-page" role="search" action="${href('search/')}"><input class="sb-i" name="q" type="search" placeholder="会社名を入れてください" autocomplete="off" aria-label="会社名で検索"><div class="sb-r" hidden></div></form>
<p class="more"><a href="${href('')}">トップへ戻る</a></p>`;
  return layout({ title: `ページが見つかりません｜${SITE_NAME}`, description: 'お探しのページは見つかりませんでした。', path: '404.html', body, noindex: true });
}

export function renderAbout(ctx) {
  const info = buildInfo();
  const bc = breadcrumbs([['トップ', ''], ['このサイトについて', null]]);
  const body = `${bc.html}
<header class="ph"><h1>このサイトについて・使い方</h1>
<p class="lead">${SITE_NAME}は、会社が国のデータベースで公表している「働きやすさの数字」を、だれでも無料で、ほかの会社と比べながら見られるようにしたサイトです。</p></header>
<section class="card"><h2>どんなデータを使っているか</h2>
<ul class="ul">
<li><a href="${SOURCES.positivedb.url}" rel="noopener">${SOURCES.positivedb.name}</a>（厚生労働省）：女性活躍推進法にもとづいて会社が公表した、残業時間・有給休暇の取得率・育児休業の取得率・平均継続勤務年数・女性管理職の割合・男女の賃金の差異など。${comma(ctx.counts.positivedbRows)}社分（${esc(info.sources.positivedb)}時点）。</li>
<li><a href="${SOURCES.shokuba.url}" rel="noopener">${SOURCES.shokuba.name}</a>（厚生労働省）：所在地・事業の内容・新卒者の採用と離職の人数・平均年齢・認定や表彰など（${esc(info.sources.shokuba)}時点）。</li>
</ul>
<p>どちらも、出典を書けば商用を含めて自由に使える「オープンデータ」です（政府標準利用規約 第2.0版に準拠、CC BY 4.0互換）。${SITE_NAME}は、これらのデータを${OPERATOR}が加工して作成しています。国（厚生労働省）が作成したものではありません。</p>
<p>データは定期的に最新のものに更新しています（最終更新：${esc(info.built)}）。</p></section>
<section class="card" id="zangyo"><h2>「残業時間」の読み方</h2>
<p>ここでの残業時間は、女性活躍推進法の公表項目の定義にしたがい、<b>1年間の総労働時間から法定労働時間（週40時間）を引いて、1か月あたりにした平均</b>です。会社の所定労働時間（たとえば1日7時間半＝週37.5時間）を超えて働いた時間でも、週40時間に届かない分は含まれません。</p>
<p>そのため、所定労働時間が短い会社や、休暇の取得が多い会社では、残業があっても平均が「0時間」になることがあります。「0時間」は残業がまったくないという意味ではありません。会社がこの点を注記しているときは、各社のページに「会社の注記」として載せています。</p></section>
<section class="card" id="hyotei"><h2>評定（5段階）のつけ方</h2>
<p>各項目について、<b>同じ業種・同じ規模帯</b>（300人以下／301〜1000人／1001人以上）で同じ項目を公表している会社の中で、その会社より良い数字の会社が何%いるかを数え、学校の通信簿の相対評価と同じ割合で5段階にしています。</p>
<div class="tw"><table class="dt"><thead><tr><th>評定</th><th>位置</th></tr></thead><tbody>
<tr><th>${grade(5)}</th><td>上位7%以内</td></tr><tr><th>${grade(4)}</th><td>上位7〜31%</td></tr><tr><th>${grade(3)}</th><td>真ん中（31〜69%）</td></tr><tr><th>${grade(2)}</th><td>下位7〜31%</td></tr><tr><th>${grade(1)}</th><td>下位7%以内</td></tr></tbody></table></div>
<ul class="ul">
<li>比べる相手が30社に満たないときは、全業種の同じ規模帯と比べます。</li>
<li>同じ値の会社はすべて同じ評定になります（たとえば男性の育休取得率100%の会社は、すべて評定5）。</li>
<li>残業時間と新卒の離職は少ないほど、男女の賃金の差異は100に近いほど、そのほかは高いほど良いとしています。</li>
<li>有給休暇・育児休業の取得率で100%を超える値は100%として、残業時間のマイナスの値（法定労働時間を下回った場合）は0時間として比べます。明らかに不自然な値（月150時間を超える残業、46年以上の平均勤続年数など）は評定に使いません。</li>
<li>新卒の離職は、しょくばらぼに公表された直近3年度の「新卒者等の採用者数」と「離職者数」の合計から計算した目安で、採用が10人以上の会社だけ評定します。</li>
<li>「平均評定」は、評定がついた項目（3項目以上）の単純平均です。総合ランキングは、5項目以上を公表している従業員101人以上の会社が対象です。</li>
</ul></section>
<section class="card"><h2>見るときの注意</h2>
<ul class="ul">
<li>数値は会社が自ら入力・公表したものです。集計の範囲（正社員だけ、総合職だけ、など）や時点は会社ごとに異なります。各社のページに範囲と時点を載せています。</li>
<li>公表は多くの項目で任意のため、良い数字だけを公表している会社もありえます。公表していない項目は「未公表」としています。</li>
<li>評定は公表値の相対的な位置を示すもので、会社の良し悪しを断定するものではありません。就職・転職の判断は、会社の説明や求人票などもあわせてご確認ください。</li>
</ul></section>
<section class="card" id="nintei"><h2>認定・表彰の意味</h2>
<ul class="ul">
<li><b>くるみん・プラチナくるみん</b>：子育てサポートに取り組む会社として厚生労働大臣が認定。</li>
<li><b>えるぼし・プラチナえるぼし</b>：女性の活躍推進の状況が優良な会社として厚生労働大臣が認定（えるぼしは1〜3段階目）。</li>
<li><b>ユースエール</b>：若者の採用・育成に積極的で、雇用管理の状況が優良な中小企業を厚生労働大臣が認定。</li>
<li><b>安全衛生優良企業</b>：労働者の安全や健康を確保する取り組みが優良な会社として厚生労働省が認定。</li>
<li><b>健康経営銘柄</b>：従業員の健康管理を経営的な視点で考え、戦略的に取り組んでいる上場企業として経済産業省と東京証券取引所が選定。</li>
<li><b>働きやすい職場認証</b>：トラック・バス・タクシーの運送事業者で、労働条件や労働環境の改善に取り組む事業者を認証する国の制度。</li>
</ul></section>
<section class="card" id="privacy"><h2>運営者・お問い合わせ・プライバシー</h2>
<dl class="dl"><div><dt>運営</dt><dd>${OPERATOR}（法人番号 ${OPERATOR_ID}）</dd></div><div><dt>お問い合わせ</dt><dd>${CONTACT}</dd></div></dl>
<p>このサイトはAIを使って作られ、データの集計や解説文の作成も自動で行っています。数字の誤りは、まず各社の公表元（上記のデータベース）をご確認ください。掲載内容についてのご連絡は上記メールアドレスまでお願いします。</p>
<p>このサイトはCookieを使わず、アクセス解析も行っていません。検索に入力した文字は、お使いの端末の中だけで処理され、外部に送られません。</p></section>`;
  return layout({ title: `このサイトについて・評定のつけ方｜${SITE_NAME}`, description: `${SITE_NAME}で使っているデータ（厚生労働省のオープンデータ）、5段階の評定のつけ方、見るときの注意、運営者について。`, path: 'about/', body, ld: [bc.ld] });
}
