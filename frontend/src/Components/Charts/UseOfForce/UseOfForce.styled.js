import styled from 'styled-components';
import ChartPageBase from 'Components/Charts/ChartSections/ChartPageBase';

export const UseOfForce = styled(ChartPageBase)``;

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

export const Spacing = styled.div`
  margin: 1em 0;
`;

export const PieSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 33%;
  border-left: 1px solid ${(props) => props.theme.colors.greySemi};
`;

export const PieWrapper = styled.div`
  flex: 1;
`;
