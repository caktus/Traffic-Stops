import styled from 'styled-components';
import { phoneOnly } from 'styles/breakpoints';
import { H2 } from 'styles/StyledComponents/Typography';

export const ChartSection = styled.div`
  margin-bottom: 2em;
`;

export const ChartTitle = styled(H2)`
  text-align: center;
`;

export const ChartDescription = styled.div`
  max-width: 720px;
  & p {
    margin-top: 1em;
  }
`;

export const ChartSubsection = styled.div`
  display: flex;
  flex-direction: row;
  flex: 1;

  @media (${phoneOnly}) {
    flex-direction: column;
  }
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

  @media (${phoneOnly}) {
    width: 100%;
    border: none;
    margin-top: 1em;
  }
`;

export const PieWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  & > div:first-child {
    flex: 1;
  }

  @media (${phoneOnly}) {
    flex-direction: column;
  }
`;

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

export const LegendBeside = styled.div`
  width: 33%;
  display: flex;
  flex-direction: column;
  padding: 5em 0 5em 2em;

  @media (${phoneOnly}) {
    padding: 0;
    width: 100%;
  }
`;

export const NoBaseSearches = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  height: 100%;
  padding: 2em;
  text-align: center;
`;

export const NoBaseLink = styled.span`
  cursor: pointer;
  color: ${(p) => p.theme.colors.primaryDark};
`;

export const LegendSection = styled.div`
  margin-top: 2em;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 33%;

  @media (${phoneOnly}) {
    width: 100%;
  }
`;
