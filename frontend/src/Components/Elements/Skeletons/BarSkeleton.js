import React from 'react';

// Deps
import ContentLoader from 'react-content-loader';
import LoaderBase from 'Components/Elements/Skeletons/LoaderBase';

function PieSkeleton() {
  return (
    <LoaderBase>
      <ContentLoader
        width={400}
        height={400}
        viewBox="0 0 200 200"
        speed={2}
        data-testid="BarSkeleton"
      >
        <rect x="0" y="160" rx="0" ry="0" width="25" height="40" />
        <rect x="30" y="145" rx="0" ry="0" width="25" height="55" />
        <rect x="60" y="126" rx="0" ry="0" width="25" height="74" />
        <rect x="90" y="80" rx="0" ry="0" width="25" height="120" />
        <rect x="120" y="142" rx="0" ry="0" width="25" height="58" />
      </ContentLoader>
    </LoaderBase>
  );
}

export default PieSkeleton;
