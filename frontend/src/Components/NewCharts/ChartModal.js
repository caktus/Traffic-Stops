import React, { useCallback, useEffect } from 'react';
import usePortal from '../../Hooks/usePortal';
import ReactDOM from 'react-dom';
import { ICONS } from '../../img/icons/Icon';
import { useTheme } from 'styled-components';
import * as S from './ChartModal.styled';
import { H2, P } from '../../styles/StyledComponents/Typography';
import useOfficerId from '../../Hooks/useOfficerId';
import Button from '../Elements/Button';

export default function ChartModal({
  tableHeader,
  tableSubheader,
  agencyName,
  isOpen,
  closeModal,
  chartToPrintRef,
  fileName = 'chart.png',
  children,
}) {
  const theme = useTheme();
  const portalTarget = usePortal('chart-modal-root');
  const officerId = useOfficerId();

  // Close modal on "esc" press
  useEffect(() => {
    function _handleKeyUp(e) {
      if (e.key === 'Escape') {
        document.body.style.overflow = 'visible';
        closeModal();
      }
    }

    document.addEventListener('keyup', _handleKeyUp);
    return () => document.removeEventListener('keyup', _handleKeyUp);
  }, [closeModal]);

  const _getEntityReference = () => {
    if (officerId) return `for Officer ${officerId} of the ${agencyName}`;
    return `for ${agencyName}`;
  };

  const downloadChart = useCallback(() => {
    const link = document.createElement('a');
    link.download = fileName;
    link.href = chartToPrintRef.current.toBase64Image();
    link.click();
  });

  return ReactDOM.createPortal(
    isOpen && (
      <>
        <S.ModalUnderlay onClick={closeModal} />
        <S.ChartModal>
          <S.Header>
            <S.Heading>
              <H2>{tableHeader}</H2>
              <P> {_getEntityReference()}</P>
            </S.Heading>
            <S.CloseButton
              onClick={closeModal}
              icon={ICONS.close}
              fill={theme.colors.primary}
              width={42}
              height={42}
            />
          </S.Header>
          <S.Heading>
            <P>{tableSubheader}</P>
          </S.Heading>
          <S.Download>
            <Button variant="positive" {...S.ButtonInlines} onClick={downloadChart}>
              <S.Icon icon={ICONS.download} height={25} width={25} fill={theme.colors.white} />
              Download Graph
            </Button>
          </S.Download>
          {children}
        </S.ChartModal>
      </>
    ),
    portalTarget
  );
}
