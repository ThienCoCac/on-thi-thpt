'use client';

import { useEffect, useState } from 'react';
import type { BankQuestion, RunnerExam } from '@/lib/content-types';

// Nội dung câu hỏi nằm ở file JSON tải khi cần, không nhúng vào HTML của trang.
// Cache theo URL nên một đề chỉ tải một lần dù chuyển qua lại giữa các màn.
const pending = new Map<string, Promise<unknown>>();

function loadJson<T>(url: string): Promise<T> {
  const cached = pending.get(url);

  if (cached) {
    return cached as Promise<T>;
  }

  const request = fetch(url).then(async (response) => {
    if (!response.ok) {
      throw new Error(`Không tải được nội dung (${response.status})`);
    }
    return (await response.json()) as T;
  });

  pending.set(url, request);

  return request;
}

export function examDataUrl(slug: string): string {
  return `/data/exams/${encodeURIComponent(slug)}.json`;
}

export function bankDataUrl(subjectSlug: string): string {
  return `/data/bank/${encodeURIComponent(subjectSlug)}.json`;
}

// Bản tải thẳng cho nơi cần nạp theo nhịp người dùng bấm (nút bắt đầu phiên),
// vẫn dùng chung cache với các hook bên dưới.
export function fetchExam(slug: string): Promise<RunnerExam> {
  return loadJson<RunnerExam>(examDataUrl(slug));
}

export function fetchBank(subjectSlug: string): Promise<BankQuestion[]> {
  return loadJson<BankQuestion[]>(bankDataUrl(subjectSlug));
}

export function useExamData(slug: string): {
  exam: RunnerExam | null;
  error: string | null;
} {
  const [exam, setExam] = useState<RunnerExam | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    loadJson<RunnerExam>(examDataUrl(slug))
      .then((data) => {
        if (alive) {
          setExam(data);
        }
      })
      .catch((cause: Error) => {
        if (alive) {
          setError(cause.message);
        }
      });

    return () => {
      alive = false;
    };
  }, [slug]);

  return { exam, error };
}

export function useBankData(subjectSlugs: string[]): {
  questions: BankQuestion[];
  error: string | null;
} {
  const key = subjectSlugs.join(',');
  const [questions, setQuestions] = useState<BankQuestion[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!key) {
      setQuestions([]);
      return;
    }

    let alive = true;

    Promise.all(key.split(',').map((slug) => loadJson<BankQuestion[]>(bankDataUrl(slug))))
      .then((parts) => {
        if (alive) {
          setQuestions(parts.flat());
        }
      })
      .catch((cause: Error) => {
        if (alive) {
          setError(cause.message);
        }
      });

    return () => {
      alive = false;
    };
  }, [key]);

  return { questions, error };
}
