import React from 'react';
import * as S from './Sidebar.styled';

// Routing
import * as slugs from 'Routes/slugs';
import { useRouteMatch } from 'react-router-dom';

// Children
import SidebarLink from './SidebarLink';

function Sidebar() {
  const match = useRouteMatch();
  return (
    <S.Sidebar data-testid="Sidebar">
      <S.Heading>Department Data</S.Heading>
      <S.SidebarNav>
        <SidebarLink data-testid="OverviewNavLink" to={`${match.url}${slugs.OVERVIEW_SLUG}`}>
          Overview
        </SidebarLink>
        <SidebarLink
          data-testid="TrafficStopsNavLink"
          to={`${match.url}${slugs.TRAFFIC_STOPS_SLUG}`}
        >
          Traffic Stops
        </SidebarLink>
        <SidebarLink data-testid="SearchesNavLink" to={`${match.url}${slugs.SEARCHES_SLUG}`}>
          Searches
        </SidebarLink>
        <SidebarLink data-testid="SearchRateNavLink" to={`${match.url}${slugs.SEARCH_RATE_SLUG}`}>
          Search Rate
        </SidebarLink>
        <SidebarLink data-testid="ContrabandNavLink" to={`${match.url}${slugs.CONTRABAND_SLUG}`}>
          Contraband
        </SidebarLink>
        <SidebarLink data-testid="UseOfForceNavLink" to={`${match.url}${slugs.USE_OF_FORCE_SLUG}`}>
          Use of Force
        </SidebarLink>
      </S.SidebarNav>
    </S.Sidebar>
  );
}

export default Sidebar;
