import { Bar } from 'react-chartjs-2';
import DataLoading from '../Charts/ChartPrimitives/DataLoading';
import React from 'react';

export default function HorizontalBarChart({
  data,
  title,
  displayLegend = true,
  legendPosition = 'top',
  tooltipTitleCallback = null,
  tooltipLabelCallback,
  xStacked = false,
  yStacked = false,
}) {
  const options = {
    responsive: true,
    maintainAspectRatio: true,
    indexAxis: 'y',
    scales: {
      x: {
        stacked: xStacked,
        max: 100,
      },
      y: {
        max: 200,
        stacked: yStacked,
      },
    },
    plugins: {
      legend: {
        display: displayLegend,
        position: legendPosition,
      },
      title: {
        display: true,
        text: title,
      },
      tooltip: {
        callbacks: {
          title(context) {
            if (tooltipTitleCallback) {
              return tooltipTitleCallback(context);
            }
            return context.title;
          },
          label(context) {
            return tooltipLabelCallback(context);
          },
        },
      },
    },
  };

  if (!data.datasets.length) {
    return <DataLoading />;
  }

  return <Bar options={options} data={data} />;
}
