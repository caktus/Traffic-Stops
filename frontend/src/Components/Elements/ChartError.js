import React from 'react';

function ChartError({ chartName }) {
  return (
    <h4>
      <span role="img" aria-label="sad face">
        😭
      </span>
      Failed to load graphs for {chartName}!?
      <span role="img" aria-label="sad face">
        😭
      </span>
    </h4>
  );
}

export default ChartError;
