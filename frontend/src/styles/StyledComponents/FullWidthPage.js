import React from 'react';
import * as S from './FullWidthPage.styled';

// Children
import Footer from '../../Components/Footer/Footer';

function FullWidthPage({ children }) {
  return (
    <S.FullWidthPage>
      <S.ResponsiveInnerPage>{children}</S.ResponsiveInnerPage>
      <Footer />
    </S.FullWidthPage>
  );
}

export default FullWidthPage;
