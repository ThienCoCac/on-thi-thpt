// Kiểm tra cấu trúc, tính lại bài số và thao tác Vật lí 12 trên bản export.
// Chạy riêng: node scripts/verify-vat-li.cjs --content-only (không mở Chrome).
const fs = require('node:fs');
const path = require('node:path');
const puppeteer = require('C:/Users/trinh/.qoder/tmp/shot/node_modules/puppeteer-core');
const ROOT = path.resolve(__dirname, '..');
const BASE = process.env.BASE || `http://localhost:${process.env.VERIFY_PORT || 4180}`;
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const subjects = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/subjects.json'), 'utf8')).subjects;
const subject = subjects.find((s) => s.slug === 'vat-li');
const codes = ['chuong-01', 'chuong-02', 'chuong-03', 'chuong-04', 'tong-hop-01'];
const exams = codes.map((code) => JSON.parse(fs.readFileSync(path.join(ROOT, 'content/exams', `de-vat-li-12-${code}.json`), 'utf8')));
const results = [];
function check(name, ok, detail = '') {
  results.push({name, ok});
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);
}
function finish() {
  const failed = results.filter((r) => !r.ok).length;
  console.log(`\nTổng: ${results.length} kiểm tra, ${failed} thất bại.`);
  process.exitCode = failed ? 1 : 0;
}
function answer(exam, n) {
  const q = exam.questions[n - 1];
  return q.options.find((o) => o.key === q.correctAnswer)?.text || '';
}
function number(text) {
  // Đọc cả dấu phẩy thập phân và số mũ Unicode trong phương án.
  const digits = {'⁰':'0','¹':'1','²':'2','³':'3','⁴':'4','⁵':'5','⁶':'6','⁷':'7','⁸':'8','⁹':'9','⁻':'-'};
  const normalized = text.replace(/,/g, '.').replace(/−/g, '-');
  const sci = normalized.match(/(-?\d+(?:\.\d+)?)\s*×\s*10([⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+)/);
  if (sci) return Number(sci[1]) * 10 ** Number([...sci[2]].map((c) => digits[c]).join(''));
  const found = normalized.match(/-?\d+(?:\.\d+)?/);
  return found ? Number(found[0]) * (/^Giảm/.test(text) ? -1 : 1) : NaN;
}
function contentChecks() {
  check('Môn Vật lí có bốn chuyên đề lớp 12', subject?.topics.length === 4 && subject.order === 9);
  const allIds = exams.flatMap((e) => e.questions.map((q) => q.id));
  check('Năm đề có 100 mã câu không trùng', allIds.length === 100 && new Set(allIds).size === 100);
  check('Không có câu hỏi trùng nguyên văn trong đợt', new Set(exams.flatMap((e) => e.questions.map((q) => q.content))).size === 100);
  for (const [i,e] of exams.entries()) {
    check(`${e.slug}: cấu trúc và điểm`, e.subject === 'vat-li' && e.grade === 12 && e.durationMinutes === 45 && e.totalScore === 10 && e.questions.length === 20 && e.type === (i === 4 ? 'FULL_EXAM' : 'TOPIC_TEST') && e.questions.every(q => q.type === 'SINGLE_CHOICE' && q.score === 0.5) && e.questions.reduce((s,q)=>s+q.score,0) === 10);
    check(`${e.slug}: bốn phương án phân biệt và lời giải`, e.questions.every(q => q.options.map(o=>o.key).join('') === 'ABCD' && new Set(q.options.map(o=>o.text)).size === 4 && q.options.some(o=>o.key===q.correctAnswer) && q.explanation.length > 40));
    check(`${e.slug}: phân bố đáp án cân bằng`, [...'ABCD'].every(k=>e.questions.filter(q=>q.correctAnswer===k).length===5));
    check(`${e.slug}: topic hợp lệ, có nhãn tự soạn`, e.description.includes('Đề tự soạn') && e.questions.every(q=>subject.topics.some(t=>t.id===q.topic)));
    check(`${e.slug}: độ khó 6 dễ, 10 trung bình, 4 khó`, ['EASY','MEDIUM','HARD'].every((d,j)=>e.questions.filter(q=>q.difficulty===d).length===[6,10,4][j]));
  }
  check('Mỗi chương có 25 câu trong ngân hàng', subject.topics.every(t=>exams.flatMap(e=>e.questions).filter(q=>q.topic===t.id).length===25));
  // Các biểu thức sau tính lại từ dữ kiện, không đọc kết quả từ lời giải.
  // Giá trị theo đơn vị của phương án, sai số chỉ dùng cho các kết quả làm tròn đã nêu.
  const audit = [
    [0,7,27+273], [0,8,55-20], [0,9,500-200], [0,10,180-60],
    [0,11,0.5*4200*40/1000], [0,12,1800/(0.2*10)], [0,13,0.15*334], [0,14,0.020*2.3e6/1000],
    [0,17,(0.2*80+0.3*20)/0.5], [0,18,4200*80/(1000*0.8)],
    [0,19,(0.1*2100*10+0.1*334000+0.1*4200*20)/1000], [0,20,0.2-50100/334000],
    [1,7,100*6/2], [1,8,2*450/300], [1,9,120*400/300], [1,10,100*3*450/(150*300)],
    [1,11,0.5*8.31*300/0.01], [1,12,83100*0.03/(8.31*300)], [1,13,1.5*1.38e-23*300],
    [1,14,Math.sqrt(1200/300)], [1,16,1.2*500**2/3], [1,17,((127+273)/(27+273)-1)*100,0.05],
    [1,18,150*300/(200*360)*100], [1,19,(300*2+150*4)/6], [1,20,450/300*2],
    [2,7,0.5*3*0.2], [2,8,0.2*4*0.5*Math.sin(Math.PI/6)], [2,10,0.3*0.02],
    [2,11,0.4*0.01*Math.cos(Math.PI/3)], [2,12,100*(0.004-0.001)/0.1],
    [2,14,220*Math.SQRT2/Math.SQRT2], [2,15,100*Math.PI/(2*Math.PI)], [2,16,220*200/1000],
    [2,17,12**2/(6*240)], [2,18,0.02*(0.5-0.1)/(0.2*2)], [2,19,100*0.01*0.2*50], [2,20,3e8/100e6],
    [3,1,23-11], [3,10,0.020*931.5], [3,11,492.8/56], [3,13,100*2**(-15/5)], [3,14,800*2**(-6/2)],
    [3,17,0.693/1000*1e12], [3,18,12/Math.log2(16)], [3,19,8e10*(1-2**-2)], [3,20,0.010*931.5],
    [4,7,3040/(0.4*20)], [4,8,125*8/5], [4,9,0.12/(2*0.3)], [4,10,120*150/600],
    [4,12,960*2**(-8/4)], [4,13,70-100], [4,14,4*240/300], [4,16,127.2/16],
    [4,17,(0.4*4200*40-0.1*334000)/(0.5*4200),0.05], [4,18,83100*0.028/(8.31*280)],
    [4,19,50*40e-4*0.8/(0.020*4)], [4,20,18/Math.log2(8)]
  ];
  for (const [e,n,expected,rounding=0] of audit) {
    const actual = number(answer(exams[e],n));
    const tolerance = rounding || Math.max(Math.abs(expected)*1e-9, 1e-30);
    check(`${codes[e]} c${n}: tính lại kết quả`, Number.isFinite(actual) && Math.abs(actual-expected)<=tolerance, `${actual} / ${expected}`);
  }
  check('Alpha bảo toàn A và Z', answer(exams[3],7)==='A = 206, Z = 82.');
  check('Beta trừ bảo toàn A và tăng Z', answer(exams[3],8)==='A = 14, Z = 7.');
  check('Calcium-40 có 40 nucleon và 20 neutron', answer(exams[4],11)==='40 và 20.');
  check('Định luật Lenz chống lại sự tăng từ thông', answer(exams[2],13)==='Ra khỏi mặt giấy.');
  check('Nhiệt dung riêng và hằng số khí không lẫn đơn vị', answer(exams[0],5)==='J/(kg·K).' && answer(exams[1],5)==='J/(mol·K).');
  check('Biến thiên khối lượng nghỉ dương cho năng lượng toả', answer(exams[3],20).startsWith('Toả '));
}
async function clickText(page, selector, text) {
  const clicked = await page.evaluate((sel, label) => {
    const node = [...document.querySelectorAll(sel)].find(n=>n.textContent.includes(label));
    if (!node || node.disabled) return false;
    node.click(); return true;
  }, selector, text);
  if (!clicked) throw new Error(`Không tìm thấy ${selector}: ${text}`);
}
async function waitText(page, text) {
  await page.waitForFunction(t=>document.body.innerText.includes(t), {timeout:15000}, text);
}
async function runExam(browser, exam, wrong = false) {
  // Mỗi phòng thi dùng tab riêng vì có chặn beforeunload.
  const page = await browser.newPage();
  try {
    await page.goto(`${BASE}/de-thi/${exam.slug}/lam-bai`, {waitUntil:'networkidle0'});
    await clickText(page,'button','Bắt đầu làm bài');
    for (let i=0;i<20;i++) {
      await waitText(page,`Câu ${i+1} / 20`);
      const q = exam.questions[i];
      const key = wrong && i===0 ? (q.correctAnswer==='A'?'B':'A') : q.correctAnswer;
      const selected = await page.evaluate(k=>{
        const labels=[...document.querySelectorAll('main label.flex.cursor-pointer')];
        const label=labels[k.charCodeAt(0)-65];
        if (!label) return false; label.click(); return true;
      },key);
      if (!selected) throw new Error(`Không chọn được ${q.id}`);
      await page.waitForFunction(()=>document.querySelectorAll('main label.flex.cursor-pointer input:checked').length===1);
      if (i<19) await clickText(page,'button','Câu sau');
    }
    await clickText(page,'button','Nộp bài');
    await page.waitForSelector('[role="dialog"]');
    await clickText(page,'[role="dialog"] button','Nộp bài');
    await waitText(page,'Kết quả được chấm ngay trên thiết bị');
    const text=await page.evaluate(()=>document.body.innerText);
    check(`${exam.slug}: chấm ${wrong?'sai một câu':'đúng toàn bộ'}`, text.includes(wrong?'9.50/10':'10/10') && text.includes(wrong?'Đúng 19/20 câu':'Đúng 20/20 câu'));
  } finally { await page.close(); }
}
async function browserChecks() {
  const browser=await puppeteer.launch({executablePath:CHROME,headless:'new',args:['--no-sandbox','--disable-dev-shm-usage']});
  const errors=[];
  browser.on('targetcreated',async target=>{const p=await target.page(); if(p)p.on('pageerror',e=>errors.push(e.message));});
  try {
    const page=await browser.newPage();
    await page.setViewport({width:1280,height:900});
    await page.goto(`${BASE}/de-thi`,{waitUntil:'networkidle0'});
    await clickText(page,'button','Vật lí');
    await waitText(page,'Tìm thấy 5 đề môn Vật lí');
    check('Bộ lọc Vật lí hiển thị năm đề',true);
    const shotDir=path.join(ROOT,'.verify','vat-li');
    fs.mkdirSync(shotDir,{recursive:true});
    await page.screenshot({path:path.join(shotDir,'danh-sach.png'),fullPage:true});
    const bankResponse=await fetch(`${BASE}/data/bank/vat-li.json`);
    const bank=await bankResponse.json();
    check('Ngân hàng Vật lí tải đủ 100 câu',bankResponse.ok && Array.isArray(bank) && bank.length===100);
    check('Ngân hàng xuất đủ 25 câu mỗi chương',subject.topics.every(t=>bank.filter(q=>q.topicId===t.id).length===25));
    for(const exam of exams) {
      await page.goto(`${BASE}/de-thi/${exam.slug}`,{waitUntil:'networkidle0'});
      const text=await page.evaluate(()=>document.body.innerText);
      check(`${exam.slug}: trang chi tiết`,text.includes(exam.title)&&text.includes('20 câu')&&text.includes('45 phút')&&text.includes('10 điểm')&&text.includes('Đề tự soạn'));
      const res=await fetch(`${BASE}/data/exams/${exam.slug}.json`); const data=await res.json();
      check(`${exam.slug}: JSON xuất khớp nội dung và đáp án`,res.ok&&data.questions.length===20&&data.totalScore===10&&data.questions.every((q,i)=>q.id===exam.questions[i].id&&q.correctAnswer===exam.questions[i].correctAnswer));
    }
    // Duyệt tất cả câu qua màn luyện tập thật, bao gồm công thức và lời giải.
    await page.setViewport({width:390,height:844,isMobile:true,deviceScaleFactor:1});
    for (const exam of exams) {
      await page.goto(`${BASE}/de-thi/${exam.slug}/luyen-tap`,{waitUntil:'networkidle0'});
      let valid=true;
      for (let i=0;i<20;i++) {
        await waitText(page,`Câu ${i+1}/20`);
        const clicked=await page.evaluate(k=>{
          const b=[...document.querySelectorAll('button[aria-pressed]')].find(n=>!n.disabled&&(n.querySelector('span')?.textContent||'').trim()===k);
          if(!b)return false;b.click();return true;
        },exam.questions[i].correctAnswer);
        if(!clicked)throw new Error(`Không trả lời được luyện tập ${exam.slug} c${i+1}`);
        await waitText(page,'Lời giải');
        valid=valid&&await page.evaluate(()=>document.body.innerText.includes('Chính xác!')&&!document.querySelector('.katex-error')&&document.documentElement.scrollWidth-document.documentElement.clientWidth<=1);
        if(exam.slug===exams[2].slug&&i===13)await page.screenshot({path:path.join(shotDir,'mobile-cong-thuc.png'),fullPage:true});
        if(i<19)await clickText(page,'button','Câu tiếp');
      }
      check(`${exam.slug}: 20 câu luyện tập, lời giải, công thức và mobile`,valid);
    }
    await page.goto(`${BASE}/luyen-tap`,{waitUntil:'networkidle0'});
    await page.evaluate(()=>localStorage.clear());
    await page.reload({waitUntil:'networkidle0'});
    await clickText(page,'button','Vật lí');
    await waitText(page,'Đang chọn 100 câu phù hợp');
    check('Luyện tập tự do nhận môn và bốn chuyên đề',await page.$$eval('[aria-labelledby="practice-topic-title"] input',els=>els.length===4));
    await clickText(page,'button','Bỏ chọn');
    await clickText(page,'[aria-labelledby="practice-topic-title"] label','Chương I. Vật lí nhiệt');
    await waitText(page,'Đang chọn 25 câu phù hợp');
    await clickText(page,'[aria-labelledby="practice-count-title"] button','10 câu');
    await clickText(page,'button','Bắt đầu luyện tập');
    await waitText(page,'Câu 1/10');
    check('Bắt đầu được phiên 10 câu từ riêng chương nhiệt',true);
    await page.close();
    await runExam(browser,exams[4]);
    await runExam(browser,exams[0],true);
    check('Không có lỗi JavaScript trong các trang Vật lí',errors.length===0,errors.join('; '));
  } finally { await browser.close(); }
}
(async()=>{
  try {
    contentChecks();
    if(!process.argv.includes('--content-only'))await browserChecks();
  } catch(error) {check('Thực thi bộ kiểm tra Vật lí',false,error.stack||error.message);}
  finish();
})();
