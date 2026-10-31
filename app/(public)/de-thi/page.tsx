import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { ExamBrowser } from '@/components/exams/exam-browser';
import { listExamYears, listExams, listSubjects } from '@/lib/content';
import { buildOpenGraph, buildTwitter } from '@/lib/seo';

const listDescription =
  'Danh sách đề thi thử tốt nghiệp THPT theo môn, loại đề và năm. Lọc nhanh đề full, đề chuyên đề và mini test để luyện tập theo mục tiêu.';

export const metadata: Metadata = {
  title: 'Danh sách đề thi',
  description: listDescription,
  alternates: { canonical: '/de-thi' },
  openGraph: buildOpenGraph({
    title: 'Danh sách đề thi',
    description: listDescription,
    path: '/de-thi',
  }),
  twitter: buildTwitter('Danh sách đề thi', listDescription),
};

export default function ExamListPage() {
  return (
    <div className="container py-10 md:py-14">
      <Breadcrumbs items={[{ label: 'Trang chủ', href: '/' }, { label: 'Đề thi' }]} />

      <div className="mt-4">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Đề thi thử THPT</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
          Toàn bộ đề hiện có, kèm thời gian và số câu thực tế. Chọn đề theo môn học, loại đề
          hoặc năm để bắt đầu luyện tập — làm bài và chấm điểm ngay trên trình duyệt.
        </p>
      </div>

      <ExamBrowser exams={listExams()} subjects={listSubjects()} years={listExamYears()} />
    </div>
  );
}
