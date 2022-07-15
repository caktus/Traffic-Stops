import React from 'react';

// Route
import { useRouteMatch } from 'react-router-dom';
import * as slugs from '../../Routes/slugs';

// Children
// import PieSkeleton from 'Components/Elements/Skeletons/PieSkeleton';
import ChartError from '../Elements/ChartError';
import DataLoading from '../Charts/ChartPrimitives/DataLoading';
import Overview from "./Overview/Overview";
import TrafficStops from "./TrafficStops/TrafficStops";
import Searches from "./Searches/Searches";
import SearchRate from "./SearchRate/SearchRate";
import Contraband from "./Contraband/Contraband";
import UseOfForce from "./UseOfForce/UseOfForce";
import FJRoute from "../Containers/FJRoute";

function Charts() {
  const match = useRouteMatch();

  // NOTE: We should consider lumping everything together into a JSON or JS file
  // with definitions for each chart.
  // With the chart name, the slug, datasey key, import location, etc.

  return (
    <>
      <FJRoute
        exact
        path={`${match.path}${slugs.OVERVIEW_SLUG}`}
        importComponent={<Overview />}
        renderLoading={() => <DataLoading />}
        renderError={() => <ChartError chartName="Overview" />}
      />
      <FJRoute
        exact
        path={`${match.path}${slugs.TRAFFIC_STOPS_SLUG}`}
        importComponent={<TrafficStops />}
        renderLoading={() => <DataLoading />}
        renderError={() => <ChartError chartName="Traffic Stops" />}
      />
      <FJRoute
        path={`${match.path}${slugs.SEARCHES_SLUG}`}
        importComponent={<Searches />}
        renderLoading={() => <DataLoading />}
        renderError={() => <ChartError chartName="Searches" />}
      />
      <FJRoute
        path={`${match.path}${slugs.SEARCH_RATE_SLUG}`}
        importComponent={<SearchRate />}
        renderLoading={() => <DataLoading />}
        renderError={() => <ChartError chartName="Search Rate" />}
      />
      <FJRoute
        path={`${match.path}${slugs.CONTRABAND_SLUG}`}
        importComponent={<Contraband />}
        renderLoading={() => <DataLoading />}
        renderError={() => <ChartError chartName="Contraband" />}
      />
      <FJRoute
        path={`${match.path}${slugs.USE_OF_FORCE_SLUG}`}
        importComponent={<UseOfForce />}
        renderLoading={() => <DataLoading />}
        renderError={() => <ChartError chartName="Use of Force" />}
      />
    </>
  );
}

export default Charts;
