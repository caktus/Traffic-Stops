import styled from 'styled-components';

export const SeeAllDepartments = styled.div`
  cursor: pointer;
  background: #fff;
  border-top: 1px solid;
  padding: 1em 2em;
  border-top-color: ${(props) => props.theme.colors.greySemi};
  display: flex;
  align-items: center;
  margin-bottom: 2rem;
`;

export const SeeAllText = styled.p`
  font-size: ${(props) => props.theme.fontSizes[2]};
  font-family: ${(props) => props.theme.fonts.body};
  color: ${(props) => props.theme.colors.primaryDark};
`;
