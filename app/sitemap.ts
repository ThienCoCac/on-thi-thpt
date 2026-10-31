import type { MetadataRoute } from 'next';
import { listArticles, listExams, listPosts } from '@/lib/content';
import { absoluteUrl } from '@/lib/seo';

export default function sitemap(): MetadataRoute.Sitemap {
  const exams = listExams();
  const articles = listArticles({ limit: 100 });
  const posts = listPosts({ limit: 100 });

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
      url: absoluteUrl('/phuong-phap'),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: absoluteUrl('/bai-viet'),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    ...exams.map((exam) => ({
      url: absoluteUrl(`/de-thi/${exam.slug}`),
      lastModified: exam.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    ...articles.map((article) => ({
      url: absoluteUrl(`/phuong-phap/${article.slug}`),
      lastModified: article.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
    ...posts.map((post) => ({
      url: absoluteUrl(`/bai-viet/${post.slug}`),
      lastModified: post.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
  ];
}
