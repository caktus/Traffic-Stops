import React from 'react';
import { NavbarStyled, Navlink } from './Navbar.styled';

import { ABOUT_SLUG, AGENCY_SEARCH_SLUG } from 'Routes/slugs';

function Navbar(props) {
  return (
    <NavbarStyled>
      <Navlink exact to={ABOUT_SLUG}>
        About
      </Navlink>

      <Navlink to={AGENCY_SEARCH_SLUG}>Search Agencies</Navlink>

      <Navlink exact to={ABOUT_SLUG}>
        More things
      </Navlink>
    </NavbarStyled>
  );
}

export default Navbar;