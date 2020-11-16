import React from 'react';
import { NavbarStyled, Navlink } from './Navbar.styled';

import { ABOUT_SLUG, FIND_A_STOP_SLUG, AGENCY_LIST_SLUG } from 'Routes/slugs';

function Navbar() {
  return (
    <NavbarStyled>
      <Navlink to={FIND_A_STOP_SLUG}>Find a Stop</Navlink>
      <Navlink exact to={ABOUT_SLUG}>
        About
      </Navlink>
      <Navlink to={AGENCY_LIST_SLUG}>[temp]list agencies</Navlink>
    </NavbarStyled>
  );
}

export default Navbar;
