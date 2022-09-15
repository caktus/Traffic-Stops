import styled from 'styled-components';

import MainBase from '../../styles/MainBase';
import { smallerThanTabletLandscape } from '../../styles/breakpoints';

export const AgencyData = styled(MainBase)``;

export const ContentWrapper = styled.div`
  display: flex;
  flex-direction: ${(props) => (props.showCompare ? 'column' : 'row')};
  width: 100%;
  scroll-behavior: smooth;
  @media (${smallerThanTabletLandscape}) {
    flex-direction: column;
    overflow-y: visible;
  }
`;
