import styled from 'styled-components';
import ReactTooltip from 'react-tooltip';

export const TooltipStyled = styled(ReactTooltip)`
  /* all this "!important" nonsense is regretable, but the tooltip library uses some opinionated styles */
  opacity: 1 !important;
  background: ${(props) => props.theme.colorWhite} !important;
  color: ${(props) => props.theme.colorBlack} !important;
  border: ${(props) => props.theme.toolTipBorder} !important;
  border-radius: ${(props) => props.theme.toolTipBorderRadius} !important;
  max-width: 200px;
  padding: 1rem;
`;

export const TooltipableText = styled.a`
  cursor: help;
  font-weight: 700;
  text-decoration: none;
  border-bottom: 1px solid ${(props) => props.theme.colorSecondary}99;
  box-shadow: 0 -8px 0 ${(props) => props.theme.colorSecondary}99 inset;
`;

export const TooltipText = styled.p`
  font-size: 1.1rem;
  padding: 0.5rem;

  strong {
    color: ${(props) => props.theme.colorSecondary};
  }
`;

export const TooltipLink = styled.a`
  display: block;
  text-align: right;
`;
