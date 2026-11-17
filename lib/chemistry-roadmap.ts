import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import type { ChemistryRoadmap, RoadmapCatalog } from '@/lib/roadmap-types';

const text = z.string().trim().min(1);
const id = text.regex(/^[a-z0-9-]+$/);
const schema = z.object({
  version: z.literal(1),
  title: text,
  stages: z.array(z.object({
    id, title: text, level: text, description: text, target: text,
    lessonIds: z.array(id).min(1), checkpointIds: z.array(id).min(1),
  })).min(1),
  lessons: z.array(z.object({
    id, title: text, stageId: id, minutes: z.number().int().positive(),
    goal: text, theory: text, pitfall: text, recall: text,
    prerequisites: z.array(id), examSlugs: z.array(id),
    example: z.object({ question: text, steps: z.array(text).min(2) }),
    questions: z.array(z.object({
      id, lessonId: id, prompt: text, options: z.array(text).length(4),
      answer: z.number().int().min(0).max(3), explanation: text,
    })).length(3),
  })).min(1),
  diagnosticIds: z.array(id).min(1), finalIds: z.array(id).min(1),
  sources: z.array(z.object({ title: text, url: z.string().url(), note: text })).min(1),
});

let cached: ChemistryRoadmap | undefined;

// Chỉ đọc lúc build; không đưa toàn bộ lý thuyết vào bundle của các trang khác.
export function getChemistryRoadmap(): ChemistryRoadmap {
  if (cached) return cached;
  const raw: unknown = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'content/roadmaps/hoa-hoc-mat-goc.json'), 'utf8'));
  const data = schema.parse(raw);
  const lessons = new Map(data.lessons.map((lesson) => [lesson.id, lesson]));
  const questions = new Map(data.lessons.flatMap((lesson) => lesson.questions.map((question) => [question.id, question] as const)));
  const stageIds = new Set(data.stages.map((stage) => stage.id));
  if (lessons.size !== data.lessons.length || questions.size !== data.lessons.length * 3 || stageIds.size !== data.stages.length) {
    throw new Error('Lộ trình có mã bài/câu/chặng bị trùng');
  }
  data.lessons.forEach((lesson, index) => {
    if (!stageIds.has(lesson.stageId) || lesson.prerequisites.some((key) => !data.lessons.slice(0, index).some((prior) => prior.id === key))) {
      throw new Error(`Tham chiếu hoặc thứ tự tiên quyết không hợp lệ: ${lesson.id}`);
    }
    if (lesson.questions.some((q) => q.lessonId !== lesson.id || new Set(q.options).size !== 4)) {
      throw new Error(`Câu hỏi không hợp lệ trong ${lesson.id}`);
    }
    lesson.examSlugs.forEach((slug) => {
      if (!fs.existsSync(path.join(process.cwd(), 'content/exams', `${slug}.json`))) throw new Error(`Không có đề luyện thêm ${slug}`);
    });
    if (data.stages.filter((stage) => stage.lessonIds.includes(lesson.id)).length !== 1) throw new Error(`Bài phải thuộc đúng một chặng: ${lesson.id}`);
  });
  data.stages.forEach((stage) => {
    if (stage.lessonIds.some((key) => lessons.get(key)?.stageId !== stage.id) || stage.checkpointIds.some((key) => lessons.get(questions.get(key)?.lessonId ?? '')?.stageId !== stage.id)) {
      throw new Error(`Bài/câu kiểm tra không thuộc chặng ${stage.id}`);
    }
  });
  if ([...data.diagnosticIds, ...data.finalIds].some((key) => !questions.has(key))) throw new Error('Câu tự đánh giá không tồn tại');
  cached = data;
  return data;
}

export function getRoadmapCatalog(): RoadmapCatalog {
  const { lessons, ...rest } = getChemistryRoadmap();
  return {
    ...rest,
    lessons: lessons.map(({ id, title, stageId, minutes, goal }) => ({ id, title, stageId, minutes, goal })),
    questions: lessons.flatMap((lesson) => lesson.questions),
  };
}
