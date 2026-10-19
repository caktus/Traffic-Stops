import React, { useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { Geographies, Geography, Marker } from 'react-simple-maps';
import { scaleLog } from 'd3-scale';
import { ascending, quantileSorted } from 'd3-array';

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

const BUBBLE_MIN_RADIUS = 4;
const BUBBLE_MAX_RADIUS = 24;
// Marker only applies the style for its current state, so each state needs the cursor.
const BUBBLE_CURSOR = { cursor: 'pointer' };

// Round to one significant figure (e.g. 17,119 -> 20,000) for legend labels.
const roundSignificant = (value) => {
  const magnitude = 10 ** Math.floor(Math.log10(value));
  return Math.round(value / magnitude) * magnitude;
};

export default function PoliceBubbleMap({ year, race }) {
  const history = useHistory();
  const { geojson, error: geojsonError } = useCountiesGeojson(COUNTIES_GEOJSON_URL);
  const { rows, loading, error } = useDisparityData(getDisparityPoliceURL({ year, race }));
  const [tooltip, setTooltip] = useState(null);
  const [hovered, setHovered] = useState(null);
  const [showSubThreshold, setShowSubThreshold] = useState(true);
  const [hiddenCategories, setHiddenCategories] = useState(() => new Set());

  // Bubble radius scales with the log of an agency's total stops (all races, not
  // the selected group's stops). Stop volumes span several orders of magnitude, so
  // a log scale keeps low- and mid-volume agencies visually distinguishable. The
  // domain runs from the smallest agency to the 95th percentile and is clamped,
  // so a few very high-volume agencies don't stretch the scale.
  const { sizeScale, sizeLegend } = useMemo(() => {
    const totals = rows
      .map((r) => r.total_stops || 0)
      .filter((t) => t > 0)
      .sort(ascending);
    if (!totals.length) {
      return { sizeScale: () => BUBBLE_MIN_RADIUS, sizeLegend: [] };
    }
    const low = totals[0];
    const high = Math.max(quantileSorted(totals, 0.95), low + 1);
    const scale = scaleLog()
      .domain([low, high])
      .range([BUBBLE_MIN_RADIUS, BUBBLE_MAX_RADIUS])
      .clamp(true);
    const legendValues = [low, quantileSorted(totals, 0.5), high].map(roundSignificant);
    return {
      // Guard against log(0) for agencies with no total_stops value.
      sizeScale: (value) => scale(Math.max(value, low)),
      sizeLegend: [...new Set(legendValues)].map((value) => ({ value, radius: scale(value) })),
    };
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
    setHovered(row);
    setTooltip({
      x: evt.clientX,
      y: evt.clientY,
      title: row.group_name,
      body,
    });
  };

  const clearHover = () => {
    setTooltip(null);
    setHovered(null);
  };

  const toggleCategory = (label) => {
    setHiddenCategories((prev) => {
      const next = new Set(prev);
      if (!next.delete(label)) next.add(label);
      return next;
    });
    clearHover();
  };

  const handleClick = (row) => history.push(agencySearchRateLink(row));

  const visibleRows = rows
    .filter((row) => showSubThreshold || !row.small_population)
    .filter((row) => !hiddenCategories.has(row.disparity_category))
    // Draw large bubbles first so small ones stay visible and clickable on top.
    .sort((a, b) => (b.total_stops || 0) - (a.total_stops || 0));

  return (
    <div>
      <DisparityTable
        rows={rows}
        columns={columns}
        title={`Police Departments Stop Rate Ratios — ${race}`}
        downloadName={`police-disparities-${race}`}
      />
      <S.Legend>
        {Object.entries(DISPARITY_COLORS).map(([label, color]) => {
          const hidden = hiddenCategories.has(label);
          return (
            <S.LegendToggle
              key={label}
              type="button"
              off={hidden}
              aria-pressed={!hidden}
              title={`${hidden ? 'Show' : 'Hide'} ${label} agencies`}
              onClick={() => toggleCategory(label)}
            >
              <S.Swatch round color={color} /> {label}
            </S.LegendToggle>
          );
        })}
        <S.LegendToggle
          type="button"
          off={!showSubThreshold}
          aria-pressed={showSubThreshold}
          title={`${showSubThreshold ? 'Hide' : 'Show'} sub-threshold agencies`}
          onClick={() => {
            setShowSubThreshold((show) => !show);
            clearHover();
          }}
        >
          <S.Swatch round dashed faded /> Sub-threshold, actively reporting (&lt; 10,000 population)
        </S.LegendToggle>
      </S.Legend>
      {sizeLegend.length > 0 && (
        <S.Legend>
          Bubble size = total stops:
          {sizeLegend.map(({ value, radius }) => (
            <S.LegendItem key={value}>
              <S.BubbleSwatch size={radius * 2} /> {value.toLocaleString()}
            </S.LegendItem>
          ))}
        </S.Legend>
      )}
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
        {visibleRows.map((row) => (
          <Marker
            key={row.group_id}
            coordinates={[row.longitude, row.latitude]}
            onMouseMove={(evt) => handleMove(evt, row)}
            onMouseLeave={clearHover}
            onClick={() => handleClick(row)}
            style={{ default: BUBBLE_CURSOR, hover: BUBBLE_CURSOR, pressed: BUBBLE_CURSOR }}
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
        {/* Drawn last so an overlapped bubble is fully visible while hovered. */}
        {hovered && (
          <Marker coordinates={[hovered.longitude, hovered.latitude]}>
            <circle
              r={sizeScale(hovered.total_stops || 0)}
              fill={DISPARITY_COLORS[hovered.disparity_category]}
              fillOpacity={0.9}
              stroke="#111111"
              strokeWidth={2}
              pointerEvents="none"
            />
          </Marker>
        )}
      </NcMap>
      <MapTooltip tooltip={tooltip} />
    </div>
  );
}
