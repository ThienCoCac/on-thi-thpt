# Bàn giao — Ôn Thi THPT

Cập nhật 17/11/2026. Mở task mới thì đọc file này trước, rồi tới `AGENTS.md`.

## Lộ trình lấy lại gốc Hóa học đến hết lớp 11 (17/11, ĐÃ xuất bản)

- Người dùng yêu cầu **“siêu lộ trình lấy lại gốc từ đầu cho người đã mất gốc hóa tới lớp 11”**, chọn **đưa vào website**, rồi duyệt **commit/push/deploy**. Đợt này chỉ làm lộ trình Hóa; không soạn Hóa 12, không sửa đề cũ. Đã commit **`07c34ad`**, push `origin/main` (`65895fd..07c34ad`), `npx wrangler deploy` tải đủ 2316 file lên version **`03089091-eb01-4dab-88a0-e1c06f6f8a89`** (14:24:52Z). Khoảng 93 giây sau Cloudflare tự deploy thêm version **`67d942ed-8096-42e4-b919-dfde13253855`** (14:26:25Z, nhiều khả năng Workers Builds dựng từ Git sau push) và chiếm 100% lưu lượng; **từ đó push lên main có thể sinh version Workers Builds mới chiếm 100%, kể cả push chỉ tài liệu** (push bàn giao `88ef6cf` sinh version `5b99ce76-5b4f-4a64-8174-e87f0d7be819`; push `58dcec2` sau đó không thấy version mới trong khoảng 3 phút theo dõi). Nội dung site không đổi giữa các bản dựng của cùng một commit. Xem version active hiện tại bằng `npx wrangler deployments status`, **đừng coi ID version ghi trong file này là cố định**. Bản live vẫn **221 đề / 7.869 câu / 11 môn**, nay có thêm lộ trình. Đọc mục sự cố bên dưới trước khi chạy kiểm tra live.
- Trang mới `/lo-trinh/hoa-hoc-mat-goc` (bản đồ 10 chặng) và 40 trang bài `/lo-trinh/hoa-hoc-mat-goc/<lesson>`. **10 chặng × 4 bài = 40 bài**, mỗi bài ~45 phút gồm mục tiêu, ba đoạn lý thuyết, một ví dụ giải ba bước, chỗ dễ nhầm, gợi nhớ chủ động, ghi chú cá nhân và **3 câu tự kiểm tra có lời giải** → **120 câu riêng của lộ trình**, không nhập vào ngân hàng đề nên tổng 221 đề / 7.869 câu không đổi.
- Đánh giá: khảo sát đầu vào **12 câu** (chỉ phủ nền tảng đến cân bằng/pH, không đo toàn bộ Hóa 11), kiểm tra mỗi chặng **8 câu** (câu 2–3 của bốn bài, mốc gợi ý 7/8), tổng hợp cuối **20 câu** (mốc gợi ý 16/20). Tất cả **dùng lại câu đã học** và UI nói rõ đó là tự ôn, không phải đề độc lập hay chứng nhận điểm số. Khảo sát/kiểm tra chặng không tự đánh dấu bài đã đạt; chỉ lượt tự kiểm cuối bài đạt 3/3 mới ghi nhận.
- Tiến độ lưu ở khóa riêng `on-thi-thpt:hoa-mat-goc:v1`, tách khỏi tiến độ đề thi: best/latest/attempts, `masteredAt`, lịch ôn cách quãng **1/3/7/14 ngày** (lần ôn sai hẹn ôn ngay và vẫn hiện dù từng đạt), nhịp **1/2/4 bài mới mỗi tuần** → ước tính 40/20/10 tuần chưa tính học bù, ghi chú ≤3.000 kí tự mỗi bài. Dữ liệu hỏng hoặc bị chặn lưu trữ thì báo rõ, vẫn học trong phiên và **không ghi đè dữ liệu cũ**; có đồng bộ giữa các tab qua sự kiện `storage`. Không khóa chặng nào.
- File mới: `content/roadmaps/hoa-hoc-mat-goc.json` (dữ liệu), `lib/roadmap-types.ts`, `lib/chemistry-roadmap.ts` (Zod + kiểm tham chiếu lúc build, chỉ đọc phía server), `lib/roadmap-progress.ts` (schema + hàm thuần `recordLesson`), `components/roadmap/` (`use-roadmap-progress.ts`, `roadmap-quiz.tsx`, `roadmap-dashboard.tsx`, `lesson-player.tsx`), hai page trong `app/(public)/lo-trinh/hoa-hoc-mat-goc/`, suite `scripts/verify-lo-trinh-hoa.cjs`. Sửa nhỏ: `site-header.tsx` thêm mục “Học lại Hóa”, trang chủ thêm thẻ dẫn vào lộ trình, `sitemap.ts` thêm 41 URL, `verify.mjs` đăng ký bộ `lo-trinh` và ánh xạ riêng cho đường dẫn lộ trình. Trang tổng quan chỉ nhận tóm tắt bài + pool câu hỏi; trang bài chỉ nhận lý thuyết của chính nó.
- Liên kết “luyện sâu hơn” nối sang 25 đề Hóa 11 **theo nội dung thật của đề**, không theo số bài SGK: kho cũ đánh số `bai-05` = Sulfur, `bai-06` = Ammonia, `bai-07` = oxide nitrogen; bài nitrogen nối 04/06/07, bài sulfur nối 05/08/09. Không sửa các đề cũ để chiều lộ trình.
- Kiểm tra đã chạy: `verify-lo-trinh-hoa.cjs --content-only` **71/71** (30 đáp án số tính lại từ dữ kiện, 22 chốt nguyên lí, kiểm liên kết đề theo tiêu đề thật); `verify.mjs --scope=lo-trinh,static,features --build` **3 bộ xanh / 238 kiểm tra**, exit 0 (typecheck 4,0s, lint 33,1s, build 83,6s; lo-trinh 99/99); `verify.mjs --scope=all --no-build` **Tất cả 15 bộ test đều xanh. Tổng 1199 kiểm tra, 221,1 giây**, exit 0, không bộ `0/0`. Đã xem ảnh `.verify/lo-trinh/danh-sach.png`, `bai-hoc.png`, `mobile.png`: bản đồ 10 chặng, trang bài và lời giải đọc tốt, không tràn ngang ở 390px. Suite trình duyệt phủ khảo sát 12/12 không tặng mastery, bài 3/3 hẹn ôn +1 ngày, lần ôn sai 2/3 vào hàng cần ôn, chặng 7/8, ghi chú còn sau tải lại, mobile trả lời đủ 3 câu, kho hỏng giữ nguyên, chặn `setItem` vẫn đổi nhịp trong phiên, đủ 40 trang bài + sitemap + lối vào trang chủ/header.
- Bản nháp sinh dữ liệu `.verify/soan-lo-trinh.cjs` nằm ngoài git, **từ chối ghi đè** file JSON đã có; sửa nội dung thì sửa thẳng JSON (đã đồng bộ nháp với ba sửa đổi: lỗi lặp từ, câu hỏi peak MS, lời giải alkyne-q1).
- Sau xuất bản: `verify --scope=live` **41/41**, thông báo **Tất cả 1 bộ test đều xanh.**, exit 0 (49,8 giây); chạy thêm `BASE=https://on-thi-thpt.thiencogemini1.workers.dev node scripts/verify-lo-trinh-hoa.cjs` **99 kiểm tra, 0 thất bại**, exit 0. Cả hai lượt chạy sau khi edge hội tụ về version Git; lượt đầu ngay sau deploy trượt 7 kiểm tra do cache trộn hai version (mục sự cố). Kiểm tra lại sau push bàn giao `88ef6cf`: `--scope=live` **41/41** (52,7 giây) và suite lộ trình `BASE=live` **99/99** trên version `5b99ce76-5b4f-4a64-8174-e87f0d7be819`, exit 0. Hóa 12 vẫn chưa bắt đầu, không tự chuyển đợt.

### Sự cố hai deployment chồng nhau khi xuất bản lộ trình (17/11)

- Ngay sau `wrangler deploy` (14:24:52Z), một deployment thứ hai xuất hiện lúc 14:26:25Z và chiếm 100%: version `67d942ed-8096-42e4-b919-dfde13253855`, Source “Unknown (deployment)”, cùng tài khoản. Khớp thời điểm với push `07c34ad` nên nhiều khả năng là **Cloudflare Workers Builds tự dựng lại từ Git**; chưa tắt vì đó là cấu hình phía dashboard của người dùng.
- Lượt `--scope=live` đầu tiên (chạy trong cửa sổ chuyển tiếp) trượt 7/41: phòng luyện tập không hiện câu hỏi, console 404 và `ERR_ABORTED` đúng hai chunk `main-app-8b98336d1af6a7b9.js`, `webpack-d828523fbbdd5a4c.js`. Edge khi đó trộn HTML và chunk của hai version khác nhau.
- Chẩn đoán: trang bài lộ trình (đường dẫn mới, chưa từng được cache) trả 200 với đúng tiêu đề bài nhưng tham chiếu cặp hash `webpack-d828523fbbdd5a4c` / `main-app-8b98336d1af6a7b9` — khác cặp hash của build cục bộ đợt này (`webpack-fe156644f934faa2` / `main-app-5bee94de8525d4b9`). Mọi chunk mà HTML live tham chiếu, kể cả chunk trang `[lesson]` mới, đều 200 → **bản Git đang active tự nhất quán và đủ lộ trình**; chunk hash cục bộ bị 404 trên live là dự kiến, không phải mất file. Gửi header `Cache-Control: no-cache` phía request không bypass được edge cache của Workers Assets.
- Cách xử lí đã dùng: chờ edge hội tụ rồi chạy lại `--scope=live` (41/41) và suite lộ trình với `BASE=live` (99/99), cả hai exit 0. **Không sửa hay nới kiểm tra, không redeploy chồng thêm.**
- Quy tắc rút ra: sau push hoặc deploy, chờ vài phút cho edge hội tụ rồi mới chạy `--scope=live`; nếu live trượt với lỗi 404 chunk thì đối chiếu hash trong HTML live trước khi kết luận mất file; muốn chấm dứt deployment tự động thì người dùng tắt Workers Builds trong dashboard Cloudflare (chưa làm).

### Nguồn và giới hạn kiểm chứng nội dung lộ trình Hóa

Nội dung tự biên soạn cho người học lại, sắp thứ tự riêng chứ không chép SGK. Đã đọc **mục lục** Hóa 10 và Hóa 11 Kết nối tri thức trên VietJack ngày 17/11/2026 để đối chiếu phạm vi (Hóa 10 bảy chương gồm halogen; Hóa 11 sáu chương đến carbonyl/carboxylic acid), không đọc trọn sách và **chưa có giáo viên thẩm định độc lập**. Định nghĩa mol đối chiếu BIPM, quan hệ pH/pOH đối chiếu OpenStax ở mức đoạn trích; các điều kiện khí 25 °C/1 bar và 0 °C/1 atm nêu ngay trong bài. Bộ test tự động kiểm dữ liệu, phép tính và hành vi phần mềm, không thay thẩm định chuyên môn. UI ghi rõ giới hạn này cùng cảnh báo không tự thử hóa chất ở nhà.

- [Mục lục Hóa 10 Kết nối tri thức — VietJack](https://www.vietjack.com/hoa-hoc-10-kn/index.jsp)
- [Mục lục Hóa 11 Kết nối tri thức — VietJack](https://www.vietjack.com/hoa-hoc-11-kn/index.jsp)
- [Định nghĩa mol — BIPM](https://www.bipm.org/en/si-base-units/mole)
- [pH và pOH — OpenStax Chemistry 2e](https://openstax.org/books/chemistry-2e/pages/14-2-ph-and-poh)

## Trạng thái đã xuất bản ngày 16/11 — Vật lí và Sinh học 12

- Người dùng đã yêu cầu rõ **commit/push/deploy**. Cả hai đợt đã commit ở **`fafa1dd`**, push `origin/main` (`90f2438..fafa1dd`) và deploy thành công; không còn đợt Vật lí/Sinh học chờ xuất bản.
- **Bản LIVE: 221 đề / 7.869 câu / 11 môn**, có đủ **5 đề Vật lí 12 / 100 câu** và **6 đề Sinh học 12 / 120 câu**. Địa chỉ: https://on-thi-thpt.thiencogemini1.workers.dev — Cloudflare version **`e7055212-dcb8-479a-b388-e5d85862da2f`**.
- Trước phát hành: `check-exam --all` **221 đề / 7869 câu / 6 WARN Sử cũ**, không lỗi; `verify --scope=deploy --build` **Tất cả 15 bộ test đều xanh**, tổng **1141 kiểm tra / 215,4 giây**, exit 0. Typecheck, lint, build đều qua; build 68,7 giây.
- Sau deploy: `verify --scope=live` **41/41**, thông báo **Tất cả 1 bộ test đều xanh**, exit 0. Chạy thêm hai suite với `BASE=https://on-thi-thpt.thiencogemini1.workers.dev`: **Vật lí 116/116**, **Sinh học 136/136**, đều exit 0. Hai suite gồm kiểm nội dung trên đĩa và kiểm trực tiếp JSON, bộ lọc, ngân hàng, toàn bộ 220 câu luyện tập trên mobile và chấm điểm đúng hết/sai một câu trên bản công khai.
- Wrangler gặp hai lỗi tải tài nguyên lên Cloudflare API và tự thử lại trong cùng lệnh; cuối cùng tải đủ 2221 file mới/thay đổi, báo deploy thành công cùng version trên. Không còn lỗi triển khai cần xử lí.
- Commit cập nhật bàn giao sau phát hành chỉ đổi tài liệu, không đổi nội dung ứng dụng đã deploy. Không commit `.env`, thư mục build, ảnh kiểm tra hay các suite ngoài repo.
- Nội dung vẫn là đề ôn tự soạn, không phải đề chính thức và chưa được giáo viên duyệt độc lập; giới hạn nguồn ở các mục lịch sử dưới đây vẫn còn nguyên. Hóa học 12 chưa bắt đầu, không tự chuyển sang đợt mới.

## Đợt soạn Sinh học 12 (16/11, lịch sử trước khi xuất bản)

- Sau đợt Vật lí, người dùng yêu cầu **“tiếp tục môn khác”**. Đã chọn **Sinh học 12**; không chuyển sang Hóa 12, không sửa lại các đề Vật lí hay các vấn đề Tin học cũ.
- Trên đĩa hiện có **221 đề / 7.869 câu / 11 môn**. Đợt này thêm **6 đề Sinh học 12 / 120 câu**. Cả 5 đề Vật lí và 6 đề Sinh học vẫn chưa commit/push/deploy. Bản live theo lần kiểm tra xuất bản gần nhất vẫn **210 đề / 7.649 câu**, version `a4c240a8-ce17-4cdc-9923-e1d13f758cc0`; không kiểm tra lại live trong đợt này.
- Năm đề nhóm kiến thức: `de-sinh-12-di-truyen-phan-tu` (Chương I), `de-sinh-12-di-truyen-nhiem-sac-the` (II), `de-sinh-12-di-truyen-quan-the` (III–IV), `de-sinh-12-tien-hoa` (V), `de-sinh-12-sinh-thai-moi-truong` (VI–VIII); thêm `de-sinh-12-tong-hop-01` có bốn câu mỗi nhóm. Đây là **ôn theo nhóm kiến thức, không phải mỗi chương một đề và không bao quát từng bài SGK**.
- Mỗi đề 20 SINGLE_CHOICE × 0,5 điểm, 45 phút, tổng 10 điểm; năm TOPIC_TEST và một FULL_EXAM. Mỗi đáp án A/B/C/D xuất hiện năm lần; 6 EASY / 10 MEDIUM / 4 HARD. Có lời giải và nhãn tự soạn, không phải đề chính thức hoặc cấu trúc tốt nghiệp.
- `content/subjects.json` thêm `sinh-hoc`, order 10, năm topic `topic-sinh-12-phan-tu`, `topic-sinh-12-nhiem-sac-the`, `topic-sinh-12-quan-the`, `topic-sinh-12-tien-hoa`, `topic-sinh-12-sinh-thai`. Mỗi nhóm có 24 câu trong ngân hàng. `lib/subject-theme.ts` có màu lime; không thay đổi layout.
- Thêm suite trong repo `scripts/verify-sinh-hoc.cjs`, đăng ký `sinh` và ánh xạ `de-sinh-` trong `scripts/verify.mjs`. `--scope=all` hiện đăng ký 14 bộ. Kiểm nhanh: `node scripts/verify-sinh-hoc.cjs --content-only`; kiểm nội dung gồm **110 kiểm tra**, trong đó **45 đáp án số tính lại từ dữ kiện**, 25 chốt nguyên lí và 4 chốt giả thiết. Kiểm trình duyệt được thiết kế để duyệt toàn bộ 120 câu ở 390px, JSON xuất, bộ lọc/ngân hàng, luyện theo nhóm và chấm điểm đúng toàn bộ/sai một câu.
- Đã thêm `sinh-hoc` vào năm danh sách ngân hàng ngoài repo: `english/verify-anh.js`, `ktpl/verify-ktpl.js`, `su/verify-van.js`, `tinhoc/verify-tinhoc.js`, `su/verify-live.js`. Các file dưới `C:/Users/trinh/.qoder/tmp/` này **không được git lưu**. Chưa chạy live vì chưa được phép deploy nội dung mới.
- Kết quả hiện có: `check-exam --all` **221 đề / 7869 câu / 6 WARN Sử cũ**, không lỗi; `verify-sinh-hoc.cjs --content-only` **110/110**, exit 0. Lượt `--scope=all --build` đầu: typecheck (2,1 giây), lint (3,8 giây), build (64,1 giây) qua; 13 bộ cũ xanh nhưng `sinh` trượt 6 kiểm tra JSON do test so sánh thô phương án thiếu `imageUrl` với bản export chuẩn hóa `imageUrl: null`. Đã đọc `toRunnerQuestion`/`getRunnerExam` và JSON thực, sửa test để đối chiếu sâu **toàn bộ RunnerExam theo hợp đồng export**, giữ kiểm tra nội dung, ảnh, điểm, phương án, đáp án, lời giải và chuyên đề; không sửa dữ liệu để chiều test, không bỏ kiểm tra. Chạy lại `--scope=sinh --no-build` đạt **136/136, Tất cả 1 bộ test đều xanh**, exit 0. Lượt cuối `--scope=all --no-build` đạt **Tất cả 14 bộ test đều xanh. Tổng 1100 kiểm tra, 213,5 giây**, exit 0; riêng `sinh` **136/136**, không có bộ `0/0`. Typecheck và lint lượt cuối đều qua. `AGENTS.md` đã cập nhật 14 bộ / 1100 kiểm tra và lệnh kiểm Sinh học. Đợt Sinh học hoàn tất trên máy, **chưa commit/push/deploy**. Đã mở và xem ba ảnh `.verify/sinh-hoc/danh-sach.png`, `mobile-lien-ket-X.png`, `mobile-xac-suat.png`: đủ sáu thẻ đề màu lime, kí hiệu di truyền và lời giải đọc được, không thấy tràn ngang ở 390px.

### Nguồn và giới hạn kiểm chứng nội dung Sinh học

Câu hỏi và số liệu tự soạn. Đã đọc mục lục và các đoạn lý thuyết nguồn thứ cấp ngày 16/11/2026, không tuyên bố đối chiếu nguyên văn toàn bộ SGK hoặc đã có giáo viên duyệt độc lập. Chưa mở toàn bộ PDF SGK gốc. Bộ test tự động kiểm dữ liệu, phép tính và hành vi phần mềm, không thay thế thẩm định chuyên môn.

- Phạm vi tám chương: [mục lục Sinh học 12 Kết nối tri thức trên THI247](https://thi247.com/sach-giao-khoa-sinh-hoc-12-ket-noi-tri-thuc-voi-cuoc-song/).
- Di truyền phân tử: đọc các đoạn Bài 1–5 trên VietJack, gồm [DNA và tái bản](https://vietjack.com/sinh-hoc-12-kn/ly-thuyet-bai-1-dna-va-co-che-tai-ban-dna.jsp), [gene và truyền đạt thông tin](https://vietjack.com/sinh-hoc-12-kn/ly-thuyet-bai-2-gene-qua-trinh-truyen-dat-thong-tin-di-truyen.jsp), [điều hòa biểu hiện](https://vietjack.com/sinh-hoc-12-kn/ly-thuyet-bai-3-dieu-hoa-bieu-hien-gene.jsp), [đột biến gene](https://vietjack.com/sinh-hoc-12-kn/ly-thuyet-bai-4-dot-bien-gene.jsp), [công nghệ di truyền](https://vietjack.com/sinh-hoc-12-kn/ly-thuyet-bai-5-cong-nghe-di-truyen.jsp). Câu dịch mã nêu rõ vùng đọc/codon kết thúc và chưa xét biến đổi sau dịch mã; gene có thể tạo RNA chức năng, không mặc định mọi gene đều mã hóa protein.
- Di truyền nhiễm sắc thể: đọc các đoạn Bài 8–13, gồm [Mendel](https://vietjack.com/sinh-hoc-12-kn/ly-thuyet-bai-8-hoc-thuyet-di-truyen-cua-mendel.jsp), [mở rộng Mendel](https://vietjack.com/sinh-hoc-12-kn/ly-thuyet-bai-9-mo-rong-hoc-thuyet-mendel.jsp), [liên kết giới tính](https://vietjack.com/sinh-hoc-12-kn/ly-thuyet-bai-10-di-truyen-gioi-tinh-va-di-truyen-lien-ket.jsp), [liên kết và hoán vị](https://vietjack.com/sinh-hoc-12-kn/ly-thuyet-bai-11-lien-ket-gene-va-hoan-vi-gene.jsp). Đề ghi rõ phân li độc lập, trội hoàn toàn, pha liên kết, giao tử đối ứng và điều kiện sức sống khi cần; phân biệt xác suất trong con trai với toàn bộ đời con.
- Di truyền mở rộng và quần thể: [gene ngoài nhân](https://vietjack.com/sinh-hoc-12-kn/ly-thuyet-bai-15-di-truyen-gene-ngoai-nhan.jsp), [kiểu gene và môi trường](https://vietjack.com/sinh-hoc-12-kn/ly-thuyet-bai-16-tuong-tac-giua-kieu-gene-voi-moi-truong.jsp), [di truyền quần thể](https://vietjack.com/sinh-hoc-12-kn/ly-thuyet-bai-18-di-truyen-quan-the.jsp). Không khẳng định mọi di truyền ngoài nhân đều theo mẹ hoặc con luôn giống hệt mẹ; câu cây lá khảm nêu rõ sự phân bố lục lạp. Bài tự phối/ngẫu phối/Hardy–Weinberg dùng giả thiết lí tưởng, bài chọn cá thể kiểu hình trội dùng xác suất có điều kiện.
- Tiến hóa: đọc các đoạn Bài 19–22, gồm [bằng chứng](https://vietjack.com/sinh-hoc-12-kn/ly-thuyet-bai-19-cac-bang-chung-tien-hoa.jsp), [Darwin và chọn lọc](https://vietjack.com/sinh-hoc-12-kn/ly-thuyet-bai-20-quan-niem-cua-darwin-ve-chon-loc-tu-nhien.jsp), [tiến hóa tổng hợp hiện đại](https://vietjack.com/sinh-hoc-12-kn/ly-thuyet-bai-21-hoc-thuyet-tien-hoa-tong-hop-hien-dai.jsp), [phát sinh chủng loại](https://vietjack.com/sinh-hoc-12-kn/ly-thuyet-bai-22-tien-hoa-lon-va-qua-trinh-phat-sinh-chung-loai.jsp). Tránh diễn đạt đột biến có mục đích; quan niệm loài sinh học có giới hạn áp dụng. Không dùng số chu kì bán rã uranium sai xuất hiện trong nguồn Bài 19.
- Sinh thái: đọc các đoạn Bài 23, 24, 26, 28, 29, gồm [quần thể](https://vietjack.com/sinh-hoc-12-kn/ly-thuyet-bai-24-sinh-thai-hoc-quan-the.jsp), [quần xã](https://vietjack.com/sinh-hoc-12-kn/ly-thuyet-bai-26-quan-xa-sinh-vat.jsp), [hệ sinh thái](https://vietjack.com/sinh-hoc-12-kn/ly-thuyet-bai-28-he-sinh-thai.jsp), [vật chất và năng lượng](https://vietjack.com/sinh-hoc-12-kn/ly-thuyet-bai-29-trao-doi-vat-chat-va-chuyen-hoa-nang-luong.jsp). Hiệu suất truyền năng lượng được cho số cụ thể, không mặc định luôn 10%; phân biệt độ giàu loài (số loài) với độ đồng đều.
- Phần cuối dùng các bài có nội dung thực trên Loigiaihay: [diễn thế](https://loigiaihay.com/ly-thuyet-dien-the-sinh-thai-sinh-hoc-12-ket-noi-tri-thuc-a177235.html), [sinh quyển và chu trình](https://loigiaihay.com/ly-thuyet-sinh-quyen-khu-sinh-hoc-va-chu-trinh-sinh-dia-hoa-sinh-12-ket-noi-tri-thuc-a177237.html), [phục hồi và bảo tồn](https://loigiaihay.com/ly-thuyet-sinh-thai-hoc-phuc-hoi-va-bao-ton-dang-sinh-vat-sinh-hoc-12-ket-noi-tri-thuc-a177238.html), [phát triển bền vững](https://loigiaihay.com/ly-thuyet-phat-trien-ben-vung-sinh-hoc-12-ket-noi-tri-thuc-a177248.html). Các trang VietJack Bài 30, 31, 33, 34 chưa có lý thuyết đủ dùng nên **không tính là đã kiểm chứng nội dung**. Không dùng ngưỡng độ mặn nước ngọt đáng ngờ ở nguồn Loigiaihay.

## Đợt soạn Vật lí 12 (16/11, lịch sử trước khi xuất bản)

- Người dùng giao tự chọn môn lớp 12 còn thiếu. Đã chọn **Vật lí 12**, không làm thêm Sinh học hoặc Hóa 12 trong đợt này.
- Trên đĩa hiện có **215 đề / 7.749 câu / 10 môn**, thêm **5 đề Vật lí 12 / 100 câu**. Bản live vẫn là **210 đề / 7.649 câu**, version `a4c240a8-ce17-4cdc-9923-e1d13f758cc0`; chưa có yêu cầu xuất bản đợt Vật lí.
- Bốn đề chương: `de-vat-li-12-chuong-01` đến `04` (Vật lí nhiệt; Khí lí tưởng; Từ trường; Vật lí hạt nhân) và `de-vat-li-12-tong-hop-01`. Mỗi đề 20 SINGLE_CHOICE × 0,5 điểm, 45 phút, lớp 12; đề chương là TOPIC_TEST, đề tổng hợp là FULL_EXAM. Tất cả ghi rõ **đề tự soạn, không phải đề chính thức hay cấu trúc thi tốt nghiệp**.
- `content/subjects.json` thêm môn `vat-li`, order 9, bốn topic `topic-li-12-nhiet`, `topic-li-12-khi`, `topic-li-12-tu-truong`, `topic-li-12-hat-nhan`. Mỗi chương có 20 câu riêng + 5 câu trong đề tổng hợp = 25 câu/ngân hàng. Có màu nhận diện trong `lib/subject-theme.ts`.
- Bộ kiểm tra mới **vatli** nằm trong repo: `scripts/verify-vat-li.cjs`, được đăng ký trong `scripts/verify.mjs`; `--scope=all` nay gồm **13 bộ**. Kiểm tra nhanh chỉ nội dung: `node scripts/verify-vat-li.cjs --content-only`. Bộ mới tính lại **58 bài số** từ dữ kiện và thêm kiểm tra cấu trúc, đơn vị, bảo toàn hạt; chạy trình duyệt còn duyệt đủ 100 câu/lời giải ở chiều rộng 390px, kiểm tra JSON, bộ lọc, phiên luyện tập theo chương, điểm 10 và điểm 9,50.
- Đã thêm `vat-li` vào danh sách ngân hàng của các suite ngoài repo: `english/verify-anh.js`, `ktpl/verify-ktpl.js`, `su/verify-van.js`, `tinhoc/verify-tinhoc.js`, `su/verify-live.js`. Các thay đổi này **không nằm trong git**. Không chạy kiểm tra live để yêu cầu nội dung Vật lí trước khi được phép deploy.
- Bộ điều phối hỗ trợ đường dẫn suite trong repo và không còn chấp nhận tổng kết `0/0` là xanh.
- Kiểm tra đã có: `check-exam --all` **215 đề / 7749 câu / 6 WARN cũ**, không lỗi; `verify-vat-li.cjs --content-only` **93/93**. `--scope=vatli,static,features --build` **3 bộ xanh / 255 kiểm tra**, exit 0 (vatli 116, static 45, features 94); typecheck, lint, build đều qua. Đã mở ảnh `.verify/vat-li/danh-sach.png` và `mobile-cong-thuc.png`: thẻ đề, công thức và lời giải hiển thị ổn, không tràn ngang ở 390px. `--scope=all --no-build` đã hoàn tất: **Tất cả 13 bộ test đều xanh. Tổng 964 kiểm tra, 212,4 giây**, exit 0; không có bộ `0/0`. `git diff --check` sạch. Đợt Vật lí đã hoàn tất trên máy, **chưa commit/push/deploy**. Đây là mốc kết thúc đợt Vật lí; đợt Sinh học tiếp theo được ghi ở đầu file. Hóa học 12 chưa bắt đầu.
- `AGENTS.md` đã cập nhật hướng dẫn 13 bộ test, vị trí suite Vật lí trong repo và lưu ý danh sách ngân hàng ghi tay khi thêm môn mới.

### Nguồn và giới hạn kiểm chứng nội dung Vật lí

Đây là câu hỏi tự soạn với số liệu mới, không chép đề của nguồn và không gắn nhãn đã đối chiếu nguyên văn toàn bộ SGK. Đã đọc mục lục cùng các trang lý thuyết dưới đây ngày 16/11/2026; chưa đọc được toàn bộ bản PDF gốc và chưa có giáo viên duyệt độc lập.

- [Mục lục sách Kết nối tri thức trên THI247](https://thi247.com/sach-giao-khoa-vat-li-12-ket-noi-tri-thuc-voi-cuoc-song/) xác nhận bốn chương. [Trang giới thiệu sách trên Loigiaihay](https://loigiaihay.com/sgk-vat-li-12-pdf-vat-li-12-ket-noi-tri-thuc-a155831.html) có thứ tự một số bài khác; vì vậy chỉ dùng đối chiếu phạm vi chương, không lấy số bài ở đó làm chuẩn.
- Vật lí nhiệt: đã đọc lý thuyết VietJack các bài 1–6, gồm [Nội năng và định luật I](https://vietjack.com/vat-li-12-kn/ly-thuyet-bai-2-noi-nang-dinh-luat-i-cua-nhiet-dong-luc-hoc.jsp), [nhiệt dung riêng](https://vietjack.com/vat-li-12-kn/ly-thuyet-bai-4-nhiet-dung-rieng.jsp), [nhiệt nóng chảy riêng](https://vietjack.com/vat-li-12-kn/ly-thuyet-bai-5-nhiet-nong-chay-rieng.jsp), [nhiệt hoá hơi riêng](https://vietjack.com/vat-li-12-kn/ly-thuyet-bai-6-nhiet-hoa-hoi-rieng.jsp). Câu nhiệt động lực học luôn dùng công hệ nhận dương, nhiệt hệ nhận dương; bài chuyển thể ghi rõ giả thiết.
- Khí lí tưởng: đã đọc lý thuyết các bài 8–12, gồm [Boyle](https://vietjack.com/vat-li-12-kn/ly-thuyet-bai-9-dinh-luat-boyle.jsp), [Charles](https://vietjack.com/vat-li-12-kn/ly-thuyet-bai-10-dinh-luat-charles.jsp), [phương trình trạng thái](https://vietjack.com/vat-li-12-kn/ly-thuyet-bai-11-phuong-trinh-trang-thai-cua-khi-li-tuong.jsp), [mô hình động học](https://vietjack.com/vat-li-12-kn/ly-thuyet-bai-12-ap-suat-khi-theo-mo-hinh-dong-hoc-phan-tu.jsp). Nguồn thứ cấp ghi sai đơn vị R thành J/(kg·K); **không sao chép lỗi đó**. Đã xác minh [R tại NIST](https://physics.nist.gov/cgi-bin/cuu/Value?r) là J/(mol·K) và [k tại NIST](https://physics.nist.gov/cgi-bin/cuu/Value?k) là J/K; hằng số làm tròn được nêu ngay trong đề.
- Từ trường: đã đọc lý thuyết các bài 14–19, gồm [lực từ](https://vietjack.com/vat-li-12-kn/ly-thuyet-bai-15-luc-tu-tac-dung-len-day-dan-mang-dong-dien.jsp), [từ thông và Faraday–Lenz](https://vietjack.com/vat-li-12-kn/ly-thuyet-bai-16-tu-thong-hien-tuong-cam-ung-dien-tu.jsp), [máy phát](https://vietjack.com/vat-li-12-kn/ly-thuyet-bai-17-may-phat-dien-xoay-chieu.jsp), [máy biến áp](https://vietjack.com/vat-li-12-kn/ly-thuyet-bai-18-ung-dung-hien-tuong-cam-ung-dien-tu.jsp), [sóng điện từ](https://vietjack.com/vat-li-12-kn/ly-thuyet-bai-19-dien-tu-truong-mo-hinh-song-dein-tu.jsp). Không dùng khẳng định thiếu điều kiện “tần số càng cao truyền càng xa” của nguồn; các câu sóng nêu rõ trong chân không.
- Hạt nhân: đã đọc lý thuyết các bài 21–24, gồm [cấu trúc](https://vietjack.com/vat-li-12-kn/ly-thuyet-bai-21-cau-truc-hat-nhan.jsp), [năng lượng liên kết](https://vietjack.com/vat-li-12-kn/ly-thuyet-bai-22-phan-ung-hat-nhan-va-nang-luong-lien-ket.jsp), [phóng xạ](https://vietjack.com/vat-li-12-kn/ly-thuyet-bai-23-hien-tuong-phong-xa.jsp). Dùng hoạt độ của đồng vị mẹ, không nhầm với hoạt độ riêng hoặc tổng hoạt độ chuỗi phân rã; bài hạt nhân con ghi rõ con bền.

## Trạng thái đã xuất bản ngày 07/11 (lịch sử, không phải nội dung hiện tại trên đĩa)

- **Bản LIVE**: commit `9913413`, đã push `origin/main`, deploy Cloudflare version `a4c240a8-ce17-4cdc-9923-e1d13f758cc0` tại https://on-thi-thpt.thiencogemini1.workers.dev — **210 đề / 7.649 câu**, `--scope=live` = **41/41**. Bản live và nội dung trên đĩa đã trùng nhau, không còn đợt nào chờ deploy.
- Cổng kiểm tra của đợt này: `check-exam --all` = `OK: 210 đề, 7649 câu, 6 cảnh báo` (6 WARN đều là đề Sử cũ, bình thường); `--scope=all` = **12 bộ / 848 kiểm tra xanh**; `--scope=deploy --build` xanh 12 bộ local, bộ `live` lúc đó trượt vì lỗi DNS tạm thời (`ERR_NAME_NOT_RESOLVED`) rồi chạy lại thành công sau deploy.
- Nội dung trên đĩa: **210 đề / 7.649 câu** — Địa lí 37, Tin học 41, Toán 28, Tiếng Anh 25, Hóa học 25, Lịch sử 20, KTPL 19, Ngữ văn 14, V-ACT 1. Đợt 9 đề Tin học mới đã commit ở `b273054` và lên live cùng ngày.
- Đề tốt nghiệp chính thức đã có: Văn, Anh, Sử, KTPL, Tin (2 mã), Toán (8 mã 2023–2026). Địa lí và Hóa **chưa** có bản 2025 chính thức.
- Batch gần nhất: **9 đề Tin học 12 theo bài còn lại** (Bài 1, 4, 7, 10, 14, 17, 23, 24, 28 — mỗi đề 28 câu / 45 phút / 10 điểm, tổng 252 câu), đã soát đáp án độc lập từng đề và đối chiếu SGK, commit `b273054`. Trước đó: **11 đề Tin học theo bài** (Bài 13, 15, 16, 18…22, 25, 26, 27) đã lên live, môn mới **Hóa học 11** (slug `hoa-hoc`, 25 đề 20 câu, suite `hoa` 30 kiểm tra) và **đề KTPL tốt nghiệp 2025 chính thức** mã 1007.

Cổng kiểm tra của đợt 9 đề mới (đo ngày 07/11): `node scripts/check-exam.mjs --all` = `OK: 210 đề, 7649 câu, 6 cảnh báo` (6 WARN vẫn là 5 đề Sử cũ + 1 MULTIPLE_CHOICE một đáp án ở đề Sử, không liên quan đợt này); `node scripts/verify.mjs --scope=tinhoc,static,features --build` = **3 bộ xanh, 193 kiểm tra** (tinhoc 54/54, static 45/45, features 94/94); `node scripts/verify.mjs --scope=all --no-build` = **"Tất cả 12 bộ test đều xanh.", tổng 848 kiểm tra, 220 giây**. Không phải sửa suite nào: `tinhoc` tự tính `TOTAL_DE`, tổng đề/câu đọc từ `content/exams/`. Sau đó đã commit, push và deploy thành công, `--scope=live` = 41/41.

## Tồn đọng tại mốc 07/11 (lịch sử)

Bắt buộc tại mốc 07/11: không còn việc gì. Đợt 9 đề Tin học đã commit `b273054` + `9913413`, push `origin/main` và deploy version `a4c240a8` ngày 07/11, `--scope=live` = 41/41. Bản live đã đủ 210 đề / 7.649 câu, trùng nội dung trên đĩa.

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
