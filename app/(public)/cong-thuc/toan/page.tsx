import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { FormulaBook } from '@/components/formulas/formula-book';
import { getMathFormulaBook } from '@/lib/math-formulas';

export const metadata: Metadata = {
  title: 'Sổ tay công thức Toán THPT',
  description:
    'Tổng hợp công thức Toán THPT theo 14 chủ đề từ lớp 10 đến 12: điều kiện áp dụng, bẫy thường gặp và ví dụ minh họa từng bước cho mỗi công thức.',
  alternates: { canonical: '/cong-thuc/toan' },
};

export default function MathFormulaPage() {
  const book = getMathFormulaBook();

  return (
    <div className="container py-8 md:py-12">
      <Breadcrumbs items={[{ label: 'Trang chủ', href: '/' }, { label: 'Công thức Toán' }]} />
      <div className="mt-6 max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight">{book.meta.title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{book.meta.intro}</p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{book.meta.scopeNote}</p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-relaxed text-muted-foreground">
          {book.meta.limits.map((limit, index) => (
            <li key={index}>{limit}</li>
          ))}
        </ul>
      </div>
      <div className="mt-8">
        <FormulaBook topics={book.topics} />
      </div>
      <section className="mt-12 border-t pt-6 text-sm text-muted-foreground">
        <h2 className="text-base font-semibold text-foreground">Nguồn tham khảo</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          {book.meta.sources.map((source) => (
            <li key={source.url}>
              <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-4">
                {source.label}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}