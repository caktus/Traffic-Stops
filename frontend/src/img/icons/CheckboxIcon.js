import React from 'react';
import PropTypes from 'prop-types';
import Icon, { ICONS } from './Icon';

function CheckboxIcon({ checked, fill, ...props }) {
  return (
    <Icon
      height={`${props.height || 18}px`}
      width={`${props.width || 18}px`}
      marginRight={`${props.marginRight || 0}px`}
      icon={`${checked ? ICONS.checkboxFilled : ICONS.checkboxEmpty}`}
      // fill={checked ? fill : props.theme.colors.grey}
      fill={fill}
      {...props}
    />
  );
}

CheckboxIcon.propTypes = {
  checked: PropTypes.bool,
  fill: PropTypes.string,
};

CheckboxIcon.defaultProps = {
  checked: false,
  fill: '#000',
};

export default CheckboxIcon;
