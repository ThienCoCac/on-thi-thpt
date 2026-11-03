// Kiểm tra nhanh một (hoặc nhiều) file đề trong content/exams/ mà không cần mở trình duyệt.
//   node scripts/check-exam.mjs content/exams/de-toan-tn-2026-m101.json
//   node scripts/check-exam.mjs --all          # soát toàn bộ 49 đề
//   node scripts/check-exam.mjs                # tự lấy danh sách file đề vừa sửa theo git diff
// EXIT 0 khi không có LỖI; cảnh báo (WARN) chỉ in ra để soát nội dung.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import katex from 'katex';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const KATEX_OPTIONS = { output: 'html', throwOnError: false, strict: false, trust: false };
// Cùng bộ tách công thức với lib/markdown.ts: code được bảo vệ trước, rồi mới tới $...$.
const CODE_SPAN = /`([^`]+)`/g;
const DISPLAY_MATH = /\$\$([\s\S]+?)\$\$/g;
const INLINE_MATH = /(?<![\\$])\$(?![\s$])([^$\n]+?)(?<![\\\s])\$(?!\$)/g;

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
  imageUrl: z.string().nullish(),
  options: z.array(optionSchema).default([]),
  correctAnswer: z.union([z.string().trim().min(1), z.array(z.string().trim().min(1)).min(1)]),
  explanation: z.string().trim().min(1),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD', 'VERY_HARD']),
  score: z.number().positive().default(1),
  tags: z.array(z.string()).default([]),
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
  examYear: z.number().int().nullish(),
  examCode: z.string().nullish(),
  isFree: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  publishedAt: z.string(),
  updatedAt: z.string(),
  questions: z.array(questionSchema).min(1),
});

function loadSubjects() {
  const raw = JSON.parse(readFileSync(join(ROOT, 'content', 'subjects.json'), 'utf8'));
  const map = new Map();
  for (const subject of raw.subjects) {
    map.set(subject.slug, { name: subject.name, topics: new Set(subject.topics.map((topic) => topic.id)) });
  }
  return map;
}

// Trả về danh sách công thức TeX trong một chuỗi Markdown, bỏ qua phần nằm trong code span.
function mathOf(value) {
  const withoutCode = String(value ?? '').replace(CODE_SPAN, ' ');
  const display = [...withoutCode.matchAll(DISPLAY_MATH)].map((match) => match[1].trim());
  const inline = [...withoutCode.replace(DISPLAY_MATH, ' ').matchAll(INLINE_MATH)].map((match) => match[1].trim());
  return [...display, ...inline];
}

function imageRefs(value) {
  return [...String(value ?? '').matchAll(/!\[[^\]]*\]\(([^)\s]+)\)/g)].map((match) => match[1]);
}

function checkExam(file, subjects) {
  const errors = [];
  const warnings = [];
  const label = file.replace(/\\/g, '/').replace(/^.*content\/exams\//, 'content/exams/');
  const fail = (where, message) => errors.push(`${label} :: ${where} :: ${message}`);
  const warn = (where, message) => warnings.push(`${label} :: ${where} :: ${message}`);

  if (!existsSync(join(ROOT, file))) {
    return { label, errors: [`${label} :: không có file`], warnings: [], questions: 0 };
  }

  let parsed;
  try {
    parsed = JSON.parse(readFileSync(join(ROOT, file), 'utf8'));
  } catch (error) {
    return { label, errors: [`${label} :: JSON hỏng :: ${error.message}`], warnings: [], questions: 0 };
  }

  const result = examSchema.safeParse(parsed);
  if (!result.success) {
    for (const issue of result.error.issues) {
      fail(issue.path.join('.') || '(gốc)', issue.message);
    }
    return { label, errors, warnings, questions: 0 };
  }

  const exam = result.data;

  // Trang /de-thi/<slug> và file /data/exams/<slug>.json sinh từ slug bên trong file,
  // nên tên file khác slug vẫn chạy đúng — chỉ dễ gây nhầm khi đi tìm đề.
  if (`${exam.slug}.json` !== basename(file)) {
    warn('slug', `"${exam.slug}" khác tên file ${basename(file)}`);
  }

  const subject = subjects.get(exam.subject);
  if (!subject) {
    fail('subject', `môn "${exam.subject}" không có trong content/subjects.json`);
  }

  const seenQuestionIds = new Set();
  const keysOf = (question) => question.options.map((option) => option.key);

  exam.questions.forEach((question, index) => {
    const where = `câu ${index + 1} (${question.id})`;

    if (seenQuestionIds.has(question.id)) {
      fail(where, 'trùng id câu hỏi trong cùng một đề');
    }
    seenQuestionIds.add(question.id);

    if (subject && !subject.topics.has(question.topic)) {
      fail(where, `chuyên đề "${question.topic}" không thuộc môn ${exam.subject}`);
    }

    const keys = keysOf(question);
    if (new Set(keys).size !== keys.length) {
      fail(where, `phương án trùng khoá: ${keys.join(',')}`);
    }

    const answers = Array.isArray(question.correctAnswer) ? question.correctAnswer : [question.correctAnswer];
    if (question.type === 'ESSAY' || question.type === 'FILL_IN') {
      if (question.options.length > 0) {
        warn(where, `${question.type} vẫn còn ${question.options.length} phương án`);
      }
    } else {
      if (question.options.length === 0) {
        fail(where, `${question.type} mà không có phương án nào`);
      }
      const unknown = answers.filter((answer) => !keys.includes(answer));
      if (unknown.length > 0) {
        fail(where, `đáp án ${unknown.join(',')} không nằm trong phương án (${keys.join(',')})`);
      }
      if (question.type === 'SINGLE_CHOICE' && answers.length !== 1) {
        fail(where, `SINGLE_CHOICE cần đúng một đáp án, nhận được ${answers.length}`);
      }
      if (question.type === 'TRUE_FALSE' && (keys.length !== 2 || answers.length !== 1)) {
        fail(where, 'TRUE_FALSE hiển thị là câu trắc nghiệm 2 lựa chọn, cần 2 phương án và 1 đáp án');
      }
      if (question.type === 'MULTIPLE_CHOICE' && answers.length < 2) {
        warn(where, 'MULTIPLE_CHOICE chỉ có một đáp án đúng');
      }
    }

    for (const text of [question.content, question.explanation, ...question.options.map((option) => option.text)]) {
      for (const tex of mathOf(text)) {
        if (/katex-error|color:#cc0000/.test(katex.renderToString(tex, KATEX_OPTIONS))) {
          fail(where, `công thức KaTeX lỗi: ${tex.slice(0, 48)}`);
        }
      }
      if (/\\[nrt](?![a-zA-Z])/.test(text)) {
        fail(where, `còn chuỗi xuống dòng thô (backslash + n/t/r): ${text.slice(0, 48)}`);
      }
      if (/TODO:|\[CAN-HINH\]|KHONG CHAC CHAN/.test(text)) {
        fail(where, `còn marker soạn thảo: ${text.slice(0, 48)}`);
      }
    }

    const soDollar = String(question.content).replace(DISPLAY_MATH, '').replace(INLINE_MATH, '').split('$').length - 1;
    if (soDollar > 0) {
      warn(where, `${soDollar} dấu $ không cặp — kiểm tra xem có phải công thức bị thiếu dấu đóng`);
    }

    for (const image of [question.imageUrl, ...question.options.map((option) => option.imageUrl)]) {
      if (image && !existsSync(join(ROOT, 'public', image))) {
        fail(where, `ảnh ${image} không có trong public/`);
      }
    }
    for (const text of [question.content, question.explanation, ...question.options.map((option) => option.text)]) {
      for (const ref of imageRefs(text)) {
        if (!ref.startsWith('/') && !/^https?:\/\//i.test(ref)) {
          fail(where, `ảnh trong Markdown phải là đường dẫn nội bộ bắt đầu bằng /: ${ref}`);
          continue;
        }
        if (ref.startsWith('/') && !existsSync(join(ROOT, 'public', ref))) {
          fail(where, `ảnh ${ref} trích trong nội dung không có trong public/`);
        }
      }
    }
  });

  const tongDiem = exam.questions.reduce((sum, question) => sum + question.score, 0);
  if (Math.abs(tongDiem - exam.totalScore) > 0.01) {
    warn('điểm', `tổng điểm các câu ${tongDiem.toFixed(2)} khác totalScore ${exam.totalScore}`);
  }
  if (exam.questions.length < 2) {
    warn('đề', `đề chỉ có ${exam.questions.length} câu`);
  }

  return { label, errors, warnings, questions: exam.questions.length };
}

function filesFromGit() {
  const collected = new Set();
  for (const args of [
    ['diff', '--name-only', 'HEAD'],
    ['ls-files', '--others', '--exclude-standard'],
  ]) {
    const git = spawnSync('git', args, { cwd: ROOT, encoding: 'utf8' });
    if (git.status !== 0) {
      return null;
    }
    for (const line of git.stdout.split('\n')) {
      const file = line.trim().replace(/\\/g, '/');
      if (/^content\/exams\/.*\.json$/.test(file)) {
        collected.add(file);
      }
    }
  }
  return [...collected];
}

function main(argv) {
  const started = Date.now();
  const subjects = loadSubjects();
  let files;

  if (argv.includes('--all')) {
    files = readdirSync(join(ROOT, 'content', 'exams'))
      .filter((name) => name.endsWith('.json'))
      .map((name) => `content/exams/${name}`);
  } else {
    const given = argv
      .filter((arg) => !arg.startsWith('--'))
      .map((arg) => arg.replace(/\\/g, '/').replace(/^\.\/content\/exams\//, 'content/exams/').replace(/^content\/exams\//, 'content/exams/'));
    files = given.length > 0 ? given : filesFromGit();
    if (files === null) {
      console.log('Không đọc được git diff, dùng --all hoặc chỉ đích danh file đề.');
      return 2;
    }
  }

  if (files.length === 0) {
    console.log('Không có file đề nào cần kiểm tra (thêm --all để soát cả 49 đề).');
    return 0;
  }

  const reports = files.map((file) => checkExam(file, subjects));
  const errors = reports.flatMap((report) => report.errors);
  const warnings = reports.flatMap((report) => report.warnings);
  const soCau = reports.reduce((sum, report) => sum + report.questions, 0);

  for (const line of errors) {
    console.log(`LỖI  ${line}`);
  }
  for (const line of warnings) {
    console.log(`WARN ${line}`);
  }

  const ketLuan = errors.length === 0 ? 'OK' : `${errors.length} lỗi`;
  console.log(
    `\n${ketLuan}: ${reports.length} đề, ${soCau} câu, ${warnings.length} cảnh báo (${((Date.now() - started) / 1000).toFixed(1)}s).`,
  );
  if (errors.length > 0) {
    console.log('Sửa xong thì chạy lại lệnh này, sau đó mới tới scripts/verify.mjs.');
  }
  return errors.length === 0 ? 0 : 1;
}

process.exit(main(process.argv.slice(2)));
