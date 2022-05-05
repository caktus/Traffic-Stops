import React from 'react';
import PropTypes from 'prop-types';

import { CopwatchTooltip } from '../ChartPrimitives/CopwatchChart';
import {VictoryChart, VictoryGroup, VictoryBar, VictoryAxis, VictoryContainer, VictoryTooltip} from 'victory';
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
  toolTipFontSize
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
            labels={({ datum }) => `${datum.ethnicGroup}, ${datum.x}, ${dAxisProps.tickFormat(datum.y)}`}
            labelComponent={<VictoryTooltip style={{ fontSize: toolTipFontSize }}/>}
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

