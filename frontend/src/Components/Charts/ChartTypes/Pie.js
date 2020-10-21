import React from 'react';
import { useTheme } from 'styled-components';

// Deps
import { ResponsivePie } from '@nivo/pie';


const PIE_THEME = {
  fontSize: 16,
};

// make sure parent container has a defined height when using
// responsive component, otherwise height will be 0 and
// no chart will be rendered.
const Pie = ({ data }) => {
  const theme = useTheme();
  return (
      <ResponsivePie
        data={data}
        theme={PIE_THEME}
        colors={({ color }) => color }
        sortByValue={true}
        sliceLabel={({ value }) => `${value}%`}
        slicesLabelsTextColor={theme.colorBlack}
        slicesLabelsSkipAngle={20}
        innerRadius={0.5}
        padAngle={2}
        cornerRadius={3}
        borderWidth={2}
        borderColor={{ from: 'color', modifiers: [ [ 'darker', 0.2 ] ] }}
        radialLabel="label"
        radialLabelsTextColor={theme.colorBlack}
        radialLabelsLinkColorstring={{ from: 'color' }}
        radialLabelsLinkStrokeWidth={4}
        radialLabelsSkipAngle={10}
        animate={true}
        motionStiffness={90}
        motionDamping={15}
      />
  )
}

export default Pie;
