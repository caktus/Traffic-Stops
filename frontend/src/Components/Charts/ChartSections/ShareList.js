import React from 'react';
import * as S from './ShareList.styled';

// Deps
import TwitterLogo from '../../../img/x-logo-black.png';
import FacebookLogo from '../../../img/meta_logo_primary.svg';

function ShareList({ shareUrl, twitterTitle, onPressHandler }) {
  return (
    <S.ShareList>
      <S.ShareItem
        href={`http://www.twitter.com/intent/tweet?url=${shareUrl}&text=${twitterTitle}`}
        target="_blank"
        rel="noreferrer noopener"
        onClick={onPressHandler}
      >
        <S.TWLogo src={TwitterLogo} />
      </S.ShareItem>
      <S.ShareItem
        href={`http://www.facebook.com/sharer.php?u=${shareUrl}`}
        target="_blank"
        rel="noreferrer noopener"
        onClick={onPressHandler}
      >
        <S.FBLogo src={FacebookLogo} />
      </S.ShareItem>
    </S.ShareList>
  );
}

ShareList.defaultProps = {
  shareUrl: window.location.href,
  twitterTitle: '',
};

export default ShareList;
