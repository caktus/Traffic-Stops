import styled from 'styled-components';
import { motion } from 'framer-motion';
import { phoneOnly, smallerThanDesktop } from '../../../styles/breakpoints';

export const ChartPageBase = styled(motion.article)`
  flex: 1;
  height: 100%;
  overflow: hidden;
  width: 100%;
`;

export const ChartPageContent = styled.div`
  margin: 0 auto;
  padding: 1.5em 6em 3em 4em;
  overflow: hidden;

  @media (${smallerThanDesktop}) {
    overflow-y: visible;
  }

  @media (${phoneOnly}) {
    overflow-y: scroll;
    padding: 2em 1em;
    width: 100vw;
  }
`;
