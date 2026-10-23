// サイト全体で使う定数（都道府県・業種・指標・規模帯）

export const SITE_NAME = '会社の通信簿';
export const OPERATOR = '合同会社mico';
export const OPERATOR_ID = '8250003003918';
export const CONTACT = 'mico.95.official@gmail.com';

export const SOURCES = {
  positivedb: {
    name: '女性の活躍推進企業データベースオープンデータ',
    url: 'https://positive-ryouritsu.mhlw.go.jp/positivedb/opendata/',
  },
  shokuba: {
    name: '職場情報総合サイト（しょくばらぼ）',
    url: 'https://shokuba.mhlw.go.jp',
  },
};

// [コード, 名前, スラッグ]
export const PREFS = [
  ['01', '北海道', 'hokkaido'], ['02', '青森県', 'aomori'], ['03', '岩手県', 'iwate'], ['04', '宮城県', 'miyagi'],
  ['05', '秋田県', 'akita'], ['06', '山形県', 'yamagata'], ['07', '福島県', 'fukushima'], ['08', '茨城県', 'ibaraki'],
  ['09', '栃木県', 'tochigi'], ['10', '群馬県', 'gunma'], ['11', '埼玉県', 'saitama'], ['12', '千葉県', 'chiba'],
  ['13', '東京都', 'tokyo'], ['14', '神奈川県', 'kanagawa'], ['15', '新潟県', 'niigata'], ['16', '富山県', 'toyama'],
  ['17', '石川県', 'ishikawa'], ['18', '福井県', 'fukui'], ['19', '山梨県', 'yamanashi'], ['20', '長野県', 'nagano'],
  ['21', '岐阜県', 'gifu'], ['22', '静岡県', 'shizuoka'], ['23', '愛知県', 'aichi'], ['24', '三重県', 'mie'],
  ['25', '滋賀県', 'shiga'], ['26', '京都府', 'kyoto'], ['27', '大阪府', 'osaka'], ['28', '兵庫県', 'hyogo'],
  ['29', '奈良県', 'nara'], ['30', '和歌山県', 'wakayama'], ['31', '鳥取県', 'tottori'], ['32', '島根県', 'shimane'],
  ['33', '岡山県', 'okayama'], ['34', '広島県', 'hiroshima'], ['35', '山口県', 'yamaguchi'], ['36', '徳島県', 'tokushima'],
  ['37', '香川県', 'kagawa'], ['38', '愛媛県', 'ehime'], ['39', '高知県', 'kochi'], ['40', '福岡県', 'fukuoka'],
  ['41', '佐賀県', 'saga'], ['42', '長崎県', 'nagasaki'], ['43', '熊本県', 'kumamoto'], ['44', '大分県', 'oita'],
  ['45', '宮崎県', 'miyazaki'], ['46', '鹿児島県', 'kagoshima'], ['47', '沖縄県', 'okinawa'],
].map(([code, name, slug]) => ({ code: +code, name, slug, short: name.replace(/[都府県]$/, '') || name }));
PREFS.find((p) => p.code === 1).short = '北海道';

export const PREF_BY_NAME = new Map(PREFS.map((p) => [p.name, p]));

// 業種（女性の活躍推進企業データベースの分類。番号は同DBの業種別ダウンロードの番号）
// [番号, データ上の名前, 短い名前, スラッグ, 日本標準産業分類の大分類（しょくばらぼ側の対応）]
export const INDUSTRIES = [
  [1, '農業、林業', '農業・林業', 'agriculture', 'A'],
  [2, '漁業', '漁業', 'fishery', 'B'],
  [3, '鉱業、採石業、砂利採取業', '鉱業・採石業', 'mining', 'C'],
  [4, '建設業', '建設業', 'construction', 'D'],
  [5, '食料品、飲料・たばこ・飼料製造業', '食品・飲料製造', 'food', ''],
  [6, '繊維工業', '繊維工業', 'textile', ''],
  [7, '木材・木製品、家具・装備品製造業', '木材・家具製造', 'wood', ''],
  [8, 'パルプ・紙・紙加工品製造業、印刷業・印刷関連業', '紙・印刷', 'paper-printing', ''],
  [9, '化学工業', '化学', 'chemical', ''],
  [10, '石油製品・石炭製品製造業', '石油・石炭製品', 'petroleum', ''],
  [11, 'プラスチック製品製造業、ゴム製品製造業', 'プラスチック・ゴム', 'plastic-rubber', ''],
  [12, '鉄鋼業、非鉄金属・金属製品製造業', '鉄鋼・金属製品', 'metal', ''],
  [13, 'はん用機械器具・生産用機械器具・業務用機械器具製造業', '機械器具製造', 'machinery', ''],
  [14, '電子部品・デバイス・電子回路・電気機械器具・情報通信機械器具製造業', '電子部品・電気機械', 'electronics', ''],
  [15, '輸送用機械器具製造業', '自動車・輸送用機械', 'transport-equipment', ''],
  [16, 'その他製造業', 'その他の製造業', 'manufacturing', 'E'],
  [17, '電気・ガス・熱供給・水道業', '電気・ガス・水道', 'utilities', 'F'],
  [18, '情報通信業', '情報通信（IT）', 'it', 'G'],
  [19, '報道', '報道', 'media', ''],
  [20, '運輸業、郵便業', '運輸・物流', 'logistics', 'H'],
  [21, '卸売業、小売業', '卸売・小売', 'wholesale-retail', 'I'],
  [22, '金融業、保険業', '金融・保険', 'finance', 'J'],
  [23, '不動産業、物品賃貸業', '不動産・物品賃貸', 'real-estate', 'K'],
  [24, '学術研究、専門・技術サービス業', '専門・技術サービス', 'professional', 'L'],
  [25, '宿泊業、飲食サービス業', '宿泊・飲食', 'hospitality', 'M'],
  [26, '生活関連サービス業、娯楽業', '生活関連サービス・娯楽', 'lifestyle', 'N'],
  [27, '教育、学習支援業', '教育・学習支援', 'education', 'O'],
  [28, '医療、福祉', '医療・福祉', 'healthcare', 'P'],
  [29, '複合サービス事業', '複合サービス', 'compound-service', 'Q'],
  [30, 'サービス業（他に分類されないもの）', 'サービス業（その他）', 'services', 'R'],
  [31, '公務（他に分類されるものを除く）', '公務', 'public', 'S'],
  [32, '分類不能の産業', '分類不能', 'other', 'T'],
].map(([code, name, short, slug, jsic]) => ({ code, name, short, slug, jsic }));

export const INDUSTRY_BY_NAME = new Map(INDUSTRIES.map((i) => [i.name, i]));
export const INDUSTRY_BY_JSIC = new Map(INDUSTRIES.filter((i) => i.jsic).map((i) => [i.jsic, i]));
export const INDUSTRY_BY_CODE = new Map(INDUSTRIES.map((i) => [i.code, i]));

// 規模帯。評定は「同じ業種 × 同じ規模帯」で比べる
export const SIZE_ORDER = ['10人未満', '10～100人', '101～300人', '301～500人', '501～1000人', '1001～5000人', '5001人以上'];
export const SIZE_BAND = {
  '10人未満': 'S', '10～100人': 'S', '101～300人': 'S',
  '301～500人': 'M', '501～1000人': 'M',
  '1001～5000人': 'L', '5001人以上': 'L',
};
export const BAND_LABEL = { S: '300人以下', M: '301〜1000人', L: '1001人以上' };
export const BAND_NAME = { L: '大企業', M: '中堅企業', S: '中小企業' };
// ランキングに載せる規模（100人以下は値のばらつきが大きいので外す）
export const RANKABLE_SIZES = new Set(['101～300人', '301～500人', '501～1000人', '1001～5000人', '5001人以上']);
export const RANK_BAND_LABEL = { L: '1001人以上', M: '301〜1000人', S: '101〜300人' };

// 評定に使う指標。score(v) を比べる値にし、better は score が「低いほど良い(low)／高いほど良い(high)」
export const METRICS = [
  {
    key: 'zangyo', slug: 'zangyo', label: '残業の少なさ', short: '残業', name: '月平均残業時間（法定労働時間を超えた分）', unit: '時間', better: 'low', digits: 1,
    rankTitle: '残業が少ない会社ランキング', rankLead: '1か月あたりの平均残業時間（法定労働時間を超えた分）が短い順',
    // 法定労働時間を下回るとマイナスになるので、マイナスは0として比べる
    valid: (v) => v >= -100 && v <= 150, score: (v) => Math.max(v, 0),
  },
  {
    key: 'yukyu', slug: 'yukyu', label: '有給の取りやすさ', short: '有給', name: '有給休暇取得率', unit: '%', better: 'high', digits: 1,
    rankTitle: '有給休暇取得率が高い会社ランキング', rankLead: '年次有給休暇の取得率が高い順（100%を超える値は100%として扱います）',
    valid: (v) => v >= 0 && v <= 200, score: (v) => Math.min(v, 100),
  },
  {
    key: 'ikukyu', slug: 'ikukyu', label: '男性の育休', short: '男性育休', name: '男性の育児休業取得率', unit: '%', better: 'high', digits: 1,
    rankTitle: '男性の育休取得率が高い会社ランキング', rankLead: '男性の育児休業取得率が高い順（100%を超える値は100%として扱います）',
    valid: (v) => v >= 0 && v <= 1000, score: (v) => Math.min(v, 100),
  },
  {
    key: 'kinzoku', slug: 'kinzoku', label: '勤続年数', short: '勤続', name: '平均継続勤務年数', unit: '年', better: 'high', digits: 1,
    rankTitle: '平均勤続年数が長い会社ランキング', rankLead: '平均継続勤務年数（男女の平均）が長い順',
    valid: (v) => v > 0 && v <= 45, score: (v) => v,
  },
  {
    key: 'kanri', slug: 'josei-kanri', label: '女性管理職', short: '女性管理職', name: '管理職に占める女性の割合', unit: '%', better: 'high', digits: 1,
    rankTitle: '女性管理職比率が高い会社ランキング', rankLead: '管理職に占める女性の割合が高い順',
    valid: (v) => v >= 0 && v <= 100, score: (v) => v,
  },
  {
    key: 'chingin', slug: 'chingin', label: '男女の賃金差', short: '賃金差', name: '男女の賃金の差異（男性=100）', unit: '', better: 'low', digits: 1,
    rankTitle: '男女の賃金差が小さい会社ランキング', rankLead: '男性の賃金を100としたときの女性の賃金が100に近い順',
    valid: (v) => v >= 1 && v <= 300, score: (v) => Math.abs(100 - v),
  },
  {
    key: 'rishoku', slug: 'shinsotsu', label: '新卒の定着', short: '新卒定着', name: '新卒採用者の離職割合（直近3年度・目安）', unit: '%', better: 'low', digits: 1,
    rankTitle: '新卒の離職が少ない会社ランキング', rankLead: '直近3年度の新卒採用者に対する離職者の割合が低い順（採用10人以上）',
    valid: (v) => v >= 0 && v <= 100, score: (v) => v,
  },
];
export const METRIC_BY_KEY = new Map(METRICS.map((m) => [m.key, m]));

// 評定のしきい値（学校の相対評価に合わせる：5=上位7%、4=次の24%、3=中央38%、2=次の24%、1=下位7%）
export const GRADE_CUTS = [0.07, 0.31, 0.69, 0.93];
export const GRADE_WORD = { 5: 'とても良い', 4: '良い', 3: 'ふつう', 2: 'やや低い', 1: '低い' };
export const MIN_PEERS = 30;
// 総合ランキングに載せる最低項目数（少ない項目だけ公表した会社が上に来すぎないように）
export const OVERALL_MIN_ITEMS = 5;
