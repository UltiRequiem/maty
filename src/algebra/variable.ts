import { GREEK_LETTERS } from "../_consts.ts";

export class Variable {
  degree: number;
  variable: string;

  constructor(variable: string, degree = 1) {
    if (typeof variable !== "string") {
      throw new TypeError("Variable must be a string!");
    }

    if (typeof degree !== "number") {
      throw new TypeError("Degree must be an integer!");
    }

    this.variable = variable;
    this.degree = degree;
  }

  copy() {
    return new Variable(this.variable, this.degree);
  }

  toString() {
    const { variable, degree } = this;

    if (degree === 0) {
      return "";
    }

    if (degree === 1) {
      return variable;
    }

    return `${variable}^${degree}`;
  }

  toTex() {
    let { variable, degree } = this;

    if (GREEK_LETTERS.indexOf(variable) > -1) {
      variable = `\\ ${variable}`;
    }

    if (degree === 0) {
      return "";
    }

    if (degree === 1) {
      return variable;
    }

    return `${variable}^{${degree}}`;
  }
}
