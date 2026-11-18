import React from 'react';
import * as S from './Footer.styled';

// Assets
import FJLogo from '../../img/Dark-Mono-Tagline-NoBG-01.png';
import SplashImage from '../../img/nc-copwatch-transparent-small--tayetheartist.png';

function Footer() {
  return (
    <S.Footer>
      <S.Attributions>
        <S.FJAttribution>
          <span>NC CopWatch</span>
          <a href="https://www.forwardjustice.org" target="_blank" rel="noreferrer noopener">
            <S.FJLogo src={FJLogo} />
          </a>
        </S.FJAttribution>
        <S.ArtistAttribution>Artwork by TayeTheArtist</S.ArtistAttribution>
      </S.Attributions>
      <S.SplashImage src={SplashImage} />
    </S.Footer>
  );
}

export default Footer;
