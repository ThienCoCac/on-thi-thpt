'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Play, Shuffle, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

const COUNT_OPTIONS = [10, 20, 30];

interface ExamMiniExamProps {
  examSlug: string;
  examTitle: string;
  questionCount: number;
}

// Đề con: chọn ngẫu nhiên câu trong đề để làm ngay, không cần làm sai trước.
export function ExamMiniExam({ examSlug, examTitle, questionCount }: ExamMiniExamProps) {
  const [count, setCount] = useState<number | 'all'>(questionCount >= 10 ? 10 : 'all');

  if (questionCount === 0) {
    return null;
  }

  const effective = count === 'all' ? questionCount : Math.min(count, questionCount);
  const base = `/de-thi/${examSlug}/de-con?count=${effective}`;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Shuffle className="h-4 w-4 text-primary" aria-hidden="true" />
          Đề con
        </CardTitle>
        <CardDescription>
          Bốc ngẫu nhiên câu trong đề “{examTitle}” để làm ngay, ưu tiên câu bạn chưa làm.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Số câu mỗi lượt</p>
          <div className="flex flex-wrap items-center gap-2">
            {COUNT_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                disabled={option > questionCount}
                onClick={() => setCount(option)}
                aria-pressed={count === option && option <= questionCount}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                  count === option && option <= questionCount
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border text-muted-foreground hover:bg-secondary',
                  option > questionCount && 'cursor-not-allowed opacity-40',
                )}
              >
                {option} câu
              </button>
            ))}
            <button
              type="button"
              onClick={() => setCount('all')}
              aria-pressed={count === 'all' || count > questionCount}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                count === 'all' || count > questionCount
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border text-muted-foreground hover:bg-secondary',
              )}
            >
              Tất cả ({questionCount})
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Button asChild size="lg" className="w-full">
            <Link href={`${base}&mode=practice`}>
              <Play aria-hidden="true" />
              Làm ngay {effective} câu
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="w-full">
            <Link href={`${base}&mode=exam`}>
              <Timer aria-hidden="true" />
              Làm như đề thi {effective} câu
            </Link>
          </Button>
        </div>

        <p className="text-[11px] leading-relaxed text-muted-foreground">
          “Làm ngay” hiện đáp án sau từng câu. “Làm như đề thi” chạy đồng hồ và chấm điểm khi
          nộp bài.
        </p>
      </CardContent>
    </Card>
  );
}
