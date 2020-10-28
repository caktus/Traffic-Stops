import React, { useState, useEffect } from 'react';
import { useTheme } from 'styled-components';

// Router
import { useParams } from 'react-router-dom';

// Util
import toTitleCase from 'util/toTitleCase';

// State
import useDataset, { USE_OF_FORCE } from 'hooks/useDataset';

// Children
import ChartBase from 'Components/Charts/ChartBase';
import GroupedBar from 'Components/Charts/ChartTypes/GroupedBar';
import UseOfForceTable from 'Components/Tables/UseOfForceTable';

const CHART_TITLE = 'Use of Force';

const GROUP_KEYS = ['asian', 'black', 'hispanic', 'native_american', 'other', 'white'];

function UseOfForce() {
  let { agencyId } = useParams();
  const theme = useTheme();
  const [chartState] = useDataset(agencyId, USE_OF_FORCE);
  const [availableYears, setAvailableYears] = useState([]);

  useEffect(() => {
    const data = chartState.chartData[USE_OF_FORCE];
    if (data) {
      const years = data.map((s) => s.year);
      setAvailableYears(years);
    }
  }, [chartState.chartData[USE_OF_FORCE]]);

  const mapData = (filteredKeys) => {
    const mappedData = [];
    const data = chartState.chartData[USE_OF_FORCE];
    if (data) {
      filteredKeys.forEach((ethnicGroup, i) => {
        const groupData = {};
        groupData.id = ethnicGroup;
        groupData.color = theme.ethnicGroup[ethnicGroup];
        groupData.data = data.map((d) => ({
          x: d.year,
          y: d[ethnicGroup],
          // displayName: toTitleCase(ethnicGroup),
        }));
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
        datasetKey={USE_OF_FORCE}
        chartState={chartState}
        data-testid={CHART_TITLE}
      >
        <GroupedBar xTicks={availableYears} />
      </ChartBase>
      <UseOfForceTable data={chartState.chartData[USE_OF_FORCE]} />
    </>
  );
}

export default UseOfForce;
