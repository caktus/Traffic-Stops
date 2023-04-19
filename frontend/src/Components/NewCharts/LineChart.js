import React from 'react';
import { Line } from 'react-chartjs-2';

export default function LineChart({ data, title }) {
  const options = {
    responsive: true,
    hover: {
      mode: 'nearest',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        mode: 'nearest',
        intersect: false,
      },
      title: {
        display: true,
        text: title,
      },
    },
  };

  return <Line options={options} data={data} />;
}
