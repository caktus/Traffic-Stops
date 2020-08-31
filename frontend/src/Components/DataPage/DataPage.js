import React, { useState, useEffect } from 'react';
import { DataPageStyled, MotionDiv } from './DataPage.styled';

// Animationg
import { AnimateSharedLayout, AnimatePresence, motion } from 'framer-motion';

// Children
import Sidebar from '../Sidebar/Sidebar';
import Charts from 'Components/Charts/Charts';

function DataPage(props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // when this component mounts, open the sidebar
    setSidebarOpen(true);
  }, []);

  return (
    <DataPageStyled {...props}>
      <AnimateSharedLayout>
        <MotionDiv layout>
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                key="DataSidebar"
                initial={{ x: '-100%', duration: 750 }}
                animate={{ x: 0, duration: 750 }}
                exit={{ x: '-100%', duration: 750 }}
                transition={{ ease: 'easeIn' }}
              >
                <Sidebar open={sidebarOpen} setSidebarOpen={setSidebarOpen} />
              </motion.div>
            )}
          </AnimatePresence>

          <Charts />
        </MotionDiv>
      </AnimateSharedLayout>
    </DataPageStyled>
  );
}

export default DataPage;
