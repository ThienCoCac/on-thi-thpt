import Link from 'next/link';
import { ArrowRight, CalendarDays } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { formatDate } from '@/lib/format';
import type { ArticleSummary } from '@/lib/content-types';

export function ArticleCard({ article }: { article: ArticleSummary }) {
  return (
    <Card className="flex h-full flex-col transition-shadow hover:shadow-md">
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {article.subject ? (
            <Badge variant="secondary">{article.subject.name}</Badge>
          ) : (
            <Badge variant="secondary">Phương pháp chung</Badge>
          )}
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
            {formatDate(article.publishedAt)}
          </span>
        </div>
        <CardTitle className="text-lg leading-snug">
          <Link
            href={`/phuong-phap/${article.slug}`}
            className="transition-colors hover:text-primary"
          >
            {article.title}
          </Link>
        </CardTitle>
        <CardDescription className="line-clamp-3">{article.excerpt}</CardDescription>
      </CardHeader>

      <CardFooter className="mt-auto justify-between gap-3 text-xs text-muted-foreground">
        <span className="truncate">{article.author.fullName}</span>
        <Link
          href={`/phuong-phap/${article.slug}`}
          className="inline-flex shrink-0 items-center gap-1 font-medium text-primary hover:underline"
        >
          Đọc tiếp
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </CardFooter>
    </Card>
  );
}
