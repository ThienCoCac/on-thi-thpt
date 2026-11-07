# Bàn giao — Ôn Thi THPT

Cập nhật 07/11/2026. Mở task mới thì đọc file này trước, rồi tới `AGENTS.md`.

## Trạng thái hiện tại

- **Bản LIVE**: commit `54c4eba`, đã push `origin/main`, deploy Cloudflare version `acfd6c0c-4b6a-4277-9e3d-6c25ea45f60e` tại https://on-thi-thpt.thiencogemini1.workers.dev — **201 đề / 7.397 câu**, `--scope=live` = **41/41**. Bản live và nội dung trên đĩa đã trùng nhau, không còn đợt nào chờ deploy.
- Cổng kiểm tra của đợt này: `check-exam --all` = `OK: 201 đề, 7397 câu, 6 cảnh báo` (6 WARN đều là 5 đề Sử cũ chuyển từ DOCX, bình thường); `--scope=all` = **12 bộ / 848 kiểm tra xanh**; `--scope=deploy --build` xanh 12 bộ local (riêng bộ `live` khi đó còn chấm bản cũ 190 đề nên trượt — xem mục sự cố).
- Nội dung trên đĩa: **210 đề / 7.649 câu** — Địa lí 37, Tin học 41, Toán 28, Tiếng Anh 25, Hóa học 25, Lịch sử 20, KTPL 19, Ngữ văn 14, V-ACT 1. Đợt 9 đề Tin học mới đã commit ở `b273054` (chưa deploy).
- Đề tốt nghiệp chính thức đã có: Văn, Anh, Sử, KTPL, Tin (2 mã), Toán (8 mã 2023–2026). Địa lí và Hóa **chưa** có bản 2025 chính thức.
- Batch gần nhất: **9 đề Tin học 12 theo bài còn lại** (Bài 1, 4, 7, 10, 14, 17, 23, 24, 28 — mỗi đề 28 câu / 45 phút / 10 điểm, tổng 252 câu), đã soát đáp án độc lập từng đề và đối chiếu SGK, commit `b273054`. Trước đó: **11 đề Tin học theo bài** (Bài 13, 15, 16, 18…22, 25, 26, 27) đã lên live, môn mới **Hóa học 11** (slug `hoa-hoc`, 25 đề 20 câu, suite `hoa` 30 kiểm tra) và **đề KTPL tốt nghiệp 2025 chính thức** mã 1007.

Cổng kiểm tra của đợt 9 đề mới (đo ngày 07/11): `node scripts/check-exam.mjs --all` = `OK: 210 đề, 7649 câu, 6 cảnh báo` (6 WARN vẫn là 5 đề Sử cũ + 1 MULTIPLE_CHOICE một đáp án ở đề Sử, không liên quan đợt này); `node scripts/verify.mjs --scope=tinhoc,static,features --build` = **3 bộ xanh, 193 kiểm tra** (tinhoc 54/54, static 45/45, features 94/94); `node scripts/verify.mjs --scope=all --no-build` = **"Tất cả 12 bộ test đều xanh.", tổng 848 kiểm tra, 220 giây**. Không phải sửa suite nào: `tinhoc` tự tính `TOTAL_DE`, tổng đề/câu đọc từ `content/exams/`. Việc còn lại chỉ là commit (khi được yêu cầu) rồi deploy.

## Việc còn lại

Bắt buộc: không còn việc gì treo. Đợt 9 đề Tin học đã commit ở `b273054` sau khi `check-exam --all` và `--scope=all` (12 bộ / 848 kiểm tra) xanh; bản live vẫn là 201 đề cho tới khi được yêu cầu deploy: `--scope=deploy --build` → `npx wrangler deploy` → `--scope=live`.

Đang treo, chỉ làm khi được nhắc:

- ~~Tin học 12 còn 9 bài chưa có đề riêng~~ — đã soạn xong 9 đề ngày 07/11 (Bài 1, 4, 7, 10, 14, 17, 23, 24, 28), Tin học nay có **28 đề theo bài** phủ đủ 28 bài.
- Đối chiếu SGK cho 9 đề mới: đã làm 07/11 cho cả 9 bài bằng nguồn lý thuyết công khai (thaycai.net, baigiang.violet.vn, vietjack) — sửa 9 câu (Bài 1 c8, c17; Bài 4 c13, c21; Bài 7 c20; Bài 10 c18, c19, c25; Bài 14 c5) và rà lại toàn bộ nhiễu liên quan; chi tiết từng bài ở mục "Câu cần người duyệt". Còn 2 chỗ cần quyết định của người duyệt: 3 câu đạo đức AI của Bài 1 (c19, c28-D, c18) và 2 câu Bài 23 nằm trong đề Bài 24 (c23, c24).
- Đề giữa kì / tổng hợp cho Hóa 11; đề luyện thi tốt nghiệp cho Địa lí; bổ sung đề 2025 Hóa, Địa nếu tìm được nguồn công bố của Bộ GD&ĐT và đối chiếu chéo đáp án trước khi chép vào `content/`.

Tin học hiện có **28 đề theo bài** (toàn bộ Bài 1…28). Quy ước mỗi đề mới: file `content/exams/de-tin-hoc-12-bai-NN.json`, `TOPIC_TEST`, lớp 12, 28 câu / 45 phút / 10 điểm = 24 SINGLE_CHOICE × 0,25 + 4 MULTIPLE_CHOICE × 1, `partName` "Phần I. Trắc nghiệm nhiều lựa chọn" và "Phần II. Chọn các nhận định đúng", phân bố đáp án A/B/C/D đúng 6/6/6/6, mỗi đề 2 câu phần II có 2 đáp án và 2 câu có 3 đáp án, topic theo bảng:

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
- Bài 1 → `topic-th-ai-lam-quen`
- Bài 4 → `topic-th-giao-thuc-mang`
- Bài 7 → `topic-th-html-cau-truc`
- Bài 10 → `topic-th-tao-lien-ket`
- Bài 14 → `topic-th-dinh-dang-van-ban-css`
- Bài 17 → `topic-th-muc-uu-tien-bo-chon`
- Bài 23 → `topic-th-chuan-bi-web`
- Bài 24 → `topic-th-dau-trang-web`
- Bài 28 → `topic-th-thuc-hanh-tong-hop`

## Câu cần người duyệt (9 đề Tin học mới, 07/11)

Mỗi đề đã được một agent khác soát đáp án độc lập (đối chiếu từng câu với các câu cùng chủ đề đã có trong repo ở `C:/Users/trinh/.qoder/tmp/tinhoc-bai-thieu/ref-bai-NN.txt`). Không câu nào bị kết luận sai đáp án; các mục dưới đây là chỗ dữ kiện **không có trong repo**, agent soạn/sóc phải dựa vào kiến thức chuẩn hoặc nguồn web, nên cần người mở SGK giấy đối chiếu trước khi tin cậy tuyệt đối:

- Bài 1: ĐÃ ĐỐI CHIẾU VÀ SỬA 07/11 — nguồn lý thuyết Bài 1 (thaycai.net, KNTT CS & ICT) chỉ có hai mục "Khái niệm về AI" và "Một số ứng dụng của AI", không có cách gọi "AI thế hệ đầu / thế hệ mới" và không có mục điều kiện để AI học được. Đã thay c8 bằng câu về khả năng học (điều chỉnh hành vi nhờ dữ liệu mới) và c17 bằng câu tình huống về khả năng suy luận, đều bám năm đặc trưng trí tuệ của bài. c19 và c28-D (an toàn, thận trọng thông tin cá nhân) GIỮ NGUYÊN vì là kiến thức sử dụng AI đúng đắn, nhưng nguồn lý thuyết Bài 1 không thấy mục đạo đức — người duyệt cân nhắc có nên chuyển sang đề Bài 2 hay không.
- Bài 4: ĐÃ ĐỐI CHIẾU 07/11 — giáo án Bài 4 (baigiang.violet.vn, bài giảng KNTT) xác nhận bài dạy FTP, SMTP, POP3, IMAP, HTTP, HTTPS, ICMP, DNS nên các câu c16, c18, c19, c20, c24, c28 giữ nguyên. Đã sửa c13-A thành nhiễu trong bảng định tuyến ("gửi theo cổng 1 vì chỉ số nhỏ nhất") thay cho ý "router báo lỗi về máy gửi" nằm ngoài bài; đã sửa c21-C thành "HTTP và DNS" kèm lời giải nói rõ hai giao thức này thuộc bộ TCP/IP nhưng không hợp thành bộ nền.
- Bài 7: ĐÃ ĐỐI CHIẾU VÀ SỬA 07/11 — c25-C giữ nguyên vì đúng nguyên văn sách ("nội dung phải đặt trong `<body>` mới hiển thị", khác cách trình duyệt tự sửa HTML thật). Nhóm trùng khía cạnh đã giảm: c20 chuyển sang câu về dấu cách và dấu xuống dòng (dữ kiện có trong bài, trước đó đề chưa hỏi), còn c1 (bản chất HTML) và c15 (vì sao gọi là ngôn ngữ đánh dấu) khác góc hỏi nên giữ; c12 và c23 đều hỏi cấu trúc lồng nhau nhưng một câu hỏi trình tự, một câu hỏi bộ phần tử tối thiểu.
- Bài 10: ĐÃ ĐỐI CHIẾU VÀ SỬA 07/11 — SGK Bài 10 không dạy thuộc tính `target`/mở tab mới (sách chỉ nêu `href`, đường dẫn tuyệt đối – tương đối, `id` + `href="#…"`, liên kết cho ảnh). Đã thay c18 (khái niệm siêu văn bản), c19 (liên kết cùng thư mục gốc), c25-D (giá trị `href` tuyệt đối/tương đối), đổi nhiễu c3-B, c15-C, c23-A và các lời giải c9, c17, c23 để không còn viện dẫn `target`; đã xoá cụm "mở tab mới bằng `target`" khỏi `description`. Không còn chuỗi `target` nào trong file. c13-B ("id … một lần trong toàn bộ trang web") giữ nguyên vì là nguyên văn sách.
- Bài 14: ĐÃ SỬA 07/11 — c5 đổi thành "cỡ chữ hiện thời tại vị trí áp dụng" (đọc được cả theo sách lẫn theo CSS thật, vì cỡ chữ kế thừa tại vị trí phần tử chính là cỡ chữ của phần tử cha), nhiễu D đổi thành "cỡ chữ của phần tử đứng sau" thay cho "phần tử cha" vốn là đáp án đúng của CSS thật; `text-transform` không còn xuất hiện trong file.
- Bài 17: ĐÃ SỬA 07/11 — c18 đổi cặp màu đen/trắng thành đen/đỏ để tránh cảnh chữ trắng trên nền trắng; c15 thay nhiễu "Media type" (mức ưu tiên không chắc trong bảng) bằng "bộ chọn lớp" có trọng số 10 rõ ràng; c22 bổ sung lời giải nhắc đủ thứ tự bảng ưu tiên gồm kế thừa và định dạng mặc định của trình duyệt.
- Bài 23: GIỮ NGUYÊN sau khi đối chiếu 07/11 — c5–c9 và c26 hỏi phần đầu/thân/chân trang đúng như phần khái niệm cấu trúc trang của bài; các bài 24–25 chỉ đi sâu từng phần chứ không thay thế. c11-C dùng "tên miền" làm nhiễu là chấp nhận được vì lời giải nói rõ tên miền chỉ là một phần của URL.
- Bài 24: GIỮ NGUYÊN sau khi đối chiếu 07/11 — c23 (Xem trước) và c24 (giao diện ba phần) đúng dữ kiện nhưng thuộc Bài 23; đã rà cả 16 câu trong ref thì không còn dữ kiện nào của riêng Bài 24 chưa được hỏi ở c1–c22 và c25–c28, nên đổi hai câu này sẽ phải bịa thêm dữ kiện. Người duyệt có thể thay nếu muốn siết phạm vi bài.
- Bài 28: GIỮ NGUYÊN sau khi đối chiếu 07/11 — c2, c13, c20, c22, c23 dùng dữ kiện Bài 23–27 nhưng đúng bản chất bài thực hành tổng hợp (sản phẩm phải hoàn thiện đủ đầu trang, thân trang, chân trang, biểu mẫu, công bố), không sửa gì.

Một phát hiện ở đề **đã lên live**, chưa sửa: `content/exams/de-tin-hoc-12-so-05.json`, câu `tinhoc12-05-c25` phương án D nói "!important cần viết ngay sau thuộc tính" — theo CSS thật thì phải viết sau **giá trị**, trước dấu `;`, và đây là nhận định được chấm là ĐÚNG. Cần quyết định có sửa diễn đạt này không (liên quan tới đề đã công bố nên không tự ý đổi).

## Điểm dừng phiên 06/11 (ĐÃ HOÀN THÀNH ngày 07/11 — giữ lại để tham chiếu quy ước)

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
