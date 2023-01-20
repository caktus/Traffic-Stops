import React from 'react';
import { NavbarStyled, Navlink } from './Navbar.styled';

import { ABOUT_SLUG, FIND_A_STOP_SLUG, RESOURCES_SLUG } from '../../Routes/slugs';

function Navbar() {
  return (
    <NavbarStyled>
      <Navlink exact to={RESOURCES_SLUG}>
        Resources
      </Navlink>
      <Navlink to={FIND_A_STOP_SLUG}>Find a Stop</Navlink>
      <Navlink exact to={ABOUT_SLUG}>
        About
      </Navlink>
    </NavbarStyled>
  );
}

export default Navbar;
