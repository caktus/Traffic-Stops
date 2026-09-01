import React, { useMemo, useState } from 'react';
import { Geographies, Geography, Marker } from 'react-simple-maps';
import { scaleSqrt } from 'd3-scale';

import { getDisparityPoliceURL, COUNTIES_GEOJSON_URL } from '../../Services/endpoints';
import { DISPARITY_COLORS } from './disparityConstants';
import useCountiesGeojson from './useCountiesGeojson';
import useDisparityData from './useDisparityData';
import { NcMap, MapTooltip } from './MapPrimitives';
import * as S from './AgencyDisparities.styled';

export default function PoliceBubbleMap({ year, race }) {
  const geojson = useCountiesGeojson(COUNTIES_GEOJSON_URL);
  const { rows, loading, error } = useDisparityData(getDisparityPoliceURL({ year, race }));
  const [tooltip, setTooltip] = useState(null);

  // Bubble radius scales with total stops so higher-volume agencies read larger.
  const sizeScale = useMemo(() => {
    const max = rows.length ? Math.max(...rows.map((r) => r.total_stops || 0)) : 1;
    return scaleSqrt().domain([0, max]).range([3, 22]);
  }, [rows]);

  if (error) return <S.FetchError>Unable to load police data. Please try again.</S.FetchError>;
  if (loading || !geojson) return <S.Loading>Loading map…</S.Loading>;

  const handleMove = (evt, row) => {
    setTooltip({
      x: evt.clientX,
      y: evt.clientY,
      title: row.group_name,
      body: `${row.times_likely.toFixed(2)}× as likely · ${row.disparity_category}
Stops (${race}): ${row.stops} · Total: ${row.total_stops}${
        row.small_population ? ' · < 10,000 population' : ''
      }`,
    });
  };

  return (
    <div>
      <NcMap>
        <Geographies geography={geojson}>
          {({ geographies }) =>
            geographies.map((geo) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill="#eeeeee"
                stroke="#cccccc"
                strokeWidth={0.5}
                style={{ default: { outline: 'none' }, hover: { outline: 'none' } }}
              />
            ))
          }
        </Geographies>
        {rows.map((row) => (
          <Marker
            key={row.group_id}
            coordinates={[row.longitude, row.latitude]}
            onMouseMove={(evt) => handleMove(evt, row)}
            onMouseLeave={() => setTooltip(null)}
          >
            <circle
              r={sizeScale(row.total_stops || 0)}
              fill={
                row.small_population
                  ? 'rgba(255,255,255,0)'
                  : DISPARITY_COLORS[row.disparity_category]
              }
              stroke={row.small_population ? '#777777' : '#ffffff'}
              strokeWidth={row.small_population ? 2 : 0.5}
              fillOpacity={0.75}
            />
          </Marker>
        ))}
      </NcMap>
      <S.Legend>
        {Object.entries(DISPARITY_COLORS).map(([label, color]) => (
          <S.LegendItem key={label}>
            <S.Swatch round color={color} /> {label}
          </S.LegendItem>
        ))}
        <S.LegendItem>
          <S.Swatch round hollow /> &lt; 10,000 population
        </S.LegendItem>
      </S.Legend>
      <MapTooltip tooltip={tooltip} />
    </div>
  );
}
