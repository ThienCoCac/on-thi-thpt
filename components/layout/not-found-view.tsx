import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function NotFoundView() {
  return (
    <div className="container flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <p className="text-5xl font-bold text-primary">404</p>
      <h1 className="mt-4 text-2xl font-bold tracking-tight">Không tìm thấy trang</h1>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
        Đường dẫn bạn mở không tồn tại hoặc nội dung đã được gỡ. Hãy kiểm tra lại hoặc quay về
        danh sách đề thi.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link href="/de-thi">Xem đề thi</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Về trang chủ</Link>
        </Button>
      </div>
    </div>
  );
}
