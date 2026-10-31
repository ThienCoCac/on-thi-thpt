# Hướng dẫn deploy Ôn Thi THPT lên Netlify

Site là **HTML tĩnh** (Next.js `output: 'export'`) nên deploy rất đơn giản: Netlify build bằng `npm run build`, phục vụ thư mục `out/`. Không cần database, không cần server, không cần biến bí mật.

> **Điều kiện tiên quyết**
>
> - Node.js **20** trở lên (`node -v`).
> - Tài khoản GitHub và Netlify (gói Free là đủ).
> - Repo chạy được ở local (`npm run build`).

---

## 1. Kiểm tra local

```bash
npm install
npm run typecheck
npm run lint
npm run build      # xuất ra out/
npm run start      # xem thử tại http://localhost:3000
```

Nếu `out/` được tạo và site chạy đúng ở local thì deploy sẽ chạy.

---

## 2. Đẩy mã nguồn lên GitHub

```bash
git init
git add .
git commit -m "chore: initial commit"
git branch -M main
git remote add origin https://github.com/<tài-khoản>/<repo>.git
git push -u origin main
```

Kiểm tra `.gitignore` đã có `.env`, `.next`, `out`, `node_modules`. Không commit file `.env`.

---

## 3. Tạo site trên Netlify

### Cách A — Dashboard (khuyến nghị lần đầu)

1. Đăng nhập Netlify → **Add new site → Import an existing project**.
2. Chọn **GitHub**, cấp quyền và chọn repo.
3. Netlify tự đọc `netlify.toml`, xác nhận:
   - **Build command**: `npm run build`
   - **Publish directory**: `out`
   - **Node version**: `20`
4. Bấm **Deploy site**.

### Cách B — CLI

```bash
npm install -g netlify-cli
netlify login
netlify link                 # chọn "Use current git remote" hoặc site có sẵn
netlify deploy --build --prod
```

Kiểm tra nhanh trước khi deploy production:

```bash
netlify build                # chạy đúng cấu hình Netlify
netlify deploy               # tạo draft URL
netlify deploy --prod        # đẩy lên domain chính
```

---

## 4. Biến môi trường (tuỳ chọn)

Site không bắt buộc biến môi trường nào. Chỉ có một biến nên đặt để SEO đúng domain:

| Biến | Bắt buộc | Ghi chú |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | ➖ | Domain thật, ví dụ `https://onthithpt.netlify.app`. Dùng cho canonical, Open Graph, `sitemap.xml`, `robots.txt`. Bỏ trống sẽ mặc định `https://onthithpt.vn`. |

Lưu ý:

- `NEXT_PUBLIC_*` được nhúng vào HTML **lúc build**, nên sau khi đổi giá trị phải **deploy lại**, không chỉ restart.
- Giá trị phải có `https://` và không có dấu `/` ở cuối.

---

## 5. Trỏ domain riêng (tuỳ chọn)

1. Netlify: **Domain management → Add a domain** → nhập domain (ví dụ `onthithpt.vn`) → làm theo hướng dẫn DNS.
2. Bật **HTTPS** (Netlify tự cấp Let's Encrypt sau khi DNS trỏ đúng).
3. Cập nhật `NEXT_PUBLIC_SITE_URL=https://onthithpt.vn` → **Trigger deploy**.
4. Chọn một domain làm chính và để domain còn lại redirect 301 về domain chính.

---

## 6. Checklist sau deploy

| # | Kiểm tra | Kỳ vọng |
|---|---|---|
| 1 | `GET /` | Trang chủ hiển thị đề nổi bật, bài mới, số liệu nội dung |
| 2 | `GET /de-thi` | Lọc theo môn/loại/năm/từ khóa và phân trang hoạt động |
| 3 | Chi tiết đề → **Bắt đầu làm bài** | Đồng hồ chạy, chọn đáp án, nộp bài ra điểm và lời giải |
| 4 | Tải lại trang giữa bài | Bản nháp được khôi phục từ `localStorage` |
| 5 | `GET /luyen-tap`, `GET /tien-do` | Luyện theo chuyên đề hiện đáp án ngay, sổ tay câu sai và tiến độ hoạt động |
| 6 | `GET /robots.txt` | Có `Sitemap: https://<domain>/sitemap.xml`, chặn `/de-thi/*/lam-bai` |
| 7 | `GET /sitemap.xml` | Liệt kê trang chủ, các trang danh sách và slug đề/bài |
| 8 | `GET /manifest.webmanifest` | Trả JSON manifest, icon `/icon.png` + `/apple-icon.png` |
| 9 | `GET /khong-ton-tai` | Trả `404.html` với giao diện đầy đủ |
| 10 | Xem source trang chủ | Có `og:*`, `twitter:card`, JSON-LD `WebSite` + `EducationalOrganization` |
| 11 | Response header | Có `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, không có `X-Powered-By` |

Mẹo: `curl -I https://<domain>/` để xem header; [PageSpeed Insights](https://pagespeed.web.dev) để kiểm tra Core Web Vitals.

---

## 7. Xử lý sự cố

| Triệu chứng | Nguyên nhân | Cách khắc phục |
|---|---|---|
| Build fail: `Nội dung content/... không hợp lệ` | File JSON sai cấu trúc hoặc tham chiếu môn/chuyên đề/đề không tồn tại | Đọc thông báo lỗi (có tên file + đường dẫn trường), sửa JSON rồi build lại |
| Build fail: `Page ... cannot use ...` | Vô tình thêm route động dùng `searchParams`/`headers` | Static export không hỗ trợ; chuyển dữ liệu sang client component hoặc `generateStaticParams` |
| Mở `/de-thi/<slug>` trả 404 | Chưa thêm đề vào `lib/content.ts` | Thêm import + đăng ký trong `examContents` rồi build lại |
| Canonical/OG trỏ `localhost` | Thiếu `NEXT_PUBLIC_SITE_URL` lúc build | Thêm biến trên Netlify rồi **Trigger deploy** |
| CSS/JS 404 sau khi deploy | Publish directory sai | Đảm bảo **Publish directory = `out`** trong `netlify.toml`/Site settings |
| Trang con trả 404 khi mở trực tiếp | Pretty URL bị tắt | Netlify bật **Pretty URLs** mặc định; bật lại trong **Site configuration → Build & deploy → Post processing** |

Log chi tiết: **Netlify → Deploys → chọn deploy → Deploy log**.

---

## 8. Ghi chú vận hành

- **Header bảo mật** khai báo trong `netlify.toml`: HSTS, `X-Content-Type-Options`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy`. Không bật CSP vì Next.js chèn inline script cho hydration.
- **Cache**: `/_next/static/*` là asset có hash nên cache `immutable` 1 năm; `sitemap.xml`/`robots.txt` 1 giờ; ảnh trong `/public` 1 tuần.
- **Cập nhật nội dung**: sửa `content/` → commit → Netlify tự build và deploy. Không có trang quản trị.
- **Không có dữ liệu người dùng trên server**: điểm và bản nháp làm bài chỉ nằm trong `localStorage` của trình duyệt; xóa dữ liệu trình duyệt là mất.
- **Sao lưu**: mã nguồn + `content/` nằm trên GitHub là bản sao lưu đầy đủ của site.

---

## 9. Quy trình release đề xuất

```bash
npm run typecheck     # 1. TypeScript
npm run lint          # 2. ESLint
npm run build         # 3. Build tĩnh ở local
git push origin main  # 4. Netlify tự deploy
```

Sau khi deploy xong, chạy lại checklist mục 6 trên domain production.
