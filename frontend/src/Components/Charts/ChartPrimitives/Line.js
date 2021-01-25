import React from 'react';

// Constants
import { AXIS_STYLE } from './chartConstants';

// Deps
import { VictoryChart, VictoryLine, VictoryAxis } from 'victory';
import ChartSkeleton from 'Components/Elements/Skeletons/ChartSkeleton';

function Line({ data = [], loading, iTickValues, iTickFormat, dTickValues, dTickFormat }) {
  if (loading) return <ChartSkeleton />;

  return (
    <VictoryChart>
      <VictoryAxis
        dependentAxis
        style={AXIS_STYLE}
        tickFormat={dTickFormat}
        tickValues={dTickValues}
      />
      <VictoryAxis
        label="Year"
        style={AXIS_STYLE}
        tickFormat={iTickFormat}
        tickValues={iTickValues}
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
    </VictoryChart>
  );
}

export default Line;
