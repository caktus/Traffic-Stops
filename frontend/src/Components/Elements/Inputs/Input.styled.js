import styled from 'styled-components';

export const Wrapper = styled.div``;
export const Label = styled.label``;
export const Input = styled.input`
  border: 1px solid ${(props) => props.theme.colorPrimary};
  border-radius: ${props.theme.commonBorderRadius};
`;
