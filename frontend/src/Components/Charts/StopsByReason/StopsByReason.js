import React, { useEffect } from 'react';
import { StopsByReasonStyled } from './StopsByReason.styled';

// Router
import { useParams } from 'react-router-dom';

// ajax
import axios from 'Services/Axios';

// Children
import { getStopsByReasonURL } from 'Services/endpoints';
import { useChartState } from 'Context/chart-state';
import ChartSkeleton from 'Components/Elements/ChartSkeleton';
import { CHART_FETCH_START, CHART_FETCH_SUCCESS, CHART_FETCH_FAILURE } from 'Context/chart-reducer';

export const CHART_STOPS_BY_REASON = 'CHART_STOPS_BY_REASON';

function StopsByReason(props) {
  let { agencyId } = useParams();
  const [state, dispatch] = useChartState();

  useEffect(() => {
    const _fetchStopsByReason = async () => {
      dispatch({ action: CHART_FETCH_START });
      try {
        const { data } = await axios.get(getStopsByReasonURL(agencyId));
        dispatch({
          type: CHART_FETCH_SUCCESS,
          chartName: CHART_STOPS_BY_REASON,
          payload: data,
        });
      } catch (error) {
        console.log('Error in stopsbyreason data fetch: ', error);
        dispatch({
          type: CHART_FETCH_FAILURE,
          chartName: CHART_STOPS_BY_REASON,
          payload: 'There was an error loading the data for this chart. Try refreshing the page',
        });
      }
    };
    _fetchStopsByReason();
  }, [agencyId, dispatch]);

  return (
    <StopsByReasonStyled data-testid="StopsByReason">
      <h2>Stops by Reason</h2>
      {state.loading[CHART_STOPS_BY_REASON]}
      {state?.chartErrors[CHART_STOPS_BY_REASON] && (
        <p>
          <span role="img" aria-label="sad face">
            😭
          </span>
          on noes!!
          <span role="img" aria-label="sad face">
            😭
          </span>
        </p>
      )}
      {state?.loading[CHART_STOPS_BY_REASON] && <ChartSkeleton />}
      {state?.chartData[CHART_STOPS_BY_REASON] && <h2>the chart</h2>}
    </StopsByReasonStyled>
  );
}

export default StopsByReason;
