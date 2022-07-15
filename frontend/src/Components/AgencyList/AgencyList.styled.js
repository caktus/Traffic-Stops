import styled from 'styled-components';
import { phoneOnly, smallerThanDesktop } from '../../styles/breakpoints';
import FullWidthPage from '../../styles/StyledComponents/FullWidthPage';

export const AgencyList = styled(FullWidthPage)``;

export const InnerWrapper = styled.div`
  max-width: 1170px;
  margin: 0 auto;
  width: 100%;

  @media (${smallerThanDesktop}) {
    max-width: 750px;
    padding: 0 1em;
  }
`;

export const UpperContent = styled.div`
  margin-top: 2em;
`;

export const HeadingAndDescription = styled.div`
  max-width: 700px;

  p {
    margin: 1em 0;
  }
`;

export const AlphaList = styled.ul`
  display: flex;
  flex-direction: column;
`;

export const AlphaSection = styled.li`
  list-style: none;
  width: 100%;
  margin: 2rem 0;
`;

export const AlphaTitle = styled.h3`
  width: 100%;
  border-bottom: 2px solid ${(props) => props.theme.colors.secondary};
  font-family: ${(p) => p.theme.fonts.heading};
  font-size: 2rem;
  color: ${(props) => props.theme.colors.primary};
`;

export const List = styled.ul`
  list-style: none;
  column-count: 3;
  padding: 0.5rem;

  @media (${phoneOnly}) {
    column-count: 1;
  }
`;

export const ListItem = styled.li`
  padding: 0.75rem;
  a {
    color: ${(props) => props.theme.colors.primary};
    text-decoration: none;
  }
`;

export const SearchWrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
`;

export const AutoSuggestForm = styled.form`
  display: flex;
  flex-direction: row;
  align-items: center;
`;
