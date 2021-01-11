import styled from 'styled-components';
import ReactTooltip from 'react-tooltip';

export const TooltipStyled = styled(ReactTooltip)`
  /* all this "!important" nonsense is regretable, but the tooltip library uses some opinionated styles */
  opacity: 1 !important;
  background: ${(props) => props.theme.colors.white} !important;
  color: ${(props) => props.theme.colors.black} !important;
  border: ${(props) => props.theme.borders.tooltip} !important;
  border-color: ${(props) => props.theme.colors.primaryDark} !important;
  border-radius: 15%;
  /* border-radius: ${(props) => props.theme.radii.rounded} !important; */
  max-width: 200px;
  padding: 1rem;
`;

export const TooltipableText = styled.a`
  cursor: help;
  font-weight: 700;
  text-decoration: none;
`;

export const TooltipText = styled.p`
  font-size: 1.1rem;
  padding: 0.5rem;

  strong {
    color: ${(props) => props.theme.colors.secondary};
  }
`;

export const TooltipLink = styled.a`
  display: block;
  text-align: right;
`;
