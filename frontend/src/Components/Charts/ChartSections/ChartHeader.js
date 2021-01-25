import React from 'react';
import { useTheme } from 'styled-components';
import * as S from './ChartHeader.styled';
import Button from 'Components/Elements/Button';
import { ICONS } from 'img/icons/Icon';

function ChartHeader({ chartTitle, handleViewData, handleShareGraph }) {
  const theme = useTheme();
  return (
    <S.ChartHeader>
      <S.ChartTitle>{chartTitle}</S.ChartTitle>
      <S.ButtonsWrapper>
        <Button
          variant="neutral"
          border={`2px solid ${theme.colors.primary}`}
          {...S.ButtonInlines}
          onClick={handleViewData}
        >
          <S.Icon icon={ICONS.view} height={25} width={25} fill={theme.colors.primary} />
          View Data
        </Button>
        <Button
          variant="positive"
          border={`2px solid ${theme.colors.primary}`}
          {...S.ButtonInlines}
          onClick={handleShareGraph}
        >
          <S.Icon icon={ICONS.share} height={25} width={25} fill={theme.colors.white} />
          Share Graph
        </Button>
      </S.ButtonsWrapper>
    </S.ChartHeader>
  );
}

export default ChartHeader;
