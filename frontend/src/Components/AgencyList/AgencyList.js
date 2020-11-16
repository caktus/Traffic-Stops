import React, { useState, useEffect, useReducer } from 'react';
import * as Styled from './AgencyList.styled';

// Router
import { Link, useHistory, useRouteMatch } from 'react-router-dom';

// AJAX
import axios from 'Services/Axios';
import { getAgenciesURL } from 'Services/endpoints';

// Context
import { useRootContext } from 'Context/root-context';
import { FETCH_START, FETCH_SUCCESS, FETCH_FAILURE } from 'Context/root-reducer';

// Components
import Button from 'Components/Elements/Button';
import ListSkeleton from 'Components/Elements/ListSkeleton';
import AutoSuggest from 'Components/Elements/Inputs/AutoSuggest';

const DATA_SET = 'AGENCIES_LIST';

function AgencyList() {
  const history = useHistory();
  const match = useRouteMatch();

  const [state, dispatch] = useRootContext();
  const [sortedAgencies, setSortedAgencies] = useState({});
  const [searchedAgency, setSearchedAgency] = useState();

  /* FETCH AGENCIES */
  useEffect(() => {
    if (!state.loading[DATA_SET] && !state.data[DATA_SET]) {
      dispatch({ type: FETCH_START, dataSet: DATA_SET });
      async function _fetchAgencyList() {
        try {
          const { data } = await axios.get(getAgenciesURL());
          dispatch({ type: FETCH_SUCCESS, dataSet: DATA_SET, payload: data });
        } catch (error) {
          dispatch({ type: FETCH_FAILURE, dataSet: DATA_SET, payload: error.message });
        }
      }
      _fetchAgencyList();
    }
  }, []);

  /* SORT AGENCIES */
  useEffect(() => {
    if (state.data[DATA_SET]) {
      const agenciesByChar = {};
      ALPHABET.map((char) => {
        const agenciesForChar = state.data[DATA_SET].filter(
          (agency) => agency.name[0].toLowerCase() === char
        );
        if (agenciesForChar.length > 0) {
          agenciesByChar[char.toUpperCase()] = agenciesForChar;
        }
      });
      setSortedAgencies(agenciesByChar);
    }
  }, [state.data[DATA_SET]]);

  const handleViewSearchedAgency = (e) => {
    e.preventDefault();
    if (!searchedAgency) return;
    history.push(`${match.url}/${searchedAgency.id}`);
  };

  return (
    <Styled.AgencyList data-testid="AgencyList">
      <h1>Find a Law Enforcement Agency</h1>
      {state.loading[DATA_SET] && <ListSkeleton />}
      {state.data[DATA_SET] && (
        <Styled.AlphaList>
          {Object.keys(sortedAgencies).map((char) => (
            <Styled.AlphaSection key={char}>
              <Styled.AlphaTitle>{char}</Styled.AlphaTitle>
              <Styled.List>
                {sortedAgencies[char].map((agency) => (
                  <Styled.ListItem key={agency.id}>
                    <Link to={`${match.url}/${agency.id}`}>{agency.name}</Link>
                  </Styled.ListItem>
                ))}
              </Styled.List>
            </Styled.AlphaSection>
          ))}
        </Styled.AlphaList>
      )}
    </Styled.AgencyList>
  );
}

export default AgencyList;

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
