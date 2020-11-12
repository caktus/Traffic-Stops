import React, { useEffect } from 'react';
import * as Styled from './DepartmentSearch.styled';
import PropTypes from 'prop-types';

// Router
import { useHistory, useRouteMatch } from 'react-router-dom';

// Context
import { FETCH_START, FETCH_SUCCESS, FETCH_FAILURE } from 'Context/root-reducer';
import { useRootContext } from 'Context/root-context';

// AJAX
import axios from 'Services/Axios';
import { getAgenciesURL } from 'Services/endpoints';

// Components
import AutoSuggest from './Inputs/AutoSuggest';
import { iconPositions, icons } from './Inputs/Input';
import { AGENCY_LIST_SLUG } from 'Routes/slugs';

const DATA_SET = 'AGENCIES_LIST';

function SeeAllDepartments() {
  const history = useHistory();
  const handleClicked = (e) => {
    e.preventDefault();
    console.log(e);
  };
  return (
    <Styled.SeeAllDepartments onClick={handleClicked}>
      <Styled.SeeAllText>View all departments</Styled.SeeAllText>
    </Styled.SeeAllDepartments>
  );
}

function DepartmentSearch({ onChange, navigateOnSelect, invertIcon, showIndexList, ...props }) {
  const { match } = useRouteMatch();
  const history = useHistory();
  const [state, dispatch] = useRootContext();
  // const [sortedAgencies, setSortedAgencies] = useState({});
  // const [searchedAgency, setSearchedAgency] = useState();

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

  const handleSuggestionSelected = (_, doodle) => {
    if (navigateOnSelect) {
      console.log('suggestion: ', doodle);
      console.log('match: ', match);
      console.log('history', history);
    } else onChange(doodle);
  };

  // /* SORT AGENCIES */
  // useEffect(() => {
  //   if (state.data[DATA_SET]) {
  //     const agenciesByChar = {};
  //     ALPHABET.map((char) => {
  //       const agenciesForChar = state.data[DATA_SET].filter(
  //         (agency) => agency.name[0].toLowerCase() === char
  //       );
  //       if (agenciesForChar.length > 0) {
  //         agenciesByChar[char.toUpperCase()] = agenciesForChar;
  //       }
  //     });
  //     console.log('agenciesByChar: ', agenciesByChar);
  //     setSortedAgencies(agenciesByChar);
  //   }
  // }, [state.data[DATA_SET]]);

  return (
    <AutoSuggest
      loading={state.loading[DATA_SET]}
      data={state.data[DATA_SET]}
      accessor="name"
      dropdownSubComponent={showIndexList ? <SeeAllDepartments /> : null}
      onSuggestionSelected={handleSuggestionSelected}
      focusInputOnSuggestionClick={false}
      inputProps={{
        iconPosition: iconPositions.LEFT,
        Icon: icons.search,
        invertIcon,
        ...props,
      }}
    />
  );
}

DepartmentSearch.propTypes = {
  navigateOnSelect: PropTypes.bool,
  showIndexList: PropTypes.bool,
  invertIcon: PropTypes.bool,
  onChange: PropTypes.func,
};

DepartmentSearch.defaultProps = {
  invertIcon: false,
  navigateOnSelect: false,
  showIndexList: false,
  openOnFocus: false,
};

export default DepartmentSearch;

// const ALPHABET = [
//   'a',
//   'b',
//   'c',
//   'd',
//   'e',
//   'f',
//   'g',
//   'h',
//   'i',
//   'j',
//   'k',
//   'l',
//   'm',
//   'n',
//   'o',
//   'p',
//   'q',
//   'r',
//   's',
//   't',
//   'u',
//   'v',
//   'w',
//   'x',
//   'y',
//   'z',
// ];
