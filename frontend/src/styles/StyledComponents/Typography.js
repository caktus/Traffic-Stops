import styled from 'styled-components';
import PropTypes from 'prop-types';

export const H1 = styled.h1`
  font-family: ${(props) => props.theme.fonts.heading};
  font-weight: 400;
  font-size: 48px;
  margin: 0.5em 0;
  color: ${(props) => props.theme.colors.text};
  text-transform: uppercase;
`;

export const H1point5 = styled.h2`
  font-family: ${(props) => props.theme.fonts.heading};
  font-weight: 400;
  font-size: 31px;
  color: ${(props) => props.theme.colors.text};
  text-transform: uppercase;
`;

export const H2 = styled.h2`
  font-family: ${(props) => props.theme.fonts.heading};
  font-weight: 400;
  font-size: 26px;
  color: ${(props) => props.theme.colors.text};
  text-transform: uppercase;
`;

export const H4 = styled.h4`
  font-family: ${(props) => props.theme.fonts.body};
  font-weight: 700;
  font-size: 18px;
  color: ${(props) => props.theme.colors.text};
`;

export const Legend = styled.legend`
  font-family: ${(props) => props.theme.fonts.body};
  font-weight: 700;
  font-size: 21px;
  color: ${(props) => props.theme.colors.text};
`;

export const SIZES = ['16', '18'];
export const COLORS = ['light', 'dark'];
export const WEIGHTS = ['normal', 'bold'];

export const P = styled.p`
  font-family: ${(props) => props.theme.fonts.body};
  font-weight: ${(props) => props.weight};
  font-size: ${(props) => props.size}px;
  line-height: ${(props) => (props.size === SIZES[0] ? '28px' : '32px')};
  color: ${(props) =>
    props.color === COLORS[1] ? props.theme.colors.text : props.theme.colors.textLight};
`;

P.propTypes = {
  size: PropTypes.oneOf(SIZES),
  color: PropTypes.oneOf(COLORS),
  weight: PropTypes.oneOf(WEIGHTS),
};

P.defaultProps = {
  size: SIZES[0],
  color: COLORS[1],
  weight: WEIGHTS[0],
};
