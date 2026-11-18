'use client';

import { useMemo, useState } from 'react';
import { Markup } from '@/components/ui/markup';
import type { FormulaTopic } from '@/lib/formula-types';

// Bỏ dấu tiếng Việt để gõ "luong giac" vẫn tìm được "Lượng giác".
function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');
}

interface FormulaBookProps {
  topics: FormulaTopic[];
}

// Sổ tay công thức: ô tìm kiếm + mục lục dính đầu trang, lọc tại chỗ không cuộn trang.
export function FormulaBook({ topics }: FormulaBookProps) {
  const [query, setQuery] = useState('');

  const total = useMemo(() => topics.reduce((sum, topic) => sum + topic.formulas.length, 0), [topics]);

  const visible = useMemo(() => {
    const keyword = normalize(query.trim());
    if (!keyword) return topics;
    return topics
      .map((topic) => ({
        ...topic,
        formulas: topic.formulas.filter((formula) => {
          const haystack = normalize(`${topic.title} ${formula.name} ${formula.keywords.join(' ')}`);
          return haystack.includes(keyword);
        }),
      }))
      .filter((topic) => topic.formulas.length > 0);
  }, [topics, query]);

  const shown = visible.reduce((sum, topic) => sum + topic.formulas.length, 0);

  return (
    <div>
      <div className="sticky top-0 z-20 rounded-2xl border bg-background/95 px-4 py-3 shadow-soft backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <label className="sr-only" htmlFor="formula-search">Tìm công thức</label>
        <input
          id="formula-search"
          data-formula-search
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Tìm công thức, ví dụ: lượng giác, tích phân, xác suất…"
          className="h-10 w-full rounded-xl border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-primary/40"
        />
        <div className="mt-2 flex items-center gap-2 overflow-x-auto whitespace-nowrap pb-1 text-xs">
          {visible.map((topic) => (
            <a
              key={topic.id}
              href={`#${topic.id}`}
              className="shrink-0 rounded-full border bg-secondary/50 px-3 py-1.5 font-medium text-foreground transition-colors hover:bg-secondary"
            >
              {topic.title} · {topic.formulas.length}
            </a>
          ))}
        </div>
        <p data-formula-count aria-live="polite" className="mt-1 text-xs text-muted-foreground">
          Hiển thị {shown}/{total} công thức
        </p>
      </div>

      {visible.map((topic) => (
        <section key={topic.id} id={topic.id} data-topic-id={topic.id} className="mt-10 scroll-mt-40">
          <h2 className="text-xl font-bold tracking-tight">{topic.title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{topic.gradeNote}</p>
          <div className="mt-4 grid gap-4">
            {topic.formulas.map((formula) => (
              <article key={formula.id} data-formula-id={formula.id} className="min-w-0 rounded-2xl border bg-background p-5">
                <h3 className="text-base font-semibold">{formula.name}</h3>
                {/* Chỉ .math-display là khung cuộn: katex-display để overflow tràn ra đó, căn trái
                    khi rộng (căn giữa sẽ cắt mất vế trái không cuộn tới được); min-w-full + text-center
                    bên trong giữ công thức hẹp vẫn căn giữa như cũ. */}
                <div className="article-content mt-3 overflow-x-auto text-sm [&_.katex-display]:my-0 [&_.katex-display]:inline-block [&_.katex-display]:min-w-full [&_.katex-display]:overflow-visible [&_.katex-display]:text-center [&_.math-display]:text-left">
                  <Markup source={`$$${formula.latex}$$`} block />
                </div>
                <ul className="mt-3 space-y-1.5 text-sm leading-relaxed text-muted-foreground">
                  {formula.notes.map((note, index) => (
                    <li key={index} className="flex gap-2">
                      <span aria-hidden="true" className="mt-0.5 shrink-0 text-primary">•</span>
                      <Markup source={note} className="min-w-0 flex-1 overflow-x-auto" />
                    </li>
                  ))}
                </ul>
                <details data-formula-example className="mt-4 rounded-xl border bg-secondary/30 px-4 py-3 text-sm">
                  <summary className="cursor-pointer select-none font-medium text-foreground">
                    Ví dụ minh họa
                  </summary>
                  <div className="mt-3 space-y-2 leading-relaxed">
                    <Markup source={formula.example.prompt} className="block overflow-x-auto font-medium" />
                    <ol className="list-decimal space-y-1.5 pl-5">
                      {formula.example.steps.map((step, index) => (
                        <li key={index} className="overflow-x-auto">
                          <Markup source={step} />
                        </li>
                      ))}
                    </ol>
                    <p className="overflow-x-auto">
                      <span className="font-medium">Đáp số: </span>
                      <Markup source={formula.example.answer} />
                    </p>
                  </div>
                </details>
              </article>
            ))}
          </div>
        </section>
      ))}

      {visible.length === 0 ? (
        <p data-formula-empty className="mt-10 rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
          Không tìm thấy công thức nào khớp “{query.trim()}”. Thử từ khóa ngắn hơn, ví dụ “đạo hàm”,
          “logarit” hoặc “xác suất”.
        </p>
      ) : null}
    </div>
  );
}