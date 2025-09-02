import React, { useState } from 'react';
import { useTheme } from 'styled-components';
import * as S from './ChartHeader.styled';

// Hooks
import useOfficerId from '../../../Hooks/useOfficerId';

// Elements
import OfficerBadge from './OfficerBadge';
import Button from '../../Elements/Button';
import { ICONS } from '../../../img/icons/Icon';

// Children
import ShareList from './ShareList';

function ChartHeader({ chartTitle, handleViewData, shareProps, hideActions }) {
  const theme = useTheme();
  const [shareOpen, setShareOpen] = useState(false);
  const officerId = useOfficerId();

  const handleShare = () => {
    setShareOpen(!shareOpen);
  };

  return (
    <S.ChartHeader>
      <S.TitleWrapper>
        <S.ChartTitle>{chartTitle}</S.ChartTitle>
        {officerId && <OfficerBadge officerId={officerId} />}
      </S.TitleWrapper>

      {!hideActions && (
        <S.ButtonsWrapper>
          {handleViewData && (
            <Button
              variant="neutral"
              border={`2px solid ${theme.colors.primary}`}
              {...S.ButtonInlines}
              onClick={handleViewData}
            >
              <S.Icon icon={ICONS.view} height={25} width={25} fill={theme.colors.primary} />
              View Data
            </Button>
          )}
          {shareOpen ? (
            <ShareList {...shareProps} onPressHandler={handleShare} />
          ) : (
            <Button
              variant="positive"
              border={`2px solid ${theme.colors.primary}`}
              {...S.ButtonInlines}
              onClick={handleShare}
            >
              <S.Icon icon={ICONS.share} height={25} width={25} fill={theme.colors.white} />
              Share Graph
            </Button>
          )}
        </S.ButtonsWrapper>
      )}
    </S.ChartHeader>
  );
}

export default ChartHeader;
