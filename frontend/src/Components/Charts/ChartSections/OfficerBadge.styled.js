import styled from 'styled-components';

export const OfficerBadge = styled.div`
  background: ${(p) => p.theme.colors.purple};
  padding: 0.5em 1.5em;
  border-radius: 30px;
`;

export const Text = styled.span`
  color: ${(p) => p.theme.colors.white};
  font-size: 14px;
`;
