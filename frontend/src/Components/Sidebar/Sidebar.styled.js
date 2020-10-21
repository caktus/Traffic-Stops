import styled from 'styled-components';
import { smallerThanTabletLandscape } from 'styles/breakpoints';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';

export const SidebarStyled = styled(motion.div)`
  display: flex;
  background: ${(props) => props.theme.colorPrimaryDark};
  color: ${(props) => props.theme.colorWhite};

  border-right: ${(props) => props.theme.elementBorder} ${props => props.theme.colorBlack};
  width: 125px;
  height: 100%;

  overflow-x: hidden;
  overflow-y: scroll;

  @media (${smallerThanTabletLandscape}) {
    width: 100%;
    height: 100px;
    border-right: none;
    border-bottom: ${(props) => props.theme.elementBorder};

    overflow-x: scroll;
    overflow-y: hidden;
  }
`;

export const SidebarNav = styled.ul`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem 0.5rem;
  @media (${smallerThanTabletLandscape}) {
    flex-direction: row;
  }
`;

export const NavLinkStyled = styled(NavLink)`
  margin: 1rem 0;
  text-decoration: none;
  text-align: center;
  color: ${(props) => props.theme.colorWhite};
  font-weight: bold;

  &.active {
    color: ${(props) => props.theme.colorSecondary};
  }

  @media (${smallerThanTabletLandscape}) {
    margin-left: 1rem;
  }
`;
