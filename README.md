# PHÚC NGUYÊN · HỒ SƠ ĐẢNG VỤ — Chi bộ Khoa Luật (2025-2027)

Web tra cứu hồ sơ đảng vụ. Tài liệu **ở nguyên trên Google Drive** (thư mục `HỒ SƠ ĐẢNG VỤ 2025-2027`, không cần chia sẻ Drive cho từng người).
Web trên GitHub Pages **không chứa dữ liệu**; máy chủ Google Apps Script kiểm tra tài khoản và quyền rồi mới trả danh mục/tệp.

## Phân quyền
| Cấp | Ai | Được xem |
|---|---|---|
| Quản trị viên | đ/c Lưu Thị Thu Hương | Mục 1–4, 7–16 và tệp ở thư mục gốc |
| Chi ủy | đ/c Oanh, đ/c An | Như quản trị viên |
| Đảng viên | Các đồng chí còn lại | Mục 9, 10, 12, 14, 15, 16 |
| Bổ sung | đ/c Nguyễn Hoàng Tố Linh | + Mục 11 (thu chi đảng) |

Mục **5. Sổ văn bản mật** và **6. Sổ ghi bảo vệ chính trị nội bộ** bị chặn ở máy chủ — không ai xem được qua web.
Muốn đổi quyền: sửa `tiers` trong `CATEGORIES` (gas/Code.gs) rồi Triển khai lại.

## Cài đặt máy chủ (1 lần, ~5 phút) — bằng tài khoản luuhuong.dhnv@gmail.com (chủ thư mục Drive)
1. Vào https://script.google.com → **Dự án mới**, đặt tên "PN Ho so Dang vu".
2. Dán toàn bộ `gas/Code.gs` vào tệp Code.gs. Bấm **+ → Tập lệnh**, đặt tên `Users`, dán nội dung tệp `Users.gs` (tệp riêng, **không** đưa lên GitHub). Lưu.
3. Chọn hàm `kiemTraCauHinh` → **Chạy** → cấp quyền Google Drive. Nhật ký phải liệt kê đủ 14 mục và "Số tài khoản: 24".
4. **Triển khai → Tùy chọn triển khai mới → Ứng dụng web**: Thực thi dưới dạng **Tôi**; Ai có quyền truy cập **Bất kỳ ai**. Sao chép link `/exec`.
5. Dán link vào `js/config.js` (`GAS_URL`) và đẩy lên GitHub. Bật **Settings → Pages → Deploy from branch → main / root**.

Khi sửa Code.gs: **Triển khai → Quản lý triển khai → Chỉnh sửa → Phiên bản mới** (giữ nguyên link).

## Tài khoản
- Tên đăng nhập: họ tên viết liền không dấu, chữ thường (vd `lengochung`). Mật khẩu ban đầu 6 số, cấp riêng từng người (tệp danh sách tài khoản).
- Mỗi người tự **Đổi mật khẩu** trên web. Sai 5 lần → khóa 15 phút. Phiên đăng nhập 8 giờ.
- Quên mật khẩu: trong Apps Script → Cài đặt dự án → Thuộc tính tập lệnh → xóa dòng `PW_<tên đăng nhập>` (trở về mật khẩu ban đầu).
- Thêm/bớt đảng viên: sửa Users.gs (nhờ trợ lý sinh dòng mới) rồi triển khai phiên bản mới.
