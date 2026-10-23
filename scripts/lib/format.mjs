// 表示用の小さな関数

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c]);

export function fmt(v, digits = 1) {
  if (v == null || !Number.isFinite(v)) return '—';
  const r = Math.round(v * 10 ** digits) / 10 ** digits;
  return Number.isInteger(r) ? r.toLocaleString('ja-JP') : r.toLocaleString('ja-JP', { minimumFractionDigits: 0, maximumFractionDigits: digits });
}

// 平均評定はいつも小数1桁（3 → 3.0）
export const avgText = (v) => (v == null ? '—' : v.toFixed(1));

// 比べた相手の中での位置。真ん中より下は「下位◯%」と言う
export function posText(x) {
  if (x.isBest) return '最高水準';
  return x.top <= 50 ? `上位${x.top}%` : `下位${Math.max(1, 101 - x.top)}%`;
}

// 「対象正社員」「対象労働者」の「対象」を外す
export const scopeLabel = (s) => String(s ?? '').replace(/^対象(?=.)/, '');

export function withUnit(v, unit, digits = 1) {
  if (v == null) return '—';
  return `${fmt(v, digits)}${unit}`;
}

export const comma = (n) => Number(n).toLocaleString('ja-JP');

// 会社名から「株式会社」などを外した呼び名（文中で使う）
const KIND = /^(株式会社|有限会社|合同会社|合資会社|合名会社|一般社団法人|公益社団法人|一般財団法人|公益財団法人|社会福祉法人|医療法人社団|医療法人財団|医療法人|学校法人|特定非営利活動法人|独立行政法人|地方独立行政法人|国立大学法人|社会医療法人|生活協同組合|協同組合|信用金庫|農業協同組合)\s*|\s*(株式会社|有限会社|合同会社|合資会社|合名会社)$/g;
export const shortName = (name) => {
  const s = name.replace(KIND, '').trim();
  return s.length >= 2 ? s : name;
};

export function truncate(s, n) {
  s = String(s ?? '').replace(/\s+/g, ' ').trim();
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}

export function safeUrl(u) {
  u = String(u ?? '').trim();
  if (!/^https?:\/\/[^\s"'<>]+$/i.test(u)) return '';
  return u;
}
