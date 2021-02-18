import React from 'react';
import * as S from './TablePagination.styled';
import { useTheme } from 'styled-components';

import range from 'lodash.range';
import Icon, { ICONS } from 'img/icons/Icon';

function TablePagination({
  canPreviousPage,
  canNextPage,
  pageCount,
  gotoPage,
  nextPage,
  previousPage,
  state: { pageIndex },
}) {
  const theme = useTheme();

  return (
    <S.Pagination className="pagination">
      <S.Arrow onClick={() => previousPage()} disabled={!canPreviousPage}>
        <Icon
          icon={ICONS.chevronLeft}
          fill={canPreviousPage ? theme.colors.primary : theme.colors.greySemi}
          width={32}
          height={32}
        />
      </S.Arrow>
      <S.PagesList>
        {range(0, pageCount).map((p) => (
          <S.PageNumber
            key={p}
            onClick={() => gotoPage(p)}
            disabled={p === pageIndex}
            current={p === pageIndex}
          >
            {p + 1}
          </S.PageNumber>
        ))}
      </S.PagesList>
      <S.Arrow onClick={() => nextPage()} disabled={!canNextPage}>
        <Icon
          icon={ICONS.chevronRight}
          fill={canNextPage ? theme.colors.primary : theme.colors.greySemi}
          width={32}
          height={32}
        />
      </S.Arrow>
    </S.Pagination>
  );
}

export default TablePagination;
