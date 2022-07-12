import React from 'react';
import PropTypes from 'prop-types';
import { SelectStyled, SelectLabel, SelectInput, SelectOption } from 'Components/Select.styled';
import { options } from 'yargs';

function Select({ label, nullValue, options, ...props }) {
  return (
    <SelectStyled>
      {label && <SelectLabel>{label}</SelectLabel>}
      <SelectInput {...props}>
        {nullValue && <SelectOption value={nullValue.value}>{nullValue.name}</SelectOption>}
        {options.map((option) => (
          <SelectOption key={option.value} value={option.value}>
            {option.name}
          </SelectOption>
        ))}
      </SelectInput>
    </SelectStyled>
  );
}

Select.propTypes = {
  label: PropTypes.string,
  nullValue: PropTypes.shape({
    value: PropTypes.string,
    name: PropTypes.string,
  }),
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    })
  ).isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};

Select.defaultProps = {};

export default Select;
