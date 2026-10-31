import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, CalendarDays, User } from 'lucide-react';
import { ArticleCard } from '@/components/articles/article-card';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { JsonLd } from '@/components/seo/json-ld';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate, toExcerpt } from '@/lib/format';
import {
  getArticleBySlug,
  listArticleSlugs,
  listArticles,
} from '@/lib/content';
import {
  articleJsonLd,
  breadcrumbJsonLd,
  buildOpenGraph,
  buildTwitter,
} from '@/lib/seo';

export const dynamicParams = false;

interface ArticleDetailPageProps {
  params: { slug: string };
}

export function generateStaticParams() {
  return listArticleSlugs().map((slug) => ({ slug }));
}

export function generateMetadata({ params }: ArticleDetailPageProps): Metadata {
  const article = getArticleBySlug(params.slug);

  if (!article) {
    return { title: 'Không tìm thấy bài viết' };
  }

  const description = toExcerpt(article.content);
  const path = `/phuong-phap/${article.slug}`;

  return {
    title: article.title,
    description,
    alternates: { canonical: path },
    openGraph: buildOpenGraph({
      title: article.title,
      description,
      path,
      imageUrl: article.coverImageUrl,
      publishedTime: article.publishedAt.toISOString(),
      modifiedTime: article.updatedAt.toISOString(),
    }),
    twitter: buildTwitter(article.title, description, article.coverImageUrl),
  };
}

export default function MethodArticleDetailPage({ params }: ArticleDetailPageProps) {
  const article = getArticleBySlug(params.slug);

  if (!article) {
    notFound();
  }

  const otherArticles = listArticles({ limit: 4 })
    .filter((item) => item.slug !== article.slug)
    .slice(0, 3);

  return (
    <div className="container max-w-4xl py-8 md:py-12">
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: 'Trang chủ', path: '/' },
            { name: 'Phương pháp', path: '/phuong-phap' },
            { name: article.title, path: `/phuong-phap/${article.slug}` },
          ]),
          articleJsonLd({
            type: 'Article',
            title: article.title,
            description: toExcerpt(article.content),
            path: `/phuong-phap/${article.slug}`,
            authorName: article.author.fullName,
            publishedAt: article.publishedAt,
            updatedAt: article.updatedAt,
            imageUrl: article.coverImageUrl,
          }),
        ]}
      />
      <Breadcrumbs
        items={[
          { label: 'Trang chủ', href: '/' },
          { label: 'Phương pháp', href: '/phuong-phap' },
          { label: article.title },
        ]}
      />

      <article className="mt-5">
        <header className="border-b pb-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{article.subject?.name ?? 'Phương pháp chung'}</Badge>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
              {formatDate(article.publishedAt)}
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <User className="h-3.5 w-3.5" aria-hidden="true" />
              {article.author.fullName}
            </span>
          </div>

          <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight md:text-4xl">
            {article.title}
          </h1>
        </header>

        <div
          className="article-content mt-8"
          dangerouslySetInnerHTML={{ __html: article.contentHtml }}
        />

        {article.relatedExam ? (
          <aside className="mt-10 rounded-xl border border-primary/20 bg-primary/5 p-6">
            <p className="text-xs font-medium uppercase tracking-wide text-primary">
              Đề thi liên quan
            </p>
            <h2 className="mt-2 text-lg font-semibold">{article.relatedExam.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Luyện ngay trên đề được gắn với bài phương pháp này để kiểm tra mức độ hiểu.
            </p>
            <Button asChild className="mt-4">
              <Link href={`/de-thi/${article.relatedExam.slug}`}>Xem đề thi</Link>
            </Button>
          </aside>
        ) : null}
      </article>

      <div className="mt-8">
        <Button asChild variant="ghost" className="-ml-2">
          <Link href="/phuong-phap">
            <ArrowLeft aria-hidden="true" />
            Tất cả bài phương pháp
          </Link>
        </Button>
      </div>

      {otherArticles.length > 0 ? (
        <section className="mt-10 border-t pt-8">
          <h2 className="text-xl font-semibold">Bài viết khác</h2>
          <div className="mt-4 grid gap-5 md:grid-cols-3">
            {otherArticles.map((item) => (
              <ArticleCard key={item.id} article={item} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
