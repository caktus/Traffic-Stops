import { Bar } from 'react-chartjs-2';
import DataLoading from '../Charts/ChartPrimitives/DataLoading';
import React, { useRef, useState } from 'react';
import { usePopper } from 'react-popper';
import { tooltipLanguage } from '../../util/tooltipLanguage';
import styled from 'styled-components';
import ChartModal from './ChartModal';

export const Tooltip = styled.div`
  background: #333;
  color: white;
  font-weight: bold;
  padding: 4px 8px;
  font-size: 13px;
  border-radius: 4px;
  visibility: hidden;

  &[data-show='true'] {
    visibility: visible;
  }
`;

export default function HorizontalBarChart({
  data,
  title,
  maintainAspectRatio = true,
  displayLegend = true,
  legendPosition = 'top',
  tooltipTitleCallback = null,
  tooltipLabelCallback,
  xStacked = false,
  yStacked = false,
  yAxisShowLabels = true,
  displayStopPurposeTooltips = false,
  redraw = false,
  modalConfig = {},
}) {
  const options = {
    responsive: true,
    maintainAspectRatio,
    indexAxis: 'y',
    scales: {
      x: {
        stacked: xStacked,
        max: 1,
        ticks: {
          format: {
            style: 'percent',
          },
        },
      },
      y: {
        max: 200,
        stacked: yStacked,
        ticks: {
          display: yAxisShowLabels,
        },
      },
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
        onHover(event, legendItem) {
          if (displayStopPurposeTooltips) {
            setTooltipText(tooltipLanguage(legendItem.text));
            showTooltip();
          }
        },
        onLeave() {
          if (displayStopPurposeTooltips) {
            setTooltipText('');
            hideTooltip();
          }
        },
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

  const [referenceElement, setReferenceElement] = useState(null);
  const [tooltipText, setTooltipText] = useState('');
  const [popperElement, setPopperElement] = useState(null);
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: 'top',
    modifiers: [
      {
        name: 'offset',
        options: {
          offset: [0, -10],
        },
      },
    ],
  });
  const [isChartOpen, setIsChartOpen] = useState(false);
  const zoomedLineChartRef = useRef(null);

  const showTooltip = () => {
    popperElement.setAttribute('data-show', true);
  };

  const hideTooltip = () => {
    popperElement.removeAttribute('data-show');
  };

  if (!data.labels.length) {
    return <DataLoading />;
  }

  const whiteBackground = {
    id: 'customBarCanvasBackgroundColor',
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
    modalOptions.plugins.legend = {
      display: data && data.datasets.length !== 1,
      position: 'top',
    };
    modalOptions.plugins.tooltip.enabled = true;
    modalOptions.plugins.title = {
      display: true,
      text: modalConfig.chartTitle,
    };
    modalOptions.scales.y.max = null;
    modalOptions.scales.y.ticks.display = true;
    return modalOptions;
  };

  const barChartModalPlugins = [whiteBackground];
  const barChartModalOptions = createModalOptions(options);

  return (
    <>
      {displayStopPurposeTooltips && (
        <>
          <div ref={setReferenceElement} />
          <Tooltip
            ref={setPopperElement}
            style={{ ...styles.popper, width: '300px' }}
            {...attributes.popper}
          >
            {tooltipText}
          </Tooltip>
        </>
      )}
      <Bar options={options} data={data} redraw={redraw} />
      <ChartModal
        isOpen={isChartOpen}
        closeModal={() => setIsChartOpen(false)}
        chartToPrintRef={zoomedLineChartRef}
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
