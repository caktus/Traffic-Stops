import React from 'react';
import { AboutChartsStyled } from './AboutCharts.styled';

// State
import { useChartState } from 'Context/chart-state';
import { AGENCY_DETAIL } from 'hooks/useDataset';

// Components
import SmallContentSkeleton from 'Components/Elements/Skeletons/SmallContentSkeleton'

function AboutCharts() {
  const [state] = useChartState();

  return (
    <AboutChartsStyled>
      {state.loading[AGENCY_DETAIL] && <SmallContentSkeleton />}
      {state.data[AGENCY_DETAIL] && 
        <>
          <h2>Agency Data for {state.data[AGENCY_DETAIL].name}</h2>
          <p>
            Here are some charts with statistics. This is a paragaph explaining how to use these charts.
          </p>
        </>
      }
    </AboutChartsStyled>
  );
}

export default AboutCharts;
