import React from 'react';
import { AgencySearchStyled, AgenciesList, AgencyListItem } from './AgencySearch.styled';
import { Link, useRouteMatch } from 'react-router-dom';

function AgencySearch(props) {
  const match = useRouteMatch();
  return (
    <AgencySearchStyled data-testid="AgencySearch">
      <h1>Agencies</h1>
      <AgenciesList>
        <AgencyListItem>
          <Link to={`${match.url}/80`}>Durm Police Department</Link>
        </AgencyListItem>
      </AgenciesList>
    </AgencySearchStyled>
  );
}

export default AgencySearch;
