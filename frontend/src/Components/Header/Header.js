import React, { useEffect } from 'react';
import { HeaderStyled, LogosStyled, HeaderNavWrapper, SearchWrapper } from './Header.styled';
import { AnimatePresence } from 'framer-motion';

// Routing
import { HOME_SLUG } from 'Routes/slugs';
import { useLocation } from 'react-router-dom';

// Context
import { useRootContext } from 'Context/root-context';

// Components
import LogoFull from 'Components/Elements/LogoFull';
import Navbar from './Navbar';

const SLUGS_WITHOUT_SEARCH = [HOME_SLUG];

function Header(props) {
  const { pathname } = useLocation();
  const { showHeaderSearch, setShowHeaderSearch } = useRootContext();

  useEffect(() => {
    if (SLUGS_WITHOUT_SEARCH.some((slug) => pathname === slug)) {
      setShowHeaderSearch(false);
    } else {
      setShowHeaderSearch(true);
    }
  }, [pathname]);

  return (
    <HeaderStyled data-testid="Header">
      <HeaderNavWrapper>
        <LogosStyled>
          <LogoFull />
        </LogosStyled>
        <Navbar />
      </HeaderNavWrapper>
      {showHeaderSearch && (
        <AnimatePresence>
          <SearchWrapper
            initial={{ opacity: 0.35, y: '-100%', x: '-50%', duration: 750 }}
            animate={{ opacity: 1, y: '-50%', x: '-50%', duration: 750 }}
            exit={{ opacity: 0.35, y: '-100%', x: '-50%', duration: 750 }}
            transition={{ ease: 'easeIn' }}
          >
            <h4>I am the search bar</h4>
          </SearchWrapper>
        </AnimatePresence>
      )}
    </HeaderStyled>
  );
}

export default Header;
