import { z } from 'zod';

// Sổ tay công thức: mỗi công thức có điều kiện/bẫy (notes), ví dụ từng bước (example)
// và một phép tính máy kiểm chứng được (check) để đáp số ví dụ không bao giờ lệch số liệu.
const text = z.string().trim().min(1);
const id = text.regex(/^[a-z0-9-]+$/);

export const formulaCheckSchema = z.object({
  // Biểu thức chỉ gồm số, + - * / ^ ( ) . và các hàm pi, e, sqrt, abs, sin, cos, tan, ln, log, exp.
  expression: text,
  value: z.number().finite(),
  tolerance: z.number().positive().optional(),
});

export const formulaExampleSchema = z.object({
  prompt: text,
  steps: z.array(text).min(2),
  answer: text,
});

export const formulaSchema = z.object({
  id,
  name: text,
  // TeX thô, không bọc $$ — giao diện tự bọc khi render.
  latex: text,
  keywords: z.array(text).min(1),
  notes: z.array(text).min(1),
  example: formulaExampleSchema,
  check: formulaCheckSchema.optional(),
});

export const formulaTopicSchema = z.object({
  id,
  title: text,
  gradeNote: text,
  formulas: z.array(formulaSchema).min(1),
});

export const formulaBookMetaSchema = z.object({
  version: z.literal(1),
  subject: z.literal('toan'),
  title: text,
  intro: text,
  scopeNote: text,
  limits: z.array(text).min(1),
  sources: z.array(z.object({ label: text, url: z.string().url() })).min(1),
  // Tên file chủ đề (không đuôi .json) trong content/cong-thuc/toan/, theo thứ tự hiển thị.
  topics: z.array(text.regex(/^\d{2}-[a-z0-9-]+$/)).min(1),
});

export type FormulaCheck = z.infer<typeof formulaCheckSchema>;
export type FormulaExample = z.infer<typeof formulaExampleSchema>;
export type Formula = z.infer<typeof formulaSchema>;
export type FormulaTopic = z.infer<typeof formulaTopicSchema>;
export type FormulaBookMeta = z.infer<typeof formulaBookMetaSchema>;

export interface MathFormulaBook {
  meta: FormulaBookMeta;
  topics: FormulaTopic[];
}