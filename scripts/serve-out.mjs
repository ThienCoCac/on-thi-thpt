// Máy chủ tĩnh tối giản để xem trước thư mục out/ sau khi `npm run build`.
// Mô phỏng cách Netlify phục vụ file: bỏ đuôi .html (pretty URL) và trả 404.html.
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';

const root = resolve('out');
const port = Number(process.env.PORT) || 3000;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.map': 'application/json; charset=utf-8',
};

if (!existsSync(root)) {
  console.error('Không tìm thấy thư mục out/. Hãy chạy `npm run build` trước.');
  process.exit(1);
}

function resolveFile(pathname) {
  const decoded = decodeURIComponent(pathname);
  const target = normalize(join(root, decoded));

  // Chặn path traversal: mọi đường dẫn phải nằm trong out/.
  if (target !== root && !target.startsWith(root + sep)) {
    return null;
  }

  if (existsSync(target) && statSync(target).isDirectory()) {
    const indexFile = join(target, 'index.html');
    if (existsSync(indexFile)) {
      return indexFile;
    }
    // Next.js tạo cả thư mục (cho route con) lẫn file .html cùng tên.
    const siblingHtml = `${target}.html`;
    return existsSync(siblingHtml) ? siblingHtml : null;
  }

  if (existsSync(target) && statSync(target).isFile()) {
    return target;
  }

  if (extname(target) === '') {
    const htmlFile = `${target}.html`;
    if (existsSync(htmlFile)) {
      return htmlFile;
    }
  }

  return null;
}

createServer((req, res) => {
  const pathname = new URL(req.url ?? '/', `http://localhost:${port}`).pathname;
  const file = resolveFile(pathname);

  if (!file) {
    const notFound = join(root, '404.html');
    res.writeHead(404, { 'Content-Type': MIME_TYPES['.html'] });
    if (existsSync(notFound)) {
      createReadStream(notFound).pipe(res);
    } else {
      res.end('404 - Không tìm thấy trang');
    }
    return;
  }

  res.writeHead(200, {
    'Content-Type': MIME_TYPES[extname(file)] ?? 'application/octet-stream',
  });
  createReadStream(file).pipe(res);
}).listen(port, () => {
  console.log(`Xem trước site tĩnh tại http://localhost:${port}`);
});
