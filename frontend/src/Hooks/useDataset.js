import { useEffect } from 'react';

// Routing
import { useLocation } from 'react-router-dom';

// AJAX
import axios from '../Services/Axios';
import mapDatasetKeyToEndpoint from '../Services/endpoints';

// State
import { useChartState } from '../Context/chart-state';
import {
  DATASET_FETCH_START,
  DATASET_FETCH_SUCCESS,
  DATASET_FETCH_FAILURE,
} from '../Context/chart-reducer';

export const AGENCY_DETAILS = 'AGENCY_DETAILS';
export const STOPS = 'STOPS';
export const SEARCHES = 'SEARCHES';
export const STOPS_BY_REASON = 'STOPS_BY_REASON';
export const SEARCHES_BY_TYPE = 'SEARCHES_BY_TYPE';
export const USE_OF_FORCE = 'USE_OF_FORCE';
export const CONTRABAND_HIT_RATE = 'CONTRABAND_HIT_RATE';
export const LIKELIHOOD_OF_SEARCH = 'LIKELIHOOD_OF_SEARCH';
export const LIKELIHOOD_OF_STOP = 'LIKELIHOOD_OF_STOP';

function useDataset(agencyId, datasetKey) {
  const { search } = useLocation();
  const [state, dispatch] = useChartState();

  useEffect(() => {
    const getEndpoint = mapDatasetKeyToEndpoint(datasetKey);
    const _fetchData = async () => {
      dispatch({ type: DATASET_FETCH_START, dataset: datasetKey });
      try {
        const { data } = await axios.get(getEndpoint(agencyId) + search);
        dispatch({
          type: DATASET_FETCH_SUCCESS,
          dataset: datasetKey,
          payload: data,
        });
      } catch (error) {
        dispatch({
          type: DATASET_FETCH_FAILURE,
          dataset: datasetKey,
          payload: 'There was an error loading the data for this chart. Try refreshing the page',
        });
      }
    };
    _fetchData();
  }, [agencyId, datasetKey, dispatch, search]);

  return [state, dispatch];
}

export default useDataset;
