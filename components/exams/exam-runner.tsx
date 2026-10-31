'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Flag,
  Lightbulb,
  ListChecks,
  Play,
  RotateCcw,
  Send,
  Target,
  Timer,
  X,
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
import { Input } from '@/components/ui/input';
import type {
  AnswerValue,
  GradeResult,
  RunnerExam,
  RunnerQuestion,
} from '@/lib/content-types';
import { formatDuration, formatScore, formatTimeSpent } from '@/lib/format';
import {
  describeAnswer,
  describeCorrectAnswer,
  getCorrectOptionKeys,
  isAnswerCorrect,
  isAnswerEmpty,
} from '@/lib/grading';
import { DIFFICULTY_LABELS, DIFFICULTY_ORDER } from '@/lib/labels';
import { cn } from '@/lib/utils';

type Phase = 'intro' | 'doing' | 'result';

interface QuestionGroup {
  name: string;
  items: { index: number; question: RunnerQuestion }[];
}

interface Draft {
  answers: Record<string, AnswerValue>;
  flags: string[];
  deadline: number;
  startedAt: number;
}

const MULTIPLE_CHOICE = 'MULTIPLE_CHOICE';
const FILL_IN = 'FILL_IN';
const ESSAY = 'ESSAY';

function formatClock(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const clock = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return hours > 0 ? `${hours}:${clock}` : clock;
}

function questionInstruction(type: RunnerQuestion['type']): string {
  if (type === MULTIPLE_CHOICE) {
    return 'Chọn tất cả đáp án đúng';
  }
  if (type === FILL_IN) {
    return 'Điền đáp án';
  }
  if (type === ESSAY) {
    return 'Trình bày lời giải';
  }
  return 'Chọn một đáp án đúng';
}

function roundScore(value: number): number {
  return Math.round(value * 100) / 100;
}

function gradeExam(
  exam: RunnerExam,
  answers: Record<string, AnswerValue>,
  flags: Set<string>,
  startedAt: number | null,
): GradeResult {
  const gradedQuestions = exam.questions.map((question) => {
    const selectedAnswer = answers[question.id] ?? null;
    const isCorrect = isAnswerCorrect(question.type, question.correctAnswer, selectedAnswer);

    return {
      question,
      selectedAnswer,
      isFlagged: flags.has(question.id),
      isCorrect,
      scoreEarned: isCorrect === true ? question.score : 0,
    };
  });

  const maxScore = roundScore(
    gradedQuestions.reduce((sum, item) => sum + item.question.score, 0),
  );
  const score = roundScore(gradedQuestions.reduce((sum, item) => sum + item.scoreEarned, 0));
  const correctCount = gradedQuestions.filter((item) => item.isCorrect === true).length;
  const unansweredCount = gradedQuestions.filter((item) =>
    isAnswerEmpty(item.selectedAnswer),
  ).length;
  const durationSeconds = Math.max(1, exam.durationMinutes) * 60;
  const timeSpentSeconds = startedAt
    ? Math.min(durationSeconds, Math.max(0, Math.round((Date.now() - startedAt) / 1000)))
    : 0;

  return {
    score,
    maxScore,
    correctCount,
    questionCount: gradedQuestions.length,
    unansweredCount,
    accuracy: maxScore > 0 ? Math.round((score / maxScore) * 100) : 0,
    timeSpentSeconds,
    gradedQuestions,
    difficulties: DIFFICULTY_ORDER.map((key) => {
      const items = gradedQuestions.filter((item) => item.question.difficulty === key);
      return {
        key,
        total: items.length,
        correct: items.filter((item) => item.isCorrect === true).length,
      };
    }),
  };
}

function readDraft(key: string, questionIds: Set<string>): Draft | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<Draft>;
    if (
      typeof parsed.deadline !== 'number' ||
      typeof parsed.startedAt !== 'number' ||
      parsed.deadline <= Date.now()
    ) {
      return null;
    }

    const answers: Record<string, AnswerValue> = {};
    for (const [id, value] of Object.entries(parsed.answers ?? {})) {
      if (!questionIds.has(id)) {
        continue;
      }
      if (
        value === null ||
        typeof value === 'string' ||
        (Array.isArray(value) && value.every((item) => typeof item === 'string'))
      ) {
        answers[id] = value as AnswerValue;
      }
    }

    const flags = Array.isArray(parsed.flags)
      ? parsed.flags.filter((id): id is string => typeof id === 'string' && questionIds.has(id))
      : [];

    return { answers, flags, deadline: parsed.deadline, startedAt: parsed.startedAt };
  } catch {
    return null;
  }
}

interface QuestionNavigatorProps {
  groups: QuestionGroup[];
  currentIndex: number;
  answers: Record<string, AnswerValue>;
  flags: Set<string>;
  onSelect: (index: number) => void;
}

function QuestionNavigator({
  groups,
  currentIndex,
  answers,
  flags,
  onSelect,
}: QuestionNavigatorProps) {
  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <div key={group.name}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {group.name}
          </p>
          <div className="flex flex-wrap gap-2">
            {group.items.map(({ index, question }) => {
              const answered = !isAnswerEmpty(answers[question.id] ?? null);
              const flagged = flags.has(question.id);
              const active = index === currentIndex;

              return (
                <button
                  key={question.id}
                  type="button"
                  onClick={() => onSelect(index)}
                  aria-current={active ? 'step' : undefined}
                  aria-label={`Câu ${index + 1}${answered ? ', đã trả lời' : ', chưa trả lời'}${
                    flagged ? ', đã đánh dấu' : ''
                  }`}
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    flagged
                      ? 'border-amber-500 bg-amber-400 text-amber-950'
                      : answered
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-muted text-muted-foreground hover:bg-secondary',
                    active && 'ring-2 ring-purple-500 ring-offset-2',
                  )}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <ul className="flex flex-wrap gap-x-4 gap-y-1.5 border-t pt-3 text-xs text-muted-foreground">
        <li className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded border bg-muted" aria-hidden="true" />
          Chưa trả lời
        </li>
        <li className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded border border-primary bg-primary" aria-hidden="true" />
          Đã trả lời
        </li>
        <li className="flex items-center gap-1.5">
          <span
            className="h-3 w-3 rounded border border-amber-500 bg-amber-400"
            aria-hidden="true"
          />
          Đánh dấu
        </li>
        <li className="flex items-center gap-1.5">
          <span
            className="h-3 w-3 rounded border ring-2 ring-purple-500 ring-offset-1"
            aria-hidden="true"
          />
          Đang xem
        </li>
      </ul>
    </div>
  );
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

function resultStatus(question: RunnerQuestion, isCorrect: boolean | null, selected: AnswerValue): string {
  if (isCorrect === true) {
    return 'Đúng';
  }
  if (isCorrect === false) {
    return 'Sai';
  }
  return isAnswerEmpty(selected) ? 'Chưa trả lời' : 'Chưa chấm';
}

interface ResultViewProps {
  exam: RunnerExam;
  result: GradeResult;
  autoSubmitted: boolean;
  onRestart: () => void;
}

function ResultView({ exam, result, autoSubmitted, onRestart }: ResultViewProps) {
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
                Kết quả được chấm ngay trên thiết bị của bạn.
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
              <span>
                {result.questionCount - result.correctCount} câu chưa đúng
              </span>
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
            <Button type="button" onClick={onRestart}>
              <RotateCcw aria-hidden="true" />
              Làm lại đề này
            </Button>
            <Button asChild variant="outline">
              <Link href={`/de-thi/${exam.slug}`}>
                <ArrowLeft aria-hidden="true" />
                Xem lại đề
              </Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/phuong-phap">Đọc bài phương pháp</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section aria-labelledby="answer-review-title">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 id="answer-review-title" className="text-lg font-semibold">
                Xem lại đáp án và lời giải
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Câu làm sai được mở sẵn để bạn đối chiếu cách tư duy.
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {result.gradedQuestions.map((item) => {
              const { question } = item;
              const correctKeys = getCorrectOptionKeys(question.correctAnswer);
              const selected = chosenKeys(question, item.selectedAnswer);

              return (
                <details
                  key={question.id}
                  open={item.isCorrect === false}
                  className="group rounded-xl border bg-card shadow-sm"
                >
                  <summary className="flex cursor-pointer list-none items-start gap-3 p-4 [&::-webkit-details-marker]:hidden">
                    <span
                      className={cn(
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-semibold',
                        item.isCorrect === true
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.isCorrect === false
                            ? 'bg-destructive/10 text-destructive'
                            : 'bg-muted text-muted-foreground',
                      )}
                      aria-hidden="true"
                    >
                      {question.order}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant={
                            item.isCorrect === true
                              ? 'success'
                              : item.isCorrect === false
                                ? 'accent'
                                : 'secondary'
                          }
                        >
                          {resultStatus(question, item.isCorrect, item.selectedAnswer)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {question.partName} · {DIFFICULTY_LABELS[question.difficulty]} ·{' '}
                          {question.score} điểm
                        </span>
                        {question.topicName ? (
                          <span className="text-xs text-muted-foreground">
                            · {question.topicName}
                          </span>
                        ) : null}
                        {item.isFlagged ? (
                          <Flag
                            className="h-3.5 w-3.5 text-amber-500"
                            aria-label="Đã đánh dấu khi làm bài"
                          />
                        ) : null}
                      </span>
                      <span className="mt-1 block truncate text-xs text-muted-foreground">
                        Bạn trả lời: {describeAnswer(question.type, item.selectedAnswer, question.options)}
                      </span>
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
                              <span className="min-w-0 flex-1 leading-relaxed">
                                {option.text}
                              </span>
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
                            {describeCorrectAnswer(
                              question.type,
                              question.correctAnswer,
                              question.options,
                            )}
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
            })}
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
                Đọc lại lời giải của các câu sai, sau đó làm lại đề để kiểm tra mức độ tiến
                bộ. Bạn có thể làm lại bao nhiêu lần tùy thích.
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/phuong-phap">Xem bài phương pháp</Link>
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

export function ExamRunner({ exam }: { exam: RunnerExam }) {
  const draftKey = `onthithpt:draft:${exam.slug}`;
  const questionIds = useMemo(
    () => new Set(exam.questions.map((question) => question.id)),
    [exam.questions],
  );
  const durationMs = exam.durationMinutes * 60_000;

  const [phase, setPhase] = useState<Phase>('intro');
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [flags, setFlags] = useState<Set<string>>(new Set());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [deadline, setDeadline] = useState<number | null>(null);
  const [remainingMs, setRemainingMs] = useState(durationMs);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [result, setResult] = useState<GradeResult | null>(null);
  const [autoSubmitted, setAutoSubmitted] = useState(false);
  const [resumed, setResumed] = useState(false);

  const questionRef = useRef<HTMLDivElement | null>(null);
  const stateRef = useRef({ answers, flags, startedAt, phase });
  const doneRef = useRef(false);
  const submitRef = useRef<((auto: boolean) => void) | null>(null);

  useEffect(() => {
    stateRef.current = { answers, flags, startedAt, phase };
  }, [answers, flags, startedAt, phase]);

  const submit = useCallback(
    (auto: boolean) => {
      if (doneRef.current) {
        return;
      }
      doneRef.current = true;

      const current = stateRef.current;
      setResult(gradeExam(exam, current.answers, current.flags, current.startedAt));
      setAutoSubmitted(auto);
      setConfirmOpen(false);
      setPhase('result');

      try {
        window.localStorage.removeItem(draftKey);
      } catch {
        // Trình duyệt chặn localStorage: bỏ qua, bài vẫn được chấm bình thường.
      }
    },
    [draftKey, exam],
  );

  useEffect(() => {
    submitRef.current = submit;
  }, [submit]);

  useEffect(() => {
    const draft = readDraft(draftKey, questionIds);

    if (!draft) {
      return;
    }

    doneRef.current = false;
    setAnswers(draft.answers);
    setFlags(new Set(draft.flags));
    setStartedAt(draft.startedAt);
    setDeadline(draft.deadline);
    setRemainingMs(Math.max(0, draft.deadline - Date.now()));
    setPhase('doing');
    setResumed(true);
  }, [draftKey, questionIds]);

  useEffect(() => {
    if (phase !== 'doing' || !deadline) {
      return;
    }

    const tick = () => {
      const next = Math.max(0, deadline - Date.now());
      setRemainingMs(next);

      if (next <= 0) {
        submitRef.current?.(true);
      }
    };

    tick();
    const interval = window.setInterval(tick, 500);
    return () => window.clearInterval(interval);
  }, [phase, deadline]);

  useEffect(() => {
    if (phase !== 'doing' || !deadline || !startedAt) {
      return;
    }

    try {
      window.localStorage.setItem(
        draftKey,
        JSON.stringify({
          answers,
          flags: Array.from(flags),
          deadline,
          startedAt,
        } satisfies Draft),
      );
    } catch {
      // Không lưu được nháp thì vẫn cho làm bài tiếp.
    }
  }, [phase, deadline, startedAt, answers, flags, draftKey]);

  useEffect(() => {
    if (phase !== 'doing') {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [phase]);

  useEffect(() => {
    if (!confirmOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setConfirmOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [confirmOpen]);

  const groups = useMemo(() => {
    const map = new Map<string, QuestionGroup['items']>();

    exam.questions.forEach((question, index) => {
      const items = map.get(question.partName) ?? [];
      items.push({ index, question });
      map.set(question.partName, items);
    });

    return Array.from(map.entries()).map(([name, items]) => ({ name, items }));
  }, [exam.questions]);

  const total = exam.questions.length;
  const current = exam.questions[currentIndex];
  const currentValue = current ? (answers[current.id] ?? null) : null;
  const answeredCount = exam.questions.filter(
    (question) => !isAnswerEmpty(answers[question.id] ?? null),
  ).length;
  const flaggedCount = flags.size;
  const unansweredCount = Math.max(0, total - answeredCount);
  const urgent = remainingMs <= 5 * 60 * 1000;

  function start() {
    const now = Date.now();
    doneRef.current = false;
    setAnswers({});
    setFlags(new Set());
    setCurrentIndex(0);
    setResult(null);
    setAutoSubmitted(false);
    setResumed(false);
    setStartedAt(now);
    setDeadline(now + durationMs);
    setRemainingMs(durationMs);
    setPhase('doing');

    try {
      window.localStorage.removeItem(draftKey);
    } catch {
      // Không cần xử lý khi localStorage bị chặn.
    }
  }

  function restart() {
    start();
  }

  function goToQuestion(index: number) {
    if (index < 0 || index >= total) {
      return;
    }
    setCurrentIndex(index);
    window.requestAnimationFrame(() => {
      questionRef.current?.scrollIntoView({ block: 'start' });
    });
  }

  function handleOptionToggle(question: RunnerQuestion, key: string) {
    const value = answers[question.id] ?? null;
    const currentKeys = Array.isArray(value) ? value : typeof value === 'string' ? [value] : [];
    let next: AnswerValue;

    if (question.type === MULTIPLE_CHOICE) {
      const nextKeys = new Set(currentKeys.map((item) => item.toUpperCase()));
      if (nextKeys.has(key)) {
        nextKeys.delete(key);
      } else {
        nextKeys.add(key);
      }
      next = nextKeys.size > 0 ? Array.from(nextKeys).sort() : null;
    } else {
      next = currentKeys.includes(key) ? null : [key];
    }

    setAnswers((previous) => ({ ...previous, [question.id]: next }));
  }

  function handleTextChange(question: RunnerQuestion, value: string) {
    setAnswers((previous) => ({ ...previous, [question.id]: value }));
  }

  function handleToggleFlag(question: RunnerQuestion) {
    setFlags((previous) => {
      const next = new Set(previous);
      if (next.has(question.id)) {
        next.delete(question.id);
      } else {
        next.add(question.id);
      }
      return next;
    });
  }

  if (total === 0) {
    return (
      <div className="container max-w-2xl py-12">
        <Card>
          <CardHeader>
            <CardTitle>Đề thi chưa có câu hỏi</CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href={`/de-thi/${exam.slug}`}>Quay lại chi tiết đề</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (phase === 'result' && result) {
    return (
      <ResultView
        exam={exam}
        result={result}
        autoSubmitted={autoSubmitted}
        onRestart={restart}
      />
    );
  }

  if (phase === 'intro') {
    return (
      <div className="container max-w-3xl py-10 md:py-14">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{exam.subjectName}</Badge>
              <Badge variant="outline">{total} câu</Badge>
            </div>
            <CardTitle className="mt-2 text-2xl leading-tight">{exam.title}</CardTitle>
            <CardDescription className="text-sm leading-relaxed">
              Bấm bắt đầu để chạy đồng hồ đếm ngược. Bài làm được lưu tạm trên thiết bị để bạn
              có thể tiếp tục nếu lỡ tải lại trang.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            <dl className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border bg-muted/30 p-3">
                <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                  Thời gian
                </dt>
                <dd className="mt-1 text-base font-semibold">
                  {formatDuration(exam.durationMinutes)}
                </dd>
              </div>
              <div className="rounded-xl border bg-muted/30 p-3">
                <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <ListChecks className="h-3.5 w-3.5" aria-hidden="true" />
                  Số câu hỏi
                </dt>
                <dd className="mt-1 text-base font-semibold">{total} câu</dd>
              </div>
              <div className="rounded-xl border bg-muted/30 p-3">
                <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Target className="h-3.5 w-3.5" aria-hidden="true" />
                  Thang điểm
                </dt>
                <dd className="mt-1 text-base font-semibold">
                  {formatScore(exam.totalScore)}
                </dd>
              </div>
            </dl>

            <ul className="space-y-2.5 rounded-xl border bg-secondary/30 p-4 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <Timer className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <span>Đồng hồ bắt đầu tính từ lúc bạn bấm bắt đầu làm bài.</span>
              </li>
              <li className="flex gap-2">
                <AlertTriangle
                  className="mt-0.5 h-4 w-4 shrink-0 text-accent"
                  aria-hidden="true"
                />
                <span>Hết giờ, bài được tự động nộp với các đáp án đã chọn.</span>
              </li>
              <li className="flex gap-2">
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <span>
                  Điểm số, đáp án đúng và lời giải chi tiết hiện ngay sau khi nộp bài.
                </span>
              </li>
            </ul>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="button" size="lg" onClick={start} className="sm:flex-1">
                <Play aria-hidden="true" />
                Bắt đầu làm bài
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href={`/de-thi/${exam.slug}`}>
                  <ArrowLeft aria-hidden="true" />
                  Xem lại chi tiết đề
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!current) {
    return null;
  }

  const navigator = (
    <QuestionNavigator
      groups={groups}
      currentIndex={currentIndex}
      answers={answers}
      flags={flags}
      onSelect={goToQuestion}
    />
  );

  return (
    <>
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
        <div className="container flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{exam.title}</p>
            <p className="text-xs text-muted-foreground">
              {exam.subjectName} · {total} câu · {exam.durationMinutes} phút
              {resumed ? ' · tiếp tục bài đang làm' : ''}
            </p>
          </div>

          <div
            role="timer"
            aria-label="Thời gian còn lại"
            className={cn(
              'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-semibold tabular-nums',
              urgent
                ? 'border-destructive/40 bg-destructive/5 text-destructive'
                : 'bg-card',
            )}
          >
            <Timer className="h-4 w-4" aria-hidden="true" />
            {formatClock(remainingMs)}
          </div>

          <span className="hidden items-center gap-1.5 text-xs text-emerald-700 sm:flex">
            <Check className="h-3.5 w-3.5" aria-hidden="true" />
            Tự lưu trên thiết bị
          </span>

          <Button type="button" size="sm" onClick={() => setConfirmOpen(true)}>
            <Send aria-hidden="true" />
            Nộp bài
          </Button>
        </div>

        <div className="container pb-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Đã trả lời {answeredCount}/{total} câu
            </span>
            <Link
              href={`/de-thi/${exam.slug}`}
              className="transition-colors hover:text-foreground"
            >
              Thoát bài làm
            </Link>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-[width]"
              style={{ width: `${total > 0 ? (answeredCount / total) * 100 : 0}%` }}
            />
          </div>
        </div>
      </header>

      <div className="container grid max-w-6xl items-start gap-6 py-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <main className="min-w-0">
          <div className="mb-4 lg:hidden">
            <details className="rounded-xl border bg-card p-4">
              <summary className="cursor-pointer text-sm font-medium">
                Danh sách câu hỏi ({answeredCount}/{total})
              </summary>
              <div className="mt-4">{navigator}</div>
            </details>
          </div>

          <div ref={questionRef} className="scroll-mt-28">
            <Card>
              <CardHeader className="gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Badge variant="secondary">
                    Câu {currentIndex + 1} / {total}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {current.partName} · {current.score} điểm
                  </span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <CardTitle className="text-base">
                    {questionInstruction(current.type)}
                  </CardTitle>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleFlag(current)}
                    aria-pressed={flags.has(current.id)}
                    className={cn(
                      flags.has(current.id) &&
                        'border-amber-500 bg-amber-50 text-amber-900 hover:bg-amber-100',
                    )}
                  >
                    <Flag className="h-4 w-4" aria-hidden="true" />
                    {flags.has(current.id) ? 'Đã đánh dấu' : 'Đánh dấu xem lại'}
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-5">
                <div
                  className="article-content"
                  dangerouslySetInnerHTML={{ __html: current.contentHtml }}
                />

                {current.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={current.imageUrl}
                    alt="Hình ảnh minh họa cho câu hỏi"
                    decoding="async"
                    className="max-h-72 w-auto rounded-lg border object-contain"
                  />
                ) : null}

                {current.type === FILL_IN ? (
                  <div className="space-y-2">
                    <Input
                      value={typeof currentValue === 'string' ? currentValue : ''}
                      onChange={(event) => handleTextChange(current, event.target.value)}
                      placeholder="Nhập đáp án của bạn"
                      aria-label={`Đáp án cho câu ${currentIndex + 1}`}
                      autoComplete="off"
                      spellCheck={false}
                    />
                    <p className="text-xs text-muted-foreground">
                      Hệ thống so khớp không phân biệt chữ hoa, chữ thường và khoảng trắng
                      thừa.
                    </p>
                  </div>
                ) : current.type === ESSAY ? (
                  <div className="space-y-2">
                    <textarea
                      value={typeof currentValue === 'string' ? currentValue : ''}
                      onChange={(event) => handleTextChange(current, event.target.value)}
                      placeholder="Trình bày lời giải của bạn"
                      aria-label={`Bài làm cho câu ${currentIndex + 1}`}
                      className="min-h-[160px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm leading-relaxed ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                    <p className="text-xs text-muted-foreground">
                      Câu tự luận chưa được chấm điểm tự động, bạn sẽ đối chiếu với lời giải
                      sau khi nộp.
                    </p>
                  </div>
                ) : current.options.length > 0 ? (
                  <div
                    className={cn(
                      'grid gap-2.5',
                      current.type === MULTIPLE_CHOICE ? 'sm:grid-cols-2' : 'grid-cols-1',
                    )}
                  >
                    {current.options.map((option) => {
                      const selected = Array.isArray(currentValue)
                        ? currentValue.includes(option.key)
                        : currentValue === option.key;

                      return (
                        <label
                          key={option.key}
                          className={cn(
                            'flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-colors',
                            selected
                              ? 'border-primary bg-primary/5'
                              : 'bg-card hover:border-primary/40',
                          )}
                        >
                          <input
                            type={
                              current.type === MULTIPLE_CHOICE ? 'checkbox' : 'radio'
                            }
                            name={`question-${current.id}`}
                            className="sr-only"
                            checked={selected}
                            onChange={() => handleOptionToggle(current, option.key)}
                          />
                          <span
                            className={cn(
                              'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border text-xs font-bold',
                              selected
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'bg-background text-muted-foreground',
                            )}
                            aria-hidden="true"
                          >
                            {option.key}
                          </span>
                          <span className="min-w-0 flex-1 space-y-2">
                            <span className="block text-sm leading-relaxed">
                              {option.text}
                            </span>
                            {option.imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={option.imageUrl}
                                alt=""
                                decoding="async"
                                className="max-h-40 w-auto rounded border object-contain"
                              />
                            ) : null}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Câu hỏi này chưa có phương án trả lời.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => goToQuestion(currentIndex - 1)}
              disabled={currentIndex === 0}
            >
              <ChevronLeft aria-hidden="true" />
              Câu trước
            </Button>

            <span className="text-xs text-muted-foreground">
              {currentIndex + 1}/{total}
            </span>

            {currentIndex < total - 1 ? (
              <Button type="button" onClick={() => goToQuestion(currentIndex + 1)}>
                Câu sau
                <ChevronRight aria-hidden="true" />
              </Button>
            ) : (
              <Button type="button" onClick={() => setConfirmOpen(true)}>
                <Send aria-hidden="true" />
                Nộp bài
              </Button>
            )}
          </div>
        </main>

        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Danh sách câu hỏi</CardTitle>
              </CardHeader>
              <CardContent>{navigator}</CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-3 p-5">
                <dl className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-lg border bg-muted/40 p-2">
                    <dt className="text-muted-foreground">Đã làm</dt>
                    <dd className="mt-0.5 text-base font-semibold">{answeredCount}</dd>
                  </div>
                  <div className="rounded-lg border bg-muted/40 p-2">
                    <dt className="text-muted-foreground">Chưa làm</dt>
                    <dd className="mt-0.5 text-base font-semibold">{unansweredCount}</dd>
                  </div>
                  <div className="rounded-lg border bg-muted/40 p-2">
                    <dt className="text-muted-foreground">Đánh dấu</dt>
                    <dd className="mt-0.5 text-base font-semibold">{flaggedCount}</dd>
                  </div>
                </dl>

                <Button type="button" className="w-full" onClick={() => setConfirmOpen(true)}>
                  <Send aria-hidden="true" />
                  Nộp bài
                </Button>

                <p className="text-xs leading-relaxed text-muted-foreground">
                  Bài làm được lưu tạm trên thiết bị. Hết giờ, hệ thống tự nộp bài và hiện kết
                  quả.
                </p>
              </CardContent>
            </Card>
          </div>
        </aside>
      </div>

      {confirmOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setConfirmOpen(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="submit-dialog-title"
            className="w-full max-w-md rounded-xl border bg-card p-6 shadow-lg"
          >
            <div className="flex items-start justify-between gap-3">
              <h2 id="submit-dialog-title" className="text-lg font-semibold">
                Nộp bài?
              </h2>
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                aria-label="Đóng hộp thoại"
                className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Sau khi nộp, bạn không thể sửa đáp án. Điểm số, đáp án đúng và lời giải sẽ hiển
              thị ngay sau đó.
            </p>

            <dl className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-lg border bg-muted/40 p-2">
                <dt className="text-muted-foreground">Đã trả lời</dt>
                <dd className="mt-0.5 text-base font-semibold">{answeredCount}</dd>
              </div>
              <div className="rounded-lg border bg-muted/40 p-2">
                <dt className="text-muted-foreground">Chưa trả lời</dt>
                <dd className="mt-0.5 text-base font-semibold">{unansweredCount}</dd>
              </div>
              <div className="rounded-lg border bg-muted/40 p-2">
                <dt className="text-muted-foreground">Đánh dấu</dt>
                <dd className="mt-0.5 text-base font-semibold">{flaggedCount}</dd>
              </div>
            </dl>

            {unansweredCount > 0 ? (
              <p className="mt-3 flex gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                Còn {unansweredCount} câu chưa trả lời. Bạn vẫn có thể nộp bài.
              </p>
            ) : (
              <p className="mt-3 flex gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs leading-relaxed text-emerald-800">
                <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                Bạn đã trả lời tất cả câu hỏi.
              </p>
            )}

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={() => setConfirmOpen(false)}>
                Tiếp tục làm
              </Button>
              <Button type="button" onClick={() => submit(false)}>
                <Send aria-hidden="true" />
                Nộp bài
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
