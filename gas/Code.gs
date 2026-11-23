/**
 * PHÚC NGUYÊN – HỒ SƠ ĐẢNG VỤ · Chi bộ Khoa Luật · Nhiệm kỳ 2025-2027
 * Máy chủ Google Apps Script: chạy dưới tài khoản chủ Drive, kiểm tra quyền
 * ở phía máy chủ rồi mới trả danh mục/tệp. Web GitHub Pages không chứa dữ liệu.
 *
 * Danh sách tài khoản nằm trong tệp Users.gs (KHÔNG đưa lên GitHub).
 */

var CFG = {
  ROOT: '1nAQmb48CsFn2SoE2fY0puWkV4gFYNMuX',
  // Không bao giờ hiển thị, kể cả quản trị viên (sếp quyết 23/11/2026)
  BLOCKED: [
    '1Km8z-gsOkQP_4xadwYjcAxJjou4HB9Xk', // 5. SỔ VĂN BẢN MẬT
    '1HOxOE6veVjb-uZBYidlwQJmw6OR2nVyB'  // 6. SỔ GHI BẢO VỆ CHÍNH TRỊ NỘI BỘ
  ],
  // Tệp nằm trực tiếp ở thư mục gốc (vd Danh mục hồ sơ) — cấp nào được xem
  ROOT_FILE_TIERS: ['quantri', 'chiuy'],
  TOKEN_HOURS: 8,
  MAX_FILE_MB: 30,
  CATEGORIES: [
    { id: '1alvKZ9Jx6m8LXnG7HHRGuw6u1B7ELsbN', no: 1,  name: 'Biên bản họp Chi ủy',            tiers: ['quantri', 'chiuy'] },
    { id: '14wm2sf1enyxlWwuHOVw6lZFM902__DcF', no: 2,  name: 'Biên bản họp Chi bộ',            tiers: ['quantri', 'chiuy'] },
    { id: '1yLog1ytjUZ6fGOP3IzvfiKHVruc3TH7f', no: 3,  name: 'Sổ công văn đến',                tiers: ['quantri', 'chiuy'] },
    { id: '1NA9ce-3iEI2B59aGuQzhmRgFFrLD6znx', no: 4,  name: 'Sổ công văn đi',                 tiers: ['quantri', 'chiuy'] },
    { id: '11gvlE33vVwP56mJRarVVyRcaRdplNYDn', no: 7,  name: 'Sổ ghi danh sách đảng viên',     tiers: ['quantri', 'chiuy'] },
    { id: '1Cs2KBZcXYJXLgBJ3hOxfkPo21SAv90cd', no: 8,  name: 'Hồ sơ kiểm tra, giám sát',       tiers: ['quantri', 'chiuy'] },
    { id: '1sTc-RWEjlBRkcm8RQr_rJEFZd6zgnTFW', no: 9,  name: 'Sinh hoạt chuyên đề',            tiers: ['quantri', 'chiuy', 'dangvien'] },
    { id: '19JijJUvVMgwWGzXwnEdmwrIXZSicZBpo', no: 10, name: 'Chương trình công tác năm',      tiers: ['quantri', 'chiuy', 'dangvien'] },
    { id: '1X0jOyKuab5T8XezHlZrnuWxgmis3enPH', no: 11, name: 'Công tác thu chi đảng',          tiers: ['quantri', 'chiuy'] },
    { id: '1WsSfPffaecMsKZ9xNkDeK8JtuFSrOJRg', no: 12, name: 'Chương trình hành động',         tiers: ['quantri', 'chiuy', 'dangvien'] },
    { id: '169bOeTCAm7T5W-NiwFKi-n6KpyrecPaI', no: 13, name: 'Công tác tổng kết năm',          tiers: ['quantri', 'chiuy'] },
    { id: '1EoCb5xBIL3GP9Ly-q498_g4nIJuRYcZA', no: 14, name: 'Hoạt động khác',                 tiers: ['quantri', 'chiuy', 'dangvien'] },
    { id: '1UeBC028VunSXVX24M8Gxa7GgJZPrrJi-', no: 15, name: 'Hướng dẫn công tác đảng',        tiers: ['quantri', 'chiuy', 'dangvien'] },
    { id: '1yzuQHbM7IFDBkQOPwTZTQKm7lgXxdaC0', no: 16, name: 'Cuộc thi chính luận',            tiers: ['quantri', 'chiuy', 'dangvien'] }
  ]
};

var TIER_LABEL = { quantri: 'Quản trị viên', chiuy: 'Chi ủy', dangvien: 'Đảng viên' };

/* ======================= Cổng vào ======================= */
function doPost(e) {
  var out;
  try {
    var p = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    out = route(p);
  } catch (err) {
    out = { ok: false, error: String(err && err.message || err) };
  }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  return ContentService.createTextOutput(JSON.stringify({ ok: true, service: 'PN Hồ sơ Đảng vụ' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function route(p) {
  if (p.action === 'login') return login(p.id, p.pw);
  var u = verifyToken(p.token);
  if (!u) return { ok: false, error: 'AUTH', message: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.' };
  switch (p.action) {
    case 'list':     return listFolder(u, p.folderId);
    case 'file':     return getFile(u, p.id);
    case 'search':   return search(u, p.q);
    case 'changePw': return changePw(u, p.oldPw, p.newPw);
    default:         return { ok: false, error: 'BAD_ACTION' };
  }
}

/* ======================= Tài khoản ======================= */
function hex_(bytes) {
  return bytes.map(function (b) { return ('0' + ((b + 256) % 256).toString(16)).slice(-2); }).join('');
}
function sha256_(s) {
  return hex_(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, s, Utilities.Charset.UTF_8));
}
function props_() { return PropertiesService.getScriptProperties(); }
function secret_() {
  var p = props_(), s = p.getProperty('TOKEN_SECRET');
  if (!s) { s = Utilities.getUuid() + Utilities.getUuid(); p.setProperty('TOKEN_SECRET', s); }
  return s;
}
function userRec_(id) {
  id = String(id || '').trim().toLowerCase();
  if (!Object.prototype.hasOwnProperty.call(USERS, id)) return null;
  var u = USERS[id];
  var override = props_().getProperty('PW_' + id); // mật khẩu đã đổi
  return { id: id, name: u.name, tier: u.tier, extra: u.extra || [], salt: u.salt, hash: override || u.hash };
}

function login(id, pw) {
  var cache = CacheService.getScriptCache();
  var key = 'FAIL_' + String(id || '').toLowerCase();
  var fails = Number(cache.get(key) || 0);
  if (fails >= 5) return { ok: false, error: 'LOCKED', message: 'Sai mật khẩu quá 5 lần. Thử lại sau 15 phút.' };
  var u = userRec_(id);
  if (!u || sha256_(u.salt + String(pw || '')) !== u.hash) {
    cache.put(key, String(fails + 1), 900);
    return { ok: false, error: 'BAD_LOGIN', message: 'Sai tên đăng nhập hoặc mật khẩu.' };
  }
  cache.remove(key);
  var payload = Utilities.base64EncodeWebSafe(JSON.stringify({ id: u.id, exp: Date.now() + CFG.TOKEN_HOURS * 3600e3 }));
  var sig = Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(payload, secret_()));
  return { ok: true, token: payload + '.' + sig, user: { id: u.id, name: u.name, tier: u.tier, tierLabel: TIER_LABEL[u.tier] } };
}

function verifyToken(t) {
  if (!t || String(t).indexOf('.') < 0) return null;
  var parts = String(t).split('.');
  var sig = Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(parts[0], secret_()));
  if (sig !== parts[1]) return null;
  var data;
  try { data = JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(parts[0])).getDataAsString()); } catch (e) { return null; }
  if (!data || data.exp < Date.now()) return null;
  return userRec_(data.id);
}

function changePw(u, oldPw, newPw) {
  if (sha256_(u.salt + String(oldPw || '')) !== u.hash) return { ok: false, message: 'Mật khẩu hiện tại không đúng.' };
  if (!newPw || String(newPw).length < 6) return { ok: false, message: 'Mật khẩu mới phải có ít nhất 6 ký tự.' };
  props_().setProperty('PW_' + u.id, sha256_(u.salt + String(newPw)));
  return { ok: true, message: 'Đã đổi mật khẩu.' };
}

/* ======================= Phân quyền ======================= */
function catById_(id) {
  for (var i = 0; i < CFG.CATEGORIES.length; i++) if (CFG.CATEGORIES[i].id === id) return CFG.CATEGORIES[i];
  return null;
}
function canCat_(u, cat) {
  return !!cat && (cat.tiers.indexOf(u.tier) >= 0 || u.extra.indexOf(cat.id) >= 0);
}
function allowedCats_(u) {
  return CFG.CATEGORIES.filter(function (c) { return canCat_(u, c); });
}

/** Lần ngược thư mục cha: trả {cat, chain} hoặc {root:true} / {blocked:true} / {outside:true}. */
function locate_(item, isFolder) {
  var chain = [];
  var cur = item, curIsFolder = isFolder;
  for (var depth = 0; depth < 25; depth++) {
    var id = cur.getId();
    if (CFG.BLOCKED.indexOf(id) >= 0) return { blocked: true };
    if (curIsFolder) {
      if (id === CFG.ROOT) return { root: true, chain: chain };
      var cat = catById_(id);
      if (cat) return { cat: cat, chain: chain };
      chain.unshift({ id: id, name: cur.getName() });
    }
    var parents = cur.getParents();
    if (!parents.hasNext()) return { outside: true };
    cur = parents.next(); curIsFolder = true;
  }
  return { outside: true };
}

/* ======================= Nghiệp vụ ======================= */
function fileInfo_(f) {
  return { id: f.getId(), name: f.getName(), mime: f.getMimeType(), size: f.getSize(), updated: f.getLastUpdated().toISOString() };
}
function sortByName_(a, b) { return a.name.localeCompare(b.name, 'vi', { numeric: true }); }

function listFolder(u, folderId) {
  if (!folderId || folderId === CFG.ROOT) {
    var root = DriveApp.getFolderById(CFG.ROOT), files = [];
    if (CFG.ROOT_FILE_TIERS.indexOf(u.tier) >= 0) {
      var it = root.getFiles();
      while (it.hasNext()) files.push(fileInfo_(it.next()));
    }
    return { ok: true, root: true, categories: allowedCats_(u).map(function (c) { return { id: c.id, no: c.no, name: c.name }; }), files: files.sort(sortByName_) };
  }
  var folder;
  try { folder = DriveApp.getFolderById(folderId); } catch (e) { return { ok: false, message: 'Không tìm thấy thư mục.' }; }
  var loc = locate_(folder, true);
  if (!loc.cat || !canCat_(u, loc.cat)) return { ok: false, error: 'FORBIDDEN', message: 'Đồng chí không có quyền xem mục này.' };
  var path = [{ id: loc.cat.id, name: loc.cat.no + '. ' + loc.cat.name }];
  if (folder.getId() !== loc.cat.id) path = path.concat(loc.chain);
  var folders = [], files = [];
  var fi = folder.getFolders();
  while (fi.hasNext()) {
    var sub = fi.next();
    if (CFG.BLOCKED.indexOf(sub.getId()) < 0) folders.push({ id: sub.getId(), name: sub.getName(), updated: sub.getLastUpdated().toISOString() });
  }
  var fl = folder.getFiles();
  while (fl.hasNext()) files.push(fileInfo_(fl.next()));
  return { ok: true, path: path, folders: folders.sort(sortByName_), files: files.sort(sortByName_) };
}

function getFile(u, id) {
  var f;
  try { f = DriveApp.getFileById(id); } catch (e) { return { ok: false, message: 'Không tìm thấy tệp.' }; }
  var loc = locate_(f, false);
  var allowed = (loc.cat && canCat_(u, loc.cat)) || (loc.root && CFG.ROOT_FILE_TIERS.indexOf(u.tier) >= 0);
  if (!allowed) return { ok: false, error: 'FORBIDDEN', message: 'Đồng chí không có quyền xem tệp này.' };
  var mime = f.getMimeType(), name = f.getName(), blob;
  if (mime.indexOf('application/vnd.google-apps.') === 0) {
    blob = f.getAs('application/pdf'); name += '.pdf'; mime = 'application/pdf'; // Google Docs/Sheets → PDF
  } else {
    if (f.getSize() > CFG.MAX_FILE_MB * 1048576) return { ok: false, message: 'Tệp quá lớn để mở trên web (>' + CFG.MAX_FILE_MB + ' MB).' };
    blob = f.getBlob();
  }
  return { ok: true, name: name, mime: mime, data: Utilities.base64Encode(blob.getBytes()) };
}

function search(u, q) {
  q = String(q || '').trim();
  if (q.length < 2) return { ok: false, message: 'Nhập ít nhất 2 ký tự.' };
  var safe = q.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  var it = DriveApp.searchFiles("title contains '" + safe + "' and trashed = false");
  var res = [], scanned = 0;
  while (it.hasNext() && res.length < 40 && scanned < 200) {
    var f = it.next(); scanned++;
    var loc = locate_(f, false);
    var ok = (loc.cat && canCat_(u, loc.cat)) || (loc.root && CFG.ROOT_FILE_TIERS.indexOf(u.tier) >= 0);
    if (!ok) continue;
    var info = fileInfo_(f);
    info.where = loc.cat ? (loc.cat.no + '. ' + loc.cat.name + (loc.chain.length ? ' › ' + loc.chain.map(function (c) { return c.name; }).join(' › ') : '')) : 'Thư mục gốc';
    res.push(info);
  }
  return { ok: true, results: res };
}

/** Chạy một lần trong trình soạn thảo để cấp quyền Drive và kiểm tra cấu hình. */
function kiemTraCauHinh() {
  var root = DriveApp.getFolderById(CFG.ROOT);
  Logger.log('Thư mục gốc: ' + root.getName());
  CFG.CATEGORIES.forEach(function (c) { Logger.log(c.no + ' → ' + DriveApp.getFolderById(c.id).getName()); });
  Logger.log('Số tài khoản: ' + Object.keys(USERS).length);
}
