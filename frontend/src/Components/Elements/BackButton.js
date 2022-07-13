import React from 'react';
import PropTypes from 'prop-types';

import {useHistory, useRouteMatch} from 'react-router-dom';

// Styles, assets
import { useTheme } from 'styled-components';
import * as S from './BackButton.styled';
import { ICONS } from '../../img/icons/Icon';

import { SIZES } from '../../styles/StyledComponents/Typography';

function BackButton({ to, text, ...props }) {
  const history = useHistory();
  const theme = useTheme();

  const _handleClick = (e) => {
    if (to) history.replace(to);
    else history.goBack();
  };

  return (
    <S.BackButton onClick={_handleClick} {...props}>
      <S.Icon icon={ICONS.arrowLeft} width={24} height={24} fill={theme.colors.primaryDark} />
      <S.Text size={SIZES[1]}>{text} </S.Text>
    </S.BackButton>
  );
}

BackButton.propTypes = {
  /** the path to go back to, defaults to the last item in the stack */
  to: PropTypes.string,
  text: PropTypes.string,
};

BackButton.defaultProps = {
  text: 'Back',
};

export default BackButton;
