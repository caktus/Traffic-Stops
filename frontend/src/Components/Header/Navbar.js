import React from 'react';
import { NavbarStyled, Navlink } from './Navbar.styled';

import { ABOUT_SLUG, DATA_SLUG } from 'Routes/slugs';

function Navbar(props) {
  return (
    <NavbarStyled>
      <Navlink exact to={ABOUT_SLUG}>
        About
      </Navlink>

      <Navlink to={DATA_SLUG}>Data</Navlink>

      <Navlink exact to="/">
        More things
      </Navlink>
    </NavbarStyled>
  );
}

export default Navbar;
