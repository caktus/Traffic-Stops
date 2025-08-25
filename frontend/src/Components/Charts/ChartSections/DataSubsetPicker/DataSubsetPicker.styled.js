import styled from 'styled-components';
import { P } from '../../../../styles/StyledComponents/Typography';

export const DataSubsetPicker = styled.div`
  display: flex;
  flex-direction: ${(props) => (props.labelOnLeft ? 'row' : 'column')};
  column-gap: 10px;
  align-items: ${(props) => (props.labelOnLeft ? 'center' : 'stretch')};
`;

export const Label = styled(P)``;
