import { useEffect } from 'react';

// ajax
import axios from 'Services/Axios';
import mapDatasetKeyToEndpoint from 'Services/endpoints';
// State
import { useChartState } from 'Context/chart-state';
import {
  DATASET_FETCH_START,
  DATASET_FETCH_SUCCESS,
  DATASET_FETCH_FAILURE,
} from 'Context/chart-reducer';

export const AGENCY_DETAIL = 'AGENCY_DETAIL';
export const STOPS = 'STOPS';
export const SEARCHES = 'SEARCHES';
export const STOPS_BY_REASON = 'STOPS_BY_REASON';
export const SEARCHES_BY_TYPE = 'SEARCHES_BY_TYPE';
export const USE_OF_FORCE = 'USE_OF_FORCE';
export const CONTRABAND_HIT_RATE = 'CONTRABAND_HIT_RATE';

function useDataset(agencyId, datasetKey) {
  const [state, dispatch] = useChartState();

  useEffect(() => {
    const getEndpoint = mapDatasetKeyToEndpoint(datasetKey);
    const _fetchData = async () => {
      dispatch({ type: DATASET_FETCH_START, dataset: datasetKey });
      try {
        const { data } = await axios.get(getEndpoint(agencyId));
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
  }, [agencyId, dispatch]);

  return [state, dispatch];
}

export default useDataset;