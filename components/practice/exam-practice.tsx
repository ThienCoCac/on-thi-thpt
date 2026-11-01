'use client';

import { useEffect, useState } from 'react';
import { History, RotateCcw } from 'lucide-react';
import { PracticeRunner } from '@/components/practice/practice-runner';
import { Button } from '@/components/ui/button';
import type { RunnerExam, RunnerQuestion } from '@/lib/content-types';
import { formatDateTime } from '@/lib/format';
import {
  clearPracticeSession,
  loadPracticeSession,
  recordPracticeResult,
  type PracticeSessionSnapshot,
} from '@/lib/progress';

// Đề có sẵn danh sách câu nên chỉ làm tiếp khi bản lưu trùng đúng thứ tự câu:
// sửa đề giữa chừng thì bản lưu cũ không còn giá trị.
function matchesExam(saved: RunnerQuestion[], exam: RunnerQuestion[]): boolean {
  return (
    saved.length === exam.length &&
    saved.every((question, position) => question.id === exam[position]?.id)
  );
}

export function ExamPractice({ exam }: { exam: RunnerExam }) {
  const resumeKey = `de-thi/${exam.slug}`;
  const [resumed, setResumed] = useState<PracticeSessionSnapshot | null>(null);
  const [restarts, setRestarts] = useState(0);

  // Đọc localStorage sau khi hydrate để lần render đầu khớp với HTML tĩnh.
  useEffect(() => {
    const session = loadPracticeSession(resumeKey);
    if (session && matchesExam(session.questions, exam.questions)) {
      setResumed(session);
    }
  }, [resumeKey, exam.questions]);

  // Runner bị gỡ vẫn ghi lại nháp của nó ở bước dọn dẹp, nên xóa ở effect của cha:
  // effect của cha chạy sau cùng nên bản lưu chắc chắn hết, không cần chờ hẹn giờ.
  useEffect(() => {
    if (restarts > 0) {
      clearPracticeSession(resumeKey);
    }
  }, [restarts, resumeKey]);

  function restart() {
    setResumed(null);
    setRestarts((previous) => previous + 1);
  }

  return (
    <>
      {resumed ? (
        <div className="border-b bg-primary/5">
          <div className="container flex flex-wrap items-center justify-between gap-2 py-2.5">
            <p className="flex min-w-0 items-center gap-2 text-sm">
              <History className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <span className="truncate">
                Đang tiếp tục phiên đã lưu lúc {formatDateTime(new Date(resumed.updatedAt))}
              </span>
            </p>
            <Button type="button" variant="outline" size="sm" onClick={restart}>
              <RotateCcw aria-hidden="true" />
              Làm lại từ đầu
            </Button>
          </div>
        </div>
      ) : null}

      <PracticeRunner
        key={resumed ? resumed.updatedAt : 'fresh'}
        title={`Luyện tập · ${exam.title}`}
        subtitle={exam.subjectName}
        questions={resumed?.questions ?? exam.questions}
        backHref={`/de-thi/${exam.slug}`}
        resumeKey={resumeKey}
        initial={resumed}
        onFinish={(outcome) =>
          recordPracticeResult({
            kind: 'practice',
            title: `Luyện tập · ${exam.title}`,
            examSlug: exam.slug,
            subjectSlug: exam.subjectSlug,
            subjectName: exam.subjectName,
            outcome,
            metaFor: (id) => ({
              id,
              subjectSlug: exam.subjectSlug,
              subjectName: exam.subjectName,
              sourceTitle: exam.title,
              examSlug: exam.slug,
            }),
          })
        }
      />
    </>
  );
}
