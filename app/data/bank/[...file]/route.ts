import { getPracticeBank, listBankSubjects } from '@/lib/content';

// Ngân hàng câu hỏi của từng môn xuất thành file riêng: luyện tập, đề con, ôn câu sai và
// sổ tay câu sai chỉ tải môn đang học, không phải toàn bộ câu hỏi của mọi môn.
export const dynamic = 'force-static';
export const dynamicParams = false;

export function generateStaticParams(): { file: string[] }[] {
  return listBankSubjects().map((slug) => ({ file: [`${slug}.json`] }));
}

interface BankDataRouteProps {
  params: { file: string[] };
}

export function GET(_request: Request, { params }: BankDataRouteProps): Response {
  const slug = params.file.join('/').replace(/\.json$/, '');

  if (!listBankSubjects().includes(slug)) {
    return new Response('{"error":"Không tìm thấy môn"}', {
      status: 404,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  }

  return new Response(JSON.stringify(getPracticeBank(slug)), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
