'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Trang chủ' },
  { href: '/de-thi', label: 'Đề thi' },
  { href: '/luyen-tap', label: 'Luyện tập' },
  { href: '/tien-do', label: 'Tiến độ' },
  { href: '/phuong-phap', label: 'Phương pháp' },
  { href: '/bai-viet', label: 'Bài viết' },
];

function isActive(pathname: string, href: string): boolean {
  return href === '/' ? pathname === '/' : pathname.startsWith(href);
}

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="border-b">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-lg font-bold text-primary-foreground"
            aria-hidden="true"
          >
            Ô
          </span>
          <span className="text-base font-semibold tracking-tight">Ôn Thi THPT</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm md:flex">
          {navItems.map((item) => {
            const active = isActive(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'transition-colors hover:text-foreground',
                  active ? 'font-medium text-foreground' : 'text-muted-foreground',
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <Button asChild size="sm">
          <Link href="/de-thi">Luyện đề</Link>
        </Button>
      </div>

      <nav aria-label="Điều hướng di động" className="border-t md:hidden">
        <div className="container flex h-11 items-center gap-5 overflow-x-auto whitespace-nowrap text-sm">
          {navItems.map((item) => {
            const active = isActive(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'shrink-0 transition-colors hover:text-foreground',
                  active ? 'font-medium text-foreground' : 'text-muted-foreground',
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
