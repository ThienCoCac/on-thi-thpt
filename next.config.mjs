/** @type {import('next').NextConfig} */
const nextConfig = {
  // Xuất toàn bộ site thành HTML tĩnh trong out/ để deploy lên Netlify (không cần server).
  output: 'export',
  reactStrictMode: true,
  // Không công khai "X-Powered-By: Next.js".
  poweredByHeader: false,
  images: {
    // Site tĩnh không có Image Optimizer; ảnh bìa dùng thẻ <img> trỏ thẳng tới URL.
    unoptimized: true,
  },
};

export default nextConfig;
