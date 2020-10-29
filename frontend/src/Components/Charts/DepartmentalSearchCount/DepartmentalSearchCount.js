import React, { useState, useEffect } from 'react';
import { useTheme } from 'styled-components';

// Router
import { useParams } from 'react-router-dom';

// Util
import toTitleCase from 'util/toTitleCase';

// State
import useDataset, { SEARCHES_BY_TYPE } from 'hooks/useDataset';

// Children
import ChartBase from 'Components/Charts/ChartBase';
import Select from 'Components/Elements/Inputs/Select';
import Line from 'Components/Charts/ChartTypes/Line';

const CHART_TITLE = 'Departmental Search Count';

const GROUP_KEYS = ['asian', 'black', 'hispanic', 'native_american', 'other', 'white'];

const STOPS_ALL = 'all';

function DepartmentalSearchCount() {
  let { agencyId } = useParams();
  const theme = useTheme();
  const [chartState] = useDataset(agencyId, SEARCHES_BY_TYPE);
  const [availableYears, setAvailableYears] = useState([]);
  const [availableSearchTypes, setAvailableSearchTypes] = useState([]);
  const [searchTypeFilter, setSearchTypeFilter] = useState(STOPS_ALL);

  useEffect(() => {
    const data = chartState.data[SEARCHES_BY_TYPE];
    if (data) {
      // data is a list of search_type <--> year mappings.
      // to get all available search_type types, we must select a single year,
      // map over all its instances and grab the "search_type" key.

      // grab the latest year, just to be safe:
      const latestYear = data[data.length - 1].year;
      // pull all entries for latest year
      const latestSet = data.filter((d) => d.year === latestYear);
      // map over entries and create array of reason objects for select widget
      const stopReasons = latestSet.map((s) => ({ name: s.search_type, value: s.search_type }));
      setAvailableSearchTypes(stopReasons);
    }
  }, [chartState.data[SEARCHES_BY_TYPE]]);

  const _getYearsSet = (data) => {
    // grab latest arbitrary search_type
    const latestPurpose = data[data.length - 1].search_type;
    // get all data with single search_type
    const purposeSet = data.filter((d) => d.search_type === latestPurpose);
    // get available years from set
    return purposeSet.map((s) => s.year);
  };

  useEffect(() => {
    const data = chartState.data[SEARCHES_BY_TYPE];
    if (data) {
      // grab latest arbitrary search_type
      const latestPurpose = data[data.length - 1].search_type;
      // get all data with single search_type
      const purposeSet = data.filter((d) => d.search_type === latestPurpose);
      // get available years from set
      const uniqueYears = purposeSet.map((s) => s.year);
      setAvailableYears(uniqueYears);
    }
  }, [chartState.data[SEARCHES_BY_TYPE]]);

  const handleSelectSearchType = (e) => {
    setSearchTypeFilter(e.target.value);
  };

  const _filterDataBySearchType = (data) => {
    if (searchTypeFilter === STOPS_ALL) return data;
    else return data.filter((d) => d.search_type === searchTypeFilter);
  };

  const _reduceStopReasonsByEthnicity = (data, yearsSet, ethnicGroup) =>
    yearsSet.map((year) => {
      const tick = {};
      tick.x = year;
      tick.symbol = 'circle';
      tick.displayName = toTitleCase(ethnicGroup);
      if (searchTypeFilter === STOPS_ALL) {
        const yearSet = data.filter((d) => d.year === year);
        const stopTotal = yearSet.reduce((acc, curr) => {
          return { [ethnicGroup]: acc[ethnicGroup] + curr[ethnicGroup] };
        })[ethnicGroup];
        tick.y = stopTotal;
      } else {
        tick.y = data.find((d) => d.year === year)[ethnicGroup];
      }
      return tick;
    });

  const mapData = (filteredKeys = []) => {
    const mappedData = [];
    const data = chartState.data[SEARCHES_BY_TYPE];
    if (data) {
      const yearsSet = _getYearsSet(data);
      const dataByStopReason = _filterDataBySearchType(data);
      filteredKeys.forEach((ethnicGroup) => {
        const group = {};
        group.id = ethnicGroup;
        group.color = theme.ethnicGroup[ethnicGroup];
        const groupData = _reduceStopReasonsByEthnicity(dataByStopReason, yearsSet, ethnicGroup);
        group.data = groupData;
        mappedData.push(group);
      });
    }
    return mappedData;
  };

  return (
    <ChartBase
      mapData={mapData}
      groupKeys={GROUP_KEYS}
      getLabelFromKey={(key) => toTitleCase(key)}
      renderAdditionalFilter={() => (
        <Select
          label="Search Type"
          value={searchTypeFilter}
          onChange={handleSelectSearchType}
          options={availableSearchTypes}
          nullValue={{ name: 'All', value: STOPS_ALL }}
        />
      )}
      chartTitle={CHART_TITLE}
      datasetKey={SEARCHES_BY_TYPE}
      chartState={chartState}
      data-testid={SEARCHES_BY_TYPE}
    >
      <Line xTicks={availableYears} />
    </ChartBase>
  );
}

export default DepartmentalSearchCount;
