import styled from 'styled-components';
import {
  smallerThanDesktop,
  smallerThanTabletLandscape,
  phoneOnly,
} from '../../../styles/breakpoints';

export default styled.div`
  height: 700px;
  /* padding: 2rem 0; */

  @media (${smallerThanDesktop}) {
    height: 600px;
  }
  @media (${smallerThanTabletLandscape}) {
    height: 500px;
  }
  @media (${phoneOnly}) {
    height: 100vw;
  }
`;
