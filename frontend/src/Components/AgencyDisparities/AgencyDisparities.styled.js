import styled from 'styled-components';
import { Link } from 'react-router-dom';

import { H1, H2 } from '../../styles/StyledComponents/Typography';
import {
  smallerThanDesktop,
  smallerThanTabletLandscape,
  phoneOnly,
} from '../../styles/breakpoints';
import { TableModal } from '../Elements/Table/TableModal.styled';

// The disparities page uses its own page/inner wrappers (rather than the shared
// FullWidthPage) so that the filter bar can use position: sticky. FullWidthPage's
// inner wrapper sets overflow-y: hidden, which would trap the sticky element.
export const Page = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

export const Inner = styled.div`
  margin: 0 auto;
  width: 100%;
  max-width: 1200px;
  display: flex;
  flex: 1;
  flex-direction: column;
  padding-bottom: 4em;

  @media (${smallerThanDesktop}) {
    max-width: 900px;
  }
  @media (${smallerThanTabletLandscape}) {
    max-width: 550px;
  }
  @media (${phoneOnly}) {
    max-width: 100%;
    padding: 0 1em 4em;
  }
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
  flex-wrap: wrap;

  position: sticky;
  top: 0;
  z-index: 9;
  padding: 1em 1.5em;
  background: ${(p) => p.theme.colors.white};
  box-shadow: ${(p) => p.theme.shadows.depth1};

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
  display: flex;
  justify-content: center;
  margin-top: 3em;
  margin-bottom: 3em;
`;

export const TableButtonRow = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-bottom: 0.75em;
`;

// Wider variant of the shared table modal so the extra disparity columns fit.
export const WideModal = styled(TableModal)`
  max-width: 1400px;
`;

export const TableLink = styled(Link)`
  color: ${(p) => p.theme.colors.primary};

  &:hover {
    text-decoration: underline;
  }
`;
