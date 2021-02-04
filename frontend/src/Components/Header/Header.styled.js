import styled from 'styled-components';
import * as breakpoints from 'styles/breakpoints';
import { motion } from 'framer-motion';

export const Header = styled.header`
  position: relative;
  width: 100%;
  border-bottom: ${(props) => props.theme.borders.standard};
  border-bottom-color: ${(props) => props.theme.colors.border};
  background: ${(props) => props.theme.colors.primary};
  height: 80px;

  @media (${breakpoints.smallerThanTabletLandscape}) {
    height: 140px;
  }

  @media (${breakpoints.phoneOnly}) {
    height: 180px;
  }
`;

export const Logos = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  color: white;
  font-size: 20px;
  font-weight: bold;
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
