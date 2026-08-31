import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { useTheme } from 'styled-components';

import axios from '../../Services/Axios';
import { getDisparityAgenciesURL } from '../../Services/endpoints';
import { raceColor } from './disparityConstants';
import * as S from './AgencyDisparities.styled';

// Draws a dashed vertical baseline at times_likely == 1.0 (parity with white drivers).
const baselinePlugin = {
  id: 'disparityBaseline',
  afterDraw(chart) {
    const { ctx, chartArea, scales } = chart;
    if (!scales.x) return;
    const x = scales.x.getPixelForValue(1);
    if (x < chartArea.left || x > chartArea.right) return;
    ctx.save();
    ctx.beginPath();
    ctx.setLineDash([6, 6]);
    ctx.strokeStyle = '#FF8C00';
    ctx.lineWidth = 2;
    ctx.moveTo(x, chartArea.top);
    ctx.lineTo(x, chartArea.bottom);
    ctx.stroke();
    ctx.restore();
  },
};

export default function DisparityBarChart({ year, race }) {
  const theme = useTheme();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);
    axios
      .get(getDisparityAgenciesURL({ year, race, limit: 20 }))
      .then((res) => {
        if (active) setRows(res.data.agencies || []);
      })
      .catch(() => active && setError(true))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [year, race]);

  if (loading) return <S.Loading>Loading chart…</S.Loading>;
  if (error) return <S.FetchError>Unable to load agency ranking. Please try again.</S.FetchError>;
  if (!rows.length) return <S.Loading>No agency data for the selected filters.</S.Loading>;

  const color = raceColor(theme, race);
  const data = {
    labels: rows.map((r) => r.group_name),
    datasets: [
      {
        label: `Times as likely (${race})`,
        data: rows.map((r) => r.times_likely),
        backgroundColor: color,
        borderColor: color,
      },
    ],
  };

  const options = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: 'Where Non-White Drivers Are Most Likely to Be Stopped',
      },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.parsed.x.toFixed(2)}× as likely as white drivers`,
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        title: { display: true, text: 'Times as likely as white drivers' },
      },
    },
  };

  return (
    <S.ChartWrapper height={`${Math.max(300, rows.length * 28)}px`}>
      <Bar data={data} options={options} plugins={[baselinePlugin]} redraw />
    </S.ChartWrapper>
  );
}
