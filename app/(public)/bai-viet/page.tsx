import type { Metadata } from 'next';
import Link from 'next/link';
import { PostBrowser } from '@/components/articles/post-browser';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { Button } from '@/components/ui/button';
import { listPostCategories, listPosts } from '@/lib/content';
import { buildOpenGraph, buildTwitter } from '@/lib/seo';

const listDescription =
  'Kinh nghiệm ôn thi, kỹ năng làm bài và cập nhật mới nhất về kỳ thi tốt nghiệp THPT dành cho học sinh lớp 12.';

export const metadata: Metadata = {
  title: 'Bài viết',
  description: listDescription,
  alternates: { canonical: '/bai-viet' },
  openGraph: buildOpenGraph({
    title: 'Bài viết',
    description: listDescription,
    path: '/bai-viet',
  }),
  twitter: buildTwitter('Bài viết', listDescription),
};

export default function PostListPage() {
  return (
    <div className="container py-10 md:py-14">
      <Breadcrumbs
        items={[{ label: 'Trang chủ', href: '/' }, { label: 'Bài viết' }]}
      />

      <div className="mt-4">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Bài viết</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
          Kinh nghiệm ôn thi, kỹ năng làm bài và những cập nhật mới nhất về kỳ thi tốt nghiệp
          THPT. Chọn chuyên mục phù hợp để đọc đúng phần bạn cần.
        </p>
      </div>

      <PostBrowser posts={listPosts({ limit: 100 })} categories={listPostCategories()} />

      <section className="mt-12 rounded-2xl border bg-secondary/30 px-6 py-8 md:px-10">
        <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Áp dụng vào đề thi thật</h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Đọc kinh nghiệm rồi luyện ngay trên đề có cấu trúc và thời gian tương tự kỳ thi.
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
