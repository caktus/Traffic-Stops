import styled from 'styled-components';

import MainBase from 'styles/MainBase';
import { phoneOnly, smallerThanTabletLandscape } from 'styles/breakpoints';

export const AgencyData = styled(MainBase)`
  /* overflow: hidden; */
`;

export const ContentWrapper = styled.div`
  flex: 1;
  display: flex;
  flex-direction: row;
  overflow: hidden;

  @media (${smallerThanTabletLandscape}) {
    flex-direction: column;
    overflow-y: visible;
  }

  @media (${phoneOnly}) {
    flex-direction: column-reverse;
    overflow-y: hidden;
  }
`;
