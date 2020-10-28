import React, { useState, useEffect } from 'react';
import { useTheme } from 'styled-components';

// Router
import { useParams } from 'react-router-dom';

// Util
import toTitleCase from 'util/toTitleCase';

// State
import useDataset, { STOPS_BY_REASON } from 'hooks/useDataset';

// Children
import ChartBase from 'Components/Charts/ChartBase';
import Select from 'Components/Elements/Inputs/Select';
import Line from 'Components/Charts/ChartTypes/Line';
import DepartmentalStopCountTable from 'Components/Tables/DepartmentalStopCountTable';

const CHART_TITLE = 'Departmental Stop Count';

const GROUP_KEYS = ['asian', 'black', 'hispanic', 'native_american', 'other', 'white'];

const STOPS_ALL = 'all';

function DepartmentalStopCount() {
  let { agencyId } = useParams();
  const theme = useTheme();
  const [chartState] = useDataset(agencyId, STOPS_BY_REASON);
  const [availableYears, setAvailableYears] = useState([]);
  const [availableSearchTypes, setAvailableStopReasons] = useState([]);
  const [stopReasonFilter, setStopReasonFilter] = useState(STOPS_ALL);

  useEffect(() => {
    const data = chartState.chartData[STOPS_BY_REASON]?.stops;
    if (data) {
      // data is a list of purpose <--> year mappings.
      // to get all available purpose types, we must select a single year,
      // map over all its instances and grab the "purpose" key.

      // grab the latest year, just to be safe:
      const latestYear = data[data.length - 1].year;
      // pull all entries for latest year
      const latestSet = data.filter((d) => d.year === latestYear);
      // map over entries and create array of reason objects for select widget
      const stopReasons = latestSet.map((s) => ({ name: s.purpose, value: s.purpose }));
      setAvailableStopReasons(stopReasons);
    }
  }, [chartState.chartData[STOPS_BY_REASON]]);

  useEffect(() => {
    const data = chartState.chartData[STOPS_BY_REASON]?.stops;
    if (data) {
      // grab latest arbitrary purpose
      const latestPurpose = data[0].purpose;
      // get all data with single purpose
      const purposeSet = data.filter((d) => d.purpose === latestPurpose);
      // get available years from set
      const uniqueYears = purposeSet.map((s) => s.year);
      setAvailableYears(uniqueYears);
    }
  }, [chartState.chartData[STOPS_BY_REASON]]);

  const handleSelectStopReason = (e) => {
    setStopReasonFilter(e.target.value);
  };

  const _filterDataBySearchType = (data) => {
    if (stopReasonFilter === STOPS_ALL) return data;
    else return data.filter((d) => d.purpose === stopReasonFilter);
  };

  const _reduceStopReasonsByEthnicity = (data, yearsSet, ethnicGroup) =>
    yearsSet.map((year) => {
      const tick = {};
      tick.x = year;
      tick.symbol = 'circle';
      tick.displayName = toTitleCase(ethnicGroup);
      if (stopReasonFilter === STOPS_ALL) {
        const yearSet = data.filter((d) => d.year === year);
        const stopTotal = yearSet.reduce((acc, curr) => {
          return { [ethnicGroup]: acc[ethnicGroup] + curr[ethnicGroup] };
        })[ethnicGroup];
        tick.y = stopTotal;
      } else {
        if (data.length === 0) {
          tick.y = 0;
        } else {
          tick.y = data.find((d) => d.year === year)[ethnicGroup];
        }
      }
      return tick;
    });

  const mapData = (filteredKeys = []) => {
    const data = chartState.chartData[STOPS_BY_REASON]?.stops;
    const mappedData = [];
    if (data) {
      const dataByStopReason = _filterDataBySearchType(data);
      filteredKeys.forEach((ethnicGroup) => {
        const group = {};
        group.id = ethnicGroup; // + `__${stopReasonFilter}`;
        group.color = theme.ethnicGroup[ethnicGroup];
        const groupData = _reduceStopReasonsByEthnicity(
          dataByStopReason,
          availableYears,
          ethnicGroup
        );
        group.data = groupData;
        mappedData.push(group);
      });
    }
    return mappedData;
  };

  // DELETE ME
  useEffect(() => {}, [chartState.chartData[STOPS_BY_REASON]]);

  return (
    <>
      <ChartBase
        mapData={mapData}
        groupKeys={GROUP_KEYS}
        getLabelFromKey={(key) => toTitleCase(key)}
        renderAdditionalFilter={() => (
          <Select
            label="Search Type"
            value={stopReasonFilter}
            onChange={handleSelectStopReason}
            options={availableSearchTypes}
            nullValue={{ name: 'All', value: STOPS_ALL }}
          />
        )}
        chartTitle={CHART_TITLE}
        datasetKey={STOPS_BY_REASON}
        chartState={chartState}
        data-testid={CHART_TITLE}
      >
        <Line xTicks={availableYears} />
      </ChartBase>
      <DepartmentalStopCountTable data={chartState.chartData[STOPS_BY_REASON]?.stops} />
    </>
  );
}

export default DepartmentalStopCount;
