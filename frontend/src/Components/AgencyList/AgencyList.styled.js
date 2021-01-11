import styled from 'styled-components';
import { phoneOnly } from 'styles/breakpoints';
import MainBase from 'styles/MainBase';

export const AgencyList = styled(MainBase)``;

export const AlphaList = styled.ul`
  display: flex;
  flex-direction: column;
  padding: 2rem;
`;

export const AlphaSection = styled.li`
  list-style: none;
  width: 100%;
  margin: 2rem 0;
`;

export const AlphaTitle = styled.h3`
  width: 100%;
  border-bottom: 1px solid ${(props) => props.theme.colors.black};
  padding-left: 1em;
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
