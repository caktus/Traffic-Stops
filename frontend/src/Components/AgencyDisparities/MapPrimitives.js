import React from 'react';
import { ComposableMap } from 'react-simple-maps';

import * as S from './AgencyDisparities.styled';

// Shared NC-centered projection used by both the county choropleth and the
// police bubble map so the two stay visually aligned.
export function NcMap({ children }) {
  return (
    <S.MapWrapper>
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ center: [-79.9, 35.5], scale: 4500 }}
        width={800}
        height={340}
        style={{ width: '100%', height: 'auto' }}
      >
        {children}
      </ComposableMap>
    </S.MapWrapper>
  );
}

// Cursor-following tooltip shared by the maps. `tooltip` is null when hidden.
// `tooltip.body` may be a single string or an array of lines, each rendered
// on its own line via <br /> so multiple data points don't run together.
export function MapTooltip({ tooltip }) {
  if (!tooltip) return null;
  const lines = Array.isArray(tooltip.body) ? tooltip.body : [tooltip.body];
  return (
    <S.Tooltip style={{ left: tooltip.x + 12, top: tooltip.y + 12 }}>
      <strong>{tooltip.title}</strong>
      {lines.map((line) => (
        <React.Fragment key={line}>
          <br />
          {line}
        </React.Fragment>
      ))}
    </S.Tooltip>
  );
}
