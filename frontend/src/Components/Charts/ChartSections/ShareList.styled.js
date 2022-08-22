import styled from 'styled-components';
import { phoneOnly } from '../../../styles/breakpoints';

export const ShareList = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-right: 1.5em;

  @media (${phoneOnly}) {
    margin: 0;
    justify-content: center;
    margin-top: 1.5em;
  }
`;

export const ShareItem = styled.a`
  margin: 0 1.5em;
`;

export const FBLogo = styled.img`
  height: 32px;
  width: 32px;
`;

export const TWLogo = styled.img`
  height: 32px;
  width: 32px;
`;
