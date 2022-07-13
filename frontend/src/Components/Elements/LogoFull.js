import React from 'react';
import styled from 'styled-components';
import CopWatchLogoWhite from '../../img/NC_copwatch_logo_solid.png';
import CopWatchLogoSolid from '../../img/NC_copwatch_logo_white.png';
import { HOME_SLUG } from '../../Routes/slugs';
import { useHistory } from 'react-router-dom';

function LogoFull({ solid, white }) {
  const history = useHistory();

  const _getLogo = () => {
    if (white) return CopWatchLogoWhite;
    return CopWatchLogoSolid;
  };
  return <LogoStyled onClick={() => history.push(HOME_SLUG)} src={_getLogo()} />;
}

export default LogoFull;

const LogoStyled = styled.img`
  width: 200px;
  cursor: pointer;
`;
