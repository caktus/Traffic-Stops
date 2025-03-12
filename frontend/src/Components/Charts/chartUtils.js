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
export const STOP_PURPOSE_GROUPS = ['Safety Violation', 'Regulatory and Equipment', 'Other'];

export const STOP_PURPOSE_TYPES = [
  'Speed Limit Violation',
  'Stop Light/Sign Violation',
  'Driving While Impaired',
  'Safe Movement Violation',
  'Vehicle Equipment Violation',
  'Vehicle Regulatory Violation',
  'Other Motor Vehicle Violation',
  'Seat Belt Violation',
  'Investigation',
  'Checkpoint',
];

export const STOP_TYPE_COLORS = [
  '#E60032',
  '#06D6A0',
  '#8352F4',
  '#FAE500',
  '#027979',
  '#E37C1C',
  '#4153F6',
  '#B40895',
  '#0D3B66',
];

export const DEMOGRAPHICS_COLORS = {
  white: '#1282A2',
  black: '#551DC3',
  hispanic: '#D24B76',
  asian: '#F9DC4E',
  nativeAmerican: '#24BC7D',
  other: '#999999',
};

export const CONTRANBAND_TYPE_COLORS = {
  alcohol: '#24BC7D',
  drugs: '#1282A2',
  money: '#D24B76',
  other: '#999999',
  weapons: '#551DC3',
};

export const STOP_PURPOSE_COLORS = {
  safteyViolation: '#FF8133',
  regulatoryEquipment: '#804EE4',
  other: '#999999',
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

export const RACE_TABLE_COLUMNS = [
  {
    Header: 'Year',
    accessor: 'year', // accessor is the "key" in the data
  },
  {
    Header: 'White*',
    accessor: 'white',
  },
  {
    Header: 'Black*',
    accessor: 'black',
  },
  {
    Header: 'Native American*',
    accessor: 'native_american',
  },
  {
    Header: 'Asian*',
    accessor: 'asian',
  },
  {
    Header: 'Other*',
    accessor: 'other',
  },
  {
    Header: 'Hispanic',
    accessor: 'hispanic',
  },
  {
    Header: 'Total',
    accessor: 'total',
  },
];

export const CONTRABAND_TYPES_TABLE_COLUMNS = [
  {
    Header: 'Year',
    accessor: 'year', // accessor is the "key" in the data
  },
  {
    Header: 'Alcohol*',
    accessor: 'alcohol',
  },
  {
    Header: 'Drugs*',
    accessor: 'drugs',
  },
  {
    Header: 'Money*',
    accessor: 'money',
  },
  {
    Header: 'Other*',
    accessor: 'other',
  },
  {
    Header: 'Weapons*',
    accessor: 'weapons',
  },
  {
    Header: 'Total',
    accessor: 'total',
  },
];

export const LIKELIHOOD_OF_STOP_TABLE_COLUMNS = [
  {
    Header: 'Driver Race',
    accessor: 'driver_race',
  },
  {
    Header: 'Population',
    accessor: 'population',
  },
  {
    Header: 'Population Total',
    accessor: 'population_total',
  },
  {
    Header: 'Population Percentage',
    accessor: 'population_percent',
  },
  {
    Header: 'Basline Rate',
    accessor: 'baseline_rate',
  },
  {
    Header: 'Stops',
    accessor: 'stops',
  },
  {
    Header: 'Stops Total',
    accessor: 'stops_total',
  },
  {
    Header: 'Stop Rate',
    accessor: 'stop_rate',
  },
  {
    Header: 'Stop Rate Ratio',
    accessor: 'stop_rate_ratio',
  },
];

export const STOP_REASON_TABLE_COLUMNS = [
  {
    Header: 'Year',
    accessor: 'year',
  },
  {
    Header: 'Stop-reason',
    accessor: 'purpose',
  },
  {
    Header: 'White*',
    accessor: 'white',
  },
  {
    Header: 'Black*',
    accessor: 'black',
  },
  {
    Header: 'Hispanic',
    accessor: 'hispanic',
  },
  {
    Header: 'Asian*',
    accessor: 'asian',
  },
  {
    Header: 'Native American*',
    accessor: 'native_american',
  },
  {
    Header: 'Other*',
    accessor: 'other',
  },
  {
    Header: 'Total',
    accessor: 'total',
  },
];
