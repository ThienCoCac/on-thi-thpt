'use client';

import { PracticeRunner } from '@/components/practice/practice-runner';
import type { RunnerExam } from '@/lib/content-types';
import { recordPracticeResult } from '@/lib/progress';

export function ExamPractice({ exam }: { exam: RunnerExam }) {
  return (
    <PracticeRunner
      title={`Luyện tập · ${exam.title}`}
      subtitle={exam.subjectName}
      questions={exam.questions}
      backHref={`/de-thi/${exam.slug}`}
      onFinish={(outcome) =>
        recordPracticeResult({
          kind: 'practice',
          title: `Luyện tập · ${exam.title}`,
          examSlug: exam.slug,
          subjectSlug: exam.subjectSlug,
          subjectName: exam.subjectName,
          outcome,
          metaFor: (id) => ({
            id,
            subjectSlug: exam.subjectSlug,
            subjectName: exam.subjectName,
            sourceTitle: exam.title,
          }),
        })
      }
    />
  );
}
