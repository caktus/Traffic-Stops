import styled from 'styled-components';
import ChartPageBase from 'Components/Charts/ChartSections/ChartPageBase';

export const Contraband = styled(ChartPageBase)``;

export const ChartSection = styled.div`
  margin-bottom: 2em;
`;

export const ChartSubsection = styled.div`
  display: flex;
  flex-direction: row;
  flex: 1;
`;

export const LineSection = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
`;

export const LineWrapper = styled.div`
  flex: 1;
`;

export const LegendSection = styled.div`
  margin-top: 2em;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 33%;
`;
