import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ExamPracticeSession } from '@/components/data/exam-loader';
import { hasExam, listExams } from '@/lib/content';

export const dynamicParams = false;

export const metadata: Metadata = {
  title: 'Luyện tập',
  robots: { index: false, follow: false },
};

interface PracticeExamPageProps {
  params: { slug: string };
}

export function generateStaticParams(): { slug: string }[] {
  return listExams().map((exam) => ({ slug: exam.slug }));
}

export default function PracticeExamPage({ params }: PracticeExamPageProps) {
  if (!hasExam(params.slug)) {
    notFound();
  }

  return <ExamPracticeSession slug={params.slug} />;
}
