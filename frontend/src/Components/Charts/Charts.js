import React, { useEffect } from 'react';

import { ChartsStyled } from './Charts.styled';
import { AnimatePresence } from 'framer-motion';

import AboutCharts from './AboutCharts/AboutCharts';

// Route
import AsyncRoute from 'Components/Containers/AsyncRoute';
import { useRouteMatch, useParams } from 'react-router-dom';
import * as slugs from 'Routes/slugs';

// AJAX
import axios from 'Services/Axios';
import { getAgencyURL } from 'Services/endpoints';

// State
import { useChartState } from 'Context/chart-state';
import { BASE_FETCH_START, BASE_FETCH_FAILURE, BASE_FETCH_SUCCESS } from 'Context/chart-reducer';

// Children
import HR from 'Components/Elements/HR';
import ChartSkeleton from 'Components/Elements/Skeletons/ChartSkeleton';
import ChartError from 'Components/Elements/ChartError';

function Charts() {
  let { agencyId } = useParams();
  const match = useRouteMatch();
  const [,dispatch] = useChartState();

  // Fetch agency details
  useEffect(() => {
    async function _fetchAgencyDetails() {
      dispatch({ type: BASE_FETCH_START })
      try {
        const { data } = await axios.get(getAgencyURL(agencyId))
        dispatch({ type: BASE_FETCH_SUCCESS, payload: data })
      } catch (error) {
        console.warn(error)
        dispatch({ 
          type: BASE_FETCH_FAILURE, 
          payload: 'There was an error loading the data for this page. Try refreshing the page' 
        })
      }
    }
    _fetchAgencyDetails();
  }, [agencyId, dispatch]);


  return (
      <AnimatePresence>
        <ChartsStyled
          initial={{ opacity: 0.35, x: 250, duration: 750 }}
          animate={{ opacity: 1, x: 0, duration: 750 }}
          exit={{ opacity: 0.35, x: 250, duration: 750 }}
          transition={{ ease: 'easeIn' }}
        >
          <AboutCharts />
          <HR />
          <AsyncRoute
            path={`${match.path}${slugs.STOPS_BY_REASON_SLUG}`}
            importComponent={() =>
              import(
                /* webpackChunkName: 'StopsByReason' */ 'Components/Charts/StopsByReason/StopsByReason'
              )
            }
            renderLoading={() => <ChartSkeleton />}
            renderError={() => <ChartError chartName="Stops by Reason" />}
          />
          <AsyncRoute
            path={`${match.path}${slugs.CENSUS_DATA_SLUG}`}
            importComponent={() =>
              import(
                /* webpackChunkName: 'CensusData' */ 'Components/Charts/CensusData/CensusData'
              )
            }
            renderLoading={() => <ChartSkeleton />}
            renderError={() => <ChartError chartName="Census Data" />}
          />
          <AsyncRoute 
            path={`${match.path}${slugs.STOPS_BY_ETHNIC_COMPOSITION_SLUG}`}
            importComponent={() =>
              import(
                /* webpackChunkName: 'StopsByEthnicComposition' */ 'Components/Charts/StopsByEthnicComposition/StopsByEthnicComposition'
              )
            }
            renderLoading={() => <ChartSkeleton />}
            renderError={() => <ChartError chartName="Stops by Ethnic Composition" />}
          />
          <AsyncRoute 
            path={`${match.path}${slugs.DEPARTMENTAL_STOP_COUNT_SLUG}`}
            importComponent={() =>
              import(
                /* webpackChunkName: 'DepartmentalStopCount' */ 'Components/Charts/DepartmentalStopCount/DepartmentalStopCount'
              )
            }
            renderLoading={() => <ChartSkeleton />}
            renderError={() => <ChartError chartName="Department Stop Count" />}
          />
        </ChartsStyled>
      </AnimatePresence>
  );
}

export default Charts;
