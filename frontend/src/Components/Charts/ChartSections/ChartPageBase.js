import React from 'react';
import * as S from './ChartPageBase.styled';

function ChartPageBase({ children, ...props }) {
  return <S.ChartPageBase {...props}>{children}</S.ChartPageBase>;
}

export default ChartPageBase;
