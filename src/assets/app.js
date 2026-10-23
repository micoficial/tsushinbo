// 会社名の検索（索引は端末に読み込んで照合する。入力した文字は外に送らない）とリンクのコピー
(() => {
  const script = document.currentScript;
  const base = script ? script.src.replace(/assets\/app\.js.*$/, '') : '/';
  const ver = script ? (script.src.split('?v=')[1] || '') : '';
  let index = null;
  let loading = null;

  const KIND = /株式会社|有限会社|合同会社|合資会社|合名会社|一般社団法人|公益社団法人|一般財団法人|公益財団法人|社会福祉法人|医療法人社団|医療法人財団|医療法人|学校法人|特定非営利活動法人|\(株\)|\(有\)|㈱|㈲/g;
  const norm = (s) => s.normalize('NFKC').toLowerCase()
    .replace(KIND, '')
    .replace(/[ァ-ヶ]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x60))
    .replace(/[\s・･.,，、。\-‐－—―ー〜~&＆'’"“”()（）［］\[\]]/g, '');

  function load() {
    if (index) return Promise.resolve(index);
    if (!loading) {
      loading = fetch(`${base}assets/index.json${ver ? `?v=${ver}` : ''}`)
        .then((r) => r.json())
        .then((j) => {
          index = j;
          index.n = j.c.map((row) => norm(row[1]));
          return index;
        });
    }
    return loading;
  }

  function search(q, limit) {
    const k = norm(q);
    if (!k) return [];
    const out = [];
    const { c, n } = index;
    for (let i = 0; i < c.length; i++) {
      const p = n[i].indexOf(k);
      if (p < 0) continue;
      // 先頭一致・名前の短さ・索引の順（大きい会社が先）で並べる
      out.push([p === 0 ? 0 : 1, n[i].length - k.length, i]);
    }
    out.sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2]);
    return out.slice(0, limit).map(([, , i]) => c[i]);
  }

  const esc = (s) => String(s).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const meta = (row) => [index.inds[row[3]], index.prefs[row[2] - 1]].filter(Boolean).join('・') + (row[4] ? `　平均評定 ${(row[4] / 10).toFixed(1)}` : '');
  const url = (row) => `${base}c/${row[0]}/`;

  function bind(form) {
    const input = form.querySelector('.sb-i');
    const box = form.querySelector('.sb-r');
    if (!input || !box) return;
    let rows = [];
    let sel = -1;
    const close = () => { box.hidden = true; sel = -1; };
    const render = () => {
      if (!input.value.trim()) { close(); return; }
      rows = search(input.value, 8);
      box.innerHTML = rows.length
        ? rows.map((r, i) => `<a href="${url(r)}"${i === sel ? ' class="on"' : ''}>${esc(r[1])}<small>${esc(meta(r))}</small></a>`).join('')
        : '<div class="sb-none">見つかりませんでした。「株式会社」を外したり、一部だけで探してください。</div>';
      box.hidden = false;
    };
    input.addEventListener('focus', () => { load().then(() => input.value && render()); });
    input.addEventListener('input', () => { sel = -1; load().then(render); });
    input.addEventListener('keydown', (e) => {
      if (box.hidden || !rows.length) return;
      if (e.key === 'ArrowDown') { sel = Math.min(rows.length - 1, sel + 1); render(); e.preventDefault(); }
      else if (e.key === 'ArrowUp') { sel = Math.max(-1, sel - 1); render(); e.preventDefault(); }
      else if (e.key === 'Escape') close();
    });
    form.addEventListener('submit', (e) => {
      if (sel >= 0 && rows[sel]) { e.preventDefault(); location.href = url(rows[sel]); }
    });
    document.addEventListener('click', (e) => { if (!form.contains(e.target)) close(); });
  }
  document.querySelectorAll('form.sb').forEach(bind);

  // 検索ページ
  const results = document.getElementById('results');
  if (results) {
    const q = new URLSearchParams(location.search).get('q') || '';
    const input = document.querySelector('.sb-page .sb-i');
    if (input) input.value = q;
    if (q) {
      results.textContent = '読み込み中…';
      load().then(() => {
        const rows = search(q, 100);
        results.innerHTML = `<p>「${esc(q)}」の結果：${rows.length >= 100 ? '100件以上（上位100件）' : `${rows.length}件`}</p>`
          + (rows.length ? `<ul class="cl">${rows.map((r) => `<li><a href="${url(r)}"><span class="cl-n">${esc(r[1])}</span><span class="cl-m">${esc(meta(r))}</span></a></li>`).join('')}</ul>` : '');
      }).catch(() => { results.textContent = '索引を読み込めませんでした。時間をおいてお試しください。'; });
    }
  }

  // リンクのコピー
  document.querySelectorAll('.share').forEach((el) => {
    const btn = el.querySelector('.sh-copy');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const u = el.dataset.url || location.href;
      const done = () => { btn.textContent = 'コピーしました'; setTimeout(() => { btn.textContent = 'リンクをコピー'; }, 1800); };
      if (navigator.clipboard) navigator.clipboard.writeText(u).then(done, () => prompt('このリンクをコピーしてください', u));
      else prompt('このリンクをコピーしてください', u);
    });
  });
})();
