// Lưu lịch sử làm bài và sổ tay câu sai ngay trên thiết bị (localStorage).
// Site không có tài khoản nên toàn bộ tiến độ chỉ nằm trong trình duyệt của người học.

import type { PracticeOutcome } from '@/lib/content-types';

export type AttemptKind = 'exam' | 'practice' | 'random' | 'mistake';

export interface AttemptSummary {
  id: string;
  kind: AttemptKind;
  title: string;
  examSlug: string | null;
  subjectSlug: string;
  subjectName: string;
  submittedAt: string;
  score: number;
  maxScore: number;
  correctCount: number;
  gradedCount: number;
  questionCount: number;
  durationSeconds: number;
}

export interface MistakeMeta {
  id: string;
  subjectSlug: string;
  subjectName: string;
  sourceTitle: string;
  examSlug?: string | null;
}

export interface MistakeEntry extends MistakeMeta {
  wrongCount: number;
  lastAt: string;
}

const HISTORY_KEY = 'onthithpt:history:v1';
const MISTAKES_KEY = 'onthithpt:mistakes:v1';
const SEEN_KEY = 'onthithpt:seen:v1';
const HISTORY_LIMIT = 100;
const MISTAKE_LIMIT = 600;

function hasStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function readJson<T>(key: string, fallback: T): T {
  if (!hasStorage()) {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  if (!hasStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage đầy hoặc bị chặn: bỏ qua, người học vẫn làm bài bình thường.
  }
}

function isAttempt(value: unknown): value is AttemptSummary {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const item = value as Partial<AttemptSummary>;
  return (
    typeof item.id === 'string' &&
    typeof item.title === 'string' &&
    typeof item.submittedAt === 'string' &&
    typeof item.subjectSlug === 'string' &&
    typeof item.correctCount === 'number' &&
    typeof item.questionCount === 'number'
  );
}

export function loadHistory(): AttemptSummary[] {
  const parsed = readJson<unknown>(HISTORY_KEY, []);
  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed
    .filter(isAttempt)
    .sort((a, b) => Date.parse(b.submittedAt) - Date.parse(a.submittedAt));
}

export function saveAttempt(attempt: Omit<AttemptSummary, 'id' | 'submittedAt'> & {
  submittedAt?: string;
}): void {
  const history = loadHistory();
  const next: AttemptSummary = {
    ...attempt,
    id: `${attempt.kind}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    submittedAt: attempt.submittedAt ?? new Date().toISOString(),
  };

  writeJson(HISTORY_KEY, [next, ...history].slice(0, HISTORY_LIMIT));
}

export function clearHistory(): void {
  if (!hasStorage()) {
    return;
  }

  try {
    window.localStorage.removeItem(HISTORY_KEY);
  } catch {
    // Không xóa được thì thôi.
  }
}

export function loadMistakeMap(): Record<string, MistakeEntry> {
  const parsed = readJson<unknown>(MISTAKES_KEY, {});
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return {};
  }

  const map: Record<string, MistakeEntry> = {};
  for (const [id, value] of Object.entries(parsed as Record<string, unknown>)) {
    if (!value || typeof value !== 'object') {
      continue;
    }
    const item = value as Partial<MistakeEntry>;
    if (
      typeof item.subjectSlug === 'string' &&
      typeof item.subjectName === 'string' &&
      typeof item.lastAt === 'string'
    ) {
      map[id] = {
        id,
        subjectSlug: item.subjectSlug,
        subjectName: item.subjectName,
        sourceTitle: typeof item.sourceTitle === 'string' ? item.sourceTitle : '',
        examSlug: typeof item.examSlug === 'string' ? item.examSlug : null,
        wrongCount: typeof item.wrongCount === 'number' ? item.wrongCount : 1,
        lastAt: item.lastAt,
      };
    }
  }

  return map;
}

export function loadMistakes(): MistakeEntry[] {
  return Object.values(loadMistakeMap()).sort(
    (a, b) => Date.parse(b.lastAt) - Date.parse(a.lastAt),
  );
}

export function noteWrong(items: MistakeMeta[]): void {
  if (items.length === 0) {
    return;
  }

  const map = loadMistakeMap();
  const now = new Date().toISOString();

  for (const item of items) {
    const existing = map[item.id];
    map[item.id] = {
      ...item,
      wrongCount: (existing?.wrongCount ?? 0) + 1,
      lastAt: now,
    };
  }

  const trimmed = Object.values(map)
    .sort((a, b) => Date.parse(b.lastAt) - Date.parse(a.lastAt))
    .slice(0, MISTAKE_LIMIT);

  writeJson(
    MISTAKES_KEY,
    Object.fromEntries(trimmed.map((entry) => [entry.id, entry])),
  );
}

// Trả lời đúng một câu đã từng sai thì coi như đã khắc phục và gỡ khỏi sổ tay.
export function noteMastered(ids: string[]): void {
  if (ids.length === 0) {
    return;
  }

  const map = loadMistakeMap();
  let changed = false;

  for (const id of ids) {
    if (map[id]) {
      delete map[id];
      changed = true;
    }
  }

  if (changed) {
    writeJson(MISTAKES_KEY, map);
  }
}

export function removeMistake(id: string): void {
  const map = loadMistakeMap();
  if (map[id]) {
    delete map[id];
    writeJson(MISTAKES_KEY, map);
  }
}

export function clearMistakes(): void {
  if (!hasStorage()) {
    return;
  }

  try {
    window.localStorage.removeItem(MISTAKES_KEY);
  } catch {
    // Không xóa được thì thôi.
  }
}

// Đếm số lần mỗi câu đã được bốc vào phiên ngẫu nhiên, để các phiên sau
// ưu tiên câu chưa gặp thay vì lặp lại những câu vừa làm.
export function loadSeenCounts(): Record<string, number> {
  const parsed = readJson<unknown>(SEEN_KEY, {});
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return {};
  }

  const counts: Record<string, number> = {};
  for (const [id, value] of Object.entries(parsed as Record<string, unknown>)) {
    if (typeof value === 'number' && value > 0) {
      counts[id] = value;
    }
  }

  return counts;
}

export function markQuestionsSeen(ids: string[]): void {
  if (ids.length === 0) {
    return;
  }

  const counts = loadSeenCounts();
  for (const id of ids) {
    counts[id] = (counts[id] ?? 0) + 1;
  }

  writeJson(SEEN_KEY, counts);
}

export interface PracticeRecordInput {
  kind: 'practice' | 'random' | 'mistake';
  title: string;
  examSlug?: string | null;
  subjectSlug: string;
  subjectName: string;
  outcome: PracticeOutcome;
  metaFor: (questionId: string) => MistakeMeta;
}

// Một phiên luyện tập vừa ghi lịch sử vừa cập nhật sổ tay câu sai:
// câu sai được thêm vào, câu trả lời đúng được gỡ khỏi sổ tay.
export function recordPracticeResult(input: PracticeRecordInput): void {
  const graded = input.outcome.items.filter((item) => item.isCorrect !== null);
  const correct = input.outcome.items.filter((item) => item.isCorrect === true);
  const wrong = input.outcome.items.filter((item) => item.isCorrect === false);
  const durationSeconds = Math.max(
    1,
    Math.round((input.outcome.finishedAt - input.outcome.startedAt) / 1000),
  );

  saveAttempt({
    kind: input.kind,
    title: input.title,
    examSlug: input.examSlug ?? null,
    subjectSlug: input.subjectSlug,
    subjectName: input.subjectName,
    score: correct.length,
    maxScore: graded.length,
    correctCount: correct.length,
    gradedCount: graded.length,
    questionCount: input.outcome.items.length,
    durationSeconds,
  });

  noteWrong(wrong.map((item) => input.metaFor(item.question.id)));
  noteMastered(correct.map((item) => item.question.id));
}

export function dayKey(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${date.getFullYear()}-${month}-${day}`;
}

function shiftDay(key: string, days: number): string {
  const [year, month, day] = key.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);

  return dayKey(date);
}

export function computeStreak(history: AttemptSummary[]): {
  current: number;
  best: number;
  activeDays: number;
} {
  const days = new Set(history.map((attempt) => dayKey(attempt.submittedAt)));

  if (days.size === 0) {
    return { current: 0, best: 0, activeDays: 0 };
  }

  const today = dayKey(new Date());
  let cursor = days.has(today) ? today : shiftDay(today, -1);
  let current = 0;
  while (days.has(cursor)) {
    current += 1;
    cursor = shiftDay(cursor, -1);
  }

  const sorted = Array.from(days).sort();
  let best = 1;
  let run = 1;
  for (let index = 1; index < sorted.length; index += 1) {
    run = shiftDay(sorted[index - 1], 1) === sorted[index] ? run + 1 : 1;
    best = Math.max(best, run);
  }

  return { current, best, activeDays: days.size };
}
