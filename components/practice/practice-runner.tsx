'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  RotateCcw,
  Sparkles,
  XCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type {
  AnswerValue,
  PracticeOutcome,
  PracticeResultItem,
  RunnerQuestion,
} from '@/lib/content-types';
import { formatTimeSpent, toExcerpt } from '@/lib/format';
import {
  describeAnswer,
  describeCorrectAnswer,
  getCorrectOptionKeys,
  isAnswerCorrect,
  isAnswerEmpty,
} from '@/lib/grading';
import { DIFFICULTY_LABELS } from '@/lib/labels';
import {
  buildPracticeResults,
  clearPracticeSession,
  savePracticeSession,
  type PracticeSessionSnapshot,
} from '@/lib/progress';
import { cn } from '@/lib/utils';

const MULTIPLE_CHOICE = 'MULTIPLE_CHOICE';
const FILL_IN = 'FILL_IN';
const ESSAY = 'ESSAY';

interface PracticeRunnerProps {
  title: string;
  subtitle?: string;
  questions: RunnerQuestion[];
  backHref?: string;
  /** Có giá trị thì phiên được tự lưu để quay lại làm tiếp. */
  resumeKey?: string;
  /** Phiên đã lưu đọc từ localStorage, dùng khi bấm "Tiếp tục làm". */
  initial?: PracticeSessionSnapshot | null;
  onExit?: () => void;
  onFinish?: (outcome: PracticeOutcome) => void;
}

function questionInstruction(type: RunnerQuestion['type']): string {
  if (type === MULTIPLE_CHOICE) {
    return 'Chọn tất cả đáp án đúng rồi bấm Kiểm tra';
  }
  if (type === FILL_IN) {
    return 'Điền đáp án rồi bấm Kiểm tra';
  }
  if (type === ESSAY) {
    return 'Viết bài làm rồi đối chiếu bài mẫu';
  }
  return 'Chọn một đáp án';
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

export function PracticeRunner({
  title,
  subtitle,
  questions,
  backHref,
  resumeKey,
  initial = null,
  onExit,
  onFinish,
}: PracticeRunnerProps) {
  const [session, setSession] = useState(questions);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>(
    () => initial?.answers ?? {},
  );
  const [results, setResults] = useState<PracticeResultItem[]>(() =>
    initial ? buildPracticeResults(initial) : [],
  );
  const [index, setIndex] = useState(() =>
    Math.min(initial?.index ?? 0, Math.max(0, questions.length - 1)),
  );
  const [finished, setFinished] = useState(false);
  const [startedAt, setStartedAt] = useState(() => initial?.startedAt ?? Date.now());
  const [finishedAt, setFinishedAt] = useState(0);
  const finishedRef = useRef(false);

  const current = session[index];
  const currentValue = current ? (answers[current.id] ?? null) : null;
  const correctKeys = current ? getCorrectOptionKeys(current.correctAnswer) : [];
  const selectedKeys = current ? chosenKeys(current, currentValue) : [];
  // Kết quả tra theo id câu hỏi nên quay lại câu cũ vẫn thấy nguyên đáp án và lời giải.
  const currentResult = current
    ? results.find((item) => item.question.id === current.id) ?? null
    : null;
  const checked = currentResult !== null;

  const graded = useMemo(
    () => results.filter((item) => item.isCorrect !== null),
    [results],
  );
  const correctCount = graded.filter((item) => item.isCorrect === true).length;
  const wrongQuestions = useMemo(
    () => results.filter((item) => item.isCorrect === false).map((item) => item.question),
    [results],
  );

  // Tự lưu phiên đang làm: đóng tab, thoát giữa chừng hay mất mạng vẫn quay lại được.
  useEffect(() => {
    if (!resumeKey) {
      return;
    }

    if (finished) {
      clearPracticeSession();
      return;
    }

    const key = resumeKey;

    function write() {
      // Chưa trả lời câu nào thì giữ nguyên phiên dang dở cũ, khỏi mất công lưu một phiên trống.
      if (results.length === 0 && index === 0) {
        return;
      }

      savePracticeSession({
        resumeKey: key,
        title,
        subtitle: subtitle ?? null,
        questions: session,
        answers,
        order: results.map((item) => item.question.id),
        verdicts: Object.fromEntries(
          results.map((item) => [item.question.id, item.isCorrect]),
        ),
        index,
        startedAt,
        updatedAt: Date.now(),
      });
    }

    const timer = window.setTimeout(write, 500);
    return () => {
      window.clearTimeout(timer);
      write();
    };
  }, [resumeKey, finished, session, answers, results, index, startedAt, title, subtitle]);

  if (session.length === 0) {
    return (
      <div className="container max-w-2xl py-12">
        <Card>
          <CardHeader>
            <CardTitle>Chưa có câu hỏi để luyện</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Chọn thêm chuyên đề hoặc làm một đề để hệ thống ghi nhận câu cần ôn.
            </p>
            <Button asChild>
              <Link href="/luyen-tap">Chọn nội dung luyện tập</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  function scrollTop() {
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  function check(question: RunnerQuestion, valueOverride?: AnswerValue) {
    if (checked) {
      return;
    }

    const value = valueOverride !== undefined ? valueOverride : (answers[question.id] ?? null);
    if (question.type !== ESSAY && isAnswerEmpty(value)) {
      return;
    }

    const isCorrect = isAnswerCorrect(question.type, question.correctAnswer, value);
    setResults((previous) => [...previous, { question, selected: value, isCorrect }]);
    scrollTop();
  }

  function chooseOption(question: RunnerQuestion, key: string) {
    if (checked) {
      return;
    }

    const value = answers[question.id] ?? null;
    const currentKeys = Array.isArray(value) ? value : typeof value === 'string' ? [value] : [];

    if (question.type === MULTIPLE_CHOICE) {
      const nextKeys = new Set(currentKeys.map((item) => item.toUpperCase()));
      if (nextKeys.has(key)) {
        nextKeys.delete(key);
      } else {
        nextKeys.add(key);
      }
      const next = nextKeys.size > 0 ? Array.from(nextKeys).sort() : null;
      setAnswers((previous) => ({ ...previous, [question.id]: next }));
      return;
    }

    setAnswers((previous) => ({ ...previous, [question.id]: [key] }));
    check(question, [key]);
  }

  function goToQuestion(target: number) {
    if (target < 0 || target >= session.length || target === index) {
      return;
    }
    setIndex(target);
    scrollTop();
  }

  function next() {
    if (index < session.length - 1) {
      goToQuestion(index + 1);
      return;
    }

    if (finishedRef.current) {
      return;
    }
    finishedRef.current = true;

    const now = Date.now();
    setFinishedAt(now);
    setFinished(true);
    onFinish?.({ items: results, startedAt, finishedAt: now });
    scrollTop();
  }

  function reset(list: RunnerQuestion[]) {
    finishedRef.current = false;
    setSession(list);
    setAnswers({});
    setResults([]);
    setIndex(0);
    setFinished(false);
    setStartedAt(Date.now());
    setFinishedAt(0);
    scrollTop();
  }

  if (finished) {
    const total = graded.length;
    const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    const duration = Math.max(1, Math.round((finishedAt - startedAt) / 1000));

    return (
      <div className="container max-w-3xl py-8 md:py-12">
        <Card className="overflow-hidden">
          <div className="h-1.5 w-full bg-primary" aria-hidden="true" />
          <CardContent className="p-6 md:p-8">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Kết quả luyện tập
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">{title}</h1>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border bg-emerald-50 p-4">
                <p className="text-xs text-emerald-800">Trả lời đúng</p>
                <p className="mt-1 text-2xl font-bold text-emerald-900">
                  {correctCount}
                  <span className="text-base font-semibold text-emerald-700">/{total}</span>
                </p>
              </div>
              <div className="rounded-2xl border bg-muted/40 p-4">
                <p className="text-xs text-muted-foreground">Độ chính xác</p>
                <p className="mt-1 text-2xl font-bold">{accuracy}%</p>
              </div>
              <div className="rounded-2xl border bg-muted/40 p-4">
                <p className="text-xs text-muted-foreground">Thời gian</p>
                <p className="mt-1 text-2xl font-bold">{formatTimeSpent(duration)}</p>
              </div>
            </div>

            {results.some((item) => item.isCorrect === null) ? (
              <p className="mt-4 text-xs text-muted-foreground">
                {results.filter((item) => item.isCorrect === null).length} câu tự luận được đối
                chiếu bài mẫu, không tính vào điểm.
              </p>
            ) : null}

            <div className="mt-6 flex flex-wrap gap-3">
              {wrongQuestions.length > 0 ? (
                <Button type="button" onClick={() => reset(wrongQuestions)}>
                  <RotateCcw aria-hidden="true" />
                  Luyện lại {wrongQuestions.length} câu sai
                </Button>
              ) : (
                <Badge variant="success" className="px-3 py-2">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  Không có câu sai
                </Badge>
              )}
              <Button type="button" variant="outline" onClick={() => reset(questions)}>
                <RotateCcw aria-hidden="true" />
                Làm lại từ đầu
              </Button>
              {backHref ? (
                <Button asChild variant="ghost">
                  <Link href={backHref}>
                    <ArrowLeft aria-hidden="true" />
                    Quay lại
                  </Link>
                </Button>
              ) : onExit ? (
                <Button type="button" variant="ghost" onClick={onExit}>
                  <ArrowLeft aria-hidden="true" />
                  Quay lại
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>

        {wrongQuestions.length > 0 ? (
          <div className="mt-6 rounded-2xl border bg-card p-4">
            <p className="text-sm font-semibold">Các câu cần xem lại</p>
            <ul className="mt-3 space-y-2">
              {results
                .filter((item) => item.isCorrect === false)
                .map((item, position) => (
                  <li key={item.question.id} className="flex gap-2 text-sm">
                    <span className="font-semibold text-muted-foreground">
                      {position + 1}.
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm">
                        {toExcerpt(item.question.contentHtml, 170)}
                      </span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {item.question.topicName ?? item.question.partName} · Đáp án đúng:{' '}
                        {describeCorrectAnswer(
                          item.question.type,
                          item.question.correctAnswer,
                          item.question.options,
                        )}
                      </span>
                    </span>
                  </li>
                ))}
            </ul>
          </div>
        ) : null}
      </div>
    );
  }

  if (!current) {
    return null;
  }

  const isEssay = current.type === ESSAY;
  const canCheck = isEssay
    ? true
    : current.type === FILL_IN
      ? !isAnswerEmpty(currentValue)
      : !isAnswerEmpty(currentValue);

  return (
    <>
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
        <div className="container flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{title}</p>
            <p className="text-xs text-muted-foreground">
              {subtitle ? `${subtitle} · ` : ''}
              {session.length} câu · hiện đáp án ngay sau mỗi câu
            </p>
          </div>
          <Badge variant="secondary">
            Câu {index + 1}/{session.length}
          </Badge>
          {backHref ? (
            <Button asChild variant="ghost" size="sm">
              <Link href={backHref}>
                <ArrowLeft aria-hidden="true" />
                Thoát
              </Link>
            </Button>
          ) : onExit ? (
            <Button type="button" variant="ghost" size="sm" onClick={onExit}>
              <ArrowLeft aria-hidden="true" />
              Thoát
            </Button>
          ) : null}
        </div>
        <div className="container pb-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Đúng {correctCount}/{graded.length} câu đã kiểm tra
            </span>
            <span>{Math.round((results.length / session.length) * 100)}%</span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-[width]"
              style={{ width: `${(results.length / session.length) * 100}%` }}
            />
          </div>
          <div
            role="group"
            aria-label="Chuyển đến một câu đã làm"
            className="mt-2 flex gap-1 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible"
          >
            {session.map((question, position) => {
              const verdict = results.find((item) => item.question.id === question.id)?.isCorrect;
              const isCurrent = position === index;

              return (
                <button
                  key={question.id}
                  type="button"
                  onClick={() => goToQuestion(position)}
                  aria-current={isCurrent ? 'true' : undefined}
                  aria-label={`Câu ${position + 1}${
                    verdict === undefined ? ' chưa làm' : verdict ? ' làm đúng' : ' làm sai'
                  }`}
                  className={cn(
                    'h-7 w-7 shrink-0 rounded-md border text-xs font-semibold tabular-nums transition-colors',
                    isCurrent
                      ? 'border-primary bg-primary text-primary-foreground'
                      : verdict === true
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:border-emerald-400'
                        : verdict === false
                          ? 'border-destructive/40 bg-destructive/10 text-destructive hover:border-destructive/60'
                          : verdict === null
                            ? 'border-border bg-muted text-muted-foreground'
                            : 'border-border bg-card text-muted-foreground hover:border-primary/40',
                  )}
                >
                  {position + 1}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <div className="container max-w-3xl py-6">
        <Card>
          <CardHeader className="gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant="outline">{current.partName}</Badge>
                <Badge variant="secondary">{DIFFICULTY_LABELS[current.difficulty]}</Badge>
                {current.topicName ? (
                  <span className="text-xs text-muted-foreground">{current.topicName}</span>
                ) : null}
              </div>
              <span className="text-xs text-muted-foreground">{current.score} điểm</span>
            </div>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {questionInstruction(current.type)}
            </CardTitle>
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
              <Input
                value={typeof currentValue === 'string' ? currentValue : ''}
                onChange={(event) =>
                  setAnswers((previous) => ({
                    ...previous,
                    [current.id]: event.target.value,
                  }))
                }
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    check(current);
                  }
                }}
                readOnly={checked}
                placeholder="Nhập đáp án của bạn"
                aria-label={`Đáp án cho câu ${index + 1}`}
                autoComplete="off"
                spellCheck={false}
              />
            ) : isEssay ? (
              <textarea
                value={typeof currentValue === 'string' ? currentValue : ''}
                onChange={(event) =>
                  setAnswers((previous) => ({
                    ...previous,
                    [current.id]: event.target.value,
                  }))
                }
                readOnly={checked}
                placeholder="Viết bài làm của bạn"
                aria-label={`Bài làm cho câu ${index + 1}`}
                className="min-h-[140px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm leading-relaxed ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            ) : current.options.length > 0 ? (
              <div
                className={cn(
                  'grid gap-2.5',
                  current.type === MULTIPLE_CHOICE ? 'sm:grid-cols-2' : 'grid-cols-1',
                )}
              >
                {current.options.map((option) => {
                  const isCorrectOption = correctKeys.includes(option.key);
                  const isChosen = selectedKeys.includes(option.key);
                  const showState = checked;

                  return (
                    <button
                      key={option.key}
                      type="button"
                      disabled={checked}
                      onClick={() => chooseOption(current, option.key)}
                      aria-pressed={isChosen}
                      className={cn(
                        'flex items-start gap-3 rounded-2xl border p-3.5 text-left transition-colors',
                        showState && isCorrectOption
                          ? 'border-emerald-400 bg-emerald-50'
                          : showState && isChosen && !isCorrectOption
                            ? 'border-destructive/50 bg-destructive/5'
                            : isChosen
                              ? 'border-primary bg-primary/5'
                              : 'bg-card hover:border-primary/40',
                        checked && 'cursor-default',
                      )}
                    >
                      <span
                        className={cn(
                          'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-xs font-bold',
                          showState && isCorrectOption
                            ? 'border-emerald-500 bg-emerald-500 text-white'
                            : showState && isChosen && !isCorrectOption
                              ? 'border-destructive bg-destructive text-white'
                              : isChosen
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'bg-background text-muted-foreground',
                        )}
                        aria-hidden="true"
                      >
                        {option.key}
                      </span>
                      <span className="min-w-0 flex-1 space-y-2">
                        <span className="block text-sm leading-relaxed">{option.text}</span>
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
                      {showState && isCorrectOption ? (
                        <CheckCircle2
                          className="mt-1 h-4 w-4 shrink-0 text-emerald-600"
                          aria-label="Đáp án đúng"
                        />
                      ) : null}
                      {showState && isChosen && !isCorrectOption ? (
                        <XCircle
                          className="mt-1 h-4 w-4 shrink-0 text-destructive"
                          aria-label="Bạn chọn sai"
                        />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Câu hỏi này chưa có phương án trả lời.
              </p>
            )}

            {!checked ? (
              <div className="space-y-3 pt-1">
                <p className="text-xs text-muted-foreground">
                  {isEssay
                    ? 'Câu tự luận không chấm tự động, bạn đối chiếu bài mẫu bên dưới.'
                    : current.type === MULTIPLE_CHOICE
                      ? 'Câu nhiều đáp án: chọn đủ rồi bấm Kiểm tra.'
                      : 'Chọn đáp án để xem kết quả ngay.'}
                </p>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => goToQuestion(index - 1)}
                    disabled={index === 0}
                  >
                    <ChevronLeft aria-hidden="true" />
                    Câu trước
                  </Button>
                  <div className="flex flex-wrap items-center gap-2">
                    {isEssay ? (
                      <Button type="button" onClick={() => check(current)}>
                        Xem lời giải
                        <ChevronRight aria-hidden="true" />
                      </Button>
                    ) : current.type !== 'SINGLE_CHOICE' ? (
                      <Button type="button" onClick={() => check(current)} disabled={!canCheck}>
                        <Check aria-hidden="true" />
                        Kiểm tra
                      </Button>
                    ) : null}
                    {index < session.length - 1 ? (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => goToQuestion(index + 1)}
                      >
                        Câu tiếp theo
                        <ChevronRight aria-hidden="true" />
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div
                  className={cn(
                    'flex items-start gap-2.5 rounded-2xl border px-4 py-3 text-sm',
                    currentResult?.isCorrect === true
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                      : currentResult?.isCorrect === false
                        ? 'border-destructive/30 bg-destructive/5 text-foreground'
                        : 'border-border bg-muted/40 text-foreground',
                  )}
                >
                  {currentResult?.isCorrect === true ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
                  ) : currentResult?.isCorrect === false ? (
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden="true" />
                  ) : (
                    <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold">
                      {currentResult?.isCorrect === true
                        ? 'Chính xác!'
                        : currentResult?.isCorrect === false
                          ? 'Chưa đúng'
                          : 'Đối chiếu lời giải'}
                    </p>
                    {currentResult?.isCorrect === false ? (
                      <p className="mt-0.5 text-xs leading-relaxed">
                        Bạn chọn: {describeAnswer(current.type, currentResult.selected, current.options)}
                      </p>
                    ) : null}
                    {currentResult?.isCorrect !== true && current.type !== ESSAY ? (
                      <p className="mt-0.5 text-xs leading-relaxed">
                        Đáp án đúng:{' '}
                        {describeCorrectAnswer(
                          current.type,
                          current.correctAnswer,
                          current.options,
                        )}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                  <p className="flex items-center gap-2 text-sm font-semibold text-primary">
                    <Lightbulb className="h-4 w-4" aria-hidden="true" />
                    Lời giải
                  </p>
                  <div
                    className="article-content mt-2 text-sm"
                    dangerouslySetInnerHTML={{ __html: current.explanationHtml }}
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => goToQuestion(index - 1)}
                    disabled={index === 0}
                  >
                    <ChevronLeft aria-hidden="true" />
                    Câu trước
                  </Button>
                  <Button type="button" onClick={next}>
                    {index < session.length - 1 ? 'Câu tiếp theo' : 'Xem kết quả'}
                    <ChevronRight aria-hidden="true" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Luyện tập không tính giờ. Kết quả từng câu được lưu vào tiến độ học tập trên thiết bị.
          {resumeKey
            ? ' Phiên đang làm được tự lưu: bấm vào số câu ở đầu trang để xem lại, hoặc quay lại làm tiếp khi khác.'
            : ''}
        </p>
      </div>
    </>
  );
}
