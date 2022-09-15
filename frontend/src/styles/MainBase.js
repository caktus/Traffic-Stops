import styled from 'styled-components';
import { phoneOnly } from './breakpoints';

export default styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  width: 50%;
  float: left;

  @media (${phoneOnly}) {
    width: 100%;
    overflow-y: scroll;
    float: none;
  }
`;
