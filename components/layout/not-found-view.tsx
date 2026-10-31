import Link from 'next/link';
import { DogMascot } from '@/components/brand/dog-mascot';
import { Button } from '@/components/ui/button';

export function NotFoundView() {
  return (
    <div className="container flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <DogMascot
        className="h-32 w-32"
        title="Linh vật Ôn Thi THPT đang lạc đường"
      />
      <p className="mt-5 inline-flex items-center rounded-full bg-secondary px-3 py-1 text-xs font-semibold tracking-widest text-primary">
        LỖI 404
      </p>
      <h1 className="mt-3 text-2xl font-bold tracking-tight">Không tìm thấy trang</h1>
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
