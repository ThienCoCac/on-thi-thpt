import type { Metadata } from 'next';
import { NotFoundView } from '@/components/layout/not-found-view';
import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';
import { SkipLink } from '@/components/layout/skip-link';

export const metadata: Metadata = {
  title: 'Không tìm thấy trang',
  robots: { index: false, follow: false },
};

// Trang 404 toàn cục nằm ngoài mọi layout nhóm route, nên phải tự dựng khung
// header/footer để người dùng vẫn điều hướng được.
export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SkipLink />
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className="flex-1">
        <NotFoundView />
      </main>
      <SiteFooter />
    </div>
  );
}
