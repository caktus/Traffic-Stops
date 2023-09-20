import React from 'react';
import { useTheme } from 'styled-components';
import PropTypes from 'prop-types';
import * as S from './Legend.styled';
import { ICONS } from '../../../../img/icons/Icon';
import { WEIGHTS } from '../../../../styles/StyledComponents/Typography';

function Legend({ keys, onKeySelect, isStatic, showNonHispanic, heading, row = 'row' }) {
  const theme = useTheme();

  return (
    <S.Legend row={row}>
      {heading && <S.LegendHeading weight={WEIGHTS[1]}>{heading}</S.LegendHeading>}
      <S.KeysList row={row}>
        {keys?.map((key) => {
          const fill = key.selected ? theme.colors.ethnicGroup[key.value] : theme.colors.grey;
          const iconProps = {
            fill,
            width: 25,
            height: 25,
            // eslint-disable-next-line no-nested-ternary
            icon: isStatic
              ? ICONS.roundedBox
              : key.selected
              ? ICONS.checkboxFilled
              : ICONS.checkboxEmpty,
          };
          return (
            <S.Key
              key={key.value}
              isInteractive={onKeySelect}
              onClick={isStatic ? () => {} : () => onKeySelect(key)}
            >
              <S.Icon {...iconProps} />
              <S.KeyLabel selected={key.selected}>
                {key.label}
                {showNonHispanic && key.label !== 'Hispanic' && '*'}
              </S.KeyLabel>
            </S.Key>
          );
        })}
      </S.KeysList>
      {showNonHispanic && <S.Addendum>*Non-hispanic</S.Addendum>}
    </S.Legend>
  );
}

Legend.propTypes = {
  /** A list of keys to display, providing an internal value, a label, and a boolean 'selected' */
  keys: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      selected: PropTypes.bool,
    })
  ),
  /** [true] Indicate whether or not legend keys are interactive */
  isStatic: PropTypes.bool,
  /** If isStatic is false, provide a function to respond to key interaction */
  onKeySelect: PropTypes.func,
  showNonHispanic: PropTypes.bool,
  heading: PropTypes.string,
  row: PropTypes.bool,
};

Legend.defaultProps = {
  isStatic: false,
  showNonHispanic: false,
  row: false,
};

export default Legend;
