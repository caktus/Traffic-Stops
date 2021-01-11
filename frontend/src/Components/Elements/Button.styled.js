import styled from 'styled-components';

export const ButtonStyled = styled.button`
  padding: 0.5rem 1rem;
  font-weight: bold;
  font-size: 1.2rem;

  background: ${(props) => props.theme.colors.white};
  border: ${(props) => props.theme.borders.toolTip};

  border-radius: ${(props) => props.theme.toolTipBorderRadius};

  color: ${(props) => props.theme.colorPrimary};

  &:active {
    background: ${(props) => props.theme.colorPrimary};
    color: ${(props) => props.theme.colors.white};
  }

  transition: all 0.08s linear;
`;
