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
import Input, { iconPositions } from 'Components/Elements/Inputs/Input';
import { ICONS } from 'img/icons/Icon';

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

function DepartmentSearch({
  onChange,
  navigateOnSelect,
  invertIcon,
  showIndexList,
  helpText,
  errors,
  ...props
}) {
  const history = useHistory();
  const [state, dispatch] = useRootContext();

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

  const handleSuggestionSelected = (department) => {
    if (navigateOnSelect) {
      history.push(`${AGENCY_LIST_SLUG}/${department.id}`);
    } else onChange(department);
  };

  return (
    <AutoSuggest
      {...props}
      data={state.data[DATA_SET]}
      onSelection={handleSuggestionSelected}
      helpText={helpText}
      renderInput={(inputProps) => (
        <Input
          errors={errors}
          icon={ICONS.search}
          iconPosition={iconPositions.LEFT}
          invertIcon={invertIcon}
          borderColor={invertIcon ? 'white' : 'primary'}
          {...inputProps}
        />
      )}
      keyAccessor="id"
      valueAccessor="id"
      labelAccessor="name"
      renderBonusContent={showIndexList ? () => <SeeAllDepartments /> : () => {}}
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