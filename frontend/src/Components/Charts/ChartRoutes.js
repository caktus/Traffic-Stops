import React from 'react';

// Route
import { useRouteMatch } from 'react-router-dom';
import * as slugs from '../../Routes/slugs';

// Children
// import PieSkeleton from 'Components/Elements/Skeletons/PieSkeleton';
import ChartError from '../Elements/ChartError';
import DataLoading from './ChartPrimitives/DataLoading';
import Overview from './Overview/Overview';
import TrafficStops from './TrafficStops/TrafficStops';
import Searches from './Searches/Searches';
import SearchRate from './SearchRate/SearchRate';
import Contraband from './Contraband/Contraband';
import UseOfForce from './UseOfForce/UseOfForce';
import FJRoute from '../Containers/FJRoute';
import Arrests from './Arrest/Arrests';

function Charts(props) {
  const match = useRouteMatch();

  // NOTE: We should consider lumping everything together into a JSON or JS file
  // with definitions for each chart.
  // With the chart name, the slug, datasey key, import location, etc.

  return (
    <>
      <FJRoute
        exact
        path={`${match.path}${slugs.OVERVIEW_SLUG}`}
        importComponent={<Overview {...props} />}
        renderLoading={() => <DataLoading />}
        renderError={() => <ChartError chartName="Overview" />}
      />
      <FJRoute
        exact
        path={`${match.path}${slugs.TRAFFIC_STOPS_SLUG}`}
        importComponent={<TrafficStops {...props} />}
        renderLoading={() => <DataLoading />}
        renderError={() => <ChartError chartName="Traffic Stops" />}
      />
      <FJRoute
        path={`${match.path}${slugs.SEARCHES_SLUG}`}
        importComponent={<Searches {...props} />}
        renderLoading={() => <DataLoading />}
        renderError={() => <ChartError chartName="Searches" />}
      />
      <FJRoute
        path={`${match.path}${slugs.SEARCH_RATE_SLUG}`}
        importComponent={<SearchRate {...props} />}
        renderLoading={() => <DataLoading />}
        renderError={() => <ChartError chartName="Search Rate" />}
      />
      <FJRoute
        path={`${match.path}${slugs.CONTRABAND_SLUG}`}
        importComponent={<Contraband {...props} />}
        renderLoading={() => <DataLoading />}
        renderError={() => <ChartError chartName="Contraband" />}
      />
      <FJRoute
        path={`${match.path}${slugs.USE_OF_FORCE_SLUG}`}
        importComponent={<UseOfForce {...props} />}
        renderLoading={() => <DataLoading />}
        renderError={() => <ChartError chartName="Use of Force" />}
      />
      <FJRoute
        path={`${match.path}${slugs.ARREST_SLUG}`}
        importComponent={<Arrests {...props} />}
        renderLoading={() => <DataLoading />}
        renderError={() => <ChartError chartName="Arrests" />}
      />
    </>
  );
}

export default Charts;
