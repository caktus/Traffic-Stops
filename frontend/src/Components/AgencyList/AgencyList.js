import React, { useState, useEffect } from 'react';
import * as S from './AgencyList.styled';

// Router
import { Link, useHistory, useRouteMatch } from 'react-router-dom';

// AJAX
import axios from '../../Services/Axios';
import { getAgenciesURL } from '../../Services/endpoints';

// Context
import { useRootContext } from '../../Context/root-context';
import { FETCH_START, FETCH_SUCCESS, FETCH_FAILURE } from '../../Context/root-reducer';

// Components
import ListSkeleton from '../Elements/ListSkeleton';
import { H1, P } from '../../styles/StyledComponents/Typography';
import FjButton from '../Elements/Button';
import * as ChartHeaderStyles from '../Charts/ChartSections/ChartHeader.styled';
import { STATEWIDE_DATA } from '../../Routes/slugs';
import { ICONS } from '../../img/icons/Icon';
import { useTheme } from 'styled-components';

const DATA_SET = 'AGENCIES_LIST';

function AgencyList() {
  const match = useRouteMatch();
  const theme = useTheme();
  const history = useHistory();

  const [state, dispatch] = useRootContext();
  const [sortedAgencies, setSortedAgencies] = useState({});

  async function _fetchAgencyList() {
    try {
      const { data } = await axios.get(getAgenciesURL());
      // Removing NC Statewide link from list and instead have dedicated button above list
      const agencies = data.filter((d) => d.id !== -1);
      dispatch({ type: FETCH_SUCCESS, dataSet: DATA_SET, payload: agencies });
    } catch (error) {
      dispatch({ type: FETCH_FAILURE, dataSet: DATA_SET, payload: error.message });
    }
  }

  /* FETCH AGENCIES */
  useEffect(() => {
    if (!state.loading[DATA_SET] && !state.data[DATA_SET]) {
      dispatch({ type: FETCH_START, dataSet: DATA_SET });

      _fetchAgencyList();
    }
  }, []);

  /* SORT AGENCIES */
  useEffect(() => {
    if (state.data[DATA_SET]) {
      const agenciesByChar = {};
      ALPHABET.forEach((char) => {
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
          <S.ButtonWrapper>
            <FjButton
              variant="positive"
              border={`2px solid ${theme.colors.primary}`}
              {...ChartHeaderStyles.ButtonInlines}
              onClick={() => history.push(`${STATEWIDE_DATA}`)}
            >
              <ChartHeaderStyles.Icon
                icon={ICONS.info}
                height={25}
                width={25}
                fill={theme.colors.white}
              />
              View all statewide data
            </FjButton>
          </S.ButtonWrapper>
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
