import fs from 'node:fs';
import path from 'node:path';
import { readCSV } from './csv.mjs';
import { INDUSTRY_BY_NAME, INDUSTRY_BY_JSIC, INDUSTRY_BY_CODE, PREF_BY_NAME, SIZE_BAND } from './meta.mjs';

// 公開データの列。国の側で並びが変わったら、黙って変な値を出さないよう止める
const POSITIVE_COLS = [
  [0, '企業名'], [1, '法人番号'], [3, '業種'], [4, '業種(詳細分類)'], [5, '都道府県'], [6, '企業規模'],
  [8, '市場区分'], [9, '証券コード'],
  [11, '企業認定等-くるみん認定'], [15, '企業認定等-プラチナくるみん認定'], [18, '企業認定等-えるぼし'],
  [17, '企業認定等-プラチナえるぼし'], [20, '企業認定等-ユースエール認定'], [21, '企業認定等-令和'],
  [31, '1.採用した労働者に占める女性労働者の割合-雇用管理区分１'], [58, '3.労働者に占める女性労働者の割合-雇用管理区分１'],
  [69, '4.(1)男女の平均継続勤務年数の差異-雇用管理区分１'], [95, '4.(2)男女別の採用１０年前後の継続雇用割合-雇用管理区分１'],
  [111, '5.男女別の育児休業取得率-雇用管理区分１'], [127, '6.一月当たりの労働者の平均残業時間-公表する範囲'],
  [128, '6.一月当たりの労働者の平均残業時間-平均残業時間(時間)'], [131, '7.雇用管理区分ごとの一月当たりの労働者の平均残業時間-雇用管理区分１'],
  [142, '8.(1)年次有給休暇の取得率-対象労働者(%)'], [144, '8.(2)年次有給休暇の取得率(区)-雇用管理区分１'],
  [155, '9.係長級にある者に占める女性労働者の割合-割合(%)'], [159, '10.管理職に占める女性労働者の割合-割合(%)'],
  [163, '11.役員に占める女性の割合-割合(%)'], [202, '13.中途採用の実績-男性(人)'], [205, '14.男女の賃金の差異1-全労働者(%)'],
  [218, '14.男女の賃金の差異 注釈・説明'], [219, '14.対象期間'], [220, '15.データの対象-データの対象'],
  [222, '16.データ集計時点-データ集計時点'], [226, '職種・雇用形態転換制度'], [234, '年次有給休暇時間単位取得制度'],
  [235, 'データの最終更新日'],
];

const SHOKUBA_COLS = [
  [0, '法人番号'], [1, '企業名'], [5, '都道府県'], [6, '所在地'], [27, '企業規模'], [29, '業種'], [30, '事業概要'],
  [31, '企業ホームページ'], [35, '創業年'], [36, '証券コード'], [37, '市場区分'],
  [39, '新卒者の採用・定着状況(前年度/2年度前/3年度前)-男性'], [41, '新卒者の採用・定着状況(前年度/2年度前/3年度前)-男女計'],
  [42, '新卒者の採用・定着状況(前年度/2年度前/3年度前)-離職者数'], [178, '従業員の平均年齢'], [193, '月平均所定外労働時間'],
  [237, '正社員の有給休暇取得日数'], [474, '研修制度-有無'], [476, 'メンター制度-有無'], [477, '自己啓発支援制度-有無'],
  [479, 'キャリアコンサルティング制度-有無'], [481, '社内検定制度-有無'],
  [499, 'ハローワークインターネットサービスに掲載されている企業の求人情報-フルタイムの求人リンク'],
  [502, 'ユースエール認定-認定有無'], [525, '安全衛生優良企業公表制度-認定有無'], [535, '健康経営銘柄-認定有無'],
  [549, 'グッドキャリア企業アワード-表彰有無'], [561, '障害者雇用優良事業所の大臣表彰-表彰有無'],
  [570, 'テレワーク推進企業等厚生労働大臣表彰-表彰有無'], [578, 'もにす（障害者雇用優良中小事業主認定表彰）-表彰有無'],
  [582, '働きやすい職場認証制度-認証有無'], [584, '働きやすい職場認証制度-事業種別'],
];

function checkHeader(header, cols, label) {
  for (const [i, name] of cols) {
    if (!(header[i] ?? '').startsWith(name)) {
      throw new Error(`${label}: ${i}列目が「${name}」ではありません（実際：「${header[i]}」）。データの形式が変わった可能性があります。`);
    }
  }
}

const t = (v) => (v ?? '').trim();
export function num(v) {
  v = t(v).replace(/[,，]/g, '');
  if (!v || v === '-' || v === '－' || v === '―') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
// "7人/5人/4人" → [7,5,4]
function triple(v) {
  v = t(v);
  if (!v) return null;
  const parts = v.split('/').map((s) => num(s.replace(/[人]/g, '')));
  return parts.length === 3 && parts.every((n) => n != null) ? parts : null;
}
const unit = (v, u) => num(t(v).replace(u, ''));

// 「雇用管理区分N + 値」が5組並ぶ形を [{label, v...}] にする
function groups(r, start, stride, fields, count = 5) {
  const out = [];
  for (let k = 0; k < count; k++) {
    const base = start + k * stride;
    const label = t(r[base]);
    const g = { label };
    let has = false;
    fields.forEach((f, j) => {
      const v = num(r[base + 1 + j]);
      g[f] = v;
      if (v != null) has = true;
    });
    if (label || has) out.push(g);
  }
  return out;
}

function certs(r) {
  const out = [];
  const kurumin = t(r[11]);
  const plKurumin = t(r[15]);
  const eruboshi = t(r[18]);
  const plEruboshi = t(r[17]);
  if (plKurumin.startsWith('認定あり')) out.push('プラチナくるみん');
  else if (kurumin.startsWith('認定あり')) out.push('くるみん');
  if (t(r[12]).startsWith('認定あり') || t(r[16]).startsWith('認定あり')) out.push('くるみんプラス');
  if (t(r[13]).startsWith('認定あり')) out.push('トライくるみん');
  if (plEruboshi.includes('認定あり')) out.push(plEruboshi.startsWith('プラス') ? 'プラチナえるぼしプラス' : 'プラチナえるぼし');
  else if (eruboshi.startsWith('認定段階')) out.push(`えるぼし（${eruboshi.replace('認定段階', '').replace(/[１1]/, '1').replace(/[２2]/, '2').replace(/[３3]/, '3')}段階目）`);
  if (t(r[20]) === '認定あり') out.push('ユースエール');
  if (t(r[19]).startsWith('受賞あり')) out.push('イクメン企業アワード');
  if (t(r[21]) === '認定あり') out.push('なでしこ銘柄');
  if (/年/.test(t(r[22]))) out.push('ダイバーシティ経営企業100選');
  if (/年/.test(t(r[23]))) out.push('100選プライム');
  if (/\d/.test(t(r[24]))) out.push('女性が輝く先進企業表彰');
  if (t(r[25]) === '受賞あり') out.push('均等・両立推進企業表彰');
  return out;
}

const SEIDO = [
  [226, '職種・雇用形態の転換制度'], [227, '正社員の再雇用・中途採用制度'], [228, '教育訓練・研修制度'],
  [229, 'キャリアコンサルティング制度'], [230, 'フレックスタイム制度'], [231, '在宅勤務・テレワーク'],
  [232, '短時間勤務制度'], [233, '病気・不妊治療のための休暇'], [234, '有給休暇の時間単位取得'],
];

function parsePositive(r) {
  const id = t(r[1]);
  const ind = INDUSTRY_BY_NAME.get(t(r[3]));
  const pref = PREF_BY_NAME.get(t(r[5]));
  const size = t(r[6]);
  const c = {
    id,
    name: t(r[0]),
    ind: ind ? ind.code : 32,
    indDetail: t(r[4]),
    pref: pref ? pref.code : 0,
    size,
    band: SIZE_BAND[size] || null,
    market: t(r[8]),
    stock: t(r[9]),
    certs: certs(r),
    seido: SEIDO.filter(([i]) => t(r[i])).map(([, name]) => name),
    target: t(r[220]),
    asOf: t(r[222]),
    updated: t(r[235]),
    d: {},
  };
  const d = c.d;
  d.saiyoJosei = groups(r, 31, 2, ['f']);
  d.kyoso = groups(r, 42, 3, ['m', 'f']);
  d.rodoJosei = groups(r, 58, 2, ['f']);
  d.kinzoku = groups(r, 69, 5, ['m', 'f', 'diff']).map((g) => ({ label: g.label, m: g.m, f: g.f }));
  d.keizoku10 = groups(r, 95, 3, ['m', 'f']);
  d.ikukyu = groups(r, 111, 3, ['m', 'f']);
  d.zangyo = { scope: t(r[127]), v: num(r[128]), effort: t(r[129]) };
  d.zangyoK = groups(r, 131, 2, ['v']);
  d.yukyu = { v: num(r[142]) };
  d.yukyuK = groups(r, 144, 2, ['v']);
  d.kakari = { v: num(r[155]), n: num(r[156]), total: num(r[157]) };
  d.kanri = { v: num(r[159]), n: num(r[160]), total: num(r[161]) };
  d.yakuin = { v: num(r[163]), n: num(r[164]), total: num(r[165]) };
  d.chuto = { m: num(r[202]), f: num(r[203]) };
  d.chingin = { all: num(r[205]), reg: num(r[206]), non: num(r[207]), period: t(r[219]) };
  // 会社が書いた注記（計算の前提など）。数字の読み違いを防ぐのでページに載せる
  const note = (...idx) => idx.map((i) => t(r[i]).replace(/^[※\s]+/, '').trim()).filter((s, i, a) => s && a.indexOf(s) === i).join(' ／ ');
  d.notes = {
    zangyo: note(130, 141), yukyu: note(143, 154), ikukyu: note(126), kinzoku: note(94), keizoku10: note(110),
    yakushoku: note(158, 162, 166), rodoJosei: note(68), saiyoJosei: note(41), chingin: note(218), kyoso: note(57),
  };
  return c;
}

function parseShokuba(r) {
  const yes = (i) => t(r[i]).startsWith('1');
  const hires = triple(r[41]);
  const leavers = triple(r[42]);
  const sizeN = unit(r[27], '人');
  const extraCerts = [];
  if (yes(502)) extraCerts.push('ユースエール');
  if (yes(525)) extraCerts.push('安全衛生優良企業');
  if (yes(535)) extraCerts.push('健康経営銘柄');
  if (yes(549)) extraCerts.push('グッドキャリア企業アワード');
  if (yes(561)) extraCerts.push('障害者雇用優良事業所 大臣表彰');
  if (yes(570)) extraCerts.push('テレワーク推進企業 大臣表彰');
  if (yes(578)) extraCerts.push('もにす認定（障害者雇用優良中小事業主）');
  if (yes(582)) extraCerts.push(`働きやすい職場認証${t(r[584]) ? `（${t(r[584])}）` : ''}`);
  const training = [[474, '研修制度'], [476, 'メンター制度'], [477, '自己啓発支援'], [479, 'キャリアコンサルティング'], [481, '社内検定制度']]
    .filter(([i]) => yes(i)).map(([, n]) => n);
  return {
    name: t(r[1]),
    prefName: t(r[5]),
    addr: t(r[6]),
    sizeN,
    jsic: t(r[29]).slice(0, 1),
    gaiyo: t(r[30]),
    hp: t(r[31]),
    founded: t(r[35]),
    stock: t(r[36]),
    market: t(r[37]),
    youth: hires || leavers || t(r[178]) || t(r[193]) || t(r[237]) ? {
      hires, leavers,
      age: unit(r[178], '歳'),
      shoteigai: unit(r[193], '時間'),
      yukyuDays: unit(r[237], '日'),
    } : null,
    training,
    hellowork: t(r[499]),
    extraCerts,
  };
}

function latest(dir, re) {
  const files = fs.readdirSync(dir).filter((f) => re.test(f)).sort();
  if (!files.length) throw new Error(`${dir} に ${re} のファイルがありません。先に scripts/fetch.sh を実行してください。`);
  const f = files[files.length - 1];
  const m = f.match(/(\d{4})(\d{2})(\d{2})/);
  return { file: path.join(dir, f), date: m ? `${m[1]}年${+m[2]}月${+m[3]}日` : '' };
}

const sizeFromCount = (n) => {
  if (n == null) return '';
  if (n < 10) return '10人未満';
  if (n <= 100) return '10～100人';
  if (n <= 300) return '101～300人';
  if (n <= 500) return '301～500人';
  if (n <= 1000) return '501～1000人';
  if (n <= 5000) return '1001～5000人';
  return '5001人以上';
};

export async function loadAll(rawDir) {
  const pos = latest(path.join(rawDir, 'positivedb'), /\.csv$/i);
  const sho = latest(path.join(rawDir, 'shokuba'), /\.csv$/i);

  const companies = new Map();
  let header = null;
  await readCSV(pos.file, 'utf-8', (r) => {
    if (!header) { header = r; checkHeader(header, POSITIVE_COLS, '女性の活躍推進企業データベース'); return; }
    if (r.length !== header.length) return;
    const c = parsePositive(r);
    if (!/^\d{13}$/.test(c.id)) return;
    const prev = companies.get(c.id);
    // 同じ法人番号が2行ある場合は、更新日が新しい方を使う
    if (!prev || c.updated > prev.updated) companies.set(c.id, c);
  });

  const positivedbRows = companies.size;
  let sheader = null;
  let shokubaRows = 0;
  await readCSV(sho.file, 'shift_jis', (r) => {
    if (!sheader) { sheader = r; checkHeader(sheader, SHOKUBA_COLS, 'しょくばらぼ'); return; }
    if (r.length !== sheader.length) return;
    shokubaRows++;
    const id = t(r[0]);
    const existing = companies.get(id);
    const hasYouth = t(r[41]) !== '';
    if (!existing && !hasYouth) return;
    const s = parseShokuba(r);
    if (existing) {
      existing.s = s;
      for (const cert of s.extraCerts) if (!existing.certs.includes(cert)) existing.certs.push(cert);
      if (!existing.market && s.market) existing.market = s.market;
      if (!existing.stock && s.stock) existing.stock = s.stock;
      return;
    }
    // しょくばらぼだけに若者雇用の情報がある会社
    const ind = INDUSTRY_BY_JSIC.get(s.jsic) || INDUSTRY_BY_CODE.get(32);
    const pref = PREF_BY_NAME.get(s.prefName);
    const size = sizeFromCount(s.sizeN);
    companies.set(id, {
      id, name: s.name, ind: ind.code, indDetail: '', pref: pref ? pref.code : 0, size, band: SIZE_BAND[size] || null,
      market: s.market, stock: s.stock, certs: [...s.extraCerts], seido: [], target: '', asOf: '', updated: '', d: null, s,
    });
  });

  return {
    companies,
    sources: { positivedb: pos.date, shokuba: sho.date },
    counts: { positivedbRows, shokubaRows, merged: companies.size },
  };
}
