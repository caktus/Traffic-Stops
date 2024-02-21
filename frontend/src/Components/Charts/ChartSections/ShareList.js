import React, { useState } from 'react';
import * as S from './ShareList.styled';

// Deps
import TwitterLogo from '../../../img/x-logo-black.png';
import FacebookLogo from '../../../img/meta_logo_primary.svg';
import InstagramLogo from '../../../img/instagram_logo.png';
import SimpleModal from '../../NewCharts/SimpleModal';
import Button from '../../Elements/Button';

function ShareList({ shareUrl, twitterTitle, onPressHandler, graphAnchor = null }) {
  let shareURL = shareUrl;
  if (graphAnchor) {
    shareURL = `${shareURL}%23${graphAnchor}`;
  }

  const copyToClipboard = (e) => {
    navigator.clipboard.writeText(shareURL).then(() => {
      e.target.innerText = 'Copied!';
    });
  };

  const downloadLogo = () => {
    const link = document.createElement('a');
    link.setAttribute('download', '');
    link.href = '/static/resources/forward-justice-logo.png';
    link.click();
  };

  const [igModalOpen, setIgModalOpen] = useState(false);
  return (
    <>
      <S.ShareList>
        <S.ShareItem
          href={`http://www.twitter.com/intent/tweet?url=${shareURL}&text=${twitterTitle}`}
          target="_blank"
          rel="noreferrer noopener"
          onClick={onPressHandler}
        >
          <S.TWLogo src={TwitterLogo} />
        </S.ShareItem>
        <S.ShareItem
          href={`http://www.facebook.com/sharer.php?u=${shareURL}`}
          target="_blank"
          rel="noreferrer noopener"
          onClick={onPressHandler}
        >
          <S.FBLogo src={FacebookLogo} />
        </S.ShareItem>
        <S.NoShareItem onClick={() => setIgModalOpen(true)}>
          <S.IGLogo src={InstagramLogo} />
        </S.NoShareItem>
      </S.ShareList>

      {/* Share To Instagram */}
      <SimpleModal
        heading="Share to Instagram"
        subheading="Upload this image and link as a caption to your feed."
        isOpen={igModalOpen}
        closeModal={() => setIgModalOpen(false)}
      >
        <S.IGDownloadLogoWrapper>
          <img
            alt="FJ logo to upload to Instagram"
            src="https://nccopwatch.org/static/resources/forward-justice-logo.png"
            width={300}
            height={300}
          />
          <Button onClick={downloadLogo} type="button">
            Download
          </Button>
        </S.IGDownloadLogoWrapper>
        <S.CopyToClipboardWrapper>
          <S.CopyToClipboardInput value={shareURL} />
          <Button onClick={copyToClipboard} type="button">
            Copy to clipboard
          </Button>
        </S.CopyToClipboardWrapper>
      </SimpleModal>
    </>
  );
}

ShareList.defaultProps = {
  shareUrl: window.location.href,
  twitterTitle: '',
};

export default ShareList;
