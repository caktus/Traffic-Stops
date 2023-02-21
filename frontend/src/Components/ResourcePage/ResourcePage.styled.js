import styled from 'styled-components';
import {
  phoneOnly,
  smallerThanDesktop,
  smallerThanTabletLandscape,
} from '../../styles/breakpoints';
import FullWidthPage from '../../styles/StyledComponents/FullWidthPage';

export const ResourcePageStyled = styled(FullWidthPage)``;

export const ResourcePageContent = styled.div`
  max-width: 1170px;
  margin: 0 auto;
  width: 100%;
  min-height: 100vh;

  @media (${smallerThanDesktop}) {
    max-width: 750px;
  }

  @media (${smallerThanTabletLandscape}) {
    padding: 0 1em;
  }
`;

export const ResourceBlock = styled.div`
  display: flex;
  margin-bottom: 50px;
  padding: 30px;

  @media (${phoneOnly}) {
    padding: 10px;
  }
`;

export const ResourceImage = styled.img`
  width: 150px;

  @media (${phoneOnly}) {
    width: 75px;
  }
`;

export const ResourceDividingLine = styled.div`
  border-bottom: 1px solid darkgray;
  padding-left: 100px;
  padding-right: 100px;
`;
