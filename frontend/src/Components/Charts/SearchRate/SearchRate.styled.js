import styled from 'styled-components';
import ChartPageBase from 'Components/Charts/ChartSections/ChartPageBase';

export const SearchRate = styled(ChartPageBase)``;

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
  display: flex;
`;

export const Spacing = styled.div`
  margin: 1em 0;
`;

export const NoBaseSearches = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
`;

export const NoBaseLink = styled.span`
  cursor: pointer;
  color: ${(p) => p.theme.colors.primaryDark};
`;
