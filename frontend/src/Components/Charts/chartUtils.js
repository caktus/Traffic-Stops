import toTitleCase from 'util/toTitleCase';

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
];
export const YEARS_DEFAULT = 'All';
export const PURPOSE_DEFAULT = 'All';
export const SEARCH_TYPE_DEFAULT = 'All';
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

export function roundToInt(num, dec) {
  return num.toFixed(dec);
}

export function calculatePercentage(part, total) {
  return total === 0 ? 0 : parseFloat(roundToInt((part / total) * 100, 1));
}

export function calculateYearTotal(yearData, filteredKeys = RACES) {
  if (!yearData) return 0;
  let yearSum = 0;
  filteredKeys.forEach(
    (ethnicGroup) => (yearSum += yearData[ethnicGroup] ? yearData[ethnicGroup] : 0)
  );
  return yearSum;
}

export function reduceYearsToTotal(data, ethnicGroup) {
  if (data.length === 0) return { [ethnicGroup]: 0 };
  return data.reduce((acc, curr) => ({ [ethnicGroup]: acc[ethnicGroup] + curr[ethnicGroup] }));
}

export function filterSinglePurpose(data, purpose) {
  return data.filter((d) => d.purpose === purpose);
}

export const filterDataBySearchType = (data, searchTypeFilter) => {
  if (searchTypeFilter === SEARCH_TYPE_DEFAULT) return data;
  else return data.filter((d) => d.search_type === searchTypeFilter);
};

export const getQuantityForYear = (data, year, ethnicGroup) => {
  return data.find((d) => d.year === year)[ethnicGroup];
};

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
  // Officers often have no results for a year.
  if (!searchesForYear || !stopsForYear) return 0;
  if (ethnicGroup === AVERAGE_KEY) {
    let totalSearches = 0;
    let totalStops = 0;
    filteredKeys.forEach((eg) => {
      const g = eg.value;
      if (g === AVERAGE_KEY) return;
      totalSearches += searchesForYear[g];
      totalStops += stopsForYear[g];
    });
    return calculatePercentage(totalSearches, totalStops);
  } else {
    const searchesForGroup = searchesForYear ? searchesForYear[ethnicGroup] : 0;
    const stopsForGroup = stopsForYear ? stopsForYear[ethnicGroup] : 0;
    return calculatePercentage(searchesForGroup, stopsForGroup);
  }
}

export const reduceStopReasonsByEthnicity = (data, yearsSet, ethnicGroup, searchTypeFilter) => {
  return yearsSet.map((year) => {
    const tick = {};
    tick.x = year;
    tick.symbol = 'circle';
    tick.displayName = toTitleCase(ethnicGroup);
    if (searchTypeFilter === SEARCH_TYPE_DEFAULT) {
      const yrSet = data.filter((d) => d.year === year);
      // No searches this year
      if (yrSet.length === 0) tick.y = 0;
      else {
        const stopTotal = yrSet.reduce((acc, curr) => {
          return { [ethnicGroup]: acc[ethnicGroup] + curr[ethnicGroup] };
        })[ethnicGroup];
        tick.y = stopTotal;
      }
    } else {
      const yearData = data.find((d) => d.year === year);
      tick.y = yearData ? yearData[ethnicGroup] : 0;
    }
    return tick;
  });
};

export const getGroupValueBasedOnYear = (data, group, yr, keys) => {
  const groupedData = {};
  keys.forEach((k) => {
    const rGroup = filterSinglePurpose(data, k);
    if (yr === YEARS_DEFAULT) {
      groupedData[k] = reduceYearsToTotal(rGroup, group)[group];
    } else {
      const dataForYear = rGroup.find((g) => g.year === yr);
      groupedData[k] = dataForYear ? dataForYear[group] : 0;
    }
  });
  return groupedData;
};

export const getRatesAgainstBase = (baseSearches, baseStops, groupSearches, groupStops) => {
  const rData = {};
  for (const r in baseSearches) {
    if (Object.hasOwnProperty.call(baseSearches, r)) {
      const baseRate = calculatePercentage(baseSearches[r], baseStops[r]);
      const groupRate = calculatePercentage(groupSearches[r], groupStops[r]);
      const rDiff = baseRate === 0 ? 0 : (groupRate - baseRate) / baseRate;
      rData[r] = parseFloat((rDiff * 100).toFixed());
    }
  }
  return rData;
};
