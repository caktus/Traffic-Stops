import React from 'react';
import * as S from './Table.styled';
import { useTheme } from 'styled-components';

// Deps
import { useTable, usePagination, useSortBy } from 'react-table';
import { format } from 'date-fns';

// Constants
import { ICONS } from 'img/icons/Icon';

// Children
import TablePagination from './TablePagination';

function Table({ columns, data = [], intitialTableState, paginated, sortable }) {
  const theme = useTheme();
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    page,
    ...paginationProps
  } = useTable(
    {
      columns,
      data,
      initialState: { pageIndex: 0, pageSize: 15, ...intitialTableState },
    },
    sortable ? useSortBy : '',
    paginated ? usePagination : ''
  );

  return (
    <S.TableWrapper>
      {paginated && <TablePagination {...paginationProps} dataLength={data.length} />}
      <S.Table {...getTableProps()}>
        <S.THead>
          {headerGroups.map((headerGroup) => (
            <S.THR {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map((column) => (
                <S.TH {...column.getHeaderProps(column.getSortByToggleProps())}>
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
          {page.map((row, i) => {
            prepareRow(row);
            return (
              <S.TR {...row.getRowProps()}>
                {row.cells.map((cell) => {
                  if (cell.column.id === 'officer_id') return <OfficerId cell={cell} />;
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

export default Table;

function OfficerId({ cell }) {
  const theme = useTheme();
  return (
    <S.OfficerId onClick={() => alert(`Go to Officer ${cell.value}`)}>
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
