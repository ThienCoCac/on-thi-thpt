'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Newspaper } from 'lucide-react';
import { PostCard } from '@/components/articles/post-card';
import { Button } from '@/components/ui/button';
import { formatNumber } from '@/lib/format';
import type { PostSummary } from '@/lib/content-types';
import { cn } from '@/lib/utils';

const tabClassName =
  'inline-flex items-center rounded-full border px-3.5 py-1.5 text-sm transition-colors';

interface PostBrowserProps {
  posts: PostSummary[];
  categories: string[];
}

export function PostBrowser({ posts, categories }: PostBrowserProps) {
  const [category, setCategory] = useState('');

  const filtered = useMemo(
    () => (category ? posts.filter((post) => post.category === category) : posts),
    [posts, category],
  );

  return (
    <div>
      {categories.length > 1 ? (
        <div className="mt-7 flex flex-wrap gap-2" role="group" aria-label="Lọc theo chuyên mục">
          <button
            type="button"
            aria-pressed={!category}
            onClick={() => setCategory('')}
            className={cn(
              tabClassName,
              category
                ? 'hover:bg-secondary'
                : 'border-primary bg-primary text-primary-foreground',
            )}
          >
            Tất cả
          </button>
          {categories.map((item) => {
            const active = category === item;
            return (
              <button
                key={item}
                type="button"
                aria-pressed={active}
                onClick={() => setCategory(item)}
                className={cn(
                  tabClassName,
                  active
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'hover:bg-secondary',
                )}
              >
                {item}
              </button>
            );
          })}
        </div>
      ) : null}

      <p className="mt-6 text-sm text-muted-foreground" role="status">
        {formatNumber(filtered.length)} bài viết
        {category ? ` trong chuyên mục “${category}”` : ''}.
      </p>

      {filtered.length > 0 ? (
        <div className="mt-4 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-dashed px-6 py-14 text-center">
          <Newspaper className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden="true" />
          <h2 className="mt-3 text-lg font-semibold">Chưa có bài viết phù hợp</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Chọn chuyên mục khác hoặc xem toàn bộ bài viết. Trong lúc chờ, bạn có thể ôn luyện
            với các đề thi đã công bố.
          </p>
          <Button asChild variant="outline" className="mt-5">
            <Link href="/de-thi">Xem đề thi</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
