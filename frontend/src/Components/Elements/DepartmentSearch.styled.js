import styled from 'styled-components';

export const SeeAllDepartments = styled.div`
  border-top: 1px solid ${(props) => props.theme.colorGrey};
`;

export const SeeAllText = styled.p`
  ${(props) => props.theme.fontBody18}
  z-index: 15;
  cursor: pointer;
  padding: 1rem;
`;
