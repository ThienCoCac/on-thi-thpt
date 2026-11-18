// Bộ tính biểu thức kiểm chứng đáp số ví dụ trong sổ tay công thức.
// Ngữ pháp: số thập phân, + - * / ^ ( ) và các hằng/hàm pi, e, sqrt, abs, sin, cos, tan, ln, log, exp.
// Lượng giác tính theo radian; ln là logarit tự nhiên, log là logarit cơ số 10.
// Cài bằng parser đệ quy thay vì eval để không thực thi chuỗi tùy ý và không phụ thuộc môi trường.

export const DEFAULT_CHECK_TOLERANCE = 1e-6;

const FUNCTIONS: Record<string, (x: number) => number> = {
  sqrt: Math.sqrt,
  abs: Math.abs,
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  ln: Math.log,
  log: Math.log10,
  exp: Math.exp,
};

export function evaluateCheckExpression(expression: string): number {
  const src = expression.replace(/\s+/g, '');
  if (!src) throw new Error('Biểu thức kiểm tra rỗng');
  let pos = 0;

  function fail(detail: string): never {
    throw new Error(`Biểu thức kiểm tra không hợp lệ (${detail}): ${expression}`);
  }

  function expect(ch: string): void {
    if (src[pos] !== ch) fail(`thiếu "${ch}" tại vị trí ${pos}`);
    pos += 1;
  }

  function parseExpression(): number {
    let value = parseTerm();
    while (src[pos] === '+' || src[pos] === '-') {
      const op = src[pos];
      pos += 1;
      const right = parseTerm();
      value = op === '+' ? value + right : value - right;
    }
    return value;
  }

  function parseTerm(): number {
    let value = parseFactor();
    while (src[pos] === '*' || src[pos] === '/') {
      const op = src[pos];
      pos += 1;
      const right = parseFactor();
      value = op === '*' ? value * right : value / right;
    }
    return value;
  }

  // Lũy thừa kết hợp phải; dấu một ngôi có độ ưu tiên thấp hơn lũy thừa theo quy ước toán học (-2^2 = -4).
  function parseFactor(): number {
    if (src[pos] === '-') {
      pos += 1;
      return -parseFactor();
    }
    if (src[pos] === '+') {
      pos += 1;
      return parseFactor();
    }
    const base = parsePrimary();
    if (src[pos] === '^') {
      pos += 1;
      return base ** parseFactor();
    }
    return base;
  }

  function parsePrimary(): number {
    if (src[pos] === '(') {
      pos += 1;
      const value = parseExpression();
      expect(')');
      return value;
    }
    const numberMatch = /^(?:\d+(?:\.\d+)?|\.\d+)/.exec(src.slice(pos));
    if (numberMatch) {
      pos += numberMatch[0].length;
      return Number(numberMatch[0]);
    }
    const wordMatch = /^[a-z]+/.exec(src.slice(pos));
    if (wordMatch) {
      pos += wordMatch[0].length;
      if (wordMatch[0] === 'pi') return Math.PI;
      if (wordMatch[0] === 'e') return Math.E;
      const fn = FUNCTIONS[wordMatch[0]];
      if (fn) {
        expect('(');
        const value = parseExpression();
        expect(')');
        return fn(value);
      }
      fail(`hằng/hàm lạ "${wordMatch[0]}"`);
    }
    return fail(`ký tự lạ tại vị trí ${pos}`);
  }

  const value = parseExpression();
  if (pos !== src.length) fail(`dư ký tự tại vị trí ${pos}`);
  if (!Number.isFinite(value)) fail('kết quả không hữu hạn');
  return value;
}

export function checkMatchesValue(check: { expression: string; value: number; tolerance?: number }): boolean {
  const actual = evaluateCheckExpression(check.expression);
  return Math.abs(actual - check.value) <= (check.tolerance ?? DEFAULT_CHECK_TOLERANCE);
}