'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Clock,
  Flag,
  Lightbulb,
  NotebookPen,
  RotateCcw,
  Target,
  Trophy,
  XCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type {
  AnswerValue,
  GradeResult,
  GradedQuestion,
  RunnerExam,
  RunnerQuestion,
} from '@/lib/content-types';
import { formatScore, formatTimeSpent } from '@/lib/format';
import {
  describeAnswer,
  describeCorrectAnswer,
  getCorrectOptionKeys,
  isAnswerEmpty,
} from '@/lib/grading';
import { DIFFICULTY_LABELS } from '@/lib/labels';
import { cn } from '@/lib/utils';

type ResultTab = 'wrong' | 'correct' | 'neutral';

interface ExamResultProps {
  exam: RunnerExam;
  result: GradeResult;
  autoSubmitted: boolean;
  onRestart: () => void;
  onPracticeWrong: (questions: RunnerQuestion[]) => void;
}

function chosenKeys(question: RunnerQuestion, value: AnswerValue): string[] {
  if (Array.isArray(value)) {
    return value.map((key) => key.toUpperCase());
  }
  if (typeof value === 'string' && question.options.length > 0) {
    return [value.toUpperCase()];
  }
  return [];
}

function statusLabel(item: GradedQuestion): string {
  if (item.isCorrect === true) {
    return 'Đúng';
  }
  if (item.isCorrect === false) {
    return isAnswerEmpty(item.selectedAnswer) ? 'Chưa trả lời' : 'Sai';
  }
  return 'Chưa chấm';
}

function ReviewCard({
  item,
  variant,
}: {
  item: GradedQuestion;
  variant: ResultTab;
}) {
  const { question } = item;
  const correctKeys = getCorrectOptionKeys(question.correctAnswer);
  const selected = chosenKeys(question, item.selectedAnswer);

  return (
    <details
      open={variant !== 'correct'}
      className={cn(
        'group rounded-xl border bg-card shadow-sm',
        variant === 'wrong'
          ? 'border-destructive/30'
          : variant === 'correct'
            ? 'border-emerald-200'
            : 'border-border',
      )}
    >
      <summary className="flex cursor-pointer list-none items-start gap-3 p-4 [&::-webkit-details-marker]:hidden">
        <span
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-semibold',
            variant === 'correct'
              ? 'bg-emerald-100 text-emerald-800'
              : variant === 'wrong'
                ? 'bg-destructive/10 text-destructive'
                : 'bg-muted text-muted-foreground',
          )}
          aria-hidden="true"
        >
          {question.order}
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Badge
              variant={
                variant === 'correct' ? 'success' : variant === 'wrong' ? 'accent' : 'secondary'
              }
            >
              {statusLabel(item)}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {question.partName} · {DIFFICULTY_LABELS[question.difficulty]}
            </span>
            {question.topicName ? (
              <span className="text-xs text-muted-foreground">· {question.topicName}</span>
            ) : null}
            {item.isFlagged ? (
              <Flag
                className="h-3.5 w-3.5 text-amber-500"
                aria-label="Đã đánh dấu khi làm bài"
              />
            ) : null}
          </span>

          {variant === 'wrong' ? (
            <span className="mt-1.5 grid gap-0.5 text-xs">
              <span className="line-clamp-1 text-destructive">
                Bạn chọn: {describeAnswer(question.type, item.selectedAnswer, question.options)}
              </span>
              <span className="line-clamp-1 text-emerald-700">
                Đáp án: {describeCorrectAnswer(question.type, question.correctAnswer, question.options)}
              </span>
            </span>
          ) : (
            <span className="mt-1.5 block line-clamp-1 text-xs text-muted-foreground">
              Đáp án: {describeCorrectAnswer(question.type, question.correctAnswer, question.options)}
            </span>
          )}
        </span>

        <ChevronDown
          className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>

      <div className="space-y-4 border-t px-4 py-5">
        <div
          className="article-content text-sm"
          dangerouslySetInnerHTML={{ __html: question.contentHtml }}
        />

        {question.options.length > 0 ? (
          <ul className="space-y-2">
            {question.options.map((option) => {
              const isCorrectOption = correctKeys.includes(option.key);
              const isChosen = selected.includes(option.key);

              return (
                <li
                  key={option.key}
                  className={cn(
                    'flex items-start gap-3 rounded-lg border p-3 text-sm',
                    isCorrectOption
                      ? 'border-emerald-300 bg-emerald-50'
                      : isChosen
                        ? 'border-destructive/40 bg-destructive/5'
                        : 'bg-card',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-7 w-7 shrink-0 items-center justify-center rounded-md border text-xs font-bold',
                      isCorrectOption
                        ? 'border-emerald-500 bg-emerald-500 text-white'
                        : isChosen
                          ? 'border-destructive bg-destructive text-white'
                          : 'bg-background text-muted-foreground',
                    )}
                    aria-hidden="true"
                  >
                    {option.key}
                  </span>
                  <span className="min-w-0 flex-1 leading-relaxed">{option.text}</span>
                  <span className="flex shrink-0 flex-col items-end gap-1 text-xs">
                    {isCorrectOption ? (
                      <span className="flex items-center gap-1 text-emerald-700">
                        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                        Đáp án đúng
                      </span>
                    ) : null}
                    {isChosen && !isCorrectOption ? (
                      <span className="flex items-center gap-1 text-destructive">
                        <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
                        Bạn chọn
                      </span>
                    ) : null}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <dl className="grid gap-2 rounded-lg border bg-muted/30 p-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-muted-foreground">Bạn trả lời</dt>
              <dd className="mt-0.5 font-medium">
                {describeAnswer(question.type, item.selectedAnswer, question.options)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Đáp án đúng</dt>
              <dd className="mt-0.5 font-medium text-emerald-700">
                {describeCorrectAnswer(question.type, question.correctAnswer, question.options)}
              </dd>
            </div>
          </dl>
        )}

        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-primary">
            <Lightbulb className="h-4 w-4" aria-hidden="true" />
            Lời giải theo hướng tư duy
          </p>
          <div
            className="article-content mt-2 text-sm"
            dangerouslySetInnerHTML={{ __html: question.explanationHtml }}
          />
        </div>
      </div>
    </details>
  );
}

export function ExamResult({
  exam,
  result,
  autoSubmitted,
  onRestart,
  onPracticeWrong,
}: ExamResultProps) {
  const [tab, setTab] = useState<ResultTab>('wrong');

  const groups = useMemo(() => {
    const wrong: GradedQuestion[] = [];
    const correct: GradedQuestion[] = [];
    const neutral: GradedQuestion[] = [];

    for (const item of result.gradedQuestions) {
      if (item.isCorrect === true) {
        correct.push(item);
      } else if (item.isCorrect === false) {
        wrong.push(item);
      } else {
        neutral.push(item);
      }
    }

    return { wrong, correct, neutral };
  }, [result.gradedQuestions]);

  const tabs: { key: ResultTab; label: string; count: number }[] = [
    { key: 'wrong', label: 'Câu làm sai', count: groups.wrong.length },
    { key: 'correct', label: 'Câu làm đúng', count: groups.correct.length },
    ...(groups.neutral.length > 0
      ? [{ key: 'neutral' as ResultTab, label: 'Chưa chấm', count: groups.neutral.length }]
      : []),
  ];
  const active = groups[tab];

  return (
    <div className="container py-8 md:py-12">
      <Card className="overflow-hidden">
        <div className="h-1.5 w-full bg-primary" aria-hidden="true" />
        <CardContent className="p-6 md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={autoSubmitted ? 'outline' : 'success'}>
                  {autoSubmitted ? 'Hết giờ' : 'Đã nộp'}
                </Badge>
                <Badge variant="outline">{exam.subjectName}</Badge>
              </div>
              <h1 className="mt-3 text-2xl font-bold leading-tight tracking-tight md:text-3xl">
                {exam.title}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Kết quả được chấm ngay trên thiết bị và đã lưu vào tiến độ học tập.
              </p>
            </div>

            <div className="text-left sm:text-right">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Điểm của bạn
              </p>
              <p className="mt-1 text-4xl font-bold leading-none text-primary md:text-5xl">
                {formatScore(result.score)}
                <span className="text-xl font-semibold text-muted-foreground md:text-2xl">
                  /{formatScore(result.maxScore)}
                </span>
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Đúng {result.correctCount}/{result.questionCount} câu
              </p>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Độ chính xác {result.accuracy}%</span>
              <span>{groups.wrong.length} câu chưa đúng</span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  'h-full',
                  result.accuracy >= 50 ? 'bg-emerald-500' : 'bg-accent',
                )}
                style={{ width: `${result.accuracy}%` }}
              />
            </div>
          </div>

          <dl className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border bg-muted/30 p-4">
              <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                Thời gian làm bài
              </dt>
              <dd className="mt-1 text-base font-semibold">
                {formatTimeSpent(result.timeSpentSeconds)}
              </dd>
            </div>
            <div className="rounded-xl border bg-muted/30 p-4">
              <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Target className="h-3.5 w-3.5" aria-hidden="true" />
                Số câu đúng
              </dt>
              <dd className="mt-1 text-base font-semibold">
                {result.correctCount}/{result.questionCount}
              </dd>
            </div>
            <div className="rounded-xl border bg-muted/30 p-4">
              <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                Độ chính xác
              </dt>
              <dd className="mt-1 text-base font-semibold">{result.accuracy}%</dd>
            </div>
          </dl>

          {autoSubmitted ? (
            <p className="mt-4 flex gap-2 rounded-lg border border-accent/30 bg-accent/5 px-3 py-2 text-xs leading-relaxed text-foreground">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
              Hết giờ làm bài, hệ thống tự nộp với các đáp án bạn đã chọn.
            </p>
          ) : null}

          {result.unansweredCount > 0 ? (
            <p className="mt-3 text-xs text-muted-foreground">
              Còn {result.unansweredCount} câu chưa được trả lời.
            </p>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-3">
            {groups.wrong.length > 0 ? (
              <Button
                type="button"
                onClick={() => onPracticeWrong(groups.wrong.map((item) => item.question))}
              >
                <RotateCcw aria-hidden="true" />
                Luyện lại {groups.wrong.length} câu sai
              </Button>
            ) : null}
            <Button type="button" variant="outline" onClick={onRestart}>
              <RotateCcw aria-hidden="true" />
              Làm lại đề này
            </Button>
            <Button asChild variant="ghost">
              <Link href={`/de-thi/${exam.slug}`}>
                <ArrowLeft aria-hidden="true" />
                Xem lại đề
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section aria-labelledby="answer-review-title">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="answer-review-title" className="text-lg font-semibold">
                Xem lại đáp án và lời giải
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Câu sai được tách riêng và mở sẵn để bạn sửa lỗi tư duy trước.
              </p>
            </div>
          </div>

          <div
            role="tablist"
            aria-label="Nhóm câu hỏi sau khi nộp"
            className="mt-4 flex flex-wrap gap-2"
          >
            {tabs.map((item) => {
              const selected = tab === item.key;

              return (
                <button
                  key={item.key}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  aria-controls={`review-panel-${item.key}`}
                  onClick={() => setTab(item.key)}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
                    selected
                      ? item.key === 'wrong'
                        ? 'border-destructive/40 bg-destructive/10 text-destructive'
                        : item.key === 'correct'
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                          : 'border-primary/30 bg-primary/5 text-primary'
                      : 'border-border text-muted-foreground hover:bg-secondary',
                  )}
                >
                  {item.key === 'wrong' ? (
                    <XCircle className="h-4 w-4" aria-hidden="true" />
                  ) : item.key === 'correct' ? (
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  ) : null}
                  {item.label}
                  <span className="rounded-full bg-background/70 px-1.5 text-xs tabular-nums">
                    {item.count}
                  </span>
                </button>
              );
            })}
          </div>

          <div
            id={`review-panel-${tab}`}
            role="tabpanel"
            className="mt-4"
            aria-live="polite"
          >
            {active.length === 0 ? (
              tab === 'wrong' ? (
                <Card className="border-emerald-200 bg-emerald-50/60">
                  <CardContent className="flex items-start gap-3 p-5">
                    <Trophy className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
                    <div>
                      <p className="font-semibold text-emerald-900">
                        Tuyệt vời, không có câu sai!
                      </p>
                      <p className="mt-1 text-sm text-emerald-800">
                        Bạn có thể xem lại các câu đúng ở tab bên cạnh hoặc thử đề khó hơn.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <p className="rounded-xl border bg-card p-5 text-sm text-muted-foreground">
                  Không có câu nào trong nhóm này.
                </p>
              )
            ) : tab === 'correct' ? (
              <div className="grid items-start gap-3 sm:grid-cols-2">
                {active.map((item) => (
                  <ReviewCard key={item.question.id} item={item} variant="correct" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {active.map((item) => (
                  <ReviewCard key={item.question.id} item={item} variant={tab} />
                ))}
              </div>
            )}
          </div>
        </section>

        <aside className="space-y-4 lg:sticky lg:top-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Kết quả theo độ khó</CardTitle>
              <CardDescription>Số câu đúng trên tổng số câu ở mỗi mức độ.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {result.difficulties
                  .filter((item) => item.total > 0)
                  .map((item) => (
                    <li key={item.key}>
                      <div className="flex items-center justify-between text-sm">
                        <span>{DIFFICULTY_LABELS[item.key]}</span>
                        <span className="text-muted-foreground">
                          {item.correct}/{item.total} câu
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${(item.correct / item.total) * 100}%` }}
                        />
                      </div>
                    </li>
                  ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Bước tiếp theo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                Luyện lại các câu sai ngay để nhớ lâu hơn, hoặc mở sổ tay câu sai để ôn lại
                tất cả lỗi từ trước tới nay.
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/cau-sai">
                  <NotebookPen aria-hidden="true" />
                  Sổ tay câu sai
                </Link>
              </Button>
              <Button asChild variant="ghost" className="w-full">
                <Link href="/tien-do">Xem tiến độ học tập</Link>
              </Button>
              <Button asChild variant="ghost" className="w-full">
                <Link href="/de-thi">Chọn đề khác</Link>
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
