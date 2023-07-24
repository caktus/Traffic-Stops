import styled from 'styled-components';
import ChartPageBase from '../ChartSections/ChartPageBase';
import { smallerThanDesktop, smallerThanTabletLandscape } from '../../../styles/breakpoints';

export default styled(ChartPageBase)``;

export const LineWrapper = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: no-wrap;
  width: 85%%;
  margin: 0 auto;
  justify-content: space-evenly;

  @media (${smallerThanDesktop}) {
    flex-wrap: wrap;
  }
`;

export const StopGroupsContainer = styled.div`
  width: 100%;
  height: 500px;
`;

export const GroupedStopsContainer = styled.div`
  width: 33%;
  height: 500px;
  @media (${smallerThanTabletLandscape}) {
    width: 100%;
  }
`;
