import {
  AGENCY_DETAIL,
  STOPS,
  SEARCHES,
  STOPS_BY_REASON,
  SEARCHES_BY_TYPE,
  USE_OF_FORCE,
  CONTRABAND_HIT_RATE,
} from 'hooks/useDataset';

const API_BASE = '/api';

export const getAgencyURL = (agencyId) => `${API_BASE}/agency/${agencyId}/`;

export const getStopsURL = (agencyId) => `${API_BASE}/agency/${agencyId}/stops/`;

export const getSearchesURL = (agencyId) => `${API_BASE}/agency/${agencyId}/searches/`;

export const getStopsByReasonURL = (agencyId) => `${API_BASE}/agency/${agencyId}/stops_by_reason/`;

export const getUseOfForceURL = (agencyId) => `${API_BASE}/agency/${agencyId}/use_of_force/`;

export const getSearchesByTypeURL = (agencyId) =>
  `${API_BASE}/agency/${agencyId}/searches_by_type/`;

export const getContrabandHitrateURL = (agencyId) =>
  `${API_BASE}/agency/${agencyId}/contraband_hit_rate/`;

export default function mapDatasetKeyToEndpoint(datasetKey) {
  switch (datasetKey) {
    case AGENCY_DETAIL: {
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