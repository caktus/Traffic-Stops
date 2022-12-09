import React from 'react';
import * as S from './DataSubsetPicker.styled';

// Children
import Dropdown from '../../../Elements/Dropdown/Dropdown';
import { SIZES, COLORS, WEIGHTS } from '../../../../styles/StyledComponents/Typography';

function DataSubsetPicker({ options, value, onChange, label, dropUp, dropDown }) {
  return (
    <S.DataSubsetPicker>
      {label && (
        <S.Label size={SIZES[0]} color={COLORS[1]} weight={WEIGHTS[1]}>
          {label}
        </S.Label>
      )}
      <Dropdown
        value={value}
        onChange={onChange}
        options={options}
        dropUp={dropUp}
        dropDown={dropDown}
      />
    </S.DataSubsetPicker>
  );
}

export default DataSubsetPicker;
