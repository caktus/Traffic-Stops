import React, { useState, useEffect } from 'react';
import { useTheme } from 'styled-components';
import * as S from './ChartHeader.styled';

// Elements
import Button from 'Components/Elements/Button';
import { ICONS } from 'img/icons/Icon';

// Children
import ShareList from 'Components/Charts/ChartSections/ShareList';

function ChartHeader({ chartTitle, handleViewData, shareProps }) {
  const theme = useTheme();
  const [shareOpen, setShareOpen] = useState(false);
  const shareListRef = React.useRef();

  const handleShare = () => {
    if (!shareOpen) setShareOpen(true);
  };

  useEffect(() => {
    function _closeOnBlur(e) {
      if (shareOpen && shareListRef?.current && shareListRef?.current !== e.target) {
        setShareOpen(false);
      }
    }
    document.addEventListener('click', _closeOnBlur);
    return () => document.removeEventListener('click', _closeOnBlur);
  }, [shareListRef.current]);

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
        {shareOpen ? (
          <ShareList ref={shareListRef} {...shareProps} />
        ) : (
          <Button
            variant={shareOpen ? 'neutral' : 'positive'}
            border={`2px solid ${theme.colors.primary}`}
            {...S.ButtonInlines}
            onClick={handleShare}
          >
            <S.Icon icon={ICONS.share} height={25} width={25} fill={theme.colors.white} />
            Share Graph
          </Button>
        )}
      </S.ButtonsWrapper>
    </S.ChartHeader>
  );
}

export default ChartHeader;
