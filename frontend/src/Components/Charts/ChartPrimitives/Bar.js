import React from 'react';
import PropTypes from 'prop-types';
import { VictoryAxis, VictoryBar, VictoryChart, VictoryContainer } from 'victory';
import { AXIS_STYLE } from './chartConstants';
import ChartLoading from './ChartLoading';
import BarSkeleton from '../../Elements/Skeletons/BarSkeleton';
import EmptyChartMessage from '../ChartSections/EmptyChartMessage';

function Bar({ data, chartProps, xAxisProps, yAxisProps, barProps }) {
  if (!data) return <ChartLoading skeleton={BarSkeleton} />;
  return (
    <>
      <EmptyChartMessage data={data} />
      <VictoryChart
        {...chartProps}
        containerComponent={<VictoryContainer style={{ touchAction: 'auto' }} />}
      >
        <VictoryAxis {...xAxisProps} style={AXIS_STYLE} />
        <VictoryAxis {...yAxisProps} style={AXIS_STYLE} dependentAxis />
        <VictoryBar {...barProps} data={data} />
      </VictoryChart>
    </>
  );
}

Bar.propTypes = {
  chartProps: PropTypes.instanceOf(Object),
  yAxisProps: PropTypes.instanceOf(Object),
  xAxisProps: PropTypes.instanceOf(Object),
  barProps: PropTypes.instanceOf(Object),
};

Bar.defaultProps = {
  chartProps: {},
  yAxisProps: {},
  xAxisProps: {},
  barProps: {},
};

export default Bar;
