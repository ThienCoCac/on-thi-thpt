import { cn } from '@/lib/utils';

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-lg bg-muted', className)} aria-hidden="true" />;
}

interface PageSkeletonProps {
  variant?: 'list' | 'detail';
  cards?: number;
}

export function PageSkeleton({ variant = 'list', cards = 6 }: PageSkeletonProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="container py-8 md:py-12"
    >
      <SkeletonBlock className="h-4 w-40" />
      <SkeletonBlock className="mt-4 h-9 w-full max-w-md" />
      <SkeletonBlock className="mt-3 h-4 w-full max-w-2xl" />

      {variant === 'list' ? (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: cards }).map((_, index) => (
            <div key={index} className="rounded-2xl border bg-card p-5">
              <SkeletonBlock className="h-5 w-20" />
              <SkeletonBlock className="mt-4 h-6 w-full" />
              <SkeletonBlock className="mt-2 h-6 w-2/3" />
              <SkeletonBlock className="mt-4 h-4 w-full" />
              <SkeletonBlock className="mt-2 h-4 w-5/6" />
              <SkeletonBlock className="mt-5 h-9 w-28" />
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-8 max-w-3xl space-y-4">
          <SkeletonBlock className="h-6 w-3/4" />
          <SkeletonBlock className="h-4 w-full" />
          <SkeletonBlock className="h-4 w-full" />
          <SkeletonBlock className="h-4 w-11/12" />
          <SkeletonBlock className="mt-6 h-6 w-2/3" />
          <SkeletonBlock className="h-4 w-full" />
          <SkeletonBlock className="h-4 w-10/12" />
        </div>
      )}

      <span className="sr-only">Đang tải nội dung…</span>
    </div>
  );
}
