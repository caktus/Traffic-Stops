import styled from 'styled-components';
import { phoneOnly } from '../../../styles/breakpoints';

export const Alert = styled.div`
  padding: 20px;
  background-color: ${(props) => props.color};
  color: white;
  margin-bottom: 20px;
  font-weight: bolder;
  font-size: 22px;
  z-index: 11;
`;

export const CompareAlert = styled(Alert)`
  display: none;

  @media (${phoneOnly}) {
    display: block;
    position: absolute;
  }
`;
