'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Lỗi hiển thị trang công khai:', error);
  }, [error]);

  return (
    <div className="container flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <p className="text-sm font-medium uppercase tracking-wide text-accent">Sự cố tạm thời</p>
      <h1 className="mt-3 text-2xl font-bold tracking-tight">Không thể hiển thị trang</h1>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
        Trình duyệt gặp lỗi khi tải nội dung. Vui lòng thử lại — bản nháp bài đang làm vẫn được
        giữ trên thiết bị của bạn.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button onClick={() => reset()}>Thử lại</Button>
        <Button asChild variant="outline">
          <Link href="/">Về trang chủ</Link>
        </Button>
      </div>
    </div>
  );
}
