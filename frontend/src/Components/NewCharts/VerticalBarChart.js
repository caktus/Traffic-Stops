import { Bar } from 'react-chartjs-2';
import DataLoading from '../Charts/ChartPrimitives/DataLoading';
import React, { useRef, useState } from 'react';
import ChartModal from './ChartModal';
import { EmptyMessage } from '../Charts/ChartSections/EmptyChartMessage';

export default function VerticalBarChart({
  data,
  title,
  maintainAspectRatio = true,
  tooltipTitleCallback = null,
  tooltipLabelCallback = null,
  stacked = false,
  disableLegend = false,
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
    scales: {
      x: {
        stacked,
      },
      y: {
        stacked,
        max: stacked ? 1 : null,
      },
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
            return `${context.dataset.label}: ${context.formattedValue}`;
          },
        },
      },
    },
  };

  if (disableLegend) {
    options.plugins.legend.onClick = null;
  }
  if (stacked) {
    options.scales.y.ticks = {
      format: {
        style: 'percent',
      },
    };
  }

  const [isChartOpen, setIsChartOpen] = useState(false);
  const zoomedLineChartRef = useRef(null);

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

  if (data.loading) {
    return <DataLoading />;
  }

  return (
    <>
      <div style={{ width: '100%' }}>
        {!data.labels.length && <EmptyMessage />}
        <Bar options={options} data={data} />
      </div>
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
