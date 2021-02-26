import styled from 'styled-components';
import { motion } from 'framer-motion';
import { phoneOnly, smallerThanDesktop } from 'styles/breakpoints';

export const ChartPageBase = styled(motion.article)`
  flex: 1;
  overflow-y: scroll;
`;

export const ChartPageContent = styled.div`
  margin: 0 auto;
  padding: 3em 6em 3em 4em;

  @media (${smallerThanDesktop}) {
    overflow-y: visible;
  }

  @media (${phoneOnly}) {
    overflow-y: scroll;
    padding: 2em 1em;
    width: 100vw;
  }
`;
