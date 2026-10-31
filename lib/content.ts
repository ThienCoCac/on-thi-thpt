import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import type {
  BankQuestion,
  Difficulty,
  ExamContent,
  ExamDetail,
  ExamSummary,
  PracticeSubject,
  RunnerExam,
  RunnerQuestion,
  SubjectContent,
  SubjectRef,
  SubjectSummary,
  TopicContent,
} from '@/lib/content-types';
import { DIFFICULTY_ORDER } from '@/lib/labels';
import { renderMarkdown } from '@/lib/markdown';

// Toàn bộ nội dung nằm trong thư mục content/ và được kiểm tra kiểu khi build.
// Sửa nội dung bằng cách sửa file JSON rồi build lại, không cần cơ sở dữ liệu.

const CONTENT_DIR = path.join(process.cwd(), 'content');

// Đọc mọi file JSON trong content/<thư mục>/ để thêm đề/bài viết chỉ cần tạo file,
// không phải sửa code. Nội dung được đọc lúc build nên chạy dev cần khởi động lại sau khi sửa.
function readJsonFolder(folder: string): { label: string; value: unknown }[] {
  const dir = path.join(CONTENT_DIR, folder);

  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith('.json'))
    .sort()
    .map((name) => ({
      label: `content/${folder}/${name}`,
      value: JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8')) as unknown,
    }));
}

const subjectsValue = JSON.parse(
  fs.readFileSync(path.join(CONTENT_DIR, 'subjects.json'), 'utf8'),
) as unknown;

const isoDate = z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
  message: 'Ngày không hợp lệ (cần chuỗi ISO 8601)',
});

const optionSchema = z.object({
  key: z.string().trim().min(1),
  text: z.string(),
  imageUrl: z.string().nullish(),
});

const questionSchema = z.object({
  id: z.string().trim().min(1),
  partName: z.string().trim().min(1),
  topic: z.string().trim().min(1),
  type: z.enum(['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE', 'FILL_IN', 'ESSAY']),
  content: z.string().trim().min(1),
  options: z.array(optionSchema).default([]),
  correctAnswer: z.union([z.string().trim().min(1), z.array(z.string().trim().min(1)).min(1)]),
  explanation: z.string().trim().min(1),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD', 'VERY_HARD']),
  score: z.number().positive().default(1),
  tags: z.array(z.string()).default([]),
});

const subjectsSchema = z.object({
  subjects: z
    .array(
      z.object({
        id: z.string().trim().min(1),
        name: z.string().trim().min(1),
        slug: z.string().trim().min(1),
        description: z.string(),
        order: z.number().int().default(0),
        topics: z.array(
          z.object({
            id: z.string().trim().min(1),
            name: z.string().trim().min(1),
            slug: z.string().trim().min(1),
            description: z.string(),
            order: z.number().int().default(0),
          }),
        ),
      }),
    )
    .min(1),
});

const examSchema = z.object({
  id: z.string().trim().min(1),
  title: z.string().trim().min(1),
  slug: z.string().trim().min(1),
  description: z.string(),
  subject: z.string().trim().min(1),
  type: z.enum(['FULL_EXAM', 'TOPIC_TEST', 'MINI_TEST']),
  durationMinutes: z.number().int().positive(),
  totalScore: z.number().positive(),
  examYear: z.number().int().nullish().transform((value) => value ?? null),
  examCode: z.string().nullish().transform((value) => value ?? null),
  isFree: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  publishedAt: isoDate,
  updatedAt: isoDate,
  questions: z.array(questionSchema).min(1),
});

function parseContent<TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  value: unknown,
  label: string,
): z.infer<TSchema> {
  const result = schema.safeParse(value);
  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `${issue.path.join('.') || '(gốc)'}: ${issue.message}`)
      .join('; ');
    throw new Error(`Nội dung ${label} không hợp lệ — ${details}`);
  }
  return result.data;
}

const subjectContents: SubjectContent[] = parseContent(
  subjectsSchema,
  subjectsValue,
  'content/subjects.json',
).subjects;

const examContents: ExamContent[] = readJsonFolder('exams').map(({ label, value }) =>
  parseContent(examSchema, value, label),
);

const subjectBySlug = new Map(subjectContents.map((subject) => [subject.slug, subject]));

interface TopicInfo {
  topic: TopicContent;
  subject: SubjectRef;
}

const topicById = new Map<string, TopicInfo>();
for (const subject of subjectContents) {
  for (const topic of subject.topics) {
    topicById.set(topic.id, { topic, subject: { name: subject.name, slug: subject.slug } });
  }
}

function requireSubjectRef(slug: string): SubjectRef {
  const subject = subjectBySlug.get(slug);
  if (!subject) {
    throw new Error(`Không tìm thấy môn học "${slug}" trong content/subjects.json`);
  }
  return { name: subject.name, slug: subject.slug };
}

// Kiểm tra chéo để lỗi tham chiếu lộ ra ngay khi build thay vì hiển thị trống.
for (const exam of examContents) {
  requireSubjectRef(exam.subject);
  for (const question of exam.questions) {
    if (!topicById.has(question.topic)) {
      throw new Error(
        `Câu hỏi ${question.id} tham chiếu chuyên đề "${question.topic}" không tồn tại`,
      );
    }
  }
}

const examBySlug = new Map(examContents.map((exam) => [exam.slug, exam]));

const sortedExams = [...examContents].sort(
  (a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt),
);

const DIFFICULTY_WEIGHT: Record<Difficulty, number> = {
  EASY: 1,
  MEDIUM: 2,
  HARD: 3,
  VERY_HARD: 4,
};

function averageDifficulty(exam: ExamContent): Difficulty {
  if (exam.questions.length === 0) {
    return 'MEDIUM';
  }

  const total = exam.questions.reduce(
    (sum, question) => sum + DIFFICULTY_WEIGHT[question.difficulty],
    0,
  );
  const level = Math.min(4, Math.max(1, Math.round(total / exam.questions.length)));

  return DIFFICULTY_ORDER[level - 1];
}

function toExamSummary(exam: ExamContent): ExamSummary {
  return {
    id: exam.id,
    title: exam.title,
    slug: exam.slug,
    description: exam.description,
    type: exam.type,
    durationMinutes: exam.durationMinutes,
    totalScore: exam.totalScore,
    examYear: exam.examYear ?? null,
    examCode: exam.examCode ?? null,
    isFree: exam.isFree,
    isFeatured: exam.isFeatured,
    publishedAt: new Date(exam.publishedAt),
    updatedAt: new Date(exam.updatedAt),
    subject: requireSubjectRef(exam.subject),
    questionCount: exam.questions.length,
    difficulty: averageDifficulty(exam),
  };
}

export function listSubjects(): SubjectSummary[] {
  return subjectContents.map((subject) => ({
    id: subject.id,
    name: subject.name,
    slug: subject.slug,
    description: subject.description,
    examCount: examContents.filter((exam) => exam.subject === subject.slug).length,
    topicCount: subject.topics.length,
  }));
}

export function listExams(): ExamSummary[] {
  return sortedExams.map(toExamSummary);
}

export function listFeaturedExams(limit = 3): ExamSummary[] {
  return sortedExams
    .filter((exam) => exam.isFeatured)
    .slice(0, limit)
    .map(toExamSummary);
}

export function listLatestExams(limit = 4): ExamSummary[] {
  return sortedExams.slice(0, limit).map(toExamSummary);
}

export function listExamYears(): number[] {
  const years = new Set<number>();
  for (const exam of examContents) {
    if (exam.examYear) {
      years.add(exam.examYear);
    }
  }
  return Array.from(years).sort((a, b) => b - a);
}

export function getExamBySlug(slug: string): ExamDetail | null {
  const exam = examBySlug.get(slug);

  if (!exam) {
    return null;
  }

  const parts: { name: string; questionCount: number; score: number }[] = [];
  const partIndex = new Map<string, (typeof parts)[number]>();
  const difficultyCounts = new Map<string, number>();
  const topicCounts = new Map<string, { name: string; slug: string; count: number }>();

  for (const question of exam.questions) {
    const part = partIndex.get(question.partName) ?? {
      name: question.partName,
      questionCount: 0,
      score: 0,
    };
    part.questionCount += 1;
    part.score = Math.round((part.score + question.score) * 100) / 100;
    if (!partIndex.has(question.partName)) {
      partIndex.set(question.partName, part);
      parts.push(part);
    }

    difficultyCounts.set(
      question.difficulty,
      (difficultyCounts.get(question.difficulty) ?? 0) + 1,
    );

    const info = topicById.get(question.topic);
    if (info) {
      const existing = topicCounts.get(info.topic.slug) ?? {
        name: info.topic.name,
        slug: info.topic.slug,
        count: 0,
      };
      existing.count += 1;
      topicCounts.set(info.topic.slug, existing);
    }
  }

  const topics = Array.from(topicCounts.values()).sort(
    (a, b) => b.count - a.count || a.name.localeCompare(b.name, 'vi'),
  );

  return {
    ...toExamSummary(exam),
    parts,
    difficulties: DIFFICULTY_ORDER.map((key) => ({
      key,
      count: difficultyCounts.get(key) ?? 0,
    })),
    topics,
  };
}

function toRunnerQuestion(
  question: ExamContent['questions'][number],
  index: number,
): RunnerQuestion {
  return {
    id: question.id,
    order: index + 1,
    partName: question.partName,
    type: question.type,
    contentHtml: renderMarkdown(question.content),
    imageUrl: null,
    score: question.score,
    options: question.options.map((option) => ({
      key: option.key.toUpperCase(),
      text: option.text,
      imageUrl: option.imageUrl ?? null,
    })),
    correctAnswer: question.correctAnswer,
    explanationHtml: renderMarkdown(question.explanation),
    difficulty: question.difficulty,
    topicName: topicById.get(question.topic)?.topic.name ?? null,
    tags: question.tags,
  };
}

export function getRunnerExam(slug: string): RunnerExam | null {
  const exam = examBySlug.get(slug);

  if (!exam) {
    return null;
  }

  const subject = requireSubjectRef(exam.subject);

  return {
    id: exam.id,
    title: exam.title,
    slug: exam.slug,
    subjectName: subject.name,
    subjectSlug: subject.slug,
    durationMinutes: exam.durationMinutes,
    totalScore: exam.totalScore,
    questions: exam.questions.map(toRunnerQuestion),
  };
}

// Ngân hàng câu hỏi gộp toàn bộ đề, xuất thành một file JSON tĩnh để trang luyện tập
// và sổ tay câu sai tải khi cần thay vì nhúng vào bundle của mọi trang.
export function getPracticeBank(): BankQuestion[] {
  const bank: BankQuestion[] = [];

  for (const exam of sortedExams) {
    const subject = requireSubjectRef(exam.subject);

    exam.questions.forEach((question, index) => {
      bank.push({
        ...toRunnerQuestion(question, index),
        contentText: question.content,
        examSlug: exam.slug,
        examTitle: exam.title,
        subjectSlug: subject.slug,
        subjectName: subject.name,
        topicId: question.topic,
      });
    });
  }

  return bank;
}

export function getPracticeCatalog(): PracticeSubject[] {
  return [...subjectContents]
    .sort((a, b) => a.order - b.order)
    .map((subject) => {
      const exams = examContents.filter((exam) => exam.subject === subject.slug);
      const questionCount = exams.reduce((sum, exam) => sum + exam.questions.length, 0);

      return {
        slug: subject.slug,
        name: subject.name,
        questionCount,
        topics: subject.topics
          .map((topic) => ({
            id: topic.id,
            name: topic.name,
            slug: topic.slug,
            count: exams.reduce(
              (sum, exam) =>
                sum + exam.questions.filter((question) => question.topic === topic.id).length,
              0,
            ),
          }))
          .filter((topic) => topic.count > 0),
      };
    })
    .filter((subject) => subject.questionCount > 0);
}

export function getContentStats(): {
  exams: number;
  questions: number;
} {
  const questionIds = new Set<string>();
  for (const exam of examContents) {
    for (const question of exam.questions) {
      questionIds.add(question.id);
    }
  }

  return {
    exams: examContents.length,
    questions: questionIds.size,
  };
}
