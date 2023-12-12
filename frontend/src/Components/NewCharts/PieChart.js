import React, { useRef, useState } from 'react';
import { Pie } from 'react-chartjs-2';
import DataLoading from '../Charts/ChartPrimitives/DataLoading';
import ChartModal from './ChartModal';

export default function PieChart({
  data,
  title,
  maintainAspectRatio = true,
  displayTitle = true,
  displayLegend = true,
  legendPosition = 'right',
  showWhiteBackground = true,
  modalConfig = {},
}) {
  const options = {
    responsive: true,
    maintainAspectRatio,
    hover: {
      mode: 'nearest',
      intersect: false,
    },
    onHover(evt, chartEl) {
      // If there is a chart element found on hover, set the cursor to pointer
      // to let users know they can view the modal
      // eslint-disable-next-line no-param-reassign
      evt.native.target.style.cursor = chartEl.length ? 'pointer' : 'default';
    },
    onClick(evt, activeEls) {
      if (activeEls.length) {
        setIsChartOpen(true);
      }
    },
    plugins: {
      legend: {
        display: displayLegend,
        position: legendPosition,
      },
      tooltip: {
        mode: 'nearest',
        intersect: false,
        enabled: true,
        callbacks: {
          label(context) {
            return `${context.parsed}%`;
          },
        },
        titleColor: '#000',
        bodyColor: '#000',
        backgroundColor: 'rgba(255, 255, 255, 1.0)',
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

  const plugins = [];
  if (showWhiteBackground) {
    plugins.push(whiteBackground);
  }

  const noData = data.datasets[0].data.every((v) => parseInt(v, 10) === 0);

  // Setup modal options
  const [isChartOpen, setIsChartOpen] = useState(false);
  const zoomedPieCharRef = useRef(null);

  const createModalOptions = (opts) => {
    const modalOptions = JSON.parse(JSON.stringify(opts));
    modalOptions.plugins.legend = {
      display: true,
      position: 'right',
    };
    modalOptions.plugins.tooltip.enabled = false;
    modalOptions.plugins.title = {
      display: true,
      text: modalConfig.chartTitle,
    };
    return modalOptions;
  };

  const pieChartModalPlugins = [...plugins, alwaysShowTooltip];
  const pieChartModalOptions = createModalOptions(options);

  if (!data.datasets.length) {
    return <DataLoading />;
  }

  return (
    <>
      {noData && <div style={{ textAlign: 'center' }}>No Data Found</div>}
      <Pie ref={zoomedPieCharRef} options={options} data={data} plugins={plugins} />
      <ChartModal
        isOpen={isChartOpen}
        closeModal={() => setIsChartOpen(false)}
        chartToPrintRef={zoomedPieCharRef}
        {...modalConfig}
      >
        <Pie
          ref={zoomedPieCharRef}
          options={pieChartModalOptions}
          data={data}
          plugins={pieChartModalPlugins}
        />
      </ChartModal>
    </>
  );
}
