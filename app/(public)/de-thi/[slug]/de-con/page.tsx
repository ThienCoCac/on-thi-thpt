import { Suspense } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MiniExamSession } from '@/components/exams/mini-exam-session';
import { getRunnerExam, listExams } from '@/lib/content';

export const dynamicParams = false;

export const metadata: Metadata = {
  title: 'Đề con',
  robots: { index: false, follow: false },
};

interface MiniExamPageProps {
  params: { slug: string };
}

export function generateStaticParams(): { slug: string }[] {
  return listExams().map((exam) => ({ slug: exam.slug }));
}

export default function MiniExamPage({ params }: MiniExamPageProps) {
  const exam = getRunnerExam(params.slug);

  if (!exam) {
    notFound();
  }

  return (
    <Suspense
      fallback={
        <div className="container max-w-2xl py-10 text-sm text-muted-foreground md:py-14">
          Đang bốc câu ngẫu nhiên từ đề…
        </div>
      }
    >
      <MiniExamSession
        examSlug={exam.slug}
        examTitle={exam.title}
        subjectSlug={exam.subjectSlug}
        subjectName={exam.subjectName}
        durationMinutes={exam.durationMinutes}
      />
    </Suspense>
  );
}
