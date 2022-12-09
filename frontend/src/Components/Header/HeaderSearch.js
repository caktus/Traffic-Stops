import React from 'react';
import ReactDOM from 'react-dom';
import { SearchWrapper } from './Header.styled';
import { AnimatePresence } from 'framer-motion';

import usePortal from '../../Hooks/usePortal';
import DepartmentSearch from '../Elements/DepartmentSearch';

function HeaderSearch(showHeaderSearch) {
  const portalTarget = usePortal('searchbar-root');

  return ReactDOM.createPortal(
    showHeaderSearch && (
      <AnimatePresence>
        <SearchWrapper
          initial={{ opacity: 0.35, y: -20, x: '-50%', duration: 750 }}
          animate={{ opacity: 1, y: 20, x: '-50%', duration: 750 }}
          exit={{ opacity: 0.35, y: -20, x: '-50%', duration: 750 }}
          transition={{ ease: 'easeIn' }}
        >
          <DepartmentSearch showIndexList navigateOnSelect invertIcon dropdownPosition="bottom" />
        </SearchWrapper>
      </AnimatePresence>
    ),
    portalTarget
  );
}

export default HeaderSearch;
