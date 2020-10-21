const API_BASE = '/api';

export const getAgencyURL = (agencyId) => `${API_BASE}/agency/${agencyId}/`;

export const getStopsURL = (agencyId) => `${API_BASE}/agency/${agencyId}/stops/`;

export const getStopsByReasonURL = (agencyId) => `${API_BASE}/agency/${agencyId}/stops_by_reason/`;

export const getSearchesByTypeURL = (agencyId) => `${API_BASE}/agency/${agencyId}/searches_by_type/`;
