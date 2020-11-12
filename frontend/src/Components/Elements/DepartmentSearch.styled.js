import styled from 'styled-components';

export const SeeAllDepartments = styled.div`
  border-top: 1px solid ${(props) => props.theme.colorGrey};
  cursor: pointer;
`;

export const SeeAllText = styled.p`
  ${(props) => props.theme.fontBody18}
`;
