import React from 'react';
import { SidebarStyled, SidebarNav, NavLinkStyled } from './Sidebar.styled';

// Routing
import { STOPS_BY_REASON } from 'Routes/slugs';
import { useRouteMatch } from 'react-router-dom';

function Sidebar(props) {
  const match = useRouteMatch();
  return (
    <SidebarStyled>
      <SidebarNav>
        <NavLinkStyled to={`${match.url}${STOPS_BY_REASON}`}>Stops by Reason</NavLinkStyled>
      </SidebarNav>
    </SidebarStyled>
  );
}

export default Sidebar;
