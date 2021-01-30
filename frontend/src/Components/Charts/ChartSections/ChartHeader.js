import React from 'react';
import { useTheme } from 'styled-components';
import * as S from './ChartHeader.styled';

// Hooks
import useOfficerId from 'Hooks/useOfficerId';

// Elements
import OfficerBadge from 'Components/Charts/ChartSections/OfficerBadge';
import Button from 'Components/Elements/Button';
import { ICONS } from 'img/icons/Icon';

function ChartHeader({ chartTitle, handleViewData, handleShareGraph }) {
  const theme = useTheme();
  const officerId = useOfficerId();
  return (
    <S.ChartHeader>
      <S.TitleWrapper>
        <S.ChartTitle>{chartTitle}</S.ChartTitle>
        {officerId && <OfficerBadge officerId={officerId} />}
      </S.TitleWrapper>

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
