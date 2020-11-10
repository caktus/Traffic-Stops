import React from 'react';
import PropTypes from 'prop-types';
import * as Styled from './Input.styled';

function Input({ label, ...props }) {
  return (
    <Styled.Wrapper>
      {label && <Styled.Label>{label}</Styled.Label>}
      <Styled.Input {...props} />
    </Styled.Wrapper>
  );
}

Input.propTypes = {
  label: PropTypes.string,
};

export default Input;
