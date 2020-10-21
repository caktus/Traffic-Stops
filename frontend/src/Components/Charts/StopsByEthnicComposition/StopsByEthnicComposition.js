import React, { useState, useEffect} from 'react';
import { useTheme } from 'styled-components';
import { StopsByEthnicCompositionStyled } from './StopsByEthnicComposition.styled';

// Util
import toTitleCase from 'util/toTitleCase';
import decimalToFixedPercent from 'util/decimalToFixedPercent';

// AJAX
import axios from 'Services/Axios';
import { getStopsURL } from 'Services/endpoints';

// Router
import { useParams } from 'react-router-dom';

// State
import { useChartState } from 'Context/chart-state';
import { CHART_FETCH_START, CHART_FETCH_SUCCESS, CHART_FETCH_FAILURE } from 'Context/chart-reducer';

// Children
import ChartBase from '../ChartBase';
import GroupedBar from '../ChartTypes/GroupedBar';

const CHART_KEY = 'STOPS_BY_ETHNIC_COMPOSITION'
const CHART_TITLE = 'Stops by Ethnic Composition' 

const GROUP_KEYS = ['asian', 'black', 'hispanic', 'native_american', 'other', 'white'];

function StopsByEthnicComposition() {
  let { agencyId } = useParams();
  const theme = useTheme()
  const [state, dispatch] = useChartState();

  useEffect(() => {
    const _fetchStops = async () => {
      dispatch({ type: CHART_FETCH_START, chartName: CHART_KEY });
      try {
        const { data } = await axios.get(getStopsURL(agencyId));
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
    _fetchStops();
  }, [agencyId, dispatch]);

  const _calculateYearTotal = (yearData, filteredKeys) => {
    let yearSum = 0;
    filteredKeys.forEach(ethnicGroup => yearSum += yearData[ethnicGroup])
    return yearSum
  }

  const _filterOutEthnicGroups = (data, groupFilters) => {
    const filteredData = data.map(yearData => {
      const filteredYearData = {}
      filteredYearData.year = yearData.year
      groupFilters.forEach(ethnicGroup => {
        filteredYearData[ethnicGroup] = yearData[ethnicGroup]
      })
      return filteredYearData
    })
    return filteredData
  }


  const mapData = (data, filteredKeys) => {
    const mappedData = []
    if (data) {
      const filteredData = _filterOutEthnicGroups(data, filteredKeys)
      filteredData.forEach(yearData => {
        const yearFinal = {}
        yearFinal.year = yearData.year
        const yearTotal = _calculateYearTotal(yearData, filteredKeys)
        filteredKeys.forEach(ethnicGroup => {
          const groupYearlyTotal = yearData[ethnicGroup]
          yearFinal[ethnicGroup] = decimalToFixedPercent(groupYearlyTotal, yearTotal)
          yearFinal[`${ethnicGroup}Color`] = theme.ethnicGroup[ethnicGroup]
        })
        mappedData.push(yearFinal)
      })
    }
    return mappedData
  }

  // const _getAvailableYears = () => availableYears.map(year => ({ name: year, value: year}))

  // const handleYearSelected = e => {
  //   setFilteredYear(e.target.value)
  // }

  return (
    <StopsByEthnicCompositionStyled>
      <ChartBase
        rawData={state.chartData[CHART_KEY]}
        mapData={mapData}
        groupKeys={GROUP_KEYS}
        getLabelFromKey={key => toTitleCase(key)}
        // renderAdditionalFilter={() => <Select label="Year" value={filteredYear} onChange={handleYearSelected} options={_getAvailableYears()} nullValue={{ name: "All", value: YEAR_ALL }}/>}
        chartTitle={CHART_TITLE} 
        chartKey={CHART_KEY} 
        chartState={state}
        data-testid={CHART_KEY}
      >
        <GroupedBar dataKeys={GROUP_KEYS} indexBy="year" layout="vertical" groupMode="stacked" />
      </ChartBase>   
    </StopsByEthnicCompositionStyled>
  );
}

export default StopsByEthnicComposition;
