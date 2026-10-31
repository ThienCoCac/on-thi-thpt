import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ExamPractice } from '@/components/practice/exam-practice';
import { getRunnerExam, listExams } from '@/lib/content';

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
  const exam = getRunnerExam(params.slug);

  if (!exam) {
    notFound();
  }

  return <ExamPractice exam={exam} />;
}
