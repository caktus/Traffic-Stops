export const RACES = ['white', 'black', 'hispanic', 'asian', 'native_american', 'other'];

export function roundToInt(num, dec) {
  return num.toFixed(dec);
}

export function getCensusPercentage(raceCount, total) {
  return roundToInt((raceCount / total) * 100, 1);
}
