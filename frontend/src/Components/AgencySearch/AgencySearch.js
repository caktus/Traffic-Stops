import React from 'react';
import { AgencySearchStyled } from './AgencySearch.styled';
import { Link, useRouteMatch } from 'react-router-dom';

function AgencySearch(props) {
  const match = useRouteMatch();
  return (
    <AgencySearchStyled data-testid="AgencySearch">
      <p>AgencySearch</p>
      <Link to={`${match.url}/80`}>View durm or something</Link>
    </AgencySearchStyled>
  );
}

export default AgencySearch;
