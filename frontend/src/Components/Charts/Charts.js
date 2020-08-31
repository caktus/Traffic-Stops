import React from 'react';

import { ChartsStyled } from './Charts.styled';
import { AnimatePresence } from 'framer-motion';

import AboutCharts from './AboutCharts/AboutCharts';

// Route
import AsyncRoute from 'Components/Containers/AsyncRoute';
import { useRouteMatch } from 'react-router-dom';
import { SOME_OTHER_CHART, STOPS_BY_REASON } from 'Routes/slugs';

// Children
import HR from 'Components/Elements/HR';
import ChartSkeleton from 'Components/Elements/ChartSkeleton';
import ChartError from 'Components/Elements/ChartError';

function Charts() {
  const match = useRouteMatch();
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
          path={`${match.path}${STOPS_BY_REASON}`}
          importComponent={() => import('Components/Charts/StopsByReason/StopsByReason')}
          renderLoading={() => <ChartSkeleton />}
          renderError={() => <ChartError chartName="Stops by Reason" />}
        />
        <AsyncRoute
          path={`${match.path}${SOME_OTHER_CHART}`}
          importComponent={() => import('Components/Charts/SomeOtherChart/SomeOtherChart')}
          renderLoading={() => <ChartSkeleton />}
          renderError={() => <ChartError chartName="Some Other Chart" />}
        />
      </ChartsStyled>
    </AnimatePresence>
  );
}

export default Charts;
