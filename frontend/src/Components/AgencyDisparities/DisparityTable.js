import React from 'react';

import * as S from './AgencyDisparities.styled';

// Collapsible data table shown under a chart or map. `columns` is an array of
// { key, label, numeric, format } describing each column; `rows` are the same
// records the visual already fetched via useDisparityData.
export default function DisparityTable({ rows, columns }) {
  if (!rows || !rows.length) return null;

  return (
    <S.TableDisclosure>
      <S.TableSummary>View data table ({rows.length})</S.TableSummary>
      <S.TableScroll>
        <S.Table>
          <thead>
            <tr>
              {columns.map((col) => (
                <S.Th key={col.key} numeric={col.numeric}>
                  {col.label}
                </S.Th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                {columns.map((col) => {
                  const content = col.format ? col.format(row[col.key], row) : row[col.key];
                  return (
                    <S.Td key={col.key} numeric={col.numeric}>
                      {col.link ? <S.TableLink to={col.link(row)}>{content}</S.TableLink> : content}
                    </S.Td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </S.Table>
      </S.TableScroll>
    </S.TableDisclosure>
  );
}
