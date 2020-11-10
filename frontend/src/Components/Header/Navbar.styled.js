import styled from 'styled-components';
import { NavLink } from 'react-router-dom';

export const NavbarStyled = styled.nav`
  display: flex;
  flex-direction: row;
`;

export const Navlink = styled(NavLink)`
  color: ${(props) => props.theme.colorWhite};
  list-style: none;
  margin: 0 1rem;

  &.active {
    color: ${(props) => props.theme.colorSecondary};
  }
`;
