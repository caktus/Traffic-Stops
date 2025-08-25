import styled from 'styled-components';
import { H2, P } from '../../styles/StyledComponents/Typography';
import {
  phoneOnly,
  smallerThanDesktop,
  smallerThanTabletLandscape,
} from '../../styles/breakpoints';

const censusTitleStyled = `
  font-size: 18px;
  text-decoration-line: underline;
  text-decoration-style: dotted;
  text-underline-offset: 5px;
  cursor: pointer;
`;

export const CensusTitle = styled(H2)`
  ${censusTitleStyled}

  @media (${phoneOnly}) {
    display: hidden;
  }
`;

export const CensusTitleMobile = styled.span`
  ${censusTitleStyled}
  font-size: 12px;
  font-weight: bold;
`;

export const CensusDemographics = styled.div`
  display: flex;
  flex-direction: column;

  @media (${phoneOnly}) {
    display: none;
  }
`;

export const CensusDemographicsMobile = styled.details`
  display: none;

  @media (${phoneOnly}) {
    display: block;
  }
`;

export const Datum = styled(P)`
  font-size: 14px;
`;

export const NoCensus = styled.p``;

export const CensusRow = styled.ul`
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  list-style-type: none;
  overflow-x: auto;
  overflow-y: hidden;
  @media (${smallerThanTabletLandscape}) {
    height: 100px;
  }
`;

export const CensusDatum = styled.li`
  display: flex;
  flex-direction: column;
  align-items: center;

  &:not(:last-child) {
    margin-right: 2em;
  }
  @media (${smallerThanDesktop}) {
    flex-direction: row;
  }
`;

export const CensusRace = styled(P)`
  text-transform: uppercase;
  font-size: 14px;
  @media (${smallerThanDesktop}) {
    margin-right: 1em;
  }
`;

export const Tooltip = styled.div`
  background: #333;
  color: white;
  font-weight: bold;
  padding: 4px 8px;
  font-size: 13px;
  border-radius: 4px;
  visibility: hidden;

  &[data-show='true'] {
    visibility: visible;
  }
`;
