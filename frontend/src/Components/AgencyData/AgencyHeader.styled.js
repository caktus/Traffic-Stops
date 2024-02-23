import styled from 'styled-components';
import { P, H2 } from '../../styles/StyledComponents/Typography';
import FJIcon from '../../img/icons/Icon';
import {
  phoneOnly,
  smallerThanDesktop,
  smallerThanTabletLandscape,
} from '../../styles/breakpoints';

export const AgencyHeader = styled.div`
  box-shadow: ${(props) => props.theme.shadows.depth1};
  padding: 0.5em 3em;

  @media (${smallerThanDesktop}) {
    padding: 0.5em 1em;
  }

  @media (${phoneOnly}) {
    display: flex;
    flex-direction: column;
    align-items: start;
    justify-content: center;
  }
`;

export const AgencySub = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  margin-bottom: 1em;
`;

export const GoToAgency = styled.p`
  color: ${(p) => p.theme.colors.primaryDark};
  margin-left: 1.5em;
  display: flex;
  flex-direction: row;
  align-items: center;
  cursor: pointer;
`;

export const ViewIcon = styled(FJIcon)`
  margin-left: 0.5em;
`;

export const SubHeaderNavRow = styled.div`
  margin-bottom: 0.5em;
  @media (${smallerThanTabletLandscape}) {
    display: none;
  }
`;

export const SubHeaderContentRow = styled.div`
  display: flex;
  flex: 1;
  flex-direction: ${(props) => props.flexDirection || 'row'};
  @media (${smallerThanDesktop}) {
    flex-direction: column;
  }
`;

export const EntityDetails = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
`;

export const AgencyTitle = styled(H2)`
  font-size: 18px;
`;

export const ReportedDate = styled(P)`
  display: inline;
`;

export const Other = styled(P)`
  font-size: 14px;
`;

export const AgencyHeaderButton = styled.div`
  display: block;
  margin: 10px 0;
`;
