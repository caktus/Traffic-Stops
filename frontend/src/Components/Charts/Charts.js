import React from 'react';

import { ChartsStyled } from './Charts.styled';

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
    <ChartsStyled>
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
  );
}

export default Charts;
