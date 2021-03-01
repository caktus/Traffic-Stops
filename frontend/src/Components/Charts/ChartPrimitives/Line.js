import React from 'react';

// Constants
import { AXIS_STYLE } from './chartConstants';

// Deps
import { VictoryChart, VictoryLine, VictoryAxis, VictoryContainer } from 'victory';
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
}) {
  if (loading) return <BarSkeleton />;

  return (
    <VictoryChart containerComponent={<VictoryContainer style={{ touchAction: 'auto' }} />}>
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
    </VictoryChart>
  );
}

export default Line;
