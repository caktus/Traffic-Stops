import React, { useEffect, useReducer } from 'react';
import { AgencySearchStyled, AgenciesList, AgencyListItem } from './AgencySearch.styled';

// Router
import { Link, useRouteMatch } from 'react-router-dom';

// STate
import fetchReducer, {
  initialState,
  FETCH_START,
  FETCH_SUCCESS,
  FETCH_FAILURE,
} from 'Context/fetch-reducer';

function AgencySearch(props) {
  const match = useRouteMatch();
  const [state, dispatch] = useReducer(fetchReducer, initialState);

  useEffect(() => {
    dispatch({ type: FETCH_START });
    async function _fetchAgencyList() {
      try {
      } catch (error) {}
    }
  }, []);

  return (
    <AgencySearchStyled data-testid="AgencySearch">
      <h1>Find a Law Enforcement Agency</h1>
      <AgenciesList>
        <AgencyListItem>
          <Link to={`${match.url}/80`}>Durm Police Department</Link>
        </AgencyListItem>
      </AgenciesList>
    </AgencySearchStyled>
  );
}

export default AgencySearch;
