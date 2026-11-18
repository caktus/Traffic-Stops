import React, { useState, useEffect } from 'react';
import * as S from './AgencyData.styled';

// Animating
import { AnimatePresence, motion } from 'framer-motion';

// Routing
import { useLocation, useParams } from 'react-router-dom';

// State
import useDataset, { AGENCY_DETAILS } from '../../Hooks/useDataset';

// Children
import AgencyHeader from './AgencyHeader';
import Sidebar from '../Sidebar/Sidebar';
import ChartRoutes from '../Charts/ChartRoutes';
import { CompareAlertBox } from '../Elements/Alert/Alert';
import { YEARS_DEFAULT } from '../Charts/chartUtils';
import axios from '../../Services/Axios';
import useOfficerId from '../../Hooks/useOfficerId';
import MetaTags from '../Charts/ChartSections/MetaTags';

function AgencyData(props) {
  let { agencyId } = useParams();
  const officerId = useOfficerId();

  if (props.agencyId) {
    agencyId = props.agencyId;
  }

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [agencyHeaderOpen, setAgencyHeaderOpen] = useState(false);
  const [chartsOpen, setChartsOpen] = useState(false);
  const [chartState] = useDataset(agencyId, AGENCY_DETAILS);

  const { search } = useLocation();
  const [yearRange, setYearRange] = useState([YEARS_DEFAULT]);
  // Seeded from ?year= so links from the disparities page keep the selected year.
  const [year, setYear] = useState(
    () => Number(new URLSearchParams(search).get('year')) || YEARS_DEFAULT
  );
  const [yearIdx, setYearIdx] = useState(null);

  const _getEntityReference = () =>
    officerId ? `Officer ${officerId}` : chartState?.data[AGENCY_DETAILS]?.name;

  useEffect(() => {
    if (chartState.data[AGENCY_DETAILS]) setSidebarOpen(true);
  }, [chartState.data[AGENCY_DETAILS]]);

  useEffect(() => {
    if (chartState.data[AGENCY_DETAILS]) setAgencyHeaderOpen(true);
  }, [chartState.data[AGENCY_DETAILS]]);

  useEffect(() => {
    if (chartState.data[AGENCY_DETAILS]) setChartsOpen(true);
  }, [chartState.data[AGENCY_DETAILS]]);

  useEffect(() => {
    axios.get(`/api/agency/${agencyId}/year-range/`).then((res) => {
      const range = [YEARS_DEFAULT].concat(res.data.year_range);
      setYearRange(range);
      // yearIdx is the year's position in the picker options (used by the pie charts).
      if (year !== YEARS_DEFAULT) setYearIdx(range.indexOf(year));
    });
  }, [agencyId]);

  const handleYearSelect = (y, idx) => {
    if (y === year) return;
    setYear(y);
    setYearIdx(idx); // Used for some pie chart graphs
  };

  return (
    <S.AgencyData data-testid="AgencyData" {...props}>
      <MetaTags entityReference={_getEntityReference()} />
      {props.showCompare && !props.agencyId && <CompareAlertBox />}
      <AgencyHeader
        agencyHeaderOpen={agencyHeaderOpen}
        agencyDetails={chartState.data[AGENCY_DETAILS]}
        toggleShowCompare={props.toggleShowCompare}
        showCompareDepartments={props.showCompare}
        showCloseButton={!!props?.agencyId}
        yearRange={yearRange}
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
            yearRange={yearRange}
            year={year}
            yearIdx={yearIdx}
          />
        )}
      </S.ContentWrapper>
    </S.AgencyData>
  );
}

export default AgencyData;
