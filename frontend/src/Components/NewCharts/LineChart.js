import React, { useState } from 'react';
import { Line } from 'react-chartjs-2';
import { tooltipLanguage } from '../../util/tooltipLanguage';
import { usePopper } from 'react-popper';
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

export default function LineChart({
  data,
  title,
  maintainAspectRatio = true,
  displayTitle = true,
  displayLegend = true,
  yAxisMax = null,
  yAxisShowLabels = true,
  displayStopPurposeTooltips = false,
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
        position: 'top',
        onHover(event, legendItem) {
          if (displayStopPurposeTooltips) {
            setTooltipText(tooltipLanguage(legendItem.text));
            showTooltip();
          }
        },
        onLeave() {
          setTooltipText('');
          hideTooltip();
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

  return (
    <>
      <div ref={setReferenceElement} />
      <Tooltip
        ref={setPopperElement}
        style={{ ...styles.popper, width: '300px' }}
        {...attributes.popper}
      >
        {tooltipText}
      </Tooltip>
      <Line options={options} data={data} />;
    </>
  );
}
