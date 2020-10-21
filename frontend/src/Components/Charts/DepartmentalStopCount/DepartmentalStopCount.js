import React, { useState, useEffect } from 'react';
import { useTheme } from 'styled-components';
import { DepartmentalStopCountStyled } from './DepartmentalStopCount.styled';

// Router
import { useParams } from 'react-router-dom';

// ajax
import axios from 'Services/Axios';
import { getSearchesByTypeURL } from 'Services/endpoints';

// Util
import toTitleCase from 'util/toTitleCase';

// State
import { useChartState } from 'Context/chart-state';
import { CHART_FETCH_START, CHART_FETCH_SUCCESS, CHART_FETCH_FAILURE } from 'Context/chart-reducer';

// Children
import ChartBase from 'Components/Charts/ChartBase';
import Select from 'Components/Elements/Inputs/Select';
import Line from '../ChartTypes/Line';

const CHART_KEY = 'DEPARTMENTAL_STOP_COUNT'
const CHART_TITLE = 'Departmental Stop Count' 

const GROUP_KEYS = ['asian', 'black', 'hispanic', 'native_american', 'other', 'white'];

const STOPS_ALL = "all"

function DepartmentalStopCount() {
  let { agencyId } = useParams();
  const theme = useTheme()
  const [state, dispatch] = useChartState();
  const [availableSearchTypes, setAvailableSearchTypes] = useState([]);
  const [searchTypeFilter, setSearchTypeFilter] = useState(STOPS_ALL);

  useEffect(() => {
    const _fetchStops = async () => {
      dispatch({ type: CHART_FETCH_START, chartName: CHART_KEY });
      try {
        const { data } = await axios.get(getSearchesByTypeURL(agencyId));
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

  useEffect(() => {
    const data = state.chartData[CHART_KEY];
    if (data) {
      // data is a list of search_type <--> year mappings.
      // to get all available search_type types, we must select a single year,
      // map over all its instances and grab the "search_type" key.

      // grab the latest year, just to be safe:
      const latestYear = data[data.length - 1].year;
      // pull all entries for latest year
      const latestSet = data.filter(d => d.year === latestYear);
      // map over entries and create array of reason objects for select widget
      const stopReasons = latestSet.map(s => ({ name: s.search_type, value: s.search_type }));
      setAvailableSearchTypes(stopReasons)
    }
  }, [state.chartData[CHART_KEY]])

  const _getYearsSet = (data) => {
      // grab latest arbitrary search_type
      const latestPurpose = data[data.length - 1].search_type;
      // get all data with single search_type
      const purposeSet = data.filter(d => d.search_type === latestPurpose);
      // get available years from set
      return purposeSet.map(s => s.year)
  }

  const handleSelectStopReason = e => {
    setSearchTypeFilter(e.target.value)
  }

  const _filterDataBySearchType = data => {
    if (searchTypeFilter === STOPS_ALL) return data
    else return data.filter(d => d.search_type === searchTypeFilter)
  }

  const _reduceStopReasonsByEthnicity = (data, yearsSet, ethnicGroup) => yearsSet.map(year => {
      const tick = {}
      tick.x = year
      if (searchTypeFilter === STOPS_ALL) {
        const yearSet = data.filter(d => d.year === year)
        const stopTotal = yearSet.reduce((acc, curr) => {
          return { [ethnicGroup]: acc[ethnicGroup] + curr[ethnicGroup] }
        })[ethnicGroup]
        tick.y = stopTotal
      } else {
        tick.y = data.find(d => d.year === year)[ethnicGroup] 
      }
      return tick
    })

  const mapData = (data, filteredKeys) => {
    const mappedData = [];
    if (data) {
      const yearsSet = _getYearsSet(data)
      const dataByStopReason = _filterDataBySearchType(data)
      filteredKeys.forEach(ethnicGroup => {
        const group = {}
        group.id = ethnicGroup// + `__${searchTypeFilter}`;
        group.color = theme.ethnicGroup[ethnicGroup]
        const groupData = _reduceStopReasonsByEthnicity(dataByStopReason, yearsSet, ethnicGroup)
        group.data = groupData
        mappedData.push(group)
      })
    }
    return mappedData;
  }

  return (
    <DepartmentalStopCountStyled>
      <ChartBase
        rawData={state.chartData[CHART_KEY]}
        mapData={mapData}
        groupKeys={GROUP_KEYS}
        getLabelFromKey={key => toTitleCase(key)}
        renderAdditionalFilter={() => <Select label="Search Type" value={searchTypeFilter} onChange={handleSelectStopReason} options={availableSearchTypes} nullValue={{ name: "All", value: STOPS_ALL }}/>}
        chartTitle={CHART_TITLE} 
        chartKey={CHART_KEY} 
        chartState={state}
        data-testid={CHART_KEY}
      >
        <Line  />
      </ChartBase>    
    </DepartmentalStopCountStyled>
  );
}

export default DepartmentalStopCount;
