import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useTheme } from 'styled-components';
import { CSVLink } from 'react-csv';

import usePortal from '../../Hooks/usePortal';
import * as S from '../Elements/Table/TableModal.styled';
import { H2, P } from '../../styles/StyledComponents/Typography';
import { ICONS } from '../../img/icons/Icon';
import Button from '../Elements/Button';
import Table from '../Elements/Table/Table';
import * as DS from './AgencyDisparities.styled';

// Modal shown for a disparities visual's underlying data. Mirrors the shared
// NewModal pattern (paginated table + CSV download) but uses a wider container
// because the disparity tables carry more columns than the rest of the site.
export default function DisparityTableModal({
  tableHeader,
  tableSubheader,
  tableData,
  csvData,
  columns,
  tableDownloadName,
  isOpen,
  closeModal,
}) {
  const theme = useTheme();
  const portalTarget = usePortal('modal-root');

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

  // suppress body scrolling behind modal
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }

    // eslint-disable-next-line no-return-assign
    return () => (document.body.style.overflow = 'visible');
  }, [isOpen]);

  return ReactDOM.createPortal(
    isOpen && (
      <>
        <S.ModalUnderlay onClick={closeModal} />
        <DS.WideModal>
          <S.Header>
            <S.Heading>
              <H2>{tableHeader}</H2>
            </S.Heading>
            <S.CloseButton
              onClick={closeModal}
              icon={ICONS.close}
              fill={theme.colors.primary}
              width={42}
              height={42}
            />
          </S.Header>
          {tableSubheader && (
            <S.Heading>
              <P>{tableSubheader}</P>
            </S.Heading>
          )}

          <S.TableWrapper>
            <Table data={tableData} columns={columns} pageSize={15} paginated sortable />
          </S.TableWrapper>

          <S.Download>
            <CSVLink data={csvData} filename={tableDownloadName}>
              <Button variant="positive" {...S.ButtonInlines} onClick={() => {}}>
                <S.Icon icon={ICONS.download} height={25} width={25} fill={theme.colors.white} />
                Download Data
              </Button>
            </CSVLink>
          </S.Download>
        </DS.WideModal>
      </>
    ),
    portalTarget
  );
}
