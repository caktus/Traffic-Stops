import styled from 'styled-components';
import ChartPageBase from 'Components/Charts/ChartSections/ChartPageBase';

export const Searches = styled(ChartPageBase)``;

export const ChartSection = styled.div`
  margin-bottom: 2em;
`;

export const ChartSubsection = styled.div`
  display: flex;
  flex-direction: row;
  flex: 1;
`;

export const LegendBelow = styled.div`
  display: flex;
  justify-content: center;
`;

export const LineSection = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
`;

export const LineWrapper = styled.div`
  flex: 1;
`;

export const PieWrapper = styled.div`
  flex: 1;
`;

export const LegendBeside = styled.div`
  width: 33%;
  display: flex;
  flex-direction: column;
  padding: 5em 0 5em 2em;
`;

export const PieSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 33%;
  border-left: 1px solid ${(props) => props.theme.colors.greySemi};
`;

export const Spacing = styled.div`
  margin: 1em 0;
`;
