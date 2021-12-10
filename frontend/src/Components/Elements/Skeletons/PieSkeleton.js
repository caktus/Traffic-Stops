import React from 'react';

// Deps
import ContentLoader from 'react-content-loader';
import LoaderBase from 'Components/Elements/Skeletons/LoaderBase';

function PieSkeleton({ scale=1 }) {
  const toScale = (val) => parseInt(val, 10) * scale
  return (
    <LoaderBase>
      <ContentLoader
        viewBox={`0 0 ${toScale(400)} ${toScale(200)}`}
        height={toScale(200)}
        width={toScale(400)}
        speed={2}
        data-testid="PieSkeleton"
      >
        <rect x={toScale(100)} y={toScale(5)} rx={toScale(0)} ry={toScale(0)} width={toScale(200)} height={toScale(1)} />
        <circle cx={toScale(140)} cy={toScale(110)} r={toScale(70)} />
        <rect x={toScale(230)} y={toScale(50)} rx={toScale(0)} ry={toScale(0)} width={toScale(7)} height={toScale(7)} />
        <rect x={toScale(250)} y={toScale(50)} rx={toScale(0)} ry={toScale(0)} width={toScale(30)} height={toScale(7)} />
        <rect x={toScale(230)} y={toScale(64)} rx={toScale(0)} ry={toScale(0)} width={toScale(7)} height={toScale(7)} />
        <rect x={toScale(250)} y={toScale(64)} rx={toScale(0)} ry={toScale(0)} width={toScale(30)} height={toScale(7)} />
        <rect x={toScale(230)} y={toScale(78)} rx={toScale(0)} ry={toScale(0)} width={toScale(7)} height={toScale(7)} />
        <rect x={toScale(250)} y={toScale(78)} rx={toScale(0)} ry={toScale(0)} width={toScale(30)} height={toScale(7)} />
        <rect x={toScale(230)} y={toScale(92)} rx={toScale(0)} ry={toScale(0)} width={toScale(7)} height={toScale(7)} />
        <rect x={toScale(250)} y={toScale(92)} rx={toScale(0)} ry={toScale(0)} width={toScale(30)} height={toScale(7)} />
      </ContentLoader>
    </LoaderBase>
  );
}

export default PieSkeleton;
