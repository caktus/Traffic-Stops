import React from 'react';
import { Scatter } from 'react-chartjs-2';
import { useTheme } from 'styled-components';

import { getDisparityParityURL } from '../../Services/endpoints';
import { raceColor } from './disparityConstants';
import useDisparityData from './useDisparityData';
import * as S from './AgencyDisparities.styled';

export default function ParityScatter({ year, race }) {
  const theme = useTheme();
  const { rows, loading, error } = useDisparityData(getDisparityParityURL({ year, race }));

  if (loading) return <S.Loading>Loading chart…</S.Loading>;
  if (error) return <S.FetchError>Unable to load parity data. Please try again.</S.FetchError>;
  if (!rows.length) return <S.Loading>No parity data for the selected filters.</S.Loading>;

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
    <S.ChartWrapper height="600px">
      <Scatter data={data} options={options} redraw />
    </S.ChartWrapper>
  );
}
