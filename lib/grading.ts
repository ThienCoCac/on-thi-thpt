// So khớp và mô tả đáp án thuần túy, dùng chung cho trang làm bài chấm tại máy.
import type { AnswerValue, QuestionType } from '@/lib/content-types';

export interface QuestionOption {
  key: string;
  text: string;
  imageUrl?: string | null;
}

export function isAnswerEmpty(value: AnswerValue): boolean {
  if (value === null) {
    return true;
  }
  if (Array.isArray(value)) {
    return value.length === 0;
  }
  return value.trim().length === 0;
}

export function normalizeText(value: string): string {
  return value.normalize('NFC').trim().toLowerCase().replace(/\s+/g, ' ');
}

function toList(value: AnswerValue): string[] {
  if (value === null) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

export function getCorrectOptionKeys(correctAnswer: string | string[]): string[] {
  return toList(correctAnswer)
    .map((item) => item.trim().toUpperCase())
    .filter((item) => item.length > 0);
}

function choiceKeys(value: AnswerValue): string[] {
  return toList(value)
    .map((item) => item.trim().toUpperCase())
    .filter((item) => item.length > 0);
}

// Trả về null với câu tự luận vì không chấm tự động được.
export function isAnswerCorrect(
  type: QuestionType,
  correctAnswer: string | string[],
  selected: AnswerValue,
): boolean | null {
  if (type === 'ESSAY') {
    return null;
  }

  if (isAnswerEmpty(selected)) {
    return false;
  }

  if (type === 'FILL_IN') {
    const expected = toList(correctAnswer).map((item) => item.trim()).filter(Boolean);
    const actual = normalizeText(Array.isArray(selected) ? selected.join(' ') : (selected ?? ''));
    return expected.some((item) => normalizeText(item) === actual);
  }

  const expectedKeys = getCorrectOptionKeys(correctAnswer).sort();
  const actualKeys = choiceKeys(selected).sort();

  return (
    expectedKeys.length === actualKeys.length &&
    expectedKeys.every((key, index) => key === actualKeys[index])
  );
}

export function describeAnswer(
  type: QuestionType,
  value: AnswerValue,
  options: QuestionOption[],
): string {
  if (isAnswerEmpty(value)) {
    return 'Chưa trả lời';
  }

  if (type === 'FILL_IN' || type === 'ESSAY') {
    return Array.isArray(value) ? value.join(', ') : (value ?? '');
  }

  return choiceKeys(value)
    .map((key) => {
      const option = options.find((item) => item.key.toUpperCase() === key);
      return option ? `${key}. ${option.text}` : key;
    })
    .join(' · ');
}

export function describeCorrectAnswer(
  type: QuestionType,
  correctAnswer: string | string[],
  options: QuestionOption[],
): string {
  if (type === 'FILL_IN' || type === 'ESSAY') {
    return toList(correctAnswer).join(' hoặc ');
  }

  return getCorrectOptionKeys(correctAnswer)
    .map((key) => {
      const option = options.find((item) => item.key.toUpperCase() === key);
      return option ? `${key}. ${option.text}` : key;
    })
    .join(' · ');
}
