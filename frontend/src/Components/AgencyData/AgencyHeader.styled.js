import styled from 'styled-components';

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

export const AgencyTitle = styled.h2``;

export const LastReported = styled.h4``;

export const ReportedDate = styled.h4``;

export const CensusTitle = styled.h2``;

export const CensusRow = styled.ul`
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: row;
  list-style-type: none;
`;

export const CensusDatum = styled.li``;

export const CensusRace = styled.h4``;

export const CensusPercentage = styled.p``;

export const NoCensus = styled.h4``;
