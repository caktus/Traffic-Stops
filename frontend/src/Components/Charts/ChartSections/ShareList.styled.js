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

export const NoShareItem = styled.div`
  margin: 0;
  cursor: pointer;
`;

export const FBLogo = styled.img`
  height: 75px;
  width: 150px;
`;

export const TWLogo = styled.img`
  height: 25px;
  width: 25px;
`;

export const IGLogo = styled.img`
  height: 25px;
  width: 25px;
`;

export const IGDownloadLogoWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
  margin-bottom: 40px;
`;

export const CopyToClipboardWrapper = styled.div`
  display: flex;
  width: 100%;
  justify-content: center;

  @media (${phoneOnly}) {
    flex-direction: column;
  }
`;

export const CopyToClipboardInput = styled.input`
  font-size: 2rem;
  padding: 5px;
  height: 40px;
  width: 50%;

  @media (${phoneOnly}) {
    width: 100%;
  }
`;
