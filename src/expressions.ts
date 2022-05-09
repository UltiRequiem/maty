import { Fraction } from "./fraction.ts";
import { isInt } from "./_utils.ts";
import { GREEK_LETTERS } from "./_consts.ts";

export class Expression {
  constants: Fraction[];
  terms: Term[];

  constructor(variable?: string | number | Fraction | Term) {
    this.constants = [];

    if (typeof variable === "string") {
      this.terms = [new Term(new Variable(variable))];
    } else if (isInt(variable)) {
      this.constants = [new Fraction(variable, 1)];
      this.terms = [];
    } else if (variable instanceof Fraction) {
      this.constants = [variable];
      this.terms = [];
    } else if (variable instanceof Term) {
      this.terms = [variable];
    } else if (typeof variable === "undefined") {
      this.terms = [];
    } else {
      throw new TypeError(
        "Variable must be string, number, Fraction, or Term!",
      );
    }
  }

  constant() {
    return this.constants.reduce((p, c) => p.add(c), new Fraction(0, 1));
  }

  simplify() {
    const copy = this.copy();

    copy.terms = copy.terms.map((t) => t.simplify());

    copy.sort();
    copy.combineLikeTerms();
    copy.moveTermsWithDegreeZeroToConstants();
    copy.removeTermsWithCoefficientZero();

    copy.constants = copy.constant().valueOf() === 0 ? [] : [copy.constant()];

    return copy;
  }

  copy() {
    const copy = new Expression();

    copy.constants = this.constants.map((c) => c.copy());
    copy.terms = this.terms.map((term) => term.copy());

    return copy;
  }

  add(
    value: string | Term | number | Fraction | Expression,
    simplify = true,
  ): Expression {
    const thisExpression = this.copy();

    if (
      typeof value === "string" ||
      value instanceof Term ||
      isInt(value) ||
      value instanceof Fraction
    ) {
      const exp = new Expression(value);
      return thisExpression.add(exp, simplify);
    } else if (value instanceof Expression) {
      const keepTerms = value.copy().terms;

      thisExpression.terms = thisExpression.terms.concat(keepTerms);
      thisExpression.constants = thisExpression.constants.concat(
        value.constants,
      );
      thisExpression.sort();
    } else {
      throw new TypeError("Internal Error");
    }

    return simplify ? thisExpression.simplify() : thisExpression;
  }

  multiply(
    a: string | Term | number | Fraction | Expression,
    simplify = true,
  ): Expression {
    const thisExp = this.copy();

    if (
      typeof a === "string" ||
      a instanceof Term ||
      isInt(a) ||
      a instanceof Fraction
    ) {
      return thisExp.multiply(new Expression(a), simplify);
    } else if (a instanceof Expression) {
      const thatExp = a.copy();
      const newTerms = [];

      for (let i = 0; i < thisExp.terms.length; i++) {
        const thisTerm = thisExp.terms[i];

        for (let j = 0; j < thatExp.terms.length; j++) {
          const thatTerm = thatExp.terms[j];
          newTerms.push(thisTerm.multiply(thatTerm, simplify));
        }

        for (let j = 0; j < thatExp.constants.length; j++) {
          newTerms.push(thisTerm.multiply(thatExp.constants[j], simplify));
        }
      }

      for (var i = 0; i < thatExp.terms.length; i++) {
        const thatTerm = thatExp.terms[i];

        for (let j = 0; j < thisExp.constants.length; j++) {
          newTerms.push(thatTerm.multiply(thisExp.constants[j], simplify));
        }
      }

      const newConstants: Fraction[] = [];

      for (var i = 0; i < thisExp.constants.length; i++) {
        var thisConst = thisExp.constants[i];

        for (var j = 0; j < thatExp.constants.length; j++) {
          var thatConst = thatExp.constants[j];
          var t = new Term();
          t = t.multiply(thatConst, false);
          t = t.multiply(thisConst, false);
          newTerms.push(t);
        }
      }

      thisExp.constants = newConstants;
      thisExp.terms = newTerms;
      thisExp.sort();
    } else {
      throw new TypeError("Internal Error");
    }

    return simplify ? thisExp.simplify() : thisExp;
  }

  divide(value: Fraction | Expression | number, simplify = true) {
    if (value instanceof Fraction || isInt(value)) {
      if (value.valueOf() === 0) {
        throw new EvalError("Divide By Zero");
      }

      const copy = this.copy();

      for (let i = 0; i < copy.terms.length; i++) {
        const thisTerm = copy.terms[i];

        for (let j = 0; j < thisTerm.coefficients.length; j++) {
          thisTerm.coefficients[j] = thisTerm.coefficients[j].divide(
            value,
            simplify,
          );
        }
      }

      copy.constants = copy.constants.map((c) => c.divide(value, simplify));

      return copy;
    } else if (value instanceof Expression) {
      //Simplify both expressions
      let num = this.copy().simplify();
      const denom = value.copy().simplify();

      //Total amount of terms and constants
      const numTotal = num.terms.length + num.constants.length;
      const denomTotal = denom.terms.length + denom.constants.length;

      //Check if both terms are monomial
      if (numTotal === 1 && denomTotal === 1) {
        //Devide coefficients
        const [numCoef] = num.terms[0].coefficients;
        const [denomCoef] = denom.terms[0].coefficients;

        //The expressions have just been simplified - only one coefficient per term
        num.terms[0].coefficients[0] = numCoef.divide(denomCoef, simplify);
        denom.terms[0].coefficients[0] = new Fraction(1, 1);

        //Cancel variables
        for (let i = 0; i < num.terms[0].variables.length; i++) {
          const numVar = num.terms[0].variables[i];
          for (let j = 0; j < denom.terms[0].variables.length; j++) {
            const denomVar = denom.terms[0].variables[j];
            //Check for equal variables
            if (numVar.variable === denomVar.variable) {
              //Use the rule for division of powers
              num.terms[0].variables[i].degree = numVar.degree -
                denomVar.degree;
              denom.terms[0].variables[j].degree = 0;
            }
          }
        }

        //Invers all degrees of remaining variables
        for (let i = 0; i < denom.terms[0].variables.length; i++) {
          denom.terms[0].variables[i].degree *= -1;
        }

        //Multiply the inversed variables to the numenator
        num = num.multiply(denom, simplify);

        return num;
      } else {
        throw new TypeError(
          "Invalid Argument ((" +
            num.toString() +
            ")/(" +
            denom.toString() +
            ")): Only monomial expressions can be divided.",
        );
      }
    }

    throw new TypeError("Internal Error");
  }

  pow(value: number, simplify = true) {
    if (!isInt(value)) {
      throw new TypeError("Invalid Argument");
    }

    let copy = this.copy();

    if (value === 0) {
      return new Expression().add(1);
    }

    for (let i = 1; i < value; i++) {
      copy = copy.multiply(this, simplify);
    }

    copy.sort();

    return simplify ? copy.simplify() : copy;
  }

  eval(
    values: Record<string, Expression | Fraction | number>,
    simplify = true,
  ) {
    let exp = new Expression();

    exp.constants = simplify ? [this.constant()] : this.constants.slice();

    exp = this.terms.reduce(
      (p, c) => p.add(c.eval(values, simplify), simplify),
      exp,
    );

    return exp;
  }

  summation(variable: string, lower: number, upper: number, simplify = true) {
    const thisExpr = this.copy();

    let newExpr = new Expression();

    for (let i = lower; i < upper + 1; i++) {
      const sub: Record<string, number> = {};

      sub[variable] = i;

      newExpr = newExpr.add(thisExpr.eval(sub, simplify), simplify);
    }

    return newExpr;
  }

  toString(options = { implicit: true }) {
    let str = "";

    for (let i = 0; i < this.terms.length; i++) {
      const term = this.terms[i];

      str += (term.coefficients[0].valueOf() < 0 ? " - " : " + ") +
        term.toString(options);
    }

    for (let i = 0; i < this.constants.length; i++) {
      const constant = this.constants[i];

      str += (constant.valueOf() < 0 ? " - " : " + ") +
        constant.abs().toString();
    }

    if (str.substring(0, 3) === " - ") {
      return "-" + str.substring(3, str.length);
    } else if (str.substring(0, 3) === " + ") {
      return str.substring(3, str.length);
    }

    return "0";
  }

  toTex(dict = { multiplication: "cdt" }) {
    let str = "";

    for (let i = 0; i < this.terms.length; i++) {
      const term = this.terms[i];

      str += (term.coefficients[0].valueOf() < 0 ? " - " : " + ") +
        term.toTex(dict);
    }

    for (let i = 0; i < this.constants.length; i++) {
      const constant = this.constants[i];

      str += (constant.valueOf() < 0 ? " - " : " + ") + constant.abs().toTex();
    }

    if (str.substring(0, 3) === " - ") {
      return "-" + str.substring(3, str.length);
    } else if (str.substring(0, 3) === " + ") {
      return str.substring(3, str.length);
    }

    return "0";
  }

  subtract(a: Expression | string | Fraction | number | Term, simplify = true) {
    const negative = a instanceof Expression
      ? a.multiply(-1)
      : new Expression(a).multiply(-1);

    return this.add(negative, simplify);
  }

  private moveTermsWithDegreeZeroToConstants() {
    const keepTerms = [];
    let constant = new Fraction(0, 1);

    for (let i = 0; i < this.terms.length; i++) {
      const thisTerm = this.terms[i];

      if (thisTerm.variables.length === 0) {
        constant = constant.add(thisTerm.coefficient());
      } else {
        keepTerms.push(thisTerm);
      }
    }

    this.constants.push(constant);
    this.terms = keepTerms;

    return this;
  }

  private removeTermsWithCoefficientZero() {
    this.terms = this.terms.filter(
      (t) => t.coefficient().reduce().numerator !== 0,
    );

    return this;
  }

  private combineLikeTerms() {
    function alreadyEncountered(term: Term, encountered: Term[]) {
      for (const findedTerm of encountered) {
        if (term.canBeCombinedWith(findedTerm)) {
          return true;
        }
      }

      return false;
    }

    const newTerms = [];
    const encountered = [];

    for (let i = 0; i < this.terms.length; i++) {
      let thisTerm = this.terms[i];

      if (alreadyEncountered(thisTerm, encountered)) {
        continue;
      } else {
        for (let j = i + 1; j < this.terms.length; j++) {
          const thatTerm = this.terms[j];

          if (thisTerm.canBeCombinedWith(thatTerm)) {
            thisTerm = thisTerm.add(thatTerm);
          }
        }

        newTerms.push(thisTerm);
        encountered.push(thisTerm);
      }
    }

    this.terms = newTerms;

    return this;
  }

  private sort() {
    function sortTerms(a: Term, b: Term) {
      const x = a.maxDegree();
      const y = b.maxDegree();

      if (x === y) {
        const m = a.variables.length;
        const n = b.variables.length;

        return n - m;
      }

      return y - x;
    }

    this.terms = this.terms.sort(sortTerms);

    return this;
  }

  /**
   * @private
   */
  hasVariable(variable: string) {
    for (const term of this.terms) {
      if (term.hasVariable(variable)) {
        return true;
      }
    }

    return false;
  }

  /**
   * @private
   */
  onlyHasVariable(variable: string) {
    for (const term of this.terms) {
      if (term.onlyHasVariable(variable)) {
        return true;
      }
    }

    return false;
  }

  /**
   * @private
   */
  noCrossProdcutWithVariable(variable: string) {
    for (let i = 0; i < this.terms.length; i++) {
      const term = this.terms[i];

      if (term.hasVariable(variable) && !term.onlyHasVariable(variable)) {
        return false;
      }
    }

    return true;
  }

  /**
   * @private
   */
  noCrossProducts() {
    for (let i = 0; i < this.terms.length; i++) {
      const term = this.terms[i];

      if (term.variables.length > 1) {
        return false;
      }
    }

    return true;
  }
}

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

    var exp = copy.coefficients.reduce(
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
        } else if (isInt(sub)) {
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
