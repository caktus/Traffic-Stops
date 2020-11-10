import React from 'react';

import { VictoryChart, VictoryStack, VictoryBar, VictoryTooltip, VictoryAxis } from 'victory';

const AXIS_STYLE = {
  grid: { stroke: '#818e99', strokeWidth: 0.5 },
  tickLabels: { fontSize: 8 },
};

const tooltipProps = {
  flyoutWidth: 95,
  flyoutHeight: 35,
  cornerRadius: 5,
  pointerLength: 40,
  flyoutStyle: {
    stroke: '#868C97',
    strokeWidth: 2,
    fill: '#FFFFFF',
  },
  style: {
    fill: '#868C97',
    fontSize: 8,
    fontWeight: 500,
    textAnchor: 'middle',
  },
};

function StackedBar({ data = [] }) {
  return (
    <VictoryChart animate={{ duration: 500, easing: 'linear' }}>
      <VictoryAxis dependentAxis style={AXIS_STYLE} />
      <VictoryAxis label="Year" style={AXIS_STYLE} />
      <VictoryStack>
        {data.map((bar) => (
          <VictoryBar
            key={bar.label}
            data={bar.data}
            style={{
              data: { fill: bar.color },
            }}
            labelComponent={<VictoryTooltip {...tooltipProps} />}
          />
        ))}
      </VictoryStack>
    </VictoryChart>
  );
}

export default StackedBar;
