'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ChevronDown,
  Lightbulb,
  Loader2,
  NotebookPen,
  Play,
  Trash2,
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
import type { BankQuestion } from '@/lib/content-types';
import { formatDate, toExcerpt } from '@/lib/format';
import { getCorrectOptionKeys } from '@/lib/grading';
import { pickFreshQuestions } from '@/lib/practice-picker';
import {
  clearMistakes,
  loadMistakes,
  loadSeenCounts,
  markQuestionsSeen,
  recordPracticeResult,
  removeMistake,
} from '@/lib/progress';
import type { MistakeEntry } from '@/lib/progress';
import { cn } from '@/lib/utils';

const COUNT_OPTIONS = [10, 20, 50];

interface JoinedMistake extends MistakeEntry {
  question: BankQuestion;
}

interface PracticeSession {
  questions: BankQuestion[];
  subjectSlug: string;
  subjectName: string;
}

export function MistakeBook() {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [entries, setEntries] = useState<JoinedMistake[]>([]);
  const [filter, setFilter] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);
  const [count, setCount] = useState<number | 'all'>(10);
  const [session, setSession] = useState<PracticeSession | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const bankRef = useRef<Map<string, BankQuestion>>(new Map());

  useEffect(() => {
    let cancelled = false;
    const mistakes = loadMistakes();

    if (mistakes.length === 0) {
      setEntries([]);
      setStatus('ready');
      return () => {
        cancelled = true;
      };
    }

    setStatus('loading');

    fetch('/data/question-bank.json')
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.json() as Promise<BankQuestion[]>;
      })
      .then((bank) => {
        if (cancelled) {
          return;
        }

        const map = new Map(bank.map((question) => [question.id, question]));
        bankRef.current = map;
        setEntries(
          mistakes
            .map((entry) => {
              const question = map.get(entry.id);
              return question ? { ...entry, question } : null;
            })
            .filter((entry): entry is JoinedMistake => entry !== null),
        );
        setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) {
          setStatus('error');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const subjects = useMemo(() => {
    const map = new Map<string, string>();
    for (const entry of entries) {
      map.set(entry.subjectSlug, entry.subjectName);
    }
    return Array.from(map.entries()).map(([slug, name]) => ({ slug, name }));
  }, [entries]);

  const visible = filter
    ? entries.filter((entry) => entry.subjectSlug === filter)
    : entries;
  const effective = count === 'all' ? visible.length : Math.min(count, visible.length);

  function startSession(selected: JoinedMistake[], limit: number) {
    const picked = pickFreshQuestions(
      selected.map((entry) => entry.question),
      limit,
      loadSeenCounts(),
    );

    if (picked.length === 0) {
      return;
    }

    markQuestionsSeen(picked.map((question) => question.id));

    const uniqueSubjects = new Map<string, string>();
    for (const entry of selected) {
      uniqueSubjects.set(entry.subjectSlug, entry.subjectName);
    }
    const onlySubject =
      uniqueSubjects.size === 1 ? selected[0] : null;

    setSession({
      questions: picked,
      subjectSlug: onlySubject ? onlySubject.subjectSlug : 'hon-hop',
      subjectName: onlySubject ? onlySubject.subjectName : 'Nhiều môn',
    });
  }

  function handleRemoved(id: string) {
    removeMistake(id);
    setEntries((previous) => previous.filter((entry) => entry.id !== id));
  }

  if (session) {
    const title = `Ôn câu sai · ${session.subjectName}`;

    return (
      <PracticeRunner
        title={title}
        subtitle={session.subjectName}
        questions={session.questions}
        onExit={() => {
          setSession(null);
          setReloadToken((token) => token + 1);
        }}
        onFinish={(outcome) =>
          recordPracticeResult({
            kind: 'mistake',
            title,
            examSlug: null,
            subjectSlug: session.subjectSlug,
            subjectName: session.subjectName,
            outcome,
            metaFor: (id) => {
              const question = bankRef.current.get(id);
              return {
                id,
                subjectSlug: question?.subjectSlug ?? session.subjectSlug,
                subjectName: question?.subjectName ?? session.subjectName,
                sourceTitle: question?.examTitle ?? '',
                examSlug: question?.examSlug ?? null,
              };
            },
          })
        }
      />
    );
  }

  if (status === 'loading') {
    return (
      <Card>
        <CardContent className="flex items-center gap-3 p-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Đang tải sổ tay câu sai…
        </CardContent>
      </Card>
    );
  }

  if (status === 'error') {
    return (
      <Card>
        <CardContent className="space-y-3 p-8">
          <p className="flex items-center gap-2 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            Không tải được ngân hàng câu hỏi.
          </p>
          <Button variant="outline" onClick={() => setReloadToken((token) => token + 1)}>
            Thử lại
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (entries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5">
              <CardTitle className="flex items-center gap-2 text-lg">
                <NotebookPen className="h-5 w-5 text-primary" aria-hidden="true" />
                Sổ tay đang trống
              </CardTitle>
              <CardDescription>
                Những câu bạn làm sai trong đề thi hoặc phiên luyện tập sẽ tự động được ghi vào
                đây. Trả lời đúng lại thì câu đó được gỡ khỏi sổ.
              </CardDescription>
            </div>
            <DogMascot className="h-20 w-20 shrink-0" />
          </div>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/de-thi">
              <Play aria-hidden="true" />
              Làm một đề
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/luyen-tap">Luyện theo chuyên đề</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">
                {entries.length} câu đang cần ôn
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Trả lời đúng trong phiên luyện tập, câu hỏi sẽ tự động được gỡ khỏi sổ.
              </p>
            </div>
            {confirmClear ? (
              <span className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/5 px-2 py-1 text-xs">
                Xoá hết?
                <button
                  type="button"
                  className="font-semibold text-destructive hover:underline"
                  onClick={() => {
                    clearMistakes();
                    setEntries([]);
                    setConfirmClear(false);
                  }}
                >
                  Xoá
                </button>
                <button
                  type="button"
                  className="text-muted-foreground hover:underline"
                  onClick={() => setConfirmClear(false)}
                >
                  Hủy
                </button>
              </span>
            ) : (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setConfirmClear(true)}
                className="text-muted-foreground"
              >
                <Trash2 aria-hidden="true" />
                Xoá tất cả
              </Button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Số câu mỗi phiên</span>
            {COUNT_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                disabled={option > visible.length}
                onClick={() => setCount(option)}
                aria-pressed={count === option && option <= visible.length}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                  count === option && option <= visible.length
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border text-muted-foreground hover:bg-secondary',
                  option > visible.length && 'cursor-not-allowed opacity-40',
                )}
              >
                {option} câu
              </button>
            ))}
            <button
              type="button"
              onClick={() => setCount('all')}
              aria-pressed={count === 'all' || count > visible.length}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                count === 'all' || count > visible.length
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border text-muted-foreground hover:bg-secondary',
              )}
            >
              Tất cả ({visible.length})
            </button>
            <Button
              type="button"
              size="sm"
              className="ml-auto"
              disabled={effective === 0}
              onClick={() => startSession(visible, effective)}
            >
              <Play aria-hidden="true" />
              Ôn {effective} câu
            </Button>
          </div>
        </CardContent>
      </Card>

      {subjects.length > 1 ? (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setFilter('')}
            aria-pressed={filter === ''}
            className={cn(
              'rounded-full border px-3.5 py-1.5 text-sm transition-colors',
              filter === ''
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border text-muted-foreground hover:bg-secondary',
            )}
          >
            Tất cả ({entries.length})
          </button>
          {subjects.map((item) => {
            const count = entries.filter((entry) => entry.subjectSlug === item.slug).length;

            return (
              <button
                key={item.slug}
                type="button"
                onClick={() => setFilter(item.slug)}
                aria-pressed={filter === item.slug}
                className={cn(
                  'rounded-full border px-3.5 py-1.5 text-sm transition-colors',
                  filter === item.slug
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border text-muted-foreground hover:bg-secondary',
                )}
              >
                {item.name} ({count})
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="space-y-3">
        {visible.map((entry) => {
          const { question } = entry;
          const correctKeys = getCorrectOptionKeys(question.correctAnswer);

          return (
            <details key={entry.id} className="group rounded-2xl border bg-card shadow-soft">
              <summary className="flex cursor-pointer list-none items-start gap-3 p-4 [&::-webkit-details-marker]:hidden">
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-1.5">
                    <Badge variant="secondary">{entry.subjectName}</Badge>
                    {question.topicName ? (
                      <span className="text-xs text-muted-foreground">{question.topicName}</span>
                    ) : null}
                    <Badge variant="accent">Sai {entry.wrongCount} lần</Badge>
                    <span className="text-xs text-muted-foreground">
                      · lần cuối {formatDate(entry.lastAt)}
                    </span>
                  </span>
                  <span className="mt-1.5 block text-sm leading-relaxed">
                    {toExcerpt(question.contentText, 190)}
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

                      return (
                        <li
                          key={option.key}
                          className={cn(
                            'flex items-start gap-3 rounded-lg border p-3 text-sm',
                            isCorrectOption
                              ? 'border-emerald-300 bg-emerald-50'
                              : 'bg-card',
                          )}
                        >
                          <span
                            className={cn(
                              'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-xs font-bold',
                              isCorrectOption
                                ? 'border-emerald-500 bg-emerald-500 text-white'
                                : 'bg-background text-muted-foreground',
                            )}
                            aria-hidden="true"
                          >
                            {option.key}
                          </span>
                          <span className="min-w-0 flex-1 leading-relaxed">{option.text}</span>
                        </li>
                      );
                    })}
                  </ul>
                ) : null}

                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                  <p className="flex items-center gap-2 text-sm font-semibold text-primary">
                    <Lightbulb className="h-4 w-4" aria-hidden="true" />
                    Lời giải
                  </p>
                  <div
                    className="article-content mt-2 text-sm"
                    dangerouslySetInnerHTML={{ __html: question.explanationHtml }}
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground">
                    Nguồn: {question.examTitle}
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoved(entry.id)}
                  >
                    <Trash2 aria-hidden="true" />
                    Xoá khỏi sổ tay
                  </Button>
                </div>
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
}
