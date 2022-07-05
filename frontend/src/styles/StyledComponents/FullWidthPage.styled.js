import styled from 'styled-components';
import * as breakpoints from 'styles/breakpoints';

export const FullWidthPage = styled.main`
  flex: 1;
  overflow-x: hidden;
`;

export const ResponsiveInnerPage = styled.div`
  margin: 0 auto;
  width: 100%;
  max-width: 1200px;
  display: flex;
  flex: 1;
  flex-direction: column;
  overflow-y: hidden;

  @media (${breakpoints.smallerThanDesktop}) {
    max-width: 900px;
  }
  @media (${breakpoints.smallerThanTabletLandscape}) {
    max-width: 550px;
  }
  @media (${breakpoints.phoneOnly}) {
    max-width: 100%;
    padding: 0 1em;
  }
`;
