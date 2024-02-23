import styled from 'styled-components';
import FJIcon from '../../../img/icons/Icon';
import { H2 } from '../../../styles/StyledComponents/Typography';
import { phoneOnly, smallerThanTabletLandscape } from '../../../styles/breakpoints';

export const ChartHeader = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;

  @media (${smallerThanTabletLandscape}) {
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
  align-items: center;
  justify-content: space-between;
  gap: 30px;

  @media (${phoneOnly}) {
    width: 90%;
    margin: 0 auto;
    flex-direction: column;
    gap: 0;

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
