'use client';

import Link from 'next/link';
import { ArrowRight, CalendarDays, Clock, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { formatDate, formatNumber, formatScore } from '@/lib/format';
import {
  DIFFICULTY_DOT_CLASSES,
  DIFFICULTY_LABELS,
  DIFFICULTY_ORDER,
  EXAM_TYPE_LABELS,
} from '@/lib/labels';
import { subjectTheme } from '@/lib/subject-theme';
import type { ExamSummary } from '@/lib/content-types';
import { useExamProgress } from '@/lib/use-exam-progress';

export function ExamCard({ exam }: { exam: ExamSummary }) {
  const theme = subjectTheme(exam.subject.slug);
  const progress = useExamProgress(exam.slug, exam.questionCount);
  const difficultyLevel = DIFFICULTY_ORDER.indexOf(exam.difficulty) + 1;

  return (
    <Card
      className={`group relative flex h-full flex-col overflow-hidden transition duration-200 hover:-translate-y-1 hover:shadow-lift ${theme.hoverBorder}`}
    >
      <span className={`absolute inset-x-0 top-0 h-1 ${theme.bar}`} aria-hidden="true" />

      <CardHeader className="gap-3 pt-5">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge className={theme.chip}>{exam.subject.name}</Badge>
          <Badge variant="outline">{EXAM_TYPE_LABELS[exam.type]}</Badge>
          {exam.isFree ? <Badge variant="success">Miễn phí</Badge> : null}
          {exam.isFeatured ? <Badge variant="accent">Nổi bật</Badge> : null}
        </div>

        <CardTitle className="text-lg leading-snug">
          <Link
            href={`/de-thi/${exam.slug}`}
            className="transition-colors group-hover:text-primary"
          >
            {exam.title}
          </Link>
        </CardTitle>

        {exam.description ? (
          <CardDescription className="line-clamp-2">{exam.description}</CardDescription>
        ) : null}

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="inline-flex items-center gap-1.5 rounded-full border bg-secondary/60 px-2.5 py-1 text-xs font-medium">
            <FileText className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
            {formatNumber(exam.questionCount)} câu
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border bg-secondary/60 px-2.5 py-1 text-xs font-medium">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
            {exam.durationMinutes} phút
          </span>
          {exam.examYear ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border bg-secondary/60 px-2.5 py-1 text-xs font-medium">
              <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
              {exam.examYear}
            </span>
          ) : null}
          <span
            className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium"
            title={`Độ khó tổng hợp: ${DIFFICULTY_LABELS[exam.difficulty]}`}
          >
            <span className="flex items-center gap-0.5" aria-hidden="true">
              {[1, 2, 3, 4].map((dot) => (
                <span
                  key={dot}
                  className={`h-1.5 w-1.5 rounded-full ${
                    dot <= difficultyLevel ? DIFFICULTY_DOT_CLASSES[exam.difficulty] : 'bg-border'
                  }`}
                />
              ))}
            </span>
            {DIFFICULTY_LABELS[exam.difficulty]}
          </span>
        </div>
      </CardHeader>

      <CardContent className="mt-auto">
        {progress ? (
          <div className="mb-4 space-y-1.5">
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="font-semibold text-primary">Đã làm {progress.percent}%</span>
              <span className="text-muted-foreground">
                {progress.completed && progress.bestScore !== null
                  ? `Điểm tốt nhất ${formatScore(progress.bestScore)}/${formatScore(progress.bestMaxScore)}`
                  : `${formatNumber(progress.answered)}/${formatNumber(exam.questionCount)} câu`}
              </span>
            </div>
            <div
              className="h-1.5 overflow-hidden rounded-full bg-secondary"
              role="progressbar"
              aria-label={`Đã làm ${progress.percent}% đề ${exam.title}`}
              aria-valuenow={progress.percent}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <span
                className={`block h-full rounded-full ${theme.bar}`}
                style={{ width: `${progress.percent}%` }}
              />
            </div>
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-3 border-t pt-4">
          <span className="text-xs text-muted-foreground">
            Cập nhật {formatDate(exam.updatedAt)}
          </span>
          <Button asChild size="sm" variant="outline">
            <Link href={`/de-thi/${exam.slug}`}>
              Xem chi tiết
              <ArrowRight
                className="transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
