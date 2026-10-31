'use client';

import { useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Search,
} from 'lucide-react';
import { DogMascot } from '@/components/brand/dog-mascot';
import { ExamCard } from '@/components/exams/exam-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatNumber } from '@/lib/format';
import { EXAM_TYPE_LABELS, EXAM_TYPE_OPTIONS } from '@/lib/labels';
import type { ExamSummary, ExamType, SubjectSummary } from '@/lib/content-types';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 6;

const selectClassName =
  'h-9 rounded-lg border border-input bg-background px-2.5 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

const tabClassName =
  'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm transition-colors';

const pageItemClassName =
  'inline-flex h-9 min-w-9 items-center justify-center rounded-lg border px-3 text-sm transition-colors';

interface ExamBrowserProps {
  exams: ExamSummary[];
  subjects: SubjectSummary[];
  years: number[];
}

function buildPageItems(page: number, totalPages: number): (number | 'ellipsis')[] {
  if (totalPages <= 6) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const selected = new Set<number>([1, totalPages, page - 1, page, page + 1]);
  const pages = Array.from(selected)
    .filter((value) => value >= 1 && value <= totalPages)
    .sort((a, b) => a - b);

  const items: (number | 'ellipsis')[] = [];
  pages.forEach((value, index) => {
    if (index > 0 && value - pages[index - 1] > 1) {
      items.push('ellipsis');
    }
    items.push(value);
  });

  return items;
}

export function ExamBrowser({ exams, subjects, years }: ExamBrowserProps) {
  const [subject, setSubject] = useState('');
  const [type, setType] = useState<ExamType | ''>('');
  const [year, setYear] = useState('');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const query = keyword.trim().toLowerCase();

    return exams.filter((exam) => {
      if (subject && exam.subject.slug !== subject) {
        return false;
      }
      if (type && exam.type !== type) {
        return false;
      }
      if (year && exam.examYear !== Number(year)) {
        return false;
      }
      if (query) {
        const haystack = [
          exam.title,
          exam.description ?? '',
          exam.examCode ?? '',
          exam.subject.name,
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(query)) {
          return false;
        }
      }
      return true;
    });
  }, [exams, subject, type, year, keyword]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const items = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const activeSubject = subjects.find((item) => item.slug === subject);
  const hasFilters = Boolean(subject || type || year || keyword.trim());

  function resetFilters() {
    setSubject('');
    setType('');
    setYear('');
    setKeyword('');
    setPage(1);
  }

  function chooseSubject(slug: string) {
    setSubject(slug);
    setPage(1);
  }

  return (
    <div>
      <div className="mt-7 space-y-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => chooseSubject('')}
            aria-pressed={!subject}
            className={cn(
              tabClassName,
              subject ? 'hover:bg-secondary' : 'border-primary bg-primary text-primary-foreground',
            )}
          >
            Tất cả môn
          </button>
          {subjects.map((item) => {
            const active = subject === item.slug;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => chooseSubject(item.slug)}
                aria-pressed={active}
                className={cn(
                  tabClassName,
                  active
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'hover:bg-secondary',
                )}
              >
                {item.name}
                <span
                  className={cn(
                    'text-xs',
                    active ? 'text-primary-foreground/80' : 'text-muted-foreground',
                  )}
                >
                  {item.examCount}
                </span>
              </button>
            );
          })}
        </div>

        <div className="rounded-2xl border bg-card p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1" role="search">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                type="search"
                value={keyword}
                onChange={(event) => {
                  setKeyword(event.target.value);
                  setPage(1);
                }}
                placeholder="Tìm theo tên đề, mã đề hoặc môn học"
                aria-label="Tìm kiếm đề thi"
                maxLength={100}
                className="h-9 pl-9"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={type}
                onChange={(event) => {
                  setType(event.target.value as ExamType | '');
                  setPage(1);
                }}
                aria-label="Lọc theo loại đề"
                className={selectClassName}
              >
                <option value="">Mọi loại đề</option>
                {EXAM_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <select
                value={year}
                onChange={(event) => {
                  setYear(event.target.value);
                  setPage(1);
                }}
                aria-label="Lọc theo năm"
                className={selectClassName}
                disabled={years.length === 0}
              >
                <option value="">Mọi năm</option>
                {years.map((item) => (
                  <option key={item} value={item}>
                    Năm {item}
                  </option>
                ))}
              </select>

              {hasFilters ? (
                <Button type="button" variant="ghost" size="sm" onClick={resetFilters}>
                  <RotateCcw aria-hidden="true" />
                  Xóa lọc
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-7 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground" role="status">
          {hasFilters ? 'Tìm thấy ' : 'Tổng cộng '}
          <span className="font-semibold text-foreground">{formatNumber(filtered.length)}</span>{' '}
          đề
          {activeSubject ? ` môn ${activeSubject.name}` : ''}
          {type ? ` · ${EXAM_TYPE_LABELS[type]}` : ''}
          {year ? ` · năm ${year}` : ''}
          {keyword.trim() ? ` · từ khóa “${keyword.trim()}”` : ''}.
        </p>
        {totalPages > 1 ? (
          <p className="text-xs text-muted-foreground">
            Trang {currentPage} / {totalPages}
          </p>
        ) : null}
      </div>

      {items.length > 0 ? (
        <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {items.map((exam) => (
            <ExamCard key={exam.id} exam={exam} />
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-dashed px-6 py-14 text-center">
          <DogMascot
            className="mx-auto h-20 w-20"
            title={hasFilters ? 'Không tìm thấy đề phù hợp' : 'Đề thi đang được cập nhật'}
          />
          <h2 className="mt-4 text-lg font-semibold">
            {hasFilters ? 'Không tìm thấy đề phù hợp' : 'Đề thi đang được cập nhật'}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            {hasFilters
              ? 'Thử bỏ bớt bộ lọc hoặc dùng từ khóa ngắn hơn để xem các đề khác.'
              : 'Nội dung đề đang được bổ sung. Vui lòng quay lại sau.'}
          </p>
          {hasFilters ? (
            <Button type="button" variant="outline" className="mt-5" onClick={resetFilters}>
              Xóa toàn bộ bộ lọc
            </Button>
          ) : null}
        </div>
      )}

      {totalPages > 1 ? (
        <nav
          aria-label="Phân trang danh sách đề thi"
          className="mt-9 flex flex-wrap items-center justify-center gap-1.5"
        >
          <button
            type="button"
            onClick={() => setPage(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label="Trang trước"
            className={cn(
              pageItemClassName,
              'hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50',
            )}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>

          {buildPageItems(currentPage, totalPages).map((item, index) =>
            item === 'ellipsis' ? (
              <span key={`ellipsis-${index}`} className="px-1 text-sm text-muted-foreground">
                …
              </span>
            ) : (
              <button
                key={item}
                type="button"
                onClick={() => setPage(item)}
                aria-current={item === currentPage ? 'page' : undefined}
                className={cn(
                  pageItemClassName,
                  item === currentPage
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'hover:bg-secondary',
                )}
              >
                {item}
              </button>
            ),
          )}

          <button
            type="button"
            onClick={() => setPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            aria-label="Trang sau"
            className={cn(
              pageItemClassName,
              'hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50',
            )}
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </nav>
      ) : null}
    </div>
  );
}
