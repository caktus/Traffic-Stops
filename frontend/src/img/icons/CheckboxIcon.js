import React from 'react';
import PropTypes from 'prop-types';
import Icon, { ICONS } from 'img/icons/Icon';

function CheckboxIcon({ checked, fill, ...props }) {
  return (
    <Icon
      height="18px"
      width="18px"
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
