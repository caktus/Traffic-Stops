import styled from 'styled-components';
import { smallerThanTabletLandscape } from 'styles/breakpoints';
import { motion } from 'framer-motion';

export const Sidebar = styled(motion.div)`
  display: flex;
  flex-direction: column;
  background: ${(props) => props.theme.colors.greySemi};

  width: 204px;
  height: 100%;

  overflow-x: hidden;
  overflow-y: scroll;

  padding: 2em 0 0 2em;

  @media (${smallerThanTabletLandscape}) {
    width: 100%;
    height: 100px;
    border-right: none;
    border-bottom: ${(props) => props.theme.elementBorder};

    overflow-x: scroll;
    overflow-y: hidden;
  }
`;

export const Heading = styled.p`
  text-transform: uppercase;
  font-family: ${(props) => props.theme.fonts.heading};
  font-size: 16px;
  margin-bottom: 1em;
`;

export const SidebarNav = styled.ul`
  flex: 1;
  display: flex;
  flex-direction: column;
  @media (${smallerThanTabletLandscape}) {
    flex-direction: row;
  }
`;
