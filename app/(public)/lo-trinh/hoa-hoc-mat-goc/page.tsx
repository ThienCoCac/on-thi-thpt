import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { RoadmapDashboard } from '@/components/roadmap/roadmap-dashboard';
import { getRoadmapCatalog } from '@/lib/chemistry-roadmap';
import { ROADMAP_PATH } from '@/lib/roadmap-progress';

export const metadata: Metadata = {
  title: 'Lộ trình lấy lại gốc Hóa học đến hết lớp 11',
  description: '40 bài học từ nền tảng THCS đến Hóa 11: lý thuyết dễ hiểu, ví dụ từng bước, 120 câu tự kiểm tra và tiến độ lưu trên thiết bị.',
  alternates: { canonical: ROADMAP_PATH },
};

export default function ChemistryRoadmapPage() {
  return <div className="container py-8 md:py-12">
    <Breadcrumbs items={[{ label: 'Trang chủ', href: '/' }, { label: 'Lộ trình Hóa học' }]} />
    <div className="mt-6"><RoadmapDashboard catalog={getRoadmapCatalog()} /></div>
  </div>;
}
