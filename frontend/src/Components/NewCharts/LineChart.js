import React from 'react';
import { Line } from 'react-chartjs-2';
import { tooltipLanguage } from '../../util/tooltipLanguage';

export default function LineChart({
  data,
  title,
  maintainAspectRatio = true,
  displayTitle = true,
  displayLegend = true,
  yAxisMax = null,
  yAxisShowLabels = true,
}) {
  let hovering = false;
  const styledtooltip = document.getElementById('TooltipStyled');
  const tooltips = tooltipLanguage;
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
        onHover: function (event, legendItem) {
          if (hovering) {
            return;
          }
          hovering = true;
          styledtooltip.innerHTML = tooltips[legendItem.datasetIndex];
          styledtooltip.style.left = event.x + 'px';
          styledtooltip.style.top = event.y + 'px';
        },
        onLeave: function () {
          hovering = false;
          styledtooltip.innerHTML = '';
        },
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
