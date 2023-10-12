import styled from 'styled-components';
import { motion } from 'framer-motion';
import { phoneOnly, smallerThanDesktop } from '../../../styles/breakpoints';

export const ChartPageBase = styled(motion.article)`
  flex: 1;
  height: 100%;
  overflow-y: hidden;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;

export const ChartPageContent = styled.div`
  padding: 1.5em 6em 3em 4em;
  overflow: hidden;

  @media (${smallerThanDesktop}) {
    padding: 2em 1em;
    overflow-y: visible;
  }

  @media (${phoneOnly}) {
    overflow-y: scroll;
    padding: 2em 1em;
    width: 100vw;
  }
`;
