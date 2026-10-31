'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  CalendarCheck,
  Flame,
  LineChart,
  ListChecks,
  NotebookPen,
  Play,
  Target,
  Trash2,
  Trophy,
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
import { formatDateTime, formatScore, formatTimeSpent } from '@/lib/format';
import {
  clearHistory,
  computeStreak,
  dayKey,
  loadHistory,
  loadMistakes,
  type AttemptKind,
  type AttemptSummary,
} from '@/lib/progress';
import { cn } from '@/lib/utils';

const KIND_LABELS: Record<AttemptKind, string> = {
  exam: 'Đề thi',
  practice: 'Luyện tập',
  random: 'Luyện ngẫu nhiên',
  mistake: 'Ôn câu sai',
};

interface DayBucket {
  key: string;
  label: string;
  count: number;
}

function buildDayBuckets(history: AttemptSummary[]): DayBucket[] {
  const counts = new Map<string, number>();
  for (const attempt of history) {
    const key = dayKey(attempt.submittedAt);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const today = new Date();
  const buckets: DayBucket[] = [];

  for (let offset = 13; offset >= 0; offset -= 1) {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - offset);
    const key = dayKey(date);
    buckets.push({
      key,
      label: `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`,
      count: counts.get(key) ?? 0,
    });
  }

  return buckets;
}

export function ProgressDashboard() {
  const [history, setHistory] = useState<AttemptSummary[]>([]);
  const [mistakeCount, setMistakeCount] = useState(0);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    setHistory(loadHistory());
    setMistakeCount(loadMistakes().length);
  }, []);

  const stats = useMemo(() => {
    const graded = history.reduce((sum, attempt) => sum + attempt.gradedCount, 0);
    const correct = history.reduce((sum, attempt) => sum + attempt.correctCount, 0);
    const distinct = new Set(history.map((attempt) => attempt.examSlug ?? attempt.title)).size;
    const streak = computeStreak(history);

    return {
      attempts: history.length,
      distinct,
      graded,
      correct,
      accuracy: graded > 0 ? Math.round((correct / graded) * 100) : 0,
      streak,
    };
  }, [history]);

  const days = useMemo(() => buildDayBuckets(history), [history]);
  const maxDay = Math.max(1, ...days.map((day) => day.count));

  const subjectRows = useMemo(() => {
    const map = new Map<
      string,
      { name: string; attempts: number; correct: number; graded: number }
    >();

    for (const attempt of history) {
      const row = map.get(attempt.subjectSlug) ?? {
        name: attempt.subjectName,
        attempts: 0,
        correct: 0,
        graded: 0,
      };
      row.attempts += 1;
      row.correct += attempt.correctCount;
      row.graded += attempt.gradedCount;
      map.set(attempt.subjectSlug, row);
    }

    return Array.from(map.entries())
      .map(([slug, row]) => ({
        slug,
        ...row,
        accuracy: row.graded > 0 ? Math.round((row.correct / row.graded) * 100) : 0,
      }))
      .sort((a, b) => b.attempts - a.attempts);
  }, [history]);

  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <LineChart className="h-5 w-5 text-primary" aria-hidden="true" />
            Chưa có dữ liệu tiến độ
          </CardTitle>
          <CardDescription>
            Mọi lượt làm đề và luyện tập được lưu tự động trên thiết bị này, không cần đăng
            nhập. Hãy bắt đầu bằng một đề hoặc một phiên luyện tập.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/de-thi">
              <Play aria-hidden="true" />
              Làm đề đầu tiên
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
    <div className="space-y-6">
      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card p-4">
          <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ListChecks className="h-3.5 w-3.5" aria-hidden="true" />
            Lượt làm bài
          </dt>
          <dd className="mt-1.5 text-2xl font-bold">{stats.attempts}</dd>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {stats.distinct} đề/phiên khác nhau
          </p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Target className="h-3.5 w-3.5" aria-hidden="true" />
            Độ chính xác trung bình
          </dt>
          <dd className="mt-1.5 text-2xl font-bold">{stats.accuracy}%</dd>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {stats.correct}/{stats.graded} câu đúng
          </p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Flame className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
            Chuỗi ngày học
          </dt>
          <dd className="mt-1.5 text-2xl font-bold">{stats.streak.current} ngày</dd>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Kỷ lục {stats.streak.best} ngày · {stats.streak.activeDays} ngày có làm bài
          </p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <NotebookPen className="h-3.5 w-3.5" aria-hidden="true" />
            Câu cần ôn
          </dt>
          <dd className="mt-1.5 text-2xl font-bold">{mistakeCount}</dd>
          <Link href="/cau-sai" className="mt-0.5 inline-block text-xs text-primary hover:underline">
            Mở sổ tay câu sai
          </Link>
        </div>
      </dl>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarCheck className="h-4 w-4 text-primary" aria-hidden="true" />
              Hoạt động 14 ngày gần nhất
            </CardTitle>
            <CardDescription>Số lượt làm bài mỗi ngày.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-32 items-end gap-1.5" role="img" aria-label="Biểu đồ lượt làm bài 14 ngày gần nhất">
              {days.map((day) => (
                <div key={day.key} className="flex h-full min-w-0 flex-1 flex-col justify-end">
                  <div
                    title={`${day.label}: ${day.count} lượt`}
                    className={cn(
                      'w-full rounded-t-sm transition-[height]',
                      day.count > 0 ? 'bg-primary' : 'bg-muted',
                    )}
                    style={{
                      height: `${day.count > 0 ? Math.max(8, (day.count / maxDay) * 100) : 3}%`,
                    }}
                  />
                </div>
              ))}
            </div>
            <div className="mt-2 flex gap-1.5 text-[10px] text-muted-foreground">
              {days.map((day, index) => (
                <span key={day.key} className="min-w-0 flex-1 text-center">
                  <span className={index % 2 === 0 ? undefined : 'hidden sm:inline'}>
                    {day.label}
                  </span>
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="min-w-0 lg:sticky lg:top-20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy className="h-4 w-4 text-accent" aria-hidden="true" />
              Theo môn học
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {subjectRows.map((row) => (
                <li key={row.slug}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{row.name}</span>
                    <span className="text-muted-foreground">{row.accuracy}%</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${row.accuracy}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {row.attempts} lượt · {row.correct}/{row.graded} câu đúng
                  </p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row flex-wrap items-center justify-between gap-3 space-y-0">
          <div>
            <CardTitle className="text-base">Lịch sử làm bài</CardTitle>
            <CardDescription>10 lượt gần nhất trên thiết bị này.</CardDescription>
          </div>
          {confirmClear ? (
            <span className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/5 px-2 py-1 text-xs">
              Xoá toàn bộ lịch sử?
              <button
                type="button"
                className="font-semibold text-destructive hover:underline"
                onClick={() => {
                  clearHistory();
                  setHistory([]);
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
              size="sm"
              className="text-muted-foreground"
              onClick={() => setConfirmClear(true)}
            >
              <Trash2 aria-hidden="true" />
              Xoá lịch sử
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <ul className="divide-y">
            {history.slice(0, 10).map((attempt) => {
              const accuracy =
                attempt.gradedCount > 0
                  ? Math.round((attempt.correctCount / attempt.gradedCount) * 100)
                  : 0;

              return (
                <li
                  key={attempt.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge variant="outline">{KIND_LABELS[attempt.kind]}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {attempt.subjectName}
                      </span>
                    </div>
                    {attempt.examSlug ? (
                      <Link
                        href={`/de-thi/${attempt.examSlug}`}
                        className="mt-1 block truncate font-medium hover:text-primary"
                      >
                        {attempt.title}
                      </Link>
                    ) : (
                      <p className="mt-1 truncate font-medium">{attempt.title}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(attempt.submittedAt)} ·{' '}
                      {formatTimeSpent(attempt.durationSeconds)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold tabular-nums">
                      {formatScore(attempt.correctCount)}/{formatScore(attempt.gradedCount)}
                      <span className="ml-1 text-xs font-normal text-muted-foreground">
                        câu
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">{accuracy}%</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
