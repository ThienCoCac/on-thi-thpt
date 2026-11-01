# Quy ước làm việc — Ôn Thi THPT

Site tĩnh Next.js 14 (`output: 'export'` → `out/`), không backend, không auth, không API, không DB.
Nội dung đọc từ `content/*.json` qua `lib/content.ts` (Zod), chấm điểm chạy ngay trên máy, tiến độ lưu ở localStorage.
Bản công khai: `https://on-thi-thpt.thiencogemini1.workers.dev` (Cloudflare, `npx wrangler deploy`).

## Ràng buộc luôn đúng

- Trả lời, chú thích code và nội dung đều tiếng Việt.
- Không markdown tables trong câu trả lời trò chuyện, không UI cho dạng Đúng/Sai (chỉ là câu trắc nghiệm 2 lựa chọn).
- Không thêm backend, auth, DB, API, admin; không secret ngoài `NEXT_PUBLIC_SITE_URL`; không bao giờ commit `.env`.
- Không tự sang milestone khác, không tự commit/push/deploy, không tự hành động phá hủy trên Cloudflare khi chưa được duyệt.
- Zip nếu tạo dùng dấu `/` trong đường dẫn bên trong.

## Môi trường

Node không có trong PATH. Trước khi chạy lệnh nào dùng node/npm:

```bash
export PATH="/c/Users/trinh/.qoder/tmp/node20/node-v20.18.1-win-x64:$PATH"
```

`scripts/verify.mjs` tự dùng `process.execPath` cho mọi tiến trình con, nên gọi trực tiếp
`node scripts/verify.mjs` là đủ, không cần dựng PATH cho tsc/next/chrome.

- Chrome: `C:/Program Files/Google/Chrome/Application/chrome.exe`
- puppeteer-core: `C:/Users/trinh/.qoder/tmp/shot/node_modules`
- Máy chủ tĩnh: cổng 4180, script tự bật khi cần, tự ghi pid vào `.verify/serve.pid`, tắt bằng `--stop-server`.
  Không đặt file tạm trong `out/` vì wrangler upload nguyên si những gì có trong đó.

## Ba tầng kiểm tra

- Nhanh (giữa các bước sửa): `node scripts/verify.mjs --scope=ui`, hoặc `--scope=<môn>`, hoặc `--files=<vừa sửa>`.
- Đủ (trước khi báo hoàn thành / trước khi commit): `node scripts/verify.mjs --scope=all`.
- Deploy (trước khi push + `wrangler deploy`): `node scripts/verify.mjs --scope=deploy --build`.

Mặc định `node scripts/verify.mjs` tự chọn phạm vi từ `git diff`. Xem `--list` để liệt kê bộ test,
`--help` để xem tùy chọn. Có alias npm: `verify`, `verify:all`, `verify:deploy`.

Thời gian thực đo (để chọn tầng cho hợp): một bộ test môn 9–40 giây, `--scope=ui` ≈ 1 phút 15 giây,
`--scope=all` ≈ 3 phút 10 giây, `--scope=live` ≈ 30 giây; build toàn site thêm khoảng 1–2 phút.
Typecheck chỉ khoảng 2 giây nên luôn nên chạy; `--no-lint` chỉ dùng khi vừa lint xong vài giây trước đó.

Quy tắc tuyệt đối: chỉ nói "đã xong / đã đúng" khi thấy `Tất cả N bộ test đều xanh.` và exit code 0.
Một bộ test in ra `0/0 kiểm tra` hoặc "không đọc được dòng tổng kết" coi như HỎNG, không coi là pass.

## Sửa gì thì test nấy

Script ánh xạ tự động, nắm quy tắc để đoán thời gian:

- `lib/**`, `content/subjects.json`, `app/globals.css`, `tailwind.config.ts`, `next.config.mjs`, `package.json`, `components/ui/**` → chạy hết 10 bộ (lõi dữ liệu/chấm điểm/style toàn site).
- `app/**`, `components/**`, `public/**` → `static` + `features`.
- `content/exams/de-<môn>.json` → bộ test của môn đó + `static` + `features` (đổi số câu làm đổi tổng ở trang danh sách).
- `docs/**`, `scripts/**`, `README.md`, `AGENTS.md` → không cần mở trình duyệt (`--scope=none`).

Mười bộ test puppeteer và số kiểm tra hiện tại: `static` 37, `features` 92, `van` 34, `ktpl` 24,
`anh` 26, `mini` 27, `su` 19, `vact` 18, `dia` 23, `tinhoc` 49; bộ `live` 33 kiểm tra trên bản Cloudflare.
File đặt ngoài repo, trong `C:/Users/trinh/.qoder/tmp/` (`shot/`, `su/`, `ktpl/`, `english/`, `vact/`, `dia/`, `tinhoc/`).
Nếu mất file, verify.mjs in `THIẾU FILE` và tính là lỗi — tuyệt đối không xóa kiểm tra để "cho qua".

Thêm tính năng mới thì thêm `check(...)` vào bộ test liên quan; đổi nội dung đề thì cập nhật các con số
đang hard-code trong bộ test (32 đề, 1.318 câu, số câu mỗi đề).

## Giữ tốc độ

- Gom nhiều sửa đổi trong cùng một khu rồi mới build/test; build một lần cho cả loạt.
- `out/` còn mới hơn nguồn thì script tự bỏ qua build; ép build bằng `--build`, cấm build bằng `--no-build`.
- Chụp ảnh chỉ khi đổi layout; dùng `C:/Users/trinh/.qoder/tmp/shot/new-ui.js` khi thật sự cần nhìn.
- Không đọc lại file vừa sửa để "kiểm tra", không chạy tìm kiếm khi đã biết đường dẫn.
- Giữ server 4180 chạy suốt phiên, đừng tắt rồi bật lại giữa chừng.

## Trước khi commit / deploy

1. `node scripts/verify.mjs --scope=all` (xanh toàn bộ).
2. Commit và push chỉ khi người dùng yêu cầu rõ.
3. `npx wrangler deploy`, sau đó `node scripts/verify.mjs --scope=live` để kiểm tra bản live.
