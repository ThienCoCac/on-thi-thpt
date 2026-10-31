import { getPracticeBank } from '@/lib/content';

// Xuất ngân hàng câu hỏi thành file JSON tĩnh lúc build. Trang luyện tập tải file này
// theo nhu cầu nên không làm nặng bundle của các trang khác.
export const dynamic = 'force-static';

export function GET() {
  return new Response(JSON.stringify(getPracticeBank()), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
