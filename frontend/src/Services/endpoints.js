const API_BASE = '/api';

export const getAgenciesURL = () => `${API_BASE}/agency/`;

export const getAgencyURL = (agencyId) => `${API_BASE}/agency/${agencyId}/`;

export const getStopsByReasonURL = (agencyId) => `${API_BASE}/agency/${agencyId}/stops_by_reason/`;
