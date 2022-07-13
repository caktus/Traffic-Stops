import React from 'react';

// Constants
import { AXIS_STYLE } from './chartConstants';

// Deps
import { VictoryLine, VictoryAxis, VictoryTooltip } from 'victory';
import ChartLoading from './ChartLoading';
import BarSkeleton from '../../Elements/Skeletons/BarSkeleton';
import EmptyChartMessage from '../ChartSections/EmptyChartMessage';
import CopwatchChart from './CopwatchChart';

function Line({
  data = [],
  loading,
  iTickValues,
  iTickFormat,
  dTickValues,
  dTickFormat,
  dAxisProps = {},
  iAxisProps = {},
  yAxisLabel,
}) {
  if (loading) return <ChartLoading skeleton={BarSkeleton} />;

  return (
    <>
      <EmptyChartMessage data={data} />
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
            labels={({ datum }) =>
              `${datum.x}, ${datum.displayName}, ${dAxisProps.tickFormat(datum.y)}`
            }
            labelComponent={<VictoryTooltip style={{ fontSize: 10 }} />}
          />
        ))}
      </CopwatchChart>
    </>
  );
}

export default Line;
