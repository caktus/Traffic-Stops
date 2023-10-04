import styled from 'styled-components';
import { phoneOnly } from '../../../styles/breakpoints';

export const ShareList = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-right: 1.5em;
  gap: 15px;

  @media (${phoneOnly}) {
    margin: 0;
    justify-content: center;
  }
`;

export const ShareItem = styled.a`
  margin: 0;
`;

export const FBLogo = styled.img`
  height: 75px;
  width: 150px;
`;

export const TWLogo = styled.img`
  height: 25px;
  width: 25px;
`;
