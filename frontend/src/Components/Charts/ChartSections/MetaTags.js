import React from 'react';

import CopWatchLogoSolid from '../../../img/NC_copwatch_logo_solid.png';

// Deps
import { Helmet } from 'react-helmet';

export default function MetaTags({ entityReference }) {
  const _getPageTitle = () => `Stop Data for ${entityReference}`;
  const _getUrlForShare = () => window.location.href;

  return (
    <Helmet>
      <title>{_getPageTitle()}</title>
      <meta property="og:title" content={`Traffic Stop Data for ${_getPageTitle()}`} />
      <meta
        property="og:description"
        content={`NC Copwatch collects traffic stop data reported by policing agencies across the state. ${entityReference} has traffic stop data available for analysis at nccopwatch.org.`}
      />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={_getUrlForShare()} />
      <meta property="og:image" content={CopWatchLogoSolid} />
      <meta property="og:image:type" content="image/png" />
      <meta property="og:image:alt" content="The NC CopWatch Logo" />
      <meta property="og:image:width" content="600" />
      <meta property="og:image:height" content="300" />
    </Helmet>
  );
}
