import styled from 'styled-components';
import * as breakpoints from '../../styles/breakpoints';
import { motion } from 'framer-motion';

export const Header = styled.header`
  width: 100%;
  border-bottom: ${(props) => props.theme.borders.standard};
  border-bottom-color: ${(props) => props.theme.colors.border};
  background: ${(props) => props.theme.colors.primary};
  height: 80px;
  min-height: 5rem;
  max-height: 5rem;

  @media (${breakpoints.smallerThanTabletLandscape}) {
    min-height: 8.75rem;
    max-height: 8.75rem;
  }

  @media (${breakpoints.phoneOnly}) {
    min-height: 11.25rem;
    max-height: 11.25rem;
  }
`;

export const Logos = styled.div`
  display: flex;
  height: 100%;
  flex-direction: row;
  align-items: center;
  color: white;
  font-size: 20px;
  font-weight: bold;

  @media (${breakpoints.smallerThanTabletLandscape}) {
    height: auto;
  }
`;

export const HeaderNavWrapper = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 0 2em;

  @media (${breakpoints.smallerThanTabletLandscape}) {
    align-items: flex-start;
    margin-top: 1em;
    justify-content: space-around;
  }

  @media (${breakpoints.phoneOnly}) {
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
  }
`;

export const SearchWrapper = styled(motion.div)`
  position: absolute;
  left: 50%;
  z-index: 10;
  width: calc(250px + 5vw);

  @media (${breakpoints.smallerThanTabletLandscape}) {
    top: 65px;
  }
  @media (${breakpoints.phoneOnly}) {
    top: 95px;
  }
`;

export const SplashImage = styled.img`
  margin-left: 0.5em;
  height: 100%;
  width: auto;

  @media (${breakpoints.smallerThanTabletLandscape}) {
    display: none;
  }
`;
