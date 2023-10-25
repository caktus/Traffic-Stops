import styled from 'styled-components';
import ChartPageBase from '../ChartSections/ChartPageBase';
import { smallerThanDesktop, smallerThanTabletLandscape } from '../../../styles/breakpoints';

export default styled(ChartPageBase)``;

export const ChartWrapper = styled.div`
  width: 100%;
  height: auto;
`;

export const HorizontalBarWrapper = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: no-wrap;
  width: 100%;
  margin: 0 auto;
  justify-content: space-evenly;

  @media (${smallerThanDesktop}) {
    flex-wrap: wrap;
  }
`;

export const BarContainer = styled.div`
  width: 100%;
  height: 500px;
  @media (${smallerThanTabletLandscape}) {
    width: 100%;
  }
  display: ${(props) => (props.visible ? 'block' : 'none')};
`;
