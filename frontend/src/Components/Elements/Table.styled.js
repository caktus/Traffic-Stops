import styled from 'styled-components';

export const TableWrapper = styled.div`
  width: 100%;
  max-width: 1000px;
`;

export const Table = styled.table`
  margin: 0 auto;
  border-spacing: 0;
`;

export const THead = styled.thead`
  background: #ddd;
`;

export const TH = styled.th`
  padding: 1.5rem;
`;

export const TBody = styled.tbody``;

export const TR = styled.tr`
  &:nth-child(even) {
    background: #ddd;
  }
`;

export const TD = styled.td`
  padding: 1rem;
`;
