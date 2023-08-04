import styled from 'styled-components';
import ChartPageBase from '../ChartSections/ChartPageBase';
import { smallerThanDesktop, smallerThanTabletLandscape } from '../../../styles/breakpoints';

export default styled(ChartPageBase)``;

export const LineWrapper = styled.div`
  display: ${(props) => (props.visible ? 'flex' : 'none')};
  flex-direction: row;
  flex-wrap: no-wrap;
  width: 85%%;
  margin: 0 auto;
  justify-content: space-evenly;

  @media (${smallerThanDesktop}) {
    flex-wrap: wrap;
  }
`;

export const PieWrapper = styled.div`
  display: ${(props) => (props.visible ? 'flex' : 'none')};
  flex-direction: row;
  flex-wrap: wrap;
  gap: 10px;
`;

export const StopGroupsContainer = styled.div`
  width: 100%;
  height: 500px;
`;

export const GroupedStopsContainer = styled.div`
  width: 30%;
  height: 500px;
  @media (${smallerThanTabletLandscape}) {
    width: 100%;
  }
  display: ${(props) => (props.visible ? 'block' : 'none')};
`;
