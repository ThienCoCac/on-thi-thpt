// Kiểm tra nội dung, đáp số ví dụ và thao tác sổ tay công thức Toán trên bản export.
// Chạy nhanh không mở Chrome: node scripts/verify-cong-thuc-toan.cjs --content-only.
// Bộ tính dưới đây cài độc lập với lib/formula-check.ts (dùng Function thay vì parser)
// để hai bên soi chéo nhau: lệch một bên là bắt được lỗi số liệu hoặc lỗi ngữ pháp.
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.resolve(__dirname, '..');
const BASE = process.env.BASE || `http://localhost:${process.env.VERIFY_PORT || 4180}`;
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const ROUTE = '/cong-thuc/toan';
const results = [];
let meta;
let topics;
function check(name, ok, detail = '') {
  results.push({ name, ok });
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);
}
function finish() {
  const failed = results.filter(r => !r.ok).length;
  console.log(`\nTổng: ${results.length} kiểm tra, ${failed} thất bại.`);
  process.exitCode = failed || !results.length ? 1 : 0;
}
// Ngữ pháp biểu thức kiểm chứng: số, + - * / ^ ( ) . và pi, e, sqrt, abs, sin, cos, tan, ln, log, exp.
// Bắt buộc đổi ^ thành ** TRƯỚC khi tính: ^ trong JS là XOR, để nguyên sẽ sai âm thầm (1/3^2 ≠ 1/9).
const TOKENS = /(\d+(?:\.\d+)?|\.\d+|sqrt|abs|sin|cos|tan|exp|ln|log|pi|e|[+\-*/^()])/g;
const MATH_MAP = { pi: 'Math.PI', e: 'Math.E', sqrt: 'Math.sqrt', abs: 'Math.abs', sin: 'Math.sin', cos: 'Math.cos', tan: 'Math.tan', ln: 'Math.log', log: 'Math.log10', exp: 'Math.exp' };
function evaluate(expression) {
  const compact = expression.replace(/\s+/g, '');
  const tokens = compact.match(TOKENS) || [];
  if (!compact || tokens.join('') !== compact) throw new Error(`Ký tự lạ trong biểu thức: ${expression}`);
  const js = tokens.map(t => MATH_MAP[t] || t).join('').replace(/\^/g, '**');
  const value = Function(`"use strict"; return (${js});`)();
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error(`Không cho số hữu hạn: ${expression}`);
  return value;
}
const EXPECTED_IDS = {
  'luong-giac': ['lg-he-thuc-co-ban', 'lg-cong', 'lg-nhan-doi', 'lg-tong-tich', 'lg-goc-dac-biet', 'lg-phuong-trinh-co-ban'],
  'ham-so-dao-ham': ['dh-don-dieu-cuc-tri', 'dh-gtln-nn', 'dh-tiem-can', 'dh-quy-tac-tinh', 'dh-bang-co-ban', 'dh-ham-phan-thuc', 'dh-tiep-tuyen'],
  'mu-logarit': ['ml-luy-thua', 'ml-can-thuc', 'ml-log-dinh-nghia', 'ml-log-quy-tac', 'ml-doi-co-so', 'ml-ham-mu-log-lai-kep'],
  'nguyen-ham-tich-phan': ['tp-nguyen-ham-co-ban', 'tp-tinh-chat', 'tp-newton-leibniz', 'tp-doi-bien-so', 'tp-tung-phan', 'tp-ung-dung'],
  oxyz: ['ox-phep-toan-vecto', 'ox-tich-vo-huong', 'ox-tich-co-huong', 'ox-mat-phang', 'ox-khoang-cach-mat-phang', 'ox-duong-thang', 'ox-mat-cau', 'ox-goc-khoang-cach'],
  'hinh-khong-gian': ['hk-the-tich-da-dien', 'hk-tru-non-cau', 'hk-goc', 'hk-khoang-cach', 'hk-ti-so-the-tich'],
  'he-thuc-luong': ['ht-dinh-ly-cosin', 'ht-dinh-ly-sin', 'ht-dien-tich-tam-giac', 'ht-trung-tuyen-trong-tam', 'ht-tich-vo-huong-phang', 'ht-he-thuc-vuong'],
  'duong-conic': ['dc-duong-thang', 'dc-duong-tron', 'dc-elipse', 'dc-hyperbol', 'dc-parabol', 'dc-ham-bac-hai'],
  'to-hop-xac-suat': ['xs-quy-tac-dem', 'xs-hoan-vi-chinh-hop-to-hop', 'xs-nhi-thuc-newton', 'xs-co-dien', 'xs-quy-tac-cong', 'xs-quy-tac-nhan', 'xs-co-dieu-kien-bayes'],
  'thong-ke': ['tk-so-trung-binh', 'tk-trung-vi', 'tk-mot', 'tk-phuong-sai-do-lech-chuan', 'tk-khoang-bien-thien-tu-phan-vi'],
  'day-so-cap-so': ['ds-day-so', 'ds-cap-so-cong', 'ds-cap-so-nhan', 'ds-lui-vo-han'],
  'so-phuc': ['sp-khai-niem', 'sp-phep-toan', 'sp-mo-dun-tinh-chat', 'sp-dang-luong-giac-moivre'],
  'gioi-han-lien-tuc': ['gh-gioi-han-day-so', 'gh-gioi-han-ham-so', 'gh-ham-lien-tuc'],
  'bat-dang-thuc': ['bdt-tam-thuc-bac-hai', 'bdt-cauchy', 'bdt-tri-tuyet-doi'],
};
function allTexts(formula) {
  return [formula.name, ...formula.keywords, ...formula.notes, formula.example.prompt, ...formula.example.steps, formula.example.answer];
}
function contentChecks() {
  meta = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/cong-thuc/toan.json'), 'utf8'));
  const dir = path.join(ROOT, 'content/cong-thuc/toan');
  topics = meta.topics.map(name => JSON.parse(fs.readFileSync(path.join(dir, `${name}.json`), 'utf8')));
  const formulas = topics.flatMap(t => t.formulas);
  check('Meta đúng khuôn: version 1, môn toan, 14 chủ đề, nguồn HTTPS', meta.version === 1 && meta.subject === 'toan' && meta.topics.length === 14 && meta.limits.length >= 3 && meta.sources.length >= 3 && meta.sources.every(s => s.url.startsWith('https://') && s.label.length > 5));
  const onDisk = fs.readdirSync(dir).filter(n => n.endsWith('.json')).map(n => n.slice(0, -5)).sort();
  check('Thư mục chủ đề khớp đúng khai báo trong meta', onDisk.length === meta.topics.length && onDisk.every((n, i) => n === [...meta.topics].sort()[i]));
  check('Đủ 14 chủ đề và 76 công thức', topics.length === 14 && formulas.length === 76, `${topics.length} chủ đề / ${formulas.length} công thức`);
  check('Mã chủ đề và mã công thức không trùng', new Set(topics.map(t => t.id)).size === 14 && new Set(formulas.map(f => f.id)).size === 76);
  for (const topic of topics) {
    const expected = EXPECTED_IDS[topic.id];
    check(`Chủ đề ${topic.id} đúng bộ công thức đã chốt`, Boolean(expected) && topic.formulas.length === expected.length && topic.formulas.every((f, i) => f.id === expected[i]) && topic.title.length > 3 && topic.gradeNote.length > 10);
  }
  check('Mỗi công thức đủ thành phần: từ khóa, ghi chú, ví dụ ≥2 bước, đáp số', formulas.every(f => f.keywords.length >= 1 && f.notes.length >= 1 && f.example.steps.length >= 2 && f.example.answer.length > 3 && f.name.length > 5));
  check('Latex là TeX thô không bọc $, mọi công thức có phép tính kiểm chứng', formulas.every(f => f.latex.length > 5 && !f.latex.includes('$') && f.check && typeof f.check.expression === 'string' && Number.isFinite(f.check.value) && (f.check.tolerance === undefined || f.check.tolerance > 0)));
  const foreign = /[\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]/;
  check('Không lẫn chữ Hán/Nhật/Hàn hay marker TODO trong nội dung', formulas.every(f => allTexts(f).every(t => !foreign.test(t) && !/TODO|FIXME/i.test(t))) && topics.every(t => !foreign.test(t.title + t.gradeNote)));
  check('Số ký tự $ chẵn trong mọi mảnh văn bản (công thức đóng đủ)', formulas.every(f => [...f.notes, f.example.prompt, ...f.example.steps, f.example.answer].every(t => (t.match(/\$/g) || []).length % 2 === 0)));
  // Tính lại từng đáp số ví dụ bằng bộ tính độc lập, không tin số ghi sẵn.
  for (const formula of formulas) {
    let ok = false;
    let detail = 'thiếu phép tính';
    if (formula.check) {
      try {
        const actual = evaluate(formula.check.expression);
        const tolerance = formula.check.tolerance ?? 1e-6;
        ok = Math.abs(actual - formula.check.value) <= tolerance;
        detail = `${actual} / ${formula.check.value}`;
      } catch (error) {
        detail = error.message;
      }
    }
    check(`${formula.id}: tính lại đáp số ví dụ`, ok, detail);
  }
  const latexOf = id => formulas.find(f => f.id === id).latex;
  const keyFormulas = [
    ['lg-he-thuc-co-ban', '\\sin^2\\alpha + \\cos^2\\alpha = 1'],
    ['lg-cong', '\\cos(a \\pm b) &= \\cos a\\cos b \\mp \\sin a\\sin b'],
    ['xs-co-dien', 'P(A) = \\frac{n(A)}{n(\\Omega)}'],
    ['ox-tich-vo-huong', '\\vec{a} \\cdot \\vec{b} = a_1b_1 + a_2b_2 + a_3b_3'],
    ['sp-khai-niem', 'i^2 = -1'],
    ['gh-gioi-han-ham-so', '\\frac{\\sin x}{x} = 1'],
    ['bdt-cauchy', '\\sqrt{ab}'],
  ];
  for (const [id, fragment] of keyFormulas) check(`${id}: công thức chốt có mặt đúng dạng`, latexOf(id).includes(fragment));
  check('Phạm vi nói thật: số phức là chuyên đề, không bắt buộc từ 2025', meta.scopeNote.includes('chuyên đề') && meta.scopeNote.includes('2025') && topics.find(t => t.id === 'so-phuc').gradeNote.includes('chuyên đề'));
}
async function setSearch(page, value) {
  await page.click('#formula-search', { clickCount: 3 });
  await page.keyboard.press('Backspace');
  if (value) await page.type('#formula-search', value);
}
async function browserChecks() {
  const puppeteer = require('C:/Users/trinh/.qoder/tmp/shot/node_modules/puppeteer-core');
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const errors = [];
  browser.on('targetcreated', async target => { const p = await target.page(); if (p) p.on('pageerror', e => errors.push(e.message)); });
  const shotDir = path.join(ROOT, '.verify', 'cong-thuc');
  fs.mkdirSync(shotDir, { recursive: true });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    await page.goto(`${BASE}${ROUTE}`, { waitUntil: 'networkidle0' });
    await page.waitForFunction(() => document.body.innerText.includes('Sổ tay công thức Toán THPT'), { timeout: 15000 });
    check('Trang sổ tay mở được với tiêu đề và lời dẫn', await page.evaluate(() => document.querySelector('h1').textContent.includes('Sổ tay công thức Toán THPT') && document.body.innerText.includes('Nguồn tham khảo')));
    check('Hiện đủ 14 chủ đề và 76 thẻ công thức', await page.evaluate(() => document.querySelectorAll('[data-topic-id]').length === 14 && document.querySelectorAll('[data-formula-id]').length === 76));
    check('Mục lục đủ 14 neo trỏ đúng chủ đề', await page.evaluate(() => {
      // Bỏ qua liên kết nhảy tới nội dung chính của bố cục chung.
      const links = [...document.querySelectorAll('a[href^="#"]')].filter(a => a.getAttribute('href') !== '#main-content');
      const ids = [...document.querySelectorAll('[data-topic-id]')].map(s => s.id);
      return links.length === 14 && ids.every(id => links.some(a => a.getAttribute('href') === `#${id}`));
    }));
    check('Mọi công thức hiển thị KaTeX thật, không lộ TeX thô', await page.evaluate(() => document.querySelectorAll('.math-display .katex').length === 76 && !document.body.innerText.includes('$$') && !document.body.innerText.includes('\\begin')));
    check('Bộ đếm hiện 76/76 công thức', await page.evaluate(() => document.querySelector('[data-formula-count]').textContent.includes('76/76')));
    check('Mỗi công thức có khối ví dụ đóng/mở được', await page.evaluate(() => document.querySelectorAll('[data-formula-example]').length === 76));
    await page.click('[data-formula-example] summary');
    check('Mở ví dụ đầu thấy đủ các bước và đáp số', await page.evaluate(() => {
      const box = document.querySelector('[data-formula-example]');
      return box.open && box.querySelectorAll('ol li').length >= 2 && box.textContent.includes('Đáp số');
    }));
    // Lọc không dấu phải tìm được tiếng Việt có dấu; lọc tại chỗ, không tự cuộn trang.
    // Số thẻ kỳ vọng tính từ dữ liệu gốc (cùng quy tắc bỏ dấu), không đoán cứng.
    const normalize = value => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
    const expectedFor = keyword => topics.reduce((sum, topic) => sum + topic.formulas.filter(f => normalize(`${topic.title} ${f.name} ${f.keywords.join(' ')}`).includes(keyword)).length, 0);
    const luongGiac = expectedFor('luong giac');
    const scrollBefore = await page.evaluate(() => window.scrollY);
    await setSearch(page, 'luong giac');
    await page.waitForFunction(n => document.querySelector('[data-formula-count]').textContent.includes(`${n}/76`), { timeout: 15000 }, luongGiac);
    check('Tìm "luong giac" không dấu lọc đúng số thẻ theo dữ liệu', await page.evaluate(n => document.querySelectorAll('[data-formula-id]').length === n && Boolean(document.querySelector('[data-topic-id="luong-giac"]')), luongGiac), `${luongGiac} thẻ`);
    check('Lọc không tự cuộn trang', await page.evaluate(before => window.scrollY === before, scrollBefore));
    await setSearch(page, 'khong ton tai xyz');
    await page.waitForSelector('[data-formula-empty]', { timeout: 15000 });
    check('Từ khóa vô nghĩa hiện trạng thái trống, không còn thẻ nào', await page.evaluate(() => document.querySelectorAll('[data-formula-id]').length === 0 && document.querySelector('[data-formula-empty]').textContent.includes('Không tìm thấy')));
    await setSearch(page, '');
    await page.waitForFunction(() => document.querySelectorAll('[data-formula-id]').length === 76, { timeout: 15000 });
    check('Xóa từ khóa trả lại đủ 76 công thức', true);
    await page.evaluate(() => { const chip = [...document.querySelectorAll('a[href^="#"]')].find(a => a.getAttribute('href') === '#oxyz'); chip.click(); });
    await page.waitForFunction(() => { const rect = document.getElementById('oxyz').getBoundingClientRect(); return rect.top >= 0 && rect.top <= 220; }, { timeout: 15000 });
    check('Bấm mục lục nhảy tới đúng chủ đề Oxyz', true);
    await page.screenshot({ path: path.join(shotDir, 'desktop.png'), fullPage: true });
    // Mobile 390px: không tràn ngang, công thức rộng cuộn trong khung của nó.
    await page.setViewport({ width: 390, height: 844 });
    await page.goto(`${BASE}${ROUTE}`, { waitUntil: 'networkidle0' });
    await page.waitForFunction(() => document.querySelectorAll('[data-formula-id]').length === 76, { timeout: 15000 });
    check('Mobile 390px không tràn ngang toàn trang', await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
    check('Công thức rộng cuộn ngang trong khung, không phá bố cục', await page.evaluate(() => [...document.querySelectorAll('.math-display')].every(el => getComputedStyle(el).overflowX === 'auto')));
    check('Mọi công thức hoặc vừa khung hoặc cuộn tới hết, không cắt mất vế', await page.evaluate(() => {
      return [...document.querySelectorAll('.math-display')].every(md => {
        const html = md.querySelector('.katex-html');
        const leftVisible = html.getBoundingClientRect().left >= md.getBoundingClientRect().left - 1;
        const fits = html.getBoundingClientRect().right <= md.getBoundingClientRect().right + 1;
        if (fits) return leftVisible;
        md.scrollLeft = 9999;
        const reachedEnd = md.scrollLeft > 0;
        md.scrollLeft = 0;
        return leftVisible && reachedEnd;
      });
    }));
    check('Công thức rộng cuộn ngang thật sự (ví dụ số trung bình)', await page.evaluate(() => {
      const md = document.querySelector('[data-formula-id="tk-so-trung-binh"] .math-display');
      md.scrollLeft = 9999;
      const reached = md.scrollLeft > 0 && md.scrollWidth > md.clientWidth;
      md.scrollLeft = 0;
      return reached;
    }));
    await setSearch(page, 'luong giac');
    await page.waitForFunction(n => document.querySelector('[data-formula-count]').textContent.includes(`${n}/76`), { timeout: 15000 }, luongGiac);
    check('Ô tìm kiếm dùng được trên mobile', true);
    await page.screenshot({ path: path.join(shotDir, 'mobile.png'), fullPage: true });
    await page.close();
    const home = await (await fetch(`${BASE}/`)).text();
    check('Trang chủ có banner và header có lối vào sổ tay', home.includes('Sổ tay công thức Toán THPT') && home.includes('href="/cong-thuc/toan"') && home.includes('Công thức Toán'));
    const sitemap = await (await fetch(`${BASE}/sitemap.xml`)).text();
    check('Sitemap chứa trang sổ tay công thức', sitemap.includes(`${ROUTE}</loc>`));
    check('Không có lỗi JavaScript trong trang sổ tay', errors.length === 0, errors.join('; '));
  } finally { await browser.close(); }
}
(async () => {
  try {
    contentChecks();
    if (!process.argv.includes('--content-only')) await browserChecks();
  } catch (error) { check('Thực thi bộ kiểm tra sổ tay công thức', false, error.stack || error.message); }
  finish();
})();