import React from 'react';
import PropTypes from 'prop-types';
import { useTheme } from 'styled-components';
import * as Styled from './Input.styled';

import Icon, { ICONS } from 'img/icons/Icon';
import { Input } from 'reaktus';

export const iconPositions = {
  LEFT: 'left',
  RIGHT: 'right',
};

function _renderIcon(icon, { iconPosition, invertIcon, iconStyles }) {
  const theme = useTheme();
  return (
    <Styled.IconContainer style={iconStyles} invertIcon={invertIcon} iconPosition={iconPosition}>
      <Icon
        icon={icon}
        width="25px"
        height="25px"
        fill={invertIcon ? theme.colors.primary : theme.colors.white}
      />
    </Styled.IconContainer>
  );
}

function FJInput({
  label,
  errors = [],
  loading,
  icon,
  iconPosition,
  invertIcon,
  iconStyles,
  required,
  optional,
  helpText,
  ...props
}) {
  function _getPaddingProps(iconPosition) {
    const paddingProps = {
      py: 2,
      px: 3,
    };
    if (iconPosition === iconPositions.LEFT) {
      paddingProps['pl'] = 5;
    } else if (iconPosition === iconPositions.RIGHT) {
      paddingProps['pr'] = 5;
    }
    return paddingProps;
  }

  return (
    <Styled.Wrapper>
      {label && (
        <Input.Label errors={errors} py="2">
          {label}{' '}
          <Styled.LableSpan required={required} optional={optional}>
            {required && '(required)'}
            {optional && '(optional)'}
          </Styled.LableSpan>
        </Input.Label>
      )}
      <Input
        type="text"
        icon={
          icon
            ? (iconProps) =>
                _renderIcon(icon, { ...iconProps, iconPosition, invertIcon, iconStyles })
            : null
        }
        errors={errors}
        {..._getPaddingProps(iconPosition)}
        color="text"
        border="standard"
        borderColor="primary"
        borderRadius="standard"
        fontSize="2"
        {...props}
      />
      <Input.Errors errors={errors} />
      {helpText && <Styled.HelpText>{helpText}</Styled.HelpText>}
    </Styled.Wrapper>
  );
}

FJInput.propTypes = {
  label: PropTypes.string,
  icon: PropTypes.oneOf(Object.values(ICONS)),
  iconPosition: PropTypes.oneOf(Object.values(iconPositions)),
  invertIcon: PropTypes.bool,
  required: PropTypes.bool,
  optional: PropTypes.bool,
  onChange: PropTypes.func,
};

FJInput.defaultProps = {
  invertIcon: false,
  required: false,
  optional: false,
};

export default FJInput;
