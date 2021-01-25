import React from 'react';
import PropTypes from 'prop-types';
// import { SvgCircleStyled } from './SvgCircle.styled';

function SvgCircle({ color, filled }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 32 32" height="20px" width="20px">
      <circle cx="16" cy="16" r="10" stroke={color} strokeWidth="6" fill={filled ? color : "none"} />
    </svg> 
  );
}

SvgCircle.propTypes = {
  color: PropTypes.string,
  filled: PropTypes.bool,
};

SvgCircle.defaultProps = {
  color: "#111",
  filled: true
};

export default SvgCircle;
