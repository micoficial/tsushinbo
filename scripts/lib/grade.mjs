import { METRICS, GRADE_CUTS, MIN_PEERS, INDUSTRY_BY_CODE, BAND_LABEL, RANKABLE_SIZES, OVERALL_MIN_ITEMS } from './meta.mjs';

// 雇用管理区分が複数あるときに「全体」に近いものを選ぶ
const OVERALL = /全|対象|正社員|正規|社員|職員|従業員|労働者|常用/;
function pickGroup(list, has) {
  const cands = list.filter(has);
  if (!cands.length) return null;
  return cands.find((g) => OVERALL.test(g.label)) || (cands.length === 1 ? cands[0] : cands[0]);
}
const sum = (a) => a.reduce((x, y) => x + y, 0);

// 会社ごとに、評定に使う代表値を1つずつ決める
export function primaryMetrics(c) {
  const out = {};
  const d = c.d;
  if (d) {
    if (d.zangyo.v != null) out.zangyo = { v: d.zangyo.v, scope: d.zangyo.scope };
    else {
      const g = pickGroup(d.zangyoK, (g) => g.v != null);
      if (g && (d.zangyoK.filter((x) => x.v != null).length === 1 || OVERALL.test(g.label))) out.zangyo = { v: g.v, scope: g.label };
    }
    if (d.yukyu.v != null) out.yukyu = { v: d.yukyu.v, scope: '対象労働者' };
    else {
      const g = pickGroup(d.yukyuK, (g) => g.v != null);
      if (g && (d.yukyuK.filter((x) => x.v != null).length === 1 || OVERALL.test(g.label))) out.yukyu = { v: g.v, scope: g.label };
    }
    const ik = pickGroup(d.ikukyu, (g) => g.m != null);
    if (ik) out.ikukyu = { v: ik.m, scope: ik.label, f: ik.f };
    const kz = pickGroup(d.kinzoku, (g) => g.m != null || g.f != null);
    if (kz) {
      const vals = [kz.m, kz.f].filter((v) => v != null);
      out.kinzoku = { v: sum(vals) / vals.length, scope: kz.label, m: kz.m, f: kz.f };
    }
    if (d.kanri.v != null) out.kanri = { v: d.kanri.v, n: d.kanri.n, total: d.kanri.total };
    if (d.chingin.all != null) out.chingin = { v: d.chingin.all };
  }
  const y = c.s?.youth;
  if (y?.hires && y?.leavers) {
    const h = sum(y.hires);
    const l = sum(y.leavers);
    if (h >= 10 && l <= h) out.rishoku = { v: (l / h) * 100, hires: h, leavers: l };
  }
  for (const m of METRICS) {
    const x = out[m.key];
    if (!x) continue;
    if (!m.valid(x.v)) { x.invalid = true; continue; }
    x.score = m.score(x.v);
  }
  return out;
}

// 並べた配列で「自分より良い会社」の数を数える
function lowerBound(a, v) { let lo = 0, hi = a.length; while (lo < hi) { const mid = (lo + hi) >> 1; if (a[mid] < v) lo = mid + 1; else hi = mid; } return lo; }
function upperBound(a, v) { let lo = 0, hi = a.length; while (lo < hi) { const mid = (lo + hi) >> 1; if (a[mid] <= v) lo = mid + 1; else hi = mid; } return lo; }
export function median(a) {
  if (!a.length) return null;
  const s = a.length % 2 ? a[(a.length - 1) / 2] : (a[a.length / 2 - 1] + a[a.length / 2]) / 2;
  return s;
}

function gradeOf(p) {
  if (p < GRADE_CUTS[0]) return 5;
  if (p < GRADE_CUTS[1]) return 4;
  if (p < GRADE_CUTS[2]) return 3;
  if (p < GRADE_CUTS[3]) return 2;
  return 1;
}

// 全社の代表値から比較グループ（業種×規模帯）を作り、各社に評定を付ける
export function gradeAll(list) {
  const groups = new Map(); // key -> { scores:[], values:[] }
  const add = (key, x) => {
    let g = groups.get(key);
    if (!g) groups.set(key, (g = { scores: [], values: [] }));
    g.scores.push(x.score);
    g.values.push(x.v);
  };
  for (const c of list) {
    for (const m of METRICS) {
      const x = c.m[m.key];
      if (!x || x.invalid) continue;
      add(`${m.key}|${c.ind}|${c.band || '*'}`, x);
      add(`${m.key}|*|${c.band || '*'}`, x);
      add(`${m.key}|*|*`, x);
    }
  }
  for (const g of groups.values()) {
    g.scores.sort((a, b) => a - b);
    g.values.sort((a, b) => a - b);
    g.median = median(g.values);
  }

  for (const c of list) {
    const grades = [];
    for (const m of METRICS) {
      const x = c.m[m.key];
      if (!x || x.invalid) continue;
      let key = `${m.key}|${c.ind}|${c.band || '*'}`;
      let g = groups.get(key);
      let scope = 'ind';
      if (!c.band) { key = `${m.key}|*|*`; g = groups.get(key); scope = 'all'; }
      else if (!g || g.scores.length < MIN_PEERS) { key = `${m.key}|*|${c.band}`; g = groups.get(key); scope = 'band'; }
      if (!g || g.scores.length < MIN_PEERS) { key = `${m.key}|*|*`; g = groups.get(key); scope = 'all'; }
      const n = g.scores.length;
      const better = m.better === 'low' ? lowerBound(g.scores, x.score) : n - upperBound(g.scores, x.score);
      const best = m.better === 'low' ? g.scores[0] : g.scores[n - 1];
      x.better = better;
      x.n = n;
      x.pct = better / n;
      x.top = Math.max(1, Math.round(((better + 1) / n) * 100));
      x.isBest = x.score === best;
      x.grade = gradeOf(x.pct);
      x.median = g.median;
      x.peer = scope === 'ind'
        ? `${INDUSTRY_BY_CODE.get(c.ind).short}・${BAND_LABEL[c.band]}`
        : scope === 'band' ? `全業種・${BAND_LABEL[c.band]}` : '全業種・全規模';
      grades.push(x.grade);
    }
    c.gradeCount = grades.length;
    c.avg = grades.length >= 3 ? Math.round((sum(grades) / grades.length) * 10) / 10 : null;
    c.meanPct = grades.length ? sum(METRICS.map((m) => c.m[m.key]).filter((x) => x && !x.invalid).map((x) => x.pct)) / grades.length : 1;
  }
  return groups;
}

// 掲載する会社：評定できる項目が2つ以上、または301人以上で1つ以上
export function isPublished(c) {
  return c.gradeCount >= 2 || (c.gradeCount >= 1 && (c.band === 'M' || c.band === 'L'));
}
export const isRankable = (c) => RANKABLE_SIZES.has(c.size);
export const isOverallRankable = (c) => isRankable(c) && c.avg != null && c.gradeCount >= OVERALL_MIN_ITEMS;

// 総合（平均評定）の並べ方：平均が高い → 項目数が多い → 平均の位置が良い
export function compareOverall(a, b) {
  return (b.avg - a.avg) || (b.gradeCount - a.gradeCount) || (a.meanPct - b.meanPct) || a.name.localeCompare(b.name, 'ja');
}

// 指標ごとの並べ方。同じ値は同順位にする
export function rankBy(list, m) {
  const xs = list.filter((c) => c.m[m.key] && !c.m[m.key].invalid);
  xs.sort((a, b) => {
    const sa = a.m[m.key].score, sb = b.m[m.key].score;
    const d = m.better === 'low' ? sa - sb : sb - sa;
    return d || (b.sizeN || 0) - (a.sizeN || 0) || a.name.localeCompare(b.name, 'ja');
  });
  let rank = 0, prev = null;
  return xs.map((c, i) => {
    const s = c.m[m.key].score;
    if (s !== prev) { rank = i + 1; prev = s; }
    return { c, rank };
  });
}
