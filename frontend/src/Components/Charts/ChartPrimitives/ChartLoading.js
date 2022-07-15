import React from 'react';
import ChartLoadingStyle from './ChartLoading.styled';

// Hooks
import useOfficerId from '../../../Hooks/useOfficerId';

function ChartLoading({ skeleton: Skeleton }) {
  const officerId = useOfficerId();

  return (
    <ChartLoadingStyle>
      <h3>Loading {officerId ? 'Officer' : 'Agency'} data...</h3>
      <Skeleton scale={2} />
    </ChartLoadingStyle>
  );
}

export default ChartLoading;
