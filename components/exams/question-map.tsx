'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export type QuestionMapTone = 'idle' | 'answered' | 'flagged' | 'correct' | 'wrong';

export interface QuestionMapItem {
  index: number;
  tone: QuestionMapTone;
  current: boolean;
  label: string;
}

export interface QuestionMapGroup {
  name: string;
  items: QuestionMapItem[];
}

export interface QuestionMapLegendItem {
  label: string;
  swatch: string;
}

const TONE_CLASSES: Record<QuestionMapTone, string> = {
  idle: 'border-border bg-muted text-muted-foreground hover:bg-secondary',
  answered: 'border-primary bg-primary text-primary-foreground',
  flagged: 'border-amber-500 bg-amber-400 text-amber-950',
  correct: 'border-emerald-300 bg-emerald-50 text-emerald-700',
  wrong: 'border-destructive/40 bg-destructive/10 text-destructive',
};

interface QuestionMapProps {
  groups: QuestionMapGroup[];
  legend: QuestionMapLegendItem[];
  onSelect: (index: number) => void;
  /** Nhãn nhóm cho trình đọc màn hình, ví dụ "Chuyển đến một câu đã làm". */
  groupLabel?: string;
}

export function QuestionMap({ groups, legend, onSelect, groupLabel }: QuestionMapProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [cuonDuoc, setCuonDuoc] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) {
      return;
    }
    const capNhat = () =>
      setCuonDuoc(
        el.scrollHeight - el.clientHeight > 8 &&
          el.scrollTop + el.clientHeight < el.scrollHeight - 8,
      );
    capNhat();
    el.addEventListener('scroll', capNhat, { passive: true });
    window.addEventListener('resize', capNhat);
    return () => {
      el.removeEventListener('scroll', capNhat);
      window.removeEventListener('resize', capNhat);
    };

  }, [groups]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div
        ref={scrollRef}
        role="group"
        aria-label={groupLabel}
        data-scrollable={cuonDuoc ? 'true' : 'false'}
        className="map-scroll max-h-[70vh] min-h-0 flex-1 space-y-4 overflow-y-auto pr-1.5"
      >
        {groups.map((group) => (
          <div key={group.name}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {group.name}
            </p>
            <div className="grid grid-cols-5 gap-2">
              {group.items.map((item) => (
                <button
                  key={item.index}
                  type="button"
                  onClick={() => onSelect(item.index)}
                  aria-current={item.current ? 'step' : undefined}
                  aria-label={item.label}
                  className={cn(
                    'flex h-9 w-full items-center justify-center rounded-lg border text-sm font-semibold tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    TONE_CLASSES[item.tone],
                    item.current && 'ring-2 ring-purple-500 ring-offset-2',
                  )}
                >
                  {item.index + 1}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <ul className="flex flex-wrap gap-x-4 gap-y-1.5 border-t pt-3 text-xs text-muted-foreground">
        {legend.map((item) => (
          <li key={item.label} className="flex items-center gap-1.5">
            <span className={cn('h-3 w-3 rounded border', item.swatch)} aria-hidden="true" />
            {item.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

export const EXAM_LEGEND: QuestionMapLegendItem[] = [
  { label: 'Chưa trả lời', swatch: 'bg-muted' },
  { label: 'Đã trả lời', swatch: 'border-primary bg-primary' },
  { label: 'Đánh dấu', swatch: 'border-amber-500 bg-amber-400' },
  { label: 'Đang xem', swatch: 'ring-2 ring-purple-500 ring-offset-1' },
];

export const PRACTICE_LEGEND: QuestionMapLegendItem[] = [
  { label: 'Chưa làm', swatch: 'bg-muted' },
  { label: 'Làm đúng', swatch: 'border-emerald-300 bg-emerald-50' },
  { label: 'Làm sai', swatch: 'border-destructive/40 bg-destructive/10' },
  { label: 'Đang xem', swatch: 'ring-2 ring-purple-500 ring-offset-1' },
];
