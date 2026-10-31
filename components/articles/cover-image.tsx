'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

interface CoverImageProps {
  src: string;
  alt?: string;
  className?: string;
  loading?: 'lazy' | 'eager';
  fallback?: ReactNode;
}

// Ảnh bìa có thể trỏ tới Blob đã bị xoá hoặc URL hỏng, khi đó ẩn ảnh (hoặc hiện fallback)
// để trang không lộ icon ảnh lỗi.
export function CoverImage({
  src,
  alt = '',
  className,
  loading = 'lazy',
  fallback = null,
}: CoverImageProps) {
  const [failed, setFailed] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  // Ảnh có thể lỗi trước khi React hydrate (onError không chạy lại), nên kiểm tra thêm
  // trạng thái đã tải của <img> ngay sau khi mount.
  useEffect(() => {
    setFailed(false);
    const image = imageRef.current;

    if (image && image.complete && image.naturalWidth === 0) {
      setFailed(true);
    }
  }, [src]);

  if (failed) {
    return <>{fallback}</>;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={imageRef}
      src={src}
      alt={alt}
      loading={loading}
      decoding="async"
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
