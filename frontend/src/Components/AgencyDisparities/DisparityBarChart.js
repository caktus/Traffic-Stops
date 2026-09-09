import React from 'react';
import { Bar } from 'react-chartjs-2';
import { useTheme } from 'styled-components';
import { useHistory } from 'react-router-dom';

import { getDisparityAgenciesURL } from '../../Services/endpoints';
import { raceColor, fmt, agencySearchRateLink } from './disparityConstants';
import useDisparityData from './useDisparityData';
import DisparityTable from './DisparityTable';
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

const columns = [
  { key: 'agency_name_race', label: 'Agency', link: agencySearchRateLink },
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

export default function DisparityBarChart({ year, race }) {
  const theme = useTheme();
  const history = useHistory();
  const { rows, loading, error } = useDisparityData(
    getDisparityAgenciesURL({ year, race, limit: 20 })
  );

  if (loading) return <S.Loading height="500px">Loading chart…</S.Loading>;
  if (error) return <S.FetchError>Unable to load agency ranking. Please try again.</S.FetchError>;
  if (!rows.length)
    return <S.Loading height="500px">No agency data for the selected filters.</S.Loading>;

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
    // Trigger on any hover/click along a bar's row, not just directly over the fill.
    interaction: { mode: 'nearest', axis: 'y', intersect: false },
    onClick: (evt, elements) => {
      if (elements.length) history.push(agencySearchRateLink(rows[elements[0].index]));
    },
    onHover: (evt, elements) => {
      // eslint-disable-next-line no-param-reassign
      evt.native.target.style.cursor = elements.length ? 'pointer' : 'default';
    },
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
    <>
      <DisparityTable
        rows={rows}
        columns={columns}
        title={`Top Agencies by Likelihood of Stop — ${race}`}
        downloadName={`top-agencies-${race}`}
      />
      <S.Legend>
        <S.LegendItem>
          <S.LineSwatch /> Equity (1.0× — same rate as white drivers)
        </S.LegendItem>
      </S.Legend>
      <S.ChartWrapper height={`${Math.max(300, rows.length * 28)}px`}>
        <Bar data={data} options={options} plugins={[baselinePlugin]} redraw />
      </S.ChartWrapper>
    </>
  );
}
