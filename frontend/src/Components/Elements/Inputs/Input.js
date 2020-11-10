import React from 'react';
import PropTypes from 'prop-types';
import * as Styled from './Input.styled';

// Icons
import QuestionMark from 'img/icons/question-mark';
console.log('questionmark: ', QuestionMark);
export const icons = {
  search: QuestionMark,
  calendar: QuestionMark,
};

export const iconPositions = {
  LEFT: 'left',
  RIGHT: 'right',
};

function Input({ label, iconPosition, Icon, invertIcon, required, optional, helpText, ...props }) {
  console.log('iconPosition: ', iconPosition);
  return (
    <Styled.Wrapper>
      {label && (
        <Styled.Label required={required} optional={optional}>
          {label}{' '}
          <span>
            {required && '(required)'}
            {optional && '(optional)'}
          </span>
        </Styled.Label>
      )}
      <Styled.InnerWrapper>
        {Icon && (
          <Styled.IconContainer iconPosition={iconPosition} invertIcon={invertIcon}>
            <Icon />
          </Styled.IconContainer>
        )}
        <Styled.Input {...props} iconPosition={iconPosition} />
      </Styled.InnerWrapper>
      {helpText && <Styled.HelpText>{helpText}</Styled.HelpText>}
    </Styled.Wrapper>
  );
}

Input.propTypes = {
  label: PropTypes.string,
  icon: PropTypes.oneOf(Object.values(icons)),
  iconPosition: PropTypes.oneOf(Object.values(iconPositions)),
  invertIcon: PropTypes.bool,
  required: PropTypes.bool,
  optional: PropTypes.bool,
};

Input.defaultProps = {
  iconPosition: iconPositions.RIGHT,
  invertIcon: false,
  required: false,
  optional: false,
};

export default Input;
