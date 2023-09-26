import { Bar } from 'react-chartjs-2';
import DataLoading from '../Charts/ChartPrimitives/DataLoading';
import React, { useState } from 'react';
import { usePopper } from 'react-popper';
import { tooltipLanguage } from '../../util/tooltipLanguage';
import styled from 'styled-components';

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
  displayLegend = true,
  legendPosition = 'top',
  tooltipTitleCallback = null,
  tooltipLabelCallback,
  xStacked = false,
  yStacked = false,
  displayStopPurposeTooltips = false,
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

  const showTooltip = () => {
    popperElement.setAttribute('data-show', true);
  };

  const hideTooltip = () => {
    popperElement.removeAttribute('data-show');
  };

  if (!data.datasets.length) {
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
      <Bar options={options} data={data} />
    </>
  );
}
