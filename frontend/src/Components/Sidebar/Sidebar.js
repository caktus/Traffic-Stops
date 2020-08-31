import React from 'react';
import { SidebarStyled, SidebarNav, NavLinkStyled } from './Sidebar.styled';

// Routing
import { DATA_SLUG, STOPS_BY_REASON, SOME_OTHER_CHART } from 'Routes/slugs';

function Sidebar(props) {
  return (
    <SidebarStyled>
      <SidebarNav>
        <NavLinkStyled to={`${DATA_SLUG}${STOPS_BY_REASON}`}>Stops by Reason</NavLinkStyled>
        <NavLinkStyled to={`${DATA_SLUG}${SOME_OTHER_CHART}`}>Some other Chart</NavLinkStyled>
      </SidebarNav>
    </SidebarStyled>
  );
}

export default Sidebar;
