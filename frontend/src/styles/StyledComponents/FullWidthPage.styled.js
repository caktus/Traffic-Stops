import styled from 'styled-components';
import * as breakpoints from 'styles/breakpoints';

export const FullWidthPage = styled.main`
  flex: 1;
  overflow-x: hidden;
  overflow-y: scroll;
`;

export const ResponsiveInnerPage = styled.div`
  margin: 0 auto;
  width: 100%;
  max-width: 1100px;

  @media (${breakpoints.smallerThanDesktop}) {
    max-width: 900px;
  }
  @media (${breakpoints.smallerThanTabletLandscape}) {
    max-width: 500px;
  }
  @media (${breakpoints.phoneOnly}) {
    max-width: 100%;
  }
`;