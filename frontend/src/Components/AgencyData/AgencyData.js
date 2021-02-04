import React, { useState, useEffect, useReducer } from 'react';
import * as S from './AgencyData.styled';

// Animating
import { AnimatePresence, motion } from 'framer-motion';

// Routing
import { useParams } from 'react-router-dom';

// State
import useDataset, { AGENCY_DETAILS } from 'Hooks/useDataset';

// Children
import AgencyHeader from 'Components/AgencyData/AgencyHeader';
import Sidebar from 'Components/Sidebar/Sidebar';
import ChartRoutes from 'Components/Charts/ChartRoutes';

function AgencyData(props) {
  const { agencyId } = useParams();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [agencyHeaderOpen, setAgencyHeaderOpen] = useState(false);
  const [chartsOpen, setChartsOpen] = useState(false);

  const [chartState] = useDataset(agencyId, AGENCY_DETAILS);

  useEffect(() => {
    if (chartState.data[AGENCY_DETAILS]) setSidebarOpen(true);
  }, [chartState.data[AGENCY_DETAILS]]);

  useEffect(() => {
    if (chartState.data[AGENCY_DETAILS]) setAgencyHeaderOpen(true);
  }, [chartState.data[AGENCY_DETAILS]]);

  useEffect(() => {
    if (chartState.data[AGENCY_DETAILS]) setChartsOpen(true);
  }, [chartState.data[AGENCY_DETAILS]]);

  return (
    <S.AgencyData data-testid="AgencyData" {...props}>
      <AgencyHeader
        agencyHeaderOpen={agencyHeaderOpen}
        agencyDetails={chartState.data[AGENCY_DETAILS]}
      />
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
        {chartsOpen && <ChartRoutes />}
      </S.ContentWrapper>
    </S.AgencyData>
  );
}

export default AgencyData;
