import React, { useState, useEffect } from 'react';
import { useTheme } from 'styled-components';
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

function SeeAllDepartments({ selectRef }) {
  const history = useHistory();
  const handleClick = (e) => {
    e.preventDefault();
    history.push(AGENCY_LIST_SLUG);
    if (selectRef?.current) selectRef.current.closeDropdown();
  };
  return (
    <Styled.SeeAllDepartments tabIndex="0" onClick={handleClick}>
      <Styled.SeeAllText>View all departments</Styled.SeeAllText>
    </Styled.SeeAllDepartments>
  );
}

function DepartmentSearch({
  onChange,
  onDropdownChange,
  navigateOnSelect,
  invertIcon,
  showIndexList,
  helpText,
  errors,
  ...props
}) {
  const theme = useTheme();
  const history = useHistory();
  const [dropdownOpen, setDropdownOpen] = useState();
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

  const _handleDropdownOpen = (open) => {
    setDropdownOpen(open);
  };

  const _getInputStyles = (inverted) => {
    if (inverted) {
      return {
        borderBottomLeftRadius: dropdownOpen ? 0 : '6px',
        borderBottomRightRadius: dropdownOpen ? 0 : '6px',
      };
    }
  };
  const _getIconStyles = (inverted) => {
    const styles = {
      borderColor: theme.colors.primary,
    };
    if (inverted) {
      styles.borderBottomLeftRadius = dropdownOpen ? 0 : theme.radii.standard;
    }
    return styles;
  };

  return (
    <AutoSuggest
      data={state.data[DATA_SET]}
      onSelection={handleSuggestionSelected}
      helpText={helpText}
      onDropdownChange={onDropdownChange || _handleDropdownOpen}
      renderInput={(innerProps) => (
        <Input
          errors={errors}
          icon={ICONS.search}
          iconPosition={iconPositions.LEFT}
          invertIcon={invertIcon}
          iconStyles={_getIconStyles(invertIcon)}
          {..._getInputStyles(invertIcon)}
          {...innerProps}
          {...props}
        />
      )}
      keyAccessor="id"
      valueAccessor="id"
      labelAccessor="name"
      renderBonusContent={
        showIndexList ? (bonusProps) => <SeeAllDepartments {...bonusProps} /> : () => {}
      }
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
