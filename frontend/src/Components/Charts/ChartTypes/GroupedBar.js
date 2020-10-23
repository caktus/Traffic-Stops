import React from 'react';
import PropTypes from 'prop-types';

import { VictoryChart, VictoryGroup, VictoryBar, VictoryAxis } from 'victory';

const AXIS_STYLE = {
  grid: { stroke: '#818e99', strokeWidth: 0.5 },
  tickLabels: { fontSize: 8 },
};

function GroupedBar({ data, horizontal, xTicks }) {
  return (
    <VictoryChart domainPadding={15} width={700}>
      <VictoryAxis dependentAxis style={AXIS_STYLE} />
      <VictoryAxis label="Year" style={AXIS_STYLE} tickValues={xTicks} />
      <VictoryGroup offset={5}>
        {data.map((bar, i) => (
          <VictoryBar
            barWidth={4}
            horizontal={horizontal}
            key={bar.id}
            data={bar.data}
            style={{
              data: { fill: bar.color },
            }}
          />
        ))}
      </VictoryGroup>
    </VictoryChart>
  );
}

GroupedBar.propTypes = {
  horizontal: PropTypes.bool,
};

GroupedBar.defaultProps = {
  horizontal: false,
};

export default GroupedBar;
