import styled from 'styled-components';
import { P, H2 } from 'styles/StyledComponents/Typography';

export const AgencyHeader = styled.div`
  box-shadow: ${(props) => props.theme.shadows.depth1};
  padding: 2em 3em;
`;

export const SubHeaderNavRow = styled.div`
  margin-bottom: 1em;
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
`;

export const AgencyTitle = styled(H2)`
  margin-bottom: 1rem;
`;

// export const LastReported = styled.h4``;

export const ReportedDate = styled(P)`
  display: inline;
`;

export const CensusTitle = styled(H2)`
  margin-bottom: 1rem;
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
`;

export const Other = styled(P)``;

export const NoCensus = styled.h4``;