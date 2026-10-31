import { Suspense } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ExamMistakeSession } from '@/components/exams/exam-mistake-session';
import { getRunnerExam, listExams } from '@/lib/content';

export const dynamicParams = false;

export const metadata: Metadata = {
  title: 'Ôn câu sai',
  robots: { index: false, follow: false },
};

interface ExamMistakePageProps {
  params: { slug: string };
}

export function generateStaticParams(): { slug: string }[] {
  return listExams().map((exam) => ({ slug: exam.slug }));
}

export default function ExamMistakePage({ params }: ExamMistakePageProps) {
  const exam = getRunnerExam(params.slug);

  if (!exam) {
    notFound();
  }

  return (
    <Suspense
      fallback={
        <div className="container max-w-2xl py-10 text-sm text-muted-foreground md:py-14">
          Đang chuẩn bị phiên ôn câu sai…
        </div>
      }
    >
      <ExamMistakeSession
        examSlug={exam.slug}
        examTitle={exam.title}
        subjectSlug={exam.subjectSlug}
        subjectName={exam.subjectName}
      />
    </Suspense>
  );
}
