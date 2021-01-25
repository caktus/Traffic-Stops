import React from 'react';
import * as S from './Contraband.styled';

// Children
import ChartHeader from 'Components/Charts/ChartSections/ChartHeader';

function Contraband() {
  const handleViewData = () => {
    alert('view data');
  };

  const handleShareGraph = () => {
    alert('share graph');
  };

  return (
    <S.Contraband>
      <ChartHeader
        chartTitle="Contraband"
        handleViewData={handleViewData}
        handleShareGraph={handleShareGraph}
      />
    </S.Contraband>
  );
}

export default Contraband;
