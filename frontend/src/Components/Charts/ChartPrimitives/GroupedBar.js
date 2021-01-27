import React from 'react';
import PropTypes from 'prop-types';

import { VictoryChart, VictoryGroup, VictoryBar, VictoryAxis } from 'victory';
import { AXIS_STYLE } from './chartConstants';
import ChartSkeleton from 'Components/Elements/Skeletons/ChartSkeleton';

function GroupedBar({
  data,
  loading,
  horizontal,
  iTickValues,
  iTickFormat,
  chartProps,
  dAxisProps,
  iAxisProps,
  barProps,
}) {
  if (loading) return <ChartSkeleton />;

  console.log('data: ', data);

  return (
    <VictoryChart domainPadding={15} width={700} {...chartProps}>
      <VictoryAxis dependentAxis style={AXIS_STYLE} {...dAxisProps} />
      <VictoryAxis
        style={AXIS_STYLE}
        tickValues={iTickValues}
        tickFormat={iTickFormat}
        {...iAxisProps}
      />
      <VictoryGroup offset={5}>
        {data.map((bar) => (
          <VictoryBar
            barWidth={4}
            horizontal={horizontal}
            key={bar.id}
            data={bar.data}
            style={{
              data: { fill: bar.color },
            }}
            {...barProps}
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
