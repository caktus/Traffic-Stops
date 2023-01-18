import React from 'react';
import * as S from './Sidebar.styled';

// Routing
import * as slugs from '../../Routes/slugs';
import { useRouteMatch } from 'react-router-dom';

// Hooks
import useOfficerId from '../../Hooks/useOfficerId';

// Children
import SidebarLink from './SidebarLink';

function Sidebar(props) {
  const match = useRouteMatch();
  const officerId = useOfficerId();

  const buildUrl = (slug) => {
    let url = `${match.url}${slug}`;
    url = url.replace('//', '/');
    if (officerId) url += `/?officer=${officerId}`;
    return url;
  };

  return (
    <S.Sidebar data-testid="Sidebar" showCompare={props.showCompare}>
      <S.Heading showCompare={props.showCompare}>
        {officerId !== null ? 'Officer' : 'Department'} Data
      </S.Heading>
      <S.SidebarNav showCompare={props.showCompare}>
        <SidebarLink
          data-testid="OverviewNavLink"
          to={buildUrl(slugs.OVERVIEW_SLUG)}
          showCompare={props.showCompare}
        >
          Overview
        </SidebarLink>
        <SidebarLink
          data-testid="TrafficStopsNavLink"
          to={buildUrl(slugs.TRAFFIC_STOPS_SLUG)}
          showCompare={props.showCompare}
        >
          Traffic Stops
        </SidebarLink>
        <SidebarLink
          data-testid="SearchesNavLink"
          to={buildUrl(slugs.SEARCHES_SLUG)}
          showCompare={props.showCompare}
        >
          Searches
        </SidebarLink>
        <SidebarLink
          data-testid="SearchRateNavLink"
          to={buildUrl(slugs.SEARCH_RATE_SLUG)}
          showCompare={props.showCompare}
        >
          Search Rate
        </SidebarLink>
        <SidebarLink
          data-testid="ContrabandNavLink"
          to={buildUrl(slugs.CONTRABAND_SLUG)}
          showCompare={props.showCompare}
        >
          Contraband
        </SidebarLink>
        <SidebarLink
          data-testid="UseOfForceNavLink"
          to={buildUrl(slugs.USE_OF_FORCE_SLUG)}
          showCompare={props.showCompare}
        >
          Use of Force
        </SidebarLink>
      </S.SidebarNav>
    </S.Sidebar>
  );
}

export default Sidebar;
