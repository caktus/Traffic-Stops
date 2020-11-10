import styled from 'styled-components';
import { smallerThanTabletLandscape } from '../../../styles/breakpoints';

export const LegendStyled = styled.ul`
  display: flex;
  flex-direction: row;
  justify-content: space-around;
  flex-wrap: wrap;
  max-width: 70vw;
  margin: 0 auto;
  padding-top: 1rem;
  list-style: none;

  @media (${smallerThanTabletLandscape}) {
    max-width: 100vw;
  }
`;

export const LegendItem = styled.li`
  display: flex;
  flex-direction: row;
  cursor: pointer;
  margin-right: 1rem;
  margin-bottom: 1rem;
`;
