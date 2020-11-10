import React from 'react';

import { VictoryChart, VictoryStack, VictoryBar, VictoryTooltip, VictoryAxis } from 'victory';
import { AXIS_STYLE, TOOLTIP_PROPS } from './chartConstants';


function StackedBar({ data = [] }) {
  return (
    <VictoryChart   >
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
            labelComponent={<VictoryTooltip {...TOOLTIP_PROPS} />}
          />
        ))}
      </VictoryStack>
    </VictoryChart>
  );
}

export default StackedBar;
