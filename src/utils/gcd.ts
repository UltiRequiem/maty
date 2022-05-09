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
