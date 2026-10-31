import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { ProgressDashboard } from '@/components/progress/progress-dashboard';

export const metadata: Metadata = {
  title: 'Tiến độ học tập',
  description:
    'Theo dõi số lượt làm bài, độ chính xác, chuỗi ngày học và các câu cần ôn — lưu ngay trên thiết bị của bạn.',
  robots: { index: false, follow: false },
};

export default function ProgressPage() {
  return (
    <div className="container max-w-5xl py-8 md:py-12">
      <Breadcrumbs
        items={[{ label: 'Trang chủ', href: '/' }, { label: 'Tiến độ' }]}
      />

      <header className="mt-5">
        <h1 className="text-3xl font-bold leading-tight tracking-tight md:text-4xl">
          Tiến độ học tập
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
          Dữ liệu được lưu trong trình duyệt của bạn. Đổi thiết bị hoặc xoá dữ liệu trình
          duyệt thì tiến độ sẽ bắt đầu lại từ đầu.
        </p>
      </header>

      <div className="mt-8">
        <ProgressDashboard />
      </div>
    </div>
  );
}
