import React from 'react';

function useMetaTags(agencyDetails, isOfficer) {
  console.log('agencyDetails', agencyDetails);

  const _getEntityReference = () => {};

  const _renderMetaTags = () => {
    return (
      <>
        <title>Toots</title>
        <meta
          property="og:title"
          content="Traffic Stop Data for {% if officer_id %} Officer {{ officer_id }} at the {% endif %} {{ object }}"
        />
        <meta
          property="og:description"
          content="NC Copwatch collects traffic stop data reported by policing agencies across the state. {% if officer_id %} Officer {{ officer_id }}{% else %}{{ object }}{% endif %} has traffic stop data available for analysis at nccopwatch.org."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="{{ request.build_absolute_uri }}" />
        <meta
          property="og:image"
          content="{{ request.scheme }}://{{ request.get_host}}{% static 'img/NC_copwatch_social_share_logo.png' %}"
        />
        <meta
          property="og:image:secure_url"
          content="{{ request.scheme }}://{{ request.get_host}}{% static 'img/NC_copwatch_social_share_logo.png' %}"
        />
        <meta property="og:image:type" content="image/png" />
        <meta property="og:image:alt" content="The NC CopWatch Logo" />
        <meta property="og:image:width" content="600" />
        <meta property="og:image:height" content="300" />
      </>
    );
  };

  return _renderMetaTags;
}

export default useMetaTags;
