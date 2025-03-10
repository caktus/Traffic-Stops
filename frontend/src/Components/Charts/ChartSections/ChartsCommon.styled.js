import styled from 'styled-components';
import { smallerThanDesktop, smallerThanTabletLandscape } from '../../../styles/breakpoints';
import { H2 } from '../../../styles/StyledComponents/Typography';

export const ChartSection = styled.div`
  margin-top: ${(props) => (props.marginTop ? props.marginTop : '3')}em;
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

export const ChartWarning = styled.div`
  background-color: rgba(252, 248, 227, 1);
  border-color: rgba(177, 161, 129, 1);
  color: rgba(138, 109, 59, 1);
  width: 50%;
  padding: 12px 16px;
  border-radius: 4px;
  border-style: solid;
  border-width: 1px;
  margin-top: 15px;
  font-size: 16px;
  text-align: center;
`;

export const ChartSubsection = styled.div`
  display: flex;
  flex-direction: ${(props) => (props.showCompare ? 'column' : 'row')};

  @media (${smallerThanDesktop}) {
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
  width: 100%;
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
  align-items: ${(props) => (props.alignItems ? props.alignItems : 'center')};

  @media (${smallerThanDesktop}) {
    flex-direction: row;
    width: 100%;
    border: none;
  }
  @media (${smallerThanTabletLandscape}) {
    flex-direction: column;
  }
`;

export const PieWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  width: ${(props) => (props.zoomed ? '100%' : 'auto')};
  height: ${(props) => (props.zoomed ? '100%' : 'auto')};

  @media (${smallerThanTabletLandscape}) {
    flex-direction: column;
  }
`;

export const PieActionsWrapper = styled.div`
  display: flex;
  flex-direction: column;
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

  @media (${smallerThanDesktop}) {
    padding: 0;
    width: 100%;
  }
`;

export const ChartContainer = styled.div`
  min-height: 400px;
  height: 600px;
  ${(props) => props.override};
`;
