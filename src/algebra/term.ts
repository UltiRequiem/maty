import { Variable } from "./variable.ts";
import { Fraction } from "./fraction.ts";
import { Expression } from "./expression.ts";

export class Term {
  variables: Variable[];
  coefficients: Fraction[];

  constructor(variable?: Variable) {
    if (!(variable instanceof Variable)) {
      throw new Error("Term must be initialized with a Variable");
    } else if (!variable) {
      this.variables = [];
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

    for (let index = 0; index < this.variables.length; index++) {
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

  hasVariable(variableToCompare: string) {
    for (const { variable } of this.variables) {
      if (variable === variableToCompare) {
        return true;
      }
    }

    return false;
  }

  eval(
    values: Record<string, Fraction | Expression | number> = {},
    simplify = true,
  ) {
    const copy = this.copy();

    let exp = copy.coefficients.reduce(
      (p, c) => p.multiply(c, simplify),
      new Expression(1),
    );

    for (let i = 0; i < copy.variables.length; i++) {
      const thisVar = copy.variables[i];

      let ev;

      if (thisVar.variable in values) {
        const sub = values[thisVar.variable];

        if (sub instanceof Fraction || sub instanceof Expression) {
          ev = sub.pow(thisVar.degree);
        } else if (typeof sub === "number") {
          ev = Math.pow(sub, thisVar.degree);
        } else {
          throw new TypeError(
            "Invalid Argument (" +
              sub +
              "): Can only evaluate Expressions or Fractions.",
          );
        }
      } else {
        ev = new Expression(thisVar.variable).pow(thisVar.degree);
      }

      exp = exp.multiply(ev, simplify);
    }

    return exp;
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

  maxDegreeOfVariable(variable: string) {
    return this.variables.reduce((p, c) => {
      return c.variable === variable ? Math.max(p, c.degree) : p;
    }, 1);
  }

  maxDegree() {
    return this.variables.reduce((p, c) => Math.max(p, c.degree), 1);
  }

  multiply(value: Term | number | Fraction, simplify = true) {
    let thisTerm = this.copy();

    const valueIsInteger = typeof value === "number";

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

  simplify() {
    const copy = this.copy();

    copy.coefficients = [this.coefficient()];

    copy.combineVars();

    return copy.sort();
  }

  onlyHasVariable(variable: string) {
    for (var i = 0; i < this.variables.length; i++) {
      if (this.variables[i].variable != variable) {
        return false;
      }
    }

    return true;
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

  toTex(dict = { multiplication: "cdot" }) {
    let op = " \\" + dict.multiplication + " ";

    let str = "";

    for (let i = 0; i < this.coefficients.length; i++) {
      const coef = this.coefficients[i];

      if (coef.abs().numerator !== 1 || coef.abs().denominator !== 1) {
        str += op + coef.toTex();
      }
    }
    str = this.variables.reduce((p, c) => {
      return p.concat(c.toTex());
    }, str);
    str = str.substring(0, op.length) === op
      ? str.substring(op.length, str.length)
      : str;
    str = str.substring(0, 1) === "-" ? str.substring(1, str.length) : str;
    str = str.substring(0, 7) === "\\frac{-"
      ? "\\frac{" + str.substring(7, str.length)
      : str;

    return str;
  }
}
