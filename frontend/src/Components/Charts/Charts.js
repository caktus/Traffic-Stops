import React from 'react';

import { ChartsStyled } from './Charts.styled';
import { AnimatePresence } from 'framer-motion';

import AboutCharts from './AboutCharts/AboutCharts';

// Route
import AsyncRoute from 'Components/Containers/AsyncRoute';
import { useParams } from 'react-router-dom';
import HashObserver from 'Components/Containers/HashObserver';
import * as slugs from 'Routes/slugs';

// State
import useDataset, { AGENCY_DETAIL } from 'Hooks/useDataset';

// Children
import HR from 'Components/Elements/HR';
import ChartSkeleton from 'Components/Elements/Skeletons/ChartSkeleton';
import ChartError from 'Components/Elements/ChartError';

function Charts() {
  let { agencyId } = useParams();
  useDataset(agencyId, AGENCY_DETAIL);

  // NOTE: We should consider lumping everything together into a JSON or JS file
  // with definitions for each chart.
  // With the chart name, the slug, datasey key, import location, etc.

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
        <HashObserver hashId={slugs.STOPS_BY_REASON_HASH}>
          <AsyncRoute
            importComponent={() =>
              import(
                /* webpackChunkName: 'StopsByReason' */ 'Components/Charts/StopsByReason/StopsByReason'
              )
            }
            renderLoading={() => <ChartSkeleton />}
            renderError={() => <ChartError chartName="Stops by Reason" />}
          />
        </HashObserver>
        <HashObserver hashId={slugs.CENSUS_DATA_HASH}>
          <AsyncRoute
            importComponent={() =>
              import(/* webpackChunkName: 'CensusData' */ 'Components/Charts/CensusData/CensusData')
            }
            renderLoading={() => <ChartSkeleton />}
            renderError={() => <ChartError chartName="Census Data" />}
          />
        </HashObserver>
        <HashObserver hashId={slugs.STOPS_BY_ETHNIC_COMPOSITION_HASH}>
          <AsyncRoute
            importComponent={() =>
              import(
                /* webpackChunkName: 'StopsByEthnicComposition' */ 'Components/Charts/StopsByEthnicComposition/StopsByEthnicComposition'
              )
            }
            renderLoading={() => <ChartSkeleton />}
            renderError={() => <ChartError chartName="Stops by Ethnic Composition" />}
          />
        </HashObserver>
        <HashObserver hashId={slugs.DEPARTMENTAL_STOP_COUNT_HASH}>
          <AsyncRoute
            importComponent={() =>
              import(
                /* webpackChunkName: 'DepartmentalStopCount' */ 'Components/Charts/DepartmentalStopCount/DepartmentalStopCount'
              )
            }
            renderLoading={() => <ChartSkeleton />}
            renderError={() => <ChartError chartName="Departmental Search Count" />}
          />
        </HashObserver>
        <HashObserver hashId={slugs.DEPARTMENTAL_SEARCH_COUNT_HASH}>
          <AsyncRoute
            importComponent={() =>
              import(
                /* webpackChunkName: 'DepartmentalSearchCount' */ 'Components/Charts/DepartmentalSearchCount/DepartmentalSearchCount'
              )
            }
            renderLoading={() => <ChartSkeleton />}
            renderError={() => <ChartError chartName="Departmental Search Count" />}
          />
        </HashObserver>
        <HashObserver hashId={slugs.DEPARTMENTAL_SEARCH_RATE_HASH}>
          <AsyncRoute
            importComponent={() =>
              import(
                /* webpackChunkName: 'DepartmentalSearchRate' */ 'Components/Charts/DepartmentalSearchRate/DepartmentalSearchRate'
              )
            }
            renderLoading={() => <ChartSkeleton />}
            renderError={() => <ChartError chartName="Departmental Search Rate" />}
          />
        </HashObserver>
        <HashObserver hashId={slugs.USE_OF_FORCE_HASH}>
          <AsyncRoute
            importComponent={() =>
              import(/* webpackChunkName: 'UseOfForce' */ 'Components/Charts/UseOfForce/UseOfForce')
            }
            renderLoading={() => <ChartSkeleton />}
            renderError={() => <ChartError chartName="Use of Force" />}
          />
        </HashObserver>
        <HashObserver hashId={slugs.CONTRABAND_HITRATE_HASH}>
          <AsyncRoute
            importComponent={() =>
              import(
                /* webpackChunkName: 'ContrabandHitrate' */ 'Components/Charts/ContrabandHitrate/ContrabandHitrate'
              )
            }
            renderLoading={() => <ChartSkeleton />}
            renderError={() => <ChartError chartName="Contraband Hit-rate" />}
          />
        </HashObserver>
      </ChartsStyled>
    </AnimatePresence>
  );
}

export default Charts;
