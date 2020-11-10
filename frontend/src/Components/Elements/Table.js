import React from 'react';
import * as Styled from './Table.styled';

// Deps
import { useTable, usePagination } from 'react-table';

function Table({ columns, data = [], paginate }) {
  const { getTableProps, getTableBodyProps, headerGroups, prepareRow, rows } = useTable({
    columns,
    data,
  });

  return (
    <Styled.TableWrapper>
      <Styled.Table {...getTableProps()}>
        <Styled.THead>
          {headerGroups.map((headerGroup) => (
            <Styled.TR {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map((column) => (
                <Styled.TH {...column.getHeaderProps()}>{column.render('Header')}</Styled.TH>
              ))}
            </Styled.TR>
          ))}
        </Styled.THead>

        <Styled.TBody {...getTableBodyProps()}>
          {rows.map((row, i) => {
            prepareRow(row);
            return (
              <Styled.TR {...row.getRowProps()}>
                {row.cells.map((cell) => (
                  <Styled.TD {...cell.getCellProps()}>{cell.render('Cell')}</Styled.TD>
                ))}
              </Styled.TR>
            );
          })}
        </Styled.TBody>
      </Styled.Table>
    </Styled.TableWrapper>
  );
}

export default Table;
