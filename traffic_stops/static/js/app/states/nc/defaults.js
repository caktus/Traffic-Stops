// Traffic Stops global defaults
export default {
  start_year: null,     // start-year for reporting requirement
  end_year: new Date().getUTCFullYear(),       // end-date for latest dataset
  races: [
    'white',
    'black',
    'native_american',
    'asian',
    'other'
  ],
  census_ethnicities: [
    'hispanic',
    'non_hispanic'
  ],
  ethnicities: [
    'white',
    'black',
    'native_american',
    'asian',
    'other',
    'hispanic'
  ],
  pprint: d3.map({
    'white': 'White*',
    'black': 'Black*',
    'native_american': 'Native American*',
    'asian': 'Asian*',
    'other': 'Other*',
    'hispanic': 'Hispanic'
  }),
  colors: [
    "#8DD3C7", // seafoam
    "#D95F02", // burnt orange
    "#7570B3", // periwinkle
    "#E7298A", // fuscia af
    "#66A61E", // viridescent moss
    "#E6AB02", // goldenrod
  ],
  baseline_color: "grey",
  single_color: "#5C0808",
  purpose_order: d3.map({
    'Driving While Impaired': 0,
    'Safe Movement Violation': 1,
    'Vehicle Equipment Violation': 2,
    'Other Motor Vehicle Violation': 3,
    'Investigation': 4,
    'Stop Light/Sign Violation': 5,
    'Speed Limit Violation': 6,
    'Vehicle Regulatory Violation': 7,
    'Seat Belt Violation': 8,
    'Checkpoint': 9  // todo: use a list and indexOf instead of map
  }),
  search_type_order: d3.map({
    'Consent': 0,
    'Search Warrant': 1,
    'Probable Cause': 2,
    'Search Incident to Arrest': 3,
    'Protective Frisk': 4
  })
};
