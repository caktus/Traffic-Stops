import React from 'react';
import { Line } from 'react-chartjs-2';

export default function LineChart({
  data,
  title,
  maintainAspectRatio = true,
  displayTitle = true,
  displayLegend = true,
  yAxisMax = null,
  yAxisShowLabels = true,
}) {
  const options = {
    responsive: true,
    maintainAspectRatio,
    hover: {
      mode: 'nearest',
      intersect: false,
    },
    plugins: {
      legend: {
        display: displayLegend,
        position: 'top',
      },
      tooltip: {
        mode: 'nearest',
        intersect: false,
      },
      title: {
        display: displayTitle,
        text: title,
      },
    },
    scales: {
      y: {
        max: yAxisMax,
        ticks: {
          display: yAxisShowLabels,
        },
      },
    },
  };

  return <Line options={options} data={data} />;
}
