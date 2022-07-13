import React from 'react';
import * as S from './ChartPageBase.styled';
import Footer from '../../Footer/Footer';

// Children

function ChartPageBase({ children, ...props }) {
  return (
    <S.ChartPageBase {...props}>
      <S.ChartPageContent>{children}</S.ChartPageContent>
      <Footer />
    </S.ChartPageBase>
  );
}

export default ChartPageBase;
