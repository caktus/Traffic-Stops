import React from 'react';
import styled from 'styled-components';
import FJLogo from 'img/FJ-logo.svg';
import { HOME_SLUG } from 'Routes/slugs';
import { useHistory } from 'react-router-dom';

function LogoFull(props) {
  const history = useHistory();
  return <LogoStyled onClick={() => history.push(HOME_SLUG)} src={FJLogo} />;
}

export default LogoFull;

const LogoStyled = styled.img`
  width: 200px;
  cursor: pointer;
`;
