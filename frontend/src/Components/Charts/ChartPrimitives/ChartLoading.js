import React from 'react';
import { ChartLoadingStyled } from './ChartLoading.styled';

function ChartLoading({ pastDelay }) {
  if (pastDelay) {
    return (
      <ChartLoadingStyled>
        <p>ChartLoading</p>
      </ChartLoadingStyled>
    );
  } else {
    return null;
  }
}

export default ChartLoading;
