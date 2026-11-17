'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Markup } from '@/components/ui/markup';
import { RoadmapQuiz } from '@/components/roadmap/roadmap-quiz';
import { useRoadmapProgress } from '@/components/roadmap/use-roadmap-progress';
import { recordLesson, ROADMAP_PATH } from '@/lib/roadmap-progress';
import type { RoadmapLesson, RoadmapLessonSummary } from '@/lib/roadmap-types';

export function LessonPlayer({ lesson, index, total, stageTitle, previous, next, exams }: {
  lesson: RoadmapLesson;
  index: number;
  total: number;
  stageTitle: string;
  previous: RoadmapLessonSummary | null;
  next: RoadmapLessonSummary | null;
  exams: { slug: string; title: string }[];
}) {
  const { progress, ready, notice, update } = useRoadmapProgress();
  const saved = progress.lessons[lesson.id];
  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-8">
      <header className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-6 sm:p-8">
        <Link href={ROADMAP_PATH} className="inline-flex items-center gap-2 text-sm font-medium text-emerald-800 hover:underline"><ArrowLeft size={16} /> Bản đồ lộ trình</Link>
        <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-emerald-800">Bài {index + 1}/{total} · {stageTitle} · Khoảng {lesson.minutes} phút</p>
        <h1 className="mt-3 text-2xl font-bold leading-tight sm:text-3xl">{lesson.title}</h1>
        <p className="mt-4 leading-relaxed text-slate-700">Sau bài này: {lesson.goal}</p>
        <p className="mt-4 flex items-center gap-2 text-sm font-medium" data-lesson-status>
          {saved?.masteredAt != null && <CheckCircle2 size={18} className="text-emerald-700" />}
          {!ready ? 'Đang đọc tiến độ…' : !saved ? 'Chưa tự kiểm tra' : `Lần gần nhất ${saved.latest}/3 · Tốt nhất ${saved.best}/3 · ${saved.attempts} lượt`}
        </p>
        {previous && <p className="mt-3 text-sm text-slate-600">Nên biết trước: <Link href={`${ROADMAP_PATH}/${previous.id}`} className="underline underline-offset-4">{previous.title}</Link>. Bạn vẫn có thể xem mọi bài, không bị khóa.</p>}
      </header>
      {notice && <p role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm">{notice}</p>}
      <div className="grid gap-3 rounded-xl border p-4 text-sm sm:grid-cols-3">
        <p><strong>5 phút</strong><br />Nhớ lại bài trước, ghi điều chưa hiểu.</p>
        <p><strong>20 phút</strong><br />Đọc ý chính, tự giải ví dụ trước khi mở lời giải.</p>
        <p><strong>20 phút</strong><br />Tự kiểm tra, sửa lỗi và ghi lại cách hiểu.</p>
      </div>
      <section>
        <h2 className="flex items-center gap-2 text-xl font-bold"><BookOpen className="text-emerald-700" size={21} /> Hiểu từ gốc</h2>
        <Markup source={lesson.theory} block className="mt-4 space-y-4 text-base leading-8 [&_p]:mb-4" />
      </section>
      <section className="rounded-2xl border bg-secondary/30 p-5 sm:p-7">
        <h2 className="text-xl font-bold">Một ví dụ, từng bước nhỏ</h2>
        <Markup block source={lesson.example.question} className="mt-4 leading-7" />
        <details className="mt-5 rounded-xl border bg-background p-4">
          <summary className="cursor-pointer font-medium text-emerald-800">Mở lời giải từng bước</summary>
          <ol className="mt-4 space-y-4">
            {lesson.example.steps.map((step, i) => <li key={i} className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-900">{i + 1}</span><Markup block source={step} className="min-w-0 flex-1 leading-7" /></li>)}
          </ol>
        </details>
      </section>
      <section className="rounded-xl border border-amber-200 bg-amber-50 p-5">
        <h2 className="font-bold text-amber-950">Chỗ rất dễ nhầm</h2>
        <Markup source={lesson.pitfall} block className="mt-2 text-sm leading-7 text-amber-950" />
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-bold">Gấp bài lại, thử nói bằng lời của bạn</h2>
        <Markup source={lesson.recall} block className="leading-7" />
        <label htmlFor="roadmap-note" className="block text-sm font-medium">Ghi chú của mình: cách hiểu, lỗi và cách tránh</label>
        <textarea id="roadmap-note" disabled={!ready} rows={4} maxLength={3000} value={progress.notes[lesson.id] ?? ''} onChange={(event) => {
          const value = event.target.value;
          update((prior) => ({ ...prior, notes: { ...prior.notes, [lesson.id]: value } }));
        }} placeholder="Ví dụ: Mình từng quên đổi mL → L. Trước khi tính n = CV, mình sẽ khoanh đơn vị V." className="w-full rounded-xl border bg-background p-4 text-sm leading-7 focus-visible:outline-emerald-600" />
        <p className="text-xs text-muted-foreground">Tự lưu trên trình duyệt này, tối đa 3.000 kí tự. Không gửi lên máy chủ; xóa dữ liệu trình duyệt sẽ mất ghi chú và tiến độ.</p>
      </section>
      <RoadmapQuiz questions={lesson.questions} title="Tự kiểm tra cuối bài" passMark={3} ready={ready} onComplete={(score) => update((prior) => recordLesson(prior, lesson.id, score))} />
      <p className="text-sm leading-7 text-muted-foreground">Đạt 3/3 để ghi nhận bài đã đạt. Lần ôn chưa đạt vẫn hiện trong mục cần ôn. Lịch nhắc tại trang lộ trình gợi ý ôn sau 1, 3, 7 rồi 14 ngày; không có thông báo gửi ra ngoài.</p>
      {exams.length > 0 && <section className="rounded-xl border p-5">
        <h2 className="font-bold">Luyện sâu hơn khi nền đã vững</h2>
        <p className="mt-2 text-sm text-muted-foreground">Các đề đã có trong kho có phạm vi rộng hơn bài học này. Không cần làm hết ngay.</p>
        <ul className="mt-3 space-y-3">{exams.map((exam) => <li key={exam.slug}><Link href={`/de-thi/${exam.slug}/luyen-tap`} className="text-sm font-medium text-emerald-800 underline underline-offset-4">{exam.title}</Link></li>)}</ul>
      </section>}
      <nav aria-label="Chuyển bài học" className="flex flex-wrap items-center justify-between gap-3 border-t pt-6">
        <Button asChild variant="outline"><Link href={previous ? `${ROADMAP_PATH}/${previous.id}` : ROADMAP_PATH}><ArrowLeft /> {previous ? 'Bài trước' : 'Bản đồ'}</Link></Button>
        <Button asChild className="bg-emerald-700 hover:bg-emerald-800"><Link href={next ? `${ROADMAP_PATH}/${next.id}` : ROADMAP_PATH}>{next ? 'Bài tiếp theo' : 'Về kiểm tra tổng hợp'} <ArrowRight /></Link></Button>
      </nav>
    </div>
  );
}
