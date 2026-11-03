import { getRunnerExam, listExams } from '@/lib/content';

// Mỗi đề một file JSON chứa Markdown/LaTeX thô, tải khi mở trang làm bài hoặc luyện tập.
// Nhờ vậy HTML của trang chỉ còn khung giao diện thay vì nhúng sẵn toàn bộ câu hỏi.
export const dynamic = 'force-static';
export const dynamicParams = false;

export function generateStaticParams(): { file: string[] }[] {
  return listExams().map((exam) => ({ file: [`${exam.slug}.json`] }));
}

interface ExamDataRouteProps {
  params: { file: string[] };
}

export function GET(_request: Request, { params }: ExamDataRouteProps): Response {
  const slug = params.file.join('/').replace(/\.json$/, '');
  const exam = getRunnerExam(slug);

  if (!exam) {
    return new Response('{"error":"Không tìm thấy đề"}', {
      status: 404,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  }

  return new Response(JSON.stringify(exam), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
