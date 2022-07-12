import styled from 'styled-components';
import { phoneOnly, smallerThanTabletLandscape } from '../../styles/breakpoints';
import { motion } from 'framer-motion';

export const Sidebar = styled(motion.div)`
  display: flex;
  flex-direction: column;
  background: ${(props) => props.theme.colors.greySemi};

  width: 204px;
  height: 100%;

  overflow-x: hidden;
  overflow-y: scroll;

  margin-top: 2px;
  padding: 2em 0 0 2em;

  @media (${smallerThanTabletLandscape}) {
    width: 100%;
    border-right: none;
    border-bottom: ${(props) => props.theme.elementBorder};

    overflow-x: scroll;
    overflow-y: hidden;

    padding: 1em;
  }

  @media (${phoneOnly}) {
    padding: 0;
  }
`;

export const Heading = styled.p`
  text-transform: uppercase;
  font-family: ${(props) => props.theme.fonts.heading};
  font-size: 16px;
  margin-bottom: 1em;

  @media (${smallerThanTabletLandscape}) {
    display: none;
  }
`;

export const SidebarNav = styled.ul`
  flex: 1;
  display: flex;
  flex-direction: column;
  @media (${smallerThanTabletLandscape}) {
    flex-direction: row;
    justify-content: space-around;
    align-items: center;
  }
  @media (${phoneOnly}) {
    justify-content: flex-start;
  }
`;
