'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { BookOpenCheck } from 'lucide-react';
import { ArticleCard } from '@/components/articles/article-card';
import { Button } from '@/components/ui/button';
import { formatNumber } from '@/lib/format';
import type { ArticleSummary, SubjectRef } from '@/lib/content-types';
import { cn } from '@/lib/utils';

const tabClassName =
  'inline-flex items-center rounded-full border px-3.5 py-1.5 text-sm transition-colors';

interface ArticleBrowserProps {
  articles: ArticleSummary[];
  subjects: SubjectRef[];
}

export function ArticleBrowser({ articles, subjects }: ArticleBrowserProps) {
  const [subject, setSubject] = useState('');

  const filtered = useMemo(
    () =>
      subject
        ? articles.filter((article) => article.subject?.slug === subject)
        : articles,
    [articles, subject],
  );

  const activeSubject = subjects.find((item) => item.slug === subject);

  return (
    <div>
      {subjects.length > 1 ? (
        <div className="mt-7 flex flex-wrap gap-2" role="group" aria-label="Lọc theo môn học">
          <button
            type="button"
            aria-pressed={!subject}
            onClick={() => setSubject('')}
            className={cn(
              tabClassName,
              subject
                ? 'hover:bg-secondary'
                : 'border-primary bg-primary text-primary-foreground',
            )}
          >
            Tất cả môn
          </button>
          {subjects.map((item) => {
            const active = subject === item.slug;
            return (
              <button
                key={item.slug}
                type="button"
                aria-pressed={active}
                onClick={() => setSubject(item.slug)}
                className={cn(
                  tabClassName,
                  active
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'hover:bg-secondary',
                )}
              >
                {item.name}
              </button>
            );
          })}
        </div>
      ) : null}

      <p className="mt-6 text-sm text-muted-foreground" role="status">
        {formatNumber(filtered.length)} bài viết
        {activeSubject ? ` môn ${activeSubject.name}` : ''}.
      </p>

      {filtered.length > 0 ? (
        <div className="mt-4 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-dashed px-6 py-14 text-center">
          <BookOpenCheck className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden="true" />
          <h2 className="mt-3 text-lg font-semibold">Chưa có bài viết phù hợp</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Chọn môn khác hoặc xem toàn bộ bài viết. Trong lúc chờ, bạn có thể xem danh sách đề
            thi đã công bố.
          </p>
          <Button asChild variant="outline" className="mt-5">
            <Link href="/de-thi">Xem đề thi</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
