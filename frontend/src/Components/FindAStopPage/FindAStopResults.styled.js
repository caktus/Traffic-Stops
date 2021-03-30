import styled from 'styled-components';
import FullWidthPage from 'styles/StyledComponents/FullWidthPage';

export const Page = styled(FullWidthPage)`
  padding: 2em 0;
`;

export const Heading = styled.div`
  margin: 0.5em 1.5em;
`;

export const TableContainer = styled.div``;

export const NoResults = styled.div`
  margin: 2em;

  h2 {
    margin: 0.5em 0;
  }
`;

export const DeptLink = styled.span`
  color: ${(props) => props.theme.colors.primaryDark};
  cursor: pointer;
`;

export const TableWrapper = styled.div``;
