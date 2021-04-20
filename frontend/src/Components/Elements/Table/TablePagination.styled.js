import styled from 'styled-components';
import { smallerThanTabletLandscape } from 'styles/breakpoints';

export const Pagination = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;

  @media (${smallerThanTabletLandscape}) {
    justify-content: space-around;
  }
`;

export const Arrow = styled.button`
  background: transparent;
  border: none;
`;

export const PagesList = styled.ul`
  padding: 0;
  margin: 0 1em;

  display: flex;
  flex-direction: row;

  @media (${smallerThanTabletLandscape}) {
    width: 100%;
    justify-content: space-around;
  }
`;

export const PageNumber = styled.button`
  background: ${(props) => (props.current ? props.theme.colors.primary : 'transparent')};
  color: ${(props) => (props.current ? props.theme.colors.white : props.theme.colors.text)};
  width: 30px;
  height: 30px;
  font-family: ${(props) => props.theme.fonts.body};
  font-weight: bold;
  font-size: 16px;
  border: none;
`;
