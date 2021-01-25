import React from 'react';
import * as S from './UseOfForce.styled';

// Children
import ChartHeader from 'Components/Charts/ChartSections/ChartHeader';

function UseOfForce() {
  const handleViewData = () => {
    alert('view data');
  };

  const handleShareGraph = () => {
    alert('share graph');
  };

  return (
    <S.UseOfForce>
      <ChartHeader
        chartTitle="Use of Force"
        handleViewData={handleViewData}
        handleShareGraph={handleShareGraph}
      />
    </S.UseOfForce>
  );
}

export default UseOfForce;
