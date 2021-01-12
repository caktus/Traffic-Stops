import React, { useEffect } from 'react';
import * as Styled from './DepartmentSearch.styled';
import PropTypes from 'prop-types';

// Router
import { useHistory } from 'react-router-dom';

// Context
import { FETCH_START, FETCH_SUCCESS, FETCH_FAILURE } from 'Context/root-reducer';
import { useRootContext } from 'Context/root-context';

// AJAX
import axios from 'Services/Axios';
import { getAgenciesURL } from 'Services/endpoints';

// Components
import { AGENCY_LIST_SLUG } from 'Routes/slugs';
import AutoSuggest from './Inputs/AutoSuggest';

const DATA_SET = 'AGENCIES_LIST';

function SeeAllDepartments() {
  const history = useHistory();
  const handleClick = (e) => {
    e.preventDefault();
    history.push(AGENCY_LIST_SLUG);
  };
  return (
    <Styled.SeeAllDepartments>
      <Styled.SeeAllText onClick={handleClick}>View all departments</Styled.SeeAllText>
    </Styled.SeeAllDepartments>
  );
}

function DepartmentSearch({ onChange, navigateOnSelect, invertIcon, showIndexList, ...props }) {
  const history = useHistory();
  const [state, dispatch] = useRootContext();

  /* FETCH AGENCIES */
  useEffect(() => {
    if (!state.loading[DATA_SET] && !state.data[DATA_SET]) {
      dispatch({ type: FETCH_START, dataSet: DATA_SET });
      async function _fetchAgencyList() {
        try {
          const { data } = await axios.get(getAgenciesURL());
          console.log('data: ', data);
          dispatch({ type: FETCH_SUCCESS, dataSet: DATA_SET, payload: data });
        } catch (error) {
          dispatch({ type: FETCH_FAILURE, dataSet: DATA_SET, payload: error.message });
        }
      }
      _fetchAgencyList();
    }
  }, []);

  const handleSuggestionSelected = (department) => {
    if (navigateOnSelect) {
      history.push(`${AGENCY_LIST_SLUG}/${department.id}`);
    } else onChange(department);
  };

  return (
    <AutoSuggest
      data={state.data[DATA_SET]}
      onSelection={handleSuggestionSelected}
      {...props}
      keyAccessor="id"
      valueAccessor="id"
      labelAccessor="name"
      renderBonusContent={() => <SeeAllDepartments />}
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
