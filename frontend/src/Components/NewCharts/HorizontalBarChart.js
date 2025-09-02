import { Bar } from 'react-chartjs-2';
import DataLoading from '../Charts/ChartPrimitives/DataLoading';
import React, { useRef, useState } from 'react';
import { usePopper } from 'react-popper';
import { tooltipLanguage } from '../../util/tooltipLanguage';
import styled from 'styled-components';
import ChartModal from './ChartModal';
import { EmptyMessage } from '../Charts/ChartSections/EmptyChartMessage';

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
  maintainAspectRatio = false,
  displayLegend = true,
  legendPosition = 'top',
  tooltipTitleCallback = null,
  tooltipLabelCallback,
  xStacked = false,
  yStacked = false,
  yAxisShowLabels = true,
  displayStopPurposeTooltips = false,
  redraw = false,
  pinMaxValue = true, // Some graph percentages go beyond 100%
  tickStyle = 'percent',
  stepSize = 0.5,
  modalConfig = {},
  skipNull = false,
}) {
  const tickCallback = function tickCallback(val) {
    if (tickStyle === 'percent') {
      return `${val * 100}%`;
    }
    return val.toLocaleString();
  };
  const options = {
    responsive: true,
    maintainAspectRatio,
    indexAxis: 'y',
    skipNull,
    scales: {
      x: {
        stacked: xStacked,
        max: pinMaxValue ? 1 : null,
        ticks: {
          stepSize: pinMaxValue ? 0.1 : stepSize,
          callback: tickCallback,
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
    modalOptions.plugins.tooltip.callbacks.label = tooltipLabelCallback;
    modalOptions.plugins.title = {
      display: true,
      text: modalConfig.chartTitle,
    };
    modalOptions.scales.y.max = null;
    modalOptions.scales.y.ticks.display = true;
    modalOptions.scales.x.ticks.callback = tickCallback;
    return modalOptions;
  };

  const barChartModalPlugins = [whiteBackground];
  const barChartModalOptions = createModalOptions(options);

  if (data.loading) {
    return <DataLoading />;
  }

  const noData = data.datasets.every((d) => d.data.every((v) => v === 0));

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
      {noData && <EmptyMessage />}
      <Bar options={options} data={data} redraw={redraw} />
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
