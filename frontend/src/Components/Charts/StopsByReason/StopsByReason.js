import React, { useState, useEffect } from 'react';
import { useTheme } from 'styled-components';
import { StopsByReasonStyled } from './StopsByReason.styled';

// Router
import { useParams } from 'react-router-dom';

// ajax
import axios from 'Services/Axios';
import { getStopsByReasonURL } from 'Services/endpoints';

// Util
import toTitleCase from 'util/toTitleCase';

// State
import useDataset, { STOPS_BY_REASON } from 'hooks/useDataset';

// Children
import GroupedBar from 'Components/Charts/ChartTypes/GroupedBar';
import ChartBase from 'Components/Charts/ChartBase';
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
  const theme = useTheme();
  const [chartState] = useDataset(agencyId, STOPS_BY_REASON);
  const [availableYears, setAvailableYears] = useState([]);
  const [filteredYear, setFilteredYear] = useState(YEAR_ALL);

  useEffect(() => {
    const data = chartState.chartData[STOPS_BY_REASON];
    if (data) {
      const uniqueYears = new Set(data.stops.map((d) => d.year));
      setAvailableYears([...uniqueYears]);
    }
  }, [chartState.chartData[STOPS_BY_REASON]]);

  const _reduceYears = (yearlyData) => {
    return STOP_REASON_KEYS.map((key) => {
      const years = yearlyData.filter((stop) => stop.purpose === key);
      let filteredYears = [...years];
      if (filteredYear !== YEAR_ALL) {
        filteredYears = years.filter((datum) => datum.year.toString() === filteredYear);
      }
      return filteredYears.reduce((acc, curr) => {
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

  // const _calculateRateDiff = (rateA, rateB) => (rateA - rateB) / rateB;
  const _getRoundedPercentage = (num) => Math.round(num * 100);

  // const _getGroupSearchRateForYear = (year, group, searches, stops) => {

  // }

  const _mapListToGroup = (list, ethnicGroup) =>
    list.map((i) => ({ purpose: i.purpose, year: i.year, [ethnicGroup]: i[ethnicGroup] }));

  // const _getDifferenceAgainstBaseForReason = (ethnicGroup, reason, searches, stops) => {
  //   console.log(ethnicGroup);
  //   console.log(reason);
  //   console.log(searches);
  //   console.log(stops);
  //   debugger;
  // }

  // const _getRateDiffsByReason = (yearOfSearches, yearOfStops, reason) => {

  // }

  const _calculateRate = (searchCount, stopCount) =>
    stopCount === 0 ? 0 : searchCount / stopCount;

  const _calculateRateDiff = (rateA, rateB) => (rateA - rateB) / rateB;

  const _calculateRateDiffsForYear = (
    searches,
    baseSearches,
    stops,
    baseStops,
    ethnicGroup,
    year
  ) => {
    const baseSearchesForYear = baseSearches.filter((s) => s.year === year);
    const baseStopsForYear = baseStops.filter((s) => s.year === year);
    const groupSearchesForYear = searches.filter((s) => s.year === year);
    const groupStopsForYear = stops.filter((s) => s.year === year);
    const baseRates = [];
    const groupRates = [];
    STOP_REASON_KEYS.forEach((reason) => {
      const baseReasonSearchData = baseSearchesForYear.find((s) => s.purpose === reason);
      const groupReasonSearchData = groupSearchesForYear.find((s) => s.purpose === reason);
      const baseReasonStopData = baseStopsForYear.find((s) => s.purpose === reason);
      const groupReasonStopData = groupStopsForYear.find((s) => s.purpose === reason);
      const rawBaseRateForReason = _calculateRate(
        baseReasonSearchData[DEFAULT_BASE_GROUP],
        baseReasonStopData[DEFAULT_BASE_GROUP]
      );
      const rawGroupRateForReason = _calculateRate(
        groupReasonSearchData[ethnicGroup],
        groupReasonStopData[ethnicGroup]
      );
      const rawRateDiff = _calculateRateDiff(rawBaseRateForReason, rawGroupRateForReason);
      // baseRates.push({purpose: reason, rate: baseRateForReason})
      // groupRates.push({purpose: reason, rate: groupRateForReason})
      // TODO: WIP is finishing this nonsense. Pausing because it would be nice to do all this math on the backend...
      // debugger;
    });
    // debugger;
    // const rate = _calculateRate(searchCount, stopCount);
    // return _calculateRateDiff(rateA, rateB)
  };

  const mapData = (filteredKeys = []) => {
    // The way this data comes in pretty much guarantees
    // that we'll have to loop over the entire set for
    // each ethnic group. Can we improve this a bit??
    const data = chartState.chartData[STOPS_BY_REASON];
    const mappedData = [];
    if (data) {
      console.log('incoming data: ', data);
      const searches = data.searches;
      const stops = data.stops;
      const baseSearches = _mapListToGroup(searches, DEFAULT_BASE_GROUP);
      const baseStops = _mapListToGroup(stops, DEFAULT_BASE_GROUP);
      filteredKeys.forEach((ethnicGroup) => {
        const yearlyRates = {};
        const titleCaseEthnicGroup = toTitleCase(ethnicGroup);
        yearlyRates.label = titleCaseEthnicGroup;
        yearlyRates.color = theme.ethnicGroup[ethnicGroup];
        // each bar is en ethnicGroup, so each ethnicGroup should get:
        // [{ x: 1, y: 3 }, { x: 2, y: 4 }, { x: 3, y: 9 }]
        // where x: percentDifferenceInSearchRateAgainstBase, and y: stopReason
        // const searchesForGroup = _mapListToGroup(searches, ethnicGroup)
        // const stopsForGroup = _mapListToGroup(stops, ethnicGroup)
        yearlyRates.data = STOP_REASON_KEYS.map((reason) => {
          // a group has as many bars as stopReasons
          const bar = {};
          // add ethnic group label to individual datum for tooltip
          bar.label = titleCaseEthnicGroup;
          bar.y = reason;

          const arbitraryYear = 2010;
          const ratesFor2010 = _calculateRateDiffsForYear(
            searches,
            baseSearches,
            stops,
            baseStops,
            ethnicGroup,
            arbitraryYear
          );
          // if (filteredYear === YEAR_ALL) {
          //   bar.x = _getDifferenceAgainstBaseForReason(ethnicGroup, reason, searchesForGroup, stopsForGroup)
          // } else {
          //   // bar.x =
          // }
          return bar;
        });
      });

      //                         resulted in search/stops for that reason
      //  2010                    w     b     n      a    o     h
      // Driving While Impaired	3/13	7/32	 0/0	  0/0	 0/0	16/51

      // const reducedSearches = _reduceYears(data.searches);
      // const reducedStops = _reduceYears(data.stops);

      // const searches = {};
      // reducedSearches.forEach((v) => (searches[v.purpose] = v));
      // const stops = {};
      // reducedStops.forEach((v) => (stops[v.purpose] = v));

      // // Get mapping of search rates by ethnic group
      // const rateByGroup = {};
      // STOP_REASON_KEYS.forEach((stopTypeKey) => {
      //   const searchK = searches[stopTypeKey];
      //   const stopK = stops[stopTypeKey];
      //   const groupRates = {};
      //   GROUP_KEYS.forEach((groupKey) => {
      //     if (stopK[groupKey] !== 0) {
      //       //  **ZZRRPP** DOES NOT COMPUTE
      //       groupRates[groupKey] = searchK[groupKey] / stopK[groupKey];
      //     } else groupRates[groupKey] = 0
      //   });
      //   rateByGroup[stopTypeKey] = groupRates;
      // });
      // // Get rate diff against DEFAULT_BASE_GROUP
      // for (const stopReason in rateByGroup) {
      //   const groupsByReason = rateByGroup[stopReason];
      //   const dataRow = { stopReason };
      //   for (const ethnicGroup in groupsByReason) {
      //     const groupRate = groupsByReason[ethnicGroup];
      //     const baseRate = groupsByReason[DEFAULT_BASE_GROUP];
      //     if (ethnicGroup === DEFAULT_BASE_GROUP) continue;
      //     if (!filteredKeys.includes(ethnicGroup)) continue;
      //     const titleCaseGroup = toTitleCase(ethnicGroup)
      //     dataRow[titleCaseGroup] = _getRoundedPercentage(_calculateRateDiff(groupRate, baseRate));
      //     dataRow[`${titleCaseGroup}Color`] = theme.ethnicGroup[ethnicGroup];
      //   }
      //   mappedData.push(dataRow);
      // }
    }
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
        getLabelFromKey={(key) => `${toTitleCase(key)} vs. White`}
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
