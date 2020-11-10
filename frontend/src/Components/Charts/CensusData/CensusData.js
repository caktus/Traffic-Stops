import React, { useEffect } from 'react';
import { CensusDataStyled } from './CensusData.styled';
import { useTheme } from 'styled-components';

// State
import { AGENCY_DETAIL } from 'hooks/useDataset';
import { useChartState } from 'Context/chart-state';

// Util
import toTitleCase from 'util/toTitleCase';
import decimalToFixedPercent from 'util/decimalToFixedPercent';

// Children
import Pie from 'Components/Charts/ChartTypes/Pie';
import ChartBase from 'Components/Charts/ChartBase';

const CHART_TITLE = 'Census Data';
const DATSET_KEY = AGENCY_DETAIL;
const KEY_IDS = ['asian', 'black', 'hispanic', 'native_american', 'other', 'white'];

function CensusData() {
  const theme = useTheme();
  const [chartState] = useChartState();

  const _calculateTotal = (data) => {
    let total = 0;
    for (const group in data) {
      const population = data[group];
      total += population;
    }
    return total;
  };

  const _filterKeys = (data, filters) => {
    const filtered = {};
    filters.forEach((key) => {
      filtered[key] = data[key];
    });
    return filtered;
  };

  const mapData = (keyFilters) => {
    const derivedData = [];
    const data = chartState.chartData[AGENCY_DETAIL]?.census_profile;
    if (data && keyFilters) {
      const filtered = _filterKeys(data, keyFilters);
      const total = _calculateTotal(filtered);
      for (const ethnicGroup in filtered) {
        if (keyFilters.includes(ethnicGroup)) {
          // need filtered filtered already tho
          const datum = filtered[ethnicGroup];
          derivedData.push({
            x: ethnicGroup,
            y: decimalToFixedPercent(datum, total),
            displayName: toTitleCase(ethnicGroup),
            color: theme.ethnicGroup[ethnicGroup],
          });
        }
      }
    }
    return derivedData;
  };

  return (
    <CensusDataStyled>
      <ChartBase
        mapData={mapData}
        groupKeys={KEY_IDS}
        getLabelFromKey={(key) => toTitleCase(key)}
        chartTitle={CHART_TITLE}
        datasetKey={DATSET_KEY}
        chartState={chartState}
        data-testid={DATSET_KEY}
      >
        <Pie />
      </ChartBase>
    </CensusDataStyled>
  );
}

export default CensusData;
