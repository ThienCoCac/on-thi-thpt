import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { PracticeStudio } from '@/components/practice/practice-studio';
import { getPracticeCatalog } from '@/lib/content';

export const metadata: Metadata = {
  title: 'Luyện tập theo chuyên đề',
  description:
    'Tự tạo phiên luyện tập từ ngân hàng câu hỏi: chọn môn, chọn chuyên đề và số câu, hiện đáp án và lời giải ngay sau mỗi câu.',
  alternates: { canonical: '/luyen-tap' },
  openGraph: {
    title: 'Luyện tập theo chuyên đề | Ôn Thi THPT',
    description:
      'Chọn môn, chuyên đề và số câu để tạo phiên luyện tập ngẫu nhiên, chấm ngay từng câu.',
    type: 'website',
  },
};

export default function PracticePage() {
  const catalog = getPracticeCatalog();

  return (
    <div className="container py-8 md:py-12">
      <Breadcrumbs
        items={[{ label: 'Trang chủ', href: '/' }, { label: 'Luyện tập' }]}
      />

      <header className="mt-5 max-w-3xl">
        <h1 className="text-3xl font-bold leading-tight tracking-tight md:text-4xl">
          Luyện tập theo chuyên đề
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
          Không giới hạn thời gian: chọn nội dung, làm từng câu và xem đáp án ngay lập tức.
          Câu làm sai được ghi vào sổ tay để bạn ôn lại sau.
        </p>
      </header>

      <div className="mt-8">
        <PracticeStudio catalog={catalog} />
      </div>
    </div>
  );
}
