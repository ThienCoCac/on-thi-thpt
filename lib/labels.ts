import type { Difficulty, ExamType, QuestionType } from '@/lib/content-types';

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  SINGLE_CHOICE: 'Một đáp án',
  MULTIPLE_CHOICE: 'Nhiều đáp án',
  TRUE_FALSE: 'Đúng / Sai',
  FILL_IN: 'Điền khuyết',
  ESSAY: 'Tự luận',
};

export const EXAM_TYPE_LABELS: Record<ExamType, string> = {
  FULL_EXAM: 'Đề full',
  TOPIC_TEST: 'Đề chuyên đề',
  MINI_TEST: 'Mini test',
};

export const EXAM_TYPE_OPTIONS: { value: ExamType; label: string }[] = (
  Object.keys(EXAM_TYPE_LABELS) as ExamType[]
).map((value) => ({ value, label: EXAM_TYPE_LABELS[value] }));

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  EASY: 'Dễ',
  MEDIUM: 'Trung bình',
  HARD: 'Khó',
  VERY_HARD: 'Rất khó',
};

export const DIFFICULTY_ORDER: Difficulty[] = ['EASY', 'MEDIUM', 'HARD', 'VERY_HARD'];

export const DIFFICULTY_BAR_CLASSES: Record<Difficulty, string> = {
  EASY: 'bg-emerald-500',
  MEDIUM: 'bg-primary',
  HARD: 'bg-accent',
  VERY_HARD: 'bg-destructive',
};

export const DIFFICULTY_DOT_CLASSES: Record<Difficulty, string> = {
  EASY: 'bg-emerald-500',
  MEDIUM: 'bg-primary',
  HARD: 'bg-accent',
  VERY_HARD: 'bg-destructive',
};
