import React from 'react';
import { SidebarStyled, SidebarNav, NavLinkStyled } from './Sidebar.styled';

// Routing
import * as slugs from 'Routes/slugs';
import { useRouteMatch } from 'react-router-dom';

function Sidebar() {
  const match = useRouteMatch();
  return (
    <SidebarStyled data-testid="Sidebar">
      <SidebarNav>
        <NavLinkStyled
          data-testid="CensusDataNavLink"
          to={`${match.url}#${slugs.CENSUS_DATA_HASH}`}
        >
          Census Data
        </NavLinkStyled>
        <NavLinkStyled
          data-testid="StopsByReasonNavLink"
          to={`${match.url}#${slugs.STOPS_BY_REASON_HASH}`}
        >
          Stops by Reason
        </NavLinkStyled>
        <NavLinkStyled
          data-testid="StopsByEthnicCompositionNavLink"
          to={`${match.url}#${slugs.STOPS_BY_ETHNIC_COMPOSITION_HASH}`}
        >
          Stops by Ethnic Composition
        </NavLinkStyled>
        <NavLinkStyled
          data-testid="DepartmentalStopCount"
          to={`${match.url}#${slugs.DEPARTMENTAL_STOP_COUNT_HASH}`}
        >
          Departmental Stop Count
        </NavLinkStyled>
        <NavLinkStyled
          data-testid="DepartmentalSearchCount"
          to={`${match.url}#${slugs.DEPARTMENTAL_SEARCH_COUNT_HASH}`}
        >
          Departmental Search Count
        </NavLinkStyled>
        <NavLinkStyled
          data-testid="DepartmentalSearchRate"
          to={`${match.url}#${slugs.DEPARTMENTAL_SEARCH_RATE_HASH}`}
        >
          Departmental Search Rate
        </NavLinkStyled>
        <NavLinkStyled data-testid="UseOfForce" to={`${match.url}#${slugs.USE_OF_FORCE_HASH}`}>
          Use of Force
        </NavLinkStyled>
        <NavLinkStyled
          data-testid="ContrabandHitrate"
          to={`${match.url}#${slugs.CONTRABAND_HITRATE_HASH}`}
        >
          Contraband Hit-rate
        </NavLinkStyled>
      </SidebarNav>
    </SidebarStyled>
  );
}

export default Sidebar;
