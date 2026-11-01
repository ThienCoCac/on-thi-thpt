// Một lệnh duy nhất cho toàn bộ vòng kiểm tra của repo này.
//   node scripts/verify.mjs                  -> tự chọn bộ test theo file vừa sửa
//   node scripts/verify.mjs --scope=all      -> typecheck + lint + build + 9 bộ test
//   node scripts/verify.mjs --scope=deploy   -> như all cộng thêm kiểm tra bản live
// Mọi tiến trình con dùng process.execPath nên không cần thêm node vào PATH.
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const NODE = process.execPath;
const SUITE_HOME = 'C:/Users/trinh/.qoder/tmp';
const PORT = Number(process.env.VERIFY_PORT) || 4180;
const BASE = `http://localhost:${PORT}`;
const OUT_INDEX = join(ROOT, 'out', 'index.html');
const PID_FILE = join(ROOT, 'out', '.serve.pid');
const SUITE_TIMEOUT_MS = 300_000;
const BUILD_TIMEOUT_MS = 900_000;

// Tên các môn trong content/subjects.json -> bộ test trình duyệt tương ứng.
const SUITES = [
  { id: 'static', file: 'shot/verify-static.js', title: 'Giao diện tĩnh, thẻ đề, SEO, 404', lane: 'shared' },
  { id: 'features', file: 'su/verify-features.js', title: 'Luyện tập, tiến độ, sổ tay câu sai', lane: 'shared' },
  { id: 'van', file: 'su/verify-van.js', title: 'Đề Ngữ văn 12', lane: 'subject' },
  { id: 'ktpl', file: 'ktpl/verify-ktpl.js', title: 'Đề Kinh tế và Pháp luật 12', lane: 'subject' },
  { id: 'anh', file: 'english/verify-anh.js', title: 'Đề Tiếng Anh 12', lane: 'subject' },
  { id: 'su', file: 'su/verify-su.js', title: 'Đề Lịch sử 12', lane: 'subject' },
  { id: 'mini', file: 'su/verify-mini-exam.js', title: 'Phiên đề con (10/20/30 câu)', lane: 'subject' },
  { id: 'vact', file: 'vact/verify-vact.js', title: 'Đề Đánh giá năng lực V-ACT', lane: 'subject' },
  { id: 'dia', file: 'dia/verify-dia.js', title: 'Đề Địa lí 12', lane: 'subject' },
  { id: 'live', file: 'shot/verify-live.js', title: 'Bản đã deploy trên Cloudflare', lane: 'live' },
];

const LOCAL_SUITES = SUITES.filter((suite) => suite.lane !== 'live').map((suite) => suite.id);

// Sửa những thứ này thì mọi môn đều có thể vỡ: chạy hết.
const CORE_PATTERNS = [
  /^lib\//,
  /^content\/subjects\.json$/,
  /^app\/globals\.css$/,
  /^tailwind\.config\.ts$/,
  /^next\.config\.mjs$/,
  /^package(-lock)?\.json$/,
  /^tsconfig\.json$/,
  /^postcss\.config\./,
  /^\.env/,
];

// Sửa giao diện: chạy hai bộ test dùng chung.
const UI_PATTERNS = [/^components\//, /^app\//, /^public\//];

// Tên file đề -> bộ test của môn đó (không phụ thuộc slug bên trong file).
const EXAM_PATTERNS = [
  [/^content\/exams\/de-anh-/, ['anh']],
  [/^content\/exams\/mini-test-tieng-anh/, ['anh', 'mini']],
  [/^content\/exams\/de-dia-/, ['dia']],
  [/^content\/exams\/de-ktpl-/, ['ktpl']],
  [/^content\/exams\/de-ngu-van-/, ['van']],
  [/^content\/exams\/de-thi-lich-su-/, ['su', 'mini']],
  [/^content\/exams\/de-v-act-/, ['vact']],
  [/^content\/exams\/de-thi-thu-toan/, ['static']],
];

// Tài liệu, script nội bộ: không cần mở trình duyệt.
const DOCS_PATTERNS = [/^docs\//, /^scripts\//, /^README\.md$/, /^AGENTS\.md$/, /^\.gitignore$/, /^netlify\.toml$/, /^wrangler\.jsonc$/];

const GROUPS = {
  none: [],
  all: LOCAL_SUITES,
  ui: ['static', 'features'],
  shared: ['static', 'features'],
  subjects: LOCAL_SUITES.filter((id) => SUITES.find((suite) => suite.id === id).lane === 'subject'),
  deploy: [...LOCAL_SUITES, 'live'],
};

function parseArgs(argv) {
  const options = {
    scope: 'auto',
    build: 'auto',
    lint: true,
    files: null,
    list: false,
    stopServer: false,
    verbose: false,
  };

  for (const arg of argv) {
    if (arg.startsWith('--scope=')) {
      options.scope = arg.slice('--scope='.length).trim();
    } else if (arg === '--build') {
      options.build = 'force';
    } else if (arg === '--no-build') {
      options.build = 'skip';
    } else if (arg === '--no-lint') {
      options.lint = false;
    } else if (arg.startsWith('--files=')) {
      options.files = arg
        .slice('--files='.length)
        .split(',')
        .map((file) => file.trim())
        .filter(Boolean);
    } else if (arg === '--list') {
      options.list = true;
    } else if (arg === '--stop-server') {
      options.stopServer = true;
    } else if (arg === '--verbose') {
      options.verbose = true;
    } else if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else {
      throw new Error(`Không nhận ra tham số: ${arg}`);
    }
  }

  return options;
}

function log(...lines) {
  console.log(...lines);
}

function seconds(ms) {
  return `${(ms / 1000).toFixed(1)}s`;
}

function changedFiles() {
  const collectors = [
    ['git', ['diff', '--name-only', 'HEAD']],
    ['git', ['ls-files', '--others', '--exclude-standard']],
  ];
  const found = new Set();

  for (const [command, args] of collectors) {
    const result = spawnSync(command, args, { cwd: ROOT, encoding: 'utf8' });
    if (result.status !== 0) {
      // Không có git (ví dụ thư mục export) thì coi như phải kiểm tra toàn bộ.
      return null;
    }
    for (const line of result.stdout.split('\n')) {
      const file = line.trim();
      if (file) {
        found.add(file);
      }
    }
  }

  return [...found];
}

function selectSuites(scope, files) {
  if (GROUPS[scope]) {
    return { ids: GROUPS[scope], reason: `scope=${scope}` };
  }

  if (scope !== 'auto') {
    const ids = scope
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean);
    const unknown = ids.filter((id) => !SUITES.some((suite) => suite.id === id));
    if (unknown.length > 0) {
      throw new Error(`Không có bộ test: ${unknown.join(', ')}. Xem --list.`);
    }
    return { ids, reason: `scope=${scope}` };
  }

  if (files === null) {
    return { ids: LOCAL_SUITES, reason: 'không đọc được git nên chạy đầy đủ' };
  }

  if (files.length === 0) {
    return { ids: [], reason: 'không có thay đổi nào' };
  }

  const matched = new Set();
  const causes = new Map();

  const add = (ids, why) => {
    for (const id of ids) {
      if (!matched.has(id)) {
        causes.set(id, why);
      }
      matched.add(id);
    }
  };

  let onlyDocs = true;

  for (const file of files) {
    if (CORE_PATTERNS.some((pattern) => pattern.test(file))) {
      return { ids: LOCAL_SUITES, reason: `${file} thuộc phần lõi, phải chạy hết` };
    }
    if (!DOCS_PATTERNS.some((pattern) => pattern.test(file))) {
      onlyDocs = false;
    }
    if (UI_PATTERNS.some((pattern) => pattern.test(file))) {
      add(GROUPS.ui, file);
    }
    const exam = EXAM_PATTERNS.find(([pattern]) => pattern.test(file));
    if (exam) {
      add(exam[1], file);
      add(GROUPS.ui, `${file} (số liệu đề đổi)`);
    } else if (/^content\/exams\//.test(file)) {
      add(LOCAL_SUITES, `${file} là đề lạ, an toàn là chạy hết`);
    }
  }

  if (onlyDocs) {
    return { ids: [], reason: 'chỉ sửa tài liệu/script nội bộ' };
  }

  const ids = [...matched];
  const detail = ids.map((id) => `${id}<=${causes.get(id)}`).join(', ');
  return { ids, reason: `tự chọn theo ${files.length} file: ${detail}` };
}

function newestSourceMtime(dir) {
  let newest = 0;
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return newest;
  }

  for (const entry of entries) {
    if (['node_modules', '.next', 'out', '.git', '.qoder'].includes(entry.name)) {
      continue;
    }
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      newest = Math.max(newest, newestSourceMtime(full));
      continue;
    }
    if (!['.ts', '.tsx', '.js', '.mjs', '.css', '.json', '.png', '.svg', '.ico'].includes(extname(entry.name))) {
      continue;
    }
    newest = Math.max(newest, statSync(full).mtimeMs);
  }

  return newest;
}

function buildIsStale() {
  if (!existsSync(OUT_INDEX)) {
    return true;
  }
  const builtAt = statSync(OUT_INDEX).mtimeMs;
  return ['app', 'components', 'lib', 'content', 'public'].some((dir) => newestSourceMtime(join(ROOT, dir)) > builtAt);
}

function runNode(args, { cwd = ROOT, timeout, label }) {
  const started = Date.now();
  const result = spawnSync(NODE, args, { cwd, encoding: 'utf8', timeout, maxBuffer: 40 * 1024 * 1024 });

  if (result.error) {
    return { ok: false, output: `${label}: ${result.error.message}`, ms: Date.now() - started };
  }
  if (result.signal) {
    return { ok: false, output: `${label}: quá thời gian ${Math.round(timeout / 1000)}s`, ms: Date.now() - started };
  }

  return {
    ok: result.status === 0,
    output: `${result.stdout ?? ''}${result.stderr ?? ''}`,
    ms: Date.now() - started,
  };
}

async function serverAlive() {
  try {
    const response = await fetch(`${BASE}/`, { signal: AbortSignal.timeout(2000) });
    return response.ok;
  } catch {
    return false;
  }
}

async function ensureServer(verbose) {
  if (await serverAlive()) {
    return { started: false };
  }

  if (!existsSync(OUT_INDEX)) {
    throw new Error('Chưa có thư mục out/. Chạy build trước (bỏ --no-build).');
  }

  const child = spawn(NODE, [join(ROOT, 'scripts', 'serve-out.mjs')], {
    cwd: ROOT,
    env: { ...process.env, PORT: String(PORT) },
    stdio: 'ignore',
    detached: true,
    windowsHide: true,
  });
  child.unref();

  if (!child.pid) {
    throw new Error('Không khởi động được máy chủ tĩnh ở ' + BASE);
  }
  if (existsSync(dirname(PID_FILE))) {
    writeFileSync(PID_FILE, String(child.pid));
  }

  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (await serverAlive()) {
      if (verbose) {
        log(`  đã bật máy chủ tĩnh ${BASE} (pid ${child.pid})`);
      }
      return { started: true, pid: child.pid };
    }
    await new Promise((done) => setTimeout(done, 150));
  }

  throw new Error(`Máy chủ tĩnh ở ${BASE} không phản hồi sau 6s.`);
}

function stopServer() {
  if (!existsSync(PID_FILE)) {
    log('Không có file pid; máy chủ tĩnh không do script này khởi động.');
    return;
  }
  const pid = Number(readFileSync(PID_FILE, 'utf8').trim());
  rmSync(PID_FILE, { force: true });
  try {
    process.kill(pid);
    log(`Đã tắt máy chủ tĩnh pid ${pid}.`);
  } catch (error) {
    log(`Không tắt được pid ${pid}: ${error.message}`);
  }
}

// Các bộ test in một trong ba dạng tổng kết; đọc dòng này để biết số lượng kiểm tra.
// Không khớp mẫu nào thì coi là lỗi, vì suite có thể chết giữa chừng và in ra dòng cụt.
function parseSummary(output) {
  const total = output.match(/Tổng: (\d+) kiểm tra, (\d+) thất bại\./);
  if (total) {
    return { checks: Number(total[1]), failed: Number(total[2]) };
  }
  const pass = output.match(/(\d+)\/(\d+) PASS/);
  if (pass) {
    return { checks: Number(pass[2]), failed: Number(pass[2]) - Number(pass[1]) };
  }
  const dat = output.match(/(\d+)\/(\d+) kiểm tra đạt\./);
  if (dat) {
    return { checks: Number(dat[2]), failed: Number(dat[2]) - Number(dat[1]) };
  }
  return null;
}

function printFailures(output) {
  const lines = output.split('\n');
  const failing = lines.filter((line) => line.startsWith('FAIL') || line.includes('Script lỗi'));
  if (failing.length > 0) {
    for (const line of failing.slice(0, 25)) {
      log(`      ${line.trim()}`);
    }
    return;
  }
  for (const line of lines.slice(-20)) {
    log(`      ${line}`);
  }
}

function printList() {
  log('Bộ test hiện có (file nằm ngoài repo, xem --help):');
  for (const suite of SUITES) {
    const path = join(SUITE_HOME, suite.file);
    log(`  ${suite.id.padEnd(9)} ${suite.title.padEnd(42)} ${existsSync(path) ? path : 'THIẾU FILE'}`);
  }
  log('Nhóm: ' + Object.keys(GROUPS).join(' | ') + ' | hoặc danh sách id phân cách bằng dấu phẩy.');
}

function printHelp() {
  log(`Dùng: node scripts/verify.mjs [tùy chọn]

  --scope=<auto|all|ui|subjects|deploy|id,id>  chọn bộ test (mặc định: auto theo git diff)
  --files=a.ts,b.ts                            gợi ý phạm vi thủ công
  --build                                      build lại dù out/ còn mới
  --no-build                                   không build (chỉ khi chắc out/ đã cập nhật)
  --no-lint                                    bỏ typecheck + lint
  --verbose                                    in đủ output của từng bộ test
  --stop-server                                tắt máy chủ tĩnh do script này bật
  --list                                       liệt kê bộ test và đường dẫn

Ba tầng kiểm tra:
  nhanh   node scripts/verify.mjs --scope=ui --files=...   khi đang sửa
  đủ      node scripts/verify.mjs --scope=all              trước khi commit
  deploy  node scripts/verify.mjs --scope=deploy           trước khi push/wrangler deploy`);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  let step = 0;
  const next = () => (step += 1);

  if (options.help) {
    printHelp();
    return 0;
  }
  if (options.list) {
    printList();
    return 0;
  }
  if (options.stopServer) {
    stopServer();
    return 0;
  }

  const plan = selectSuites(options.scope, options.files ?? changedFiles());
  log(`Phạm vi: ${plan.reason}`);

  if (plan.ids.length > 0) {
    log(`Sẽ chạy: ${plan.ids.join(', ')} (${plan.ids.length} bộ)\n`);
  }

  if (options.lint) {
    const typecheck = runNode([join(ROOT, 'node_modules', 'typescript', 'bin', 'tsc'), '--noEmit'], {
      label: 'typecheck',
      timeout: BUILD_TIMEOUT_MS,
    });
    log(`[${next()}] typecheck … ${typecheck.ok ? 'OK' : 'LỖI'} (${seconds(typecheck.ms)})`);
    if (!typecheck.ok) {
      log(typecheck.output.split('\n').slice(-25).join('\n'));
      return 1;
    }

    const lint = runNode([join(ROOT, 'node_modules', 'next', 'dist', 'bin', 'next'), 'lint'], {
      label: 'lint',
      timeout: BUILD_TIMEOUT_MS,
    });
    log(`[${next()}] lint … ${lint.ok ? 'OK' : 'LỖI'} (${seconds(lint.ms)})`);
    if (!lint.ok) {
      log(lint.output.split('\n').slice(-25).join('\n'));
      return 1;
    }
  }

  if (options.build !== 'skip') {
    const stale = options.build === 'force' || buildIsStale();
    if (stale) {
      log(`[${next()}] next build (${options.build === 'force' ? 'buộc build' : 'out/ cũ hơn nguồn'}) …`);
      const build = runNode([join(ROOT, 'node_modules', 'next', 'dist', 'bin', 'next'), 'build'], {
        label: 'build',
        timeout: BUILD_TIMEOUT_MS,
      });
      log(`     build ${build.ok ? 'OK' : 'LỖI'} (${seconds(build.ms)})`);
      if (!build.ok) {
        log(build.output.split('\n').slice(-30).join('\n'));
        return 1;
      }
    } else {
      log(`[${next()}] build … bỏ qua, out/ còn mới`);
    }
  } else {
    log(`[${next()}] build … bỏ qua theo --no-build`);
  }

  if (plan.ids.length === 0) {
    log('\nKhông cần kiểm tra bằng trình duyệt. Xong.');
    return 0;
  }

  const needsLocalServer = plan.ids.some((id) => SUITES.find((suite) => suite.id === id).lane !== 'live');
  if (needsLocalServer) {
    const server = await ensureServer(options.verbose);
    log(`[${next()}] máy chủ tĩnh ${BASE} ${server.started ? '(vừa bật)' : '(đang chạy sẵn)'}`);
  }

  const results = [];
  for (const id of plan.ids) {
    const suite = SUITES.find((item) => item.id === id);
    const path = join(SUITE_HOME, suite.file);

    if (!existsSync(path)) {
      log(`[${next()}] ${id} … THIẾU FILE: ${path}`);
      results.push({ id, ok: false, note: 'thiếu file' });
      continue;
    }

    const run = runNode([path], { cwd: dirname(path), timeout: SUITE_TIMEOUT_MS, label: id });
    const summary = parseSummary(run.output);
    const ok = run.ok && summary !== null && summary.failed === 0;

    log(
      `[${next()}] ${suite.title} … ${ok ? 'OK' : 'LỖI'} ` +
        `${summary ? `${summary.checks - summary.failed}/${summary.checks} kiểm tra` : 'không đọc được dòng tổng kết'} ` +
        `(${seconds(run.ms)})`,
    );

    if (!ok || options.verbose) {
      printFailures(run.output);
    }
    results.push({ id, ok, summary });
  }

  const bad = results.filter((item) => !item.ok);
  log('');
  log(bad.length === 0 ? `Tất cả ${results.length} bộ test đều xanh.` : `Cần sửa: ${bad.map((item) => item.id).join(', ')}`);
  return bad.length === 0 ? 0 : 1;
}

main()
  .then((code) => process.exit(code))
  .catch((error) => {
    console.error('verify.mjs lỗi:', error.message);
    process.exit(2);
  });
