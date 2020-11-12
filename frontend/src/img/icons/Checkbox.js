import React from 'react';
import PropTypes from 'prop-types';
import Icon, { ICONS } from 'img/icons/Icon';

function Checkbox({ checked, fill , ...props }) {
  return (
    <Icon
      icon={`${checked ? ICONS.checkboxFilled : ICONS.checkboxEmpty}`}
      fill={checked ? fill : props.theme.colorGrey }
      {...props}
    />
  );
}

Checkbox.propTypes = {
  checked: PropTypes.bool,
  fill: PropTypes.string,
}

Checkbox.defaultProps = {
  checked: false,
  fill: "#000"
}


export default Checkbox;
