import React from 'react';
import styled from 'styled-components';

// Elements
import PieSkeleton from '../../Elements/Skeletons/PieSkeleton';
import { VictoryPie } from 'victory';
import { P, WEIGHTS } from '../../../styles/StyledComponents/Typography';
import { CopwatchTooltip } from './CopwatchChart';
import ChartLoading from "./ChartLoading";

const PIE_STYLES = {
  data: {
    fill: ({ datum }) => datum.color,
  },
  parent: { touchAction: 'auto' },
};

const LABEL_SKIP_ANGLE = 0.4;

function Pie({ data, loading }) {

  const _dataIsZeros = (d) => {
    return d.length === 0 || d.every((dt) => dt.y === 0);
  };

  if (loading) return <ChartLoading skeleton={PieSkeleton} />;

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
      labelComponent={<CopwatchTooltip pie yAxisLabel={val => `${val}%`} />}
      labels={() => " "}
      labelRadius={({ innerRadius }) => innerRadius + 80}
    />
  );
}

const NoData = styled.div`
  text-align: center;
  margin: 5em auto;
`;

export default Pie;
