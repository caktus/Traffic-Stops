import styled from 'styled-components';
import { phoneOnly } from 'styles/breakpoints';
import MainBase from 'styles/MainBase';

export const AgencyListStyled = styled(MainBase)``;

export const AgenciesList = styled.ul`
  display: flex;
  flex-direction: column;
  padding: 2rem;
`;

export const AgenciesListCharSection = styled.li`
  list-style: none;
  width: 100%;
  margin: 2rem 0;
`;

export const AgenciesListCharTitle = styled.h3`
  width: 100%;
  border-bottom: 1px solid ${(props) => props.theme.colorBlack};
  padding-left: 1em;
  font-size: 2rem;
  color: ${(props) => props.theme.colorPrimary};
`;

export const AgenciesListList = styled.ul`
  list-style: none;
  column-count: 3;
  padding: 0.5rem;

  @media (${phoneOnly}) {
    column-count: 1;
  }
`;

export const AgencyListItem = styled.li`
  padding: 0.75rem;
  a {
    color: ${(props) => props.theme.colorPrimary};
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
