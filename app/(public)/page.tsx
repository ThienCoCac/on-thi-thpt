import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BookOpenCheck, CheckCircle2, Brain } from 'lucide-react';
import { ArticleCard } from '@/components/articles/article-card';
import { ExamCard } from '@/components/exams/exam-card';
import { JsonLd } from '@/components/seo/json-ld';
import { Button } from '@/components/ui/button';
import { formatNumber } from '@/lib/format';
import {
  getContentStats,
  listFeaturedExams,
  listLatestArticles,
  listLatestExams,
} from '@/lib/content';
import {
  buildOpenGraph,
  buildTwitter,
  organizationJsonLd,
  SITE_DESCRIPTION,
  websiteJsonLd,
} from '@/lib/seo';

export const metadata: Metadata = {
  alternates: { canonical: '/' },
  openGraph: buildOpenGraph({
    title: 'Ôn Thi THPT - Luyện đề theo tư duy',
    description: SITE_DESCRIPTION,
    path: '/',
  }),
  twitter: buildTwitter('Ôn Thi THPT - Luyện đề theo tư duy', SITE_DESCRIPTION),
};

const features = [
  {
    icon: BookOpenCheck,
    title: 'Đề thi sát cấu trúc',
    description:
      'Thời gian làm bài và cấu trúc đề được xây theo kỳ thi tốt nghiệp THPT, ví dụ đề Toán 90 phút cho 10 câu hỏi trắc nghiệm.',
  },
  {
    icon: Brain,
    title: 'Lời giải theo tư duy',
    description:
      'Mỗi câu hỏi đều có phân tích tại sao chọn đáp án, kỹ thuật loại trừ và phương pháp giải nhanh thay vì chỉ đưa ra kết quả.',
  },
  {
    icon: CheckCircle2,
    title: 'Chấm điểm tức thì',
    description:
      'Làm bài và chấm ngay trên trình duyệt: điểm số, đáp án đúng và lời giải hiện ra ngay sau khi nộp, không cần tài khoản.',
  },
];

function SectionHeading({
  title,
  description,
  href,
  linkLabel,
}: {
  title: string;
  description: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
      {href && linkLabel ? (
        <Link
          href={href}
          className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          {linkLabel}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      ) : null}
    </div>
  );
}

export default function HomePage() {
  const featuredExams = listFeaturedExams(3);
  const latestExams = listLatestExams(4);
  const articles = listLatestArticles(3);
  const stats = getContentStats();

  const featuredSlugs = new Set(featuredExams.map((exam) => exam.slug));
  const freshExams = latestExams
    .filter((exam) => !featuredSlugs.has(exam.slug))
    .slice(0, 3);

  const statItems = [
    { label: 'Đề thi sẵn sàng', value: stats.exams },
    { label: 'Câu hỏi có lời giải', value: stats.questions },
    { label: 'Bài phương pháp', value: stats.articles },
    { label: 'Bài viết kinh nghiệm', value: stats.posts },
  ];

  return (
    <>
      <JsonLd data={[websiteJsonLd, organizationJsonLd]} />
      <section className="border-b bg-secondary/40">
        <div className="container py-16 md:py-24">
          <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div>
              <span className="inline-flex items-center rounded-full border border-primary/20 bg-background px-3 py-1 text-xs font-medium text-primary">
                Luyện đề theo tư duy
              </span>
              <h1 className="mt-6 max-w-3xl text-4xl font-bold leading-tight tracking-tight md:text-5xl">
                Thi thử sát đề thật.{' '}
                <span className="text-primary">Hiểu bản chất</span>, không học vẹt.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
                Đề thi chuẩn cấu trúc, đồng hồ đếm ngược và lời giải chi tiết theo từng bước
                tư duy — giúp học sinh lớp 12 biết mình sai ở đâu và sửa đúng cách. Không cần
                đăng nhập, làm bài ngay trên trình duyệt.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link href="/de-thi">Xem danh sách đề</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/phuong-phap">Học theo phương pháp</Link>
                </Button>
              </div>
            </div>

            <div className="rounded-2xl border bg-background p-6 shadow-sm">
              <p className="text-sm font-semibold text-foreground">Nội dung đang có</p>
              <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-6">
                {statItems.map((item) => (
                  <div key={item.label}>
                    <dd className="text-2xl font-bold tracking-tight text-primary">
                      {formatNumber(item.value)}
                    </dd>
                    <dt className="mt-1 text-xs leading-snug text-muted-foreground">
                      {item.label}
                    </dt>
                  </div>
                ))}
              </dl>
              <p className="mt-6 border-t pt-4 text-xs leading-relaxed text-muted-foreground">
                Toàn bộ đề thi và bài viết được đóng gói sẵn trong website, tải nhanh và dùng
                được ngay cả khi mạng chập chờn.
              </p>
            </div>
          </div>
        </div>
      </section>

      {featuredExams.length > 0 ? (
        <section className="container py-14 md:py-16">
          <SectionHeading
            title="Đề nổi bật"
            description="Đề được chọn lọc theo cấu trúc sát kỳ thi, phù hợp để làm quen áp lực thời gian trước khi bước vào luyện chuyên đề."
            href="/de-thi"
            linkLabel="Xem tất cả đề"
          />
          <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {featuredExams.map((exam) => (
              <ExamCard key={exam.id} exam={exam} />
            ))}
          </div>
        </section>
      ) : null}

      {freshExams.length > 0 ? (
        <section className="border-y bg-secondary/20">
          <div className="container py-14 md:py-16">
            <SectionHeading
              title="Đề mới cập nhật"
              description="Những đề vừa được bổ sung, sẵn sàng để bạn bắt đầu luyện tập."
              href="/de-thi"
              linkLabel="Toàn bộ đề thi"
            />
            <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {freshExams.map((exam) => (
                <ExamCard key={exam.id} exam={exam} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {featuredExams.length === 0 && freshExams.length === 0 ? (
        <section className="container py-14 md:py-16">
          <div className="rounded-xl border border-dashed p-10 text-center">
            <h2 className="text-lg font-semibold">Đề thi đang được cập nhật</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Nội dung đề sẽ sớm được bổ sung. Trong lúc chờ, bạn có thể đọc các bài phương
              pháp để chuẩn bị nền tảng tư duy.
            </p>
            <Button asChild variant="outline" className="mt-5">
              <Link href="/phuong-phap">Xem bài phương pháp</Link>
            </Button>
          </div>
        </section>
      ) : null}

      <section className="container py-14 md:py-16">
        <SectionHeading
          title="Phương pháp & tư duy"
          description="Học cách loại trừ đáp án, đọc dấu hiệu đề bài và phân bổ thời gian — những kỹ năng quyết định điểm số trong phòng thi."
          href="/phuong-phap"
          linkLabel="Tất cả bài viết"
        />
        {articles.length > 0 ? (
          <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        ) : (
          <p className="mt-6 rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            Bài viết phương pháp đang được cập nhật.
          </p>
        )}
      </section>

      <section className="border-y bg-secondary/30">
        <div className="container py-14 md:py-16">
          <h2 className="text-2xl font-bold tracking-tight">Vì sao học sinh chọn Ôn Thi THPT?</h2>
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.title} className="rounded-xl border bg-background p-6">
                <feature.icon className="h-6 w-6 text-accent" aria-hidden="true" />
                <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container py-12 md:py-14">
        <div className="flex flex-col items-start gap-4 rounded-2xl border bg-primary px-6 py-8 text-primary-foreground md:flex-row md:items-center md:justify-between md:px-10">
          <div>
            <h2 className="text-xl font-semibold">Sẵn sàng luyện tập theo lộ trình?</h2>
            <p className="mt-1 text-sm text-primary-foreground/80">
              Chọn một đề, bấm bắt đầu và nhận kết quả cùng lời giải ngay khi nộp bài.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" variant="secondary">
              <Link href="/de-thi">Chọn đề luyện tập</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            >
              <Link href="/phuong-phap">Đọc phương pháp</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
