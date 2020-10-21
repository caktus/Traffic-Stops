import React from 'react';
import { SidebarStyled, SidebarNav, NavLinkStyled } from './Sidebar.styled';

// Routing
import * as slugs  from 'Routes/slugs';
import { useRouteMatch } from 'react-router-dom';

function Sidebar(props) {
  const match = useRouteMatch();
  return (
    <SidebarStyled data-testid="Sidebar">
      <SidebarNav>
        <NavLinkStyled
        data-testid="CensusDataNavLink"
          to={`${match.url}${slugs.CENSUS_DATA_SLUG}`}
        >
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
      </SidebarNav>
    </SidebarStyled>
  );
}

export default Sidebar;
