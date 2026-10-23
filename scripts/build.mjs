// 公開データ → 静的サイト（dist/）を作る
// 使い方: node scripts/build.mjs   （先に bash scripts/fetch.sh でデータを取る）
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { loadAll } from './lib/load.mjs';
import { primaryMetrics, gradeAll, isPublished, isRankable, isOverallRankable, compareOverall, rankBy, median } from './lib/grade.mjs';
import { METRICS, PREFS, INDUSTRIES, BAND_NAME, SITE_NAME } from './lib/meta.mjs';
import { setAssetVersion, setBuildInfo, abs, companyPath, prefPath, indPath, rankPath, BASE } from './lib/html.mjs';
import { renderCompany } from './pages/company.mjs';
import {
  OVERALL, renderTop, renderRankingIndex, renderRanking, renderPrefIndex, renderPref, renderAreaMetric, renderAreaList,
  renderIndIndex, renderInd, renderSearch, render404, renderAbout,
} from './pages/hubs.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RAW = path.join(ROOT, 'data', 'raw');
const DIST = path.join(ROOT, 'dist');
const LIMIT = process.env.LIMIT ? +process.env.LIMIT : 0; // 試しに少ない件数で作るとき
const PER_PAGE = 200;

const t0 = Date.now();
const log = (...a) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1)}s]`, ...a);

const { companies, sources, counts } = await loadAll(RAW);
log('loaded', companies.size, 'companies', sources);

const all = [...companies.values()];
for (const c of all) {
  c.m = primaryMetrics(c);
  c.sizeN = c.s?.sizeN ?? null;
}
gradeAll(all);
let published = all.filter(isPublished);
const bandOrder = { L: 0, M: 1, S: 2 };
published.sort((a, b) => (bandOrder[a.band] ?? 3) - (bandOrder[b.band] ?? 3) || (b.sizeN || 0) - (a.sizeN || 0) || a.name.localeCompare(b.name, 'ja'));
log('published', published.length);

// ---- 集計 ----
const rankable = published.filter(isRankable);
const national = {};
for (const m of METRICS) {
  national[m.key] = {};
  for (const b of ['L', 'M', 'S']) national[m.key][b] = rankBy(rankable.filter((c) => c.band === b), m);
}
const overallByBand = {};
for (const b of ['L', 'M', 'S']) overallByBand[b] = rankable.filter((c) => c.band === b && isOverallRankable(c)).sort(compareOverall);

const byOverall = (a, b) => ((b.avg ?? -1) - (a.avg ?? -1)) || (b.gradeCount - a.gradeCount) || (a.meanPct - b.meanPct) || a.name.localeCompare(b.name, 'ja');
const byPref = new Map();
const byInd = new Map();
for (const c of published) {
  if (c.pref) (byPref.get(c.pref) || byPref.set(c.pref, []).get(c.pref)).push(c);
  (byInd.get(c.ind) || byInd.set(c.ind, []).get(c.ind)).push(c);
}
for (const l of byPref.values()) l.sort(byOverall);
for (const l of byInd.values()) l.sort(byOverall);

const nationalMedian = {};
for (const m of METRICS) {
  const vals = all.map((c) => c.m[m.key]).filter((x) => x && !x.invalid).map((x) => x.v).sort((a, b) => a - b);
  nationalMedian[m.key] = median(vals);
}
const medianOf = (list, key) => {
  const vals = list.map((c) => c.m[key]).filter((x) => x && !x.invalid).map((x) => x.v).sort((a, b) => a - b);
  return { median: median(vals), n: vals.length };
};

// ランキングでの順位（会社ページに出す）
const badges = new Map();
const addBadge = (c, b) => { const l = badges.get(c.id) || badges.set(c.id, []).get(c.id); l.push(b); };
for (const b of ['L', 'M', 'S']) {
  overallByBand[b].slice(0, 100).forEach((c, i) => addBadge(c, { title: `${OVERALL.rankTitle.replace(/（.*）/, '')}（${BAND_NAME[b]}）`, path: `${rankPath(OVERALL)}#${b}`, rank: i + 1, w: 0 }));
  for (const m of METRICS) national[m.key][b].slice(0, 100).forEach(({ c, rank }) => addBadge(c, { title: `${m.rankTitle}（${BAND_NAME[b]}）`, path: `${rankPath(m)}#${b}`, rank, w: 1 }));
}
for (const p of PREFS) {
  const list = (byPref.get(p.code) || []).filter(isOverallRankable).sort(compareOverall);
  list.slice(0, 100).forEach((c, i) => addBadge(c, { title: `${p.name}の働きやすさ総合ランキング`, path: prefPath(p, OVERALL), rank: i + 1, w: 2 }));
}
for (const l of badges.values()) l.sort((a, b) => a.w - b.w || a.rank - b.rank);

// 似た会社（同じ業種×同じ県／同じ業種×同じ規模帯）
const byIndPref = new Map();
const byIndBand = new Map();
for (const c of published) {
  const k1 = `${c.ind}|${c.pref}`;
  (byIndPref.get(k1) || byIndPref.set(k1, []).get(k1)).push(c);
  const k2 = `${c.ind}|${c.band}`;
  (byIndBand.get(k2) || byIndBand.set(k2, []).get(k2)).push(c);
}
for (const l of byIndPref.values()) l.sort(byOverall);
for (const l of byIndBand.values()) l.sort(byOverall);
function similar(c) {
  const local = (byIndPref.get(`${c.ind}|${c.pref}`) || []).filter((x) => x.id !== c.id && c.pref);
  const pick = (list, n, skip) => {
    // 評定の高い会社ばかりにならないよう、上位と近い規模を混ぜる
    const out = [];
    const sameBand = list.filter((x) => x.band === c.band && !skip.has(x.id));
    for (const x of [...sameBand.slice(0, n), ...list]) {
      if (out.length >= n) break;
      if (!skip.has(x.id) && !out.includes(x)) out.push(x);
    }
    return out;
  };
  const skip = new Set([c.id]);
  const l = pick(local, 6, skip);
  l.forEach((x) => skip.add(x.id));
  const peers = pick((byIndBand.get(`${c.ind}|${c.band}`) || []), 6, skip);
  return { local: l, peers };
}

const FEATURED = ['トヨタ自動車株式会社', 'ソニーグループ株式会社', '株式会社キーエンス', '任天堂株式会社', '株式会社日立製作所', 'パナソニック株式会社', '株式会社ファーストリテイリング', '三菱商事株式会社', '株式会社リクルート', '日本電気株式会社', '富士通株式会社', 'ＫＤＤＩ株式会社', '株式会社三井住友銀行', 'サントリーホールディングス株式会社'];
const byName = new Map(published.map((c) => [c.name, c]));
const featured = FEATURED.map((n) => byName.get(n)).filter(Boolean).slice(0, 8);
const fallbackFeatured = featured.length >= 4 ? featured : [...featured, ...overallByBand.L.slice(0, 8 - featured.length)];
const sample = byName.get('トヨタ自動車株式会社') || overallByBand.L[0];

const now = new Date();
const jst = new Date(now.getTime() + 9 * 3600e3);
const built = `${jst.getUTCFullYear()}年${jst.getUTCMonth() + 1}月${jst.getUTCDate()}日`;
setBuildInfo({ sources, built });

// ---- 出力 ----
fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });
const ASSETS_SRC = path.join(ROOT, 'src', 'assets');
fs.cpSync(ASSETS_SRC, path.join(DIST, 'assets'), { recursive: true });
// サイト直下に置くファイル（Search Console の確認ファイル、IndexNow のキー）
fs.cpSync(path.join(ROOT, 'src', 'root'), DIST, { recursive: true });
const hash = crypto.createHash('sha1');
for (const f of ['style.css', 'app.js']) hash.update(fs.readFileSync(path.join(ASSETS_SRC, f)));
setAssetVersion(hash.digest('hex').slice(0, 8));

let pages = 0;
const urls = { hubs: [], companies: [] };
function write(p, html, kind = 'hubs', sitemap = true) {
  const file = p === '' ? path.join(DIST, 'index.html') : p.endsWith('.html') ? path.join(DIST, p) : path.join(DIST, p, 'index.html');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
  pages++;
  if (sitemap) urls[kind].push(abs(p));
}

const ctx = {
  published, counts, national, overallByBand, byPref, byInd, nationalMedian, medianOf, badges, similar,
  featured: fallbackFeatured, sample, isRankable, isOverallRankable, compareOverall, rankWithin: rankBy, isoDate: now.toISOString().slice(0, 10),
};

write('', renderTop(ctx));
write('ranking/', renderRankingIndex(ctx));
for (const m of [OVERALL, ...METRICS]) write(rankPath(m), renderRanking(ctx, m));
write('ken/', renderPrefIndex(ctx));
for (const p of PREFS) {
  write(prefPath(p), renderPref(ctx, p));
  for (const m of [OVERALL, ...METRICS]) write(prefPath(p, m), renderAreaMetric(ctx, p, m, 'pref'));
  const n = Math.max(1, Math.ceil((byPref.get(p.code) || []).length / PER_PAGE));
  for (let i = 1; i <= n; i++) write(i === 1 ? `ken/${p.slug}/list/` : `ken/${p.slug}/list/${i}/`, renderAreaList(ctx, p, 'pref', i, PER_PAGE));
}
write('gyoshu/', renderIndIndex(ctx));
for (const ind of INDUSTRIES) {
  if (!(byInd.get(ind.code) || []).length) continue;
  write(indPath(ind), renderInd(ctx, ind));
  for (const m of [OVERALL, ...METRICS]) write(indPath(ind, m), renderAreaMetric(ctx, ind, m, 'ind'));
  const n = Math.max(1, Math.ceil(byInd.get(ind.code).length / PER_PAGE));
  for (let i = 1; i <= n; i++) write(i === 1 ? `gyoshu/${ind.slug}/list/` : `gyoshu/${ind.slug}/list/${i}/`, renderAreaList(ctx, ind, 'ind', i, PER_PAGE));
}
write('about/', renderAbout(ctx));
write('search/', renderSearch(ctx), 'hubs', false);
write('404.html', render404(ctx), 'hubs', false);
log('hub pages', pages);

const targets = LIMIT ? published.slice(0, LIMIT) : published;
for (const c of targets) write(companyPath(c.id), renderCompany(c, ctx), 'companies');
log('company pages', targets.length);

// 検索用の索引（大きい会社から順に並べる）
const index = published.map((c) => [c.id, c.name, c.pref, c.ind, c.avg != null ? Math.round(c.avg * 10) : 0]);
fs.writeFileSync(path.join(DIST, 'assets', 'index.json'), JSON.stringify({ v: 1, built, prefs: PREFS.map((p) => p.short), inds: Object.fromEntries(INDUSTRIES.map((i) => [i.code, i.short])), c: index }));

// サイトマップ
const lastmod = now.toISOString().slice(0, 10);
const smFiles = [];
const writeSitemap = (name, list) => {
  fs.writeFileSync(path.join(DIST, name), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${list.map((u) => `<url><loc>${u}</loc><lastmod>${lastmod}</lastmod></url>`).join('\n')}\n</urlset>\n`);
  smFiles.push(name);
};
writeSitemap('sitemap-hubs.xml', urls.hubs);
for (let i = 0; i < urls.companies.length; i += 40000) writeSitemap(`sitemap-companies-${i / 40000 + 1}.xml`, urls.companies.slice(i, i + 40000));
fs.writeFileSync(path.join(DIST, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${smFiles.map((f) => `<sitemap><loc>${abs(f)}</loc><lastmod>${lastmod}</lastmod></sitemap>`).join('\n')}\n</sitemapindex>\n`);
fs.writeFileSync(path.join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${abs('sitemap.xml')}\n`);
fs.writeFileSync(path.join(DIST, '.nojekyll'), '');

// 更新の記録（リポジトリに残す。GitHub の定期実行が止まらないようにする役目もある）
const summary = {
  built, sources, base: BASE, pages, companies: published.length, rankable: rankable.length,
  sourceRows: counts, metrics: Object.fromEntries(METRICS.map((m) => [m.key, all.filter((c) => c.m[m.key] && !c.m[m.key].invalid).length])),
};
// 記録ファイルは GitHub Actions で全件を作ったときだけ書く（手元の試しの結果でリポジトリを汚さない）
if (process.env.GITHUB_ACTIONS === 'true' && !LIMIT) {
  fs.mkdirSync(path.join(ROOT, 'data'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'data', 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
}
log('done', summary);
