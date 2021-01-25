import styled from 'styled-components';
import ChartPageBase from 'Components/Charts/ChartSections/ChartPageBase';
import { H2 } from 'styles/StyledComponents/Typography';

export const Overview = styled(ChartPageBase)``;

export const SectionWrapper = styled.div`
  margin: 1em 0;
`;

export const ChartsWrapper = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: space-between;
`;

export const PieContainer = styled.div`
  background: ${(props) => props.theme.colors.greyLight};
  border-radius: 16px;
  width: 600px;
  margin-bottom: 4em;
  padding: 1.5em;
`;

export const ChartTitle = styled(H2)`
  text-align: center;
`;

export const PieWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  & > div:first-child {
    flex: 1;
  }
`;

export const Note = styled.p`
  line-height: 28px;
  text-align: center;
`;

export const Link = styled.a`
  display: block;
  font-size: 16px;
  font-family: ${(props) => props.theme.fonts.body};
  color: ${(props) => props.theme.colors.primaryDark};
  cursor: pointer;
  text-align: center;
  margin-top: 1em;
  &:hover {
    text-decoration: underline;
  }
`;
