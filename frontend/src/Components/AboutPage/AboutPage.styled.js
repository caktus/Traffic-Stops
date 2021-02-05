import styled from 'styled-components';
import { smallerThanDesktop, smallerThanTabletLandscape } from 'styles/breakpoints';
import MainBase from 'styles/MainBase';

import { P } from 'styles/StyledComponents/Typography';

export const AboutPageStyled = styled(MainBase)``;

export const AboutPageContent = styled.div`
  max-width: 1170px;
  margin: 0 auto;
  width: 100%;

  @media (${smallerThanDesktop}) {
    max-width: 750px;
  }

  @media (${smallerThanTabletLandscape}) {
    padding: 0 1em;
  }
`;

export const AboutPageText = styled.div`
  padding: 0 1.5em;

  @media (${smallerThanTabletLandscape}) {
    padding: 0;
  }
`;

export const AboutPageParagaph = styled(P)`
  margin: 1.5em 0;
  line-height: 2;
`;
