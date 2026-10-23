import { METRICS, SITE_NAME } from '../lib/meta.mjs';
import { esc, fmt, comma, truncate, safeUrl, shortName, avgText, posText, scopeLabel } from '../lib/format.mjs';
import { layout, breadcrumbs, grade, href, abs, companyPath, indPath, prefPath, prefOf, indOf, shareButtons, companyLinks } from '../lib/html.mjs';
import { summary, faqs, valueShort, medianShort } from '../lib/text.mjs';

const KW = { zangyo: '残業時間', yukyu: '有給取得率', ikukyu: '男性育休', kinzoku: '勤続年数', kanri: '女性管理職', chingin: '男女の賃金差', rishoku: '離職率' };

function reportCard(c) {
  const rows = METRICS.map((m) => {
    const x = c.m[m.key];
    if (!x) {
      return `<div class="rc-r rc-na"><div class="rc-k"><b>${m.label}</b><small>${m.name}</small></div><div class="rc-v">未公表</div><div class="rc-g">${grade(0)}</div></div>`;
    }
    if (x.invalid) {
      return `<div class="rc-r rc-na"><div class="rc-k"><b>${m.label}</b><small>${m.name}</small></div><div class="rc-v">${valueShort(m.key, x)}<small>値が不自然なため評定なし</small></div><div class="rc-g">${grade(0)}</div></div>`;
    }
    const pos = Math.round((1 - x.pct) * 1000) / 10;
    return `<div class="rc-r"><div class="rc-k"><b>${m.label}</b><small>${m.name}</small></div><div class="rc-v"><b>${valueShort(m.key, x)}</b><small>中央値 ${medianShort(m.key, x.median)}</small></div><div class="rc-g">${grade(x.grade)}<small>${posText(x)}</small></div><div class="rc-bar" aria-hidden="true"><i style="left:${pos}%"></i></div></div>`;
  }).join('\n');
  const avg = c.avg != null ? `<div class="rc-avg"><span>平均評定</span><b>${avgText(c.avg)}</b><small>${c.gradeCount}項目の平均</small></div>` : '';
  return `<section class="card rc" aria-labelledby="h-rc">
<div class="rc-h"><h2 id="h-rc">通信簿</h2>${avg}</div>
${rows}
<p class="note">評定は、同じ業種・同じ規模帯で同じ項目を公表している会社の中での位置です（5＝上位7%、4＝次の24%、3＝中央38%、2＝次の24%、1＝下位7%）。比べた相手：${esc(firstPeer(c))}。<a href="${href('about/#hyotei')}">評定のつけ方</a></p>
</section>`;
}

function firstPeer(c) {
  const x = METRICS.map((m) => c.m[m.key]).find((x) => x && !x.invalid);
  return x ? `${x.peer}の会社` : '—';
}

const td = (v, unit = '', digits = 1) => (v == null ? '<td>—</td>' : `<td>${fmt(v, digits)}${unit}</td>`);

function kubunTable(caption, head, rows) {
  if (!rows.length) return '';
  return `<div class="tw"><table class="dt"><caption>${esc(caption)}</caption><thead><tr>${head.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`;
}

// 会社が書いた注記
const noteP = (s) => (s ? `<p class="cn"><span>会社の注記</span>${esc(truncate(s, 260))}</p>` : '');

function details(c) {
  const d = c.d;
  const y = c.s?.youth;
  const parts = [];

  // 働き方
  const work = [];
  if (d) {
    if (d.zangyo.v != null) work.push(`<p>1か月あたりの平均残業時間（法定労働時間を超えた分）：<b>${fmt(d.zangyo.v)}時間</b>${d.zangyo.scope ? `（対象：${esc(scopeLabel(d.zangyo.scope))}）` : ''}</p>`);
    work.push(kubunTable('雇用管理区分ごとの平均残業時間', ['区分', '時間/月'], d.zangyoK.filter((g) => g.v != null).map((g) => `<tr><th>${esc(g.label || '—')}</th>${td(g.v, '時間')}</tr>`)));
    if (d.zangyo.v != null || d.zangyoK.some((g) => g.v != null)) work.push(noteP(d.notes.zangyo));
    if (d.zangyo.effort) work.push(`<p class="quote"><span>長時間労働を減らす取り組み（会社の記載）</span>${esc(truncate(d.zangyo.effort, 220))}</p>`);
    if (d.yukyu.v != null) work.push(`<p>年次有給休暇の取得率：<b>${fmt(d.yukyu.v)}%</b></p>`);
    work.push(kubunTable('雇用管理区分ごとの有給休暇取得率', ['区分', '取得率'], d.yukyuK.filter((g) => g.v != null).map((g) => `<tr><th>${esc(g.label || '—')}</th>${td(g.v, '%')}</tr>`)));
    if (d.yukyu.v != null || d.yukyuK.some((g) => g.v != null)) work.push(noteP(d.notes.yukyu));
  }
  if (y && (y.shoteigai != null || y.yukyuDays != null || y.age != null)) {
    const li = [];
    if (y.shoteigai != null) li.push(`<li>月平均の所定外労働時間：<b>${fmt(y.shoteigai)}時間</b></li>`);
    if (y.yukyuDays != null) li.push(`<li>正社員の有給休暇の平均取得日数：<b>${fmt(y.yukyuDays)}日</b></li>`);
    if (y.age != null) li.push(`<li>従業員の平均年齢：<b>${fmt(y.age)}歳</b></li>`);
    work.push(`<p class="sub">若者雇用促進法にもとづく公表（しょくばらぼ）</p><ul class="kv">${li.join('')}</ul>`);
  }
  if (work.join('').trim()) parts.push(`<section class="card"><h2>残業・有給</h2>${work.join('')}${d && (d.zangyo.v != null || d.zangyoK.some((g) => g.v != null)) ? '<p class="note">この残業時間は、1年間の総労働時間から法定労働時間（週40時間）を引いて月平均にした値です。所定の勤務時間が短い会社では、所定を超えて働いても0時間になることがあります。</p>' : ''}</section>`);

  // 育休・勤続
  if (d) {
    const fam = [];
    const ik = kubunTable('育児休業の取得率', ['区分', '男性', '女性'], d.ikukyu.filter((g) => g.m != null || g.f != null).map((g) => `<tr><th>${esc(g.label || '—')}</th>${td(g.m, '%')}${td(g.f, '%')}</tr>`));
    fam.push(ik, ik ? noteP(d.notes.ikukyu) : '');
    const kz = kubunTable('平均継続勤務年数', ['区分', '男性', '女性'], d.kinzoku.filter((g) => g.m != null || g.f != null).map((g) => `<tr><th>${esc(g.label || '—')}</th>${td(g.m, '年')}${td(g.f, '年')}</tr>`));
    fam.push(kz, kz ? noteP(d.notes.kinzoku) : '');
    const k10 = kubunTable('採用から10年前後たった人が続けて働いている割合', ['区分', '男性', '女性'], d.keizoku10.filter((g) => g.m != null || g.f != null).map((g) => `<tr><th>${esc(g.label || '—')}</th>${td(g.m, '%')}${td(g.f, '%')}</tr>`));
    fam.push(k10, k10 ? noteP(d.notes.keizoku10) : '');
    const famHtml = fam.join('');
    if (famHtml) parts.push(`<section class="card"><h2>育休・勤続年数</h2>${famHtml}${ik ? '<p class="note">育児休業の取得率が100%を超えるのは、分母（その年に子が生まれた人）と分子（その年に育休を始めた人）の年がずれる計算方法のためです。</p>' : ''}</section>`);

    // 女性の活躍・賃金
    const wom = [];
    const ratioRow = (label, o) => (o.v != null ? `<tr><th>${label}</th>${td(o.v, '%')}<td>${o.n != null && o.total != null ? `${comma(o.n)}人 / ${comma(o.total)}人` : '—'}</td></tr>` : '');
    const ratio = [ratioRow('係長級', d.kakari), ratioRow('管理職', d.kanri), ratioRow('役員', d.yakuin)].filter(Boolean);
    const rt = kubunTable('役職ごとの女性の割合', ['役職', '女性の割合', '女性 / 全体'], ratio);
    wom.push(rt, rt ? noteP(d.notes.yakushoku) : '');
    const rj = kubunTable('働いている人に占める女性の割合', ['区分', '女性'], d.rodoJosei.filter((g) => g.f != null).map((g) => `<tr><th>${esc(g.label || '—')}</th>${td(g.f, '%')}</tr>`));
    wom.push(rj, rj ? noteP(d.notes.rodoJosei) : '');
    const sj = kubunTable('採用した人に占める女性の割合', ['区分', '女性'], d.saiyoJosei.filter((g) => g.f != null).map((g) => `<tr><th>${esc(g.label || '—')}</th>${td(g.f, '%')}</tr>`));
    wom.push(sj, sj ? noteP(d.notes.saiyoJosei) : '');
    const ch = d.chingin;
    if (ch.all != null || ch.reg != null || ch.non != null) {
      wom.push(kubunTable(`男女の賃金の差異（男性の賃金＝100としたときの女性の賃金）${ch.period ? `／対象期間：${ch.period}` : ''}`, ['対象', '女性の賃金'],
        [['全労働者', ch.all], ['正規雇用', ch.reg], ['非正規雇用', ch.non]].filter(([, v]) => v != null).map(([l, v]) => `<tr><th>${l}</th>${td(v)}</tr>`)));
      wom.push(noteP(d.notes.chingin));
    }
    const womHtml = wom.join('');
    if (womHtml) parts.push(`<section class="card"><h2>女性の活躍・男女の賃金</h2>${womHtml}</section>`);
  }

  // 採用・定着
  const hire = [];
  if (y?.hires) {
    const yr = ['前年度', '2年度前', '3年度前'];
    hire.push(kubunTable('新卒者等の採用者数と離職者数（若者雇用促進法にもとづく公表）', ['年度', '採用', '離職'], yr.map((l, i) => `<tr><th>${l}</th><td>${y.hires[i]}人</td><td>${y.leavers ? `${y.leavers[i]}人` : '—'}</td></tr>`)));
  }
  if (d && (d.chuto.m != null || d.chuto.f != null)) hire.push(`<p>中途採用の実績：男性${d.chuto.m ?? '—'}人・女性${d.chuto.f ?? '—'}人</p>`);
  if (d) {
    const ky = kubunTable('採用の競争倍率', ['区分', '男性', '女性'], d.kyoso.filter((g) => g.m != null || g.f != null).map((g) => `<tr><th>${esc(g.label || '—')}</th>${td(g.m, '倍')}${td(g.f, '倍')}</tr>`));
    hire.push(ky, ky ? noteP(d.notes.kyoso) : '');
  }
  const hireHtml = hire.join('');
  if (hireHtml) parts.push(`<section class="card"><h2>採用・定着</h2>${hireHtml}</section>`);

  // 制度・認定
  const seido = [...(c.seido || []), ...((c.s?.training) || []).map((t) => `${t}あり`)];
  if (seido.length || c.certs.length) {
    parts.push(`<section class="card"><h2>制度・認定</h2>
${c.certs.length ? `<p class="sub">国などの認定・表彰</p><ul class="tags">${c.certs.map((t) => `<li class="tag tag-c">${esc(t)}</li>`).join('')}</ul>` : ''}
${seido.length ? `<p class="sub">公表している制度</p><ul class="tags">${seido.map((t) => `<li class="tag">${esc(t)}</li>`).join('')}</ul>` : ''}
${c.certs.length ? `<p class="note"><a href="${href('about/#nintei')}">認定・表彰の意味</a></p>` : ''}
</section>`);
  }
  return parts.join('\n');
}

function basics(c) {
  const s = c.s;
  const rows = [['法人番号', c.id]];
  if (s?.addr) rows.push(['所在地', s.addr]);
  rows.push(['業種', [indOf(c.ind)?.name, c.indDetail && c.indDetail !== indOf(c.ind)?.name ? c.indDetail : ''].filter(Boolean).join('／')]);
  if (c.size || s?.sizeN) rows.push(['従業員', [c.size ? c.size.replace('～', '〜') : '', s?.sizeN ? `（しょくばらぼ掲載：${comma(s.sizeN)}人）` : ''].join('')]);
  if (s?.founded) rows.push(['創業', s.founded]);
  if (c.stock) rows.push(['証券コード', `${c.stock}${c.market ? `（${c.market}）` : ''}`]);
  if (c.target) rows.push(['データの対象', c.target === '単体' ? '単体（この会社のみ）' : c.target]);
  const hp = safeUrl(s?.hp);
  const hw = safeUrl(s?.hellowork);
  const dl = rows.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('');
  const links = [
    hp ? `<a href="${esc(hp)}" rel="nofollow noopener" target="_blank">会社のホームページ</a>` : '',
    hw ? `<a href="${esc(hw)}" rel="nofollow noopener" target="_blank">ハローワークの求人を見る</a>` : '',
  ].filter(Boolean).join('');
  const gaiyo = s?.gaiyo ? `<p class="sub">事業の内容（しょくばらぼ掲載）</p><p class="gaiyo">${esc(truncate(s.gaiyo, 240))}</p>` : '';
  return `<section class="card"><h2>会社の基本情報</h2><dl class="dl">${dl}</dl>${gaiyo}${links ? `<p class="links">${links}</p>` : ''}</section>`;
}

export function renderCompany(c, ctx) {
  const ind = indOf(c.ind);
  const pref = prefOf(c.pref);
  const name = c.name;
  const sname = shortName(name);
  const path = companyPath(c.id);
  const graded = METRICS.filter((m) => c.m[m.key] && !c.m[m.key].invalid);
  const kws = graded.map((m) => KW[m.key]);
  const title = `${name}の${kws.slice(0, 3).join('・')}${c.avg != null ? `｜平均評定${avgText(c.avg)}` : ''}｜${SITE_NAME}`;
  const nums = graded.slice(0, 4).map((m) => `${m.short}${valueShort(m.key, c.m[m.key])}`).join('、');
  const description = `${name}（${pref ? pref.name : ''}・${ind.short}）の働きやすさを国の公開データで確認。${nums}。同じ業種・規模の会社と比べた5段階の評定つき。無料・登録不要。`;

  const bc = breadcrumbs([['トップ', ''], [ind.short, indPath(ind)], [name, null]]);
  const sum = summary(c);
  const qa = faqs(c);
  const badges = (ctx.badges.get(c.id) || []).slice(0, 6);

  const shareText = `${name}の通信簿${c.avg != null ? `：平均評定${avgText(c.avg)}` : ''}（${graded.slice(0, 4).map((m) => `${m.short}${c.m[m.key].grade}`).join('・')}）`;

  const similar = ctx.similar(c);
  const body = `${bc.html}
<header class="ph">
<p class="eyebrow">${esc([ind.short, pref ? pref.name : '', c.size ? c.size.replace('～', '〜') : ''].filter(Boolean).join('・'))}</p>
<h1>${esc(name)}の通信簿</h1>
<p class="lead">${esc(sname)}が国のデータベースで公表している残業時間・有給取得率・育休取得率などを、同じ業種・同じ規模の会社と比べて5段階で評定しました。</p>
</header>
${reportCard(c)}
${badges.length ? `<section class="card"><h2>ランキングでの順位</h2><ul class="badges">${badges.map((b) => `<li><a href="${href(b.path)}">${esc(b.title)}</a><b>${b.rank}位</b></li>`).join('')}</ul></section>` : ''}
<section class="card"><h2>ひとことで言うと</h2>${sum.map((s) => `<p>${esc(s)}</p>`).join('')}<p class="note">※数値は会社が自ら公表したもので、集計の範囲や時点は会社ごとに異なります${c.asOf ? `（データ集計時点：${esc(c.asOf)}）` : ''}。</p></section>
${details(c)}
${basics(c)}
${qa.length ? `<section class="card faq"><h2>よくある質問</h2>${qa.map(([q, a]) => `<h3>${esc(q)}</h3><p>${esc(a)}</p>`).join('')}</section>` : ''}
${similar.local.length ? `<section class="card"><h2>${esc(pref ? pref.name : '')}の${esc(ind.short)}の会社</h2>${companyLinks(similar.local)}<p class="more"><a href="${href(prefPath(pref))}">${esc(pref.name)}の会社の通信簿をもっと見る</a></p></section>` : ''}
${similar.peers.length ? `<section class="card"><h2>同じ業種・同じくらいの規模の会社</h2>${companyLinks(similar.peers)}<p class="more"><a href="${href(indPath(ind))}">${esc(ind.short)}の会社をもっと見る</a></p></section>` : ''}
${shareButtons(abs(path), shareText)}
<p class="note src">${c.updated ? `この会社のデータの最終更新日：${esc(c.updated)}。` : ''}元の公表内容は、厚生労働省の女性の活躍推進企業データベースやしょくばらぼで会社名を検索すると確認できます。</p>`;

  const ld = [
    bc.ld,
    { '@type': 'WebPage', about: { '@type': 'Organization', name, identifier: { '@type': 'PropertyValue', propertyID: '法人番号', value: c.id } }, dateModified: ctx.isoDate },
  ];
  return layout({ title, description, path, body, ld, ogTitle: `${name}の通信簿${c.avg != null ? `（平均評定${avgText(c.avg)}）` : ''}` });
}
