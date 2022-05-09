export function isAlpha(c: string) {
  return (c >= "a" && c <= "z") || (c >= "A" && c <= "Z");
}

export function isDigit(c: string) {
  return c >= "0" && c <= "9";
}

export function isAlphaNum(c: string) {
  return isAlpha(c) || isDigit(c);
}
