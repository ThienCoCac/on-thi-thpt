# Bàn giao — Ôn Thi THPT

Cập nhật 07/11/2026. Mở task mới thì đọc file này trước, rồi tới `AGENTS.md`.

## Trạng thái hiện tại

- **Bản LIVE**: commit `54c4eba`, đã push `origin/main`, deploy Cloudflare version `acfd6c0c-4b6a-4277-9e3d-6c25ea45f60e` tại https://on-thi-thpt.thiencogemini1.workers.dev — **201 đề / 7.397 câu**, `--scope=live` = **41/41**. Bản live và nội dung trên đĩa đã trùng nhau, không còn đợt nào chờ deploy.
- Cổng kiểm tra của đợt này: `check-exam --all` = `OK: 201 đề, 7397 câu, 6 cảnh báo` (6 WARN đều là 5 đề Sử cũ chuyển từ DOCX, bình thường); `--scope=all` = **12 bộ / 848 kiểm tra xanh**; `--scope=deploy --build` xanh 12 bộ local (riêng bộ `live` khi đó còn chấm bản cũ 190 đề nên trượt — xem mục sự cố).
- Nội dung trên đĩa: **201 đề / 7.397 câu** — Địa lí 37, Tin học 32, Toán 28, Tiếng Anh 25, Hóa học 25, Lịch sử 20, KTPL 19, Ngữ văn 14, V-ACT 1.
- Đề tốt nghiệp chính thức đã có: Văn, Anh, Sử, KTPL, Tin (2 mã), Toán (8 mã 2023–2026). Địa lí và Hóa **chưa** có bản 2025 chính thức.
- Batch gần nhất: **11 đề Tin học 12 theo bài** (Bài 13, 15, 16, 18, 19, 20, 21, 22, 25, 26, 27 — 28 câu / 45 phút / 10 điểm mỗi đề, 308 câu), đã soát đáp án độc lập từng đề. Trước đó: môn mới **Hóa học 11** (slug `hoa-hoc`, 25 đề 20 câu, suite `hoa` 30 kiểm tra) và **đề KTPL tốt nghiệp 2025 chính thức** mã 1007.

## Việc còn lại

Bắt buộc: không có. Bản live đã là đợt mới nhất (`54c4eba` / `acfd6c0c`, 201 đề) và đã kiểm tra `--scope=live` = 41/41. Sau này có thêm đề thì quy trình vẫn là `check-exam --all` → `--scope=all` → `node scripts/verify.mjs --scope=deploy --build` → `npx wrangler deploy` → `--scope=live` (lưu ý bộ `live` trong bước `--scope=deploy` chấm bản đang chạy nên sẽ báo đỏ phần nội dung mới cho tới khi deploy xong — chạy lại `--scope=live` sau khi deploy mới là kết luận).

Đang treo, chỉ làm khi được nhắc:

- Tin học 12 còn 9 bài chưa có đề riêng: Bài 1, 4, 7, 10, 14, 17, 23, 24, 28 (8 đề tổng hợp `so-01`…`so-08` vẫn phủ đủ 28 bài nên suite `tinhoc` không thiếu). Kế hoạch cụ thể cho đợt này xem "Điểm dừng phiên 06/11" ở dưới.
- Đề giữa kì / tổng hợp cho Hóa 11; đề luyện thi tốt nghiệp cho Địa lí; bổ sung đề 2025 Hóa, Địa nếu tìm được nguồn công bố của Bộ GD&ĐT và đối chiếu chéo đáp án trước khi chép vào `content/`.

Tin học hiện có **19 đề theo bài** (Bài 2, 3, 5, 6, 8, 9, 11, 12, 13, 15, 16, 18, 19, 20, 21, 22, 25, 26, 27). Quy ước mỗi đề mới: file `content/exams/de-tin-hoc-12-bai-NN.json`, `TOPIC_TEST`, lớp 12, 28 câu / 45 phút / 10 điểm = 24 SINGLE_CHOICE × 0,25 + 4 MULTIPLE_CHOICE × 1, `partName` "Phần I. Trắc nghiệm nhiều lựa chọn" và "Phần II. Chọn các nhận định đúng", phân bố đáp án A/B/C/D đúng 6/6/6/6, mỗi đề 2 câu phần II có 2 đáp án và 2 câu có 3 đáp án, topic theo bảng:

- Bài 13 → `topic-th-css-khai-niem`
- Bài 15 → `topic-th-mau-chu-va-nen`
- Bài 16 → `topic-th-dinh-dang-khung`
- Bài 18 → `topic-th-thuc-hanh-thiet-ke-web`
- Bài 19 → `topic-th-sua-chua-bao-tri`
- Bài 20 → `topic-th-nghe-quan-tri-cn`
- Bài 21 → `topic-th-hoi-thao-huong-nghiep`
- Bài 22 → `topic-th-ket-noi-thiet-bi-so`
- Bài 25 → `topic-th-than-chan-trang-web`
- Bài 26 → `topic-th-lien-ket-dieu-huong`
- Bài 27 → `topic-th-bieu-mau-google-forms`

## Điểm dừng phiên 06/11 (mở phiên mới làm tiếp từ đây)

Phiên trước dừng lúc mới đọc xong `BAN-GIAO.md`, `content/subjects.json` và đề mẫu `content/exams/de-tin-hoc-12-bai-27.json`; 11 đề Tin học của đợt trước đã commit ở `54c4eba` và đã lên live, nhưng chưa viết thêm đề nào cho 9 bài nêu dưới đây.

Việc định làm: soạn 9 đề Tin học 12 theo bài còn thiếu, theo đúng khuôn đề mẫu Bài 27 (28 câu = 24 SINGLE_CHOICE 0,25 điểm ở "Phần I. Trắc nghiệm nhiều lựa chọn" + 4 MULTIPLE_CHOICE 1 điểm ở "Phần II. Chọn các nhận định đúng", 45 phút / 10 điểm, lớp 12, `type: TOPIC_TEST`, `examYear: 2026`, `isFree: true`, mỗi câu có `explanation` và `tags`, id câu dạng `tinhoc12-bNN-cN`, `examCode` dạng `TH12-BNN`, `publishedAt`/`updatedAt` ISO). Phân bố đáp án Phần I đúng 6/6/6/6 cho A/B/C/D; Phần II hai câu có 2 đáp án và hai câu có 3 đáp án.

Topic cho 9 đề (lấy từ `content/subjects.json`, đã đối chiếu):

- Bài 1 → `topic-th-ai-lam-quen`
- Bài 4 → `topic-th-giao-thuc-mang`
- Bài 7 → `topic-th-html-cau-truc`
- Bài 10 → `topic-th-tao-lien-ket`
- Bài 14 → `topic-th-dinh-dang-van-ban-css`
- Bài 17 → `topic-th-muc-uu-tien-bo-chon`
- Bài 23 → `topic-th-chuan-bi-web`
- Bài 24 → `topic-th-dau-trang-web`
- Bài 28 → `topic-th-thuc-hanh-tong-hop`

Không phải sửa suite nào: `tinhoc` tự tính `TOTAL_DE`, còn tổng đề/tổng câu đọc từ `content/exams/` qua `C:/Users/trinh/.qoder/tmp/verify-source.cjs`. Sau khi soạn xong thì `check-exam --all` phải ra `OK: 210 đề, ...`, rồi `--scope=tinhoc` + `--scope=ui`, và `--scope=all` trước khi commit.

Không còn việc deploy nào treo: 11 đề Tin học ở `54c4eba` đã lên live (`acfd6c0c`) và `--scope=live` = 41/41 ngày 07/11. Khi làm 9 đề còn lại thì vẫn gộp: `--scope=deploy --build` → `npx wrangler deploy` → `--scope=live`.

## Lệnh làm việc

```bash
export PATH="/c/Users/trinh/.qoder/tmp/node20/node-v20.18.1-win-x64:$PATH"
node scripts/check-exam.mjs <file>|--all         # soát đề, chưa tới 1 giây/đề
node scripts/verify.mjs --scope=<môn>,static,features   # giữa các bước sửa
node scripts/verify.mjs --scope=all              # trước khi commit (≈3 phút 30)
node scripts/verify.mjs --scope=deploy --build   # trước khi push/deploy
node scripts/verify.mjs --scope=live             # sau deploy
npx wrangler deploy
```

## Quy ước không được phá

- Trả lời, chú thích code, nội dung đều tiếng Việt; không markdown tables trong chat/UI.
- Không backend, auth, DB, API, admin; không secret ngoài `NEXT_PUBLIC_SITE_URL`; không bao giờ commit `.env`.
- Không UI cho dạng Đúng/Sai: đúng–sai lưu là `MULTIPLE_CHOICE` 4 phương án A–D, đáp án là mảng.
- Không xoá hay nới kiểm tra để "cho qua"; không tự sang milestone khác; không tự commit/push/deploy khi chưa được duyệt.
- Không chạy suite trình duyệt khi agent đang ghi `content/exams/` (out/ và content bị lấy mẫu lệch thời điểm).
- Không đặt file tạm trong `out/` vì `wrangler deploy` upload nguyên si.
- Chỉ báo "đã xong / đã đúng" khi thấy `Tất cả N bộ test đều xanh.` và exit code 0.

## Sự cố đã gặp và cách xử lý

- **Banner "This conversation contains sensitive content"**: máy chủ chặn cả phiên dựa trên lịch sử hội thoại, không phải do câu vừa gõ; log ghi `model_stop_reason="refusal"`, `input_tokens=0`. Cách xử lý: đổi model rồi Retry, hoặc mở task mới (`/clear`) và đọc `BAN-GIAO.md` + memory. Đừng dán nguyên văn nội dung nhạy cảm (chiến tranh, tội phạm, tự hại) vào chat; để nội dung trong file cho agent đọc từ đĩa.
- **Deploy lỗi DNS `EAI_AGAIN dash.cloudflare.com`**: mạng/WARP chập chờn, không phải lỗi token; chờ vài phút rồi chạy lại `npx wrangler deploy`.
- **Deploy lỗi `Failed to fetch auth token` / `fetch failed` khi upload** (07/11): cùng gốc mạng chập chờn (`ConnectTimeoutError` tới `104.17.x`), không phải token hỏng. Kiểm tra bằng `curl -s -o /dev/null -w "%{http_code} %{time_total}" https://api.cloudflare.com/client/v4/` vài lần; khi các lượt trả về dưới ~1,5 giây thì chạy lại `npx wrangler deploy`. Đừng chạy lại liên tục khi mạng còn timeout, cũng đừng vội đổi `CLOUDFLARE_API_TOKEN`.
- **Bộ `live` trượt 5 kiểm tra phần Luyện tập sau deploy** (07/11): suite `shot/verify-live.js` chờ cố định 1,4 giây sau khi bấm "Bắt đầu luyện tập", nhưng bản live cần ~4,5 giây tải `/data/bank/lich-su.json` (2,9 MB). Đã đổi sang chờ theo điều kiện (`waitText` cho "Câu 1/N", phản hồi đáp án, băng gợi ý làm tiếp; `waitCount` cho dải số câu) — giữ nguyên nội dung kiểm tra, không nới điều kiện. Bài học: với bản live, chờ theo trạng thái chứ đừng chờ theo mili giây.
- **Live báo 404 chunk sau deploy**: chạy `npx wrangler deploy` lần thứ hai. **502**: chờ rồi chạy lại `--scope=live`.
- Suite môn nào đó báo thiếu `hoa-hoc` trong danh sách ngân hàng: các suite `anh`, `ktpl`, `van`, `tinhoc`, `su/verify-live.js` có mảng slug cứng, thêm môn mới thì phải thêm vào đó.
- Suite báo `Danh sách đề có tổng 190 đề — 201`: một suite còn ghi tay tổng số đề. Không sửa số thành 201, phải đổi sang đọc từ `content/exams/` (đã sửa ở `hoa/verify-hoa.js`, cả dòng tổng đề lẫn số đề trong bộ lọc Hóa; `tinhoc` đã tự tính `TOTAL_DE`).

## Nguồn tham khảo

- Quy trình, phạm vi test, cách thêm suite: `AGENTS.md`.
- Trạng thái chi tiết và lịch sử các đợt mở rộng: memory `project-milestones.md`, `project-testing-stack.md`, `project-exam-authoring.md` trong `C:/Users/trinh/.qoder/projects/C--Users-trinh-Documents-Qoder-2026-10-26-ae57d1fb/memory/`.
- Suite trình duyệt đặt ngoài repo tại `C:/Users/trinh/.qoder/tmp/` (`shot/`, `su/`, `ktpl/`, `english/`, `vact/`, `dia/`, `tinhoc/`, `hoa/`, `toan/`).
