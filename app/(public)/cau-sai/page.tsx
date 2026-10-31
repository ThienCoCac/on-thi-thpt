import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { MistakeBook } from '@/components/practice/mistake-book';

export const metadata: Metadata = {
  title: 'Sổ tay câu sai',
  description:
    'Tổng hợp những câu bạn từng làm sai, kèm lời giải và nút luyện lại cho tới khi nắm chắc.',
  robots: { index: false, follow: false },
};

export default function MistakeBookPage() {
  return (
    <div className="container max-w-4xl py-8 md:py-12">
      <Breadcrumbs
        items={[{ label: 'Trang chủ', href: '/' }, { label: 'Sổ tay câu sai' }]}
      />

      <header className="mt-5">
        <h1 className="text-3xl font-bold leading-tight tracking-tight md:text-4xl">
          Sổ tay câu sai
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
          Mọi câu bạn làm sai đều được ghi lại trên thiết bị này. Luyện lại đúng thì câu đó
          tự động được gỡ khỏi sổ.
        </p>
      </header>

      <div className="mt-8">
        <MistakeBook />
      </div>
    </div>
  );
}
