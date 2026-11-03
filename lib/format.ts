const TIME_ZONE = 'Asia/Ho_Chi_Minh';

const dateFormatter = new Intl.DateTimeFormat('vi-VN', {
  timeZone: TIME_ZONE,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const dateTimeFormatter = new Intl.DateTimeFormat('vi-VN', {
  timeZone: TIME_ZONE,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const numberFormatter = new Intl.NumberFormat('vi-VN');

export function formatDate(value: Date | string | null | undefined): string {
  if (!value) {
    return '—';
  }

  const date = typeof value === 'string' ? new Date(value) : value;
  return Number.isNaN(date.getTime()) ? '—' : dateFormatter.format(date);
}

export function formatDateTime(value: Date | string | null | undefined): string {
  if (!value) {
    return '—';
  }

  const date = typeof value === 'string' ? new Date(value) : value;
  return Number.isNaN(date.getTime()) ? '—' : dateTimeFormatter.format(date);
}

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

export function formatDuration(minutes: number): string {
  const safeMinutes = Math.max(0, Math.round(minutes));

  if (safeMinutes < 60) {
    return `${safeMinutes} phút`;
  }

  const hours = Math.floor(safeMinutes / 60);
  const remainingMinutes = safeMinutes % 60;

  return remainingMinutes === 0
    ? `${hours} giờ`
    : `${hours} giờ ${remainingMinutes} phút`;
}

export function formatTimeSpent(seconds: number | null | undefined): string {
  if (!seconds || seconds <= 0) {
    return '—';
  }

  if (seconds < 60) {
    return 'dưới 1 phút';
  }

  return formatDuration(Math.round(seconds / 60));
}

export function formatScore(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return '—';
  }

  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

// Escape cho mọi nội dung chèn vào HTML dựng sẵn. Đặt ở file thuần tiện ích này
// vì cả trình duyệt (lib/grading.ts) lẫn bước build (lib/markdown.ts) đều cần,
// còn lib/markdown.ts thì kéo theo KaTeX nặng đầu bundle.
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Tạo tóm tắt thuần văn bản từ Markdown hoặc HTML đã render để hiển thị ở thẻ câu hỏi.
export function toExcerpt(markdown: string, maxLength = 160): string {
  const plain = markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/!\[[^\]]*]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)]\([^)]*\)/g, '$1')
    .replace(/[#>*_`~]/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();

  if (plain.length <= maxLength) {
    return plain;
  }

  const cut = plain.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(' ');
  return `${cut.slice(0, lastSpace > maxLength * 0.4 ? lastSpace : maxLength).trim()}…`;
}
