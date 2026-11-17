'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, BookOpen, Check, FlaskConical, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RoadmapQuiz } from '@/components/roadmap/roadmap-quiz';
import { useRoadmapProgress } from '@/components/roadmap/use-roadmap-progress';
import { ROADMAP_PATH } from '@/lib/roadmap-progress';
import type { RoadmapCatalog } from '@/lib/roadmap-types';

type Assessment = { id: string; title: string; ids: string[]; passMark?: number };

export function RoadmapDashboard({ catalog }: { catalog: RoadmapCatalog }) {
  const { progress, ready, notice, update } = useRoadmapProgress();
  const [now, setNow] = useState(0);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [missed, setMissed] = useState<string[] | null>(null);
  const assessmentPanel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const refresh = () => setNow(Date.now());
    refresh();
    const timer = window.setInterval(refresh, 60_000);
    window.addEventListener('focus', refresh);
    return () => { window.clearInterval(timer); window.removeEventListener('focus', refresh); };
  }, []);
  useEffect(() => {
    if (assessment) assessmentPanel.current?.focus({ preventScroll: true });
  }, [assessment]);
  const mastered = catalog.lessons.filter((lesson) => progress.lessons[lesson.id]?.masteredAt != null);
  const due = catalog.lessons.filter((lesson) => {
    const record = progress.lessons[lesson.id];
    return record && (record.latest < 3 || (record.dueAt != null && record.dueAt <= now));
  });
  const next = due[0] ?? catalog.lessons.find((lesson) => progress.lessons[lesson.id]?.masteredAt == null);
  const activeStage = catalog.stages.find((stage) => stage.id === next?.stageId);
  const weeks = Math.ceil(catalog.lessons.length / progress.pace);
  const lessonMap = new Map(catalog.lessons.map((lesson) => [lesson.id, lesson]));

  function openAssessment(value: Assessment) {
    setMissed(null);
    setAssessment(value);
  }

  return <div className="space-y-10 pb-8">
    <header className="relative overflow-hidden rounded-3xl bg-emerald-950 p-6 text-white sm:p-10 lg:p-12">
      <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full border-[40px] border-emerald-800/40" />
      <div className="relative grid gap-8 lg:grid-cols-[1fr_260px] lg:items-center">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-emerald-200"><FlaskConical size={18} /> Lộ trình từ nền tảng đến hết lớp 11</p>
          <h1 className="mt-5 max-w-2xl text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">Học lại Hóa,<br /><span className="text-emerald-300">từng bước một.</span></h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-emerald-50">Quên công thức, sợ tính mol hay chưa biết bắt đầu ở đâu? Mình đi từ đổi đơn vị, đọc kí hiệu, rồi nối từng mắt xích đến Hóa 11. Không cần biết sẵn, không cần chạy đua.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild className="h-auto min-h-11 whitespace-normal bg-emerald-200 py-3 text-emerald-950 hover:bg-emerald-100"><Link href={`${ROADMAP_PATH}/${next?.id ?? catalog.lessons[0].id}`}>{!ready || mastered.length === 0 && due.length === 0 ? 'Bắt đầu từ bài đầu tiên' : due.length ? 'Ôn bài đang cần củng cố' : next ? 'Tiếp tục bài kế tiếp' : 'Xem lại từ đầu'} <ArrowRight size={17} /></Link></Button>
            <a href="#ban-do" className="inline-flex min-h-11 items-center px-3 text-sm font-medium text-white underline underline-offset-4">Xem bản đồ 10 chặng</a>
          </div>
        </div>
        <div className="rounded-2xl border border-emerald-700 bg-emerald-900/70 p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-200">Một nền tảng, ba bước</p>
          <ol className="mt-5 space-y-5 text-sm">
            <li><strong className="block text-lg">01 · Hiểu</strong><span className="text-emerald-100">40 bài ngắn, giải thích từ đầu.</span></li>
            <li><strong className="block text-lg">02 · Tự làm</strong><span className="text-emerald-100">40 ví dụ từng bước, 120 câu hỏi.</span></li>
            <li><strong className="block text-lg">03 · Nhớ lâu</strong><span className="text-emerald-100">Ghi lỗi, ôn cách quãng, kiểm tra lại.</span></li>
          </ol>
        </div>
      </div>
    </header>

    {notice && <p role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm">{notice}</p>}
    <section aria-label="Tiến độ của bạn" className="grid gap-4 md:grid-cols-3">
      <div className="rounded-2xl border p-5"><p className="text-sm text-muted-foreground">Bài đã từng đạt 3/3</p><p className="mt-2 text-3xl font-bold" data-mastery>{ready ? mastered.length : '—'}<span className="text-base font-normal text-muted-foreground"> / {catalog.lessons.length}</span></p><progress className="mt-3 h-2 w-full accent-emerald-700" max={catalog.lessons.length} value={mastered.length} aria-label="Số bài đã đạt" /><p className="mt-2 text-xs text-muted-foreground">Chưa có điểm chỉ vì mở bài. Lần ôn sai vẫn được nhắc lại.</p></div>
      <div className="rounded-2xl border p-5"><p className="flex items-center gap-2 text-sm text-muted-foreground"><RotateCcw size={16} /> Cần ôn hôm nay</p><p className="mt-2 text-3xl font-bold" data-due-count>{ready ? due.length : '—'} <span className="text-base font-normal text-muted-foreground">bài</span></p><p className="mt-3 text-sm leading-6">{due.length ? 'Ưu tiên sửa lỗi cũ trước khi thêm kiến thức mới.' : 'Làm tự kiểm cuối bài để có lịch ôn cá nhân.'}</p></div>
      <div className="rounded-2xl border p-5"><p className="text-sm text-muted-foreground">Điểm tiếp theo được gợi ý</p><p className="mt-2 font-bold leading-6">{activeStage?.title ?? 'Ôn tổng hợp và giữ nhịp'}</p><p className="mt-3 text-sm text-muted-foreground">Dựa trên bài đã làm và lịch ôn, không khóa chặng nào.</p></div>
    </section>

    {due.length > 0 && <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5" aria-label="Danh sách bài cần ôn">
      <h2 className="font-bold">Ôn một ít trước khi học mới</h2>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2">{due.map((lesson) => <li key={lesson.id}><Link href={`${ROADMAP_PATH}/${lesson.id}`} className="text-sm underline underline-offset-4">{lesson.title} · Lần gần nhất {progress.lessons[lesson.id].latest}/3</Link></li>)}</ul>
    </section>}

    <section className="grid gap-6 lg:grid-cols-2" aria-label="Chuẩn bị học">
      <div className="rounded-2xl border bg-secondary/20 p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800">Trước khi bắt đầu</p>
        <h2 className="mt-2 text-xl font-bold">Không chắc mình đang hổng ở đâu?</h2>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">12 câu, không bấm giờ. Khảo sát nền tảng đến cân bằng và pH, không đo toàn bộ Hóa 11. Có thể bỏ qua và học từ bài 1. Kết quả không tự đánh dấu bài đã đạt.</p>
        <Button variant="outline" className="mt-4" disabled={!ready} onClick={() => openAssessment({ id: 'dau-vao', title: 'Tìm điểm xuất phát', ids: catalog.diagnosticIds })}>Làm khảo sát đầu vào</Button>
        {progress.assessments['dau-vao'] && <p className="mt-3 text-sm">Lần gần nhất: {progress.assessments['dau-vao'].score}/12 — chỉ là gợi ý học.</p>}
      </div>
      <div className="rounded-2xl border p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800">Nhịp học của riêng bạn</p>
        <h2 className="mt-2 text-xl font-bold">Đều đặn hơn là học dồn</h2>
        <label htmlFor="roadmap-pace" className="mt-3 block text-sm">Số bài mới mỗi tuần</label>
        <select id="roadmap-pace" disabled={!ready} value={progress.pace} onChange={(event) => {
          const pace = Number(event.target.value) as 1 | 2 | 4;
          update((prior) => ({ ...prior, pace }));
        }} className="mt-2 min-h-11 w-full rounded-lg border bg-background px-3 text-sm">
          <option value={1}>1 bài/tuần · Nhẹ nhàng</option><option value={2}>2 bài/tuần · Nhịp gợi ý</option><option value={4}>4 bài/tuần · Khi có nhiều thời gian</option>
        </select>
        <p className="mt-3 text-sm leading-7" data-pace-estimate>Khoảng <strong>{weeks} tuần</strong> để đi qua 40 bài; chưa tính thời gian học bù. Mỗi bài khoảng 45 phút, có thể chia hai buổi.</p>
        <p className="mt-2 text-sm leading-7 text-muted-foreground">Một tuần mẫu: {progress.pace} buổi học mới + 2 buổi ôn 20–30 phút + 1 buổi sửa lỗi 15 phút. Chừa ngày nghỉ; chưa hiểu thì lặp lại tuần, không ép tăng tốc.</p>
      </div>
    </section>

    {assessment && <section ref={assessmentPanel} tabIndex={-1} className="rounded-2xl border-2 border-emerald-600 bg-secondary/10 p-4 outline-none sm:p-7" aria-label="Bài đánh giá đang mở">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3"><p className="max-w-2xl text-sm leading-7 text-muted-foreground">Khảo sát, kiểm tra chặng và tổng hợp dùng lại câu trong bài học. Đây là công cụ tự ôn, không phải đề độc lập chưa từng gặp. Đổi hoặc đóng bộ câu sẽ bỏ các lựa chọn chưa chấm.</p><Button variant="outline" onClick={() => setAssessment(null)}>Đóng bộ câu</Button></div>
      <RoadmapQuiz key={assessment.id} questions={assessment.ids.map((id) => catalog.questions.find((q) => q.id === id)!)} title={assessment.title} passMark={assessment.passMark} ready={ready} onComplete={(score, missedIds) => {
        setMissed(missedIds);
        update((prior) => ({ ...prior, assessments: { ...prior.assessments, [assessment.id]: { score, total: assessment.ids.length, at: Date.now() } } }));
      }} />
      {missed !== null && <div className="mt-5 rounded-xl border bg-background p-4" aria-label="Gợi ý sau đánh giá">
        <h3 className="font-bold">{missed.length ? 'Nên bắt đầu sửa từ bài sớm nhất bên dưới' : 'Bạn làm tốt bộ câu này'}</h3>
        {missed.length ? <ul className="mt-3 space-y-2">{catalog.lessons.filter((lesson) => missed.includes(lesson.id)).map((lesson) => <li key={lesson.id}><Link href={`${ROADMAP_PATH}/${lesson.id}`} className="text-sm text-emerald-800 underline underline-offset-4">{lesson.title}</Link></li>)}</ul> : <p className="mt-2 text-sm leading-7">Hãy thử tự giải thích không nhìn lời giải, làm thêm đề liên quan và giữ lịch ôn. Kết quả này không thay thế việc học các phần chưa được hỏi.</p>}
      </div>}
    </section>}

    <section id="ban-do" className="scroll-mt-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-wider text-emerald-800">Bản đồ học tập</p><h2 className="mt-2 text-2xl font-bold">10 chặng, không bỏ qua mắt xích</h2></div><p className="max-w-md text-sm leading-6 text-muted-foreground">Đọc → tự giải ví dụ → đạt 3/3 → kiểm tra chặng. Mốc gợi ý 7/8 câu mỗi chặng; chưa đạt thì sửa bài sai rồi thử lại.</p></div>
      <div className="grid items-start gap-5 lg:grid-cols-2">
        {catalog.stages.map((stage, i) => {
          const complete = stage.lessonIds.filter((id) => progress.lessons[id]?.masteredAt != null).length;
          const result = progress.assessments[stage.id];
          return <article key={stage.id} className="overflow-hidden rounded-2xl border" data-stage={stage.id}>
            <div className="flex gap-4 border-b bg-secondary/25 p-5"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-lg font-bold text-emerald-900">{String(i + 1).padStart(2, '0')}</span><div className="min-w-0"><p className="text-xs font-medium text-emerald-800">{stage.level} · {complete}/4 bài đã từng đạt</p><h3 className="mt-1 text-lg font-bold leading-6">{stage.title}</h3></div></div>
            <div className="p-5"><p className="text-sm leading-7 text-muted-foreground">{stage.description}</p>
              <ol className="mt-4 divide-y">{stage.lessonIds.map((id) => {
                const lesson = lessonMap.get(id)!;
                const record = progress.lessons[id];
                return <li key={id}><Link href={`${ROADMAP_PATH}/${id}`} className="group flex min-h-16 items-start gap-3 py-4 text-sm hover:text-emerald-800">
                  <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${record?.latest === 3 ? 'bg-emerald-100 text-emerald-900' : 'bg-secondary text-muted-foreground'}`}>{record?.latest === 3 ? <Check size={14} /> : <BookOpen size={13} />}</span>
                  <span className="min-w-0 flex-1"><span className="block font-medium leading-6">{lesson.title}</span><span className="mt-1 block text-xs text-muted-foreground">{record ? `Lần gần nhất ${record.latest}/3${record.latest < 3 ? ' · Cần ôn lại' : ''}` : `${lesson.minutes} phút · Chưa tự kiểm tra`}</span></span><ArrowRight size={16} className="mt-1 shrink-0" />
                </Link></li>;
              })}</ol>
              <p className="mt-3 rounded-lg bg-emerald-50 p-3 text-xs leading-6 text-emerald-950"><strong>Đích của chặng:</strong> {stage.target}</p>
              <Button variant="outline" disabled={!ready} className="mt-4" onClick={() => openAssessment({ id: stage.id, title: `Kiểm tra chặng ${i + 1}: ${stage.title}`, ids: stage.checkpointIds, passMark: 7 })}>Tự kiểm tra chặng {i + 1} · 8 câu</Button>
              {result && <p className="mt-2 text-xs text-muted-foreground">Gần nhất: {result.score}/{result.total}{result.score >= 7 ? ' · Đạt mốc tự kiểm' : ' · Cần củng cố'}</p>}
              {assessment?.id === stage.id && <button onClick={() => assessmentPanel.current?.scrollIntoView({ block: 'start' })} className="mt-3 block text-sm text-emerald-800 underline">Đến bộ câu đã mở phía trên</button>}
            </div>
          </article>;
        })}
      </div>
    </section>

    <section className="rounded-2xl bg-emerald-950 p-6 text-white sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-wider text-emerald-200">Khi đã đi qua 10 chặng</p>
      <h2 className="mt-2 text-2xl font-bold">Thử nối các mảnh kiến thức</h2>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-emerald-50">20 câu chọn từ các bài đã học. Mốc gợi ý 16/20, kèm khả năng giải thích cách làm. Nếu chỉ nhớ đáp án, hãy đổi dữ kiện và tự giải trên giấy. Sau đó chọn đề Hóa 11 trong kho để luyện rộng hơn.</p>
      <Button variant="secondary" className="mt-5" disabled={!ready} onClick={() => openAssessment({ id: 'tong-hop', title: 'Tự kiểm tra tổng hợp', ids: catalog.finalIds, passMark: 16 })}>Mở 20 câu tổng hợp</Button>
      {assessment?.id === 'tong-hop' && <button className="ml-4 mt-3 text-sm underline" onClick={() => assessmentPanel.current?.scrollIntoView({ block: 'start' })}>Đến bộ câu đã mở phía trên</button>}
      {progress.assessments['tong-hop'] && <p className="mt-3 text-sm">Lần gần nhất: {progress.assessments['tong-hop'].score}/20</p>}
    </section>

    <section className="grid gap-6 border-t pt-8 md:grid-cols-2">
      <div><h2 className="font-bold">Học bền và học an toàn</h2><p className="mt-3 text-sm leading-7 text-muted-foreground">Bài ngắn là nền để nối kiến thức, không thay toàn bộ SGK, bài tập trên lớp hoặc thầy cô. Nội dung tự biên soạn, chưa được giáo viên thẩm định độc lập. Nếu vướng hai buổi liền, đem đúng bước chưa hiểu hỏi người hướng dẫn.</p><p className="mt-3 text-sm leading-7 text-muted-foreground">Các phản ứng là ví dụ học thuật. Không tự thử với acid, base, khí hay hóa chất ở nhà; thực hành chỉ ở nơi phù hợp có giáo viên hướng dẫn. Tiến độ và ghi chú chỉ lưu trên thiết bị, không đồng bộ tài khoản; trang cần tải được trước khi học.</p></div>
      <div><h2 className="font-bold">Phạm vi và tài liệu đối chiếu</h2><p className="mt-3 text-sm leading-7 text-muted-foreground">Sắp lại nền THCS → Hóa 10 → Hóa 11 theo thứ tự dễ học lại. Mục lục Kết nối tri thức dùng để đối chiếu phạm vi, không phải bản chép SGK. Không mở rộng sang chương trình Hóa 12.</p><ul className="mt-3 space-y-3">{catalog.sources.map((source) => <li key={source.url} className="text-sm leading-6"><a href={source.url} target="_blank" rel="noopener noreferrer" className="text-emerald-800 underline underline-offset-4">{source.title}</a><p className="text-xs text-muted-foreground">{source.note}</p></li>)}</ul></div>
    </section>
  </div>;
}
