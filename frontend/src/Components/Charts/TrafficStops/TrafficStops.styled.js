import styled from 'styled-components';
import ChartPageBase from '../ChartSections/ChartPageBase';
import { smallerThanDesktop, smallerThanTabletLandscape } from '../../../styles/breakpoints';

export default styled(ChartPageBase)``;

export const LineWrapper = styled.div`
  display: ${(props) => (props.visible ? 'flex' : 'none')};
  flex-direction: row;
  flex-wrap: no-wrap;
  width: 85%;
  margin: 0 auto;
  justify-content: space-evenly;

  @media (${smallerThanDesktop}) {
    flex-wrap: wrap;
  }
`;

export const PieWrapper = styled.div`
  display: ${(props) => (props.visible ? 'flex' : 'none')};
  flex-direction: row;
  gap: 10px;
  justify-content: space-evenly;
  width: auto;
  height: 400px;

  @media (${smallerThanTabletLandscape}) {
    flex-direction: column;
    height: auto;
  }
`;

export const StopGroupsContainer = styled.div`
  width: 100%;
  height: 500px;
`;

export const GroupedStopsContainer = styled.div`
  width: 80%;
  height: 500px;
  @media (${smallerThanTabletLandscape}) {
    width: 100%;
  }
  display: ${(props) => (props.visible ? 'block' : 'none')};
`;

export const PieStopsContainer = styled.div`
  width: 33%;
  height: 500px;
  @media (${smallerThanTabletLandscape}) {
    width: 100%;
  }
  display: ${(props) => (props.visible ? 'block' : 'none')};
`;

export const SwitchContainer = styled.div`
  display: flex;
  flex-direction: row;
  gap: 10px;
  margin-top: 10px;
  margin-bottom: 10px;
  align-items: center;
`;

export const LineChartWithPieContainer = styled.div`
  display: flex;
  flex-direction: ${(props) => (props.showCompare ? 'column' : 'row')};
  width: 100%;
  flex-wrap: nowrap;

  @media (${smallerThanDesktop}) {
    flex-direction: column;
  }
`;

export const PieContainer = styled.div`
  width: 300px;
`;
