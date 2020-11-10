import React from 'react';
import { ButtonStyled } from './Button.styled';

function Button({ children, ...props }) {
  return <ButtonStyled {...props}>{children}</ButtonStyled>;
}

export default Button;
