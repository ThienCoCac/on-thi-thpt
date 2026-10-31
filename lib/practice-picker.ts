// Bốc câu ngẫu nhiên có trọng số: câu càng ít xuất hiện trong các phiên trước
// thì càng dễ được chọn, nhờ vậy học sinh gặp nội dung mới thay vì lặp lại.

export function pickFreshQuestions<T extends { id: string }>(
  pool: T[],
  count: number,
  seen: Record<string, number>,
): T[] {
  const remaining = [...pool];
  const picked: T[] = [];
  const target = Math.max(0, Math.min(Math.floor(count), remaining.length));

  while (picked.length < target && remaining.length > 0) {
    const weights = remaining.map((item) => 1 / (1 + (seen[item.id] ?? 0)));
    const total = weights.reduce((sum, weight) => sum + weight, 0);
    let roll = Math.random() * total;
    let index = 0;

    for (; index < remaining.length; index += 1) {
      roll -= weights[index];
      if (roll <= 0) {
        break;
      }
    }

    if (index >= remaining.length) {
      index = remaining.length - 1;
    }

    picked.push(remaining[index]);
    remaining.splice(index, 1);
  }

  return picked;
}
