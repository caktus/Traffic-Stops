import styled from 'styled-components';
import { motion } from 'framer-motion';

import MainBase from 'styles/MainBase';
import { smallerThanTabletLandscape } from 'styles/breakpoints';

export const AgencyDataStyled = styled(MainBase)``;

export const MotionDiv = styled(motion.div)`
  flex: 1;
  display: flex;
  flex-direction: row;

  @media (${smallerThanTabletLandscape}) {
    flex-direction: column;
  }
`;
