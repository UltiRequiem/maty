export function gcd(x: number, y: number) {
  while (y) {
    const temp = x;
    x = y;
    y = temp % y;
  }

  return x;
}

export function lcm(x: number, y: number) {
  return (x * y) / gcd(x, y);
}

export function round(decimal: number, places = 2) {
  const pow = Math.pow(10, places);
  return Math.round(decimal * pow) / pow;
}

export const GREEK_LETTERS = [
  "alpha",
  "beta",
  "gamma",
  "Gamma",
  "delta",
  "Delta",
  "epsilon",
  "varepsilon",
  "zeta",
  "eta",
  "theta",
  "vartheta",
  "Theta",
  "iota",
  "kappa",
  "lambda",
  "Lambda",
  "mu",
  "nu",
  "xi",
  "Xi",
  "pi",
  "Pi",
  "rho",
  "varrho",
  "sigma",
  "Sigma",
  "tau",
  "upsilon",
  "Upsilon",
  "phi",
  "varphi",
  "Phi",
  "chi",
  "psi",
  "Psi",
  "omega",
  "Omega",
];
