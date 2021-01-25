import React from 'react';
import ReactDOM from 'react-dom';
import { SearchWrapper } from './Header.styled';
import { AnimatePresence } from 'framer-motion';

import usePortal from 'Hooks/usePortal';
import DepartmentSearch from 'Components/Elements/DepartmentSearch';

function HeaderSearch(showHeaderSearch) {
  const portalTarget = usePortal('searchbar-root');

  // const _handleDropdownOpen = (open) => {
  //   console.log('open tho? ', open);
  // };

  return ReactDOM.createPortal(
    showHeaderSearch && (
      <AnimatePresence>
        <SearchWrapper
          initial={{ opacity: 0.35, y: -20, x: '-50%', duration: 750 }}
          animate={{ opacity: 1, y: 20, x: '-50%', duration: 750 }}
          exit={{ opacity: 0.35, y: -20, x: '-50%', duration: 750 }}
          transition={{ ease: 'easeIn' }}
        >
          <DepartmentSearch showIndexList navigateOnSelect invertIcon />
        </SearchWrapper>
      </AnimatePresence>
    ),
    portalTarget
  );
}

export default HeaderSearch;
