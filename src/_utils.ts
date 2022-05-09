function _gcd(x: number, y: number) {
  while (y) {
    const temp = x;

    x = y;
    y = temp % y;
  }

  return x;
}

/**
 * Greatest common divisor
 *
 * Example: gcd(12, 18) => 6
 *
 *  Reference {@link https://wikipedia.org/wiki/Greatest_common_divisor}
 */
export function gcd(...numbers: number[]) {
  let [result] = numbers;

  for (const number of numbers) {
    result = _gcd(number, result);
  }

  return result;
}

/**
 * Smallest Common Multiple
 *
 * Example: lcm(2, 3) => 6
 *
 * Reference {@link https://wikipedia.org/wiki/Least_common_multiple}
 */
export function lcm(x: number, y: number) {
  return (x * y) / gcd(x, y);
}

export function isInt(value: unknown): value is number {
  return typeof value === "number";
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
