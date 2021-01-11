import React, { useEffect } from 'react';
import * as Styled from './Header.styled';

// Routing
import { HOME_SLUG } from 'Routes/slugs';
import { useLocation } from 'react-router-dom';

// Context
import { useRootContext } from 'Context/root-context';
import { SET_SHOW_SEARCH } from 'Context/root-reducer';

// Components
import LogoFull from 'Components/Elements/LogoFull';
import Navbar from 'Components/Header/Navbar';
import HeaderSearch from 'Components/Header/HeaderSearch';

const SLUGS_WITHOUT_SEARCH = [HOME_SLUG];

function Header(props) {
  const { pathname } = useLocation();
  const [{ showHeaderSearch }, dispatch] = useRootContext();

  useEffect(() => {
    if (SLUGS_WITHOUT_SEARCH.some((slug) => pathname === slug)) {
      dispatch({ type: SET_SHOW_SEARCH, payload: false });
    } else {
      dispatch({ type: SET_SHOW_SEARCH, payload: true });
    }
  }, [pathname]);

  return (
    <Styled.Header data-testid="Header">
      <Styled.HeaderNavWrapper>
        <Styled.Logos>
          <LogoFull />
        </Styled.Logos>
        <Navbar />
      </Styled.HeaderNavWrapper>
      <HeaderSearch showHeaderSearch={showHeaderSearch} />
    </Styled.Header>
  );
}

export default Header;
