import { gcd, isInt, lcm } from "./_utils.ts";

export class Fraction {
  numerator: number;
  denominator: number;

  constructor(a: number, b: number) {
    if (!isInt(a) || !isInt(b)) {
      throw new Error("Fraction must be created with integers");
    }

    if (b === 0) {
      throw new EvalError("Divide by zero.");
    }

    this.numerator = a;
    this.denominator = b;
  }

  copy() {
    return new Fraction(this.numerator, this.denominator);
  }

  reduce() {
    const copy = this.copy();

    const g = gcd(copy.numerator, copy.denominator);

    copy.numerator = copy.numerator / g;
    copy.denominator = copy.denominator / g;

    if (Math.sign(copy.denominator) == -1 && Math.sign(copy.numerator) == 1) {
      copy.numerator *= -1;
      copy.denominator *= -1;
    }

    return copy;
  }

  equalTo(fraction: Fraction) {
    if (fraction instanceof Fraction) {
      const thisReduced = this.reduce();
      const otherReduced = fraction.reduce();

      return (
        thisReduced.numerator === otherReduced.numerator &&
        thisReduced.denominator === otherReduced.denominator
      );
    }

    return false;
  }

  add(fraction: Fraction | number, simplify = true) {
    let a, b;

    if (fraction instanceof Fraction) {
      a = fraction.numerator;
      b = fraction.denominator;
    } else if (isInt(fraction)) {
      a = fraction;
      b = 1;
    } else {
      throw new TypeError(`Summand must be of type Fraction or Integer.`);
    }

    const copy = this.copy();

    if (this.denominator == b) {
      copy.numerator += a;
    } else {
      const m = lcm(copy.denominator, b);

      const thisM = m / copy.denominator;

      const otherM = m / b;

      copy.numerator *= thisM;
      copy.denominator *= thisM;

      a *= otherM;

      copy.numerator += a;
    }

    return simplify ? copy.reduce() : copy;
  }

  subtract(fraction: Fraction | number, simplify = true) {
    const copy = this.copy();

    if (fraction instanceof Fraction) {
      return copy.add(
        new Fraction(-fraction.numerator, fraction.denominator),
        simplify,
      );
    } else if (isInt(fraction)) {
      return copy.add(new Fraction(-fraction, 1), simplify);
    }

    throw new TypeError(`Subtrahend must be of type Fraction or Integer.`);
  }

  multiply(fraction: Fraction | number, simplify = true) {
    let a, b;

    if (fraction instanceof Fraction) {
      a = fraction.numerator;
      b = fraction.denominator;
    } else if (isInt(fraction) && fraction) {
      a = fraction;
      b = 1;
    } else if (fraction === 0) {
      a = 0;
      b = 1;
    } else {
      throw new TypeError(`Multiplier must be of type Fraction or Integer.`);
    }

    const copy = this.copy();

    copy.numerator *= a;
    copy.denominator *= b;

    return simplify ? copy.reduce() : copy;
  }

  divide(fraction: Fraction | number, simplify = true) {
    if (fraction.valueOf() === 0) {
      throw new EvalError("Divide By Zero");
    }

    const copy = this.copy();

    if (fraction instanceof Fraction) {
      return copy.multiply(
        new Fraction(fraction.denominator, fraction.numerator),
        simplify,
      );
    } else if (isInt(fraction)) {
      return copy.multiply(new Fraction(1, fraction), simplify);
    }

    throw new TypeError(`Divisor must be of type Fraction or Integer.`);
  }

  pow(number: number, simplify = true) {
    let copy = this.copy();

    if (number >= 0) {
      copy.numerator = Math.pow(copy.numerator, number);
      copy.denominator = Math.pow(copy.denominator, number);
    } else if (number < 0) {
      copy = copy.pow(Math.abs(number));

      const tmp = copy.numerator;

      copy.numerator = copy.denominator;
      copy.denominator = tmp;
    }

    return simplify ? copy.reduce() : copy;
  }

  abs() {
    const copy = this.copy();

    copy.numerator = Math.abs(copy.numerator);
    copy.denominator = Math.abs(copy.denominator);

    return copy;
  }

  valueOf() {
    return this.numerator / this.denominator;
  }

  private text() {
    if (this.numerator === 0) {
      return "0";
    } else if (this.denominator === 1) {
      return this.numerator.toString();
    } else if (this.denominator === -1) {
      return (-this.numerator).toString();
    }

    throw new Error("Internal Error");
  }

  toString() {
    try {
      return this.text();
    } catch {
      return `${this.numerator}/${this.denominator}`;
    }
  }

  toTex() {
    try {
      return this.text();
    } catch {
      return `//frac{${this.numerator}}{${this.denominator}}`;
    }
  }

  isRational(root: "sqrt" | "cbrt") {
    let checker;

    if (root === "sqrt") {
      checker = Math.sqrt;
    } else if (root === "cbrt") {
      checker = Math.cbrt;
    } else {
      throw new Error("Internal Error");
    }

    if (this.valueOf() === 0) {
      return true;
    }

    const sqrtNumer = checker(this.numerator);
    const sqrtDenom = checker(this.denominator);

    return isInt(sqrtNumer) && isInt(sqrtDenom);
  }
}
