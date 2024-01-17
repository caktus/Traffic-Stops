import { Bar } from 'react-chartjs-2';
import DataLoading from '../Charts/ChartPrimitives/DataLoading';
import React, { useRef, useState } from 'react';
import ChartModal from './ChartModal';

export default function VerticalBarChart({
  data,
  title,
  maintainAspectRatio = true,
  tooltipTitleCallback = null,
  tooltipLabelCallback = null,
  modalConfig = {},
}) {
  const options = {
    responsive: true,
    maintainAspectRatio,
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
      title: {
        display: true,
        text: title,
      },
      legend: {
        position: 'bottom',
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
            if (tooltipLabelCallback) {
              return tooltipLabelCallback(context);
            }
            // console.log(context);
            return `${context.dataset.label}: ${context.formattedValue}`;
          },
        },
      },
    },
  };

  const [isChartOpen, setIsChartOpen] = useState(false);
  const zoomedLineChartRef = useRef(null);

  if (!data.labels.length) {
    return <DataLoading />;
  }

  const whiteBackground = {
    id: 'customVerticalBarCanvasBackgroundColor',
    beforeDraw: (chart, args, config) => {
      const { ctx } = chart;
      ctx.save();
      ctx.globalCompositeOperation = 'destination-over';
      ctx.fillStyle = config.color || '#fff';
      ctx.fillRect(0, 0, chart.width, chart.height);
      ctx.restore();
    },
  };

  const createModalOptions = (opts) => {
    const modalOptions = JSON.parse(JSON.stringify(opts));
    modalOptions.plugins.tooltip.enabled = true;
    modalOptions.plugins.title = {
      display: true,
      text: modalConfig.chartTitle,
    };
    return modalOptions;
  };

  const barChartModalPlugins = [whiteBackground];
  const barChartModalOptions = createModalOptions(options);

  return (
    <>
      <Bar options={options} data={data} />
      <ChartModal
        isOpen={isChartOpen}
        closeModal={() => setIsChartOpen(false)}
        chartToPrintRef={zoomedLineChartRef}
        chartTitle={modalConfig.chartTitle}
        {...modalConfig}
      >
        <Bar
          ref={zoomedLineChartRef}
          data={data}
          options={barChartModalOptions}
          plugins={barChartModalPlugins}
        />
      </ChartModal>
    </>
  );
}
