// Render Markdown tối giản, escape toàn bộ HTML đầu vào để tránh XSS.
// Hỗ trợ tiêu đề, danh sách, trích dẫn, ảnh, liên kết nội bộ/http(s) và công thức toán KaTeX ($...$, $$...$$).
import { renderToString } from 'katex';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Chỉ cho phép đường dẫn nội bộ hoặc http(s); chặn javascript:, data: và URL lạ.
function safeUrl(raw: string): string | null {
  const value = raw.trim();

  if (!value || value.startsWith('//')) {
    return null;
  }

  if (value.startsWith('/')) {
    return escapeHtml(value);
  }

  if (/^https?:\/\//i.test(value)) {
    try {
      const parsed = new URL(value);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        return escapeHtml(parsed.toString());
      }
    } catch {
      return null;
    }
  }

  return null;
}

// Render TeX sang HTML bằng KaTeX (throwOnError=false để công thức sai vẫn hiển thị gần đúng).
// trust=false chặn \href/\htmlClass độc hại; KaTeX tự escape mọi ký tự người dùng nhập.
function renderMath(tex: string, displayMode: boolean): string {
  try {
    return renderToString(tex, {
      throwOnError: false,
      displayMode,
      output: 'html',
      strict: false,
      trust: false,
    });
  } catch {
    return escapeHtml(displayMode ? `$$${tex}$$` : `$${tex}$`);
  }
}

// Tách công thức ra placeholder trước khi escape/inline để TeX không bị biến đổi.
// \u0001 là marker riêng, không trùng marker code \u0000 và không bị escapeHtml đụng tới.
// Inline math yêu cầu $ mở theo sau là ký tự khác khoảng trắng, $ đóng đứng sau ký tự
// khác khoảng trắng và không bị escape (tránh nhầm giá tiền kiểu "100$ và 200$").
function extractMath(value: string, sink: string[]): string {
  return value
    .replace(/\$\$([\s\S]+?)\$\$/g, (_match, tex: string) => {
      sink.push(renderMath(tex.trim(), true));
      return `\u0001${sink.length - 1}\u0001`;
    })
    .replace(/(?<![\\$])\$(?![\s$])([^$\n]+?)(?<![\\\s])\$(?!\$)/g, (_match, tex: string) => {
      sink.push(renderMath(tex.trim(), false));
      return `\u0001${sink.length - 1}\u0001`;
    });
}

function renderInline(value: string): string {
  const codes: string[] = [];
  const maths: string[] = [];

  // Tách code trước để `$...$` bên trong code không bị render thành công thức.
  const source = value.trim().replace(/`([^`]+)`/g, (_match, code: string) => {
    codes.push(`<code>${escapeHtml(code)}</code>`);
    return `\u0000${codes.length - 1}\u0000`;
  });

  let html = escapeHtml(extractMath(source, maths));

  html = html
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');

  html = html.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (match, alt: string, url: string) => {
    const href = safeUrl(url);
    if (!href) {
      return match;
    }
    return `<img src="${href}" alt="${alt}" loading="lazy" />`;
  });

  html = html.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (match, label: string, url: string) => {
    const href = safeUrl(url);
    if (!href) {
      return match;
    }
    return `<a href="${href}" rel="noopener noreferrer" target="_blank">${label}</a>`;
  });

  html = html.replace(/\n/g, '<br />');
  html = html.replace(/\u0000(\d+)\u0000/g, (_match, index: string) => codes[Number(index)] ?? '');
  html = html.replace(/\u0001(\d+)\u0001/g, (_match, index: string) => maths[Number(index)] ?? '');

  return html;
}

// Chỉ nhúng video từ YouTube qua youtube-nocookie để tránh mã độc từ URL lạ.
function youtubeEmbedUrl(raw: string): string | null {
  const value = raw.trim();

  if (!/^https?:\/\//i.test(value)) {
    return null;
  }

  let parsed: URL;

  try {
    parsed = new URL(value);
  } catch {
    return null;
  }

  const host = parsed.hostname.replace(/^www\./i, '').toLowerCase();
  let videoId: string | null = null;

  if (host === 'youtu.be') {
    videoId = parsed.pathname.slice(1);
  } else if (host === 'youtube.com' || host === 'm.youtube.com') {
    if (parsed.pathname === '/watch') {
      videoId = parsed.searchParams.get('v');
    } else if (parsed.pathname.startsWith('/embed/')) {
      videoId = parsed.pathname.slice('/embed/'.length);
    } else if (parsed.pathname.startsWith('/shorts/')) {
      videoId = parsed.pathname.slice('/shorts/'.length);
    }
  }

  if (!videoId || !/^[A-Za-z0-9_-]{11}$/.test(videoId)) {
    return null;
  }

  return `https://www.youtube-nocookie.com/embed/${videoId}`;
}

export function renderMarkdown(markdown: string): string {
  const normalized = markdown.trim();

  if (!normalized) {
    return '';
  }

  return normalized
    .split(/\n{2,}/)
    .map((block) => {
      const lines = block.split('\n');
      const videoMatch = block.match(/^@\[video]\(([^)\s]+)\)$/);
      const displayMathMatch = block.match(/^\$\$([\s\S]+)\$\$$/);

      if (displayMathMatch) {
        return `<div class="math-display">${renderMath(displayMathMatch[1].trim(), true)}</div>`;
      }

      if (videoMatch) {
        const embedUrl = youtubeEmbedUrl(videoMatch[1]);

        if (embedUrl) {
          return `<div class="video-embed"><iframe src="${escapeHtml(
            embedUrl,
          )}" title="Video minh họa" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div>`;
        }
      }

      if (block.startsWith('### ')) {
        return `<h3>${renderInline(block.slice(4))}</h3>`;
      }

      if (block.startsWith('## ')) {
        return `<h2>${renderInline(block.slice(3))}</h2>`;
      }

      if (block.startsWith('# ')) {
        return `<h2>${renderInline(block.slice(2))}</h2>`;
      }

      if (lines.every((line) => line.startsWith('> '))) {
        return `<blockquote>${renderInline(
          lines.map((line) => line.slice(2)).join('\n'),
        )}</blockquote>`;
      }

      if (lines.every((line) => line.startsWith('- ') || line.startsWith('* '))) {
        const items = lines
          .map((line) => `<li>${renderInline(line.slice(2))}</li>`)
          .join('');
        return `<ul>${items}</ul>`;
      }

      if (lines.every((line) => /^\d+\.\s/.test(line))) {
        const items = lines
          .map((line) => `<li>${renderInline(line.replace(/^\d+\.\s/, ''))}</li>`)
          .join('');
        return `<ol>${items}</ol>`;
      }

      return `<p>${renderInline(lines.join('\n'))}</p>`;
    })
    .join('\n');
}
