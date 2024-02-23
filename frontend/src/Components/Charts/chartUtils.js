import toTitleCase from '../../util/toTitleCase';

export const RACES = ['white', 'black', 'hispanic', 'asian', 'native_american', 'other'];
export const SEARCH_TYPES = [
  'Consent',
  'Search Warrant',
  'Probable Cause',
  'Search Incident to Arrest',
  'Protective Frisk',
];
export const STOP_TYPES = [
  'Speed Limit Violation',
  'Stop Light/Sign Violation',
  'Driving While Impaired',
  'Safe Movement Violation',
  'Vehicle Equipment Violation',
  'Vehicle Regulatory Violation',
  'Seat Belt Violation',
  'Investigation',
  'Other Motor Vehicle Violation',
  'Checkpoint',
  'Average',
];
export const CONTRABAND_TYPES = ['drugs', 'alcohol', 'money', 'weapons', 'other'];
export const YEARS_DEFAULT = 'All';
export const PURPOSE_DEFAULT = 'All';
export const SEARCH_TYPE_DEFAULT = 'All';
export const CONTRABAND_DEFAULT = 'All';
export const AVERAGE_KEY = 'average';
export const AVERAGE = {
  value: AVERAGE_KEY,
  label: 'Average for all drivers',
  selected: true,
};

export const STATIC_LEGEND_KEYS = RACES.map((r) => ({
  value: r,
  label: toTitleCase(r),
  selected: true,
}));

export const STATIC_CONTRABAND_KEYS = CONTRABAND_TYPES.map((r) => ({
  value: r,
  label: toTitleCase(r),
  selected: true,
}));

export function roundToInt(num, dec) {
  return num.toFixed(dec);
}

export function calculatePercentage(part, total) {
  return total === 0 ? 0 : parseFloat(roundToInt((part / total) * 100, 1));
}

export function calculateYearTotal(yearData, filteredKeys = RACES) {
  if (!yearData) return 0;
  let yearSum = 0;
  filteredKeys.forEach((ethnicGroup) => {
    yearSum += yearData[ethnicGroup] ? yearData[ethnicGroup] : 0;
  });
  return yearSum;
}

export function reduceYearsToTotal(data, ethnicGroup) {
  if (data.length === 0) return { [ethnicGroup]: 0 };
  return data.reduce((acc, curr) => ({
    [ethnicGroup]: parseInt(acc[ethnicGroup], 10) + parseInt(curr[ethnicGroup], 10),
  }));
}

/**
 * Given an Array of objects with shape { year, asian, black, etc. }, reduce to percentages of total by race.
 * provide Theme object to provide fill colors.
 * @param {Array} data
 * @param {Array} ethnicGroups
 * @param {Object} theme
 */
export function reduceFullDataset(data, ethnicGroups, theme) {
  const totals = {};
  ethnicGroups.forEach((race) => {
    totals[race] = reduceYearsToTotal(data, race)[race];
  });

  const total = calculateYearTotal(totals, ethnicGroups);

  return ethnicGroups.map((race) => ({
    x: toTitleCase(race),
    y: calculatePercentage(totals[race], total),
    color: theme.colors.ethnicGroup[race],
    fontColor: theme.colors.fontColorsByEthnicGroup[race],
  }));
}

/**
 * Given an Array of objects with shape { year, asian, black, etc. }, reduce to total by race.
 * provide Theme object to provide fill colors.
 * @param {Array} data
 * @param {Array} ethnicGroups
 */
export function reduceFullDatasetOnlyTotals(data, ethnicGroups) {
  const totals = {};
  ethnicGroups.forEach((race) => {
    totals[race] = reduceYearsToTotal(data, race)[race];
  });

  return totals;
}
export const reduceEthnicityByYears = (data, yearsSet, ethnicGroups = RACES) => {
  const yearData = [];
  yearsSet.forEach((yr) => {
    const yrData = {};
    yrData.year = yr;
    const yrSet = data.filter((d) => d.year === yr);
    if (yrSet.length > 0) {
      ethnicGroups.forEach((e) => {
        yrData[e] = yrSet.reduce((acc, curr) => ({
          [e]: acc[e] + curr[e],
        }))[e];
      });
      yrData['total'] = calculateYearTotal(yrData);
    } else {
      yrData['no_data'] = true;
      ethnicGroups.forEach((e) => {
        yrData[e] = 0;
      });
      yrData['total'] = 0;
    }
    yearData.push(yrData);
  });
  return yearData;
};
