import styled from 'styled-components';
import {
  phoneOnly,
  smallerThanDesktop,
  smallerThanTabletLandscape,
} from '../../styles/breakpoints';
import { P } from '../../styles/StyledComponents/Typography';
import FJIcon from '../../img/icons/Icon';

export const ChartModal = styled.div`
  z-index: 21;
  background: ${(p) => p.theme.colors.white};

  padding: 2.5em;
  width: 100%;
  max-width: 1300px;
  height: 95%;

  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);

  overflow-y: scroll;

  @media (${smallerThanDesktop}) {
    max-width: 80%;
  }

  @media (${smallerThanTabletLandscape}) {
    width: 95vw;
    height: 95vh;
    padding: 1em;
  }

  @media (${phoneOnly}) {
    max-width: 100%;
    width: 95vw;
    height: 100vh;
  }
`;

export const ModalUnderlay = styled.div`
  top: 0;
  bottom: 0;
  left: 0;
  right: 0%;
  height: auto;
  width: 100%;
  position: fixed;
  background: rgba(0, 0, 0, 0.8);
  z-index: 20;
`;

export const Header = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
  justify-content: space-between;

  @media (${smallerThanTabletLandscape}) {
    flex-direction: column-reverse;
  }
`;

export const Heading = styled.div`
  display: flex;
  flex-direction: row;

  & p {
    margin-left: 10px;
  }

  @media (${smallerThanTabletLandscape}) {
    flex-direction: column;
    margin: 1em 0;

    & p {
      margin-left: 0;
    }
  }
`;

export const CloseButton = styled(FJIcon)`
  cursor: pointer;
  @media (${smallerThanTabletLandscape}) {
    align-self: flex-end;
  }
`;

export const Download = styled.div`
  margin-top: 1em;
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

export const ChartWrapper = styled.div`
  margin-top: 3em;
`;

export const NonHispanic = styled(P)`
  font-style: italic;
`;

export const BottomMarginTen = styled.div`
  margin-bottom: 10px;
`;
