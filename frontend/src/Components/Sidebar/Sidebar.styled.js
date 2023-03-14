import styled from 'styled-components';
import { phoneOnly, smallerThanTabletLandscape } from '../../styles/breakpoints';
import { motion } from 'framer-motion';

export const Sidebar = styled(motion.div)`
  display: flex;
  flex-direction: column;
  background: ${(props) => props.theme.colors.greySemi};

  width: ${(props) => (props.showCompare ? '100%' : '204px')};
  height: 100%;

  overflow: hidden;

  margin-top: 2px;
  padding: ${(props) => (props.showCompare ? '0' : '2em 0 0 2em;')};

  @media (${smallerThanTabletLandscape}) {
    width: 100%;
    border-right: none;
    border-bottom: ${(props) => props.theme.elementBorder};

    overflow-x: auto;
    overflow-y: hidden;

    padding: 0 1em;
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
  ${(props) => (props.showCompare ? 'display: none;' : '')}

  @media (${smallerThanTabletLandscape}) {
    display: none;
  }
`;

export const SidebarNav = styled.ul`
  flex: 1;
  display: flex;
  flex-direction: ${(props) => (props.showCompare ? 'row' : 'column')};
  @media (${smallerThanTabletLandscape}) {
    flex-direction: row;
    justify-content: space-around;
    align-items: center;
  }
  @media (${phoneOnly}) {
    flex-direction: row;
    justify-content: start;
    align-items: center;
  }
  ${(props) =>
    props.showCompare ? 'align-items: center; justify-content: start !important;' : ''};
`;
