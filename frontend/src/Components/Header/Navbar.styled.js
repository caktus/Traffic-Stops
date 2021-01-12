import styled from 'styled-components';
import { NavLink } from 'react-router-dom';

export const NavbarStyled = styled.nav`
  display: flex;
  flex-direction: row;
  margin-right: 1em;
`;

export const Navlink = styled(NavLink)`
  color: ${(props) => props.theme.colors.white};
  font-weight: ${(props) => props.theme.fontWeights[2]};
  list-style: none;
  text-decoration: none;
  margin: 0 2em;
`;
