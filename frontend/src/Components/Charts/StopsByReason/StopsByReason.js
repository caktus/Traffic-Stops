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
import { useChartState } from 'Context/chart-state';
import { CHART_FETCH_START, CHART_FETCH_SUCCESS, CHART_FETCH_FAILURE } from 'Context/chart-reducer';

// Children
import GroupedBar from 'Components/Charts/ChartTypes/GroupedBar';
import ChartBase from 'Components/Charts/ChartBase';
import Select from '../../Elements/Inputs/Select';

const CHART_KEY = 'CHART_STOPS_BY_REASON'
const CHART_TITLE = 'Stops by Reason' 

const DATA_KEYS = [
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

const YEAR_ALL = "all"

function StopsByReason() {
  let { agencyId } = useParams();
  const theme = useTheme()
  const [state, dispatch] = useChartState();
  const [availableYears, setAvailableYears] = useState([])
  const [filteredYear, setFilteredYear] = useState(YEAR_ALL)

  useEffect(() => {
    const _fetchStopsByReason = async () => {
      dispatch({ type: CHART_FETCH_START, chartName: CHART_KEY });
      try {
        const { data } = await axios.get(getStopsByReasonURL(agencyId));
        dispatch({
          type: CHART_FETCH_SUCCESS,
          chartName: CHART_KEY,
          payload: data,
        });
      } catch (error) {
        dispatch({
          type: CHART_FETCH_FAILURE,
          chartName: CHART_KEY,
          payload: 'There was an error loading the data for this chart. Try refreshing the page',
        });
      }
    };
    _fetchStopsByReason();
  }, [agencyId, dispatch]);

  useEffect(() => {
    const data = state.chartData[CHART_KEY];
    if (data) {
      const uniqueYears = new Set(data.stops.map(d => d.year))
      setAvailableYears([...uniqueYears])
    }
  }, [state.chartData[CHART_KEY]])


  const _reduceYears = (yearlyData) => {
    return DATA_KEYS.map((key) => {
      const years = yearlyData.filter((stop) => stop.purpose === key);
      let filteredYears = [...years]
      if (filteredYear !== YEAR_ALL) {
        filteredYears = years.filter(datum => datum.year.toString() === filteredYear)
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

  const _calculateRateDiff = (rateA, rateB) => (rateA - rateB) / rateB;
  const _getRoundedPercentage = (num) => Math.round(num * 100);

  const mapData = (data, filteredKeys) => {
    // TODO: ! This data is all janky. Need to debug it!!!
    const searchesByStopReason = [];
    if (data) {
      const reducedSearches = _reduceYears(data.searches);
      const reducedStops = _reduceYears(data.stops);
      
      const searches = {};
      reducedSearches.forEach((v) => (searches[v.purpose] = v));
      const stops = {};
      reducedStops.forEach((v) => (stops[v.purpose] = v));

      // Get mapping of search rates by ethnic group
      const rateByGroup = {};
      DATA_KEYS.forEach((stopTypeKey) => {
        const searchK = searches[stopTypeKey];
        const stopK = stops[stopTypeKey];
        const groupRates = {};
        GROUP_KEYS.forEach((groupKey) => {
          if (stopK[groupKey] !== 0) {
            //  **ZZRRPP** DOES NOT COMPUTE
            groupRates[groupKey] = searchK[groupKey] / stopK[groupKey];
          } else groupRates[groupKey] = 0
        });
        rateByGroup[stopTypeKey] = groupRates;
      });
      // Get rate diff against DEFAULT_BASE_GROUP
      for (const stopReason in rateByGroup) {
        const groupsByReason = rateByGroup[stopReason];
        const dataRow = { stopReason };
        for (const ethnicGroup in groupsByReason) {
          const groupRate = groupsByReason[ethnicGroup];
          const baseRate = groupsByReason[DEFAULT_BASE_GROUP];
          if (ethnicGroup === DEFAULT_BASE_GROUP) continue;
          if (!filteredKeys.includes(ethnicGroup)) continue;
          const titleCaseGroup = toTitleCase(ethnicGroup)
          dataRow[titleCaseGroup] = _getRoundedPercentage(_calculateRateDiff(groupRate, baseRate));
          dataRow[`${titleCaseGroup}Color`] = theme.ethnicGroup[ethnicGroup];
        }
        searchesByStopReason.push(dataRow);
      }
    }
    return searchesByStopReason
  }

  const _getAvailableYears = () => availableYears.map(year => ({ name: year, value: year}))

  const handleYearSelected = e => {
    setFilteredYear(e.target.value)
  }

  return (
    <StopsByReasonStyled >
      <ChartBase
        rawData={state.chartData[CHART_KEY]}
        mapData={mapData}
        groupKeys={GROUP_KEYS.filter(k => k !== DEFAULT_BASE_GROUP)}
        getLabelFromKey={key => `${toTitleCase(key)} vs. White`}
        renderAdditionalFilter={() => <Select label="Year" value={filteredYear} onChange={handleYearSelected} options={_getAvailableYears()} nullValue={{ name: "All", value: YEAR_ALL }}/>}
        chartTitle={CHART_TITLE} 
        chartKey={CHART_KEY} 
        chartState={state}
        data-testid={CHART_KEY}
      >
        <GroupedBar dataKeys={GROUP_KEYS.map(k => toTitleCase(k))} indexBy="stopReason" />
      </ChartBase>    
    </StopsByReasonStyled>
  );
}

export default StopsByReason;
