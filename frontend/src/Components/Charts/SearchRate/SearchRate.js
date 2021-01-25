import React from 'react';
import * as S from './SearchRate.styled';

// Children
import ChartHeader from 'Components/Charts/ChartSections/ChartHeader';

function SearchRate() {
  const handleViewData = () => {
    alert('view data');
  };

  const handleShareGraph = () => {
    alert('share graph');
  };

  return (
    <S.SearchRate>
      <ChartHeader
        chartTitle="Search Rate"
        handleViewData={handleViewData}
        handleShareGraph={handleShareGraph}
      />
    </S.SearchRate>
  );
}

export default SearchRate;
