export const RACES = ['asian', 'black', 'hispanic', 'native_american', 'other', 'white'];

export function roundToInt(num) {
  return num.toFixed();
}

export function getCensusPercentage(raceCount, total) {
  return roundToInt((raceCount / total) * 100);
}
