import React from 'react';
import PropTypes from 'prop-types';

export const ICONS = {
  arrowUp: 'arrow-up',
  arrowDown: 'arrow-down',
  arrowRight: 'arrow-right',
  arrowLeft: 'arrow-left',
  calendar: 'calendar',
  checkboxEmpty: 'checkbox-empty',
  checkboxFilled: 'checkbox-filled',
  chevronLeft: 'chevron-left',
  chevronRight: 'chevron-right',
  close: 'close',
  download: 'download',
  externalLink: 'external-link',
  info: 'info',
  roundedBox: 'rounded-box',
  search: 'search',
  share: 'share',
  view: 'view',
};

function Icon({ icon, fill, ...props }) {
  return (
    <svg {...props}>
      <use href={`#${icon}`} fill={fill} />
    </svg>
  );
}

Icon.propTypes = {
  icon: PropTypes.oneOf(Object.values(ICONS)).isRequired,
  fill: PropTypes.string,
};

Icon.defaultProps = {
  fill: '#000',
};

export default Icon;
