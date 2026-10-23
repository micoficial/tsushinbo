import { METRICS, INDUSTRY_BY_CODE, PREFS } from './meta.mjs';
import { fmt, shortName, avgText, posText, scopeLabel } from './format.mjs';

const PREF = new Map(PREFS.map((p) => [p.code, p]));

// 指標の値を文中の言い方にする
export function valuePhrase(key, x) {
  switch (key) {
    case 'zangyo': return `月${fmt(Math.max(x.v, 0))}時間`;
    case 'yukyu': return `取得率${fmt(x.v)}%`;
    case 'ikukyu': return `取得率${fmt(x.v)}%`;
    case 'kinzoku': return `平均${fmt(x.v)}年`;
    case 'kanri': return `${fmt(x.v)}%`;
    case 'chingin': return `男性100に対し女性${fmt(x.v)}`;
    case 'rishoku': return `${fmt(x.v)}%`;
    default: return fmt(x.v);
  }
}

export function valueShort(key, x) {
  if (!x) return '—';
  switch (key) {
    case 'zangyo': return `${fmt(Math.max(x.v, 0))}時間`;
    case 'kinzoku': return `${fmt(x.v)}年`;
    case 'chingin': return fmt(x.v);
    default: return `${fmt(x.v)}%`;
  }
}

export function medianShort(key, v) {
  if (v == null) return '—';
  return valueShort(key, { v });
}

const GOOD = {
  zangyo: '残業の少なさ', yukyu: '有給の取りやすさ', ikukyu: '男性の育休の取りやすさ', kinzoku: '勤続年数の長さ',
  kanri: '女性管理職の割合', chingin: '男女の賃金差の小ささ', rishoku: '新卒の定着の良さ',
};
const WEAK = {
  zangyo: '残業時間', yukyu: '有給休暇の取得率', ikukyu: '男性の育休取得率', kinzoku: '勤続年数',
  kanri: '女性管理職の割合', chingin: '男女の賃金差', rishoku: '新卒の離職',
};
const WEAK_TAIL = {
  zangyo: 'は長め', yukyu: 'は低め', ikukyu: 'は低め', kinzoku: 'は短め', kanri: 'は低め', chingin: 'は大きめ', rishoku: 'は多め',
};

function overallPhrase(avg) {
  if (avg >= 4.5) return '公表された数字の上では、同じ業種・規模の会社の中でもトップクラスの働きやすさです。';
  if (avg >= 4.0) return '公表された数字の上では、同じ業種・規模の会社の中で働きやすい部類に入ります。';
  if (avg >= 3.5) return '同じ業種・規模の会社と比べて、やや良い数字が並びます。';
  if (avg >= 2.8) return '同じ業種・規模の会社と比べて、おおむね平均的な数字です。';
  if (avg >= 2.2) return '同じ業種・規模の会社と比べて、やや見劣りする数字があります。';
  return '同じ業種・規模の会社と比べて、厳しめの数字が目立ちます。';
}

const joinJa = (a) => (a.length <= 1 ? a.join('') : `${a.slice(0, -1).join('、')}と${a[a.length - 1]}`);

// 会社ページの「ひとことで言うと」
export function summary(c) {
  const name = shortName(c.name);
  const ind = INDUSTRY_BY_CODE.get(c.ind);
  const pref = PREF.get(c.pref);
  const graded = METRICS.filter((m) => c.m[m.key] && !c.m[m.key].invalid);
  const s = [];

  const where = [pref ? pref.name : '', ind ? `の${ind.short}` : ''].join('');
  s.push(`${name}は${where}の会社${c.size ? `（従業員${c.size.replace('～', '〜')}）` : ''}です。`);

  if (c.avg != null) s.push(`公表している${graded.length}項目の平均評定は${avgText(c.avg)}。${overallPhrase(c.avg)}`);

  const strong = graded.filter((m) => c.m[m.key].grade >= 4).sort((a, b) => c.m[a.key].pct - c.m[b.key].pct).slice(0, 2);
  if (strong.length) {
    const parts = strong.map((m) => `${GOOD[m.key]}（${valuePhrase(m.key, c.m[m.key])}）`);
    const tops = strong.map((m) => posText(c.m[m.key]));
    s.push(strong.length === 2
      ? `とくに${parts[0]}は比べた相手の中で${tops[0]}、${parts[1]}は${tops[1]}です。`
      : `とくに${parts[0]}は、比べた相手の中で${tops[0]}です。`);
  }
  const weak = graded.filter((m) => c.m[m.key].grade <= 2).sort((a, b) => c.m[b.key].pct - c.m[a.key].pct).slice(0, 2);
  if (weak.length) {
    const parts = weak.map((m) => `${WEAK[m.key]}（${valuePhrase(m.key, c.m[m.key])}）${WEAK_TAIL[m.key]}`);
    s.push(`${strong.length ? '一方で、' : ''}比べた相手の中では、${joinJa(parts)}です。`);
  }

  const kz = c.m.kinzoku;
  if (kz && kz.m != null && kz.f != null && Math.abs(kz.m - kz.f) >= 3) {
    const longer = kz.m > kz.f ? '男性' : '女性';
    s.push(`平均勤続年数は男性${fmt(kz.m)}年・女性${fmt(kz.f)}年で、${longer}の方が${fmt(Math.abs(kz.m - kz.f))}年長くなっています。`);
  }
  if (c.m.zangyo && !c.m.zangyo.invalid && c.m.zangyo.v <= 0) {
    s.push('残業時間は「0時間」と公表しています。これは法定労働時間（週40時間）を超えた分の平均が0という意味で、所定の勤務時間を超える残業がまったくないとは限りません。');
  }
  return s;
}

// よくある質問（数値の答え）
export function faqs(c) {
  const name = shortName(c.name);
  const out = [];
  const peerTail = (x, key) => `比べた相手（${x.peer}の${x.n.toLocaleString('ja-JP')}社）の中央値は${medianShort(key, x.median)}です。`;
  const asOf = c.asOf ? `（${c.asOf}）` : '';
  const z = c.m.zangyo;
  if (z && !z.invalid) out.push([`${name}の平均残業時間は？`, `法定労働時間を超えた分の1か月あたりの平均で${fmt(z.v)}時間です${z.scope ? `（対象：${scopeLabel(z.scope)}）` : ''}${asOf}。${peerTail(z, 'zangyo')}`]);
  const y = c.m.yukyu;
  if (y && !y.invalid) out.push([`${name}の有給休暇の取得率は？`, `${fmt(y.v)}%です${y.scope && scopeLabel(y.scope) !== '労働者' ? `（対象：${scopeLabel(y.scope)}）` : ''}${asOf}。${peerTail(y, 'yukyu')}`]);
  const ik = c.m.ikukyu;
  if (ik && !ik.invalid) out.push([`${name}の男性の育休取得率は？`, `男性${fmt(ik.v)}%${ik.f != null ? `、女性${fmt(ik.f)}%` : ''}です${asOf}。${peerTail(ik, 'ikukyu')}`]);
  const kz = c.m.kinzoku;
  if (kz && !kz.invalid) out.push([`${name}の平均勤続年数は？`, `${kz.m != null ? `男性${fmt(kz.m)}年` : ''}${kz.m != null && kz.f != null ? '、' : ''}${kz.f != null ? `女性${fmt(kz.f)}年` : ''}です${asOf}。${peerTail(kz, 'kinzoku')}`]);
  const k = c.m.kanri;
  if (k && !k.invalid) out.push([`${name}の女性管理職の割合は？`, `${fmt(k.v)}%です${k.n != null && k.total != null ? `（管理職${k.total.toLocaleString('ja-JP')}人のうち女性${k.n.toLocaleString('ja-JP')}人）` : ''}${asOf}。${peerTail(k, 'kanri')}`]);
  const ch = c.m.chingin;
  if (ch && !ch.invalid) out.push([`${name}の男女の賃金の差は？`, `男性の賃金を100としたとき、女性は${fmt(ch.v)}です（全労働者）${c.d?.chingin.period ? `。対象期間は${c.d.chingin.period}` : ''}。`]);
  const r = c.m.rishoku;
  if (r && !r.invalid) out.push([`${name}の新卒の離職者数は？`, `直近3年度の新卒者等の採用${r.hires}人に対して、離職者数は${r.leavers}人です（${fmt(r.v)}%・目安）。`]);
  return out;
}
