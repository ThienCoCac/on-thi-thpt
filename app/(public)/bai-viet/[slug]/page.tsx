import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, CalendarDays, User } from 'lucide-react';
import { PostCard } from '@/components/articles/post-card';
import { CoverImage } from '@/components/articles/cover-image';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { JsonLd } from '@/components/seo/json-ld';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate, toExcerpt } from '@/lib/format';
import { getPostBySlug, listPostSlugs, listPosts } from '@/lib/content';
import {
  articleJsonLd,
  breadcrumbJsonLd,
  buildOpenGraph,
  buildTwitter,
} from '@/lib/seo';

export const dynamicParams = false;

interface PostDetailPageProps {
  params: { slug: string };
}

export function generateStaticParams() {
  return listPostSlugs().map((slug) => ({ slug }));
}

export function generateMetadata({ params }: PostDetailPageProps): Metadata {
  const post = getPostBySlug(params.slug);

  if (!post) {
    return { title: 'Không tìm thấy bài viết' };
  }

  const description = post.excerpt || toExcerpt(post.content);
  const path = `/bai-viet/${post.slug}`;

  return {
    title: post.title,
    description,
    alternates: { canonical: path },
    openGraph: buildOpenGraph({
      title: post.title,
      description,
      path,
      imageUrl: post.coverImageUrl,
      publishedTime: post.publishedAt.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
    }),
    twitter: buildTwitter(post.title, description, post.coverImageUrl),
  };
}

export default function PostDetailPage({ params }: PostDetailPageProps) {
  const post = getPostBySlug(params.slug);

  if (!post) {
    notFound();
  }

  const otherPosts = listPosts({ limit: 4 })
    .filter((item) => item.slug !== post.slug)
    .slice(0, 3);

  return (
    <div className="container max-w-4xl py-8 md:py-12">
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: 'Trang chủ', path: '/' },
            { name: 'Bài viết', path: '/bai-viet' },
            { name: post.title, path: `/bai-viet/${post.slug}` },
          ]),
          articleJsonLd({
            type: 'BlogPosting',
            title: post.title,
            description: post.excerpt || toExcerpt(post.content),
            path: `/bai-viet/${post.slug}`,
            authorName: post.author.fullName,
            publishedAt: post.publishedAt,
            updatedAt: post.updatedAt,
            imageUrl: post.coverImageUrl,
          }),
        ]}
      />
      <Breadcrumbs
        items={[
          { label: 'Trang chủ', href: '/' },
          { label: 'Bài viết', href: '/bai-viet' },
          { label: post.title },
        ]}
      />

      <article className="mt-5">
        <header className="border-b pb-6">
          <div className="flex flex-wrap items-center gap-2">
            {post.category ? <Badge variant="secondary">{post.category}</Badge> : null}
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
              {formatDate(post.publishedAt)}
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <User className="h-3.5 w-3.5" aria-hidden="true" />
              {post.author.fullName}
            </span>
          </div>

          <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight md:text-4xl">
            {post.title}
          </h1>

          {post.excerpt ? (
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">
              {post.excerpt}
            </p>
          ) : null}
        </header>

        {post.coverImageUrl ? (
          <div className="mt-8 overflow-hidden rounded-xl border empty:hidden">
            <CoverImage
              src={post.coverImageUrl}
              loading="eager"
              className="h-auto w-full object-cover"
            />
          </div>
        ) : null}

        <div
          className="article-content mt-8"
          dangerouslySetInnerHTML={{ __html: post.contentHtml }}
        />
      </article>

      <div className="mt-8">
        <Button asChild variant="ghost" className="-ml-2">
          <Link href="/bai-viet">
            <ArrowLeft aria-hidden="true" />
            Tất cả bài viết
          </Link>
        </Button>
      </div>

      {otherPosts.length > 0 ? (
        <section className="mt-10 border-t pt-8">
          <h2 className="text-xl font-semibold">Bài viết khác</h2>
          <div className="mt-4 grid gap-5 md:grid-cols-3">
            {otherPosts.map((item) => (
              <PostCard key={item.id} post={item} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
