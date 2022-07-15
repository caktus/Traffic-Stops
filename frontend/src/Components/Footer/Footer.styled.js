import styled from 'styled-components';
import { phoneOnly } from '../../styles/breakpoints';

export const Footer = styled.footer`
  position: relative;
  width: 100%;
  background: ${(p) => p.theme.colors.darkGrey};
  margin-top: 2em;
  padding: 1em 0;
  color: ${(p) => p.theme.colors.white};
`;

export const Attributions = styled.div`
  margin: 0 auto;
`;

export const FJAttribution = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;

  @media (${phoneOnly}) {
    flex-direction: column;
  }
`;

export const FJLogo = styled.img`
  margin-left: 0.75em;
  width: 200px;

  @media (${phoneOnly}) {
    margin-left: 0;
    margin-top: 0.5em;
  }
`;

export const ArtistAttribution = styled.p`
  text-align: center;
  padding: 1em 0;
`;

export const SplashImage = styled.img`
  position: absolute;
  opacity: 0.1;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  margin-left: 0.5em;
  height: 100%;
  width: auto;
`;
