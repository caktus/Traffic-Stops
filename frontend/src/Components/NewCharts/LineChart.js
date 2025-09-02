import React, { useRef, useState } from 'react';
import { Line } from 'react-chartjs-2';
import tooltipLanguage from '../../util/tooltipLanguage';
import { usePopper } from 'react-popper';
import styled from 'styled-components';
import DataLoading from '../Charts/ChartPrimitives/DataLoading';
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

export default function LineChart({
  data,
  title,
  maintainAspectRatio = false,
  displayTitle = true,
  displayLegend = true,
  yAxisMax = null,
  yAxisShowLabels = true,
  yScaleFormat = 'decimal',
  tooltipTitleCallback = null,
  tooltipLabelCallback,
  displayStopPurposeTooltips = false,
  showLegendOnBottom = true,
  redraw = false,
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
        position: showLegendOnBottom ? 'bottom' : 'top',
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
      tooltip: {
        mode: 'nearest',
        intersect: false,
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
      title: {
        display: displayTitle,
        text: title,
      },
    },
    scales: {
      y: {
        min: 0,
        max: yAxisMax,
        ticks: {
          display: yAxisShowLabels,
          format: {
            style: yScaleFormat,
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
    id: 'customLineCanvasBackgroundColor',
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
      display: true,
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

  const lineChartModalPlugins = [whiteBackground];
  const lineChartModalOptions = createModalOptions(options);

  if (data.loading) {
    return <DataLoading />;
  }

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
      {!data.labels.length && <EmptyMessage />}
      <Line
        options={options}
        data={data}
        redraw={redraw}
        datasetIdKey={title}
        plugins={[whiteBackground]}
      />
      <ChartModal
        isOpen={isChartOpen}
        closeModal={() => setIsChartOpen(false)}
        chartToPrintRef={zoomedLineChartRef}
        chartTitle={modalConfig.chartTitle}
        {...modalConfig}
      >
        <Line
          options={lineChartModalOptions}
          data={data}
          redraw={false}
          datasetIdKey={title}
          plugins={lineChartModalPlugins}
          ref={zoomedLineChartRef}
        />
      </ChartModal>
    </>
  );
}
