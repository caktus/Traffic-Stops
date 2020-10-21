import React from 'react';
import { CensusDataStyled } from './CensusData.styled';
import { useTheme } from 'styled-components';

// State
import { useChartState } from 'Context/chart-state';
import toTitleCase from 'util/toTitleCase';

// Util
import decimalToFixedPercent from 'util/decimalToFixedPercent';

// Children 
import Pie from 'Components/Charts/ChartTypes/Pie';
import ChartBase from '../ChartBase';

const CHART_TITLE = "Census Data"
const CHART_KEY = "base"
const KEY_IDS = [ 
  "asian",
  "black",
  "hispanic",
  "native_american",
  "other",
  "white",
]

function CensusData() {
  const theme = useTheme()
  const [state] = useChartState();

  const _calculateTotal = (data) => {
    let total = 0;
    for (const group in data) {
      const population = data[group];
      total += population
    }
    return total
  }

  const _filterKeys = (data, filters) => {
    const filtered = {}
    filters.forEach(key => {filtered[key] = data[key]})
    return filtered
  }
  
  const mapData = (data, keyFilters) => {
    const derivedData = [];
    if (data) {
      // setNoCensus(false);
      const filtered = _filterKeys(data, keyFilters)
      const total = _calculateTotal(filtered)
      for (const ethnicGroup in filtered) {
        if (keyFilters.includes(ethnicGroup)) {
          // need filtered filtered already tho
          const datum = filtered[ethnicGroup];
          derivedData.push({
            id: ethnicGroup,
            label: toTitleCase(ethnicGroup),
            value: decimalToFixedPercent(datum, total),
            color: theme.ethnicGroup[ethnicGroup]
          })
        }
      }
    }
    return derivedData
  }

  return (
    <CensusDataStyled>
      <ChartBase
        rawData={state.chartData[CHART_KEY]?.census_profile}
        mapData={mapData}
        groupKeys={KEY_IDS}
        chartTitle={CHART_TITLE} 
        chartKey={CHART_KEY} 
        chartState={state}
        data-testid={CHART_KEY}
      >
        <Pie />
      </ChartBase>
    </CensusDataStyled>
  );
}

export default CensusData;
