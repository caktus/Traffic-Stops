import React, { useState, useEffect } from 'react';
import { useTheme } from 'styled-components';

// Router
import { useParams } from 'react-router-dom';

// Util
import toTitleCase from '../UseOfForce/node_modules/util/toTitleCase';

// State
import useDataset, { SEARCHES, STOPS } from '../UseOfForce/node_modules/hooks/useDataset';

// Children
import ChartBase from 'Components/Charts/ChartPrimitives/ChartBase';
import Line from 'Components/Charts/ChartPrimitives/Line';
import DepartmentalSearchRateTable from 'Components/Tables/DepartmentalSearchRateTable';

const CHART_TITLE = 'Departmental Search Rate';

const AVERAGE_KEY = 'total';
const GROUP_KEYS = ['asian', 'black', 'hispanic', 'native_american', 'other', 'white', AVERAGE_KEY];

function DepartmentalSearchRate() {
  const theme = useTheme();
  let { agencyId } = useParams();
  useDataset(agencyId, SEARCHES);
  const [chartState] = useDataset(agencyId, STOPS);
  const [availableYears, setAvailableYears] = useState([]);

  useEffect(() => {
    const stops = chartState.data[STOPS];
    if (stops) {
      const uniqueYears = stops.map((s) => s.year);
      setAvailableYears(uniqueYears);
    }
  }, [chartState.data[STOPS]]);

  const _getSearchRateForYearByGroup = (searches, stops, year, ethnicGroup, filteredKeys) => {
    const searchesForYear = searches.find((s) => s.year === year);
    const stopsForYear = stops.find((s) => s.year === year);
    if (ethnicGroup === AVERAGE_KEY) {
      let totalSearches = 0;
      let totalStops = 0;
      filteredKeys.forEach((ethnicGroup) => {
        if (ethnicGroup === AVERAGE_KEY) return;
        totalSearches += searchesForYear[ethnicGroup];
        totalStops += stopsForYear[ethnicGroup];
      });
      const searchRate = totalStops === 0 ? 0 : totalSearches / totalStops;
      return parseFloat((searchRate * 100).toFixed(2));
    } else {
      const searchesForGroup = searchesForYear ? searchesForYear[ethnicGroup] : 0;
      const stopsForGroup = stopsForYear ? stopsForYear[ethnicGroup] : 0;
      const searchRate = stopsForGroup === 0 ? 0 : searchesForGroup / stopsForGroup;
      return parseFloat((searchRate * 100).toFixed(2));
    }
  };

  const mapData = (filteredKeys = []) => {
    const mappedData = [];
    const stops = chartState.data[STOPS];
    const searches = chartState.data[SEARCHES];
    if (searches && stops) {
      filteredKeys.forEach((ethnicGroup) => {
        const groupData = {};
        groupData.id = ethnicGroup;
        groupData.color = theme.colors.ethnicGroup[ethnicGroup];
        groupData.data = availableYears.map((year) => {
          const tick = {};
          tick.x = year;
          tick.y = _getSearchRateForYearByGroup(searches, stops, year, ethnicGroup, filteredKeys);
          tick.displayName = ethnicGroup;
          return tick;
        });
        mappedData.push(groupData);
      });
    }
    return mappedData;
  };

  return (
    <>
      <ChartBase
        mapData={mapData}
        groupKeys={GROUP_KEYS}
        getLabelFromKey={(key) => toTitleCase(key)}
        chartTitle={CHART_TITLE}
        datasetKey={[STOPS, SEARCHES]}
        chartState={chartState}
        data-testid={CHART_TITLE}
      >
        <Line xTicks={availableYears} />
      </ChartBase>
      <DepartmentalSearchRateTable
        stops={chartState.data[STOPS]}
        searches={chartState.data[SEARCHES]}
      />
    </>
  );
}

export default DepartmentalSearchRate;
