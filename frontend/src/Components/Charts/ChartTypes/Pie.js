import React from 'react';
import { useTheme } from 'styled-components';
import { VictoryPie, VictoryLabel, VictoryTooltip } from 'victory';

const PIE_STYLES = {
  data: {
    fill: ({ datum }) => datum.color
  },
  labels: { 
    fill: "white", 
    fontSize: 20, 
    fontWeight: "bold"
  }
}

const LABEL_SKIP_ANGLE = .4;

const _getLabel = props => {
  const { slice, datum } = props;
  const { startAngle, endAngle } = slice;
  const sliceAngle = endAngle - startAngle
  console.log('sliceAngle: ', sliceAngle)
  console.log(LABEL_SKIP_ANGLE)
  if (sliceAngle <= LABEL_SKIP_ANGLE) return ""
  return `${datum.y}%`
}

function Pie({ data }) {
  const theme = useTheme();

  return (
    <VictoryPie 
      data={data}
      style={PIE_STYLES}
      labelComponent={<PieLabel theme={theme} />}
      labelRadius={({ innerRadius }) => innerRadius + 30 }
      padAngle={2}
      cornerRadius={5}
      innerRadius={50}
    />
  );
}

const PieLabel = props => {
  const { datum, style, slice, theme } = props;
  const { startAngle, endAngle } = slice;
  const sliceAngle = endAngle - startAngle
  return (
    <g>
      <VictoryLabel
        {...props}
        text={sliceAngle <= LABEL_SKIP_ANGLE ? "" : `${datum.y}%`}
        // text={datum.y < 5 ? '' : `${Math.floor(datum.y)}%`}
      />
      <VictoryTooltip
        {...props}
        style={{ ...style, fill: datum.color }}
        flyoutStyle={{ stroke: theme.colorPrimary, fill: theme.colorWhite, strokeWidth: 2 }}
        text={`${datum.displayName}\n${datum.y}%`}
        orientation="top"
        pointerLength={5}
        height={40}
      />
    </g>
  )
}

PieLabel.defaultEvents = VictoryTooltip.defaultEvents

export default Pie;
