import React, { useEffect, useState } from 'react';
import { ResponsiveBar } from '@nivo/bar';

const ETHNICITY_COLORS = {
  asian: 'rgb(102, 172, 221)',
  black: 'rgb(63, 94, 171)',
  hispanic: 'rgb(220, 143, 39)',
  native_american: 'rgb(167, 209, 107)',
  other: 'rgb(122, 118, 183)',
  white: 'rgb(28, 150, 71)',
};

const KEYS = [
  'Driving While Impaired',
  'Safe Movement Violation',
  'Vehicle Equipment Violation',
  'Other Motor Vehicle Violation',
  'Stop Light/Sign Violation',
  'Speed Limit Violation',
  'Vehicle Regulatory Violation',
  'Seat Belt Violation',
];

const DEFAULT_BASE_GROUP = 'white';

const GROUP_KEYS = ['asian', 'black', 'hispanic', 'native_american', 'other', 'white'];

function StackedBar({ data }) {
  const [mappedData, setMappedData] = useState([]);

  const _reduceYears = (yearlyData) => {
    return KEYS.map((key) => {
      const years = yearlyData.filter((stop) => stop.purpose === key);
      return years.reduce((acc, curr) => {
        const innerStruct = { purpose: curr.purpose };
        Object.keys(curr).forEach((innerKey) => {
          if (acc && innerKey !== 'year' && innerKey !== 'purpose') {
            innerStruct[innerKey] = acc[innerKey] + curr[innerKey];
          }
        });
        return innerStruct;
      });
    });
  };

  const _calculateRateDiff = (rateA, rateB) => (rateA - rateB) / rateB;
  const _getRoundedPercentage = (num) => Math.round(num * 100);

  useEffect(() => {
    if (data) {
      const reducedSearches = _reduceYears(data.searches);
      const reducedStops = _reduceYears(data.stops);

      const searches = {};
      reducedSearches.forEach((v) => (searches[v.purpose] = v));
      const stops = {};
      reducedStops.forEach((v) => (stops[v.purpose] = v));

      // Get mapping of search rates by ethnic group
      const rateByGroup = {};
      KEYS.forEach((stopTypeKey) => {
        const searchK = searches[stopTypeKey];
        const stopK = stops[stopTypeKey];
        const groupRates = {};
        GROUP_KEYS.forEach((groupKey) => {
          groupRates[groupKey] = searchK[groupKey] / stopK[groupKey];
        });
        rateByGroup[stopTypeKey] = groupRates;
      });

      // Get rate diff against DEFAULT_BASE_GROUP
      const searchesByStopReason = [];
      for (const stopReason in rateByGroup) {
        const groupsByReason = rateByGroup[stopReason];
        const dataRow = { stopReason };
        for (const ethnicGroup in groupsByReason) {
          const groupRate = groupsByReason[ethnicGroup];
          const baseRate = groupsByReason[DEFAULT_BASE_GROUP];
          if (ethnicGroup === DEFAULT_BASE_GROUP) continue;
          dataRow[ethnicGroup] = _getRoundedPercentage(_calculateRateDiff(groupRate, baseRate));
          dataRow[`${ethnicGroup}Color`] = ETHNICITY_COLORS[ethnicGroup];
        }
        searchesByStopReason.push(dataRow);
      }
      setMappedData(searchesByStopReason);
    }
  }, [data]);

  return (
    <article style={{ height: 1000, width: 1000, fontSize: 16, fontFamily: 'monospace' }}>
      <ResponsiveBar
        // width={900}
        // height={500}
        margin={{ top: 60, right: 80, bottom: 60, left: 200 }}
        data={mappedData}
        indexBy="stopReason"
        keys={GROUP_KEYS}
        padding={0.2}
        colors={({ id, data }) => data[`${id}Color`]}
        labelTextColor="inherit:darker(1.4)"
        labelSkipWidth={16}
        labelSkipHeight={16}
        layout="horizontal"
        groupMode="grouped"
        enableGridY={false}
        enableGridX={true}
        tooltipFormat={(value) => `${value}%`}
      />
    </article>
  );
}

StackedBar.propTypes = {};

StackedBar.defaultProps = {};

export default StackedBar;
