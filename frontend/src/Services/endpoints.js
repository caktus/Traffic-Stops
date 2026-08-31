import {
  AGENCY_DETAILS,
  STOPS,
  SEARCHES,
  STOPS_BY_REASON,
  SEARCHES_BY_TYPE,
  USE_OF_FORCE,
  CONTRABAND_HIT_RATE,
  LIKELIHOOD_OF_SEARCH,
  LIKELIHOOD_OF_STOP,
} from '../Hooks/useDataset';

const API_BASE = '/api';

export const STATE_FACTS_URL = `${API_BASE}/state-facts/`;

export const FIND_A_STOP_URL = `${API_BASE}/driver-stops/`;

export const CONTACT_FORM_URL = `${API_BASE}/about/contact/`;

export const RESOURCES_URL = `${API_BASE}/resources/`;

export const getAgenciesURL = () => `${API_BASE}/agency/`;

export const getAgencyURL = (agencyId) => `${API_BASE}/agency/${agencyId}/`;

export const getStopsURL = (agencyId) => `${API_BASE}/agency/${agencyId}/stops/`;

export const getSearchesURL = (agencyId) => `${API_BASE}/agency/${agencyId}/searches/`;

export const getStopsByReasonURL = (agencyId) => `${API_BASE}/agency/${agencyId}/stops_by_reason/`;

export const getUseOfForceURL = (agencyId) => `${API_BASE}/agency/${agencyId}/use_of_force/`;

export const getLikelihoodOfStopURL = (agencyId) =>
  `${API_BASE}/agency/${agencyId}/likelihood-of-stops/`;

export const getSearchesByTypeURL = (agencyId) =>
  `${API_BASE}/agency/${agencyId}/searches_by_type/`;

export const getContrabandHitrateURL = (agencyId) =>
  `${API_BASE}/agency/${agencyId}/contraband_hit_rate/`;

const DISPARITIES_BASE = `${API_BASE}/disparities`;

const withParams = (base, { year, race, limit } = {}) => {
  const params = new URLSearchParams();
  if (year) params.set('year', year);
  if (race) params.set('race', race);
  if (limit) params.set('limit', limit);
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
};

export const DISPARITY_YEARS_URL = `${DISPARITIES_BASE}/years/`;

export const getDisparityAgenciesURL = (opts) => withParams(`${DISPARITIES_BASE}/agencies/`, opts);

export const getDisparitySheriffsURL = (opts) => withParams(`${DISPARITIES_BASE}/sheriffs/`, opts);

export const getDisparityPoliceURL = (opts) => withParams(`${DISPARITIES_BASE}/police/`, opts);

export const getDisparityParityURL = (opts) => withParams(`${DISPARITIES_BASE}/parity/`, opts);

export const COUNTIES_GEOJSON_URL = '/counties.geojson';

export default function mapDatasetKeyToEndpoint(datasetKey) {
  switch (datasetKey) {
    case AGENCY_DETAILS: {
      return getAgencyURL;
    }
    case STOPS: {
      return getStopsURL;
    }
    case SEARCHES: {
      return getSearchesURL;
    }
    case STOPS_BY_REASON: {
      return getStopsByReasonURL;
    }
    case LIKELIHOOD_OF_SEARCH: {
      return getStopsByReasonURL;
    }
    case LIKELIHOOD_OF_STOP: {
      return getLikelihoodOfStopURL;
    }
    case SEARCHES_BY_TYPE: {
      return getSearchesByTypeURL;
    }
    case USE_OF_FORCE: {
      return getUseOfForceURL;
    }

    case CONTRABAND_HIT_RATE: {
      return getContrabandHitrateURL;
    }

    default:
      throw new Error(
        `Data set key "${datasetKey}" is not recognized. Have you registered it in useDataset.js?`
      );
  }
}
