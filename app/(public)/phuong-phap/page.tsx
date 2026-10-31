import type { Metadata } from 'next';
import Link from 'next/link';
import { ArticleBrowser } from '@/components/articles/article-browser';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { Button } from '@/components/ui/button';
import { listArticleSubjects, listArticles } from '@/lib/content';
import { buildOpenGraph, buildTwitter } from '@/lib/seo';

const listDescription =
  'Các bài viết hướng dẫn kỹ thuật làm bài THPT: loại trừ đáp án, đọc dấu hiệu đề, phân bổ thời gian và tư duy theo từng môn.';

export const metadata: Metadata = {
  title: 'Phương pháp & tư duy',
  description: listDescription,
  alternates: { canonical: '/phuong-phap' },
  openGraph: buildOpenGraph({
    title: 'Phương pháp & tư duy',
    description: listDescription,
    path: '/phuong-phap',
  }),
  twitter: buildTwitter('Phương pháp & tư duy', listDescription),
};

export default function MethodArticleListPage() {
  return (
    <div className="container py-10 md:py-14">
      <Breadcrumbs
        items={[{ label: 'Trang chủ', href: '/' }, { label: 'Phương pháp' }]}
      />

      <div className="mt-4">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Phương pháp &amp; tư duy</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
          Hiểu cách ra đề và cách tư duy quan trọng hơn việc học thuộc đáp án. Mỗi bài viết tập
          trung vào một kỹ thuật cụ thể bạn có thể áp dụng ngay trong lần làm đề tiếp theo.
        </p>
      </div>

      <ArticleBrowser articles={listArticles({ limit: 100 })} subjects={listArticleSubjects()} />

      <section className="mt-12 rounded-2xl border bg-secondary/30 px-6 py-8 md:px-10">
        <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Áp dụng vào đề thi thật</h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Đọc phương pháp rồi luyện ngay trên đề có cấu trúc và thời gian tương tự kỳ thi.
            </p>
          </div>
          <Button asChild size="lg">
            <Link href="/de-thi">Chọn đề luyện tập</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
