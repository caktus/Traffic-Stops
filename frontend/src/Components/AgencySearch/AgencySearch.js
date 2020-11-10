import React, { useState, useEffect, useReducer } from 'react';
import {
  AgencySearchStyled,
  AgenciesList,
  AgencyListItem,
  AgenciesListList,
  AgenciesListCharSection,
  AgenciesListCharTitle,
  SearchWrapper,
  AutoSuggestForm,
} from './AgencySearch.styled';

// Router
import { Link, useHistory, useRouteMatch } from 'react-router-dom';

// AJAX
import axios from 'Services/Axios';
import { getAgenciesURL } from 'Services/endpoints';

// State
import fetchReducer, {
  initialState,
  FETCH_START,
  FETCH_SUCCESS,
  FETCH_FAILURE,
} from 'Context/fetch-reducer';

// Components
import Button from 'Components/Elements/Button';
import ListSkeleton from 'Components/Elements/ListSkeleton';
import AutoSuggest from 'Components/Elements/AutoSuggest';

function AgencySearch() {
  const history = useHistory();
  const match = useRouteMatch();
  const [state, dispatch] = useReducer(fetchReducer, initialState);
  const [sortedAgencies, setSortedAgencies] = useState({});
  const [searchedAgency, setSearchedAgency] = useState();

  /* FETCH AGENCIES */
  useEffect(() => {
    dispatch({ type: FETCH_START });
    async function _fetchAgencyList() {
      try {
        const { data } = await axios.get(getAgenciesURL());
        dispatch({ type: FETCH_SUCCESS, payload: data });
      } catch (error) {
        dispatch({ type: FETCH_FAILURE, payload: error.message });
      }
    }
    _fetchAgencyList();
  }, []);

  /* SORT AGENCIES */
  useEffect(() => {
    if (state.data) {
      const agenciesByChar = {};
      ALPHABET.map((char) => {
        const agenciesForChar = state.data.filter(
          (agency) => agency.name[0].toLowerCase() === char
        );
        if (agenciesForChar.length > 0) {
          agenciesByChar[char.toUpperCase()] = agenciesForChar;
        }
      });
      setSortedAgencies(agenciesByChar);
    }
  }, [state.data]);

  const handleViewSearchedAgency = (e) => {
    e.preventDefault();
    if (!searchedAgency) return;
    history.push(`${match.url}/${searchedAgency.id}`);
  };

  return (
    <AgencySearchStyled data-testid="AgencySearch">
      <h1>Find a Law Enforcement Agency</h1>
      {state.loading && <ListSkeleton />}
      {state.data && (
        <>
          <SearchWrapper>
            <AutoSuggestForm>
              <AutoSuggest
                data={state.data}
                placeholder="Starting typing the name of an agency..."
                accessor="name"
                onSuggestionSelected={(_, { suggestion }) => setSearchedAgency(suggestion)}
              />
              <Button onClick={handleViewSearchedAgency}>View</Button>
            </AutoSuggestForm>
          </SearchWrapper>
          <AgenciesList>
            {Object.keys(sortedAgencies).map((char) => (
              <AgenciesListCharSection key={char}>
                <AgenciesListCharTitle>{char}</AgenciesListCharTitle>
                <AgenciesListList>
                  {sortedAgencies[char].map((agency) => (
                    <AgencyListItem key={agency.id}>
                      <Link to={`${match.url}/${agency.id}`}>{agency.name}</Link>
                    </AgencyListItem>
                  ))}
                </AgenciesListList>
              </AgenciesListCharSection>
            ))}
          </AgenciesList>
        </>
      )}
    </AgencySearchStyled>
  );
}

export default AgencySearch;

const ALPHABET = [
  'a',
  'b',
  'c',
  'd',
  'e',
  'f',
  'g',
  'h',
  'i',
  'j',
  'k',
  'l',
  'm',
  'n',
  'o',
  'p',
  'q',
  'r',
  's',
  't',
  'u',
  'v',
  'w',
  'x',
  'y',
  'z',
];
