import React, { useState, useEffect, useReducer } from 'react';
import * as S from './AgencyData.styled';

// Animating
import { AnimatePresence, motion } from 'framer-motion';

// Routing
import { useParams } from 'react-router-dom';

// Context/State
import { ChartStateProvider } from 'Context/chart-state';
import { initialState as initialChartState } from 'Context/chart-reducer';
import fetchReducer, {
  initialState,
  FETCH_START,
  FETCH_SUCCESS,
  FETCH_FAILURE,
} from 'Context/fetch-reducer';

// Ajax
import axios from 'Services/Axios';
import { getAgencyURL } from 'Services/endpoints';

// Children
import AgencyHeader from 'Components/AgencyData/AgencyHeader';
import Sidebar from 'Components/Sidebar/Sidebar';
import Charts from 'Components/Charts/Charts';

function AgencyData(props) {
  const { agencyId } = useParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [agencyHeaderOpen, setAgencyHeaderOpen] = useState(false);

  // agency details state
  const [state, dispatch] = useReducer(fetchReducer, initialState);

  useEffect(() => {
    if (state.data) setSidebarOpen(true);
  }, [state.data]);

  useEffect(() => {
    console.log('state.data: ', state.data);
    if (state.data) setAgencyHeaderOpen(true);
  }, [state.data]);

  useEffect(() => {
    const _fetchData = async () => {
      dispatch({ type: FETCH_START });
      try {
        const { data } = await axios.get(getAgencyURL(agencyId));
        dispatch({ type: FETCH_SUCCESS, payload: data });
      } catch (error) {
        console.error(error);
        dispatch({
          type: FETCH_FAILURE,
          payload: "Could not fetch this agency's details. Please try again.",
        });
      }
    };
    _fetchData();
  }, [agencyId]);

  return (
    <S.AgencyData data-testid="AgencyData" {...props}>
      <AgencyHeader agencyHeaderOpen={agencyHeaderOpen} agencyDetails={state.data} />
      <S.ContentWrapper>
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              key="DataSidebar"
              initial={{ opacity: 0.35, x: '-100%', duration: 750 }}
              animate={{ opacity: 1, x: 0, duration: 750 }}
              exit={{ opacity: 0.35, x: '-100%', duration: 750 }}
              transition={{ ease: 'easeIn' }}
            >
              <Sidebar open={sidebarOpen} setSidebarOpen={setSidebarOpen} />
            </motion.div>
          )}
        </AnimatePresence>

        <ChartStateProvider reducer={initialChartState} initialState={initialState}>
          <Charts />
        </ChartStateProvider>
      </S.ContentWrapper>
    </S.AgencyData>
  );
}

export default AgencyData;
