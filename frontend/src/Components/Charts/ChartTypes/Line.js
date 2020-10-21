import React from 'react';
import PropTypes from 'prop-types';

// Deps
import { ResponsiveLine } from '@nivo/line';
import LineSliceTooltip from './LineSliceTooltip/LineSliceTooltip';

function Line({ data, renderSliceTooltip, ...props }) {
  return (
    <ResponsiveLine 
      {...props}
      data={data}
      colors={({ color }) => color }
      margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
      xScale={{ type: 'point' }}
      yScale={{ type: 'linear', min: 'auto', max: 'auto', stacked: false, reverse: false }}
      // yFormat=" >-.2f"
      axisTop={null}
      axisRight={null}
      axisBottom={{
          orient: 'bottom',
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: 'Year',
          legendOffset: 36,
          legendPosition: 'middle'
      }}
      axisLeft={{
          orient: 'left',
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          // legend: 'count',
          // legendOffset: -40,
          // legendPosition: 'middle'
        }}
        enableSlices="x"
        sliceTooltip={LineSliceTooltip}
        pointSize={10}
        pointBorderWidth={2}
        pointLabelYOffset={-12}
        // animate={true}
    />
  );
}

Line.propTypes = {
  data: PropTypes.arrayOf(PropTypes.object),
};

Line.defaultProps = {};

export default Line;
