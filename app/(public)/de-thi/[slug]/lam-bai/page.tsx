import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ExamRunner } from '@/components/exams/exam-runner';
import { getRunnerExam, listExams } from '@/lib/content';

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
  const exam = getRunnerExam(params.slug);

  if (!exam) {
    notFound();
  }

  return <ExamRunner exam={exam} />;
}
