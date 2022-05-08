/**
 * Greatest common divisor
 */
export function gcd(x: number, y: number) {
  while (y) {
    const temp = x;
    x = y;
    y = temp % y;
  }

  return x;
}

/**
 * Least Common Multiple
 */
export function lcm(x: number, y: number) {
  return (x * y) / gcd(x, y);
}

export function isInt(value: unknown): value is number {
  return typeof value === "number" && value % 1 === 0;
}

export function round(decimal: number, places = 2) {
  const pow = Math.pow(10, places);
  return Math.round(decimal * pow) / pow;
}

export function isAlpha(c: string) {
  return (c >= "a" && c <= "z") || (c >= "A" && c <= "Z");
}

export function isDigit(c: string) {
  return c >= "0" && c <= "9";
}

export function isAlphaNum(c: string) {
  return isAlpha(c) || isDigit(c);
}
