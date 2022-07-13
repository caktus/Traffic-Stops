import React from 'react';
import PropTypes from 'prop-types';

import { VictoryStack, VictoryBar, VictoryAxis, VictoryTooltip, VictoryChart } from 'victory';
import { AXIS_STYLE } from './chartConstants';

// Children
import ChartLoading from './ChartLoading';
import BarSkeleton from '../../Elements/Skeletons/BarSkeleton';
import EmptyChartMessage from '../ChartSections/EmptyChartMessage';

function StackedBar({ data, loading, tickValues, yAxisLabel }) {
  if (loading) return <ChartLoading skeleton={BarSkeleton} />;

  return (
    <>
      <EmptyChartMessage data={data} />
      <VictoryChart style={{ padding: 0 }} yAxisLabel={yAxisLabel}>
        <VictoryAxis
          dependentAxis
          style={AXIS_STYLE}
          tickValues={[10, 20, 30, 40, 50, 60, 70, 80, 90, 100]}
          tickFormat={(t) => (t % 20 === 0 ? `${t}%` : null)}
          labels={({ datum }) => `HEY: ${datum.y} ${datum.x}`}
          labelComponent={<VictoryTooltip />}
        />
        <VictoryAxis
          label="Year"
          tickValues={tickValues}
          style={AXIS_STYLE}
          tickFormat={(t) => (t % 2 === 0 ? t : null)}
        />
        <VictoryStack>
          {data.map((bar) => (
            <VictoryBar
              key={bar.id}
              data={bar.data}
              barWidth={15}
              style={{
                data: { fill: bar.color, opacity: 0.5 },
              }}
              labels={({ datum }) => (datum ? `${datum.x}, ${datum.displayName}, ${datum.y}%` : '')}
              labelComponent={<VictoryTooltip style={{ fontSize: 10 }} />}
            />
          ))}
        </VictoryStack>
      </VictoryChart>
    </>
  );
}

StackedBar.propTypes = {
  data: PropTypes.array.isRequired,
  tickValues: PropTypes.arrayOf(PropTypes.number),
};

StackedBar.defaultProps = {
  tickValues: [],
};

export default StackedBar;
