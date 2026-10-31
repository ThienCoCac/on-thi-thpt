'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AlertTriangle, Loader2, NotebookPen, Play, RotateCcw } from 'lucide-react';
import { PracticeRunner } from '@/components/practice/practice-runner';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { BankQuestion, RunnerQuestion } from '@/lib/content-types';
import { pickFreshQuestions } from '@/lib/practice-picker';
import {
  loadMistakes,
  loadSeenCounts,
  markQuestionsSeen,
  recordPracticeResult,
} from '@/lib/progress';

interface ExamMistakeSessionProps {
  examSlug: string;
  examTitle: string;
  subjectSlug: string;
  subjectName: string;
}

export function ExamMistakeSession({
  examSlug,
  examTitle,
  subjectSlug,
  subjectName,
}: ExamMistakeSessionProps) {
  const searchParams = useSearchParams();
  const requested = Number.parseInt(searchParams.get('count') ?? '', 10);
  const [status, setStatus] = useState<'loading' | 'ready' | 'empty' | 'error'>('loading');
  const [questions, setQuestions] = useState<RunnerQuestion[]>([]);
  const bankRef = useRef<Map<string, BankQuestion>>(new Map());

  useEffect(() => {
    let cancelled = false;

    const related = loadMistakes().filter(
      (entry) => entry.examSlug === examSlug || entry.sourceTitle === examTitle,
    );

    if (related.length === 0) {
      setStatus('empty');
      return () => {
        cancelled = true;
      };
    }

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

        const pool = related
          .map((entry) => map.get(entry.id))
          .filter((question): question is BankQuestion => Boolean(question));
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
  }, [examSlug, examTitle, requested]);

  if (status === 'ready') {
    const title = `Ôn câu sai · ${examTitle}`;

    return (
      <PracticeRunner
        title={title}
        subtitle={subjectName}
        questions={questions}
        backHref={`/de-thi/${examSlug}`}
        onFinish={(outcome) =>
          recordPracticeResult({
            kind: 'mistake',
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
              <NotebookPen className="h-5 w-5 text-primary" aria-hidden="true" />
            ) : (
              <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden="true" />
            )}
            Ôn câu sai · {examTitle}
          </CardTitle>
          <CardDescription>
            {status === 'loading'
              ? 'Đang chuẩn bị phiên ôn câu sai…'
              : status === 'empty'
                ? 'Sổ tay chưa có câu sai nào của đề này. Làm đề hoặc luyện tập để hệ thống ghi nhận câu cần ôn.'
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
            ) : (
              <Button asChild>
                <Link href={`/de-thi/${examSlug}/lam-bai`}>
                  <Play aria-hidden="true" />
                  Làm đề này
                </Link>
              </Button>
            )}
            <Button asChild variant="outline">
              <Link href="/cau-sai">Mở sổ tay câu sai</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href={`/de-thi/${examSlug}`}>Quay lại đề</Link>
            </Button>
          </CardContent>
        ) : null}
      </Card>
    </div>
  );
}
