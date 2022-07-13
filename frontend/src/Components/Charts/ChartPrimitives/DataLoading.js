import React from 'react';
import { DataLoadingStyled } from './DataLoading.styled';

// Hooks
import useOfficerId from '../../../Hooks/useOfficerId';

// Children
import PieSkeleton from '../../Elements/Skeletons/PieSkeleton';

function DataLoading() {
  const officerId = useOfficerId();

  return (
    <DataLoadingStyled>
      <h3>Loading {officerId ? 'Officer' : 'Agency'} data...</h3>
      <PieSkeleton scale={2} />
    </DataLoadingStyled>
  );
}

export default DataLoading;
