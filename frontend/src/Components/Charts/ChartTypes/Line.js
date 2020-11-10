import React from 'react';

// Constants
import { AXIS_STYLE } from './chartConstants';

// Deps
import { VictoryChart, VictoryLine, VictoryAxis, VictoryVoronoiContainer } from 'victory';

function Line({ data = [], xTicks }) {
  return (
    <VictoryChart
      containerComponent={
        <VictoryVoronoiContainer
          voronoiDimension="x"
          labels={({ datum }) => `${datum.displayName} - ${datum.y}`}
        />
      }
    >
      <VictoryAxis dependentAxis style={AXIS_STYLE} />
      <VictoryAxis label="Year" style={AXIS_STYLE} tickValues={xTicks} />
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
