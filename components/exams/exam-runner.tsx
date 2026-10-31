'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Flag,
  ListChecks,
  Play,
  Send,
  Target,
  Timer,
  X,
} from 'lucide-react';
import { ExamResult } from '@/components/exams/exam-result';
import { PracticeRunner } from '@/components/practice/practice-runner';
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
import { formatDuration, formatScore } from '@/lib/format';
import { isAnswerCorrect, isAnswerEmpty } from '@/lib/grading';
import { DIFFICULTY_ORDER } from '@/lib/labels';
import {
  noteMastered,
  noteWrong,
  recordPracticeResult,
  saveAttempt,
} from '@/lib/progress';
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
  const [practiceQuestions, setPracticeQuestions] = useState<RunnerQuestion[] | null>(null);

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
      const graded = gradeExam(exam, current.answers, current.flags, current.startedAt);
      setResult(graded);
      setAutoSubmitted(auto);
      setConfirmOpen(false);
      setPhase('result');

      const wrongItems = graded.gradedQuestions.filter((item) => item.isCorrect === false);
      const correctItems = graded.gradedQuestions.filter((item) => item.isCorrect === true);

      saveAttempt({
        kind: 'exam',
        title: exam.title,
        examSlug: exam.slug,
        subjectSlug: exam.subjectSlug,
        subjectName: exam.subjectName,
        score: graded.score,
        maxScore: graded.maxScore,
        correctCount: graded.correctCount,
        gradedCount: graded.gradedQuestions.filter((item) => item.isCorrect !== null).length,
        questionCount: graded.questionCount,
        durationSeconds: graded.timeSpentSeconds,
      });
      noteWrong(
        wrongItems.map((item) => ({
          id: item.question.id,
          subjectSlug: exam.subjectSlug,
          subjectName: exam.subjectName,
          sourceTitle: exam.title,
          examSlug: exam.slug,
        })),
      );
      noteMastered(correctItems.map((item) => item.question.id));

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
    setPracticeQuestions(null);
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

  if (practiceQuestions) {
    return (
      <PracticeRunner
        title={`Luyện lại câu sai · ${exam.title}`}
        subtitle={exam.subjectName}
        questions={practiceQuestions}
        onExit={() => setPracticeQuestions(null)}
        onFinish={(outcome) =>
          recordPracticeResult({
            kind: 'practice',
            title: `Luyện lại câu sai · ${exam.title}`,
            examSlug: exam.slug,
            subjectSlug: exam.subjectSlug,
            subjectName: exam.subjectName,
            outcome,
            metaFor: (id) => ({
              id,
              subjectSlug: exam.subjectSlug,
              subjectName: exam.subjectName,
              sourceTitle: exam.title,
              examSlug: exam.slug,
            }),
          })
        }
      />
    );
  }

  if (phase === 'result' && result) {
    return (
      <ExamResult
        exam={exam}
        result={result}
        autoSubmitted={autoSubmitted}
        onRestart={restart}
        onPracticeWrong={setPracticeQuestions}
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
