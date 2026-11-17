'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Markup } from '@/components/ui/markup';
import { ROADMAP_PATH } from '@/lib/roadmap-progress';
import type { RoadmapQuestion } from '@/lib/roadmap-types';

export function RoadmapQuiz({ questions, title, passMark, ready, onComplete }: {
  questions: RoadmapQuestion[];
  title: string;
  passMark?: number;
  ready: boolean;
  onComplete: (score: number, missed: string[]) => void;
}) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [score, setScore] = useState<number | null>(null);
  const answered = questions.filter((q) => answers[q.id] !== undefined).length;

  function submit() {
    if (score !== null || answered !== questions.length || !ready) return;
    const missed = questions.filter((q) => answers[q.id] !== q.answer);
    const result = questions.length - missed.length;
    setScore(result);
    onComplete(result, [...new Set(missed.map((q) => q.lessonId))]);
  }

  return (
    <section className="space-y-5" aria-label={title} data-roadmap-quiz>
      <div>
        <h2 className="text-xl font-bold">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Làm trên giấy trước khi chọn. Không biết thì chọn “Chưa biết” — đây là dấu mốc để ôn, không phải lời đánh giá bạn.
          {passMark !== undefined && ` Mốc tự kiểm: ${passMark}/${questions.length} câu.`} Câu đang làm chưa được lưu nếu tải lại trang.
        </p>
      </div>
      <form onSubmit={(event) => { event.preventDefault(); submit(); }} className="space-y-5">
        {questions.map((q, index) => (
          <fieldset key={q.id} disabled={score !== null || !ready} className="min-w-0 rounded-xl border bg-background p-4 sm:p-5" data-question-id={q.id}>
            <legend className="max-w-full px-1 text-sm font-semibold">
              <span className="mr-2 text-emerald-700">Câu {index + 1}.</span><Markup source={q.prompt} />
            </legend>
            <div className="mt-2 grid gap-2">
              {[...q.options, 'Chưa biết'].map((option, i) => {
                const value = i === 4 ? -1 : i;
                return (
                  <label key={i} className={`flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border px-3 py-3 text-sm ${answers[q.id] === value ? 'border-emerald-600 bg-emerald-50' : 'hover:bg-secondary/40'}`}>
                    <input className="mt-1 accent-emerald-700" type="radio" name={q.id} value={value} checked={answers[q.id] === value} onChange={() => setAnswers((previous) => ({ ...previous, [q.id]: value }))} />
                    <span className="min-w-0"><span className="mr-2 font-semibold">{i < 4 ? `${String.fromCharCode(65 + i)}.` : '—'}</span><Markup source={option} /></span>
                  </label>
                );
              })}
            </div>
            {score !== null && (
              <div className={`mt-4 rounded-lg p-3 text-sm leading-relaxed ${answers[q.id] === q.answer ? 'bg-emerald-50 text-emerald-950' : 'bg-amber-50 text-amber-950'}`} data-explanation>
                <p className="font-semibold">{answers[q.id] === q.answer ? 'Chính xác.' : 'Cần ôn lại.'} Đáp án: {String.fromCharCode(65 + q.answer)}.</p>
                <Markup source={q.explanation} block className="mt-1" />
                {answers[q.id] !== q.answer && <Link className="mt-2 inline-block font-medium underline underline-offset-4" href={`${ROADMAP_PATH}/${q.lessonId}`}>Mở bài để sửa lỗ hổng này</Link>}
              </div>
            )}
          </fieldset>
        ))}
        <p className="text-sm text-muted-foreground">Đã chọn {answered}/{questions.length} câu</p>
        {score === null ? (
          <Button type="submit" disabled={!ready || answered !== questions.length} className="bg-emerald-700 hover:bg-emerald-800">Chấm bài tự kiểm tra</Button>
        ) : (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
            <p role="status" data-quiz-result className="text-lg font-bold text-emerald-950">Kết quả: {score}/{questions.length}{passMark !== undefined ? score >= passMark ? ' — Đạt mốc tự kiểm' : ' — Cần củng cố thêm' : ' — Đã ghi nhận điểm xuất phát'}</p>
            <p className="mt-2 text-sm leading-relaxed text-emerald-950">Đọc lời giải ở từng câu, tự giải thích lại rồi hãy làm lại. Điểm này chỉ phản ánh bộ câu hỏi đang dùng, không bảo đảm điểm thi ở trường.</p>
            <Button type="button" variant="outline" className="mt-4" onClick={() => { setScore(null); setAnswers({}); }}>Làm lại bộ câu này</Button>
          </div>
        )}
      </form>
    </section>
  );
}
