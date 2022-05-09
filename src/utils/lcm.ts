import { gcd } from "./gcd.ts";

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
