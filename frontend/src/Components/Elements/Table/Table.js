import React from 'react';
import * as S from './Table.styled';
import { useTheme } from 'styled-components';

// Deps
import { useTable, usePagination, useSortBy } from 'react-table';
import { format } from 'date-fns';

// Constants
import { ICONS } from '../../../img/icons/Icon';

// Children
import TablePagination from './TablePagination';

function Table({
  columns,
  data = [],
  datasetName,
  initialTableState,
  paginated,
  sortable,
  handleOfficerIdSelected,
  pageSize,
}) {
  const theme = useTheme();
  const { getTableProps, getTableBodyProps, headerGroups, prepareRow, page, ...paginationProps } =
    useTable(
      {
        columns,
        data,
        initialState: { pageIndex: 0, pageSize, ...initialTableState },
      },
      sortable ? useSortBy : '',
      paginated ? usePagination : ''
    );

  const displayMissingPhrase = (ds) => {
    let phrase = {
      STOPS: 'stops have',
      SEARCHES: 'searches have',
      STOPS_BY_REASON: 'stops have',
      SEARCHES_BY_TYPE: 'searches have',
      USE_OF_FORCE: 'use of force has',
      CONTRABAND_HIT_RATE: 'contraband has',
      LIKELIHOOD_OF_SEARCH: 'searches have',
    }[ds];
    if (phrase === undefined && Array.isArray(ds)) {
      phrase = 'searches have';
    }
    if (!phrase) {
      phrase = 'data has';
    }
    return `No ${phrase} been reported`;
  };

  return (
    <S.TableWrapper>
      {paginated && <TablePagination {...paginationProps} dataLength={data.length} />}
      <S.Table {...getTableProps()}>
        <S.THead>
          {headerGroups.map((headerGroup) => (
            <S.THR {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map((column) => (
                <S.TH
                  {...column.getHeaderProps(
                    column.getSortByToggleProps && column.getSortByToggleProps()
                  )}
                >
                  <S.THInner>
                    {column.render('Header')}
                    {column.canSort && (
                      <S.SortingIcons>
                        <S.SortingIcon
                          icon={ICONS.arrowUp}
                          width={25}
                          height={25}
                          fill={
                            column.isSorted && !column.isSortedDesc
                              ? theme.colors.primaryDark
                              : theme.colors.greySemi
                          }
                        />
                        <S.SortingIcon
                          icon={ICONS.arrowDown}
                          width={25}
                          height={25}
                          fill={
                            column.isSorted && column.isSortedDesc
                              ? theme.colors.primaryDark
                              : theme.colors.greySemi
                          }
                        />
                      </S.SortingIcons>
                    )}
                  </S.THInner>
                </S.TH>
              ))}
            </S.THR>
          ))}
        </S.THead>

        <S.TBody {...getTableBodyProps()}>
          {page.map((row) => {
            prepareRow(row);
            if (row.original.no_data === true) {
              const offsetPurpose = row.original.purpose ? 3 : 2;
              const fillerCells = Array(row.cells.length - offsetPurpose).fill(0);
              return (
                <S.TR>
                  <S.TD>{row.original.year}</S.TD>
                  {row.original.purpose && <S.TD>{row.original.purpose}</S.TD>}
                  <S.TDBold>{displayMissingPhrase(datasetName)}</S.TDBold>
                  {/* eslint-disable-next-line no-unused-vars */}
                  {fillerCells.map((_) => (
                    <S.TD />
                  ))}
                </S.TR>
              );
            }
            return (
              <S.TR {...row.getRowProps()}>
                {row.cells.map((cell) => {
                  if (cell.column.id === 'officer_id')
                    return (
                      <OfficerId cell={cell} handleOfficerIdSelected={handleOfficerIdSelected} />
                    );
                  if (cell.column.id === 'date') return <DateTime cell={cell} />;
                  return <S.TD {...cell.getCellProps()}>{cell.render('Cell')}</S.TD>;
                })}
              </S.TR>
            );
          })}
        </S.TBody>
      </S.Table>
      {paginated && <TablePagination {...paginationProps} dataLength={data.length} />}
    </S.TableWrapper>
  );
}

Table.defaultProps = {
  pageSize: 15,
};

export default Table;

function OfficerId({ cell, handleOfficerIdSelected }) {
  const theme = useTheme();
  return (
    <S.OfficerId onClick={() => handleOfficerIdSelected(cell.value)}>
      {cell.value}
      <S.OfficerIdIcon
        icon={ICONS.arrowRight}
        fill={theme.colors.primaryDark}
        width={25}
        height={25}
      />
    </S.OfficerId>
  );
}

function DateTime({ cell }) {
  return (
    <S.DateTime>
      <S.Date>{format(new Date(cell.value), 'M/d/y')}</S.Date>
      <S.Time>{format(new Date(cell.value), "h:mm aaaaa'm'")}</S.Time>
    </S.DateTime>
  );
}
