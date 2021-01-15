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
        <SidebarLink data-testid="CensusDataNavLink" to={`${match.url}${slugs.CENSUS_DATA_SLUG}`}>
          Census Data
        </SidebarLink>
        <SidebarLink
          data-testid="StopsByReasonNavLink"
          to={`${match.url}${slugs.STOPS_BY_REASON_SLUG}`}
        >
          Stops by Reason
        </SidebarLink>
        <SidebarLink
          data-testid="StopsByEthnicCompositionNavLink"
          to={`${match.url}${slugs.STOPS_BY_ETHNIC_COMPOSITION_SLUG}`}
        >
          Stops by Ethnic Composition
        </SidebarLink>
        <SidebarLink
          data-testid="DepartmentalStopCount"
          to={`${match.url}${slugs.DEPARTMENTAL_STOP_COUNT_SLUG}`}
        >
          Departmental Stop Count
        </SidebarLink>
        <SidebarLink
          data-testid="DepartmentalSearchCount"
          to={`${match.url}${slugs.DEPARTMENTAL_SEARCH_COUNT_SLUG}`}
        >
          Departmental Search Count
        </SidebarLink>
        <SidebarLink
          data-testid="DepartmentalSearchRate"
          to={`${match.url}${slugs.DEPARTMENTAL_SEARCH_RATE_SLUG}`}
        >
          Departmental Search Rate
        </SidebarLink>
        <SidebarLink data-testid="UseOfForce" to={`${match.url}${slugs.USE_OF_FORCE_SLUG}`}>
          Use of Force
        </SidebarLink>
        <SidebarLink
          data-testid="ContrabandHitrate"
          to={`${match.url}${slugs.CONTRABAND_HITRATE_SLUG}`}
        >
          Contraband Hit-rate
        </SidebarLink>
      </S.SidebarNav>
    </S.Sidebar>
  );
}

export default Sidebar;
