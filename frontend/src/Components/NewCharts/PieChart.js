import React from 'react';
import { Pie } from 'react-chartjs-2';

export default function PieChart({
  data,
  title,
  maintainAspectRatio = true,
  displayTitle = true,
  displayLegend = true,
  displayOutlabels = false,
  chartRef = null,
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
        position: displayOutlabels ? 'right' : 'top',
      },
      tooltip: {
        mode: 'nearest',
        intersect: false,
        enabled: !displayOutlabels,
        callbacks: {
          label(context) {
            return `${context.parsed}%`;
          },
        },
      },
      title: {
        display: displayTitle,
        text: title,
      },
    },
  };

  const alwaysShowTooltip = {
    id: 'alwaysShowTooltip',
    afterDraw(chart) {
      const { ctx } = chart;
      ctx.save();

      let offsetHeight = 10;

      chart.data.datasets.forEach((dataset, i) => {
        chart.getDatasetMeta(i).data.forEach((datapoint, index) => {
          const { x, y } = datapoint.tooltipPosition();

          if (!chart.legend.legendItems[index].hidden) {
            if (['Asian', 'Native American', 'Other'].includes(chart.data.labels[index])) {
              offsetHeight += 30;
            }
            const text = `${chart.data.labels[index]}: ${chart.data.datasets[0].data[index]}%`;
            const textWidth = ctx.measureText(text).width;
            ctx.fillStyle = 'rgba(255, 255, 255, 1)';
            const height = y - 15 - offsetHeight;
            ctx.fillRect(x - (textWidth + 10) / 2, height, textWidth + 10, 20);

            ctx.fillStyle = 'rgba(255, 255, 255, 1)';
            ctx.beginPath();
            ctx.moveTo(x, y + 15 - offsetHeight);
            ctx.lineTo(x - 10, y - 5 - offsetHeight);
            ctx.lineTo(x + 10, y - 5 - offsetHeight);
            ctx.fill();
            ctx.restore();

            ctx.font = '14px Arial';
            ctx.fillStyle = 'black';
            ctx.fillText(text, x - textWidth / 2, y - offsetHeight);
            ctx.restore();
          }
        });
      });
    },
  };

  const whiteBackground = {
    id: 'customCanvasBackgroundColor',
    beforeDraw: (chart, args, config) => {
      const { ctx } = chart;
      ctx.save();
      ctx.globalCompositeOperation = 'destination-over';
      ctx.fillStyle = config.color || '#fff';
      ctx.fillRect(0, 0, chart.width, chart.height);
      ctx.restore();
    },
  };

  const plugins = [whiteBackground];
  if (displayOutlabels) {
    plugins.push(alwaysShowTooltip);
  }

  const noData = data.datasets[0].data.every((v) => parseInt(v, 10) === 0);

  return (
    <>
      {noData && <div style={{ textAlign: 'center' }}>No Data Found</div>}
      <Pie ref={chartRef} options={options} data={data} plugins={plugins} />
    </>
  );
}
