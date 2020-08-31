import React from 'react';

function ChartError({ chartName }) {
  return (
    <h4>
      <span role="img">😭</span>Failed to load graphs for {chartName}!? <span role="img">😭</span>
    </h4>
  );
}

export default ChartError;
