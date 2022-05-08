import { pmc } from "./pmc.ts";

import { assertEquals } from "https://deno.land/std@0.135.0/testing/asserts.ts";

Deno.test("pmc", () => {
  const result = pmc(10);

  assertEquals(result, [
    [1, 10],
    [2, 5],
  ]);
});
