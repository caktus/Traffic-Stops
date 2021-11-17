import React from 'react';
import PropTypes from 'prop-types';

import { VictoryChart, VictoryGroup, VictoryBar, VictoryAxis, VictoryContainer } from 'victory';
import { AXIS_STYLE } from './chartConstants';
import ChartLoading from 'Components/Charts/ChartPrimitives/ChartLoading';
import BarSkeleton from 'Components/Elements/Skeletons/BarSkeleton';

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
  if (loading) return <ChartLoading skeleton={BarSkeleton} />

  return (
    <VictoryChart
      domainPadding={15}
      width={700}
      {...chartProps}
      containerComponent={<VictoryContainer style={{ touchAction: 'auto' }} />}
    >
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
