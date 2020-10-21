import React from 'react';
import PropTypes from 'prop-types'

// Deps
import { ResponsiveBar } from '@nivo/bar';

// Util
import setChartColors from 'util/setChartColors';

const STACKED_BAR_PROPS = {
  borderRadius: 2,
  margin: { right: 20, bottom: 20, left: 40 },
  labelSkipHeight: 10,
}
const GROUPED_BAR_PROPS = {
  margin: { right: 20, bottom: 100, left: 180 }
}

const STACKED_BAR_THEME = {}
const GROUPED_BAR_THEME = {}

function GroupedBar({ data, dataKeys, indexBy, layout, groupMode, ...props }) {
  const BASE_PROPS = groupMode === "stacked" ? STACKED_BAR_PROPS : GROUPED_BAR_PROPS
  return (
      <ResponsiveBar
        {...props}
        {...BASE_PROPS}
        data={data}
        theme={groupMode === "stacked" ? STACKED_BAR_THEME : GROUPED_BAR_THEME }
        indexBy={indexBy}
        keys={dataKeys}
        padding={0.2}
        colors={setChartColors}
        labelTextColor="inherit:darker(1.4)"
        layout={layout}
        groupMode={groupMode}
        enableGridY={false}
        enableGridX={true}
        tooltipFormat={(value) => `${value}%`}
      />
  );
}

GroupedBar.propTypes = {
  data: PropTypes.arrayOf(PropTypes.object),
  dataKeys: PropTypes.array.isRequired,
  layout: PropTypes.oneOf(["horizontal", "vertical"]),
  groupMode: PropTypes.oneOf(["stacked", "grouped"]),
};

GroupedBar.defaultProps = {
  layout: "horizontal",
  groupMode: "grouped",
}


export default GroupedBar;
