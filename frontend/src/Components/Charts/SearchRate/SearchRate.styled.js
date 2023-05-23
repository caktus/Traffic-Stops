import styled from 'styled-components';
import ChartPageBase from '../ChartSections/ChartPageBase';

export default styled(ChartPageBase)``;

export const Tooltip = styled.div`
  background: #333;
  color: white;
  font-weight: bold;
  padding: 4px 8px;
  font-size: 13px;
  border-radius: 4px;
  visibility: hidden;

  &[data-show='true'] {
    visibility: visible;
  }
`;
