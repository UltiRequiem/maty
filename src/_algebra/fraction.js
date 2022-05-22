import { gcd, lcm } from "../utils/mod.ts";

export class Fraction {
  constructor(a, b) {
    if (b === 0) {
      throw new EvalError("Divide By Zero");
    } else if (typeof a === "number" && typeof b === "number") {
      this.numer = a;
      this.denom = b;
    } else {
      throw new TypeError(
        `Invalid Argument (${a.toString()},${b.toString()}): Divisor and dividend must be of type Integer.`
      );
    }
  }

  copy() {
    return new Fraction(this.numer, this.denom);
  }

  reduce() {
    const copy = this.copy();

    const g = gcd(copy.numer, copy.denom);
    copy.numer = copy.numer / g;
    copy.denom = copy.denom / g;

    if (Math.sign(copy.denom) == -1 && Math.sign(copy.numer) == 1) {
      copy.numer *= -1;
      copy.denom *= -1;
    }

    return copy;
  }

  equalTo(fraction) {
    if (fraction instanceof Fraction) {
      const thisReduced = this.reduce();
      const thatReduced = fraction.reduce();
      return (
        thisReduced.numer === thatReduced.numer &&
        thisReduced.denom === thatReduced.denom
      );
    } else {
      return false;
    }
  }

  add(f, simplify = true) {
    let a;
    let b;

    if (f instanceof Fraction) {
      a = f.numer;
      b = f.denom;
    } else if (typeof f === "number") {
      a = f;
      b = 1;
    } else {
      throw new TypeError(
        `Invalid Argument (${f.toString()}): Summand must be of type Fraction or Integer.`
      );
    }

    const copy = this.copy();

    if (this.denom == b) {
      copy.numer += a;
    } else {
      const m = lcm(copy.denom, b);
      const thisM = m / copy.denom;
      const otherM = m / b;

      copy.numer *= thisM;
      copy.denom *= thisM;

      a *= otherM;

      copy.numer += a;
    }

    return simplify ? copy.reduce() : copy;
  }

  subtract(f, simplify = true) {
    const copy = this.copy();

    if (f instanceof Fraction) {
      return copy.add(new Fraction(-f.numer, f.denom), simplify);
    } else if (typeof f === "number") {
      return copy.add(new Fraction(-f, 1), simplify);
    } else {
      throw new TypeError(
        `Invalid Argument (${f.toString()}): Subtrahend must be of type Fraction or Integer.`
      );
    }
  }

  multiply(f, simplify = true) {
    let a;
    let b;

    if (f instanceof Fraction) {
      a = f.numer;
      b = f.denom;
    } else if (typeof f === "number" && f > 0) {
      a = f;
      b = 1;
    } else if (f === 0) {
      a = 0;
      b = 1;
    } else {
      throw new TypeError(
        `Invalid Argument (${f.toString()}): Multiplicand must be of type Fraction or Integer.`
      );
    }

    const copy = this.copy();

    copy.numer *= a;
    copy.denom *= b;

    return simplify ? copy.reduce() : copy;
  }

  divide(f, simplify = true) {
    if (f.valueOf() === 0) {
      throw new EvalError("Divide By Zero");
    }

    const copy = this.copy();

    if (f instanceof Fraction) {
      return copy.multiply(new Fraction(f.denom, f.numer), simplify);
    } else if (typeof f === "number") {
      return copy.multiply(new Fraction(1, f), simplify);
    } else {
      throw new TypeError(
        `Invalid Argument (${f.toString()}): Divisor must be of type Fraction or Integer.`
      );
    }
  }

  pow(n, simplify = true) {
    let copy = this.copy();

    if (n >= 0) {
      copy.numer = copy.numer ** n;
      copy.denom = copy.denom ** n;
    } else if (n < 0) {
      copy = copy.pow(Math.abs(n));

      //Switch numerator and denominator
      const tmp = copy.numer;
      copy.numer = copy.denom;
      copy.denom = tmp;
    }

    return simplify ? copy.reduce() : copy;
  }

  abs() {
    const copy = this.copy();

    copy.numer = Math.abs(copy.numer);
    copy.denom = Math.abs(copy.denom);

    return copy;
  }

  valueOf() {
    return this.numer / this.denom;
  }

  toString() {
    if (this.numer === 0) {
      return "0";
    } else if (this.denom === 1) {
      return this.numer.toString();
    } else if (this.denom === -1) {
      return (-this.numer).toString();
    } else {
      return `${this.numer}/${this.denom}`;
    }
  }

  toTex() {
    if (this.numer === 0) {
      return "0";
    } else if (this.denom === 1) {
      return this.numer.toString();
    } else if (this.denom === -1) {
      return (-this.numer).toString();
    } else {
      return `\\frac{${this.numer}}{${this.denom}}`;
    }
  }

  _squareRootIsRational() {
    if (this.valueOf() === 0) {
      return true;
    }

    const sqrtNumer = Math.sqrt(this.numer);
    const sqrtDenom = Math.sqrt(this.denom);

    return typeof sqrtNumer === "number" && typeof sqrtDenom === "number";
  }

  _cubeRootIsRational() {
    if (this.valueOf() === 0) {
      return true;
    }

    const cbrtNumer = Math.cbrt(this.numer);
    const cbrtDenom = Math.cbrt(this.denom);

    return typeof cbrtNumer === "number" && typeof cbrtDenom === "number";
  }
}
