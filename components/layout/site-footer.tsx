import Link from 'next/link';

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t">
      <div className="container flex flex-col gap-4 py-8 text-sm text-muted-foreground">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p>© {year} Ôn Thi THPT. Nền tảng luyện thi THPT Quốc gia cho học sinh lớp 12.</p>
          <nav aria-label="Liên kết chân trang" className="flex flex-wrap gap-4">
            <Link href="/de-thi" className="transition-colors hover:text-foreground">
              Đề thi
            </Link>
            <Link href="/phuong-phap" className="transition-colors hover:text-foreground">
              Phương pháp
            </Link>
            <Link href="/bai-viet" className="transition-colors hover:text-foreground">
              Bài viết
            </Link>
          </nav>
        </div>
        <p className="text-xs">Thời gian hiển thị theo múi giờ Asia/Ho_Chi_Minh (UTC+7).</p>
      </div>
    </footer>
  );
}
