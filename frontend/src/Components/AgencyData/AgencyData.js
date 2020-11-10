import React, { useState, useEffect } from 'react';
import { AgencyDataStyled, MotionDiv } from './AgencyData.styled';

// Animationg
import { AnimateSharedLayout, AnimatePresence, motion } from 'framer-motion';

// Context
import { ChartStateProvider } from 'Context/chart-state';
import chartStateReducer, { initialState } from 'Context/chart-reducer';

// Children
import Sidebar from '../Sidebar/Sidebar';
import Charts from 'Components/Charts/Charts';

function AgencyData(props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(true);
  }, []);

  return (
    <AgencyDataStyled data-testid="AgencyData" {...props}>
      <AnimateSharedLayout>
        <MotionDiv layout>
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
          
          <ChartStateProvider reducer={chartStateReducer} initialState={initialState}>
            <Charts />
          </ChartStateProvider>
        </MotionDiv>
      </AnimateSharedLayout>
    </AgencyDataStyled>
  );
}

export default AgencyData;
