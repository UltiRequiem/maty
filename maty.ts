import { pmc } from "./mod.ts";

Deno.args.forEach((arg) => {
  console.log(pmc(parseInt(arg)));
});
