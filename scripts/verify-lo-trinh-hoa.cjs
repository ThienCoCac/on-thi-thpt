// Kiểm tra nội dung, đáp án và thao tác lộ trình lấy lại gốc Hóa học trên bản export.
// Chạy nhanh không mở Chrome: node scripts/verify-lo-trinh-hoa.cjs --content-only.
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.resolve(__dirname, '..');
const BASE = process.env.BASE || `http://localhost:${process.env.VERIFY_PORT || 4180}`;
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const ROUTE = '/lo-trinh/hoa-hoc-mat-goc';
const KEY = 'on-thi-thpt:hoa-mat-goc:v1';
const results = [];
let data;
function check(name, ok, detail = '') {
  results.push({ name, ok });
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);
}
function finish() {
  const failed = results.filter(r => !r.ok).length;
  console.log(`\nTổng: ${results.length} kiểm tra, ${failed} thất bại.`);
  process.exitCode = failed || !results.length ? 1 : 0;
}
function answer(li, qi) {
  const q = data.lessons[li].questions[qi];
  return q.options[q.answer];
}
function numeric(text) {
  const normalized = text.replace(/−/g, '-').replace(/(?<=\d)\s+(?=\d)/g, '').replace(/,/g, '.');
  const found = normalized.match(/^\s*([-+]?\d+(?:\.\d+)?)/);
  return found ? Number(found[1]) : NaN;
}
function contentChecks() {
  data = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/roadmaps/hoa-hoc-mat-goc.json'), 'utf8'));
  const all = data.lessons.flatMap(l => l.questions);
  check('Lộ trình có 10 chặng, 40 bài, 120 câu', data.stages.length === 10 && data.lessons.length === 40 && all.length === 120);
  check('Mã bài và mã câu không trùng', new Set(data.lessons.map(l => l.id)).size === 40 && new Set(all.map(q => q.id)).size === 120);
  check('Không có câu hỏi trùng nguyên văn', new Set(all.map(q => q.prompt)).size === 120);
  check('Đáp án cân bằng 30 câu mỗi vị trí A/B/C/D', [0, 1, 2, 3].every(k => all.filter(q => q.answer === k).length === 30));
  check('Mỗi bài 45 phút, lý thuyết đủ dài, ví dụ ba bước', data.lessons.every(l => l.minutes === 45 && l.theory.length > 200 && l.example.steps.length === 3 && l.pitfall.length > 20 && l.recall.length > 20));
  check('Mỗi câu bốn phương án phân biệt và lời giải', all.every(q => q.options.length === 4 && new Set(q.options).size === 4 && q.answer >= 0 && q.answer <= 3 && q.explanation.length > 15));
  check('Tiên quyết luôn là bài đứng trước', data.lessons.every((l, i) => i === 0 ? l.prerequisites.length === 0 : l.prerequisites.length === 1 && l.prerequisites[0] === data.lessons[i - 1].id));
  check('Mỗi chặng đúng bốn bài theo thứ tự', data.stages.every((s, i) => s.lessonIds.length === 4 && s.lessonIds.every((id, j) => data.lessons[i * 4 + j].id === id && data.lessons[i * 4 + j].stageId === s.id)));
  check('Kiểm tra chặng lấy câu 2–3 của bốn bài, không trùng', data.stages.every((s, i) => {
    const expected = data.lessons.slice(i * 4, i * 4 + 4).flatMap(l => l.questions.slice(1).map(q => q.id));
    return s.checkpointIds.length === 8 && new Set(s.checkpointIds).size === 8 && expected.every(id => s.checkpointIds.includes(id));
  }));
  check('Khảo sát đầu vào 12 câu không trùng', data.diagnosticIds.length === 12 && new Set(data.diagnosticIds).size === 12 && data.diagnosticIds.every(id => all.some(q => q.id === id)));
  check('Tổng hợp cuối 20 câu không trùng, phủ cả mười chặng', data.finalIds.length === 20 && new Set(data.finalIds).size === 20 && data.stages.every(s => data.finalIds.some(id => s.lessonIds.includes(all.find(q => q.id === id).lessonId))));
  check('Bốn nguồn đối chiếu đều HTTPS', data.sources.length === 4 && data.sources.every(s => s.url.startsWith('https://') && s.note.length > 10));
  // Liên kết đề luyện thêm phải đúng môn Hóa 11 và đúng nội dung thật của đề cũ.
  const examCache = new Map();
  const readExam = slug => {
    if (!examCache.has(slug)) examCache.set(slug, JSON.parse(fs.readFileSync(path.join(ROOT, 'content/exams', `${slug}.json`), 'utf8')));
    return examCache.get(slug);
  };
  let linksOk = true;
  for (const l of data.lessons) for (const slug of l.examSlugs) {
    const exam = readExam(slug);
    if (exam.subject !== 'hoa-hoc' || exam.grade !== 11) linksOk = false;
  }
  check('Mọi đề luyện thêm tồn tại và thuộc Hóa 11', linksOk);
  const nitrogen = data.lessons.find(l => l.id === 'nitrogen');
  const sulfur = data.lessons.find(l => l.id === 'sulfur');
  check('Bài nitrogen nối đúng đề ammonia và oxide nitrogen theo nội dung thật', nitrogen.examSlugs.includes('de-hoa-11-bai-06') && /Ammonia/i.test(readExam('de-hoa-11-bai-06').title) && nitrogen.examSlugs.includes('de-hoa-11-bai-07') && /nitrogen/i.test(readExam('de-hoa-11-bai-07').title));
  check('Bài sulfur nối đúng đề sulfur theo nội dung thật', sulfur.examSlugs.includes('de-hoa-11-bai-05') && /Sulfur/i.test(readExam('de-hoa-11-bai-05').title));
  // Tính lại đáp án số từ dữ kiện, không lấy số từ lời giải.
  const audit = [
    [0, 0, 250 / 1000], [0, 1, 150 * 0.12], [0, 2, 0.6 / 2],
    [3, 1, 40 + 12 + 3 * 16], [3, 2, 40 + 2 * 17],
    [5, 0, 9 / 18], [5, 1, 0.1 * 24.79],
    [6, 0, 10 / 100 * 100], [6, 1, 0.5 * 0.2],
    [7, 2, 10 * 0.75], [10, 1, 0.2 * 64], [11, 2, 0.05 * 0.2 / 0.1 * 1000],
    [12, 0, 35 - 17], [12, 1, 12 - 2], [12, 2, 35 * 0.75 + 37 * 0.25],
    [17, 2, 500 - 620], [18, 1, 0.2 / 10], [18, 2, 2 ** 2],
    [20, 1, 0.2 ** 2 / (0.1 * 0.1)], [21, 0, 3], [21, 1, 14 - 2], [22, 1, 0.1],
    [28, 1, 0.2], [29, 1, 0.15], [30, 1, 0.2 * 2], [31, 1, 0.05 * 6],
    [34, 0, 0.1 / 2], [36, 2, 0.05 * 2 * 108], [37, 1, 0.1], [38, 1, 0.2 * 0.5],
  ];
  for (const [li, qi, expected] of audit) {
    const actual = numeric(answer(li, qi));
    check(`${data.lessons[li].id} c${qi + 1}: tính lại đáp án số`, Number.isFinite(actual) && Math.abs(actual - expected) < 1e-9, `${actual} / ${expected}`);
  }
  const concepts = [
    [1, 0, 'O₂'], [2, 2, 'H₂O thành 2H₂O'], [4, 0, '2 : 1 : 2'], [7, 1, 'O₂'],
    [8, 0, 'NaOH'], [10, 0, 'Cu'], [13, 2, 'Al₂O₃'], [14, 0, 'Ion'],
    [15, 0, 'CO₂ dạng thẳng'], [16, 1, 'Zn'], [19, 0, 'Cl₂'], [19, 2, 'Acid yếu nhưng rất nguy hiểm'],
    [20, 2, 'Không đổi'], [23, 0, '+4'], [23, 1, 'Ba²⁺'], [24, 0, 'Na₂CO₃'], [25, 2, 'Không nhất thiết là ion phân tử'],
    [27, 0, '2'], [32, 0, 'Thế Br bằng OH'], [33, 1, 'II'], [35, 0, 'Phenol'],
    [36, 1, 'Propan-2-ol'], [39, 1, 'Chưa xác định duy nhất cấu tạo'],
  ];
  for (const [li, qi, expected] of concepts) check(`${data.lessons[li].id} c${qi + 1}: nguyên lí hóa học`, answer(li, qi) === expected);
  const theory = id => data.lessons.find(l => l.id === id).theory;
  check('Điều kiện khí nêu rõ 25 °C/1 bar và 0 °C/1 atm', theory('mol-chat-khi').includes('24,79') && theory('mol-chat-khi').includes('22,414') && theory('mol-chat-khi').includes('Không tự chọn'));
  check('pH nêu điều kiện 25 °C và mô hình loãng', theory('ph-chuan-do').includes('25 °C') && theory('ph-chuan-do').includes('loãng'));
  check('Không hứa hẹn điểm số, có cảnh báo an toàn hóa chất', data.lessons.some(l => l.pitfall.includes('không') || l.theory.includes('giáo viên')) && theory('halogen').includes('không phải an toàn'));
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
async function answerQuiz(page, questions, wrongFirst = false) {
  await page.waitForFunction(() => [...document.querySelectorAll('[data-roadmap-quiz] fieldset')].every(f => !f.disabled), { timeout: 15000 });
  const ok = await page.evaluate((items, wrong) => {
    for (const [i, q] of items.entries()) {
      const field = document.querySelector(`fieldset[data-question-id="${q.id}"]`);
      if (!field) return false;
      const value = wrong && i === 0 ? (q.answer === 0 ? 1 : 0) : q.answer;
      const input = field.querySelector(`input[value="${value}"]`);
      if (!input) return false;
      input.click();
    }
    return true;
  }, questions.map(q => ({ id: q.id, answer: q.answer })), wrongFirst);
  if (!ok) throw new Error('Không chọn được phương án trong bộ câu');
  await clickText(page, '[data-roadmap-quiz] button', 'Chấm bài tự kiểm tra');
  await page.waitForSelector('[data-quiz-result]', { timeout: 15000 });
}
async function browserChecks() {
  const puppeteer = require('C:/Users/trinh/.qoder/tmp/shot/node_modules/puppeteer-core');
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const errors = [];
  browser.on('targetcreated', async target => { const p = await target.page(); if (p) p.on('pageerror', e => errors.push(e.message)); });
  const shotDir = path.join(ROOT, '.verify', 'lo-trinh');
  fs.mkdirSync(shotDir, { recursive: true });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    await page.goto(`${BASE}${ROUTE}`, { waitUntil: 'networkidle0' });
    await page.evaluate(k => localStorage.removeItem(k), KEY);
    await page.reload({ waitUntil: 'networkidle0' });
    await waitText(page, 'Học lại Hóa,');
    check('Trang lộ trình có lời dẫn cho người mất gốc', await page.evaluate(() => document.body.innerText.includes('Không cần biết sẵn')));
    check('Bản đồ hiện đủ 40 liên kết bài và 10 chặng', await page.evaluate(route => document.querySelectorAll(`a[href^="${route}/"]`).length >= 40 && document.querySelectorAll('[data-stage]').length === 10, ROUTE));
    check('Nhịp mặc định 2 bài/tuần ước tính 20 tuần', await page.evaluate(() => document.querySelector('[data-pace-estimate]').textContent.includes('20 tuần')));
    await page.select('#roadmap-pace', '4');
    await waitText(page, '10 tuần');
    check('Đổi nhịp 4 bài/tuần cập nhật ước tính 10 tuần', true);
    await page.select('#roadmap-pace', '2');
    await page.screenshot({ path: path.join(shotDir, 'danh-sach.png'), fullPage: true });
    // Khảo sát đầu vào: đúng hết nhưng không được tự đánh dấu bài đã đạt.
    await clickText(page, 'button', 'Làm khảo sát đầu vào');
    const diagnostic = data.diagnosticIds.map(id => data.lessons.flatMap(l => l.questions).find(q => q.id === id));
    await answerQuiz(page, diagnostic);
    await waitText(page, 'Kết quả: 12/12');
    check('Khảo sát đầu vào chấm đúng 12/12 và nói rõ chỉ là gợi ý', await page.evaluate(() => document.body.innerText.includes('Đã ghi nhận điểm xuất phát')));
    check('Khảo sát không tự đánh dấu bài đã đạt', await page.evaluate(() => document.querySelector('[data-mastery]').textContent.trim().startsWith('0')));
    check('Kết quả khảo sát được lưu riêng', await page.evaluate(k => JSON.parse(localStorage.getItem(k)).assessments['dau-vao'].score === 12, KEY));
    await clickText(page, 'button', 'Đóng bộ câu');
    // Bài 1: học, mở ví dụ, đạt 3/3, lịch ôn sau một ngày.
    await page.goto(`${BASE}${ROUTE}/don-vi-ti-le`, { waitUntil: 'networkidle0' });
    await waitText(page, 'Đổi đơn vị, tỉ lệ và đọc một đề Hóa');
    check('Bài học hiện lý thuyết, ví dụ, chỗ dễ nhầm và gợi nhớ', await page.evaluate(() => ['Hiểu từ gốc', 'Một ví dụ, từng bước nhỏ', 'Chỗ rất dễ nhầm', 'Gấp bài lại'].every(t => document.body.innerText.includes(t))));
    await clickText(page, 'summary', 'Mở lời giải từng bước');
    check('Mở được lời giải ba bước', await page.evaluate(() => document.body.innerText.includes('200 × 5/100 = 10 g')));
    check('Có lựa chọn Chưa biết cho mỗi câu', await page.evaluate(() => [...document.querySelectorAll('[data-roadmap-quiz] fieldset')].every(f => f.textContent.includes('Chưa biết'))));
    await answerQuiz(page, data.lessons[0].questions);
    await waitText(page, 'Kết quả: 3/3');
    check('Bài 1 chấm 3/3 và hiện lời giải từng câu', await page.evaluate(() => document.querySelectorAll('[data-explanation]').length === 3));
    const saved1 = await page.evaluate(k => JSON.parse(localStorage.getItem(k)).lessons['don-vi-ti-le'], KEY);
    check('Đạt 3/3 lưu best/latest và hẹn ôn sau khoảng một ngày', saved1.best === 3 && saved1.latest === 3 && saved1.masteredAt != null && Math.abs(saved1.dueAt - saved1.masteredAt - 86400000) < 5000);
    await page.screenshot({ path: path.join(shotDir, 'bai-hoc.png'), fullPage: true });
    // Ghi chú lưu và còn sau khi tải lại.
    await page.type('#roadmap-note', 'Nhớ đổi mL sang L trước khi tính.');
    await page.reload({ waitUntil: 'networkidle0' });
    check('Ghi chú còn nguyên sau khi tải lại', await page.evaluate(() => document.querySelector('#roadmap-note').value === 'Nhớ đổi mL sang L trước khi tính.'));
    // Bài 2: sai một câu thì vào hàng cần ôn dù từng đạt trước đó.
    await page.goto(`${BASE}${ROUTE}/chat-nguyen-tu`, { waitUntil: 'networkidle0' });
    await answerQuiz(page, data.lessons[1].questions);
    await waitText(page, 'Kết quả: 3/3');
    await clickText(page, '[data-roadmap-quiz] button', 'Làm lại bộ câu này');
    await answerQuiz(page, data.lessons[1].questions, true);
    await waitText(page, 'Kết quả: 2/3');
    const saved2 = await page.evaluate(k => JSON.parse(localStorage.getItem(k)).lessons['chat-nguyen-tu'], KEY);
    check('Lần ôn sai giữ best cũ nhưng latest 2/3 và hẹn ôn ngay', saved2.best === 3 && saved2.latest === 2 && saved2.dueAt <= Date.now());
    await page.goto(`${BASE}${ROUTE}`, { waitUntil: 'networkidle0' });
    await waitText(page, 'Ôn một ít trước khi học mới');
    check('Trang lộ trình liệt kê bài sai vào hàng cần ôn', await page.evaluate(() => document.querySelector('[data-due-count]').textContent.includes('1') && document.body.innerText.includes('Chất, nguyên tử, nguyên tố và phân tử')));
    check('Tiến độ hiển thị 2 bài đã từng đạt', await page.evaluate(() => document.querySelector('[data-mastery]').textContent.trim().startsWith('2')));
    // Kiểm tra chặng 1: tám câu, đạt mốc 7/8.
    await clickText(page, '[data-stage="chang-1"] button', 'Tự kiểm tra chặng 1');
    const checkpoint = data.stages[0].checkpointIds.map(id => data.lessons.flatMap(l => l.questions).find(q => q.id === id));
    await answerQuiz(page, checkpoint, true);
    await waitText(page, 'Kết quả: 7/8');
    check('Kiểm tra chặng chấm 7/8 và đạt mốc gợi ý', await page.evaluate(() => document.body.innerText.includes('Đạt mốc tự kiểm')));
    check('Điểm chặng lưu vào assessments, không tính là bài đạt', await page.evaluate(k => { const p = JSON.parse(localStorage.getItem(k)); return p.assessments['chang-1'].score === 7 && Object.keys(p.lessons).length === 2; }, KEY));
    await clickText(page, 'button', 'Đóng bộ câu');
    // Giao diện điện thoại: không tràn ngang, vẫn trả lời được.
    await page.setViewport({ width: 390, height: 844, isMobile: true, deviceScaleFactor: 1 });
    await page.reload({ waitUntil: 'networkidle0' });
    check('Trang lộ trình không tràn ngang trên mobile', await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth <= 1));
    await page.goto(`${BASE}${ROUTE}/mol-chat-khi`, { waitUntil: 'networkidle0' });
    check('Bài học không tràn ngang trên mobile', await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth <= 1 && !document.querySelector('.katex-error')));
    await answerQuiz(page, data.lessons[5].questions);
    await waitText(page, 'Kết quả: 3/3');
    check('Trả lời trọn ba câu trên mobile', true);
    await page.screenshot({ path: path.join(shotDir, 'mobile.png'), fullPage: true });
    await page.setViewport({ width: 1280, height: 900 });
    // Kho lưu trữ hỏng: báo rõ, không ghi đè dữ liệu cũ.
    await page.goto(`${BASE}${ROUTE}`, { waitUntil: 'networkidle0' });
    await page.evaluate(k => localStorage.setItem(k, '{hỏng'), KEY);
    await page.reload({ waitUntil: 'networkidle0' });
    await waitText(page, 'Không đọc được tiến độ đã lưu');
    check('Dữ liệu hỏng được báo và giữ nguyên, không ghi đè', await page.evaluate(k => localStorage.getItem(k) === '{hỏng', KEY));
    await page.evaluate(k => localStorage.removeItem(k), KEY);
    // Trình duyệt chặn ghi: vẫn học được và có cảnh báo.
    await page.reload({ waitUntil: 'networkidle0' });
    await page.evaluate(() => { Storage.prototype.setItem = () => { throw new Error('blocked'); }; });
    await page.select('#roadmap-pace', '1');
    await waitText(page, 'chỉ giữ trong phiên này');
    check('Chặn localStorage vẫn đổi nhịp trong phiên và cảnh báo', await page.evaluate(() => document.querySelector('[data-pace-estimate]').textContent.includes('40 tuần')));
    await page.close();
    // Toàn bộ 40 trang bài phải export thật; sitemap và lối vào phải có.
    const lessonPages = await Promise.all(data.lessons.map(async l => {
      const res = await fetch(`${BASE}${ROUTE}/${l.id}`);
      const html = await res.text();
      return res.ok && html.includes(l.title);
    }));
    check('Cả 40 trang bài export và chứa đúng tiêu đề', lessonPages.every(Boolean));
    const sitemap = await (await fetch(`${BASE}/sitemap.xml`)).text();
    check('Sitemap chứa trang lộ trình và 40 bài', sitemap.includes(`<loc>`) && data.lessons.every(l => sitemap.includes(`${ROUTE}/${l.id}`)) && sitemap.includes(`${ROUTE}</loc>`));
    const home = await (await fetch(`${BASE}/`)).text();
    check('Trang chủ và header có lối vào lộ trình', home.includes('Mất gốc Hóa?') && home.includes('Học lại Hóa'));
    const practice = await fetch(`${BASE}/de-thi/de-hoa-11-bai-06/luyen-tap`);
    check('Liên kết luyện thêm từ bài nitrogen mở được', practice.ok);
    check('Không có lỗi JavaScript trong các trang lộ trình', errors.length === 0, errors.join('; '));
  } finally { await browser.close(); }
}
(async () => {
  try {
    contentChecks();
    if (!process.argv.includes('--content-only')) await browserChecks();
  } catch (error) { check('Thực thi bộ kiểm tra lộ trình Hóa', false, error.stack || error.message); }
  finish();
})();
