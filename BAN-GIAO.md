# Bàn giao — Ôn Thi THPT

Cập nhật 06/11/2026. Mở task mới thì đọc file này trước, rồi tới `AGENTS.md`.

## Trạng thái hiện tại

- **Đang LIVE, sạch, không còn việc dở bắt buộc.** Commit `b62941a`, đã push `origin/main`, deploy Cloudflare version `8bf76f15-d88b-4864-ac4c-0e7dd1c279dd` tại https://on-thi-thpt.thiencogemini1.workers.dev
- Cổng kiểm tra lúc deploy: `check-exam --all` = `OK: 190 đề, 7089 câu, 6 cảnh báo` (6 WARN đều là 5 đề Sử cũ chuyển từ DOCX, bình thường); `--scope=all` = **12 bộ / 848 kiểm tra xanh**; `--scope=live` = **41/41**.
- Nội dung trên đĩa và trên live: **190 đề / 7.089 câu** — Toán 28, Địa lí 37, Tiếng Anh 25, Hóa học 25, Tin học 21, Lịch sử 20, KTPL 19, Ngữ văn 14, V-ACT 1.
- Đề tốt nghiệp chính thức đã có: Văn, Anh, Sử, KTPL, Tin (2 mã), Toán (8 mã 2023–2026). Địa lí và Hóa **chưa** có bản 2025 chính thức.
- Batch gần nhất: môn mới **Hóa học 11** (slug `hoa-hoc`, 25 chuyên đề KNTT Bài 1–25, 25 đề 20 câu / 30 phút / 10 điểm = 500 câu, màu cyan trong `lib/subject-theme.ts`, suite `hoa` 30 kiểm tra) và **đề KTPL tốt nghiệp 2025 chính thức** mã 1007 (`de-ktpl-tn-2025`, 28 câu / 50 phút / 10 điểm).

## Việc còn lại

Bắt buộc: không có.

Đang treo theo yêu cầu cũ, chỉ làm khi được nhắc:

- Task #159 — Tin học 12 đề theo bài, lô 2: Bài 13, 15, 16, 18, 19, 20, 21, 22.
- Task #160 — Tin học 12 đề theo bài, lô 3: Bài 25, 26, 27.

Hiện Tin học đã có 8 đề theo bài (Bài 2, 3, 5, 6, 8, 9, 11, 12); 8 đề tổng hợp `so-01`…`so-08` vẫn phủ đủ 28 bài nên suite `tinhoc` đang xanh 54/54. Quy ước mỗi đề mới: file `content/exams/de-tin-hoc-12-bai-NN.json`, `TOPIC_TEST`, lớp 12, 28 câu / 45 phút / 10 điểm = 24 SINGLE_CHOICE × 0,25 + 4 MULTIPLE_CHOICE × 1, `partName` "Phần I. Trắc nghiệm nhiều phương án lựa chọn", topic theo bảng:

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

Gợi ý chưa được duyệt: đề giữa kì / tổng hợp cho Hóa 11; đề luyện thi tốt nghiệp cho Địa lí; bổ sung đề 2025 Hóa, Địa nếu tìm được nguồn công bố của Bộ GD&ĐT và đối chiếu chéo đáp án trước khi chép vào `content/`.

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
- **Live báo 404 chunk sau deploy**: chạy `npx wrangler deploy` lần thứ hai. **502**: chờ rồi chạy lại `--scope=live`.
- Suite môn nào đó báo thiếu `hoa-hoc` trong danh sách ngân hàng: các suite `anh`, `ktpl`, `van`, `tinhoc`, `su/verify-live.js` có mảng slug cứng, thêm môn mới thì phải thêm vào đó.

## Nguồn tham khảo

- Quy trình, phạm vi test, cách thêm suite: `AGENTS.md`.
- Trạng thái chi tiết và lịch sử các đợt mở rộng: memory `project-milestones.md`, `project-testing-stack.md`, `project-exam-authoring.md` trong `C:/Users/trinh/.qoder/projects/C--Users-trinh-Documents-Qoder-2026-10-26-ae57d1fb/memory/`.
- Suite trình duyệt đặt ngoài repo tại `C:/Users/trinh/.qoder/tmp/` (`shot/`, `su/`, `ktpl/`, `english/`, `vact/`, `dia/`, `tinhoc/`, `hoa/`, `toan/`).
