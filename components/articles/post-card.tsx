import Link from 'next/link';
import { ArrowRight, CalendarDays } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { CoverImage } from '@/components/articles/cover-image';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { formatDate } from '@/lib/format';
import type { PostSummary } from '@/lib/content-types';

export function PostCard({ post }: { post: PostSummary }) {
  return (
    <Card className="flex h-full flex-col overflow-hidden transition-shadow hover:shadow-md">
      {post.coverImageUrl ? (
        <Link href={`/bai-viet/${post.slug}`} className="block border-b empty:hidden">
          <CoverImage
            src={post.coverImageUrl}
            loading="lazy"
            className="aspect-[16/9] w-full object-cover"
          />
        </Link>
      ) : null}

      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {post.category ? (
            <Badge variant="secondary">{post.category}</Badge>
          ) : null}
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
            {formatDate(post.publishedAt)}
          </span>
        </div>
        <CardTitle className="text-lg leading-snug">
          <Link
            href={`/bai-viet/${post.slug}`}
            className="transition-colors hover:text-primary"
          >
            {post.title}
          </Link>
        </CardTitle>
        <CardDescription className="line-clamp-3">{post.excerpt}</CardDescription>
      </CardHeader>

      <CardContent className="mt-auto pb-0">
        <p className="truncate text-xs text-muted-foreground">{post.author.fullName}</p>
      </CardContent>

      <CardFooter className="justify-end pt-3 text-xs">
        <Link
          href={`/bai-viet/${post.slug}`}
          className="inline-flex shrink-0 items-center gap-1 font-medium text-primary hover:underline"
        >
          Đọc tiếp
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </CardFooter>
    </Card>
  );
}
