import React from 'react';
import PropTypes from 'prop-types';
import { useTheme } from 'styled-components';
import * as Styled from './Input.styled';

import Icon, { ICONS } from '../../../img/icons/Icon';
import { Input } from 'reaktus';
import { TextArea } from './Input.styled';

export const iconPositions = {
  LEFT: 'left',
  RIGHT: 'right',
};

function _renderIcon(inputRef, icon, { iconPosition, invertIcon, iconStyles }) {
  const theme = useTheme();
  return (
    <Styled.IconContainer style={iconStyles} invertIcon={invertIcon} iconPosition={iconPosition}>
      <Icon
        icon={icon}
        width="25px"
        height="25px"
        fill={invertIcon ? theme.colors.primary : theme.colors.white}
        onClick={() => inputRef?.current?.focus()}
      />
    </Styled.IconContainer>
  );
}

function FJInput({
  type = 'text',
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
  const inputRef = React.createRef();
  function _getPaddingProps(iconPos) {
    const paddingProps = {
      py: 2,
      px: 3,
    };
    if (iconPos === iconPositions.LEFT) {
      paddingProps['pl'] = 5;
    } else if (iconPos === iconPositions.RIGHT) {
      paddingProps['pr'] = 5;
    }
    return paddingProps;
  }

  if (type === 'textarea') {
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
        <TextArea {...props} />
        <Input.Errors errors={errors} />
        {helpText && <Styled.HelpText>{helpText}</Styled.HelpText>}
      </Styled.Wrapper>
    );
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
        type={type}
        ref={inputRef}
        icon={
          icon
            ? (iconProps) =>
                _renderIcon(inputRef, icon, {
                  ...iconProps,
                  iconPosition,
                  invertIcon,
                  iconStyles,
                })
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
  type: PropTypes.string,
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
  type: 'text',
};

export default FJInput;
