import type { Metadata } from 'next';

export const SITE_NAME = 'Ôn Thi THPT';
export const SITE_DESCRIPTION =
  'Nền tảng luyện thi THPT Quốc gia: đề thi thử sát cấu trúc thật, lời giải chi tiết theo hướng tư duy và lộ trình luyện tập cá nhân hóa cho học sinh lớp 12.';
export const SITE_LOCALE = 'vi_VN';

function resolveSiteUrl(value: string | undefined): string {
  if (!value) {
    return 'https://onthithpt.vn';
  }

  try {
    return new URL(value).origin;
  } catch {
    return 'https://onthithpt.vn';
  }
}

export const SITE_URL = resolveSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);

export function absoluteUrl(path = '/'): string {
  return new URL(path, `${SITE_URL}/`).toString();
}

export const DEFAULT_OG_IMAGE = {
  url: absoluteUrl('/og-default.png'),
  width: 1200,
  height: 630,
  alt: `${SITE_NAME} - Luyện đề theo tư duy`,
};

interface OpenGraphInput {
  title: string;
  description: string;
  path: string;
  imageUrl?: string | null;
  publishedTime?: string;
  modifiedTime?: string;
}

export function buildOpenGraph({
  title,
  description,
  path,
  imageUrl,
  publishedTime,
  modifiedTime,
}: OpenGraphInput): NonNullable<Metadata['openGraph']> {
  const images = imageUrl
    ? [{ url: imageUrl, alt: title }]
    : [DEFAULT_OG_IMAGE];

  if (publishedTime || modifiedTime) {
    return {
      type: 'article',
      locale: SITE_LOCALE,
      siteName: SITE_NAME,
      title,
      description,
      url: absoluteUrl(path),
      images,
      publishedTime,
      modifiedTime,
    };
  }

  return {
    type: 'website',
    locale: SITE_LOCALE,
    siteName: SITE_NAME,
    title,
    description,
    url: absoluteUrl(path),
    images,
  };
}

export function buildTwitter(
  title: string,
  description: string,
  imageUrl?: string | null,
): Metadata['twitter'] {
  return {
    card: 'summary_large_image',
    title,
    description,
    images: imageUrl ? [imageUrl] : [DEFAULT_OG_IMAGE.url],
  };
}

function toIsoDate(value: Date | null | undefined): string | undefined {
  return value ? value.toISOString() : undefined;
}

export function articleJsonLd(input: {
  type: 'Article' | 'BlogPosting';
  title: string;
  description: string;
  path: string;
  authorName: string;
  publishedAt: Date | null;
  updatedAt: Date | null;
  imageUrl?: string | null;
}): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': input.type,
    headline: input.title,
    description: input.description,
    inLanguage: 'vi-VN',
    mainEntityOfPage: absoluteUrl(input.path),
    url: absoluteUrl(input.path),
    datePublished: toIsoDate(input.publishedAt),
    dateModified: toIsoDate(input.updatedAt ?? input.publishedAt),
    author: { '@type': 'Person', name: input.authorName },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
      logo: { '@type': 'ImageObject', url: absoluteUrl('/icon.svg') },
    },
    ...(input.imageUrl ? { image: [input.imageUrl] } : {}),
  };
}

export function breadcrumbJsonLd(
  items: { name: string; path: string }[],
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export const websiteJsonLd: Record<string, unknown> = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME,
  url: SITE_URL,
  inLanguage: 'vi-VN',
  description: SITE_DESCRIPTION,
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${absoluteUrl('/de-thi')}?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
};

export const organizationJsonLd: Record<string, unknown> = {
  '@context': 'https://schema.org',
  '@type': 'EducationalOrganization',
  name: SITE_NAME,
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  logo: absoluteUrl('/icon.svg'),
};

export function examJsonLd(input: {
  title: string;
  description: string;
  path: string;
  durationMinutes: number;
  updatedAt: Date;
}): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    name: input.title,
    description: input.description,
    url: absoluteUrl(input.path),
    inLanguage: 'vi-VN',
    educationalLevel: 'Lớp 12',
    learningResourceType: 'Đề thi thử tốt nghiệp THPT',
    timeRequired: `PT${input.durationMinutes}M`,
    dateModified: input.updatedAt.toISOString(),
    isAccessibleForFree: true,
    provider: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
    },
  };
}
