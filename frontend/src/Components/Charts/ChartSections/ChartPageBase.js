import React from 'react';
import * as S from './ChartPageBase.styled';

// Children
import Footer from 'Components/Footer/Footer';

function ChartPageBase({ children, ...props }) {
  return (
    <S.ChartPageBase {...props}>
      <S.ChartPageContent>{children}</S.ChartPageContent>
      <Footer />
    </S.ChartPageBase>
  );
}

export default ChartPageBase;
