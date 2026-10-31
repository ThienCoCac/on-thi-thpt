import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  AlertTriangle,
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  Clock,
  FileText,
  ListChecks,
  Play,
  Target,
  Timer,
  Users,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { ExamMistakeReview } from '@/components/exams/exam-mistake-review';
import { ExamMiniExam } from '@/components/exams/exam-mini-exam';
import { JsonLd } from '@/components/seo/json-ld';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { getExamBySlug, listExams } from '@/lib/content';
import { formatDuration, formatNumber, formatScore } from '@/lib/format';
import {
  DIFFICULTY_BAR_CLASSES,
  DIFFICULTY_DOT_CLASSES,
  DIFFICULTY_LABELS,
  EXAM_TYPE_LABELS,
} from '@/lib/labels';
import { breadcrumbJsonLd, buildOpenGraph, buildTwitter, examJsonLd } from '@/lib/seo';
import { cn } from '@/lib/utils';

export const dynamicParams = false;

interface ExamDetailPageProps {
  params: { slug: string };
}

export function generateStaticParams(): { slug: string }[] {
  return listExams().map((exam) => ({ slug: exam.slug }));
}

export function generateMetadata({ params }: ExamDetailPageProps): Metadata {
  const exam = getExamBySlug(params.slug);

  if (!exam) {
    return { title: 'Không tìm thấy đề thi' };
  }

  const description =
    exam.description ??
    `${exam.subject.name} · ${exam.questionCount} câu · ${formatDuration(exam.durationMinutes)}`;
  const path = `/de-thi/${exam.slug}`;

  return {
    title: exam.title,
    description,
    alternates: { canonical: path },
    openGraph: buildOpenGraph({ title: exam.title, description, path }),
    twitter: buildTwitter(exam.title, description),
  };
}

export default function ExamDetailPage({ params }: ExamDetailPageProps) {
  const exam = getExamBySlug(params.slug);

  if (!exam) {
    notFound();
  }

  const difficultyTotal = exam.difficulties.reduce((sum, item) => sum + item.count, 0);
  const canStart = exam.questionCount > 0;

  const metaItems = [
    {
      icon: Clock,
      label: 'Thời gian làm bài',
      value: formatDuration(exam.durationMinutes),
    },
    {
      icon: ListChecks,
      label: 'Số câu hỏi',
      value: `${formatNumber(exam.questionCount)} câu`,
    },
    {
      icon: Target,
      label: 'Thang điểm',
      value: formatScore(exam.totalScore),
    },
    {
      icon: Users,
      label: 'Cấu trúc',
      value: `${exam.parts.length} phần`,
    },
  ];

  return (
    <div className="container py-8 md:py-12">
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: 'Trang chủ', path: '/' },
            { name: 'Đề thi', path: '/de-thi' },
            { name: exam.title, path: `/de-thi/${exam.slug}` },
          ]),
          examJsonLd({
            title: exam.title,
            description:
              exam.description ??
              `${exam.subject.name} · ${exam.questionCount} câu · ${formatDuration(exam.durationMinutes)}`,
            path: `/de-thi/${exam.slug}`,
            durationMinutes: exam.durationMinutes,
            updatedAt: exam.updatedAt,
          }),
        ]}
      />
      <Breadcrumbs
        items={[
          { label: 'Trang chủ', href: '/' },
          { label: 'Đề thi', href: '/de-thi' },
          { label: exam.title },
        ]}
      />

      <header className="mt-5">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="secondary">{exam.subject.name}</Badge>
          <Badge variant="outline">{EXAM_TYPE_LABELS[exam.type]}</Badge>
          {exam.isFree ? <Badge variant="success">Miễn phí</Badge> : null}
          {exam.examYear ? (
            <Badge variant="outline">
              <CalendarDays className="h-3 w-3" aria-hidden="true" />
              Năm {exam.examYear}
            </Badge>
          ) : null}
          {exam.examCode ? <Badge variant="outline">Mã đề {exam.examCode}</Badge> : null}
        </div>

        <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight md:text-4xl">
          {exam.title}
        </h1>
        {exam.description ? (
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground md:text-base">
            {exam.description}
          </p>
        ) : null}

        <dl className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {metaItems.map((item) => (
            <div key={item.label} className="rounded-2xl border bg-card p-4">
              <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <item.icon className="h-3.5 w-3.5" aria-hidden="true" />
                {item.label}
              </dt>
              <dd className="mt-1.5 text-lg font-semibold">{item.value}</dd>
            </div>
          ))}
        </dl>
      </header>

      <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cấu trúc đề thi</CardTitle>
              <CardDescription>
                Các phần thi và điểm số tương ứng, tính theo câu hỏi hiện có trong đề.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {exam.parts.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                        <th scope="col" className="pb-2 pr-4 font-medium">
                          Phần thi
                        </th>
                        <th scope="col" className="pb-2 pr-4 font-medium">
                          Số câu
                        </th>
                        <th scope="col" className="pb-2 text-right font-medium">
                          Điểm
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {exam.parts.map((part) => (
                        <tr key={part.name}>
                          <td className="py-3 pr-4 font-medium">{part.name}</td>
                          <td className="py-3 pr-4 text-muted-foreground">
                            {part.questionCount} câu
                          </td>
                          <td className="py-3 text-right">{formatScore(part.score)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Thông tin cấu trúc đang được cập nhật.
                </p>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Phân bố độ khó</CardTitle>
                <CardDescription>Mức độ của từng câu hỏi trong đề.</CardDescription>
              </CardHeader>
              <CardContent>
                {difficultyTotal > 0 ? (
                  <>
                    <div
                      className="flex h-2.5 overflow-hidden rounded-full bg-muted"
                      role="img"
                      aria-label="Biểu đồ phân bố độ khó của đề"
                    >
                      {exam.difficulties.map((item) =>
                        item.count > 0 ? (
                          <div
                            key={item.key}
                            className={cn('h-full', DIFFICULTY_BAR_CLASSES[item.key])}
                            style={{ width: `${(item.count / difficultyTotal) * 100}%` }}
                          />
                        ) : null,
                      )}
                    </div>
                    <ul className="mt-4 space-y-2 text-sm">
                      {exam.difficulties.map((item) => (
                        <li key={item.key} className="flex items-center justify-between gap-3">
                          <span className="flex items-center gap-2">
                            <span
                              className={cn(
                                'inline-block h-2.5 w-2.5 rounded-full',
                                DIFFICULTY_DOT_CLASSES[item.key],
                              )}
                              aria-hidden="true"
                            />
                            {DIFFICULTY_LABELS[item.key]}
                          </span>
                          <span className="text-muted-foreground">{item.count} câu</span>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Đề chưa có câu hỏi nên chưa có phân bố độ khó.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Chuyên đề trong đề</CardTitle>
                <CardDescription>
                  Kiến thức trọng tâm được kiểm tra trong đề này.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {exam.topics.length > 0 ? (
                  <ul className="flex flex-wrap gap-2">
                    {exam.topics.map((topic) => (
                      <li key={topic.slug}>
                        <Badge variant="outline" className="font-normal">
                          {topic.name}
                          <span className="text-muted-foreground">· {topic.count} câu</span>
                        </Badge>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Chưa gắn chuyên đề cho các câu hỏi trong đề.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20">
          <Card>
            <CardHeader>
              <CardDescription>Thời gian làm bài</CardDescription>
              <CardTitle className="text-3xl">{formatDuration(exam.durationMinutes)}</CardTitle>
              <CardDescription>
                {formatNumber(exam.questionCount)} câu · {formatScore(exam.totalScore)} điểm
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <Timer className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  <span>Đồng hồ đếm ngược bắt đầu khi bạn bấm bắt đầu làm bài.</span>
                </li>
                <li className="flex gap-2">
                  <AlertTriangle
                    className="mt-0.5 h-4 w-4 shrink-0 text-accent"
                    aria-hidden="true"
                  />
                  <span>Hết giờ, bài được tự động nộp với các đáp án đã chọn.</span>
                </li>
                <li className="flex gap-2">
                  <FileText
                    className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  <span>
                    Điểm số, đáp án đúng và lời giải chi tiết hiện ngay sau khi nộp bài.
                  </span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle2
                    className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  <span>Không cần đăng nhập, bài làm được chấm ngay trên thiết bị.</span>
                </li>
                <li className="flex gap-2">
                  <BookOpenCheck
                    className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  <span>
                    Có chế độ luyện tập hiện đáp án và lời giải ngay sau từng câu.
                  </span>
                </li>
              </ul>

              {canStart ? (
                <div className="space-y-2">
                  <Button asChild size="lg" className="w-full">
                    <Link href={`/de-thi/${exam.slug}/lam-bai`}>
                      <Play aria-hidden="true" />
                      Bắt đầu làm bài
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="w-full">
                    <Link href={`/de-thi/${exam.slug}/luyen-tap`}>
                      <BookOpenCheck aria-hidden="true" />
                      Luyện tập, hiện đáp án ngay
                    </Link>
                  </Button>
                </div>
              ) : (
                <Button size="lg" className="w-full" disabled>
                  Đề chưa có câu hỏi
                </Button>
              )}
            </CardContent>
            <CardFooter className="text-xs leading-relaxed text-muted-foreground">
              Kết quả, đáp án đúng và lời giải theo hướng tư duy sẽ có ngay sau khi nộp bài.
            </CardFooter>
          </Card>

          <ExamMiniExam
            examSlug={exam.slug}
            examTitle={exam.title}
            questionCount={exam.questionCount}
          />

          <ExamMistakeReview examSlug={exam.slug} examTitle={exam.title} />
        </aside>
      </div>
    </div>
  );
}
