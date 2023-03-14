import styled from 'styled-components';
import FJIcon from '../../../img/icons/Icon';

export const TableWrapper = styled.div`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
`;

export const Table = styled.table`
  border-spacing: 0;
  width: 100%;
  margin: 1em 0;
`;

export const THead = styled.thead`
  background: ${(props) => props.theme.colors.white};
`;

export const THR = styled.tr`
  background: ${(props) => props.theme.colors.white};
`;

export const SortingIcons = styled.div`
  display: flex;
  flex-direction: column;
`;

export const SortingIcon = styled(FJIcon)`
  margin: -5px 0;
`;

export const TH = styled.th`
  text-align: left;
  padding: 1rem;
`;

export const THInner = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  max-width: 75px;
`;

export const OfficerIdIcon = styled(FJIcon)`
  margin-left: 0.5em;
`;

export const TBody = styled.tbody``;

export const TR = styled.tr`
  &:nth-child(odd) {
    background: ${(props) => props.theme.colors.greyLight};
  }

  font-size: 14px;
  font-family: ${(props) => props.theme.fonts.body};
  font-weight: 400;
  color: ${(props) => props.theme.colors.black};
`;

export const TD = styled.td`
  padding: 1rem;
`;

export const TDBold = styled.td`
  padding: 1rem;
  font-weight: bold;
`;

export const OfficerId = styled.p`
  display: flex;
  flex-direction: row;
  justify-content: space-around;
  align-items: center;
  min-width: 35px;
  padding: 1rem;
  font-family: ${(props) => props.theme.fonts.body};
  font-size: 18px;
  color: ${(props) => props.theme.colors.primaryDark};
  cursor: pointer;
`;

export const DateTime = styled.div`
  display: flex;
  flex-direction: row;
  padding: 1rem;
`;

export const Date = styled.p``;

export const Time = styled.span`
  color: ${(props) => props.theme.colors.textLight};
  margin-left: 30px;
`;
