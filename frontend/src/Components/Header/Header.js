import React from 'react';
import { HeaderStyled, LogosStyled } from './Header.styled';

// Components
import LogoFull from 'Components/Elements/LogoFull';
import Navbar from './Navbar';

function Header(props) {
  return (
    <HeaderStyled data-testid="Header">
      <LogosStyled>
        <LogoFull />
        <p>Traffic Stops</p>
      </LogosStyled>
      <Navbar />
    </HeaderStyled>
  );
}

export default Header;
