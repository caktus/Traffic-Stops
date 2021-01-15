export const RACES = ['asian', 'black', 'hispanic', 'native_american', 'other', 'white'];

export function roundToInt(num) {
  return num.toFixed();
}

export function getCensusPercentages(census_profile) {
  const { total, ...races } = census_profile;
  const racePercentages = {};
  for (let i = 0; i < RACES.length; i) {
    const race = RACES[i];
    const raceTotal = races[race];
    racePercentages[race] = roundToInt(raceTotal / total);
  }
  return racePercentages;
}
