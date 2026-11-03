import { renderInlineMarkdown, renderMarkdown } from '@/lib/markdown';

// Mảnh nội dung Markdown/LaTeX thô, render ngay trên máy người dùng. lib/markdown.ts đã
// escape HTML đầu vào và cache theo chuỗi nên cùng một công thức chỉ render một lần.
interface MarkupProps {
  source: string;
  block?: boolean;
  className?: string;
}

export function Markup({ source, block = false, className }: MarkupProps) {
  const html = block ? renderMarkdown(source) : renderInlineMarkdown(source);

  return block ? (
    <div className={className} dangerouslySetInnerHTML={{ __html: html }} />
  ) : (
    <span className={className} dangerouslySetInnerHTML={{ __html: html }} />
  );
}
