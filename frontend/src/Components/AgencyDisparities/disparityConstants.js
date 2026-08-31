// Shared constants for the Agency-Level Stop Disparities dashboard.

// Race options offered in the dashboard dropdown (White is the baseline and is
// therefore not selectable; it is still shown on the parity scatter).
export const RACE_OPTIONS = ['Black', 'Hispanic', 'Asian', 'Native American', 'Other'];

export const DEFAULT_RACE = 'Black';

// "All available data" sentinel used for the Year dropdown.
export const ALL_YEARS = 'All';

// Disparity color categories keyed on times_likely, mirroring the notebook and
// the backend `disparity_category` helper.
export const DISPARITY_COLORS = {
  '≤ 1.0 (Equity)': '#2ecc71',
  '1.0 - 2.0': '#f1c40f',
  '2.0 - 3.0': '#e67e22',
  '≥ 3.0 (Severe)': '#e74c3c',
};

export const DISPARITY_CATEGORY_ORDER = Object.keys(DISPARITY_COLORS);

// Distinct colors for county choropleth layers that are not colored by ratio.
export const BELOW_THRESHOLD_COLOR = '#8e6fb0';
export const NO_DATA_COLOR = '#cccccc';

// Map an API race label to a theme ethnicGroup color.
export function raceColor(theme, race) {
  const key = {
    Black: 'black',
    White: 'white',
    Hispanic: 'hispanic',
    Asian: 'asian',
    'Native American': 'native_american',
    Other: 'other',
  }[race];
  return theme.colors.ethnicGroup[key] || theme.colors.ethnicGroup.black;
}
