import React from 'react';

// Constants
import { AXIS_STYLE } from './chartConstants';

// Deps
import CopwatchChart from 'Components/Charts/ChartPrimitives/CopwatchChart';
import { VictoryLine, VictoryAxis } from 'victory';
import ChartLoading from 'Components/Charts/ChartPrimitives/ChartLoading';
import BarSkeleton from 'Components/Elements/Skeletons/BarSkeleton';


function Line({
  data = [],
  loading,
  iTickValues,
  iTickFormat,
  dTickValues,
  dTickFormat,
  dAxisProps = {},
  iAxisProps = {},
  yAxisLabel
}) {
  if (loading) return <ChartLoading skeleton={BarSkeleton} />

  return (
    <CopwatchChart yAxisLabel={yAxisLabel}>
      <VictoryAxis
        dependentAxis
        style={AXIS_STYLE}
        tickFormat={dTickFormat}
        tickValues={dTickValues}
        {...dAxisProps}

      />
      <VictoryAxis
        label="Year"
        style={AXIS_STYLE}
        tickFormat={iTickFormat}
        tickValues={iTickValues}
        {...iAxisProps}
      />
      {data.map((lineData) => (
        <VictoryLine
          key={lineData.id}
          data={lineData.data}
          style={{
            data: { stroke: lineData.color },
          }}
        />
      ))}
    </CopwatchChart>
  );
}

export default Line;
