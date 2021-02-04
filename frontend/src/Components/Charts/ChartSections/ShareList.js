import React from 'react';
import * as S from './ShareList.styled';

// Derps
import TwitterLogo from 'img/twitter_logo_blue.png';
import FacebookLogo from 'img/f_logo_RGB-Blue_58.png';

const ShareList = React.forwardRef(function ({ shareUrl, twitterTitle }, ref) {
  return (
    <S.ShareList ref={ref}>
      <S.ShareItem
        href={`http://www.twitter.com/intent/tweet?url=${shareUrl}&text=${twitterTitle}`}
        target="_blank"
        rel="noreferrer noopener"
      >
        <S.TWLogo src={TwitterLogo} />
      </S.ShareItem>
      <S.ShareItem
        href={`http://www.facebook.com/sharer.php?u=${shareUrl}`}
        target="_blank"
        rel="noreferrer noopener"
      >
        <S.FBLogo src={FacebookLogo} />
      </S.ShareItem>
    </S.ShareList>
  );
});

ShareList.defaultProps = {
  shareUrl: window.location.href,
  twitterTitle: '',
};

export default ShareList;
