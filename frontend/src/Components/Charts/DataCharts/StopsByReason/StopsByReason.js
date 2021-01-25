import React, { useState, useEffect } from 'react';
import { useTheme } from 'styled-components';
import { StopsByReasonStyled } from './StopsByReason.styled';

// Router
import { useParams } from 'react-router-dom';

// Util
import toTitleCase from '../UseOfForce/node_modules/util/toTitleCase';

// State
import useDataset, { STOPS_BY_REASON } from 'Hooks/useDataset';

// Children
import GroupedBar from 'Components/Charts/ChartPrimitives/GroupedBar';
import ChartBase from 'Components/Charts/ChartPrimitives/ChartBase';
import Select from 'Components/Elements/Inputs/Select';

const CHART_TITLE = 'Likelihood of Search by "Stop Cause"';

const STOP_REASON_KEYS = [
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

const YEAR_ALL = 'all';

function StopsByReason() {
  let { agencyId } = useParams();
  const [chartState] = useDataset(agencyId, STOPS_BY_REASON);
  const [availableYears, setAvailableYears] = useState([]);
  const [filteredYear, setFilteredYear] = useState(YEAR_ALL);

  useEffect(() => {
    const data = chartState.data[STOPS_BY_REASON];
    if (data) {
      const uniqueYears = new Set(data.stops.map((d) => d.year));
      setAvailableYears([...uniqueYears]);
    }
  }, [chartState.data[STOPS_BY_REASON]]);

  const mapData = (filteredKeys = []) => {
    const mappedData = [];
    return mappedData;
  };

  const _getAvailableYears = () => availableYears.map((year) => ({ name: year, value: year }));

  const handleYearSelected = (e) => {
    setFilteredYear(e.target.value);
  };

  return (
    <StopsByReasonStyled>
      <ChartBase
        mapData={mapData}
        groupKeys={GROUP_KEYS.filter((k) => k !== DEFAULT_BASE_GROUP)}
        getLabelFromKey={(key) => `${toTitleCase(key)} vs. ${toTitleCase(DEFAULT_BASE_GROUP)}`}
        renderAdditionalFilter={() => (
          <Select
            label="Year"
            value={filteredYear}
            onChange={handleYearSelected}
            options={_getAvailableYears()}
            nullValue={{ name: 'All', value: YEAR_ALL }}
          />
        )}
        chartTitle={CHART_TITLE}
        datasetKey={STOPS_BY_REASON}
        chartState={chartState}
        data-testid={STOPS_BY_REASON}
      >
        <GroupedBar />
      </ChartBase>
    </StopsByReasonStyled>
  );
}

export default StopsByReason;
