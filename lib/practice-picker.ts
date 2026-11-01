// Bốc câu theo vòng: luôn lấy nhóm câu ít gặp nhất trước và xáo trộn trong nhóm,
// nên không gặp lại câu cũ cho tới khi đã đi hết một vòng của pool.

function shuffle<T>(items: T[]): T[] {
  const list = [...items];
  for (let index = list.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [list[index], list[swap]] = [list[swap], list[index]];
  }
  return list;
}

export function pickFreshQuestions<T extends { id: string }>(
  pool: T[],
  count: number,
  seen: Record<string, number>,
): T[] {
  const target = Math.max(0, Math.min(Math.floor(count), pool.length));
  const groups = new Map<number, T[]>();

  for (const item of pool) {
    const times = seen[item.id] ?? 0;
    const group = groups.get(times);
    if (group) {
      group.push(item);
    } else {
      groups.set(times, [item]);
    }
  }

  const ordered: T[] = [];
  for (const times of [...groups.keys()].sort((a, b) => a - b)) {
    ordered.push(...shuffle(groups.get(times) ?? []));
  }

  return ordered.slice(0, target);
}
