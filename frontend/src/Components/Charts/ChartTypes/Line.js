import React, { useEffect } from 'react';

// Deps
import { VictoryChart, VictoryLine, VictoryAxis, VictoryVoronoiContainer } from 'victory';

const AXIS_STYLE = {
  grid: { stroke: '#818e99', strokeWidth: 0.5 },
  tickLabels: { fontSize: 8 },
};

const CHART_ANIMATION = { duration: 500, easing: 'linear' };

function Line({ data = [], xTicks }) {
  return (
    <VictoryChart
      animate={CHART_ANIMATION}
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
