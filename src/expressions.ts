import { Fraction } from "./fraction.ts";
import { isInt } from "./_utils.ts";
import { GREEK_LETTERS } from "./_consts.ts";

export class Term {
  variables: Variable[];
  coefficients: Fraction[];

  constructor(variable?: Variable) {
    if (!(variable instanceof Variable)) {
      throw new Error("Term must be initialized with a Variable");
    }

    this.variables = variable ? [variable.copy()] : [];
    this.coefficients = [new Fraction(1, 1)];
  }

  coefficient() {
    return this.coefficients.reduce(
      (p, c) => p.multiply(c),
      new Fraction(1, 1),
    );
  }

  combineVars() {
    const uniqueVariables: Record<string, number> = {};

    for (var index = 0; index < this.variables.length; index++) {
      const thisVar = this.variables[index];

      if (thisVar.variable in uniqueVariables) {
        uniqueVariables[thisVar.variable] += thisVar.degree;
      } else {
        uniqueVariables[thisVar.variable] = thisVar.degree;
      }
    }

    const newVariables = [];

    for (const variable in uniqueVariables) {
      const newVariable = new Variable(variable);

      newVariable.degree = uniqueVariables[variable];

      newVariables.push(newVariable);
    }

    this.variables = newVariables;

    return this;
  }

  copy() {
    const newTerm = new Term();

    newTerm.variables = this.variables.map((variable) => variable.copy());
    newTerm.coefficients = this.coefficients.map((coefficient) =>
      coefficient.copy()
    );

    return newTerm;
  }

  add(term: Term) {
    if (!(term instanceof Term)) {
      throw new TypeError("Term.add must be called with a Term");
    }

    if (!this.canBeCombinedWith(term)) {
      throw new Error("Internal Error.");
    }

    const copy = this.copy();

    copy.coefficients = [copy.coefficient().add(term.coefficient())];

    return copy;
  }

  subtract(term: Term) {
    if (!(term instanceof Term)) {
      throw new TypeError("Term.subtract must be called with a Term");
    }

    if (!this.canBeCombinedWith(term)) {
      throw new Error("Internal Error.");
    }

    const copy = this.copy();

    copy.coefficients = [copy.coefficient().subtract(term.coefficient())];

    return copy;
  }

  multiply(value: Term | number | Fraction, simplify = true) {
    let thisTerm = this.copy();

    const valueIsInteger = isInt(value);

    if (value instanceof Term) {
      thisTerm.variables = thisTerm.variables.concat(value.variables);
      thisTerm.coefficients = value.coefficients.concat(thisTerm.coefficients);
    } else if (valueIsInteger || value instanceof Fraction) {
      const newCoefficient = valueIsInteger ? new Fraction(value, 1) : value;

      if (thisTerm.variables.length === 0) {
        thisTerm.coefficients.push(newCoefficient);
      } else {
        thisTerm.coefficients.unshift(newCoefficient);
      }
    } else {
      throw new TypeError(
        "Term.multiply must be called with a Term, number or Fraction",
      );
    }

    return simplify ? thisTerm.simplify() : thisTerm;
  }

  canBeCombinedWith(term: Term) {
    const thisVars = this.variables;
    const thatVars = term.variables;

    if (thisVars.length != thatVars.length) {
      return false;
    }

    let matches = 0;

    for (let index = 0; index < thisVars.length; index++) {
      for (let j = 0; j < thatVars.length; j++) {
        if (
          thisVars[index].variable === thatVars[j].variable &&
          thisVars[index].degree === thatVars[j].degree
        ) {
          matches += 1;
        }
      }
    }

    return matches === thisVars.length;
  }

  onlyHasVariable(variable: string) {
    for (var i = 0; i < this.variables.length; i++) {
      if (this.variables[i].variable != variable) {
        return false;
      }
    }

    return true;
  }

  simplify() {
    const copy = this.copy();

    copy.coefficients = [this.coefficient()];

    copy.combineVars();

    return copy.sort();
  }

  sort() {
    this.variables = this.variables.sort((a, b) => b.degree - a.degree);

    return this;
  }

  toString({ implicit } = { implicit: true }) {
    let str = "";

    for (var i = 0; i < this.coefficients.length; i++) {
      const coef = this.coefficients[i];

      const { numerator, denominator } = coef.abs();

      if (numerator !== 1 || denominator !== 1) {
        str += " * " + coef.toString();
      }
    }

    str = this.variables.reduce((p, c) => {
      if (implicit && !!p) {
        const vStr = c.toString();

        return !!vStr ? p + "*" + vStr : p;
      } else return p.concat(c.toString());
    }, str);

    str = str.substring(0, 3) === " * " ? str.substring(3, str.length) : str;

    str = str.substring(0, 1) === "-" ? str.substring(1, str.length) : str;

    return str;
  }
}

export class Variable {
  degree: number;
  variable: string;

  constructor(variable: string, degree = 1) {
    if (typeof variable !== "string") {
      throw new Error("Variable must be a string");
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
    } else if (degree === 1) {
      return variable;
    }

    return `${variable}^${degree}`;
  }
}
