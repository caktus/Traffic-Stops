import React from 'react';
import PropTypes from 'prop-types';
import * as Styled from './Checkbox.styled';
import CheckboxIcon from '../../../img/icons/CheckboxIcon';
import {HelpText} from "./Input.styled";

function Checkbox({ value, checked, onChange, label, helpText }) {
  return (
    <Styled.Wrapper>
      <Styled.CheckboxWrapper onClick={() => onChange(value)}>
        <CheckboxIcon fill="black" checked={checked} />
        {label && <Styled.Label>{label}</Styled.Label>}
      </Styled.CheckboxWrapper>
      {helpText && <HelpText>{helpText}</HelpText>}
    </Styled.Wrapper>
  );
}

Checkbox.propTypes = {
  value: PropTypes.string.isRequired,
  checked: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
};

Checkbox.defaultProps = {
  checked: false,
};

export default Checkbox;
