import React from 'react';
import { SidebarStyled, SidebarNav, NavLinkStyled } from './Sidebar.styled';

// Routing
import { STOPS_BY_REASON_SLUG } from 'Routes/slugs';
import { useRouteMatch } from 'react-router-dom';

function Sidebar(props) {
  const match = useRouteMatch();
  return (
    <SidebarStyled data-testid="Sidebar">
      <SidebarNav>
        <NavLinkStyled
          data-testid="StopsByReasonNavLink"
          to={`${match.url}${STOPS_BY_REASON_SLUG}`}
        >
          Stops by Reason
        </NavLinkStyled>
      </SidebarNav>
    </SidebarStyled>
  );
}

export default Sidebar;
