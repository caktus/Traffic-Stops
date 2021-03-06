import styled from 'styled-components';
import { P, H2 } from 'styles/StyledComponents/Typography';
import FJIcon from 'img/icons/Icon';
import { phoneOnly, smallerThanTabletLandscape } from 'styles/breakpoints';

export const AgencyHeader = styled.div`
  box-shadow: ${(props) => props.theme.shadows.depth1};
  padding: 0.5em 3em;

  @media (${smallerThanTabletLandscape}) {
    padding: 0.5em 1em;
  }

  @media (${phoneOnly}) {
    display: flex;
    align-items: center;
    justify-content: center;
  }
`;

export const AgencySub = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  margin-bottom: 1em;
`;

export const GoToAgency = styled.p`
  color: ${(p) => p.theme.colors.primaryDark};
  margin-left: 1.5em;
  display: flex;
  flex-direction: row;
  align-items: center;
  cursor: pointer;
`;

export const ViewIcon = styled(FJIcon)`
  margin-left: 0.5em;
`;

export const SubHeaderNavRow = styled.div`
  margin-bottom: 0.5em;
  @media (${smallerThanTabletLandscape}) {
    display: none;
  }
`;

export const SubHeaderContentRow = styled.div`
  display: flex;
`;

export const EntityDetails = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
`;

export const CensusDemographics = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;

  @media (${phoneOnly}) {
    display: none;
  }
`;

export const AgencyTitle = styled(H2)`
  font-size: 18px;
`;

export const ReportedDate = styled(P)`
  display: inline;
`;

export const CensusTitle = styled(H2)`
  font-size: 18px;
`;

export const CensusRow = styled.ul`
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: row;
  list-style-type: none;
`;

export const CensusDatum = styled.li`
  display: flex;
  flex-direction: column;
  align-items: center;

  &:not(:last-child) {
    margin-right: 2em;
  }
`;

export const CensusRace = styled(P)`
  text-transform: uppercase;
  font-size: 14px;
`;

export const Datum = styled(P)`
  font-size: 14px;
`;

export const Other = styled(P)`
  font-size: 14px;
`;

export const NoCensus = styled.p``;
