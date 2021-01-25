import toTitleCase from 'util/toTitleCase';

export const RACES = ['white', 'black', 'hispanic', 'asian', 'native_american', 'other'];
export const YEARS_DEFAULT = 'All';
export const PURPOSE_DEFAULT = 'All';
export const SEARCH_TYPE_DEFAULT = 'All';
export const AVERAGE_KEY = 'Average for all drivers';

export const STATIC_LEGEND_KEYS = RACES.map((r) => ({
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
  let yearSum = 0;
  filteredKeys.forEach((ethnicGroup) => (yearSum += yearData[ethnicGroup]));
  return yearSum;
}

export function reduceYearsToTotal(data, ethnicGroup) {
  return data.reduce((acc, curr) => ({ [ethnicGroup]: acc[ethnicGroup] + curr[ethnicGroup] }));
}

export function filterSinglePurpose(data, purpose) {
  return data.filter((d) => d.purpose === purpose);
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
 * Given a list of yearly counts, return a list of all the reported stop reasons.
 * @param {Array} data
 * @param {string} key
 */
export function getAvailableReasons(data, key) {
  // data is a list of purpose <--> year mappings.
  // to get all available purpose types, we must select a single year,
  // map over all its instances and grab the "purpose" key.

  // grab the latest year, to catch any newly added stop reasons:
  const latestYear = data[data.length - 1].year;
  // pull all entries for latest year
  const latestSet = data.filter((d) => d.year === latestYear);
  // map over entries and create list of reasons
  return latestSet.map((s) => s[key]);
}

export function buildStackedBarData(data, filteredKeys, theme) {
  const mappedData = [];
  const yearTotals = {};
  data.forEach((row) => {
    yearTotals[row.year] = calculateYearTotal(row, filteredKeys);
  });

  filteredKeys.forEach((ethnicGroup) => {
    const groupSet = {};
    groupSet.id = toTitleCase(ethnicGroup);
    groupSet.color = theme.colors.ethnicGroup[ethnicGroup];
    groupSet.data = data.map((datum) => {
      return {
        x: datum.year,
        y: calculatePercentage(datum[ethnicGroup], yearTotals[datum.year]),
        ethnicGroup: toTitleCase(ethnicGroup),
      };
    });
    mappedData.push(groupSet);
  });
  return mappedData;
}

export function getSearchRateForYearByGroup(searches, stops, year, ethnicGroup, filteredKeys) {
  const searchesForYear = searches.find((s) => s.year === year);
  const stopsForYear = stops.find((s) => s.year === year);
  if (ethnicGroup === AVERAGE_KEY) {
    let totalSearches = 0;
    let totalStops = 0;
    filteredKeys.forEach((ethnicGroup) => {
      if (ethnicGroup === AVERAGE_KEY) return;
      totalSearches += searchesForYear[ethnicGroup];
      totalStops += stopsForYear[ethnicGroup];
    });
    return calculatePercentage(totalSearches, totalStops);
  } else {
    const searchesForGroup = searchesForYear ? searchesForYear[ethnicGroup] : 0;
    const stopsForGroup = stopsForYear ? stopsForYear[ethnicGroup] : 0;
    return calculatePercentage(searchesForGroup, stopsForGroup);
  }
}
