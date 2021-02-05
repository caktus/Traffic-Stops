import React from 'react';
import * as S from './ShareList.styled';

import { useChartState } from 'Context/chart-state';
import { AGENCY_DETAILS } from 'Hooks/useDataset';

import useOfficerId from 'Hooks/useOfficerId';

// Derps
import TwitterLogo from 'img/twitter_logo_blue.png';
import FacebookLogo from 'img/f_logo_RGB-Blue_58.png';

const ShareList = React.forwardRef(function (
  { shareUrl, chartTitle, chartAnchorId, pageQuote },
  ref
) {
  const [chartState] = useChartState();
  const officerId = useOfficerId();

  const _getPageQuote = (pq) => {
    if (pq) return pq;
    const agencyName = chartState.data[AGENCY_DETAILS].name;
    if (chartTitle) {
      if (officerId) {
        return `${chartTitle} for "Officer ${officerId}" at ${agencyName}`;
      }
      return `${chartTitle} for ${agencyName}`;
    }

    if (officerId) {
      return `Traffic Stop statistics for "Officer ${officerId}" at ${agencyName}`;
    }
    return `Traffic Stop statistics for ${agencyName}`;
  };

  const _getShareUrl = (su) => {
    if (su) return su;
    return chartAnchorId ? `${window.location.href}#${chartAnchorId}` : window.location.href;
  };

  const _getTwitterURL = (su, pq) => {
    let url = 'http://www.twitter.com/intent/tweet/';
    url += `?url=${encodeURIComponent(_getShareUrl(su))}`;
    url += `&text=${encodeURIComponent(_getPageQuote(pq))}`;
    return url;
  };

  const _getFacebookURL = (su, pq) => {
    let url = 'http://www.facebook.com/sharer.php';
    url += `?u=${encodeURIComponent(_getShareUrl(su))}`;
    url += `&quote=${encodeURIComponent(_getPageQuote(pq))}`;
    return url;
  };

  return (
    <S.ShareList ref={ref}>
      <S.ShareItem
        href={_getTwitterURL(shareUrl, pageQuote)}
        target="_blank"
        rel="noreferrer noopener"
      >
        <S.TWLogo src={TwitterLogo} />
      </S.ShareItem>
      <S.ShareItem
        href={_getFacebookURL(shareUrl, pageQuote)}
        target="_blank"
        rel="noreferrer noopener"
      >
        <S.FBLogo src={FacebookLogo} />
      </S.ShareItem>
    </S.ShareList>
  );
});

ShareList.defaultProps = {
  shareUrl: '',
  twitterTitle: '',
};

export default ShareList;
