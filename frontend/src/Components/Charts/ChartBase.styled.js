import styled from 'styled-components';
import { motion } from 'framer-motion';
import { smallerThanTabletLandscape } from 'styles/breakpoints';

export const ChartBaseStyled = styled(motion.article)`
  min-height: 90vh;
  width: 100%;
  padding: 2rem 2rem;

  @media (${smallerThanTabletLandscape}) {
    padding: 2rem 0;
  }
`;
