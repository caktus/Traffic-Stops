import React from 'react';
import styled from 'styled-components';
import FJLogo from 'img/FJ-logo.svg';

function LogoFull(props) {
  return <LogoStyled src={FJLogo} />;
}

export default LogoFull;

const LogoStyled = styled.img`
  width: 200px;
`;
