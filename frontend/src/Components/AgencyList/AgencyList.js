import React, { useState, useEffect } from 'react';
import * as S from './AgencyList.styled';

// Router
import { Link, useRouteMatch } from 'react-router-dom';

// AJAX
import axios from 'Services/Axios';
import { getAgenciesURL } from 'Services/endpoints';

// Context
import { useRootContext } from 'Context/root-context';
import { FETCH_START, FETCH_SUCCESS, FETCH_FAILURE } from 'Context/root-reducer';

// Components
import ListSkeleton from 'Components/Elements/ListSkeleton';
import { H1, P } from 'styles/StyledComponents/Typography';

const DATA_SET = 'AGENCIES_LIST';

function AgencyList() {
  const match = useRouteMatch();

  const [state, dispatch] = useRootContext();
  const [sortedAgencies, setSortedAgencies] = useState({});

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

  return (
    <S.AgencyList data-testid="AgencyList">
      <S.InnerWrapper>
        <S.UpperContent>
          <S.HeadingAndDescription>
            <H1>Full Department List</H1>
            <P>
              Below are all police departments and sheriff’s offices that report law enforcement
              data in North Carolina. NC State law requires all law enformcement agencies to report
              their data on a monthly basis. If datasets appear to be incomplete or missing, please
              notify the NC Department of Justice.
            </P>
            <P>
              <strong>NOTE: </strong>
              NC CopWatch does not publish or have access to the names of officers, drivers, or
              passengers involved in traffic stops.
            </P>
          </S.HeadingAndDescription>
        </S.UpperContent>
        {state.loading[DATA_SET] && <ListSkeleton />}
        {state.data[DATA_SET] && (
          <S.AlphaList>
            {Object.keys(sortedAgencies).map((char) => (
              <S.AlphaSection key={char}>
                <S.AlphaTitle>{char}</S.AlphaTitle>
                <S.List>
                  {sortedAgencies[char].map((agency) => (
                    <S.ListItem key={agency.id}>
                      <Link to={`${match.url}/${agency.id}`}>{agency.name}</Link>
                    </S.ListItem>
                  ))}
                </S.List>
              </S.AlphaSection>
            ))}
          </S.AlphaList>
        )}
      </S.InnerWrapper>
    </S.AgencyList>
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
