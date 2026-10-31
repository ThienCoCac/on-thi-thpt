'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AlertTriangle, Loader2, RotateCcw, Shuffle } from 'lucide-react';
import { ExamRunner } from '@/components/exams/exam-runner';
import { PracticeRunner } from '@/components/practice/practice-runner';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { BankQuestion, RunnerExam, RunnerQuestion } from '@/lib/content-types';
import { pickFreshQuestions } from '@/lib/practice-picker';
import { loadSeenCounts, markQuestionsSeen, recordPracticeResult } from '@/lib/progress';

interface MiniExamSessionProps {
  examSlug: string;
  examTitle: string;
  subjectSlug: string;
  subjectName: string;
  durationMinutes: number;
}

function roundScore(value: number): number {
  return Math.round(value * 100) / 100;
}

export function MiniExamSession({
  examSlug,
  examTitle,
  subjectSlug,
  subjectName,
  durationMinutes,
}: MiniExamSessionProps) {
  const searchParams = useSearchParams();
  const requested = Number.parseInt(searchParams.get('count') ?? '', 10);
  const timed = searchParams.get('mode') === 'exam';

  const [status, setStatus] = useState<'loading' | 'ready' | 'empty' | 'error'>('loading');
  const [questions, setQuestions] = useState<RunnerQuestion[]>([]);
  const [poolSize, setPoolSize] = useState(0);
  const bankRef = useRef<Map<string, BankQuestion>>(new Map());

  useEffect(() => {
    let cancelled = false;

    setStatus('loading');

    fetch('/data/question-bank.json')
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.json() as Promise<BankQuestion[]>;
      })
      .then((bank) => {
        if (cancelled) {
          return;
        }

        const map = new Map(bank.map((question) => [question.id, question]));
        bankRef.current = map;

        const pool = bank.filter((question) => question.examSlug === examSlug);
        setPoolSize(pool.length);

        if (pool.length === 0) {
          setStatus('empty');
          return;
        }

        const limit = Number.isFinite(requested) && requested > 0 ? requested : 10;
        const picked = pickFreshQuestions(pool, limit, loadSeenCounts());

        if (picked.length === 0) {
          setStatus('empty');
          return;
        }

        markQuestionsSeen(picked.map((question) => question.id));
        setQuestions(picked);
        setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) {
          setStatus('error');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [examSlug, requested]);

  if (status === 'ready') {
    const title = `Đề con · ${examTitle}`;

    if (timed) {
      const minutes = poolSize > 0
        ? Math.max(5, Math.round((durationMinutes * questions.length) / poolSize))
        : Math.max(5, Math.round(durationMinutes * 0.2));
      const miniExam: RunnerExam = {
        id: `${examSlug}--de-con`,
        title,
        slug: examSlug,
        subjectName,
        subjectSlug,
        durationMinutes: minutes,
        totalScore: roundScore(questions.reduce((sum, question) => sum + question.score, 0)),
        questions,
      };

      return <ExamRunner exam={miniExam} persistDraft={false} />;
    }

    return (
      <PracticeRunner
        title={title}
        subtitle={subjectName}
        questions={questions}
        backHref={`/de-thi/${examSlug}`}
        onFinish={(outcome) =>
          recordPracticeResult({
            kind: 'practice',
            title,
            examSlug,
            subjectSlug,
            subjectName,
            outcome,
            metaFor: (id) => {
              const question = bankRef.current.get(id);
              return {
                id,
                subjectSlug: question?.subjectSlug ?? subjectSlug,
                subjectName: question?.subjectName ?? subjectName,
                sourceTitle: question?.examTitle ?? examTitle,
                examSlug: question?.examSlug ?? examSlug,
              };
            },
          })
        }
      />
    );
  }

  return (
    <div className="container max-w-2xl py-10 md:py-14">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            {status === 'error' ? (
              <AlertTriangle className="h-5 w-5 text-destructive" aria-hidden="true" />
            ) : status === 'empty' ? (
              <Shuffle className="h-5 w-5 text-primary" aria-hidden="true" />
            ) : (
              <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden="true" />
            )}
            Đề con · {examTitle}
          </CardTitle>
          <CardDescription>
            {status === 'loading'
              ? 'Đang bốc câu ngẫu nhiên từ đề…'
              : status === 'empty'
                ? 'Chưa có câu hỏi nào trong ngân hàng cho đề này. Hãy chọn đề khác hoặc quay lại chi tiết đề.'
                : 'Không tải được ngân hàng câu hỏi. Kiểm tra kết nối rồi thử lại.'}
          </CardDescription>
        </CardHeader>
        {status !== 'loading' ? (
          <CardContent className="flex flex-wrap gap-3">
            {status === 'error' ? (
              <Button type="button" onClick={() => window.location.reload()}>
                <RotateCcw aria-hidden="true" />
                Thử lại
              </Button>
            ) : null}
            <Button asChild variant={status === 'error' ? 'outline' : 'default'}>
              <Link href={`/de-thi/${examSlug}`}>Quay lại đề</Link>
            </Button>
          </CardContent>
        ) : null}
      </Card>
    </div>
  );
}
