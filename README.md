# Ôn Thi THPT

Website tĩnh luyện thi tốt nghiệp THPT cho học sinh lớp 12: đề thi theo cấu trúc thật, lời giải theo hướng tư duy, làm bài và chấm điểm ngay trên trình duyệt.

**Không có backend.** Toàn bộ đề thi và câu hỏi nằm trong thư mục `content/`. Site được build thành HTML tĩnh (`out/`) và deploy thẳng lên Cloudflare Workers — không cần database, không cần đăng nhập, không cần biến môi trường bí mật.

## Tính năng

- **Trang chủ**: đề nổi bật, đề mới cập nhật và số liệu nội dung.
- **Danh sách đề** (`/de-thi`): lọc theo môn, loại đề, năm và từ khóa; phân trang — tất cả xử lý ở trình duyệt.
- **Chi tiết đề**: cấu trúc từng phần thi, phân bố độ khó, chuyên đề.
- **Làm bài** (`/de-thi/[slug]/lam-bai`): đồng hồ đếm ngược chạy tại máy, tự nộp khi hết giờ, tự lưu bản nháp vào `localStorage`, nộp bài là chấm điểm ngay và hiện lời giải từng câu.
- **SEO**: canonical, Open Graph, Twitter Card, JSON-LD (WebSite, EducationalOrganization, BreadcrumbList, LearningResource), `sitemap.xml`, `robots.txt`, Web App Manifest.

Điểm và lịch sử làm bài **chỉ lưu trên thiết bị** của người học, không gửi đi đâu cả.

## Tech stack

- Next.js 14 (App Router) + TypeScript + TailwindCSS + shadcn/ui
- Static export (`output: 'export'`) → thư mục `out/`
- Nội dung JSON trong `content/`, validate bằng Zod lúc build
- KaTeX render công thức toán lúc build

## Yêu cầu

- Node.js 20 trở lên

## Cài đặt và chạy local

```bash
npm install
npm run dev      # http://localhost:3000
```

Build và xem trước bản tĩnh:

```bash
npm run build    # xuất ra out/
npm run start    # phục vụ out/ tại http://localhost:3000
```

## Chỉnh sửa nội dung

Không cần sửa code — chỉ sửa file JSON trong `content/` rồi build lại:

| File | Nội dung |
|---|---|
| `content/subjects.json` | Môn học và chuyên đề (kèm slug dùng để tham chiếu) |
| `content/exams/*.json` | Đề thi, câu hỏi, phương án, đáp án đúng, lời giải, độ khó, thẻ |

Quy ước nhanh:

- Câu hỏi tham chiếu chuyên đề qua `topic` (id trong `subjects.json`) và đề tham chiếu môn qua `subject` (slug môn).
- `correctAnswer` là chuỗi khóa (`"B"`), mảng khóa cho câu nhiều đáp án (`["A","C"]`), hoặc chuỗi cho câu điền khuyết.
- `explanation` và `content` viết Markdown; công thức toán đặt trong `$...$` hoặc `$$...$$`.
- `publishedAt`/`updatedAt` theo chuẩn ISO 8601; trang sắp xếp theo `publishedAt` giảm dần.
- Nếu tham chiếu sai (môn/chuyên đề/đề không tồn tại) hoặc thiếu trường bắt buộc, **build sẽ báo lỗi** kèm tên file và vị trí — không có chuyện nội dung lỗi lọt lên production.

Để thêm một đề mới: tạo file trong `content/exams/`; slug sẽ tự có trang chi tiết, trang làm bài, luyện tập và đề con sau khi build.

## Lệnh hữu ích

| Lệnh | Mô tả |
|---|---|
| `npm run dev` | Chạy dev server |
| `npm run build` | Build tĩnh ra `out/` |
| `npm run start` | Phục vụ `out/` ở local (giả lập Netlify) |
| `npm run typecheck` | Kiểm tra TypeScript |
| `npm run lint` | Kiểm tra ESLint |
| `npm run verify` | Typecheck + lint + build (nếu cũ) + bộ test trình duyệt cần cho file vừa sửa |
| `npm run verify:all` | Như trên nhưng chạy cả 9 bộ test (≈ 3 phút) |
| `npm run verify:deploy` | Chạy hết 9 bộ cộng kiểm tra bản đã lên Cloudflare |

`scripts/verify.mjs` nhận `--scope=ui|all|subjects|deploy|<tên bộ>`, `--files=...`, `--build`, `--no-build`,
`--stop-server`, `--list`, `--help`. Các bộ test puppeteer nằm ngoài repo, trong `C:\Users\trinh\.qoder\tmp\`;
quy ước kiểm tra chi tiết ghi ở `AGENTS.md`.

## Cấu trúc thư mục

```
├── app/
│   ├── (public)/               # Toàn bộ trang công khai
│   │   ├── layout.tsx          # Header + footer
│   │   ├── page.tsx            # Trang chủ
│   │   ├── de-thi/
│   │   │   ├── page.tsx        # Danh sách + bộ lọc (client)
│   │   │   └── [slug]/
│   │   │       ├── page.tsx    # Chi tiết đề
│   │   │       └── lam-bai/    # Làm bài + chấm điểm tại máy
│   │   ├── error.tsx
│   │   └── not-found.tsx
│   ├── layout.tsx              # Metadata gốc, font Be Vietnam Pro, CSS KaTeX
│   ├── not-found.tsx           # 404 toàn cục
│   ├── robots.ts               # robots.txt
│   ├── sitemap.ts              # sitemap.xml (sinh từ content/)
│   └── manifest.ts             # Web App Manifest
├── components/
│   ├── ui/                     # button, input, card, badge
│   ├── layout/                 # header, footer, skip link, breadcrumbs, 404
│   ├── seo/                    # JsonLd
│   └── exams/                  # thẻ đề, bộ lọc, runner làm bài
├── content/                    # Nguồn nội dung duy nhất (JSON)
├── lib/
│   ├── content.ts              # Đọc + validate nội dung, tạo view model
│   ├── content-types.ts        # Kiểu dùng chung server/client
│   ├── grading.ts              # Chấm điểm thuần (không phụ thuộc framework)
│   ├── markdown.ts             # Render Markdown an toàn + KaTeX
│   ├── labels.ts               # Nhãn tiếng Việt cho loại đề, độ khó...
│   ├── seo.ts                  # SITE_URL, Open Graph/Twitter, JSON-LD
│   ├── format.ts               # Định dạng ngày, thời lượng, điểm, số
│   └── utils.ts                # cn()
├── scripts/
│   ├── serve-out.mjs           # Máy chủ tĩnh xem trước out/
│   └── gen-brand-images.ps1    # Sinh lại ảnh thương hiệu
├── public/
│   ├── logo.png                # Logo hiển thị trên header/footer
│   └── og-default.png          # Ảnh chia sẻ mặc định 1200×630
├── docs/deploy-netlify.md      # Hướng dẫn deploy
├── netlify.toml                # Build, publish out/, header bảo mật & cache
└── next.config.mjs
```

## Deploy Netlify

Cấu hình đã nằm sẵn trong `netlify.toml` (`publish = "out"`). Xem hướng dẫn chi tiết tại **[docs/deploy-netlify.md](docs/deploy-netlify.md)**.

Tóm tắt:

1. Push repository lên GitHub.
2. Netlify → **Add new site → Import an existing project** → chọn repo.
3. (Tuỳ chọn) thêm biến `NEXT_PUBLIC_SITE_URL` với domain thật để canonical/OG/sitemap đúng.
4. Deploy — Netlify tự chạy `npm run build` và phục vụ thư mục `out/`.

## Ghi chú kỹ thuật

- **Trang tĩnh hoàn toàn**: mọi route có `generateStaticParams` + `dynamicParams = false`; slug lạ rơi về `404.html`.
- **Bộ lọc chạy ở client** (môn, loại đề, năm, từ khóa, chuyên mục) để không cần server hay query string.
- **Làm bài tại máy**: đồng hồ đếm ngược là `setInterval` 500ms, bản nháp lưu `localStorage` khóa `onthithpt:draft:<slug>` (khôi phục khi mở lại trang, xóa khi bắt đầu/nộp). Nộp bài gọi `gradeExam()` trong `lib/grading.ts`; không có request mạng nào.
- **Đáp án và lời giải** nằm trong bundle client của trang làm bài (vì chấm tại máy), chỉ hiện trong giao diện sau khi nộp. Đây là lựa chọn có chủ đích khi bỏ backend.
- **Markdown an toàn**: HTML thô bị escape trước khi dựng thẻ; video chỉ nhúng qua `youtube-nocookie.com`; KaTeX render với `trust: false`.
- **Không có secrets** trong repo hay bundle: không database, không token, không khóa phiên.

## Giới hạn đã biết

- Không có tài khoản, không lưu lịch sử làm bài giữa các thiết bị.
- Không có trang quản trị: nội dung thay đổi bằng cách sửa `content/` rồi deploy lại.
- Đồng hồ chạy phía client nên người dùng có thể chỉnh sửa mã nguồn trình duyệt; với đề luyện tập tự do điều này chấp nhận được.
