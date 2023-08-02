import React from 'react';
import { Pie } from 'react-chartjs-2';

export default function PieChart({
  data,
  title,
  maintainAspectRatio = true,
  displayTitle = true,
  displayLegend = true,
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
  };

  return <Pie options={options} data={data} />;
}
