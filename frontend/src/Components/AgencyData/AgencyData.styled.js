import styled from 'styled-components';

import MainBase from 'styles/MainBase';
import { smallerThanTabletLandscape } from 'styles/breakpoints';

export const AgencyData = styled(MainBase)``;

export const ContentWrapper = styled.div`
  flex: 1;
  display: flex;
  flex-direction: row;

  @media (${smallerThanTabletLandscape}) {
    flex-direction: column;
  }
`;
