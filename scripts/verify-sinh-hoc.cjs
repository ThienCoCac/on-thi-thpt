// Kiểm tra cấu trúc, tính lại đáp án số và thao tác Sinh học 12 trên bản export.
// Chạy nhanh không mở Chrome: node scripts/verify-sinh-hoc.cjs --content-only.
const fs = require('node:fs');
const path = require('node:path');
const { isDeepStrictEqual } = require('node:util');
const ROOT = path.resolve(__dirname, '..');
const BASE = process.env.BASE || `http://localhost:${process.env.VERIFY_PORT || 4180}`;
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const codes = ['di-truyen-phan-tu', 'di-truyen-nhiem-sac-the', 'di-truyen-quan-the', 'tien-hoa', 'sinh-thai-moi-truong', 'tong-hop-01'];
const results = [];
let subject;
let exams;
function check(name, ok, detail = '') {
  results.push({ name, ok });
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);
}
function finish() {
  const failed = results.filter(r => !r.ok).length;
  console.log(`\nTổng: ${results.length} kiểm tra, ${failed} thất bại.`);
  process.exitCode = failed || !results.length ? 1 : 0;
}
function answer(e, n) {
  const q = exams[e].questions[n - 1];
  return q.options.find(o => o.key === q.correctAnswer)?.text || '';
}
function numeric(text) {
  // Phương án số có thể dùng dấu cách hàng nghìn, dấu phẩy thập phân hoặc phân số.
  const normalized = text.replace(/(?<=\d)\s+(?=\d)/g, '').replace(/,/g, '.');
  const found = normalized.match(/^\s*(\d+(?:\.\d+)?)(?:\/(\d+))?/);
  return found ? Number(found[1]) / (found[2] ? Number(found[2]) : 1) : NaN;
}
function contentChecks() {
  const subjects = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/subjects.json'), 'utf8')).subjects;
  subject = subjects.find(s => s.slug === 'sinh-hoc');
  exams = codes.map(code => JSON.parse(fs.readFileSync(path.join(ROOT, 'content/exams', `de-sinh-12-${code}.json`), 'utf8')));
  const all = exams.flatMap(e => e.questions);
  check('Môn Sinh học có năm nhóm kiến thức', subject?.topics.length === 5 && subject.order === 10);
  check('Sáu đề có 120 mã câu không trùng', all.length === 120 && new Set(all.map(q => q.id)).size === 120);
  check('Không có câu hỏi trùng nguyên văn trong đợt', new Set(all.map(q => q.content)).size === 120);
  for (const [i, e] of exams.entries()) {
    check(`${e.slug}: cấu trúc và điểm`, e.subject === 'sinh-hoc' && e.grade === 12 && e.durationMinutes === 45 && e.totalScore === 10 && e.questions.length === 20 && e.type === (i === 5 ? 'FULL_EXAM' : 'TOPIC_TEST') && e.questions.every(q => q.type === 'SINGLE_CHOICE' && q.score === 0.5) && e.questions.reduce((s, q) => s + q.score, 0) === 10);
    check(`${e.slug}: bốn phương án phân biệt và lời giải`, e.questions.every(q => q.options.map(o => o.key).join('') === 'ABCD' && new Set(q.options.map(o => o.text)).size === 4 && q.options.some(o => o.key === q.correctAnswer) && q.explanation.length > 40));
    check(`${e.slug}: đáp án A/B/C/D mỗi loại năm câu`, [...'ABCD'].every(k => e.questions.filter(q => q.correctAnswer === k).length === 5));
    check(`${e.slug}: chuyên đề hợp lệ và nhãn không chính thức`, e.description.includes('Đề tự soạn') && e.description.includes('không phải đề thi chính thức') && e.questions.every(q => subject.topics.some(t => t.id === q.topic)));
    check(`${e.slug}: độ khó 6 dễ, 10 trung bình, 4 khó`, ['EASY', 'MEDIUM', 'HARD'].every((d, j) => e.questions.filter(q => q.difficulty === d).length === [6, 10, 4][j]));
  }
  check('Mỗi nhóm có 24 câu trong ngân hàng', subject.topics.every(t => all.filter(q => q.topic === t.id).length === 24));
  check('Đề tổng hợp có bốn câu mỗi nhóm', subject.topics.every(t => exams[5].questions.filter(q => q.topic === t.id).length === 4));
  check('Mỗi đề chuyên đề chỉ thuộc đúng nhóm đã đặt', exams.slice(0, 5).every((e, i) => e.questions.every(q => q.topic === subject.topics[i].id)));
  // Tính lại từ dữ kiện câu hỏi, không lấy số từ lời giải; đơn vị giống phương án.
  const audit = [
    [0, 7, (2000 - 2 * 600) / 2], [0, 8, 600 * 2 + 400 * 3], [0, 9, 2 ** 3],
    [0, 17, 2 * 1000 * (2 ** 3 - 1)], [0, 18, 90 / 3 - 1], [0, 19, 2],
    [1, 7, 0.5 * 0.5 * 100], [1, 8, 0.5 ** 2 * 100], [1, 9, 2 ** 3],
    [1, 10, 0.5 ** 2 * 100], [1, 11, 2 * 0.5 * 0.5 * 100], [1, 12, 0.5 * 100],
    [1, 13, 14 + 1], [1, 14, 12 / 2 * 4], [1, 17, (0.75 * 0.25 + 0.25 * 0.75) * 100],
    [1, 18, 20 / 2], [1, 19, 20 / 2], [1, 20, (1 - 0.75 ** 2) * 100],
    [2, 7, (2 * 20 + 60) / (2 * 100)], [2, 8, (2 * 200 + 200) / (2 * 500)],
    [2, 9, 2 * 0.7 * 0.3], [2, 10, Math.sqrt(0.09)], [2, 11, 100 / 2 ** 2],
    [2, 17, 0.2 + (0.6 - 0.6 / 2 ** 2) / 2], [2, 18, 2 * 0.6 * 0.4 / (1 - 0.16)],
    [2, 19, (400 * 0.8 + 600 * 0.4) / 1000], [2, 20, 2 * 0.5 * 0.5 * 100],
    [3, 17, 400 * 0.75 / (400 * 0.75 + 600 * 0.25)], [3, 18, (800 * 0.25 + 200 * 0.75) / 1000],
    [4, 7, 240 / 12], [4, 8, 500 + 80 - 50 + 20 - 10], [4, 12, 1200 / 10000 * 100],
    [4, 13, 1200 - 400], [4, 17, 50000 * 0.1 * 0.2], [4, 18, 50 * 40 / 10],
    [5, 3, 3000 * (1 - 2 * 0.2) / 2], [5, 5, 8 / 2], [5, 7, 0.5 * 100],
    [5, 8, (100 - 30) / 2], [5, 9, 2 * 0.8 * 0.2 * 100], [5, 10, 100 / 2 ** 3],
    [5, 12, (2 * 160 + 80) / (2 * 400)], [5, 16, 3 / 6], [5, 17, 240 / 2400 * 100],
    [5, 18, (1200 + 120 - 72 + 12 - 36) / 6],
  ];
  for (const [e, n, expected] of audit) {
    const actual = numeric(answer(e, n));
    check(`${codes[e]} c${n}: tính lại đáp án số`, Number.isFinite(actual) && Math.abs(actual - expected) < 1e-9, `${actual} / ${expected}`);
  }
  // Chốt các nguyên lí dễ viết sai hoặc thiếu điều kiện trong bài tự soạn.
  const concepts = [
    [0, 3, 'Mỗi DNA con có một mạch cũ và một mạch mới.'],
    [0, 4, '5′ → 3′.'], [0, 10, '5′-AUG CCU-3′.'],
    [0, 12, 'Operator (vùng vận hành).'], [0, 14, 'Đột biến đồng nghĩa.'],
    [0, 16, 'Khung đọc từ vị trí thêm bị dịch chuyển.'], [0, 20, 'Methionine – alanine.'],
    [1, 6, '2n + 1.'], [1, 15, 'Hai chromatid không chị em của cặp nhiễm sắc thể tương đồng.'],
    [1, 16, 'Aa và Aa.'], [2, 12, 'Giữ nguyên dù tỉ lệ dị hợp giảm.'],
    [2, 15, 'Các cây con có thể khác nhau về màu lá do nhận tỉ lệ hai loại lục lạp khác nhau.'],
    [3, 8, 'Phiêu bạt di truyền.'], [3, 9, 'Cách li trước hợp tử về thời gian.'],
    [3, 10, 'Cách li sau hợp tử.'], [3, 19, 'A có quan hệ họ hàng gần B hơn C.'],
    [3, 20, 'Ngẫu phối trên đảo không thể tự tạo lại allele b đã vắng mặt.'],
    [4, 5, 'Một khu vực chưa có quần xã và chưa hình thành đất, như bề mặt dung nham mới nguội.'],
    [4, 6, 'Bảo vệ loài trong sinh cảnh tự nhiên của chúng.'],
    [4, 11, 'Năng lượng truyền qua các bậc rồi tiêu tán dưới dạng nhiệt; nhiều nguyên tố vật chất được tuần hoàn.'],
    [4, 16, 'Diễn thế thứ sinh.'],
    [4, 19, 'Hai nơi có độ giàu loài (số loài) như nhau, nhưng X có độ đồng đều cao hơn.'],
    [5, 2, 'Một polypeptide hoặc một phân tử RNA có chức năng.'],
    [5, 6, 'Đồng trội.'], [5, 15, 'Cách li trước hợp tử về tập tính.'],
  ];
  for (const [e, n, expected] of concepts) check(`${codes[e]} c${n}: nguyên lí sinh học`, answer(e, n) === expected);
  const stem = (e, n) => exams[e].questions[n - 1].content;
  check('Bài xác suất liên kết ghi rõ pha và tỉ lệ đối ứng', stem(1, 18).includes('AB/ab') && stem(1, 19).includes('Ab/aB') && [18, 19].every(n => stem(1, n).includes('đối ứng')));
  check('Bài liên kết X phân biệt xác suất trong con trai', stem(1, 12).includes('Xét riêng các con trai'));
  check('Bài xác suất có điều kiện nêu rõ kiểu hình đã chọn', stem(2, 18).includes('cân bằng Hardy–Weinberg') && stem(2, 18).includes('cá thể có kiểu hình trội'));
  check('Bài đánh dấu bắt lại nêu quần thể kín và khả năng bị bắt', stem(4, 18).includes('quần thể kín') && stem(4, 18).includes('khả năng bị bắt như nhau'));
}
async function clickText(page, selector, text) {
  const clicked = await page.evaluate((sel, label) => {
    const node = [...document.querySelectorAll(sel)].find(n => n.textContent.includes(label));
    if (!node || node.disabled) return false;
    node.click(); return true;
  }, selector, text);
  if (!clicked) throw new Error(`Không tìm thấy ${selector}: ${text}`);
}
async function waitText(page, text) {
  await page.waitForFunction(t => document.body.innerText.includes(t), { timeout: 15000 }, text);
}
async function runExam(browser, exam, wrong = false) {
  // Không điều hướng khỏi phòng thi vì trình xử lí beforeunload sẽ chặn.
  const page = await browser.newPage();
  try {
    await page.goto(`${BASE}/de-thi/${exam.slug}/lam-bai`, { waitUntil: 'networkidle0' });
    await clickText(page, 'button', 'Bắt đầu làm bài');
    for (let i = 0; i < 20; i++) {
      await waitText(page, `Câu ${i + 1} / 20`);
      const q = exam.questions[i];
      const key = wrong && i === 0 ? (q.correctAnswer === 'A' ? 'B' : 'A') : q.correctAnswer;
      const selected = await page.evaluate(k => {
        const label = [...document.querySelectorAll('main label.flex.cursor-pointer')][k.charCodeAt(0) - 65];
        if (!label) return false;
        label.click(); return true;
      }, key);
      if (!selected) throw new Error(`Không chọn được ${q.id}`);
      await page.waitForFunction(() => document.querySelectorAll('main label.flex.cursor-pointer input:checked').length === 1);
      if (i < 19) await clickText(page, 'button', 'Câu sau');
    }
    await clickText(page, 'button', 'Nộp bài');
    await page.waitForSelector('[role="dialog"]');
    await clickText(page, '[role="dialog"] button', 'Nộp bài');
    await waitText(page, 'Kết quả được chấm ngay trên thiết bị');
    const text = await page.evaluate(() => document.body.innerText);
    check(`${exam.slug}: chấm ${wrong ? 'sai một câu' : 'đúng toàn bộ'}`, text.includes(wrong ? '9.50/10' : '10/10') && text.includes(wrong ? 'Đúng 19/20 câu' : 'Đúng 20/20 câu'));
  } finally { await page.close(); }
}
async function browserChecks() {
  const puppeteer = require('C:/Users/trinh/.qoder/tmp/shot/node_modules/puppeteer-core');
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const errors = [];
  browser.on('targetcreated', async target => { const p = await target.page(); if (p) p.on('pageerror', e => errors.push(e.message)); });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    await page.goto(`${BASE}/de-thi`, { waitUntil: 'networkidle0' });
    await clickText(page, 'button', 'Sinh học');
    await waitText(page, 'Tìm thấy 6 đề môn Sinh học');
    check('Bộ lọc Sinh học hiển thị sáu đề', true);
    const shotDir = path.join(ROOT, '.verify', 'sinh-hoc');
    fs.mkdirSync(shotDir, { recursive: true });
    await page.screenshot({ path: path.join(shotDir, 'danh-sach.png'), fullPage: true });
    const response = await fetch(`${BASE}/data/bank/sinh-hoc.json`);
    const bank = await response.json();
    check('Ngân hàng Sinh học tải đủ 120 câu', response.ok && Array.isArray(bank) && bank.length === 120);
    check('Ngân hàng xuất đủ 24 câu mỗi nhóm', subject.topics.every(t => bank.filter(q => q.topicId === t.id).length === 24));
    for (const exam of exams) {
      await page.goto(`${BASE}/de-thi/${exam.slug}`, { waitUntil: 'networkidle0' });
      const text = await page.evaluate(() => document.body.innerText);
      check(`${exam.slug}: trang chi tiết`, text.includes(exam.title) && text.includes('20 câu') && text.includes('45 phút') && text.includes('10 điểm') && text.includes('Đề tự soạn'));
      const res = await fetch(`${BASE}/data/exams/${exam.slug}.json`);
      const data = await res.json();
      // Hợp đồng RunnerExam dùng null cho ảnh vắng mặt và tên chuyên đề thay cho mã.
      // So sánh toàn bộ cấu trúc đã chuẩn hóa, không bỏ kiểm tra ảnh hoặc phương án.
      const expected = {
        id: exam.id, title: exam.title, slug: exam.slug,
        subjectName: subject.name, subjectSlug: subject.slug,
        durationMinutes: exam.durationMinutes, totalScore: exam.totalScore,
        questions: exam.questions.map((q, i) => ({
          id: q.id, order: i + 1, partName: q.partName, type: q.type,
          content: q.content, imageUrl: q.imageUrl ?? null, score: q.score,
          options: q.options.map(o => ({ key: o.key.toUpperCase(), text: o.text, imageUrl: o.imageUrl ?? null })),
          correctAnswer: q.correctAnswer, explanation: q.explanation, difficulty: q.difficulty,
          topicName: subject.topics.find(t => t.id === q.topic)?.name ?? null, tags: q.tags,
        })),
      };
      check(`${exam.slug}: JSON xuất khớp toàn bộ cấu trúc RunnerExam`, res.ok && isDeepStrictEqual(data, expected));
    }
    // Duyệt toàn bộ 120 câu qua giao diện luyện tập thật ở chiều rộng điện thoại.
    await page.setViewport({ width: 390, height: 844, isMobile: true, deviceScaleFactor: 1 });
    for (const exam of exams) {
      await page.goto(`${BASE}/de-thi/${exam.slug}/luyen-tap`, { waitUntil: 'networkidle0' });
      let valid = true;
      for (let i = 0; i < 20; i++) {
        await waitText(page, `Câu ${i + 1}/20`);
        const clicked = await page.evaluate(k => {
          const b = [...document.querySelectorAll('button[aria-pressed]')].find(n => !n.disabled && (n.querySelector('span')?.textContent || '').trim() === k);
          if (!b) return false;
          b.click(); return true;
        }, exam.questions[i].correctAnswer);
        if (!clicked) throw new Error(`Không trả lời được ${exam.slug} c${i + 1}`);
        await waitText(page, 'Lời giải');
        const current = await page.evaluate(() => document.body.innerText.includes('Chính xác!') && !document.querySelector('.katex-error') && document.documentElement.scrollWidth - document.documentElement.clientWidth <= 1);
        valid = current && valid;
        if (exam.slug === exams[1].slug && i === 11) await page.screenshot({ path: path.join(shotDir, 'mobile-lien-ket-X.png'), fullPage: true });
        if (exam.slug === exams[2].slug && i === 17) await page.screenshot({ path: path.join(shotDir, 'mobile-xac-suat.png'), fullPage: true });
        if (i < 19) await clickText(page, 'button', 'Câu tiếp');
      }
      check(`${exam.slug}: 20 câu luyện tập, lời giải và không tràn mobile`, valid);
    }
    await page.goto(`${BASE}/luyen-tap`, { waitUntil: 'networkidle0' });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'networkidle0' });
    await clickText(page, 'button', 'Sinh học');
    await waitText(page, 'Đang chọn 120 câu phù hợp');
    check('Luyện tập tự do nhận đủ năm nhóm', await page.$$eval('[aria-labelledby="practice-topic-title"] input', els => els.length === 5));
    await clickText(page, 'button', 'Bỏ chọn');
    await clickText(page, '[aria-labelledby="practice-topic-title"] label', 'Di truyền phân tử');
    await waitText(page, 'Đang chọn 24 câu phù hợp');
    await clickText(page, '[aria-labelledby="practice-count-title"] button', '10 câu');
    await clickText(page, 'button', 'Bắt đầu luyện tập');
    await waitText(page, 'Câu 1/10');
    check('Bắt đầu được phiên 10 câu từ riêng nhóm phân tử', true);
    await page.close();
    await runExam(browser, exams[5]);
    await runExam(browser, exams[0], true);
    check('Không có lỗi JavaScript trong các trang Sinh học', errors.length === 0, errors.join('; '));
  } finally { await browser.close(); }
}
(async () => {
  try {
    contentChecks();
    if (!process.argv.includes('--content-only')) await browserChecks();
  } catch (error) { check('Thực thi bộ kiểm tra Sinh học', false, error.stack || error.message); }
  finish();
})();
