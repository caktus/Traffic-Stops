import styled from 'styled-components';
import { NavLink } from 'react-router-dom';

import Icon from 'img/icons/Icon';
import { smallerThanTabletLandscape } from 'styles/breakpoints';

export const Wrapper = styled.div`
  position: relative;
  margin: 8px 0;
`;

export const Chevron = styled(Icon)`
  position: absolute;
  right: 105%;
`;

export const SidebarLink = styled(NavLink)`
  font-family: ${(props) => props.theme.fonts.body};
  font-size: 18px;
  line-height: 32px;
  color: ${(props) => props.theme.colors.text};
  text-decoration: none;

  font-weight: ${(props) => (props.active ? 'bold' : 'normal')};
  color: ${(props) => (props.active ? props.theme.colors.primaryDark : props.theme.colors.text)};

  @media (${smallerThanTabletLandscape}) {
    margin-left: 1rem;
  }
`;
