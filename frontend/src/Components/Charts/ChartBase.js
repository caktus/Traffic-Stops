import React from 'react';
import { ChartBaseStyled } from './ChartBase.styled';

function ChartBase({ children }) {
  return <ChartBaseStyled>{children}</ChartBaseStyled>;
}

export default ChartBase;
