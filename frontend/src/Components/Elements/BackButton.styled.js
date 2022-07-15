import styled from 'styled-components';
import { P } from '../../styles/StyledComponents/Typography';
import FJIcon from '../../img/icons/Icon';

export const BackButton = styled.button`
  border: none;
  background: transparent;
  display: flex;
  flex-direction: row;
  align-items: center;
`;

export const Icon = styled(FJIcon)``;

export const Text = styled(P)`
  margin-left: 0.5em;
  color: ${(props) => props.theme.colors.primaryDark};
`;
