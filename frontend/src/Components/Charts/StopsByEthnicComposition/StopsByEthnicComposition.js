import React, { useState, useEffect } from 'react';
import { useTheme } from 'styled-components';
import { StopsByEthnicCompositionStyled } from './StopsByEthnicComposition.styled';

// Util
import toTitleCase from 'util/toTitleCase';
import decimalToFixedPercent from 'util/decimalToFixedPercent';

// Router
import { useParams } from 'react-router-dom';

// State

import useDataset, { STOPS } from 'hooks/useDataset';

// Children
import ChartBase from 'Components/Charts/ChartBase';
import StackedBar from 'Components/Charts/ChartTypes/StackedBar';
import StopsByEthnicCompositionTable from 'Components/Tables/StopsByEthnicCompositionTable';

const DATSET_KEY = 'STOPS_BY_ETHNIC_COMPOSITION';
const CHART_TITLE = 'Stops by Ethnic Composition';

const GROUP_KEYS = ['asian', 'black', 'hispanic', 'native_american', 'other', 'white'];

function StopsByEthnicComposition() {
  let { agencyId } = useParams();
  const theme = useTheme();
  const [chartState] = useDataset(agencyId, STOPS);

  const _calculateYearTotal = (yearData, filteredKeys) => {
    let yearSum = 0;
    filteredKeys.forEach((ethnicGroup) => (yearSum += yearData[ethnicGroup]));
    return yearSum;
  };

  const _filterOutEthnicGroups = (data, groupFilters) => {
    const filteredData = data.map((yearData) => {
      const filteredYearData = {};
      filteredYearData.year = yearData.year;
      groupFilters.forEach((ethnicGroup) => {
        filteredYearData[ethnicGroup] = yearData[ethnicGroup];
      });
      return filteredYearData;
    });
    return filteredData;
  };

  const mapData = (filteredKeys = []) => {
    const data = chartState.data[STOPS];
    const mappedData = [];
    if (data) {
      const filteredData = _filterOutEthnicGroups(data, filteredKeys);
      const yearTotals = {};
      filteredData.forEach((row) => {
        yearTotals[row.year] = _calculateYearTotal(row, filteredKeys);
      });

      filteredKeys.forEach((ethnicGroup) => {
        const groupSet = {};
        groupSet.id = toTitleCase(ethnicGroup);
        groupSet.color = theme.ethnicGroup[ethnicGroup];
        groupSet.data = data.map((datum) => {
          return {
            x: datum.year,
            y: decimalToFixedPercent(datum[ethnicGroup], yearTotals[datum.year]),
            label: toTitleCase(ethnicGroup),
          };
        });
        mappedData.push(groupSet);
      });
    }
    return mappedData;
  };

  return (
    <StopsByEthnicCompositionStyled>
      <ChartBase
        mapData={mapData}
        groupKeys={GROUP_KEYS}
        getLabelFromKey={(key) => toTitleCase(key)}
        chartTitle={CHART_TITLE}
        datasetKey={DATSET_KEY}
        chartState={chartState}
        data-testid={DATSET_KEY}
      >
        <StackedBar horizontal={true} />
      </ChartBase>

      <StopsByEthnicCompositionTable data={chartState.chartData[STOPS]} />
    </StopsByEthnicCompositionStyled>
  );
}

export default StopsByEthnicComposition;
