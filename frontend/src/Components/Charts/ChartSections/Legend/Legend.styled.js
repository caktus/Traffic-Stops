import styled from 'styled-components';
import { smallerThanDesktop } from '../../../../styles/breakpoints';
import FJIcon from '../../../../img/icons/Icon';
import { P } from '../../../../styles/StyledComponents/Typography';

export const Legend = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  flex: 0;

  @media (${smallerThanDesktop}) {
    width: 95%;
    margin: 0 auto;
  }
`;

export const LegendHeading = styled(P)`
  padding: 1em 0;
`;

export const KeysList = styled.ul`
  display: flex;
  flex-direction: ${(props) => (props.row ? 'row' : 'column')};
  list-style: none;
  padding: 0;
  margin: 0;

  @media (${smallerThanDesktop}) {
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: space-between;
  }
`;

export const Key = styled.li`
  display: flex;
  flex-direction: row;
  align-items: center;
  cursor: ${(p) => (p.isInteractive ? 'pointer' : 'auto')};
  margin-right: 1.5rem;
  margin-bottom: 1rem;
`;

export const Icon = styled(FJIcon)`
  margin-right: 0.5em;
`;

export const KeyLabel = styled.p`
  color: ${(props) => (props.selected ? props.theme.colors.text : props.theme.colors.grey)};
`;

export const Addendum = styled.p`
  margin-top: 1em;
  font-style: italic;
  color: ${(props) => props.theme.colors.textLight};
  font-size: 16px;
`;
