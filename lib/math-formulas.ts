import fs from 'node:fs';
import path from 'node:path';
import { renderToString } from 'katex';
import {
  formulaBookMetaSchema,
  formulaTopicSchema,
  type Formula,
  type FormulaTopic,
  type MathFormulaBook,
} from '@/lib/formula-types';
import { checkMatchesValue } from '@/lib/formula-check';

const CONTENT_DIR = 'content/cong-thuc/toan';

// Giống quy tắc tách công thức của lib/markdown.ts: $ mở không theo sau khoảng trắng,
// $ đóng không đứng sau khoảng trắng. Dùng để soi mọi mảnh $...$ trong ghi chú/ví dụ lúc build.
const INLINE_MATH = /(?<![\\$])\$(?![\s$])([^$\n]+?)(?<![\\\s])\$(?!\$)/g;

function assertTex(tex: string, displayMode: boolean, where: string): void {
  try {
    // throwOnError=true để công thức lỗi làm hỏng build ngay, không lọt ra trang công khai.
    renderToString(tex, { throwOnError: true, displayMode, output: 'html', strict: false, trust: false });
  } catch (error) {
    throw new Error(`Công thức KaTeX lỗi tại ${where}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function assertInlineMath(text: string, where: string): void {
  for (const match of text.matchAll(INLINE_MATH)) {
    assertTex(match[1].trim(), false, where);
  }
  // Số lượng $ lẻ nghĩa là có công thức mở mà không đóng (trừ khi là $$ khối, không dùng trong văn bản).
  const dollars = (text.match(/\$/g) ?? []).length;
  if (dollars % 2 !== 0) throw new Error(`Số ký tự $ lẻ (công thức chưa đóng) tại ${where}`);
}

function validateFormula(formula: Formula, topicId: string): void {
  const where = `${topicId}/${formula.id}`;
  assertTex(formula.latex, true, where);
  formula.notes.forEach((note, index) => assertInlineMath(note, `${where} ghi chú ${index + 1}`));
  assertInlineMath(formula.example.prompt, `${where} dẫn ví dụ`);
  formula.example.steps.forEach((step, index) => assertInlineMath(step, `${where} bước ${index + 1}`));
  assertInlineMath(formula.example.answer, `${where} đáp số`);
  if (formula.check && !checkMatchesValue(formula.check)) {
    throw new Error(`Phép tính kiểm chứng lệch đáp số tại ${where}: ${formula.check.expression} ≠ ${formula.check.value}`);
  }
}

let cached: MathFormulaBook | undefined;

// Chỉ đọc lúc build; dữ liệu sổ tay không đi vào bundle của các trang khác.
export function getMathFormulaBook(): MathFormulaBook {
  if (cached) return cached;
  const root = process.cwd();
  const metaRaw: unknown = JSON.parse(fs.readFileSync(path.join(root, 'content/cong-thuc/toan.json'), 'utf8'));
  const meta = formulaBookMetaSchema.parse(metaRaw);

  // Thư mục chủ đề phải khớp đúng danh sách khai trong meta, không thừa không thiếu.
  const dir = path.join(root, CONTENT_DIR);
  const filesOnDisk = fs.readdirSync(dir).filter((name) => name.endsWith('.json')).map((name) => name.slice(0, -5)).sort();
  const declared = [...meta.topics].sort();
  if (filesOnDisk.length !== declared.length || filesOnDisk.some((name, index) => name !== declared[index])) {
    throw new Error('Danh sách chủ đề trong toan.json không khớp các file trong content/cong-thuc/toan/');
  }

  const topics: FormulaTopic[] = meta.topics.map((name) => {
    const raw: unknown = JSON.parse(fs.readFileSync(path.join(dir, `${name}.json`), 'utf8'));
    return formulaTopicSchema.parse(raw);
  });

  const topicIds = new Set(topics.map((topic) => topic.id));
  if (topicIds.size !== topics.length) throw new Error('Sổ tay công thức có mã chủ đề bị trùng');
  const formulaIds = new Set<string>();
  topics.forEach((topic) => {
    topic.formulas.forEach((formula) => {
      if (formulaIds.has(formula.id)) throw new Error(`Mã công thức bị trùng: ${formula.id}`);
      formulaIds.add(formula.id);
      validateFormula(formula, topic.id);
    });
  });

  cached = { meta, topics };
  return cached;
}