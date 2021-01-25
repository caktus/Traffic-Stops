import styled from 'styled-components';
import FJIcon from 'img/icons/Icon';
import { H2 } from 'styles/StyledComponents/Typography';

export const ChartHeader = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

export const ChartTitle = styled(H2)``;

export const ButtonsWrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  width: 400px;
`;

export const Icon = styled(FJIcon)`
  margin-right: 1em;
`;

export const ButtonInlines = {
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  pr: '30px',
};
