import React from 'react';
import PropTypes from 'prop-types';

import { VictoryChart, VictoryStack, VictoryBar, VictoryAxis } from 'victory';
import { AXIS_STYLE } from './chartConstants';

// Childre
import ChartSkeleton from 'Components/Elements/Skeletons/ChartSkeleton';

function StackedBar({ data, loading, tickValues }) {
  if (loading) return <ChartSkeleton />;

  return (
    <VictoryChart style={{ padding: 0 }}>
      <VictoryAxis
        dependentAxis
        style={AXIS_STYLE}
        tickValues={[10, 20, 30, 40, 50, 60, 70, 80, 90, 100]}
        tickFormat={(t) => (t % 20 === 0 ? `${t}%` : null)}
      />
      <VictoryAxis
        label="Year"
        tickValues={tickValues}
        style={AXIS_STYLE}
        tickFormat={(t) => (t % 2 === 0 ? t : null)}
      />
      <VictoryStack>
        {data.map((bar) => (
          <VictoryBar
            key={bar.id}
            data={bar.data}
            barWidth={15}
            style={{
              data: { fill: bar.color, opacity: 0.5 },
            }}
          />
        ))}
      </VictoryStack>
    </VictoryChart>
  );
}

StackedBar.propTypes = {
  data: PropTypes.array.isRequired,
  tickValues: PropTypes.arrayOf(PropTypes.number),
};

StackedBar.defaultProps = {
  tickValues: [],
};

export default StackedBar;
