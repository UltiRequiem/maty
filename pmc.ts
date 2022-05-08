/**
 * Find all possible multiplication combinations of two numbers that gives the desired result.
 *
 * PMC -> Possible Multiplication Combinations.
 *
 * Example: 10 ->[[1, 10], [2, 5]]
 */
export function pmc(expected: number) {
  const gives: [number, number][] = [];

  for (let i = 0; i < expected; i++) {
    for (let j = expected; j > 0; j--) {
      const result = i * j;

      if (result < expected) {
        break;
      }

      if (!(result === expected)) {
        continue;
      }

      const sorted = [i, j].sort() as [number, number];

      if (gives.some(([a, b]) => a === sorted[0] && b === sorted[1])) {
        continue;
      }

      gives.push(sorted);
    }
  }

  return gives;
}
