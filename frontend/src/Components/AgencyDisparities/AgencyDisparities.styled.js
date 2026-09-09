import styled, { css } from 'styled-components';
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

// Shared reading-width constraint used for page text (title, intro, filters,
// and each section's heading/copy), while charts render at the full width of
// the page for a more immersive layout.
const constrainedWidth = css`
  margin: 0 auto;
  width: 100%;
  max-width: 1200px;

  @media (${smallerThanDesktop}) {
    max-width: 900px;
  }
  @media (${smallerThanTabletLandscape}) {
    max-width: 550px;
  }
`;

export const Inner = styled.div`
  ${constrainedWidth}
  display: flex;
  flex: 1;
  flex-direction: column;

  @media (${phoneOnly}) {
    max-width: 100%;
    padding: 0 1em;
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

// Wraps Filters so its sticky containing block spans the whole page (not just
// the Inner block above it), letting the bar stay stuck while scrolling
// through the full-width chart sections below.
export const FiltersBar = styled.div`
  position: sticky;
  top: 0;
  z-index: 9;
  background: ${(p) => p.theme.colors.white};
  box-shadow: ${(p) => p.theme.shadows.depth1};
`;

export const Filters = styled.div`
  ${constrainedWidth}
  display: flex;
  flex-direction: row;
  gap: 2em;
  align-items: flex-end;
  flex-wrap: wrap;
  padding: 1em 1.5em;

  @media (${smallerThanTabletLandscape}) {
    flex-direction: column;
    align-items: stretch;
  }
`;

export const Section = styled.section`
  margin: 4.5em 0;
  padding: 0 1.5em;

  @media (${phoneOnly}) {
    padding: 0 1em;
  }
`;

// Wraps a section's heading(s) and copy so text stays at reading width even
// though the section itself (and its chart) spans the full page width.
export const SectionHeader = styled.div`
  ${constrainedWidth}
`;

// Hash link revealed to the right of a heading on hover, matching the anchor
// pattern used by most documentation sites.
export const SectionAnchor = styled.a`
  display: inline-block;
  margin-left: 0.5em;
  font-weight: 400;
  text-decoration: none;
  color: ${(p) => p.theme.colors.primary};
  opacity: 0;
  transition: opacity 0.15s ease;

  &:hover {
    text-decoration: underline;
  }
`;

export const SectionTitle = styled(H2)`
  font-size: 34px;
  margin-bottom: 0.35em;
  scroll-margin-top: 5em;

  &:hover ${SectionAnchor}, &:focus-within ${SectionAnchor} {
    opacity: 1;
  }
`;

// Sub-heading used under a section's main title (e.g. "Sheriff's Offices" and
// "Police Departments" under "Where are stop disparities occurring...").
export const SectionSubTitle = styled(H2)`
  font-size: 22px;
  font-weight: 600;
  text-transform: none;
  color: ${(p) => p.theme.colors.textLight};
  margin-bottom: 0.35em;
  scroll-margin-top: 5em;

  &:hover ${SectionAnchor}, &:focus-within ${SectionAnchor} {
    opacity: 1;
  }
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
  justify-content: center;
  gap: 1em;
  margin-bottom: 0.75em;
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

// Dashed-line swatch for legend items describing a reference line (e.g. the
// equity baseline on the likelihood bar chart) rather than a fill color.
export const LineSwatch = styled.span`
  display: inline-block;
  width: 18px;
  border-top: 2px dashed ${(p) => p.color || '#ff8c00'};
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
