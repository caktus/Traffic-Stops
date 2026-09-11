import React, { useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { Geographies, Geography, Marker } from 'react-simple-maps';
import { scaleSqrt } from 'd3-scale';

import { getDisparityPoliceURL, COUNTIES_GEOJSON_URL } from '../../Services/endpoints';
import { DISPARITY_COLORS, fmt, agencySearchRateLink } from './disparityConstants';
import useCountiesGeojson from './useCountiesGeojson';
import useDisparityData from './useDisparityData';
import DisparityTable from './DisparityTable';
import { NcMap, MapTooltip } from './MapPrimitives';
import * as S from './AgencyDisparities.styled';

const columns = [
  { key: 'group_name', label: 'Agency', link: agencySearchRateLink },
  { key: 'driver_race', label: 'Race' },
  { key: 'population', label: 'Population', numeric: true, format: fmt.int },
  { key: 'total_population', label: 'Total population', numeric: true, format: fmt.int },
  { key: 'stops', label: 'Stops', numeric: true, format: fmt.int },
  { key: 'total_stops', label: 'Total stops', numeric: true, format: fmt.int },
  { key: 'stop_rate', label: 'Stop rate', numeric: true, format: fmt.ratio },
  { key: 'baseline_rate', label: 'Baseline rate', numeric: true, format: fmt.ratio },
  { key: 'stop_rate_ratio', label: 'Stop rate ratio', numeric: true, format: fmt.ratio },
  { key: 'times_likely', label: 'Times as likely', numeric: true, format: fmt.times },
  { key: 'disparity_category', label: 'Disparity' },
];

export default function PoliceBubbleMap({ year, race }) {
  const history = useHistory();
  const { geojson, error: geojsonError } = useCountiesGeojson(COUNTIES_GEOJSON_URL);
  const { rows, loading, error } = useDisparityData(getDisparityPoliceURL({ year, race }));
  const [tooltip, setTooltip] = useState(null);

  // Bubble radius scales with total stops so higher-volume agencies read larger.
  const sizeScale = useMemo(() => {
    const max = rows.length ? Math.max(...rows.map((r) => r.total_stops || 0)) : 1;
    return scaleSqrt().domain([0, max]).range([3, 22]);
  }, [rows]);

  if (error) return <S.FetchError>Unable to load police data. Please try again.</S.FetchError>;
  if (geojsonError)
    return <S.FetchError>Unable to load county map. Please try again.</S.FetchError>;
  if (loading || !geojson) return <S.Loading height="500px">Loading map…</S.Loading>;

  const handleMove = (evt, row) => {
    const star = row.small_population ? '*' : '';
    const body = [
      `${row.times_likely.toFixed(2)}×${star} as likely`,
      row.disparity_category,
      `Stops (${race}): ${row.stops}`,
      `Total: ${row.total_stops}`,
    ];
    if (row.small_population) {
      body.push('*Small population (< 10,000) — ratio may be less statistically reliable.');
    }
    setTooltip({
      x: evt.clientX,
      y: evt.clientY,
      title: row.group_name,
      body,
    });
  };

  const handleClick = (row) => history.push(agencySearchRateLink(row));

  return (
    <div>
      <DisparityTable
        rows={rows}
        columns={columns}
        title={`Police Departments Stop Rate Ratios — ${race}`}
        downloadName={`police-disparities-${race}`}
      />
      <S.Legend>
        {Object.entries(DISPARITY_COLORS).map(([label, color]) => (
          <S.LegendItem key={label}>
            <S.Swatch round color={color} /> {label}
          </S.LegendItem>
        ))}
        <S.LegendItem>
          <S.Swatch round dashed faded /> Sub-threshold, actively reporting (&lt; 10,000 population)
        </S.LegendItem>
      </S.Legend>
      <NcMap>
        <Geographies geography={geojson}>
          {({ geographies }) =>
            geographies.map((geo) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill="#e4e9ee"
                stroke="#9aa5b1"
                strokeWidth={0.75}
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
            onClick={() => handleClick(row)}
            style={{ default: { cursor: 'pointer' } }}
          >
            <circle
              r={sizeScale(row.total_stops || 0)}
              fill={DISPARITY_COLORS[row.disparity_category]}
              fillOpacity={row.small_population ? 0.4 : 0.75}
              stroke={row.small_population ? '#333333' : '#ffffff'}
              strokeWidth={row.small_population ? 1.5 : 0.5}
              strokeDasharray={row.small_population ? '2,2' : undefined}
            />
          </Marker>
        ))}
      </NcMap>
      <MapTooltip tooltip={tooltip} />
    </div>
  );
}
