import styled, { css } from 'styled-components';

export const Wrapper = styled.div``;

export const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-size: 14px;
  font-weight: 500;
  span {
    font-weight: normal;
    color: ${(props) => {
      if (props.required) return props.theme.colorErrorLight;
      if (props.optional) return props.theme.colorGrey;
    }};
  }
`;

export const Input = styled.input`
  width: 100%;
  border: 1px solid ${(props) => props.theme.colorPrimary};
  border-radius: ${(props) => props.theme.commonBorderRadius};
  font-family: ${(props) => props.theme.fontBody};
  font-size: 16px;
  color: ${(props) => props.theme.colorBlack};
  padding-right: 0.5rem;
  padding-left: ${(props) => (props.icon ? '2rem' : '1rem')};
  height: 48px;

  ${(props) => {
    if (props.iconPosition === 'left') {
      return css`
        padding-right: 0.5rem;
        padding-left: 4rem;
      `;
    }
    if (props.iconPosition === 'right') {
      return css`
        padding-left: 0.5rem;
        padding-right: 4rem;
      `;
    }
  }}

  &:focus {
    outline-color: ${(props) => props.theme.colorSecondary};
    outline-offset: 1px;
  }
`;

export const InnerWrapper = styled.div`
  position: relative;
`;

export const IconContainer = styled.div`
  position: absolute;
  background: ${(props) => (props.invertIcon ? props.theme.colorWhite : props.theme.colorPrimary)};
  margin-top: 1px;
  height: 46px;
  width: 46px;

  ${(props) => {
    if (props.iconPosition === 'left') {
      return css`
        left: 0;
        margin-left: 1px;
        border-top-left-radius: 5px;
        border-bottom-left-radius: 5px;
      `;
    }

    if (props.iconPosition === 'right') {
      return css`
        right: 0;
        margin-right: 1px;
        border-top-right-radius: 5px;
        border-bottom-right-radius: 5px;
      `;
    }
  }}

  svg {
    fill: ${(props) => (props.invertIcon ? props.theme.colorPrimary : props.theme.colorWhite)};
  }
`;

export const HelpText = styled.p`
  font-size: 16px;
  color: ${(props) => props.theme.colorGrey};
  margin-top: 0.5rem;
`;
