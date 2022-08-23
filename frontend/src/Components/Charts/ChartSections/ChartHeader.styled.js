import styled from 'styled-components';
import FJIcon from '../../../img/icons/Icon';
import { H2 } from '../../../styles/StyledComponents/Typography';
import { phoneOnly } from '../../../styles/breakpoints';

export const ChartHeader = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;

  @media (${phoneOnly}) {
    flex-direction: column;
  }
`;

export const TitleWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
`;

export const ChartTitle = styled(H2)`
  margin-right: 2em;
  @media (${phoneOnly}) {
    margin: 0;
  }
`;

export const ButtonsWrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  width: 400px;
  gap: 10px;

  @media (${phoneOnly}) {
    flex-direction: column;
    width: 90%;
    margin: 0 auto;

    & button {
      margin: 0.5em 0;
    }
  }
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
