import React from 'react';
import PropTypes from 'prop-types';
import { VictoryAxis, VictoryBar, VictoryChart } from 'victory';

const AXIS_STYLE = {
  grid: { stroke: '#818e99', strokeWidth: 0.5 },
  tickLabels: { fontSize: 8 },
};

function Bar({ data, chartProps, xAxisProps, yAxisProps, barProps }) {
  return (
    <VictoryChart {...chartProps}>
      <VictoryAxis {...xAxisProps} style={AXIS_STYLE} />
      <VictoryAxis {...yAxisProps} style={AXIS_STYLE} dependentAxis />
      <VictoryBar {...barProps} data={data} />
    </VictoryChart>
  );
}

Bar.propTypes = {
  chartProps: PropTypes.object,
  yAxisProps: PropTypes.object,
  xAxisProps: PropTypes.object,
  barProps: PropTypes.object,
};

Bar.defaultProps = {
  chartProps: {},
  yAxisProps: {},
  xAxisProps: {},
  barProps: {},
};

export default Bar;
