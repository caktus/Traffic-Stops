import React from 'react';

import CopWatchLogoSolid from '../img/NC_copwatch_logo_solid.png';

// Hooks
import useOfficerId from '../Hooks/useOfficerId';

// State
import { useChartState } from '../Context/chart-state';
import { AGENCY_DETAILS } from './useDataset';

// Deps
import { Helmet } from 'react-helmet';

function useMetaTags() {
  const officerId = useOfficerId();
  const [state] = useChartState();

  const _getEntityReference = () => {
    return officerId ? `Officer ${officerId}` : state.data[AGENCY_DETAILS].name;
  };

  const _getPageTitle = () => {
    return `Stop Data for ${_getEntityReference()}`;
  };
  const _getUrlForShare = () => {
    return window.location.href;
  };

  const _renderMetaTags = () => {
    return (
      <Helmet>
        <title>{_getPageTitle()}</title>
        <meta property="og:title" content={`Traffic Stop Data for ${_getPageTitle()}`} />
        <meta
          property="og:description"
          content={`NC Copwatch collects traffic stop data reported by policing agencies across the state. ${_getEntityReference()} has traffic stop data available for analysis at nccopwatch.org.`}
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
  };

  return _renderMetaTags;
}

export default useMetaTags;
