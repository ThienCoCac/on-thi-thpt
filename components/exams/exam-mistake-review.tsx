'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, NotebookPen, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { loadMistakes } from '@/lib/progress';
import { cn } from '@/lib/utils';

const COUNT_OPTIONS = [10, 20, 50];

interface ExamMistakeReviewProps {
  examSlug: string;
  examTitle: string;
}

// Thẻ sổ tay ngay trong trang chi tiết đề: chỉ đếm và ôn các câu sai thuộc đề này.
export function ExamMistakeReview({ examSlug, examTitle }: ExamMistakeReviewProps) {
  const [ready, setReady] = useState(false);
  const [total, setTotal] = useState(0);
  const [count, setCount] = useState<number | 'all'>(10);

  useEffect(() => {
    const related = loadMistakes().filter(
      (entry) => entry.examSlug === examSlug || entry.sourceTitle === examTitle,
    );
    setTotal(related.length);
    setReady(true);
  }, [examSlug, examTitle]);

  const effective = count === 'all' ? total : Math.min(count, total);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <NotebookPen className="h-4 w-4 text-primary" aria-hidden="true" />
          Sổ tay câu sai
        </CardTitle>
        <CardDescription>
          Ôn lại những câu bạn từng làm sai trong đề này, chọn số câu tùy ý.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2 text-sm">
          <span className="text-muted-foreground">Câu sai của đề</span>
          <span className="font-semibold tabular-nums">
            {ready ? total : <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          </span>
        </div>

        {ready && total === 0 ? (
          <p className="text-xs leading-relaxed text-muted-foreground">
            Chưa có câu sai nào được ghi cho đề này. Làm đề hoặc luyện tập để sổ tay tự ghi
            lại những câu cần ôn.
          </p>
        ) : null}

        {ready && total > 0 ? (
          <>
            <div className="flex flex-wrap items-center gap-2">
              {COUNT_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  disabled={option > total}
                  onClick={() => setCount(option)}
                  aria-pressed={count === option && option <= total}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                    count === option && option <= total
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border text-muted-foreground hover:bg-secondary',
                    option > total && 'cursor-not-allowed opacity-40',
                  )}
                >
                  {option} câu
                </button>
              ))}
              <button
                type="button"
                onClick={() => setCount('all')}
                aria-pressed={count === 'all' || count > total}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                  count === 'all' || count > total
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border text-muted-foreground hover:bg-secondary',
                )}
              >
                Tất cả ({total})
              </button>
            </div>
            <Button asChild size="lg" variant="outline" className="w-full">
              <Link href={`/de-thi/${examSlug}/on-cau-sai?count=${effective}`}>
                <Play aria-hidden="true" />
                Ôn {effective} câu sai
              </Link>
            </Button>
          </>
        ) : null}

        <Link
          href="/cau-sai"
          className="block text-center text-xs text-primary hover:underline"
        >
          Mở toàn bộ sổ tay
        </Link>
      </CardContent>
    </Card>
  );
}
