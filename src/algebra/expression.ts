import { Fraction } from "../fraction.ts";
import { isInt } from "../_utils.ts";
import { Term } from "./term.ts";
import { Variable } from "./variable.ts";

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
