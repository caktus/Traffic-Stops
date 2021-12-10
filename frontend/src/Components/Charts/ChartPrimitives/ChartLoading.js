import React from 'react';
import * as S from './ChartLoading.styled';

// Hooks
import useOfficerId from 'Hooks/useOfficerId';

function ChartLoading({ skeleton: Skeleton }) {
  const officerId = useOfficerId();

  return (
    <S.ChartLoading>
      <h3>Loading {officerId ? "Officer" : "Agency"} data...</h3>
      <Skeleton scale={2} />
    </S.ChartLoading>
  );
}

export default ChartLoading;
