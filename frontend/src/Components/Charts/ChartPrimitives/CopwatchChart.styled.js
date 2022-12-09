import styled from 'styled-components';
import { darken } from '../../../styles/styleUtils/lighten-darken';

export const FlyoutContainer = styled.div`
  background: ${(props) => props.theme.colors.white};
  color: ${(props) => props.theme.colors.black};
  width: fit-content;
  ${(props) => (props.fontSize ? `font-size: ${props.fontSize}px;` : '')}
  padding: 4px;
  border-radius: ${(props) => props.theme.radii.standard}px;
  border-style: solid;
  border-width: thin;
`;

export const FlyoutLabel = styled.h4`
  font-family: ${(props) => props.theme.fonts.heading};
  margin-bottom: 2px;
`;

export const DataList = styled.ul`
  padding: 0;
  margin: 0;
  list-style: none;
  font-family: ${(props) => props.theme.fonts.body};
  font-size: 12px;
  font-weight: bold;
`;

export const DataListItem = styled.li`
  color: ${(props) => darken(props.color, 10)};
  display: flex;
  ${(props) => (props.fontSize ? `font-size: ${props.fontSize}px;` : '')}

  &:not(:last-child) {
    margin-bottom: 5px;
  }
`;

export const DatumLabel = styled.span`
  flex: 1;
`;

export const DatumValue = styled.span`
  margin-left: 20px;
`;
