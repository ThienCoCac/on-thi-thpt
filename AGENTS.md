# Quy ước làm việc — Ôn Thi THPT

Site tĩnh Next.js 14 (`output: 'export'` → `out/`), không backend, không auth, không API, không DB.
Nội dung đọc từ `content/*.json` qua `lib/content.ts` (Zod), chấm điểm chạy ngay trên máy, tiến độ lưu ở localStorage.
File dữ liệu mang Markdown/LaTeX **thô**: `<Markup>` (client component) render bằng `lib/markdown.ts` ngay trên máy
người dùng. Trang làm bài `/de-thi/[slug]/lam-bai` và luyện tập `/de-thi/[slug]/luyen-tap` là shell nhẹ, tải
`/data/exams/<slug>.json` rồi mới hiện câu hỏi (`components/data/exam-loader.tsx`, `lib/use-static-data.ts`);
ngân hàng luyện tập xuất riêng `/data/bank/<môn>.json` nên một đề mới không làm phình trang nào khác.
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

## Bốn tầng kiểm tra

- Soạn đề (nhanh nhất, không mở trình duyệt): `node scripts/check-exam.mjs content/exams/de-<môn>-....json`
  hoặc `--all` cho cả 49 đề, không tham số thì tự lấy file đề vừa sửa theo `git diff`. Script soi Zod,
  đáp án có trong phương án, chuyên đề thuộc môn, ảnh tồn tại trong `public/`, công thức KaTeX lỗi,
  marker TODO, chuỗi `\n` thô — chạy hết 49 đề trong khoảng 0,6 giây. `WARN` chỉ để soát nội dung, `LỖI` mới tính.
- Nhanh (giữa các bước sửa): `node scripts/verify.mjs --scope=ui`, hoặc `--scope=<môn>`, hoặc `--files=<vừa sửa>`.
- Đủ (trước khi báo hoàn thành / trước khi commit): `node scripts/verify.mjs --scope=all`.
- Deploy (trước khi push + `wrangler deploy`): `node scripts/verify.mjs --scope=deploy --build`.

Mặc định `node scripts/verify.mjs` tự chọn phạm vi từ `git diff`. Xem `--list` để liệt kê bộ test,
`--help` để xem tùy chọn. Có alias npm: `verify`, `verify:all`, `verify:deploy`.

Các bộ test chạy **song song**, mặc định 4 bộ một lúc (`--jobs=<n>`; `--jobs=1` để tuần tự cho dễ đọc log).
Thời gian thực đo: một bộ test môn 9–40 giây khi chạy riêng, `--scope=all` (11 bộ, 494 kiểm tra) hết
khoảng 1 phút 20 giây đến 1 phút 45 giây thay vì 3 phút 10 giây như trước, `--scope=live` ≈ 30 giây;
build toàn site khoảng 30 giây (trước khi chuyển sang LaTeX thô là 90–120 giây) và `out/` còn 28 MB thay vì 74 MB,
nên `wrangler deploy` cũng nhẹ đi tương ứng.
Typecheck chỉ khoảng 2 giây nên luôn nên chạy; `--no-lint` chỉ dùng khi vừa lint xong vài giây trước đó.

Quy tắc tuyệt đối: chỉ nói "đã xong / đã đúng" khi thấy `Tất cả N bộ test đều xanh.` và exit code 0.
Một bộ test in ra `0/0 kiểm tra` hoặc "không đọc được dòng tổng kết" coi như HỎNG, không coi là pass.

## Sửa gì thì test nấy

Script ánh xạ tự động, nắm quy tắc để đoán thời gian:

- `lib/**`, `content/subjects.json`, `app/globals.css`, `tailwind.config.ts`, `next.config.mjs`, `package.json`, `tsconfig.json`, `components/ui/**` → chạy hết 11 bộ (lõi dữ liệu/chấm điểm/style toàn site).
- `app/**`, `components/**`, `public/**` → `static` + `features`. Riêng `app/data/**` là route sinh
  `/data/exams/*.json` và `/data/bank/*.json` nên sửa xong phải chạy thêm `--scope=all`, không chỉ `ui`.
- `content/exams/de-<môn>.json` → bộ test của môn đó + `static` + `features` (đổi số câu làm đổi tổng ở trang danh sách).
- `docs/**`, `scripts/**`, `README.md`, `AGENTS.md` → không cần mở trình duyệt (`--scope=none`).

Mười một bộ test puppeteer và số kiểm tra hiện tại: `static` 37, `features` 92, `van` 45, `ktpl` 24,
`anh` 40, `mini` 27, `su` 19, `vact` 18, `dia` 46, `tinhoc` 49, `toan` 97 (tổng 494). Hai suite live
(`shot/verify-live.js`, `su/verify-live.js`) chỉ chạy với `--scope=live` hoặc `--scope=deploy`, kiểm tra
bản trên Cloudflare gồm cả việc file `/data/...` mới tải được và trang làm bài hết hiện "Đang tải nội dung".
File đặt ngoài repo, trong `C:/Users/trinh/.qoder/tmp/` (`shot/`, `su/`, `ktpl/`, `english/`, `vact/`, `dia/`, `tinhoc/`, `toan/`).
Nếu mất file, verify.mjs in `THIẾU FILE` và tính là lỗi — tuyệt đối không xóa kiểm tra để "cho qua".

Thêm tính năng mới thì thêm `check(...)` vào bộ test liên quan. Tổng số đề và tổng số câu hỏi
**không còn ghi tay** trong suite nữa: `C:/Users/trinh/.qoder/tmp/verify-source.cjs` đọc thẳng `content/exams/`
rồi so với file JSON export, nên thêm đề mới không phải sửa suite nào. Chỉ các kiểm tra đặc thù của một đề
(số câu mỗi đề, số câu MULTIPLE_CHOICE, nội dung phải thấy) vẫn hard-code trong bộ test của môn đó.

## Giữ tốc độ

- Soạn đề mới: vòng lặp là `node scripts/check-exam.mjs <file>` (chưa tới 1 giây) cho tới khi sạch lỗi,
  rồi build một lần và chạy `--scope=<môn>` + `--scope=ui`. Một đề mới chỉ thêm file
  `out/data/exams/<slug>.json`, không làm các trang khác nặng hơn nên thời gian build không đổi theo số đề.
- Gom nhiều sửa đổi trong cùng một khu rồi mới build/test; build một lần cho cả loạt.
- `out/` còn mới hơn nguồn thì script tự bỏ qua build; ép build bằng `--build`, cấm build bằng `--no-build`.
- Chụp ảnh chỉ khi đổi layout; dùng `C:/Users/trinh/.qoder/tmp/shot/new-ui.js` khi thật sự cần nhìn.
- Không đọc lại file vừa sửa để "kiểm tra", không chạy tìm kiếm khi đã biết đường dẫn.
- Giữ server 4180 chạy suốt phiên, đừng tắt rồi bật lại giữa chừng.
- Cần chậm lại cho dễ đọc log thì `--jobs=1`; máy khỏe thì `--jobs=6` (đo thực tế 80 giây cho 11 bộ).

## Trước khi commit / deploy

1. `node scripts/check-exam.mjs --all` (nếu vừa soạn/sửa đề).
2. `node scripts/verify.mjs --scope=all` (xanh toàn bộ).
3. Commit và push chỉ khi người dùng yêu cầu rõ.
4. `npx wrangler deploy`, sau đó `node scripts/verify.mjs --scope=live` để kiểm tra bản live.
