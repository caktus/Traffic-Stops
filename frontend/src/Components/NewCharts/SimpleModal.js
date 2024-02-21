import React, { useEffect } from 'react';
import { useTheme } from 'styled-components';
import usePortal from '../../Hooks/usePortal';
import ReactDOM from 'react-dom';
import * as S from '../Elements/Table/TableModal.styled';
import { H2, P } from '../../styles/StyledComponents/Typography';
import { ICONS } from '../../img/icons/Icon';

export default function SimpleModal({ heading, subheading, isOpen, closeModal, children }) {
  const theme = useTheme();
  const portalTarget = usePortal('modal-root');

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

  return ReactDOM.createPortal(
    isOpen && (
      <>
        <S.ModalUnderlay onClick={closeModal} />
        <S.TableModal>
          <S.Header>
            <S.Heading>
              <H2>{heading}</H2>
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
            <P>{subheading}</P>
          </S.Heading>

          {children}
        </S.TableModal>
      </>
    ),
    portalTarget
  );
}
