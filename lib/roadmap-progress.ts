import { z } from 'zod';

export const ROADMAP_KEY = 'on-thi-thpt:hoa-mat-goc:v1';
export const ROADMAP_PATH = '/lo-trinh/hoa-hoc-mat-goc';
const record = z.object({
  best: z.number().int().min(0).max(3),
  latest: z.number().int().min(0).max(3),
  attempts: z.number().int().min(1),
  masteredAt: z.number().nonnegative().nullable(),
  dueAt: z.number().nonnegative().nullable(),
  reviewStep: z.number().int().min(0).max(3),
});
export const roadmapProgressSchema = z.object({
  version: z.literal(1),
  pace: z.union([z.literal(1), z.literal(2), z.literal(4)]),
  lessons: z.record(record),
  assessments: z.record(z.object({ score: z.number().int().nonnegative(), total: z.number().int().positive(), at: z.number().nonnegative() }).refine((v) => v.score <= v.total)),
  notes: z.record(z.string().max(3000)),
});
export type RoadmapProgress = z.infer<typeof roadmapProgressSchema>;
export function emptyRoadmapProgress(): RoadmapProgress {
  return { version: 1, pace: 2, lessons: {}, assessments: {}, notes: {} };
}

// Một lần đạt 3/3 ghi nhận đã đạt; lần ôn chưa đạt vẫn hiện rõ và đưa vào hàng ôn.
export function recordLesson(progress: RoadmapProgress, id: string, score: number, now = Date.now()): RoadmapProgress {
  if (!Number.isInteger(score) || score < 0 || score > 3) throw new Error('Điểm bài học ngoài khoảng 0–3');
  const previous = progress.lessons[id];
  const passed = score === 3;
  const wasDue = previous?.dueAt != null && previous.dueAt <= now;
  const step = passed && previous?.masteredAt != null && wasDue ? Math.min(3, previous.reviewStep + 1) : previous?.reviewStep ?? 0;
  const intervals = [1, 3, 7, 14];
  const dueAt = passed
    ? (previous?.latest === 3 && previous.dueAt != null && !wasDue ? previous.dueAt : now + intervals[step] * 86_400_000)
    : now;
  return {
    ...progress,
    lessons: { ...progress.lessons, [id]: {
      best: Math.max(previous?.best ?? 0, score), latest: score,
      attempts: (previous?.attempts ?? 0) + 1,
      masteredAt: passed ? previous?.masteredAt ?? now : previous?.masteredAt ?? null,
      dueAt, reviewStep: passed ? step : 0,
    } },
  };
}
