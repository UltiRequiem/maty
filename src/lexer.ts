import { isAlpha, isAlphaNum, isDigit } from "./_utils.ts";

export interface Token {
  type: "NUMBER" | "IDENTIFIER";
  value: string;
  pos: number;
}

export class Lexer {
  position = 0;
  content: string | undefined = undefined;
  contentLength = 0;

  optable = {
    "+": "PLUS",
    "-": "MINUS",
    "*": "MULTIPLY",
    "/": "DIVIDE",
    "^": "POWER",
    "(": "L_PAREN",
    ")": "R_PAREN",
    "=": "EQUALS",
  };

  input(content: string) {
    this.position = 0;
    this.content = content;
    this.contentLength = content.length;
  }

  token() {
    if (!this.content) {
      throw new Error("Content input is empty.");
    }

    this.snipTokens();

    if (this.position >= this.contentLength) {
      throw new Error("No more tokens.");
    }
    // The char at this.pos is part of a real token. Figure out which.
    const c = this.content.charAt(this.position) as keyof typeof this.optable;

    // Look it up in the table of operators
    const op = this.optable[c];

    if (op !== undefined) {
      if (op === "L_PAREN" || op === "R_PAREN") {
        return { type: "PAREN", value: op, pos: this.position++ };
      } else {
        return { type: "OPERATOR", value: op, pos: this.position++ };
      }
    } else {
      // Not an operator - so it's the beginning of another token.
      if (isAlpha(c)) {
        return this.processIdentifier();
      } else if (isDigit(c)) {
        return this.processNumber();
      } else {
        throw new SyntaxError(
          `Token error at character ${c} at position ${this.position}`,
        );
      }
    }
  }

  private processIdentifier() {
    let endpos = this.position + 1;

    if (!this.content) {
      throw new Error("No buffer to process from.");
    }

    while (
      endpos < this.contentLength &&
      isAlphaNum(this.content.charAt(endpos))
    ) {
      endpos++;
    }

    const tok: Token = {
      type: "IDENTIFIER",
      value: this.content.substring(this.position, endpos),
      pos: this.position,
    };

    this.position = endpos;

    return tok;
  }

  private processDigits(position: number) {
    var endpos = position;

    if (!this.content) {
      throw new Error("No buffer to process from.");
    }

    while (
      endpos < this.contentLength &&
      isDigit(this.content.charAt(endpos))
    ) {
      endpos++;
    }

    return endpos;
  }

  private processNumber() {
    if (!this.content) {
      throw new Error("No buffer to process from.");
    }

    // Read characters until a non-digit character appears
    let endpos = this.processDigits(this.position);

    // If it's a decimal point, continue to read digits
    if (this.content.charAt(endpos) === ".") {
      endpos = this.processDigits(endpos + 1);
    }

    // Check if the last read character is a decimal point.
    // If it is, ignore it and proceed
    if (this.content.charAt(endpos - 1) === ".") {
      throw new SyntaxError(
        `Decimal point without decimal digits at position ${endpos - 1}`,
      );
    }

    const tok: Token = {
      type: "NUMBER",
      value: this.content.substring(this.position, endpos),
      pos: this.position,
    };

    this.position = endpos;

    return tok;
  }

  private snipTokens() {
    if (!this.content) {
      throw new Error("No buffer to snip tokens from.");
    }

    while (this.position < this.contentLength) {
      const c = this.content.charAt(this.position);

      const special = c === " " || c === "\t" || c === "\r" || c === "\n";

      if (!special) {
        break;
      }

      this.position++;
    }
  }
}
