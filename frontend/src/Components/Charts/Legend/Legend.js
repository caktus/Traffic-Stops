import React from 'react';
import { useTheme } from 'styled-components';
import PropTypes from 'prop-types';
import { LegendStyled, LegendItem } from './Legend.styled';
import SvgCircle from './SvgCircle';
import toTitleCase from '../../../util/toTitleCase';

function Legend({ keysToShow, groupKeys, getLabelFromKey, handleLegendKeyClick }) {
  const theme = useTheme();
  return (
    <LegendStyled>
      {groupKeys.map((key) => {
        const label = getLabelFromKey ? getLabelFromKey(key) : key;
        const filled = keysToShow.includes(key);
        return (
          <LegendItem key={key} onClick={() => handleLegendKeyClick(key)}>
            <SvgCircle color={theme.colors.ethnicGroup[key]} filled={filled} />
            <p>{label}</p>
          </LegendItem>
        );
      })}
    </LegendStyled>
  );
}

Legend.propTypes = {
  keysToShow: PropTypes.array.isRequired,
  groupKeys: PropTypes.array.isRequired,
  handleLegendKeyClick: PropTypes.func.isRequired,
  getLabelFromKey: PropTypes.func,
};

export default Legend;
