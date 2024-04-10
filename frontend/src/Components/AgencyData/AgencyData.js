import React, { useState, useEffect } from 'react';
import * as S from './AgencyData.styled';

// Animating
import { AnimatePresence, motion } from 'framer-motion';

// Routing
import { useParams } from 'react-router-dom';

// State
import useDataset, { AGENCY_DETAILS } from '../../Hooks/useDataset';

// Children
import AgencyHeader from './AgencyHeader';
import Sidebar from '../Sidebar/Sidebar';
import ChartRoutes from '../Charts/ChartRoutes';
import { CompareAlertBox } from '../Elements/Alert/Alert';
import { YEARS_DEFAULT } from '../Charts/chartUtils';

function AgencyData(props) {
  let { agencyId } = useParams();
  if (props.agencyId) {
    agencyId = props.agencyId;
  }

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [agencyHeaderOpen, setAgencyHeaderOpen] = useState(false);
  const [chartsOpen, setChartsOpen] = useState(false);
  const [chartState] = useDataset(agencyId, AGENCY_DETAILS);
  const [year, setYear] = useState(YEARS_DEFAULT);
  const [yearIdx, setYearIdx] = useState(null);

  useEffect(() => {
    if (chartState.data[AGENCY_DETAILS]) setSidebarOpen(true);
  }, [chartState.data[AGENCY_DETAILS]]);

  useEffect(() => {
    if (chartState.data[AGENCY_DETAILS]) setAgencyHeaderOpen(true);
  }, [chartState.data[AGENCY_DETAILS]]);

  useEffect(() => {
    if (chartState.data[AGENCY_DETAILS]) setChartsOpen(true);
  }, [chartState.data[AGENCY_DETAILS]]);

  const handleYearSelect = (y, idx) => {
    if (y === year) return;
    setYear(y);
    setYearIdx(idx); // Used for some pie chart graphs
  };

  return (
    <S.AgencyData data-testid="AgencyData" {...props}>
      {props.showCompare && !props.agencyId && <CompareAlertBox />}
      <AgencyHeader
        agencyHeaderOpen={agencyHeaderOpen}
        agencyDetails={chartState.data[AGENCY_DETAILS]}
        toggleShowCompare={props.toggleShowCompare}
        showCompareDepartments={props.showCompare}
        showCloseButton={!!props?.agencyId}
        year={year}
        handleYearSelect={handleYearSelect}
      />
      <S.ContentWrapper showCompare={props.showCompare}>
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              key="DataSidebar"
              initial={{ opacity: 0.35, x: '-100%', duration: 750 }}
              animate={{ opacity: 1, x: 0, duration: 750 }}
              exit={{ opacity: 0.35, x: '-100%', duration: 750 }}
              transition={{ ease: 'easeIn' }}
            >
              <Sidebar
                open={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
                showCompare={props.showCompare}
              />
            </motion.div>
          )}
        </AnimatePresence>
        {chartsOpen && (
          <ChartRoutes
            agencyId={agencyId}
            showCompare={props.showCompare}
            agencyName={chartState.data[AGENCY_DETAILS].name}
            year={year}
            yearIdx={yearIdx}
          />
        )}
      </S.ContentWrapper>
    </S.AgencyData>
  );
}

export default AgencyData;
