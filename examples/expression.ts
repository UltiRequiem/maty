import { Expression } from "../src/expressions.ts";

const expr = new Expression("x");

expr.add("x");

expr.subtract(3);

console.log(expr.toString());
