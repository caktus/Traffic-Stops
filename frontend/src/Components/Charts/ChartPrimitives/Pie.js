import React from 'react';
import styled from 'styled-components';
import { useTheme } from 'styled-components';

// Elements
import PieSkeleton from 'Components/Elements/Skeletons/PieSkeleton';
import { VictoryPie, VictoryLabel, VictoryTooltip } from 'victory';
import { P, WEIGHTS } from 'styles/StyledComponents/Typography';

const PIE_STYLES = {
  data: {
    fill: ({ datum }) => datum.color,
  },
};

const LABEL_SKIP_ANGLE = 0.4;

function Pie({ data, loading }) {
  const theme = useTheme();

  const _dataIsZeros = (d) => {
    return d.length === 0 || d.every((dt) => dt.y === 0);
  };

  if (loading) return <PieSkeleton />;

  if (_dataIsZeros(data)) {
    return (
      <NoData>
        <P weight={WEIGHTS[1]}>No data</P>
      </NoData>
    );
  }
  return (
    <VictoryPie
      data={data}
      style={PIE_STYLES}
      labelComponent={<PieLabel theme={theme} />}
      labelRadius={({ innerRadius }) => innerRadius + 80}
    />
  );
}

const PieLabel = (props) => {
  const { datum, style, slice, theme } = props;
  const { startAngle, endAngle } = slice;
  const sliceAngle = endAngle - startAngle;
  return (
    <g>
      <VictoryLabel
        {...props}
        style={{ fontSize: 20, fontFamily: theme.fonts.heading, fill: datum.fontColor }}
        text={sliceAngle <= LABEL_SKIP_ANGLE ? '' : `${datum.y}%`}
        // text={datum.y < 5 ? '' : `${Math.floor(datum.y)}%`}
      />
      {/* <VictoryTooltip
        {...props}
        style={{ ...style, fill: datum.color }}
        flyoutStyle={{ stroke: theme.colors.primary, fill: theme.colors.white, strokeWidth: 2 }}
        text={`${datum.displayName}\n${datum.y}%`}
        orientation="top"
        pointerLength={5}
        height={40}
      /> */}
    </g>
  );
};

PieLabel.defaultEvents = VictoryTooltip.defaultEvents;

const NoData = styled.div`
  text-align: center;
  margin: 5em auto;
`;

export default Pie;
