// Shared constants for the Agency-Level Stop Disparities dashboard.

import { AGENCY_LIST_SLUG, SEARCH_RATE_SLUG } from '../../Routes/slugs';

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

// Distinct colors for county choropleth layers that are not colored by ratio.
export const BELOW_THRESHOLD_COLOR = '#8e6fb0';
export const NO_DATA_COLOR = '#cccccc';

// Human-readable labels for the AgencyLikelihoodStatus values returned by the API.
export const STATUS_LABELS = {
  active: 'Active',
  small_population: 'Population too small (< 10,000)',
  small_race_population: 'Race population too small (≤ 100)',
};

// Null-tolerant cell formatters for the collapsible data tables (null → em dash).
const EM_DASH = '—';
const isBlank = (v) => v === null || v === undefined || Number.isNaN(v);

export const fmt = {
  ratio: (v) => (isBlank(v) ? EM_DASH : Number(v).toFixed(2)),
  times: (v) => (isBlank(v) ? EM_DASH : `${Number(v).toFixed(2)}×`),
  pct: (v) => (isBlank(v) ? EM_DASH : `${(Number(v) * 100).toFixed(1)}%`),
  int: (v) => (isBlank(v) ? EM_DASH : Math.round(Number(v)).toLocaleString()),
};

// Reference-line colors on the bar chart; the section copy names these colors.
export const PARITY_LINE_COLOR = '#f1c40f';
export const STATEWIDE_LINE_COLOR = '#e74c3c';

// Section descriptions shown above each disparity view.
export const BAR_CHART_COPY =
  'This chart shows the agencies where drivers of the selected racial group are most likely to be stopped compared with white drivers. Each bar represents an agency, and the length of the bar shows how many times as likely the selected racial group is to be stopped than white drivers. The yellow dotted line at 1.0× represents parity, meaning the selected racial group and white drivers are stopped at the same rate. The red dotted line represents the statewide average Stop Rate Ratio for North Carolina, providing a benchmark for how the agency compares with the state overall. Bars farther to the right show larger disparities in traffic stops.';

export const SHERIFF_MAP_COPY =
  "This map shows racial disparities in traffic stops by North Carolina sheriff's office. Darker colors show that drivers of the selected racial group are more likely to be stopped than white drivers, while lighter colors indicate smaller disparities and more similar stop rates between the two groups. A ratio of 1.0× means the selected racial group and white drivers are stopped at the same rate. Because North Carolina sheriff's offices generally have countywide jurisdictions, county boundaries provide a useful way to visualize differences between sheriff's offices across the state.";

export const POLICE_MAP_COPY =
  'This map shows racial disparities in traffic stops by North Carolina police department. Darker colors indicate that drivers of the selected racial group are more likely to be stopped than white drivers, while lighter colors indicate smaller disparities and more similar stop rates between the two groups. A ratio of 1.0× means the selected racial group and white drivers are stopped at the same rate. Each bubble represents an individual police department, with larger bubbles representing agencies with more total traffic stops. Because multiple police departments may operate within the same county, individual bubbles allow users to compare differences between police departments across the state.';

// Link a table row's agency to its likelihood-of-stop (search rate) page.
export const agencySearchRateLink = (row) =>
  `${AGENCY_LIST_SLUG}/${row.group_id}${SEARCH_RATE_SLUG}`;

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
