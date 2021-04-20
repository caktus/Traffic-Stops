import React from 'react';

// Route
import AsyncRoute from 'Components/Containers/AsyncRoute';
import { Switch, useRouteMatch } from 'react-router-dom';
import * as slugs from 'Routes/slugs';

// Children
import PieSkeleton from 'Components/Elements/Skeletons/PieSkeleton';
import ChartError from 'Components/Elements/ChartError';

function Charts() {
  const match = useRouteMatch();

  // NOTE: We should consider lumping everything together into a JSON or JS file
  // with definitions for each chart.
  // With the chart name, the slug, datasey key, import location, etc.

  return (
    <>
      <AsyncRoute
        exact
        path={`${match.path}${slugs.OVERVIEW_SLUG}`}
        importComponent={() =>
          import(/* webpackChunkName: 'Overview' */ 'Components/Charts/Overview/Overview')
        }
        renderLoading={() => <PieSkeleton />}
        renderError={() => <ChartError chartName="Overview" />}
      />
      <AsyncRoute
        exact
        path={`${match.path}${slugs.TRAFFIC_STOPS_SLUG}`}
        importComponent={() =>
          import(
            /* webpackChunkName: 'TrafficStops' */ 'Components/Charts/TrafficStops/TrafficStops'
          )
        }
        renderLoading={() => <PieSkeleton />}
        renderError={() => <ChartError chartName="Traffic Stops" />}
      />
      <AsyncRoute
        path={`${match.path}${slugs.SEARCHES_SLUG}`}
        importComponent={() =>
          import(/* webpackChunkName: 'Searches' */ 'Components/Charts/Searches/Searches')
        }
        renderLoading={() => <PieSkeleton />}
        renderError={() => <ChartError chartName="Searches" />}
      />
      <AsyncRoute
        path={`${match.path}${slugs.SEARCH_RATE_SLUG}`}
        importComponent={() =>
          import(/* webpackChunkName: 'SearchRate' */ 'Components/Charts/SearchRate/SearchRate')
        }
        renderLoading={() => <PieSkeleton />}
        renderError={() => <ChartError chartName="Search Rate" />}
      />
      <AsyncRoute
        path={`${match.path}${slugs.CONTRABAND_SLUG}`}
        importComponent={() =>
          import(/* webpackChunkName: 'Contraband' */ 'Components/Charts/Contraband/Contraband')
        }
        renderLoading={() => <PieSkeleton />}
        renderError={() => <ChartError chartName="Contraband" />}
      />

      <AsyncRoute
        path={`${match.path}${slugs.USE_OF_FORCE_SLUG}`}
        importComponent={() =>
          import(/* webpackChunkName: 'UseOfForce' */ 'Components/Charts/UseOfForce/UseOfForce')
        }
        renderLoading={() => <PieSkeleton />}
        renderError={() => <ChartError chartName="Use of Force" />}
      />
    </>
  );
}

export default Charts;
