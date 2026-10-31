import Link from 'next/link';
import { CalendarDays, Clock, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { formatDate, formatDuration } from '@/lib/format';
import { EXAM_TYPE_LABELS } from '@/lib/labels';
import type { ExamSummary } from '@/lib/content-types';

export function ExamCard({ exam }: { exam: ExamSummary }) {
  return (
    <Card className="flex h-full flex-col transition-shadow hover:shadow-md">
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="secondary">{exam.subject.name}</Badge>
          <Badge variant="outline">{EXAM_TYPE_LABELS[exam.type]}</Badge>
          {exam.isFree ? <Badge variant="success">Miễn phí</Badge> : null}
          {exam.isFeatured ? <Badge variant="accent">Nổi bật</Badge> : null}
        </div>
        <CardTitle className="text-lg leading-snug">
          <Link href={`/de-thi/${exam.slug}`} className="transition-colors hover:text-primary">
            {exam.title}
          </Link>
        </CardTitle>
        {exam.description ? (
          <CardDescription className="line-clamp-2">{exam.description}</CardDescription>
        ) : null}
      </CardHeader>

      <CardContent className="mt-auto">
        <dl className="grid grid-cols-3 gap-2 border-t pt-4 text-sm">
          <div>
            <dt className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              Thời gian
            </dt>
            <dd className="mt-1 font-medium">{formatDuration(exam.durationMinutes)}</dd>
          </div>
          <div>
            <dt className="flex items-center gap-1 text-xs text-muted-foreground">
              <FileText className="h-3.5 w-3.5" aria-hidden="true" />
              Số câu
            </dt>
            <dd className="mt-1 font-medium">{exam.questionCount} câu</dd>
          </div>
          <div>
            <dt className="flex items-center gap-1 text-xs text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
              Năm
            </dt>
            <dd className="mt-1 font-medium">{exam.examYear ?? '—'}</dd>
          </div>
        </dl>

        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">
            Cập nhật {formatDate(exam.updatedAt)}
          </span>
          <Button asChild size="sm" variant="outline">
            <Link href={`/de-thi/${exam.slug}`}>Xem chi tiết</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
