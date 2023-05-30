import React, { useEffect, useState } from 'react';
import { useTheme } from 'styled-components';
import usePortal from '../../Hooks/usePortal';
import ReactDOM from 'react-dom';
import * as S from '../Elements/Table/TableModal.styled';
import { H2, P } from '../../styles/StyledComponents/Typography';
import { ICONS } from '../../img/icons/Icon';
import Button from '../Elements/Button';
import TableSkeleton from '../Elements/Skeletons/TableSkeleton';
import Table from '../Elements/Table/Table';
import { CSVLink } from 'react-csv';

export default function NewModal({
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
  const [tableLoading, setLoading] = useState(false);

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
          <S.Heading>
            <P>{tableSubheader}</P>
          </S.Heading>

          <S.TableWrapper>
            {tableLoading ? (
              <TableSkeleton />
            ) : (
              <Table data={tableData} columns={columns} pageSize={10} paginated />
            )}
          </S.TableWrapper>
          <S.NonHispanic>* Non-hispanic</S.NonHispanic>
          {!tableLoading && (
            <S.Download>
              <CSVLink data={csvData} filename={tableDownloadName}>
                <Button variant="positive" {...S.ButtonInlines} onClick={() => {}}>
                  <S.Icon icon={ICONS.download} height={25} width={25} fill={theme.colors.white} />
                  Download Data
                </Button>
              </CSVLink>
            </S.Download>
          )}
        </S.TableModal>
      </>
    ),
    portalTarget
  );
}
