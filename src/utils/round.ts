export function round(decimal: number, places = 2) {
  const pow = Math.pow(10, places);
  return Math.round(decimal * pow) / pow;
}
