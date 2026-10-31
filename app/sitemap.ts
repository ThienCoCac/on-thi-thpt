import type { MetadataRoute } from 'next';
import { listExams } from '@/lib/content';
import { absoluteUrl } from '@/lib/seo';

export default function sitemap(): MetadataRoute.Sitemap {
  const exams = listExams();

  return [
    {
      url: absoluteUrl('/'),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: absoluteUrl('/de-thi'),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: absoluteUrl('/luyen-tap'),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    ...exams.map((exam) => ({
      url: absoluteUrl(`/de-thi/${exam.slug}`),
      lastModified: exam.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
  ];
}
