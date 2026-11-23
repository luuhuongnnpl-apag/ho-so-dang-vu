/* PHÚC NGUYÊN · HỒ SƠ ĐẢNG VỤ — giao diện theo PND. Mọi kiểm tra quyền thực hiện ở máy chủ Apps Script. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var S = { token: null, user: null, cats: [], blobUrl: null, current: [] };
  var store = {
    get: function (k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} },
    del: function (k) { try { sessionStorage.removeItem(k); } catch (e) {} }
  };

  /* ---------- Biểu tượng bìa (theo PND) ---------- */
  var ICONS = {"doc":"<rect x=\"56\" y=\"24\" width=\"48\" height=\"62\" rx=\"4\" fill=\"#fff\" opacity=\".95\"/><path d=\"M64 38h32M64 47h32M64 56h24\" stroke=\"#9fb6cf\" stroke-width=\"3\" stroke-linecap=\"round\"/><circle cx=\"92\" cy=\"74\" r=\"9\" fill=\"#e8b84a\"/><path d=\"M88 74l3 3 5-6\" stroke=\"#fff\" stroke-width=\"2.4\" fill=\"none\" stroke-linecap=\"round\"/>","cap":"<path d=\"M80 30l40 16-40 16-40-16z\" fill=\"#fff\"/><path d=\"M58 54v14c0 6 10 11 22 11s22-5 22-11V54l-22 9z\" fill=\"#fff\" opacity=\".85\"/><path d=\"M116 48v20\" stroke=\"#e8b84a\" stroke-width=\"3\"/><circle cx=\"116\" cy=\"70\" r=\"3.5\" fill=\"#e8b84a\"/>","book":"<path d=\"M38 34c14-6 28-6 42 2v50c-14-8-28-8-42-2z\" fill=\"#fff\"/><path d=\"M122 34c-14-6-28-6-42 2v50c14-8 28-8 42-2z\" fill=\"#fff\" opacity=\".85\"/><path d=\"M48 46h22M48 54h22M90 46h22M90 54h22\" stroke=\"#9fb6cf\" stroke-width=\"2.4\" stroke-linecap=\"round\"/>","board":"<rect x=\"36\" y=\"26\" width=\"88\" height=\"54\" rx=\"4\" fill=\"#fff\"/><path d=\"M48 42h40M48 52h56M48 62h32\" stroke=\"#c7a28f\" stroke-width=\"3\" stroke-linecap=\"round\"/><path d=\"M72 80l-10 16M88 80l10 16\" stroke=\"#fff\" stroke-width=\"4\" stroke-linecap=\"round\"/>","flask":"<path d=\"M70 24h20M73 24v22l-22 38c-3 6 1 12 8 12h42c7 0 11-6 8-12L87 46V24\" fill=\"#fff\"/><path d=\"M58 76h44l6 10c1 3-1 6-4 6H56c-3 0-5-3-4-6z\" fill=\"#7fc3ea\"/><circle cx=\"76\" cy=\"66\" r=\"3\" fill=\"#7fc3ea\"/><circle cx=\"86\" cy=\"58\" r=\"2.4\" fill=\"#7fc3ea\"/>","folder":"<path d=\"M38 36h30l8 8h46v44c0 3-2 5-5 5H43c-3 0-5-2-5-5z\" fill=\"#fff\"/><path d=\"M38 50h84\" stroke=\"#c9d1dc\" stroke-width=\"3\"/>","inbox":"<path d=\"M40 54l14-26h52l14 26v32c0 3-2 5-5 5H45c-3 0-5-2-5-5z\" fill=\"#fff\"/><path d=\"M40 56h24l6 10h20l6-10h24\" stroke=\"#c29a35\" stroke-width=\"3\" fill=\"none\"/>","key":"<circle cx=\"62\" cy=\"58\" r=\"16\" fill=\"none\" stroke=\"#fff\" stroke-width=\"7\"/><path d=\"M76 58h42M106 58v12M96 58v9\" stroke=\"#fff\" stroke-width=\"7\" stroke-linecap=\"round\"/>","cal":"<rect x=\"44\" y=\"30\" width=\"72\" height=\"60\" rx=\"6\" fill=\"#fff\"/><rect x=\"44\" y=\"30\" width=\"72\" height=\"16\" rx=\"6\" fill=\"#e8b84a\"/><path d=\"M58 24v12M102 24v12\" stroke=\"#fff\" stroke-width=\"5\" stroke-linecap=\"round\"/><path d=\"M56 58h10M74 58h10M92 58h10M56 72h10M74 72h10\" stroke=\"#9fb6cf\" stroke-width=\"5\" stroke-linecap=\"round\"/>","mail":"<rect x=\"38\" y=\"32\" width=\"84\" height=\"56\" rx=\"6\" fill=\"#fff\"/><path d=\"M40 36l40 30 40-30\" stroke=\"#c0504d\" stroke-width=\"5\" fill=\"none\" stroke-linejoin=\"round\"/>","lib":"<path d=\"M44 86V44l36-16 36 16v42\" fill=\"none\" stroke=\"#fff\" stroke-width=\"5\" stroke-linejoin=\"round\"/><path d=\"M56 50v30M70 50v30M90 50v30M104 50v30M40 88h80\" stroke=\"#fff\" stroke-width=\"5\" stroke-linecap=\"round\"/>"};
  var CAT_STYLE = { // số mục → [biểu tượng, màu đầu, màu cuối]
    1: ['board', '#254b73', '#356596'], 2: ['board', '#214b2f', '#2f6b45'], 3: ['inbox', '#8a5a00', '#c29a35'],
    4: ['mail', '#9b2c2c', '#c0504d'], 7: ['book', '#193553', '#3a6ea5'], 8: ['key', '#4b3b7a', '#6f5fb0'],
    9: ['cap', '#214b2f', '#3b7d55'], 10: ['cal', '#254b73', '#4a7fb5'], 11: ['doc', '#1b6e3a', '#3c9a62'],
    12: ['flask', '#1d4f86', '#3a78bf'], 13: ['lib', '#5b4636', '#8a6d55'], 14: ['folder', '#475569', '#64748b'],
    15: ['book', '#7a2e2e', '#a84a4a'], 16: ['doc', '#8a5a00', '#b8862f']
  };
  var gid = 0;
  function cover(icon, a, b, label) {
    var id = 'g' + (++gid);
    var tag = label ? '<rect x="96" y="92" width="58" height="22" rx="11" fill="#fff" opacity=".92"/><text x="125" y="108" text-anchor="middle" font-family="Be Vietnam Pro,Arial" font-size="13" font-weight="700" fill="' + a + '">' + esc(label) + '</text>' : '';
    return '<svg viewBox="0 0 160 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + a + '"/><stop offset="1" stop-color="' + b + '"/></linearGradient></defs><rect width="160" height="120" fill="url(#' + id + ')"/><circle cx="140" cy="16" r="34" fill="#fff" opacity=".08"/><circle cx="14" cy="110" r="26" fill="#fff" opacity=".07"/>' + (ICONS[icon] || ICONS.folder) + tag + '</svg>';
  }
  function catStyle(no) { return CAT_STYLE[no] || ['folder', '#254b73', '#356596']; }

  /* ---------- Tiện ích ---------- */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function status(t, err) { var el = $('status'); el.textContent = t || ''; el.className = 'status' + (err ? ' e' : ''); }
  function fmtDate(iso) { var d = new Date(iso); return isNaN(d) ? '' : d.toLocaleDateString('vi-VN'); }
  function fmtSize(b) { if (!b) return ''; return b > 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB'; }
  function fmtOf(f) {
    var m = f.mime || '', n = (f.name || '').toLowerCase();
    if (m === 'application/pdf' || /\.pdf$/.test(n)) return ['pdf', 'PDF'];
    if (/wordprocessing|msword|google-apps\.document/.test(m) || /\.docx?$/.test(n)) return ['word', 'DOC'];
    if (/spreadsheet|excel|google-apps\.spreadsheet/.test(m) || /\.xlsx?$/.test(n)) return ['excel', 'XLS'];
    if (/presentation|powerpoint/.test(m) || /\.pptx?$/.test(n)) return ['ppt', 'PPT'];
    if (/^image\//.test(m)) return ['image', 'ẢNH'];
    if (/^(video|audio)\//.test(m)) return ['media', 'MEDIA'];
    return ['khac', 'FILE'];
  }

  function api(action, data) {
    var url = (window.PN_CONFIG || {}).GAS_URL;
    if (!url) return Promise.reject(new Error('Chưa cấu hình máy chủ (GAS_URL trong js/config.js).'));
    var body = Object.assign({ action: action, token: S.token }, data || {});
    return fetch(url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body) })
      .then(function (r) { if (!r.ok) throw new Error('Lỗi kết nối máy chủ (' + r.status + ').'); return r.json(); })
      .then(function (res) {
        if (res.error === 'AUTH') { logout(); throw new Error(res.message); }
        if (!res.ok) throw new Error(res.message || res.error || 'Có lỗi xảy ra.');
        return res;
      });
  }

  /* ---------- Phiên ---------- */
  function showApp() {
    $('loginForm').hidden = true; $('appView').hidden = false;
    $('btnLogout').hidden = false; $('btnPwTop').hidden = false; $('btnPw').hidden = false;
    $('whoami').textContent = S.user.name + ' · ' + S.user.tierLabel;
    route();
  }
  function logout() {
    S.token = S.user = null; S.cats = []; store.del('pn_dv'); closeViewer();
    $('appView').hidden = true; $('loginForm').hidden = false;
    $('btnLogout').hidden = true; $('btnPwTop').hidden = true; $('btnPw').hidden = true;
    $('whoami').textContent = ''; $('main').innerHTML = '';
    $('catNav').innerHTML = '<p class="muted" style="margin:6px 8px">Đăng nhập để xem danh mục.</p>';
    renderStats();
    if (location.hash) history.replaceState(null, '', location.pathname);
  }
  $('loginForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var btn = $('loginGo'), err = $('loginErr');
    var id = $('inId').value.trim().toLowerCase(), pw = $('inPw').value;
    if (!id || !pw) { err.textContent = 'Nhập tên đăng nhập và mật khẩu.'; return; }
    btn.disabled = true; err.textContent = '';
    api('login', { id: id, pw: pw })
      .then(function (r) {
        S.token = r.token; S.user = r.user; store.set('pn_dv', JSON.stringify({ token: r.token, user: r.user }));
        $('inPw').value = ''; showApp();
      })
      .catch(function (x) { err.textContent = x.message; })
      .then(function () { btn.disabled = false; });
  });
  $('btnLogout').addEventListener('click', logout);

  /* ---------- Điều hướng ---------- */
  function route() {
    var m = location.hash.match(/^#f=([\w-]+)$/);
    m ? openFolder(m[1]) : openRoot();
  }
  window.addEventListener('hashchange', function () { if (S.token) route(); });
  function go(id) { if (id) location.hash = 'f=' + id; else if (location.hash) location.hash = ''; else route(); }
  $('brandHome').addEventListener('click', function (e) { e.preventDefault(); if (S.token) go(''); });
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-go]'); if (t) { e.preventDefault(); go(t.dataset.go); return; }
    var f = e.target.closest('[data-file]'); if (f) openFile(S.current[+f.dataset.file]);
  });

  function renderNav(activeId) {
    var html = '<button class="cat home' + (!activeId ? ' on' : '') + '" data-go="">Trang chủ</button>';
    S.cats.forEach(function (c) {
      html += '<button class="cat' + (c.id === activeId ? ' on' : '') + '" data-go="' + esc(c.id) + '"><span class="dot" style="background:' + catStyle(c.no)[1] + '"></span><span class="nm">' + c.no + '. ' + esc(c.name) + '</span></button>';
    });
    $('catNav').innerHTML = html;
    var on = $('catNav').querySelector('.cat.on');
    if (on && on.scrollIntoView && window.innerWidth <= 1000) on.scrollIntoView({ block: 'nearest', inline: 'center' });
  }
  function renderStats(nFolders, nFiles) {
    var h = '<dt>Chi bộ</dt><dd>Khoa Luật</dd><dt>Nhiệm kỳ</dt><dd>2025 – 2027</dd>';
    if (S.user) h += '<dt>Tài khoản</dt><dd>' + esc(S.user.name) + '</dd><dt>Quyền</dt><dd>' + esc(S.user.tierLabel) + '</dd><dt>Mục được xem</dt><dd>' + S.cats.length + '</dd>';
    if (nFolders != null) h += '<dt>Thư mục đang mở</dt><dd>' + nFolders + ' thư mục · ' + nFiles + ' tệp</dd>';
    $('stats').innerHTML = h;
  }
  function crumbs(path) {
    var h = '<a data-go="">Trang chủ</a>';
    (path || []).forEach(function (p, i) {
      h += '<span class="sep">›</span>' + (i === path.length - 1 || !p.id ? '<b>' + esc(p.name) + '</b>' : '<a data-go="' + esc(p.id) + '">' + esc(p.name) + '</a>');
    });
    $('crumbs').innerHTML = h;
  }

  function cardsHtml(items, isCat) {
    return '<div class="cards">' + items.map(function (c) {
      var st = isCat ? catStyle(c.no) : ['folder', '#214b2f', '#3b7d55'];
      return '<div class="card-wrap"><button class="card" data-go="' + esc(c.id) + '"><span class="cv">' + cover(st[0], st[1], st[2], isCat ? 'Mục ' + c.no : '') + '</span><span class="nm">' + (isCat ? esc(c.name) : esc(c.name)) + '</span>' + (c.updated ? '<span class="ct">Cập nhật ' + fmtDate(c.updated) + '</span>' : '') + '</button></div>';
    }).join('') + '</div>';
  }
  function bookHtml(f) {
    var ft = fmtOf(f);
    return '<span class="doc-cover" data-file="' + f._i + '"><span class="book"><span class="spine" style="background:var(--navy)"></span><span class="badge-ft ' + ft[0] + '">' + ft[1] + '</span><img class="bl" src="./logo.png" alt=""><span class="bc">Chi bộ Khoa Luật</span></span></span>';
  }
  function rowsHtml(files, withWhere) {
    S.current = files;
    return '<div class="docs-list">' + files.map(function (f, i) {
      f._i = i;
      var meta = [fmtDate(f.updated) && 'Cập nhật ' + fmtDate(f.updated), fmtSize(f.size)].filter(Boolean).map(function (x) { return '<span>' + esc(x) + '</span>'; }).join('');
      return '<div class="doc-row">' + bookHtml(f) + '<div><h4 data-file="' + i + '">' + esc(f.name) + '</h4><div class="doc-meta">' + meta + '</div>' + (withWhere && f.where ? '<div class="doc-path muted">' + esc(f.where) + '</div>' : '') + '</div><div class="acts"><button class="btn-detail" data-file="' + i + '">Xem</button></div></div>';
    }).join('') + '</div>';
  }
  function box(title, inner) { return '<section class="box"><h3 class="box-title">' + esc(title) + '</h3>' + inner + '</section>'; }

  function load(p, then) {
    status('Đang tải…'); $('main').innerHTML = '';
    p.then(function (r) { status(''); then(r); }).catch(function (x) { status(x.message, true); });
  }
  function openRoot() {
    crumbs([]);
    load(api('list', {}), function (r) {
      S.cats = r.categories; renderNav(''); renderStats();
      var h = r.categories.length ? box('Các mục hồ sơ', cardsHtml(r.categories, true)) : '<p class="empty">Tài khoản chưa được cấp mục hồ sơ nào.</p>';
      if (r.files.length) h += box('Sổ sách chung', rowsHtml(r.files));
      $('main').innerHTML = h;
    });
  }
  function ensureCats() { return S.cats.length ? Promise.resolve() : api('list', {}).then(function (r) { S.cats = r.categories; }); }
  function openFolder(id) {
    load(ensureCats().then(function () { return api('list', { folderId: id }); }), function (r) {
      crumbs(r.path); renderNav(r.path[0] && r.path[0].id); renderStats(r.folders.length, r.files.length);
      var title = r.path[r.path.length - 1].name, h = '';
      if (r.folders.length) h += box(r.files.length ? 'Thư mục' : title, cardsHtml(r.folders, false));
      if (r.files.length) h += box(r.folders.length ? 'Tài liệu' : title, rowsHtml(r.files));
      $('main').innerHTML = h || box(title, '<p class="empty">Thư mục chưa có tài liệu.</p>');
    });
  }
  $('searchForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var q = $('searchInput').value.trim(); if (!q) return;
    crumbs([{ name: 'Kết quả tìm “' + q + '”' }]); renderNav(null);
    load(api('search', { q: q }), function (r) {
      $('main').innerHTML = r.results.length
        ? '<p class="count-line">Tìm thấy <b>' + r.results.length + '</b> văn bản</p>' + rowsHtml(r.results, true)
        : '<p class="empty">Không tìm thấy văn bản phù hợp trong các mục đồng chí được xem.</p>';
    });
  });

  /* ---------- Xem tệp ---------- */
  function openFile(f) {
    if (!f) return;
    status('Đang mở “' + f.name + '”…');
    api('file', { id: f.id }).then(function (r) {
      status('');
      var bin = atob(r.data), bytes = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      if (S.blobUrl) URL.revokeObjectURL(S.blobUrl);
      S.blobUrl = URL.createObjectURL(new Blob([bytes], { type: r.mime }));
      var viewable = r.mime === 'application/pdf' || /^image\//.test(r.mime) || /^text\//.test(r.mime);
      $('viewerName').textContent = r.name;
      $('viewerDl').href = S.blobUrl; $('viewerDl').download = r.name;
      $('viewerTab').href = S.blobUrl; $('viewerTab').hidden = !viewable;
      $('viewerFrame').hidden = !viewable; $('viewerFrame').src = viewable ? S.blobUrl : 'about:blank';
      $('viewer').hidden = false;
      if (!viewable) $('viewerDl').click();
    }).catch(function (x) { status(x.message, true); });
  }
  function closeViewer() { $('viewer').hidden = true; $('viewerFrame').src = 'about:blank'; }
  $('viewerClose').addEventListener('click', closeViewer);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !$('viewer').hidden) closeViewer(); });

  /* ---------- Đổi mật khẩu ---------- */
  function openPw() { $('pwForm').reset(); $('pwErr').textContent = ''; $('pwMsg').textContent = ''; $('dlgPw').showModal(); }
  $('btnPw').addEventListener('click', openPw); $('btnPwTop').addEventListener('click', openPw);
  $('pwCancel').addEventListener('click', function () { $('dlgPw').close(); });
  $('pwForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var nw = $('pwNew').value;
    if (nw.length < 6) { $('pwErr').textContent = 'Mật khẩu mới phải có ít nhất 6 ký tự.'; return; }
    $('pwErr').textContent = ''; $('pwMsg').textContent = 'Đang lưu…';
    api('changePw', { oldPw: $('pwOld').value, newPw: nw })
      .then(function (r) { $('pwMsg').textContent = r.message; setTimeout(function () { $('dlgPw').close(); }, 900); })
      .catch(function (x) { $('pwMsg').textContent = ''; $('pwErr').textContent = x.message; });
  });

  /* ---------- Khởi động ---------- */
  var saved = store.get('pn_dv');
  if (saved) { try { var o = JSON.parse(saved); S.token = o.token; S.user = o.user; showApp(); } catch (e) { store.del('pn_dv'); } }
})();
