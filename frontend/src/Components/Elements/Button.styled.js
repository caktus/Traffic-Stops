import styled from 'styled-components';

export const ButtonStyled = styled.button`
  padding: 0.5rem 1rem;
  font-weight: bold;
  font-size: 1.2rem;

  background: ${(props) => props.theme.colorWhite};
  border: ${(props) => props.theme.toolTipBorder};
  border-radius: ${(props) => props.theme.toolTipBorderRadius};

  color: ${(props) => props.theme.colorPrimary};

  &:active {
    background: ${(props) => props.theme.colorPrimary};
    color: ${(props) => props.theme.colorWhite};
  }

  transition: all 0.08s linear;
`;
