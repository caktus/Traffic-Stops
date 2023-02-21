import styled from 'styled-components';
import * as breakpoints from '../../styles/breakpoints';
import { NavLink } from 'react-router-dom';

export const NavbarStyled = styled.nav`
  display: flex;
  flex-direction: row;
  margin-right: 1em;

  @media (${breakpoints.smallerThanTabletLandscape}) {
    margin-top: 1em;
  }
`;

export const Navlink = styled(NavLink)`
  color: ${(props) => props.theme.colors.white};
  font-weight: ${(props) => props.theme.fontWeights[2]};
  list-style: none;
  text-decoration: none;
  margin: 0 2em;

  @media (${breakpoints.phoneOnly}) {
    margin: 0 0.5em;
  }
`;
