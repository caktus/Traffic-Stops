import React from 'react';
import * as S from './OfficerBadge.styled';

function OfficerBadge({ officerId }) {
  return (
    <S.OfficerBadge>
      <S.Text>Officer {officerId}</S.Text>
    </S.OfficerBadge>
  );
}

export default OfficerBadge;
