import { pmc } from "./pmc.ts";

import { assertEquals } from "https://deno.land/std@0.135.0/testing/asserts.ts";
import { Test } from "https://deno.land/x/ultirequiem@0.0.14/deno_types.ts";

export const test: Test = {
  fn() {
    const result = pmc(10);

    assertEquals(result, [
      [1, 10],
      [2, 5],
    ]);
  },
  name: "pmc",
};
