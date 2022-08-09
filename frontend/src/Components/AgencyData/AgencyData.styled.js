import styled from 'styled-components';

import MainBase from '../../styles/MainBase';
import { phoneOnly, smallerThanTabletLandscape } from '../../styles/breakpoints';

export const AgencyData = styled(MainBase)``;

export const ContentWrapper = styled.div`
  display: flex;
  flex-direction: row;
  width: ${(props) => (props.showCompare ? 'fit-content' : '100%')};

  @media (${smallerThanTabletLandscape}) {
    flex-direction: column;
    overflow-y: visible;
  }

  @media (${phoneOnly}) {
    flex-direction: column-reverse;
    overflow-y: hidden;
  }
`;
