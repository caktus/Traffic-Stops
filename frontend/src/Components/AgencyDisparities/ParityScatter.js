import React from 'react';
import { Scatter } from 'react-chartjs-2';
import { useTheme } from 'styled-components';

import { getDisparityParityURL } from '../../Services/endpoints';
import { raceColor, fmt, agencySearchRateLink } from './disparityConstants';
import useDisparityData from './useDisparityData';
import DisparityTable from './DisparityTable';
import * as S from './AgencyDisparities.styled';

const columns = [
  { key: 'agency_name', label: 'Agency', link: agencySearchRateLink },
  { key: 'driver_race', label: 'Race' },
  { key: 'population', label: 'Population', numeric: true, format: fmt.int },
  { key: 'total_population', label: 'Total population', numeric: true, format: fmt.int },
  { key: 'stops', label: 'Stops', numeric: true, format: fmt.int },
  { key: 'total_stops', label: 'Total stops', numeric: true, format: fmt.int },
  { key: 'pop_share', label: 'Population share', numeric: true, format: fmt.pct },
  { key: 'stop_share', label: 'Stop share', numeric: true, format: fmt.pct },
  { key: 'excess_stops', label: 'Excess stops', numeric: true, format: fmt.int },
  { key: 'stop_rate_ratio', label: 'Stop rate ratio', numeric: true, format: fmt.ratio },
];

export default function ParityScatter({ year, race }) {
  const theme = useTheme();
  const { rows, loading, error } = useDisparityData(getDisparityParityURL({ year, race }));

  if (loading) return <S.Loading height="600px">Loading chart…</S.Loading>;
  if (error) return <S.FetchError>Unable to load parity data. Please try again.</S.FetchError>;
  if (!rows.length)
    return <S.Loading height="600px">No parity data for the selected filters.</S.Loading>;

  const toPoints = (label) =>
    rows
      .filter((r) => r.driver_race === label)
      .map((r) => ({
        x: r.pop_share,
        y: r.stop_share,
        agency: r.agency_name,
        excess: r.excess_stops,
        ratio: r.stop_rate_ratio,
      }));

  const data = {
    datasets: [
      {
        type: 'line',
        label: 'Line of Fairness',
        data: [
          { x: 0, y: 0 },
          { x: 1, y: 1 },
        ],
        borderColor: '#999999',
        borderDash: [6, 6],
        borderWidth: 1,
        pointRadius: 0,
        fill: false,
      },
      {
        label: race,
        data: toPoints(race),
        backgroundColor: raceColor(theme, race),
      },
      {
        label: 'White',
        data: toPoints('White'),
        backgroundColor: raceColor(theme, 'White'),
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { min: 0, max: 1, title: { display: true, text: 'Share of population' } },
      y: { min: 0, max: 1, title: { display: true, text: 'Share of traffic stops' } },
    },
    plugins: {
      title: {
        display: true,
        text: 'How Do Traffic Stops Compare With the Community Population?',
      },
      tooltip: {
        callbacks: {
          label(ctx) {
            const p = ctx.raw;
            if (p.agency === undefined) return null;
            return `${p.agency}: pop ${(p.x * 100).toFixed(1)}%, stops ${(p.y * 100).toFixed(
              1
            )}%, excess ${Math.round(p.excess)}`;
          },
        },
      },
    },
  };

  return (
    <>
      <DisparityTable
        rows={rows}
        columns={columns}
        title={`Population vs. Traffic Stops — ${race}`}
        downloadName={`parity-${race}`}
      />
      <S.ChartWrapper height="600px">
        <Scatter data={data} options={options} redraw />
      </S.ChartWrapper>
    </>
  );
}
