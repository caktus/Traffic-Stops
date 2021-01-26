import React from 'react';
import PropTypes from 'prop-types';

import { VictoryChart, VictoryGroup, VictoryBar, VictoryAxis } from 'victory';
import { AXIS_STYLE } from './chartConstants';
import ChartSkeleton from 'Components/Elements/Skeletons/ChartSkeleton';

function GroupedBar({ data, loading, horizontal, iTickValues, iTickFormat }) {
  if (loading) return <ChartSkeleton />;

  return (
    <VictoryChart domainPadding={15} width={700}>
      <VictoryAxis dependentAxis style={AXIS_STYLE} />
      <VictoryAxis
        label="Year"
        style={AXIS_STYLE}
        tickValues={iTickValues}
        tickFormat={iTickFormat}
      />
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
