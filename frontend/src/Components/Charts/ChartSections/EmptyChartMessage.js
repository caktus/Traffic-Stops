import React from 'react';
import * as S from './ChartsCommon.styled';

export function EmptyMessage() {
  return (
    <S.LegendBelow>
      <S.ChartWarning>NO DATA AVAILABLE</S.ChartWarning>
    </S.LegendBelow>
  );
}

function EmptyChartMessage({ data }) {
  if (data instanceof Array && data.length > 0) {
    // For charts that have a list of data
    if (data[0].hasOwnProperty('data')) {
      if (data.every((arr) => arr.data.length === 0)) {
        return <EmptyMessage />;
      }
      // For charts that have a list of data but all y values are 0
      if (data.every((arr) => arr.data.every((a) => a.y === 0))) {
        return <EmptyMessage />;
      }
    }
    // For charts that show data by 'y' values
    else if (data[0].hasOwnProperty('y')) {
      if (data.every((arr) => arr.y === 0)) {
        return <EmptyMessage />;
      }
    }
  }
  return '';
}

export default EmptyChartMessage;
