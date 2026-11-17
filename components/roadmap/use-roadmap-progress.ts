'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { emptyRoadmapProgress, ROADMAP_KEY, roadmapProgressSchema, type RoadmapProgress } from '@/lib/roadmap-progress';

export function useRoadmapProgress() {
  const [progress, setProgress] = useState(emptyRoadmapProgress);
  const current = useRef(progress);
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState('');
  const canWrite = useRef(true);

  useEffect(() => {
    function read() {
      try {
        const raw = localStorage.getItem(ROADMAP_KEY);
        const next = raw ? roadmapProgressSchema.parse(JSON.parse(raw)) : emptyRoadmapProgress();
        current.current = next;
        setProgress(next);
        canWrite.current = true;
        setNotice('');
      } catch {
        canWrite.current = false;
        setNotice('Không đọc được tiến độ đã lưu hoặc trình duyệt chặn lưu trữ. Bạn vẫn học được, nhưng thay đổi trong phiên này chưa được lưu lâu dài; dữ liệu cũ không bị ghi đè.');
      }
      setReady(true);
    }
    read();
    const sync = (event: StorageEvent) => { if (event.key === ROADMAP_KEY || event.key === null) read(); };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  const update = useCallback((change: (previous: RoadmapProgress) => RoadmapProgress) => {
    // Đọc lại trước mỗi thay đổi để giữ cập nhật ở tab khác nếu có.
    let previous = current.current;
    if (canWrite.current) {
      try {
        const raw = localStorage.getItem(ROADMAP_KEY);
        if (raw) previous = roadmapProgressSchema.parse(JSON.parse(raw));
      } catch { canWrite.current = false; }
    }
    const next = change(previous);
    current.current = next;
    setProgress(next);
    try {
      if (!canWrite.current) throw new Error('Không ghi đè dữ liệu chưa đọc được');
      localStorage.setItem(ROADMAP_KEY, JSON.stringify(next));
      setNotice('');
    } catch {
      setNotice('Tiến độ hiện chỉ giữ trong phiên này vì không lưu được trên trình duyệt. Đừng đóng trang nếu còn ghi chú cần chép lại.');
    }
  }, []);

  return { progress, ready, notice, update };
}
