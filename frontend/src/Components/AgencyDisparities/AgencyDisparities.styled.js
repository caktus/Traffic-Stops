import styled from 'styled-components';

import FullWidthPage from '../../styles/StyledComponents/FullWidthPage';
import { H1, H2 } from '../../styles/StyledComponents/Typography';
import { smallerThanTabletLandscape } from '../../styles/breakpoints';

export const Page = styled(FullWidthPage)`
  display: flex;
  flex-direction: column;
  padding-bottom: 4em;
`;

export const PageTitle = styled(H1)`
  margin-top: 1em;
`;

export const Intro = styled.div`
  max-width: 60em;
  line-height: 1.6;
  margin: 1em 0 2em 0;
`;

export const Note = styled.p`
  font-style: italic;
  color: ${(p) => p.theme.colors.textLight};
  margin-top: 1em;
`;

export const Filters = styled.div`
  display: flex;
  flex-direction: row;
  gap: 2em;
  align-items: flex-end;
  margin-bottom: 2em;
  flex-wrap: wrap;

  @media (${smallerThanTabletLandscape}) {
    flex-direction: column;
    align-items: stretch;
  }
`;

export const Section = styled.section`
  margin: 2.5em 0;
`;

export const SectionTitle = styled(H2)`
  font-size: 24px;
  margin-bottom: 0.25em;
`;

export const SectionCopy = styled.p`
  max-width: 60em;
  line-height: 1.6;
  margin-bottom: 1.5em;
`;

export const ChartWrapper = styled.div`
  position: relative;
  width: 100%;
  height: ${(p) => p.height || '500px'};
`;

export const MapWrapper = styled.div`
  position: relative;
  width: 100%;
  border: 1px solid ${(p) => p.theme.colors.greyLight};
  background: #f5f5f5;
`;

export const Legend = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 1em;
  margin-top: 0.75em;
  font-size: 13px;
`;

export const LegendItem = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.4em;
`;

export const Swatch = styled.span`
  display: inline-block;
  width: 14px;
  height: 14px;
  border-radius: ${(p) => (p.round ? '50%' : '2px')};
  background: ${(p) => p.color || 'transparent'};
  border: ${(p) => (p.hollow ? '2px solid #777' : 'none')};
`;

export const Tooltip = styled.div`
  position: fixed;
  pointer-events: none;
  z-index: 20;
  background: #333;
  color: #fff;
  padding: 6px 10px;
  border-radius: 4px;
  font-size: 12px;
  line-height: 1.4;
  max-width: 220px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
`;

export const Loading = styled.p`
  color: ${(p) => p.theme.colors.textLight};
`;

export const FetchError = styled.p`
  color: ${(p) => p.theme.colors.caution};
`;

export const BottomLink = styled.div`
  margin-top: 3em;
`;
