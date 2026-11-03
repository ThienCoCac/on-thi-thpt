'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { ExamRunner } from '@/components/exams/exam-runner';
import { ExamPractice } from '@/components/practice/exam-practice';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { RunnerExam } from '@/lib/content-types';
import { useExamData } from '@/lib/use-static-data';

// Trang làm bài và luyện tập chỉ nhúng khung giao diện, còn câu hỏi tải từ file JSON của đề.
// Nhờ vậy HTML mỗi trang nhẹ hơn hàng chục lần và một đề mới không làm nặng thêm trang khác.
function ExamBoundary({
  slug,
  render,
}: {
  slug: string;
  render: (exam: RunnerExam) => ReactNode;
}) {
  const { exam, error } = useExamData(slug);

  if (error) {
    return (
      <div className="container py-10 md:py-14">
        <Card>
          <CardContent className="flex flex-col items-start gap-4 p-6">
            <p className="flex items-center gap-2 text-sm font-medium text-destructive">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              {error}
            </p>
            <p className="text-sm text-muted-foreground">
              Nội dung đề nằm trong file tải khi mở trang. Kiểm tra kết nối rồi thử lại.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={() => window.location.reload()}>
                Thử lại
              </Button>
              <Button asChild variant="outline">
                <Link href={`/de-thi/${slug}`}>Về trang đề</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="container flex items-center justify-center gap-3 py-16 text-sm text-muted-foreground md:py-24">
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
        Đang tải nội dung đề…
      </div>
    );
  }

  return <>{render(exam)}</>;
}

export function ExamTakeSession({ slug }: { slug: string }) {
  return <ExamBoundary slug={slug} render={(exam) => <ExamRunner exam={exam} />} />;
}

export function ExamPracticeSession({ slug }: { slug: string }) {
  return <ExamBoundary slug={slug} render={(exam) => <ExamPractice exam={exam} />} />;
}
