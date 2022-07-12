import React, { useState, useEffect } from 'react';
import { useTheme } from 'styled-components';
import * as S from './SidebarLink.styled';

import { useLocation } from 'react-router-dom';
import { ICONS } from '../../img/icons/Icon';

function SidebarLink({ children, to, ...props }) {
  const theme = useTheme();
  const location = useLocation();
  const [active, setActive] = useState(false);

  useEffect(() => {
    const noQsTo = to.split('?')[0];
    const cleadedUpTo = noQsTo.replace('//', '/');
    setActive(location.pathname === cleadedUpTo);
  }, [location.pathname]);

  return (
    <S.Wrapper>
      {active && (
        <S.Chevron
          icon={ICONS.chevronRight}
          width={24}
          height={24}
          fill={theme.colors.primaryDark}
        />
      )}
      <S.SidebarLink {...props} to={to} active={active}>
        {children}
      </S.SidebarLink>
    </S.Wrapper>
  );
}

export default SidebarLink;
