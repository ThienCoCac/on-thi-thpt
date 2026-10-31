import Link from 'next/link';
import { DogMascot } from '@/components/brand/dog-mascot';

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t">
      <div className="container flex flex-col gap-4 py-8 text-sm text-muted-foreground">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <DogMascot className="h-10 w-10 shrink-0" />
            <p>© {year} Ôn Thi THPT. Nền tảng luyện thi THPT Quốc gia cho học sinh lớp 12.</p>
          </div>
          <nav aria-label="Liên kết chân trang" className="flex flex-wrap gap-4">
            <Link href="/de-thi" className="transition-colors hover:text-foreground">
              Đề thi
            </Link>
            <Link href="/luyen-tap" className="transition-colors hover:text-foreground">
              Luyện tập
            </Link>
            <Link href="/tien-do" className="transition-colors hover:text-foreground">
              Tiến độ
            </Link>
          </nav>
        </div>
        <p className="text-xs">Thời gian hiển thị theo múi giờ Asia/Ho_Chi_Minh (UTC+7).</p>
      </div>
    </footer>
  );
}
