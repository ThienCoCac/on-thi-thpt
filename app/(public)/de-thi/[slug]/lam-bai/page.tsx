import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ExamTakeSession } from '@/components/data/exam-loader';
import { hasExam, listExams } from '@/lib/content';

export const dynamicParams = false;

export const metadata: Metadata = {
  title: 'Làm bài',
  robots: { index: false, follow: false },
};

interface TakeExamPageProps {
  params: { slug: string };
}

export function generateStaticParams(): { slug: string }[] {
  return listExams().map((exam) => ({ slug: exam.slug }));
}

export default function TakeExamPage({ params }: TakeExamPageProps) {
  if (!hasExam(params.slug)) {
    notFound();
  }

  return <ExamTakeSession slug={params.slug} />;
}
