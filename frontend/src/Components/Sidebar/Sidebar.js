import React from 'react';
import * as S from './Sidebar.styled';

// Routing
import * as slugs from 'Routes/slugs';
import { useRouteMatch } from 'react-router-dom';

// Hooks
import useOfficerId from 'Hooks/useOfficerId';

// Children
import SidebarLink from './SidebarLink';

function Sidebar() {
  const match = useRouteMatch();
  const officerId = useOfficerId();

  const buildUrl = (slug) => {
    let url = `${match.url}${slug}`;
    url = url.replace('//', '/');
    if (officerId) url += `/?officer=${officerId}`;
    return url;
  };

  return (
    <S.Sidebar data-testid="Sidebar">
      <S.Heading>Department Data</S.Heading>
      <S.SidebarNav>
        <SidebarLink data-testid="OverviewNavLink" to={buildUrl(slugs.OVERVIEW_SLUG)}>
          Overview
        </SidebarLink>
        <SidebarLink data-testid="TrafficStopsNavLink" to={buildUrl(slugs.TRAFFIC_STOPS_SLUG)}>
          Traffic Stops
        </SidebarLink>
        <SidebarLink data-testid="SearchesNavLink" to={buildUrl(slugs.SEARCHES_SLUG)}>
          Searches
        </SidebarLink>
        <SidebarLink data-testid="SearchRateNavLink" to={buildUrl(slugs.SEARCH_RATE_SLUG)}>
          Search Rate
        </SidebarLink>
        <SidebarLink data-testid="ContrabandNavLink" to={buildUrl(slugs.CONTRABAND_SLUG)}>
          Contraband
        </SidebarLink>
        <SidebarLink data-testid="UseOfForceNavLink" to={buildUrl(slugs.USE_OF_FORCE_SLUG)}>
          Use of Force
        </SidebarLink>
      </S.SidebarNav>
    </S.Sidebar>
  );
}

export default Sidebar;
