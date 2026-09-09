import React, { useMemo, useState } from 'react';
import { Geographies, Geography } from 'react-simple-maps';
import { scaleSequential } from 'd3-scale';
import { interpolateRdYlGn } from 'd3-scale-chromatic';

import { getDisparitySheriffsURL, COUNTIES_GEOJSON_URL } from '../../Services/endpoints';
import {
  BELOW_THRESHOLD_COLOR,
  NO_DATA_COLOR,
  fmt,
  agencySearchRateLink,
} from './disparityConstants';
import useCountiesGeojson from './useCountiesGeojson';
import useDisparityData from './useDisparityData';
import DisparityTable from './DisparityTable';
import { NcMap, MapTooltip } from './MapPrimitives';
import * as S from './AgencyDisparities.styled';

const BELOW_STATUSES = ['small_population', 'small_race_population'];

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
];

export default function SheriffCountyMap({ year, race }) {
  const { geojson, error: geojsonError } = useCountiesGeojson(COUNTIES_GEOJSON_URL);
  const { rows, loading, error } = useDisparityData(
    getDisparitySheriffsURL({ year, race }),
    'sheriffs'
  );
  const [tooltip, setTooltip] = useState(null);

  const byFips = useMemo(() => {
    const lookup = {};
    rows.forEach((r) => {
      lookup[r.fips3] = r;
    });
    return lookup;
  }, [rows]);

  // Reversed RdYlGn: green = low disparity, red = high. Cap the domain so a
  // single extreme county does not wash out the rest of the scale.
  const colorScale = useMemo(() => {
    const active = rows.filter((r) => r.status === 'active');
    const max = active.length ? Math.max(...active.map((r) => r.times_likely)) : 3;
    return scaleSequential(interpolateRdYlGn).domain([Math.max(max, 2), 1]);
  }, [rows]);

  if (error) return <S.FetchError>Unable to load sheriff data. Please try again.</S.FetchError>;
  if (geojsonError)
    return <S.FetchError>Unable to load county map. Please try again.</S.FetchError>;
  if (loading || !geojson) return <S.Loading>Loading map…</S.Loading>;

  const fillFor = (fips) => {
    const row = byFips[fips];
    if (!row) return NO_DATA_COLOR;
    if (BELOW_STATUSES.includes(row.status)) return BELOW_THRESHOLD_COLOR;
    return colorScale(row.times_likely);
  };

  const handleMove = (evt, geo) => {
    const fips = geo.properties.FIPS;
    const county = geo.properties.County;
    const row = byFips[fips];
    let body;
    if (!row) body = 'No sheriff stop data reported.';
    else if (BELOW_STATUSES.includes(row.status)) body = 'Below population threshold.';
    else
      body = `${row.times_likely.toFixed(2)}× as likely · Stops: ${row.stops} · Pop: ${
        row.population
      }`;
    setTooltip({
      x: evt.clientX,
      y: evt.clientY,
      title: row ? row.group_name : `${county} County`,
      body,
    });
  };

  return (
    <div>
      <DisparityTable
        rows={rows}
        columns={columns}
        title={`Sheriff's Offices Stop Rate Ratios — ${race}`}
        downloadName={`sheriff-disparities-${race}`}
      />
      <S.Legend>
        <S.LegendItem>
          <S.Swatch color="#1a9850" /> Lower disparity
        </S.LegendItem>
        <S.LegendItem>
          <S.Swatch color="#d73027" /> Higher disparity
        </S.LegendItem>
        <S.LegendItem>
          <S.Swatch color={BELOW_THRESHOLD_COLOR} /> Below population threshold
        </S.LegendItem>
        <S.LegendItem>
          <S.Swatch color={NO_DATA_COLOR} /> No stop data reported
        </S.LegendItem>
      </S.Legend>
      <NcMap>
        <Geographies geography={geojson}>
          {({ geographies }) =>
            geographies.map((geo) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill={fillFor(geo.properties.FIPS)}
                stroke="#ffffff"
                strokeWidth={0.5}
                onMouseMove={(evt) => handleMove(evt, geo)}
                onMouseLeave={() => setTooltip(null)}
                style={{
                  default: { outline: 'none' },
                  hover: { outline: 'none', opacity: 0.85 },
                  pressed: { outline: 'none' },
                }}
              />
            ))
          }
        </Geographies>
      </NcMap>
      <MapTooltip tooltip={tooltip} />
    </div>
  );
}
