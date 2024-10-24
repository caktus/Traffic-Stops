import styled, { css } from 'styled-components';

export const TextArea = styled.textarea`
  width: 100%;
  outline: none;
  border: 1px solid;
  border-color: #272973;
  border-radius: 6px;
  padding-top: 8px;
  padding-bottom: 8px;
  padding-left: 16px;
  padding-right: 16px;
  font-size: 18px;
  font-family: inherit;
  color: black;
`;

export const Wrapper = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
`;

export const LableSpan = styled.span`
  font-weight: normal;
  color: ${(props) => {
    if (props.required) return props.theme.colors.caution;
    if (props.optional) return props.theme.colors.grey;
    return 'black';
  }};
`;

export const IconContainer = styled.div`
  position: absolute;
  pointer-events: auto;
  background: ${(props) =>
    props.invertIcon ? props.theme.colors.white : props.theme.colors.primary};
  height: 100%;
  width: 45px;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid;
  cursor: pointer;

  ${(props) => {
    if (props.iconPosition === 'left') {
      return css`
        left: 0;
        border-right: none;
        border-top-left-radius: 6px;
        border-bottom-left-radius: 6px;
      `;
    }

    if (props.iconPosition === 'right') {
      return css`
        right: 0;
        border-left: none;
        border-top-right-radius: 6px;
        border-bottom-right-radius: 6px;
      `;
    }
    return '';
  }}
  svg {
    fill: ${(props) => (props.invertIcon ? props.theme.colors.primary : props.theme.colors.white)};
  }
`;

export const HelpText = styled.p`
  font-size: 16px;
  color: ${(props) => props.theme.colorGrey};
  margin-top: 0.5rem;
`;
