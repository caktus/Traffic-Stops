import React, { useState, useEffect } from 'react';

import { ChartsStyled } from './Charts.styled';
import { AnimatePresence } from 'framer-motion';

import AboutCharts from './AboutCharts/AboutCharts';

// Route
import AsyncRoute from 'Components/Containers/AsyncRoute';
import { useRouteMatch, useParams } from 'react-router-dom';
import { STOPS_BY_REASON } from 'Routes/slugs';

// AJAX
import axios from 'Services/Axios';
import { getAgencyURL } from 'Services/endpoints';

// Context
import { ChartStateProvider } from 'Context/chart-state';
import chartStateReducer, { initialState } from 'Context/chart-reducer';

// Children
import HR from 'Components/Elements/HR';
import ChartSkeleton from 'Components/Elements/ChartSkeleton';
import ChartError from 'Components/Elements/ChartError';

function Charts() {
  let { agencyId } = useParams();
  const match = useRouteMatch();

  const [agency, setAgency] = useState();

  // Fetch agency details
  useEffect(() => {
    axios
      .get(getAgencyURL(agencyId))
      .then((response) => setAgency(response.data))
      .catch((error) => console.error(error.message));
  }, [agencyId]);

  // Fetch base chart data
  useEffect(() => {
    // Do stuff here
  }, [agencyId]);

  return (
    <ChartStateProvider reducer={chartStateReducer} initialState={initialState}>
      <AnimatePresence>
        <ChartsStyled
          initial={{ opacity: 0.35, x: 250, duration: 750 }}
          animate={{ opacity: 1, x: 0, duration: 750 }}
          exit={{ opacity: 0.35, x: 250, duration: 750 }}
          transition={{ ease: 'easeIn' }}
        >
          <AboutCharts agency={agency} />
          <HR />
          <AsyncRoute
            path={`${match.path}${STOPS_BY_REASON}`}
            importComponent={() => import('Components/Charts/StopsByReason/StopsByReason')}
            renderLoading={() => <ChartSkeleton />}
            renderError={() => <ChartError chartName="Stops by Reason" />}
          />
        </ChartsStyled>
      </AnimatePresence>
    </ChartStateProvider>
  );
}

export default Charts;
