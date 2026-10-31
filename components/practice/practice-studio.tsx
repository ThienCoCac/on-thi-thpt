'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  BookOpenCheck,
  CheckCircle2,
  Loader2,
  NotebookPen,
  Play,
  Shuffle,
  Target,
} from 'lucide-react';
import { PracticeRunner } from '@/components/practice/practice-runner';
import { DogMascot } from '@/components/brand/dog-mascot';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { BankQuestion, PracticeSubject, RunnerQuestion } from '@/lib/content-types';
import { pickFreshQuestions } from '@/lib/practice-picker';
import {
  loadMistakes,
  loadSeenCounts,
  markQuestionsSeen,
  recordPracticeResult,
} from '@/lib/progress';
import { cn } from '@/lib/utils';

const COUNT_OPTIONS = [10, 20, 30, 50];

interface PracticeStudioProps {
  catalog: PracticeSubject[];
}

export function PracticeStudio({ catalog }: PracticeStudioProps) {
  const first = catalog[0];
  const [subjectSlug, setSubjectSlug] = useState(first?.slug ?? '');
  const [topicIds, setTopicIds] = useState<Set<string>>(
    () => new Set(first?.topics.map((topic) => topic.id) ?? []),
  );
  const [count, setCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<RunnerQuestion[] | null>(null);
  const [sessionTitle, setSessionTitle] = useState('');
  const [mistakeCount, setMistakeCount] = useState(0);
  const bankRef = useRef<BankQuestion[] | null>(null);

  useEffect(() => {
    setMistakeCount(loadMistakes().length);
  }, []);

  const subject = catalog.find((item) => item.slug === subjectSlug) ?? first;
  const availableCount = subject
    ? subject.topics
        .filter((topic) => topicIds.has(topic.id))
        .reduce((sum, topic) => sum + topic.count, 0)
    : 0;
  const effectiveCount = Math.min(count, availableCount);

  if (!subject) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5">
              <CardTitle>Chưa có câu hỏi để luyện</CardTitle>
              <CardDescription>
                Nội dung đang được cập nhật. Quay lại sau khi có thêm đề nhé.
              </CardDescription>
            </div>
            <DogMascot className="h-20 w-20 shrink-0" />
          </div>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/de-thi">Xem danh sách đề</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  function chooseSubject(slug: string) {
    const next = catalog.find((item) => item.slug === slug);
    if (!next) {
      return;
    }
    setSubjectSlug(slug);
    setTopicIds(new Set(next.topics.map((topic) => topic.id)));
    setCount((previous) => Math.min(previous, next.questionCount));
    setError(null);
  }

  function toggleTopic(id: string) {
    setTopicIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  async function getBank(): Promise<BankQuestion[]> {
    if (bankRef.current) {
      return bankRef.current;
    }

    const response = await fetch('/data/question-bank.json');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = (await response.json()) as BankQuestion[];
    bankRef.current = data;
    return data;
  }

  async function start() {
    if (availableCount === 0) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const bank = await getBank();
      const pool = bank.filter(
        (question) => question.subjectSlug === subject.slug && topicIds.has(question.topicId),
      );
      const picked = pickFreshQuestions(pool, count, loadSeenCounts());

      if (picked.length === 0) {
        setError('Không tìm thấy câu hỏi phù hợp. Hãy chọn thêm chuyên đề.');
        return;
      }

      markQuestionsSeen(picked.map((question) => question.id));
      setSessionTitle(`Luyện tập · ${subject.name}`);
      setSession(picked);
    } catch {
      setError('Không tải được ngân hàng câu hỏi. Kiểm tra kết nối rồi thử lại.');
    } finally {
      setLoading(false);
    }
  }

  if (session) {
    return (
      <PracticeRunner
        title={sessionTitle}
        subtitle={subject.name}
        questions={session}
        onExit={() => {
          setSession(null);
          setMistakeCount(loadMistakes().length);
        }}
        onFinish={(outcome) =>
          recordPracticeResult({
            kind: 'random',
            title: sessionTitle,
            examSlug: null,
            subjectSlug: subject.slug,
            subjectName: subject.name,
            outcome,
            metaFor: (id) => {
              const question = bankRef.current?.find((item) => item.id === id);
              return {
                id,
                subjectSlug: question?.subjectSlug ?? subject.slug,
                subjectName: question?.subjectName ?? subject.name,
                sourceTitle: question?.examTitle ?? '',
                examSlug: question?.examSlug ?? null,
              };
            },
          })
        }
      />
    );
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tạo phiên luyện tập</CardTitle>
          <CardDescription>
            Hệ thống bốc câu ngẫu nhiên từ các đề hiện có, hiện đáp án ngay sau mỗi câu.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-7">
          <section aria-labelledby="practice-subject-title">
            <h3
              id="practice-subject-title"
              className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
            >
              1. Chọn môn học
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {catalog.map((item) => {
                const active = item.slug === subject.slug;

                return (
                  <button
                    key={item.slug}
                    type="button"
                    onClick={() => chooseSubject(item.slug)}
                    aria-pressed={active}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
                      active
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border text-muted-foreground hover:bg-secondary',
                    )}
                  >
                    {item.name}
                    <span
                      className={cn(
                        'rounded-full px-1.5 text-xs tabular-nums',
                        active ? 'bg-primary-foreground/20' : 'bg-muted',
                      )}
                    >
                      {item.questionCount}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section aria-labelledby="practice-topic-title">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3
                id="practice-topic-title"
                className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              >
                2. Chọn chuyên đề
              </h3>
              <div className="flex gap-3 text-xs">
                <button
                  type="button"
                  className="text-primary hover:underline"
                  onClick={() =>
                    setTopicIds(new Set(subject.topics.map((topic) => topic.id)))
                  }
                >
                  Chọn tất cả
                </button>
                <button
                  type="button"
                  className="text-muted-foreground hover:underline"
                  onClick={() => setTopicIds(new Set())}
                >
                  Bỏ chọn
                </button>
              </div>
            </div>

            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {subject.topics.map((topic) => {
                const active = topicIds.has(topic.id);

                return (
                  <li key={topic.id}>
                    <label
                      className={cn(
                        'flex cursor-pointer items-start gap-2.5 rounded-lg border p-3 text-sm transition-colors',
                        active
                          ? 'border-primary/50 bg-primary/5'
                          : 'bg-card hover:border-primary/30',
                      )}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={active}
                        onChange={() => toggleTopic(topic.id)}
                      />
                      <span
                        className={cn(
                          'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border',
                          active ? 'border-primary bg-primary text-primary-foreground' : 'bg-background',
                        )}
                        aria-hidden="true"
                      >
                        {active ? <CheckCircle2 className="h-3 w-3" /> : null}
                      </span>
                      <span className="min-w-0 flex-1 leading-snug">{topic.name}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {topic.count} câu
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </section>

          <section aria-labelledby="practice-count-title">
            <h3
              id="practice-count-title"
              className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
            >
              3. Số câu mỗi phiên
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {COUNT_OPTIONS.map((option) => {
                const disabled = option > availableCount;
                const active = effectiveCount === option;

                return (
                  <button
                    key={option}
                    type="button"
                    disabled={disabled}
                    onClick={() => setCount(option)}
                    aria-pressed={active}
                    className={cn(
                      'rounded-lg border px-4 py-1.5 text-sm font-medium transition-colors',
                      active
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border text-muted-foreground hover:bg-secondary',
                      disabled && 'cursor-not-allowed opacity-40',
                    )}
                  >
                    {option} câu
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Đang chọn {availableCount} câu phù hợp · phiên này sẽ có {effectiveCount} câu.
            </p>
          </section>

          {error ? (
            <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              size="lg"
              onClick={start}
              disabled={loading || availableCount === 0}
            >
              {loading ? (
                <Loader2 className="animate-spin" aria-hidden="true" />
              ) : (
                <Play aria-hidden="true" />
              )}
              {loading ? 'Đang chuẩn bị…' : 'Bắt đầu luyện tập'}
            </Button>
            <Badge variant="outline" className="self-center">
              <Shuffle className="h-3.5 w-3.5" aria-hidden="true" />
              Câu hỏi được xáo trộn mỗi phiên
            </Badge>
          </div>
        </CardContent>
      </Card>

      <aside className="space-y-4 lg:sticky lg:top-20">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Luyện theo lỗi của bạn</CardTitle>
            <CardDescription>
              Những câu bạn từng làm sai được gom vào sổ tay để ôn lại cho tới khi đúng.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2 text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <NotebookPen className="h-4 w-4" aria-hidden="true" />
                Câu đang cần ôn
              </span>
              <span className="font-semibold">{mistakeCount}</span>
            </div>
            <Button asChild variant="outline" className="w-full">
              <Link href="/cau-sai">
                <NotebookPen aria-hidden="true" />
                Mở sổ tay câu sai
              </Link>
            </Button>
            <Button asChild variant="ghost" className="w-full">
              <Link href="/tien-do">
                <Target aria-hidden="true" />
                Xem tiến độ học tập
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-2 p-5 text-sm text-muted-foreground">
            <p className="flex items-center gap-2 font-medium text-foreground">
              <BookOpenCheck className="h-4 w-4 text-primary" aria-hidden="true" />
              Cách hoạt động
            </p>
            <p>
              Câu hỏi lấy từ toàn bộ đề của môn bạn chọn, không trùng lặp trong một phiên.
              Trả lời đúng thì câu đó được gỡ khỏi sổ tay câu sai.
            </p>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
