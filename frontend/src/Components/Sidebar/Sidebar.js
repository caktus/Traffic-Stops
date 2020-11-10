import React from 'react';
import { SidebarStyled, SidebarNav, NavLinkStyled } from './Sidebar.styled';

// Routing
import * as slugs from 'Routes/slugs';
import { useRouteMatch } from 'react-router-dom';

function Sidebar(props) {
  const match = useRouteMatch();
  return (
    <SidebarStyled data-testid="Sidebar">
      <SidebarNav>
        <NavLinkStyled data-testid="CensusDataNavLink" to={`${match.url}${slugs.CENSUS_DATA_SLUG}`}>
          Census Data
        </NavLinkStyled>
        <NavLinkStyled
          data-testid="StopsByReasonNavLink"
          to={`${match.url}${slugs.STOPS_BY_REASON_SLUG}`}
        >
          Stops by Reason
        </NavLinkStyled>
        <NavLinkStyled
          data-testid="StopsByEthnicCompositionNavLink"
          to={`${match.url}${slugs.STOPS_BY_ETHNIC_COMPOSITION_SLUG}`}
        >
          Stops by Ethnic Composition
        </NavLinkStyled>
        <NavLinkStyled
          data-testid="DepartmentalStopCount"
          to={`${match.url}${slugs.DEPARTMENTAL_STOP_COUNT_SLUG}`}
        >
          Departmental Stop Count
        </NavLinkStyled>
        <NavLinkStyled
          data-testid="DepartmentalSearchCount"
          to={`${match.url}${slugs.DEPARTMENTAL_SEARCH_COUNT_SLUG}`}
        >
          Departmental Search Count
        </NavLinkStyled>
        <NavLinkStyled
          data-testid="DepartmentalSearchRate"
          to={`${match.url}${slugs.DEPARTMENTAL_SEARCH_RATE_SLUG}`}
        >
          Departmental Search Rate
        </NavLinkStyled>
        <NavLinkStyled data-testid="UseOfForce" to={`${match.url}${slugs.USE_OF_FORCE_SLUG}`}>
          Use of Force
        </NavLinkStyled>
        <NavLinkStyled
          data-testid="ContrabandHitrate"
          to={`${match.url}${slugs.CONTRABAND_HITRATE_SLUG}`}
        >
          Contraband Hit-rate
        </NavLinkStyled>
      </SidebarNav>
    </SidebarStyled>
  );
}

export default Sidebar;
