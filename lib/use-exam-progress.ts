'use client';

import { useEffect, useState } from 'react';
import { loadHistory } from '@/lib/progress';

export interface ExamProgress {
  percent: number;
  answered: number;
  completed: boolean;
  bestScore: number | null;
  bestMaxScore: number | null;
}

function isAnswered(value: unknown): boolean {
  if (typeof value === 'string') {
    return value.trim() !== '';
  }

  if (Array.isArray(value)) {
    return value.some((item) => typeof item === 'string' && item.trim() !== '');
  }

  return false;
}

// Đọc tiến độ từ localStorage sau khi trang đã tải để không lệch hydration.
export function useExamProgress(
  slug: string,
  questionCount: number,
): ExamProgress | null {
  const [progress, setProgress] = useState<ExamProgress | null>(null);

  useEffect(() => {
    const attempts = loadHistory().filter(
      (attempt) => attempt.kind === 'exam' && attempt.examSlug === slug,
    );

    if (attempts.length > 0) {
      const best = attempts.reduce((current, attempt) => {
        const currentRatio = current.maxScore > 0 ? current.score / current.maxScore : 0;
        const attemptRatio = attempt.maxScore > 0 ? attempt.score / attempt.maxScore : 0;
        return attemptRatio > currentRatio ? attempt : current;
      });

      setProgress({
        percent: 100,
        answered: questionCount,
        completed: true,
        bestScore: best.score,
        bestMaxScore: best.maxScore,
      });
      return;
    }

    try {
      const raw = window.localStorage.getItem(`onthithpt:draft:${slug}`);
      if (!raw) {
        setProgress(null);
        return;
      }

      const draft = JSON.parse(raw) as { deadline?: number; answers?: Record<string, unknown> };
      if (typeof draft.deadline !== 'number' || draft.deadline <= Date.now()) {
        setProgress(null);
        return;
      }

      const answered = Object.values(draft.answers ?? {}).filter(isAnswered).length;
      if (answered === 0 || questionCount === 0) {
        setProgress(null);
        return;
      }

      setProgress({
        percent: Math.min(100, Math.round((answered / questionCount) * 100)),
        answered,
        completed: false,
        bestScore: null,
        bestMaxScore: null,
      });
    } catch {
      setProgress(null);
    }
  }, [slug, questionCount]);

  return progress;
}
